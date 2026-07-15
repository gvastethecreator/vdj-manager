//! VDJ database XML parser and serialiser using `quick-xml`.

use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, OnceLock};

use quick_xml::de::from_str;
use quick_xml::se::to_string;

use crate::safety;

use super::models::*;

/// Basic structural checks to catch obvious corruption before writing.
pub fn validate_database_integrity(db: &VdjDatabase) -> Result<(), String> {
    for (idx, song) in db.songs.iter().enumerate() {
        if song.file_path.trim().is_empty() {
            return Err(format!(
                "Entrada inválida en índice {}: FilePath vacío",
                idx
            ));
        }
    }

    Ok(())
}

/// Parse a VDJ database.xml file
pub fn parse_database(path: &Path) -> Result<VdjDatabase, String> {
    let content =
        fs::read_to_string(path).map_err(|e| format!("No se pudo leer el archivo: {}", e))?;

    // Remove BOM if present
    let content = content.trim_start_matches('\u{feff}');

    from_str::<VdjDatabase>(content)
        .map_err(|e| format!("Error al parsear la base de datos XML: {}", e))
}

/// Serialize and write the database back to XML
pub fn write_database(path: &Path, db: &VdjDatabase) -> Result<(), String> {
    let xml_header = r#"<?xml version="1.0" encoding="UTF-8"?>"#;
    let body = to_string(db).map_err(|e| format!("Error al serializar XML: {}", e))?;
    let output = format!("{}\n{}", xml_header, body);
    safety::atomic_write_string(path, &output)
}

/// Validate + write + reparse to ensure persisted XML remains healthy.
pub fn write_database_checked(path: &Path, db: &VdjDatabase) -> Result<(), String> {
    validate_database_integrity(db)?;
    write_database(path, db)?;
    let reparsed = parse_database(path)?;
    validate_database_integrity(&reparsed)
}

// ── Narrow patch-in-place writer ───────────────────────────────────────────

/// A byte range replacement against the original XML.  Applying replacements
/// from right to left lets us keep every byte outside the edited field intact.
#[derive(Debug)]
struct XmlEdit {
    start: usize,
    end: usize,
    replacement: String,
}

#[derive(Debug, Clone)]
struct XmlAttr {
    name: String,
    value_start: usize,
    value_end: usize,
}

#[derive(Debug, Clone)]
struct XmlTag {
    name: String,
    start: usize,
    end: usize,
    is_end: bool,
    is_self_closing: bool,
    parent_start: Option<usize>,
    matching_end: Option<usize>,
    attrs: Vec<XmlAttr>,
}

static DATABASE_PATCH_LOCKS: OnceLock<Mutex<HashMap<PathBuf, Arc<Mutex<()>>>>> = OnceLock::new();

fn database_patch_lock(path: &Path) -> Result<Arc<Mutex<()>>, String> {
    let key = fs::canonicalize(path).unwrap_or_else(|_| path.to_path_buf());
    let registry = DATABASE_PATCH_LOCKS.get_or_init(|| Mutex::new(HashMap::new()));
    let mut registry = registry
        .lock()
        .map_err(|_| "Registro de writers de database.xml bloqueado".to_string())?;
    Ok(registry
        .entry(key)
        .or_insert_with(|| Arc::new(Mutex::new(())))
        .clone())
}

fn is_xml_space(byte: u8) -> bool {
    matches!(byte, b' ' | b'\t' | b'\r' | b'\n')
}

fn find_bytes(source: &[u8], needle: &[u8], from: usize) -> Option<usize> {
    source
        .get(from..)?
        .windows(needle.len())
        .position(|window| window == needle)
        .map(|offset| from + offset)
}

/// Return the end of a markup construct, respecting quoted attribute values.
fn find_tag_end(source: &[u8], start: usize) -> Result<usize, String> {
    let mut quote = None;
    for index in start + 1..source.len() {
        match (quote, source[index]) {
            (Some(current), byte) if byte == current => quote = None,
            (None, b'"' | b'\'') => quote = Some(source[index]),
            (None, b'>') => return Ok(index + 1),
            _ => {}
        }
    }
    Err("XML truncado: no se encontró el cierre de una etiqueta".to_string())
}

fn find_declaration_end(source: &[u8], start: usize) -> Result<usize, String> {
    let mut quote = None;
    let mut subset_depth = 0usize;
    for index in start + 2..source.len() {
        let byte = source[index];
        match quote {
            Some(current) if byte == current => quote = None,
            Some(_) => {}
            None if matches!(byte, b'"' | b'\'') => quote = Some(byte),
            None if byte == b'[' => subset_depth += 1,
            None if byte == b']' => subset_depth = subset_depth.saturating_sub(1),
            None if byte == b'>' && subset_depth == 0 => return Ok(index + 1),
            _ => {}
        }
    }
    Err("XML truncado: declaración sin cierre".to_string())
}

fn find_markup_end(source: &[u8], start: usize) -> Result<usize, String> {
    if source.get(start + 1..start + 4) == Some(b"!--") {
        return find_bytes(source, b"-->", start + 4)
            .map(|index| index + 3)
            .ok_or_else(|| "XML truncado: comentario sin cierre".to_string());
    }
    if source.get(start + 1..start + 9) == Some(b"![CDATA[") {
        return find_bytes(source, b"]]>", start + 9)
            .map(|index| index + 3)
            .ok_or_else(|| "XML truncado: CDATA sin cierre".to_string());
    }
    if matches!(source.get(start + 1), Some(b'?')) {
        return find_bytes(source, b"?>", start + 2)
            .map(|index| index + 2)
            .ok_or_else(|| "XML truncado: instrucción sin cierre".to_string());
    }
    if matches!(source.get(start + 1), Some(b'!')) {
        return find_declaration_end(source, start);
    }
    find_tag_end(source, start)
}

/// Parse one normal XML element tag. Comments, CDATA, declarations and
/// processing instructions are returned as `None` and skipped by the scanner.
fn parse_xml_tag(source: &[u8], start: usize) -> Result<Option<XmlTag>, String> {
    if source.get(start) != Some(&b'<') {
        return Err("Posición XML inválida".to_string());
    }

    if source.get(start + 1..start + 4) == Some(b"!--") {
        let _end = find_bytes(source, b"-->", start + 4)
            .map(|index| index + 3)
            .ok_or_else(|| "XML truncado: comentario sin cierre".to_string())?;
        return Ok(None);
    }
    if source.get(start + 1..start + 9) == Some(b"![CDATA[") {
        let _end = find_bytes(source, b"]]>", start + 9)
            .map(|index| index + 3)
            .ok_or_else(|| "XML truncado: CDATA sin cierre".to_string())?;
        return Ok(None);
    }
    if matches!(source.get(start + 1), Some(b'?')) {
        let _end = find_bytes(source, b"?>", start + 2)
            .map(|index| index + 2)
            .ok_or_else(|| "XML truncado: instrucción sin cierre".to_string())?;
        return Ok(None);
    }
    if matches!(source.get(start + 1), Some(b'!')) {
        return Ok(None);
    }

    let end = find_tag_end(source, start)?;
    let mut cursor = start + 1;
    let is_end = source.get(cursor) == Some(&b'/');
    if is_end {
        cursor += 1;
    }
    while source.get(cursor).is_some_and(|byte| is_xml_space(*byte)) {
        cursor += 1;
    }
    let name_start = cursor;
    while let Some(byte) = source.get(cursor) {
        if is_xml_space(*byte) || matches!(byte, b'/' | b'>') {
            break;
        }
        cursor += 1;
    }
    if cursor == name_start {
        return Err(format!("Etiqueta XML sin nombre en byte {}", start));
    }
    let name = std::str::from_utf8(&source[name_start..cursor])
        .map_err(|_| "Nombre de etiqueta XML no UTF-8".to_string())?
        .to_string();

    if is_end {
        return Ok(Some(XmlTag {
            name,
            start,
            end,
            is_end: true,
            is_self_closing: false,
            parent_start: None,
            matching_end: None,
            attrs: Vec::new(),
        }));
    }

    let mut attrs = Vec::new();
    let mut attr_cursor = cursor;
    let content_end = end - 1;
    while attr_cursor < content_end {
        while attr_cursor < content_end
            && (is_xml_space(source[attr_cursor]) || source[attr_cursor] == b'/')
        {
            attr_cursor += 1;
        }
        if attr_cursor >= content_end {
            break;
        }
        let attr_name_start = attr_cursor;
        while attr_cursor < content_end
            && !is_xml_space(source[attr_cursor])
            && !matches!(source[attr_cursor], b'=' | b'/' | b'>')
        {
            attr_cursor += 1;
        }
        if attr_cursor == attr_name_start {
            return Err(format!("Atributo XML inválido en byte {}", attr_cursor));
        }
        let attr_name = std::str::from_utf8(&source[attr_name_start..attr_cursor])
            .map_err(|_| "Nombre de atributo XML no UTF-8".to_string())?
            .to_string();
        while attr_cursor < content_end && is_xml_space(source[attr_cursor]) {
            attr_cursor += 1;
        }
        if source.get(attr_cursor) != Some(&b'=') {
            return Err(format!("Atributo XML sin '=' en byte {}", attr_cursor));
        }
        attr_cursor += 1;
        while attr_cursor < content_end && is_xml_space(source[attr_cursor]) {
            attr_cursor += 1;
        }
        let quote = *source
            .get(attr_cursor)
            .ok_or_else(|| "Atributo XML sin comillas".to_string())?;
        if !matches!(quote, b'"' | b'\'') {
            return Err(format!("Atributo XML sin comillas en byte {}", attr_cursor));
        }
        attr_cursor += 1;
        let value_start = attr_cursor;
        while attr_cursor < content_end && source[attr_cursor] != quote {
            attr_cursor += 1;
        }
        if attr_cursor >= content_end {
            return Err(format!("Atributo XML sin cierre en byte {}", value_start));
        }
        attrs.push(XmlAttr {
            name: attr_name,
            value_start,
            value_end: attr_cursor,
        });
        attr_cursor += 1;
    }

    let mut close_cursor = end - 1;
    while close_cursor > start && is_xml_space(source[close_cursor - 1]) {
        close_cursor -= 1;
    }
    let is_self_closing = close_cursor > start && source[close_cursor - 1] == b'/';

    Ok(Some(XmlTag {
        name,
        start,
        end,
        is_end: false,
        is_self_closing,
        parent_start: None,
        matching_end: None,
        attrs,
    }))
}

fn scan_xml_tags(source: &[u8]) -> Result<Vec<XmlTag>, String> {
    let mut tags: Vec<XmlTag> = Vec::new();
    let mut stack: Vec<usize> = Vec::new();
    let mut cursor = 0;
    while cursor < source.len() {
        if source[cursor] != b'<' {
            cursor += 1;
            continue;
        }
        let markup_end = find_markup_end(source, cursor)?;
        let parsed = parse_xml_tag(source, cursor)?;
        cursor = markup_end;
        let Some(mut tag) = parsed else { continue };

        if tag.is_end {
            let open_index = stack
                .pop()
                .ok_or_else(|| format!("Cierre XML inesperado para </{}>", tag.name))?;
            if tags[open_index].name != tag.name {
                return Err(format!(
                    "Estructura XML inválida: se esperaba </{}> y llegó </{}>",
                    tags[open_index].name, tag.name
                ));
            }
            let end_index = tags.len();
            tags.push(tag);
            tags[open_index].matching_end = Some(end_index);
        } else {
            tag.parent_start = stack.last().map(|index| tags[*index].start);
            let tag_index = tags.len();
            let is_self_closing = tag.is_self_closing;
            tags.push(tag);
            if !is_self_closing {
                stack.push(tag_index);
            }
        }
    }
    if let Some(open_index) = stack.last() {
        return Err(format!(
            "Etiqueta XML sin cierre: <{}>",
            tags[*open_index].name
        ));
    }
    Ok(tags)
}

fn decode_xml_value(source: &[u8], start: usize, end: usize) -> Result<String, String> {
    let raw = std::str::from_utf8(&source[start..end])
        .map_err(|_| "Valor XML no UTF-8".to_string())?;
    quick_xml::escape::unescape(raw)
        .map(|value| value.into_owned())
        .map_err(|error| format!("Valor XML inválido: {}", error))
}

/// Normalize separators and insignificant trailing separators for Windows
/// matching.  Comparison is case-insensitive because NTFS paths are so too.
pub fn normalize_windows_path(path: &str) -> String {
    let trimmed = path.trim();
    let is_unc = trimmed.starts_with('\\') || trimmed.starts_with('/');
    let mut normalized = String::with_capacity(trimmed.len());
    let mut previous_was_separator = false;
    for character in trimmed.chars() {
        let character = if character == '/' { '\\' } else { character };
        if character == '\\' {
            // UNC roots require two leading separators.  Once the prefix is
            // complete, collapse accidental duplicate separators as usual.
            if is_unc && normalized.len() < 2 {
                normalized.push(character);
                previous_was_separator = true;
                continue;
            }
            if previous_was_separator {
                continue;
            }
            previous_was_separator = true;
        } else {
            previous_was_separator = false;
        }
        normalized.push(character);
    }
    let is_drive_root = normalized.len() == 3
        && normalized.as_bytes().get(1) == Some(&b':')
        && normalized.ends_with('\\');
    let is_unc_root = normalized == "\\\\";
    while normalized.ends_with('\\') && normalized.len() > 1 && !is_drive_root && !is_unc_root {
        normalized.pop();
    }
    normalized
}

pub fn windows_paths_equal(left: &str, right: &str) -> bool {
    normalize_windows_path(left).to_lowercase() == normalize_windows_path(right).to_lowercase()
}

fn attr<'a>(tag: &'a XmlTag, name: &str) -> Result<Option<&'a XmlAttr>, String> {
    let matches: Vec<&XmlAttr> = tag.attrs.iter().filter(|item| item.name == name).collect();
    if matches.len() > 1 {
        return Err(format!("Atributo XML duplicado: {}", name));
    }
    Ok(matches.into_iter().next())
}

fn child_tags<'a>(tags: &'a [XmlTag], song: &XmlTag, name: &str) -> Vec<(usize, &'a XmlTag)> {
    tags.iter()
        .enumerate()
        .filter(|(_, tag)| {
            !tag.is_end && tag.name == name && tag.parent_start == Some(song.start)
        })
        .collect()
}

fn escaped_attribute(value: &str) -> String {
    quick_xml::escape::escape(value).into_owned()
}

fn escaped_text(value: &str) -> String {
    quick_xml::escape::partial_escape(value).into_owned()
}

fn plan_attribute_updates(
    source: &[u8],
    tag: &XmlTag,
    updates: &[(&str, &Option<String>)],
    edits: &mut Vec<XmlEdit>,
) -> Result<(), String> {
    let mut missing = Vec::new();
    for (name, value) in updates {
        let Some(value) = value else { continue };
        if let Some(existing) = attr(tag, name)? {
            edits.push(XmlEdit {
                start: existing.value_start,
                end: existing.value_end,
                replacement: escaped_attribute(value),
            });
        } else {
            missing.push((*name, escaped_attribute(value)));
        }
    }

    if !missing.is_empty() {
        let mut insertion = String::new();
        for (name, value) in missing {
            insertion.push(' ');
            insertion.push_str(name);
            insertion.push_str("=\"");
            insertion.push_str(&value);
            insertion.push('"');
        }
        let mut insertion_at = tag.end - 1;
        if tag.is_self_closing {
            while insertion_at > tag.start && is_xml_space(source[insertion_at - 1]) {
                insertion_at -= 1;
            }
            if insertion_at > tag.start && source[insertion_at - 1] == b'/' {
                insertion_at -= 1;
            }
        }
        edits.push(XmlEdit {
            start: insertion_at,
            end: insertion_at,
            replacement: insertion,
        });
    }
    Ok(())
}

fn missing_element(name: &str, attrs: &[(&str, &Option<String>)]) -> String {
    let mut output = format!("<{}", name);
    for (attr_name, value) in attrs {
        if let Some(value) = value {
            output.push(' ');
            output.push_str(attr_name);
            output.push_str("=\"");
            output.push_str(&escaped_attribute(value));
            output.push('"');
        }
    }
    output.push_str("/>");
    output
}

/// Patch one `<Song>` in the original XML and atomically persist it.
///
/// This deliberately does not call `write_database_checked`: that serializer
/// is useful for legacy batch saves but cannot preserve unknown VirtualDJ XML.
pub fn patch_song_in_place(
    path: &Path,
    original_file_path: &str,
    update: &InlineSongUpdate,
) -> Result<UpdateSongTagsResult, String> {
    patch_song_in_place_with_before_commit(path, original_file_path, update, || Ok(()))
}

fn patch_song_in_place_with_before_commit<F>(
    path: &Path,
    original_file_path: &str,
    update: &InlineSongUpdate,
    before_commit: F,
) -> Result<UpdateSongTagsResult, String>
where
    F: FnOnce() -> Result<(), String>,
{
    let updated_fields = update.updated_fields();
    let empty_result = |status| UpdateSongTagsResult {
        status,
        original_file_path: original_file_path.to_string(),
        current_file_path: String::new(),
        updated_fields: updated_fields.clone(),
    };
    if original_file_path.trim().is_empty() || updated_fields.is_empty() {
        return Ok(empty_result(UpdateSongTagsStatus::FailedValidation));
    }
    let patch_lock = database_patch_lock(path)?;
    let _patch_guard = patch_lock
        .lock()
        .map_err(|_| "Writer de database.xml bloqueado".to_string())?;
    let source = fs::read(path).map_err(|error| format!("No se pudo leer database.xml: {}", error))?;
    let tags = scan_xml_tags(&source).map_err(|error| format!("unsafe_to_patch: {}", error))?;

    let database_roots: Vec<&XmlTag> = tags
        .iter()
        .filter(|tag| {
            !tag.is_end && tag.name == "VirtualDJ_Database" && tag.parent_start.is_none()
        })
        .collect();
    if database_roots.len() != 1 {
        return Ok(empty_result(UpdateSongTagsStatus::UnsafeToPatch));
    }
    let database_root_start = database_roots[0].start;

    let mut matching_songs = Vec::new();
    for (index, tag) in tags.iter().enumerate() {
        if tag.is_end
            || tag.name != "Song"
            || tag.parent_start != Some(database_root_start)
        {
            continue;
        }
        let Some(file_attr) = attr(tag, "FilePath")? else { continue };
        let file_path = decode_xml_value(&source, file_attr.value_start, file_attr.value_end)?;
        if windows_paths_equal(&file_path, original_file_path) {
            matching_songs.push((index, file_path));
        }
    }
    if matching_songs.is_empty() {
        return Ok(empty_result(UpdateSongTagsStatus::NotFound));
    }
    if matching_songs.len() != 1 {
        return Ok(UpdateSongTagsResult {
            status: UpdateSongTagsStatus::UnsafeToPatch,
            original_file_path: original_file_path.to_string(),
            current_file_path: matching_songs[0].1.clone(),
            updated_fields,
        });
    }
    let (song_index, current_file_path) = matching_songs.remove(0);
    let song = &tags[song_index];
    let Some(song_end_index) = song.matching_end else {
        return Ok(UpdateSongTagsResult {
            status: UpdateSongTagsStatus::UnsafeToPatch,
            original_file_path: original_file_path.to_string(),
            current_file_path,
            updated_fields,
        });
    };
    let song_end = &tags[song_end_index];
    let mut edits = Vec::new();
    let mut insertions = String::new();

    let tag_updates: [(&str, &Option<String>); 16] = [
        ("Author", &update.author),
        ("Title", &update.title),
        ("Album", &update.album),
        ("Genre", &update.genre),
        ("Year", &update.year),
        ("Key", &update.key),
        ("Bpm", &update.bpm),
        ("Grouping", &update.grouping),
        ("Label", &update.label),
        ("Remix", &update.remix),
        ("Remixer", &update.remixer),
        ("Composer", &update.composer),
        ("TrackNumber", &update.track_number),
        ("Stars", &update.stars),
        ("User1", &update.user1),
        ("User2", &update.user2),
    ];
    if tag_updates.iter().any(|(_, value)| value.is_some()) {
        let tags_children = child_tags(&tags, song, "Tags");
        if tags_children.len() > 1 {
            return Ok(UpdateSongTagsResult {
                status: UpdateSongTagsStatus::UnsafeToPatch,
                original_file_path: original_file_path.to_string(),
                current_file_path,
                updated_fields,
            });
        }
        if let Some((_, tags_tag)) = tags_children.first() {
            plan_attribute_updates(&source, tags_tag, &tag_updates, &mut edits)?;
        } else {
            insertions.push_str(&missing_element("Tags", &tag_updates));
        }
    }

    let info_updates: [(&str, &Option<String>); 2] = [
        ("Color", &update.color),
        ("Gain", &update.gain),
    ];
    if info_updates.iter().any(|(_, value)| value.is_some()) {
        let infos_children = child_tags(&tags, song, "Infos");
        if infos_children.len() > 1 {
            return Ok(UpdateSongTagsResult {
                status: UpdateSongTagsStatus::UnsafeToPatch,
                original_file_path: original_file_path.to_string(),
                current_file_path,
                updated_fields,
            });
        }
        if let Some((_, infos_tag)) = infos_children.first() {
            plan_attribute_updates(&source, infos_tag, &info_updates, &mut edits)?;
        } else {
            insertions.push_str(&missing_element("Infos", &info_updates));
        }
    }

    if let Some(comment) = &update.comment_text {
        let comments = child_tags(&tags, song, "Comment");
        if comments.len() > 1 {
            return Ok(UpdateSongTagsResult {
                status: UpdateSongTagsStatus::UnsafeToPatch,
                original_file_path: original_file_path.to_string(),
                current_file_path,
                updated_fields,
            });
        }
        if let Some((comment_index, comment_tag)) = comments.first() {
            if comment_tag.is_self_closing {
                let mut close_at = comment_tag.end - 1;
                while close_at > comment_tag.start && is_xml_space(source[close_at - 1]) {
                    close_at -= 1;
                }
                if close_at <= comment_tag.start || source[close_at - 1] != b'/' {
                    return Ok(UpdateSongTagsResult {
                        status: UpdateSongTagsStatus::UnsafeToPatch,
                        original_file_path: original_file_path.to_string(),
                        current_file_path,
                        updated_fields,
                    });
                }
                let slash_at = close_at - 1;
                let prefix = std::str::from_utf8(&source[comment_tag.start..slash_at])
                    .map_err(|_| "Comment XML no UTF-8".to_string())?;
                edits.push(XmlEdit {
                    start: comment_tag.start,
                    end: comment_tag.end,
                    replacement: format!("{}>{}</Comment>", prefix, escaped_text(comment)),
                });
            } else {
                let Some(comment_end_index) = tags[*comment_index].matching_end else {
                    return Ok(UpdateSongTagsResult {
                        status: UpdateSongTagsStatus::UnsafeToPatch,
                        original_file_path: original_file_path.to_string(),
                        current_file_path,
                        updated_fields,
                    });
                };
                let comment_end = &tags[comment_end_index];
                let inner = &source[comment_tag.end..comment_end.start];
                if inner.contains(&b'<') {
                    return Ok(UpdateSongTagsResult {
                        status: UpdateSongTagsStatus::UnsafeToPatch,
                        original_file_path: original_file_path.to_string(),
                        current_file_path,
                        updated_fields,
                    });
                }
                edits.push(XmlEdit {
                    start: comment_tag.end,
                    end: comment_end.start,
                    replacement: escaped_text(comment),
                });
            }
        } else {
            insertions.push_str(&format!("<Comment>{}</Comment>", escaped_text(comment)));
        }
    }

    if !insertions.is_empty() {
        edits.push(XmlEdit {
            start: song_end.start,
            end: song_end.start,
            replacement: insertions,
        });
    }

    edits.sort_by(|left, right| right.start.cmp(&left.start).then_with(|| right.end.cmp(&left.end)));
    let mut patched = source.clone();
    for edit in edits {
        patched.splice(edit.start..edit.end, edit.replacement.into_bytes());
    }
    let patched = String::from_utf8(patched)
        .map_err(|_| "El parche produciría XML no UTF-8".to_string())?;
    let candidate = patched.trim_start_matches('\u{feff}');
    let reparsed = from_str::<VdjDatabase>(candidate)
        .map_err(|error| format!("unsafe_to_patch: XML resultante inválido: {}", error))?;
    validate_database_integrity(&reparsed)
        .map_err(|error| format!("unsafe_to_patch: {}", error))?;

    before_commit()?;
    let current_source = fs::read(path)
        .map_err(|error| format!("No se pudo releer database.xml antes del commit: {}", error))?;
    if current_source != source {
        return Ok(UpdateSongTagsResult {
            status: UpdateSongTagsStatus::UnsafeToPatch,
            original_file_path: original_file_path.to_string(),
            current_file_path,
            updated_fields,
        });
    }

    safety::create_timestamped_backup(path, "database-inline")?;
    safety::atomic_write_string(path, &patched)?;
    Ok(UpdateSongTagsResult {
        status: UpdateSongTagsStatus::Completed,
        original_file_path: original_file_path.to_string(),
        current_file_path,
        updated_fields,
    })
}

/// Compute aggregate statistics from the database
pub fn compute_stats(db: &VdjDatabase) -> DatabaseStats {
    let mut genres: HashMap<String, usize> = HashMap::new();
    let mut artists: HashMap<String, usize> = HashMap::new();
    let mut years: HashMap<String, usize> = HashMap::new();
    let mut bpm_sum = 0.0_f64;
    let mut bpm_count = 0usize;
    let mut songs_with_cues = 0usize;
    let mut songs_with_tags = 0usize;
    let mut total_size: u64 = 0;

    for song in &db.songs {
        if let Some(sz) = song.file_size {
            total_size += sz;
        }

        if let Some(tags) = &song.tags {
            songs_with_tags += 1;
            if let Some(g) = &tags.genre {
                if !g.is_empty() {
                    *genres.entry(g.clone()).or_insert(0) += 1;
                }
            }
            if let Some(a) = &tags.author {
                if !a.is_empty() {
                    *artists.entry(a.clone()).or_insert(0) += 1;
                }
            }
            if let Some(y) = &tags.year {
                if !y.is_empty() {
                    *years.entry(y.clone()).or_insert(0) += 1;
                }
            }
        }

        if let Some(scan) = &song.scan {
            if let Some(bpm_str) = &scan.bpm {
                if let Ok(v) = bpm_str.parse::<f64>() {
                    if v > 0.0 {
                        bpm_sum += 60.0 / v;
                        bpm_count += 1;
                    }
                }
            }
        }

        if !song.pois.is_empty() {
            songs_with_cues += 1;
        }
    }

    let mut genres_vec: Vec<(String, usize)> = genres.into_iter().collect();
    genres_vec.sort_by(|a, b| b.1.cmp(&a.1));

    let mut artists_vec: Vec<(String, usize)> = artists.into_iter().collect();
    artists_vec.sort_by(|a, b| b.1.cmp(&a.1));

    let mut years_vec: Vec<(String, usize)> = years.into_iter().collect();
    years_vec.sort_by(|a, b| a.0.cmp(&b.0));

    DatabaseStats {
        total_songs: db.songs.len(),
        total_size_bytes: total_size,
        genres: genres_vec,
        artists: artists_vec,
        years: years_vec,
        avg_bpm: if bpm_count > 0 {
            Some(bpm_sum / bpm_count as f64)
        } else {
            None
        },
        songs_with_cues,
        songs_with_tags,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn database_patch_aborts_if_source_changes_before_commit() {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("time should advance")
            .as_nanos();
        let dir = std::env::temp_dir().join(format!(
            "vdj-manager-optimistic-check-{}-{nonce}",
            std::process::id()
        ));
        fs::create_dir_all(&dir).expect("temp dir should exist");
        let db_path = dir.join("database.xml");
        let original = r#"<VirtualDJ_Database><Song FilePath="D:\Music\Target.mp3"><Tags Title="old"/></Song></VirtualDJ_Database>"#;
        let external = r#"<VirtualDJ_Database><Song FilePath="D:\Music\Target.mp3"><Tags Title="external"/></Song></VirtualDJ_Database>"#;
        fs::write(&db_path, original).expect("fixture should write");

        let result = patch_song_in_place_with_before_commit(
            &db_path,
            r"D:\Music\Target.mp3",
            &InlineSongUpdate {
                title: Some("internal".to_string()),
                ..InlineSongUpdate::default()
            },
            || fs::write(&db_path, external).map_err(|error| error.to_string()),
        )
        .expect("optimistic conflict should be typed");

        assert!(matches!(result.status, UpdateSongTagsStatus::UnsafeToPatch));
        assert_eq!(fs::read_to_string(&db_path).expect("DB should remain"), external);
        let backups = fs::read_dir(&dir)
            .expect("temp dir should list")
            .filter_map(Result::ok)
            .filter(|entry| entry.file_name().to_string_lossy().ends_with(".bak"))
            .count();
        assert_eq!(backups, 0, "conflict must abort before backup/write");

        fs::remove_dir_all(&dir).expect("temp dir should be removed");
    }
}
