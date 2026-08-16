//! Tauri commands for reading and editing VirtualDJ configuration files.

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use xmltree::{Element, XMLNode};

use crate::safety;

#[derive(Debug, Serialize, Clone)]
pub struct VdjConfigFileInfo {
    pub name: String,
    pub path: String,
    pub relative_path: String,
    pub size_bytes: u64,
}

#[derive(Debug, Serialize, Clone)]
pub struct VdjSettingEntry {
    pub key: String,
    pub label: String,
    pub description: String,
    pub category: String,
    pub value: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VdjMapperBinding {
    pub value: String,
    pub action: String,
    pub other_attributes: std::collections::HashMap<String, String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VdjMapperDocument {
    pub device: String,
    pub author: Option<String>,
    pub version: Option<String>,
    pub date: Option<String>,
    pub priority: Option<String>,
    pub info: Option<String>,
    pub other_attributes: std::collections::HashMap<String, String>,
    pub mappings: Vec<VdjMapperBinding>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VdjXmlNode {
    pub name: String,
    pub attributes: std::collections::HashMap<String, String>,
    pub text: Option<String>,
    pub children: Vec<VdjXmlNode>,
}

struct SettingMeta {
    key: &'static str,
    label: &'static str,
    description: &'static str,
    category: &'static str,
}

const CURATED_SETTINGS: &[SettingMeta] = &[
    SettingMeta {
        key: "watchFolders",
        label: "Watch folders",
        description: "Folders that VirtualDJ scans automatically at startup.",
        category: "Library",
    },
    SettingMeta {
        key: "rootFoldersLocation",
        label: "Root folders location",
        description: "Roots shown in the VirtualDJ browser tree.",
        category: "Library",
    },
    SettingMeta {
        key: "folderSearchAdditionalListFolders",
        label: "Additional list folders",
        description: "Additional folders used when searching for lists, based on the official documentation.",
        category: "Library",
    },
    SettingMeta {
        key: "autoSearchDB",
        label: "Auto-search DB",
        description: "Automatically add songs found while browsing folders or drives.",
        category: "Library",
    },
    SettingMeta {
        key: "showM3UAsFolders",
        label: "Show M3U as folders",
        description: "Show .m3u playlists as subfolders when they are inside a folder.",
        category: "Playlists",
    },
    SettingMeta {
        key: "browserAutoExportM3U",
        label: "Export lists to M3U",
        description: "Automatically save an .m3u copy of MyLists lists.",
        category: "Playlists",
    },
    SettingMeta {
        key: "browserShowLegacyM3UPlaylists",
        label: "Show legacy M3U playlists",
        description: "Keep legacy M3U playlists visible to external tools.",
        category: "Playlists",
    },
    SettingMeta {
        key: "coloredWaveforms",
        label: "Colored waveforms",
        description: "Waveform color scheme for identifying beats, vocals, and instrumentals.",
        category: "Waveforms",
    },
    SettingMeta {
        key: "skinWaveformType",
        label: "Main waveform",
        description: "Main waveform type in supported skins.",
        category: "Waveforms",
    },
    SettingMeta {
        key: "skinOverviewType",
        label: "Waveform overview",
        description: "Waveform type for the deck overview.",
        category: "Waveforms",
    },
    SettingMeta {
        key: "skinWaveformScratchType",
        label: "Waveform scratch",
        description: "Waveform type for vertical scratching.",
        category: "Waveforms",
    },
    SettingMeta {
        key: "waveUseFrequency",
        label: "Use frequencies for colors",
        description: "Use frequencies instead of stems to color the waveform.",
        category: "Waveforms",
    },
    SettingMeta {
        key: "waveGrayOnKill",
        label: "Gray removed stems",
        description: "Show removed sections in gray on the shape waveform.",
        category: "Waveforms",
    },
    SettingMeta {
        key: "skinPlayheadShadow",
        label: "Playhead shadow",
        description: "Show a shadow on the main song-position waveform marker.",
        category: "Waveforms",
    },
    SettingMeta {
        key: "showGridLines",
        label: "Show grid lines",
        description: "Show grid lines on scratch and rhythm waveforms.",
        category: "Waveforms",
    },
    SettingMeta {
        key: "showBpmChangesAbove",
        label: "BPM change markers",
        description: "Waveform markers for BPM changes in fluid grids.",
        category: "Waveforms",
    },
    SettingMeta {
        key: "autoSortCues",
        label: "Sort cues automatically",
        description: "Sort cue points chronologically.",
        category: "Cue points",
    },
    SettingMeta {
        key: "quantizeSetCue",
        label: "Quantize new cues",
        description: "Snap cue positions to the quantized grid.",
        category: "Cue points",
    },
    SettingMeta {
        key: "getCuesFromTags",
        label: "Read cues from tags",
        description: "Attempt to read cues from file tags.",
        category: "Cue points",
    },
    SettingMeta {
        key: "automaticDatabaseBackupPeriod",
        label: "Database backup interval",
        description: "Days between automatic database backups.",
        category: "Safety",
    },
    SettingMeta {
        key: "databaseBackupLocation",
        label: "Database backup folder",
        description: "Location where VirtualDJ stores automatic database backups.",
        category: "Safety",
    },
    SettingMeta {
        key: "analyzeSongsOnView",
        label: "Analyze songs on view",
        description: "Automatically analyze unscanned songs while browsing them.",
        category: "Performance",
    },
    SettingMeta {
        key: "songLoadPriority",
        label: "Load priority",
        description: "Lower song-loading priority to prevent dropouts.",
        category: "Performance",
    },
    SettingMeta {
        key: "skinFPS",
        label: "Skin FPS",
        description: "Visual refresh rate of the skin.",
        category: "Performance",
    },
];

const ALLOWED_EXTENSIONS: [&str; 11] = [
    "xml", "ini", "cfg", "json", "txt", "vdjmap", "vdjpad", "m3u", "m3u8", "vdjlist", "vdjplaylist",
];

fn settings_xml_path(vdj_folder: &str) -> PathBuf {
    PathBuf::from(vdj_folder).join("settings.xml")
}

fn parse_xml_root(path: &Path) -> Result<Element, String> {
    let file = std::fs::File::open(path)
        .map_err(|e| format!("settings.xml could not be opened: {}", e))?;
    Element::parse(file).map_err(|e| format!("settings.xml could not be parsed: {}", e))
}

fn parse_mapper_root(path: &Path) -> Result<Element, String> {
    let root = parse_xml_root(path)?;
    if root.name != "mapper" {
        return Err("The file does not have a valid <mapper> root node".to_string());
    }
    Ok(root)
}

fn parse_pad_root(path: &Path) -> Result<Element, String> {
    parse_xml_root(path)
}

fn get_element_text(element: &Element) -> Option<String> {
    let text = element.get_text()?;
    let normalized = text.trim().to_string();
    if normalized.is_empty() {
        None
    } else {
        Some(normalized)
    }
}

fn find_setting_value(element: &Element, key: &str) -> Option<String> {
    if element.attributes.get("name").is_some_and(|name| name == key) {
        if let Some(value) = element.attributes.get("value") {
            return Some(value.clone());
        }
        if let Some(text) = get_element_text(element) {
            return Some(text);
        }
    }

    if element.name == key {
        if let Some(value) = element.attributes.get("value") {
            return Some(value.clone());
        }
        if let Some(text) = get_element_text(element) {
            return Some(text);
        }
    }

    for child in &element.children {
        if let XMLNode::Element(child_el) = child {
            if let Some(value) = find_setting_value(child_el, key) {
                return Some(value);
            }
        }
    }

    None
}

fn update_setting_value(element: &mut Element, key: &str, value: &str) -> bool {
    if element.attributes.get("name").is_some_and(|name| name == key) {
        if element.attributes.contains_key("value") {
            element.attributes.insert("value".to_string(), value.to_string());
            return true;
        }

        element.children.retain(|child| !matches!(child, XMLNode::Text(_)));
        element.children.push(XMLNode::Text(value.to_string()));
        return true;
    }

    if element.name == key {
        if element.attributes.contains_key("value") {
            element.attributes.insert("value".to_string(), value.to_string());
            return true;
        }

        element.children.retain(|child| !matches!(child, XMLNode::Text(_)));
        element.children.push(XMLNode::Text(value.to_string()));
        return true;
    }

    for child in &mut element.children {
        if let XMLNode::Element(child_el) = child {
            if update_setting_value(child_el, key, value) {
                return true;
            }
        }
    }

    false
}

fn normalize_path_for_cmp(path: &Path) -> String {
    path.to_string_lossy().to_lowercase()
}

fn create_backup_path(target: &Path, fallback_ext: &str) -> Result<String, String> {
    let label = target
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or(fallback_ext);
    safety::create_timestamped_backup(target, label)
        .map(|backup| backup.map(|path| path.to_string_lossy().to_string()).unwrap_or_default())
}

fn mapper_document_from_root(root: &Element) -> VdjMapperDocument {
    let mut other_attributes = root.attributes.clone();
    let device = other_attributes.remove("device").unwrap_or_default();
    let author = other_attributes.remove("author");
    let version = other_attributes.remove("version");
    let date = other_attributes.remove("date");
    let priority = other_attributes.remove("priority");

    let mut info = None;
    let mut mappings = Vec::new();

    for child in &root.children {
        let XMLNode::Element(child_el) = child else {
            continue;
        };

        match child_el.name.as_str() {
            "info" => {
                info = get_element_text(child_el);
            }
            "map" => {
                let mut attrs = child_el.attributes.clone();
                let value = attrs.remove("value").unwrap_or_default();
                let action = attrs.remove("action").unwrap_or_default();
                mappings.push(VdjMapperBinding {
                    value,
                    action,
                    other_attributes: attrs,
                });
            }
            _ => {}
        }
    }

    VdjMapperDocument {
        device,
        author,
        version,
        date,
        priority,
        info,
        other_attributes,
        mappings,
    }
}

fn mapper_root_from_document(document: &VdjMapperDocument) -> Element {
    let mut root = Element::new("mapper");
    root.attributes = document.other_attributes.clone();
    root.attributes.insert("device".to_string(), document.device.clone());

    if let Some(author) = &document.author {
        if !author.trim().is_empty() {
            root.attributes.insert("author".to_string(), author.clone());
        }
    }
    if let Some(version) = &document.version {
        if !version.trim().is_empty() {
            root.attributes.insert("version".to_string(), version.clone());
        }
    }
    if let Some(date) = &document.date {
        if !date.trim().is_empty() {
            root.attributes.insert("date".to_string(), date.clone());
        }
    }
    if let Some(priority) = &document.priority {
        if !priority.trim().is_empty() {
            root.attributes.insert("priority".to_string(), priority.clone());
        }
    }

    if let Some(info) = &document.info {
        if !info.trim().is_empty() {
            let mut info_el = Element::new("info");
            info_el.children.push(XMLNode::Text(info.clone()));
            root.children.push(XMLNode::Element(info_el));
        }
    }

    for binding in &document.mappings {
        let mut map_el = Element::new("map");
        map_el.attributes = binding.other_attributes.clone();
        map_el.attributes.insert("value".to_string(), binding.value.clone());
        map_el.attributes.insert("action".to_string(), binding.action.clone());
        root.children.push(XMLNode::Element(map_el));
    }

    root
}

fn xml_node_from_element(element: &Element) -> VdjXmlNode {
    let children = element
        .children
        .iter()
        .filter_map(|child| {
            let XMLNode::Element(child_el) = child else {
                return None;
            };
            Some(xml_node_from_element(child_el))
        })
        .collect();

    VdjXmlNode {
        name: element.name.clone(),
        attributes: element.attributes.clone(),
        text: get_element_text(element),
        children,
    }
}

fn element_from_xml_node(node: &VdjXmlNode) -> Result<Element, String> {
    if node.name.trim().is_empty() {
        return Err("Every XML node must have a name".to_string());
    }

    let mut element = Element::new(&node.name);
    element.attributes = node.attributes.clone();

    if let Some(text) = &node.text {
        if !text.trim().is_empty() {
            element.children.push(XMLNode::Text(text.clone()));
        }
    }

    for child in &node.children {
        element.children.push(XMLNode::Element(element_from_xml_node(child)?));
    }

    Ok(element)
}

fn ensure_inside_vdj_root(vdj_root: &Path, target: &Path) -> Result<(), String> {
    let root = vdj_root
        .canonicalize()
        .map_err(|e| format!("The VirtualDJ folder could not be resolved: {}", e))?;

    let target_canonical = if target.exists() {
        target
            .canonicalize()
            .map_err(|e| format!("The target path could not be resolved: {}", e))?
    } else {
        let parent = target
            .parent()
            .ok_or("Invalid target path")?
            .canonicalize()
            .map_err(|e| format!("The target parent folder could not be resolved: {}", e))?;
        parent.join(target.file_name().unwrap_or_default())
    };

    let root_cmp = normalize_path_for_cmp(&root);
    let target_cmp = normalize_path_for_cmp(&target_canonical);

    if target_cmp == root_cmp
        || target_cmp.starts_with(&(root_cmp.clone() + "\\"))
        || target_cmp.starts_with(&(root_cmp + "/"))
    {
        Ok(())
    } else {
        Err("The target path is outside the VirtualDJ folder".to_string())
    }
}

#[tauri::command]
pub async fn list_vdj_config_files(vdj_folder: String) -> Result<Vec<VdjConfigFileInfo>, String> {
    let root = PathBuf::from(&vdj_folder);
    if !root.is_dir() {
        return Err(format!("Invalid VirtualDJ folder: {}", vdj_folder));
    }

    let mut items = Vec::new();

    for entry in walkdir::WalkDir::new(&root)
        .follow_links(true)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        if !entry.file_type().is_file() {
            continue;
        }

        let path = entry.path();
        let ext = path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or_default()
            .to_ascii_lowercase();

        if !ALLOWED_EXTENSIONS.contains(&ext.as_str()) {
            continue;
        }

        let relative_path = path
            .strip_prefix(&root)
            .ok()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_else(|| path.to_string_lossy().to_string());

        let size_bytes = path.metadata().map(|m| m.len()).unwrap_or(0);

        items.push(VdjConfigFileInfo {
            name: path
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string(),
            path: path.to_string_lossy().to_string(),
            relative_path,
            size_bytes,
        });
    }

    items.sort_by(|a, b| a.relative_path.cmp(&b.relative_path));
    Ok(items)
}

#[tauri::command]
pub async fn read_vdj_config_file(vdj_folder: String, file_path: String) -> Result<String, String> {
    let root = PathBuf::from(&vdj_folder);
    let target = PathBuf::from(&file_path);

    ensure_inside_vdj_root(&root, &target)?;

    std::fs::read_to_string(&target)
        .map_err(|e| format!("The configuration file could not be read: {}", e))
}

#[tauri::command]
pub async fn write_vdj_config_file(
    vdj_folder: String,
    file_path: String,
    content: String,
) -> Result<String, String> {
    let root = PathBuf::from(&vdj_folder);
    let target = PathBuf::from(&file_path);

    ensure_inside_vdj_root(&root, &target)?;

    let parent = target
        .parent()
        .ok_or("Invalid target path")?;
    std::fs::create_dir_all(parent)
        .map_err(|e| format!("The target folder could not be created: {}", e))?;

    let backup_path = create_backup_path(&target, "conf")?;

    safety::atomic_write_string(&target, &content)
        .map_err(|e| format!("The configuration file could not be written: {}", e))?;

    Ok(backup_path)
}

#[tauri::command]
pub async fn get_vdj_settings(vdj_folder: String) -> Result<Vec<VdjSettingEntry>, String> {
    let settings_path = settings_xml_path(&vdj_folder);
    if !settings_path.is_file() {
        return Err(format!("settings.xml was not found in {}", vdj_folder));
    }

    let root = parse_xml_root(&settings_path)?;

    Ok(CURATED_SETTINGS
        .iter()
        .map(|meta| VdjSettingEntry {
            key: meta.key.to_string(),
            label: meta.label.to_string(),
            description: meta.description.to_string(),
            category: meta.category.to_string(),
            value: find_setting_value(&root, meta.key),
        })
        .collect())
}

#[tauri::command]
pub async fn get_vdj_mapper(
    vdj_folder: String,
    file_path: String,
) -> Result<VdjMapperDocument, String> {
    let root = PathBuf::from(&vdj_folder);
    let target = PathBuf::from(&file_path);
    ensure_inside_vdj_root(&root, &target)?;

    let ext = target
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase();
    if !matches!(ext.as_str(), "vdjmap" | "xml") {
        return Err("The selected file is not a supported mapper XML file".to_string());
    }

    let mapper_root = parse_mapper_root(&target)?;
    Ok(mapper_document_from_root(&mapper_root))
}

#[tauri::command]
pub async fn update_vdj_mapper(
    vdj_folder: String,
    file_path: String,
    mapper: VdjMapperDocument,
) -> Result<String, String> {
    let root = PathBuf::from(&vdj_folder);
    let target = PathBuf::from(&file_path);
    ensure_inside_vdj_root(&root, &target)?;

    let ext = target
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase();
    if !matches!(ext.as_str(), "vdjmap" | "xml") {
        return Err("The selected file is not a supported mapper XML file".to_string());
    }

    if mapper.device.trim().is_empty() {
        return Err("The mapper device attribute cannot be empty".to_string());
    }

    let backup = create_backup_path(&target, "vdjmap")?;
    let mapper_root = mapper_root_from_document(&mapper);
    let mut buffer = Vec::new();
    mapper_root
        .write_with_config(&mut buffer, xmltree::EmitterConfig::new().perform_indent(true))
        .map_err(|e| format!("The mapper could not be serialized: {}", e))?;

    safety::atomic_write_bytes(&target, &buffer)
        .map_err(|e| format!("The mapper could not be written: {}", e))?;

    Ok(backup)
}

#[tauri::command]
pub async fn get_vdj_pad_document(
    vdj_folder: String,
    file_path: String,
) -> Result<VdjXmlNode, String> {
    let root = PathBuf::from(&vdj_folder);
    let target = PathBuf::from(&file_path);
    ensure_inside_vdj_root(&root, &target)?;

    let ext = target
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase();
    if !matches!(ext.as_str(), "vdjpad" | "xml") {
        return Err("The selected file is not a supported pad XML file".to_string());
    }

    let pad_root = parse_pad_root(&target)?;
    Ok(xml_node_from_element(&pad_root))
}

#[tauri::command]
pub async fn update_vdj_pad_document(
    vdj_folder: String,
    file_path: String,
    document: VdjXmlNode,
) -> Result<String, String> {
    let root = PathBuf::from(&vdj_folder);
    let target = PathBuf::from(&file_path);
    ensure_inside_vdj_root(&root, &target)?;

    let ext = target
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase();
    if !matches!(ext.as_str(), "vdjpad" | "xml") {
        return Err("The selected file is not a supported pad XML file".to_string());
    }

    let backup = create_backup_path(&target, "vdjpad")?;
    let root_element = element_from_xml_node(&document)?;

    let mut buffer = Vec::new();
    root_element
        .write_with_config(&mut buffer, xmltree::EmitterConfig::new().perform_indent(true))
        .map_err(|e| format!("The pad could not be serialized: {}", e))?;

    safety::atomic_write_bytes(&target, &buffer)
        .map_err(|e| format!("The pad could not be written: {}", e))?;

    Ok(backup)
}

#[tauri::command]
pub async fn update_vdj_settings(
    vdj_folder: String,
    updates_json: String,
) -> Result<String, String> {
    let settings_path = settings_xml_path(&vdj_folder);
    if !settings_path.is_file() {
        return Err(format!("settings.xml was not found in {}", vdj_folder));
    }

    let updates: std::collections::HashMap<String, String> = serde_json::from_str(&updates_json)
        .map_err(|e| format!("Invalid JSON for settings.xml: {}", e))?;

    let mut root = parse_xml_root(&settings_path)?;

    for (key, value) in &updates {
        if !update_setting_value(&mut root, key, value) {
            return Err(format!("Option {} was not found in settings.xml", key));
        }
    }

    let backup = safety::create_timestamped_backup(&settings_path, "settings")?;

    let mut buffer = Vec::new();
    root.write_with_config(
        &mut buffer,
        xmltree::EmitterConfig::new().perform_indent(true),
    )
    .map_err(|e| format!("settings.xml could not be serialized: {}", e))?;

    safety::atomic_write_bytes(&settings_path, &buffer)
        .map_err(|e| format!("settings.xml could not be written: {}", e))?;

    Ok(backup.map(|path| path.to_string_lossy().to_string()).unwrap_or_default())
}
