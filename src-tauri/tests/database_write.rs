use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use vdj_manager_lib::database::models::{
    InlineSongUpdate, Poi, RelinkFileStatus, Song, UpdateSongTagsStatus,
};
use vdj_manager_lib::database::parser::{
    normalize_windows_path, parse_database, patch_song_in_place, patch_song_path_in_place,
    remove_song_in_place, RemoveSongStatus, windows_paths_equal, write_database_checked,
};

fn fixture(name: &str) -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("tests")
        .join("fixtures")
        .join(name)
}

fn unique_temp_dir(test_name: &str) -> PathBuf {
    let millis = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("system time should be after unix epoch")
        .as_millis();
    std::env::temp_dir().join(format!(
        "vdj-manager-{test_name}-{}-{millis}",
        std::process::id()
    ))
}

#[test]
fn parse_minimal_database_reads_core_virtualdj_fields() {
    let db = parse_database(&fixture("database_minimal.xml")).expect("fixture should parse");

    assert_eq!(db.version.as_deref(), Some("8.1"));
    assert_eq!(db.songs.len(), 2);

    let first = &db.songs[0];
    assert_eq!(first.file_path, r"D:\Music\Artist - Title.mp3");
    assert_eq!(first.file_size, Some(12345));
    assert_eq!(first.flag, Some(1));
    assert_eq!(
        first.tags.as_ref().and_then(|tags| tags.author.as_deref()),
        Some("Artist")
    );
    assert_eq!(
        first.scan.as_ref().and_then(|scan| scan.bpm.as_deref()),
        Some("0.46875")
    );
    assert_eq!(first.pois.len(), 1);
    assert_eq!(
        first.comment.as_ref().and_then(|comment| comment.text.as_deref()),
        Some("Main comment")
    );
}

#[test]
fn write_database_checked_persists_and_reparses_core_fields() {
    let dir = unique_temp_dir("database-write");
    fs::create_dir_all(&dir).expect("temp dir should be created");
    let db_path = dir.join("database.xml");
    fs::copy(fixture("database_minimal.xml"), &db_path).expect("fixture should be copied");

    let mut db = parse_database(&db_path).expect("copied fixture should parse");
    db.songs[0]
        .tags
        .as_mut()
        .expect("first song should have tags")
        .title = Some("Updated Title".to_string());

    write_database_checked(&db_path, &db).expect("checked write should succeed");
    let reparsed = parse_database(&db_path).expect("written DB should reparse");

    assert_eq!(reparsed.songs.len(), 2);
    assert_eq!(
        reparsed.songs[0]
            .tags
            .as_ref()
            .and_then(|tags| tags.title.as_deref()),
        Some("Updated Title")
    );

    fs::remove_dir_all(&dir).expect("temp dir should be removed");
}

#[test]
fn current_serializer_drops_unknown_virtualdj_attributes_documented_gap() {
    let dir = unique_temp_dir("database-unknown-attrs");
    fs::create_dir_all(&dir).expect("temp dir should be created");
    let db_path = dir.join("database.xml");
    fs::copy(fixture("database_unknown_attrs.xml"), &db_path).expect("fixture should be copied");

    let db = parse_database(&db_path).expect("fixture should parse while ignoring unknown attrs");
    write_database_checked(&db_path, &db).expect("checked write should succeed");
    let output = fs::read_to_string(&db_path).expect("written DB should be readable");

    assert!(
        !output.contains("FutureSong="),
        "current serde model does not preserve unknown Song attributes"
    );
    assert!(
        !output.contains("FutureTags="),
        "current serde model does not preserve unknown Tags attributes"
    );

    fs::remove_dir_all(&dir).expect("temp dir should be removed");
}

#[test]
fn patch_song_in_place_matches_windows_path_and_preserves_unknown_xml() {
    let dir = unique_temp_dir("database-patch-in-place");
    fs::create_dir_all(&dir).expect("temp dir should be created");
    let db_path = dir.join("database.xml");
    fs::copy(fixture("database_unknown_attrs.xml"), &db_path).expect("fixture should be copied");

    let update = InlineSongUpdate {
        title: Some("Patched & title".to_string()),
        author: Some("New artist".to_string()),
        color: Some("16711680".to_string()),
        comment_text: Some("Inline comment".to_string()),
        ..InlineSongUpdate::default()
    };
    let result = patch_song_in_place(&db_path, r"d:/music/unknown.mp3", &update)
        .expect("patch should return a typed result");
    assert!(matches!(result.status, UpdateSongTagsStatus::Completed));
    assert_eq!(result.current_file_path, r"D:\Music\Unknown.mp3");
    assert_eq!(result.updated_fields, vec!["title", "author", "commentText", "color"]);

    let output = fs::read_to_string(&db_path).expect("patched DB should be readable");
    for marker in [
        r#"FutureRoot="root-value""#,
        r#"FutureSong="song-value""#,
        r#"FutureTags="tags-value""#,
        r#"FutureInfos="infos-value""#,
        r#"FutureScan="scan-value""#,
        r#"FuturePoi="poi-value""#,
    ] {
        assert!(output.contains(marker), "unknown XML marker disappeared");
    }

    let reparsed = parse_database(&db_path).expect("patched DB should reparse");
    let song = &reparsed.songs[0];
    assert_eq!(song.tags.as_ref().and_then(|tags| tags.title.as_deref()), Some("Patched & title"));
    assert_eq!(song.tags.as_ref().and_then(|tags| tags.author.as_deref()), Some("New artist"));
    assert_eq!(song.infos.as_ref().and_then(|infos| infos.color.as_deref()), Some("16711680"));
    assert_eq!(song.comment.as_ref().and_then(|comment| comment.text.as_deref()), Some("Inline comment"));

    fs::remove_dir_all(&dir).expect("temp dir should be removed");
}

#[test]
fn patch_song_in_place_reports_not_found_without_writing() {
    let dir = unique_temp_dir("database-patch-not-found");
    fs::create_dir_all(&dir).expect("temp dir should be created");
    let db_path = dir.join("database.xml");
    fs::copy(fixture("database_unknown_attrs.xml"), &db_path).expect("fixture should be copied");
    let before = fs::read(&db_path).expect("fixture should be readable");

    let result = patch_song_in_place(
        &db_path,
        r"D:\\Music\\missing.mp3",
        &InlineSongUpdate {
            title: Some("Should not write".to_string()),
            ..InlineSongUpdate::default()
        },
    )
    .expect("not-found should be represented as a typed result");
    assert!(matches!(result.status, UpdateSongTagsStatus::NotFound));
    assert_eq!(before, fs::read(&db_path).expect("DB should remain unchanged"));

    fs::remove_dir_all(&dir).expect("temp dir should be removed");
}

#[test]
fn patch_song_path_in_place_updates_path_and_size_without_serializer_loss() {
    let dir = unique_temp_dir("database-relink-patch");
    fs::create_dir_all(&dir).expect("temp dir should be created");
    let db_path = dir.join("database.xml");
    fs::copy(fixture("database_unknown_attrs.xml"), &db_path).expect("fixture should be copied");
    let new_path = dir.join("Música").join("Destino.mp3");
    fs::create_dir_all(new_path.parent().expect("target parent should exist"))
        .expect("target parent should be created");
    fs::write(&new_path, b"new audio bytes").expect("target fixture should be written");

    let result = patch_song_path_in_place(
        &db_path,
        r"d:/music/unknown.mp3",
        &new_path.to_string_lossy(),
    )
    .expect("path patch should return a typed result");
    assert!(matches!(result.status, RelinkFileStatus::Completed));
    assert_eq!(result.file_size, Some(15));

    let output = fs::read_to_string(&db_path).expect("patched DB should be readable");
    assert!(output.contains("FutureRoot=\"root-value\""));
    assert!(output.contains("FutureSong=\"song-value\""));
    assert!(output.contains("FutureTags=\"tags-value\""));
    let reparsed = parse_database(&db_path).expect("patched DB should reparse");
    assert_eq!(reparsed.songs[0].file_path, new_path.to_string_lossy());
    assert_eq!(reparsed.songs[0].file_size, Some(15));

    fs::remove_dir_all(&dir).expect("temp dir should be removed");
}

#[test]
fn patch_song_path_in_place_uses_case_insensitive_unicode_matching() {
    let dir = unique_temp_dir("database-relink-unicode");
    fs::create_dir_all(&dir).expect("temp dir should be created");
    let db_path = dir.join("database.xml");
    let xml = r#"<VirtualDJ_Database><Song FilePath="D:\MÚSICA\Árbol.mp3" FileSize="1" Future="keep"/></VirtualDJ_Database>"#;
    fs::write(&db_path, xml).expect("unicode fixture should be written");
    let target = dir.join("Nueva").join("Árbol.mp3");
    fs::create_dir_all(target.parent().expect("target parent should exist"))
        .expect("target parent should be created");
    fs::write(&target, b"unicode target").expect("target fixture should be written");

    let result = patch_song_path_in_place(
        &db_path,
        r"d:/música/árbol.mp3",
        &target.to_string_lossy(),
    )
    .expect("unicode path patch should return a typed result");
    assert!(matches!(result.status, RelinkFileStatus::Completed));
    let output = fs::read_to_string(&db_path).expect("patched DB should be readable");
    assert!(output.contains(&format!(r#"FilePath="{}""#, target.to_string_lossy())));
    assert!(output.contains(r#"FileSize="14""#));
    assert!(output.contains(r#"Future="keep""#));

    fs::remove_dir_all(&dir).expect("temp dir should be removed");
}

#[test]
fn windows_path_matching_preserves_unc_prefix_and_mixed_separators() {
    assert_eq!(
        normalize_windows_path(r"//Server/Music\\Track.mp3"),
        r"\\Server\Music\Track.mp3"
    );
    assert!(windows_paths_equal(
        r"\\server/music/Track.mp3",
        r"//SERVER\\Music\\track.mp3"
    ));
    assert!(windows_paths_equal(
        r"C:\MÚSICA\Árbol.mp3",
        r"c:/música/árbol.mp3"
    ));
    assert!(windows_paths_equal(
        r"\\SERVIDOR\MÚSICA\Órbita.mp3",
        r"//servidor/música/órbita.mp3"
    ));
}

#[test]
fn patch_scanner_ignores_song_like_markup_inside_comment_and_cdata() {
    let dir = unique_temp_dir("database-patch-hostile-markup");
    fs::create_dir_all(&dir).expect("temp dir should be created");
    let db_path = dir.join("database.xml");
    let xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<VirtualDJ_Database Version="8.1">
  <!-- <Song FilePath="D:\Music\Target.mp3"><Tags Title="fake"/></Song> -->
  <![CDATA[<Song FilePath="D:\Music\Target.mp3"><Tags Title="fake-cdata"/></Song>]]>
  <Song FilePath="D:\Music\Target.mp3"><Tags Title="real"/></Song>
</VirtualDJ_Database>
"#;
    fs::write(&db_path, xml).expect("hostile fixture should be written");

    let result = patch_song_in_place(
        &db_path,
        r"d:/music/target.mp3",
        &InlineSongUpdate {
            title: Some("patched".to_string()),
            ..InlineSongUpdate::default()
        },
    )
    .expect("scanner should ignore non-element markup");
    assert!(matches!(result.status, UpdateSongTagsStatus::Completed));
    let output = fs::read_to_string(&db_path).expect("patched fixture should be readable");
    assert!(output.contains("fake-cdata"));
    assert!(output.contains("Title=\"patched\""));
    assert_eq!(output.matches("<Song FilePath").count(), 3);

    fs::remove_dir_all(&dir).expect("temp dir should be removed");
}

#[test]
fn duplicate_path_match_is_unsafe_and_does_not_write() {
    let dir = unique_temp_dir("database-patch-duplicate");
    fs::create_dir_all(&dir).expect("temp dir should be created");
    let db_path = dir.join("database.xml");
    let xml = r#"<VirtualDJ_Database>
<Song FilePath="D:\Music\Duplicate.mp3"><Tags Title="one"/></Song>
<Song FilePath="d:/music/duplicate.mp3"><Tags Title="two"/></Song>
</VirtualDJ_Database>
"#;
    fs::write(&db_path, xml).expect("duplicate fixture should be written");
    let before = fs::read(&db_path).expect("fixture should be readable");

    let result = patch_song_in_place(
        &db_path,
        r"D:\Music\Duplicate.mp3",
        &InlineSongUpdate {
            title: Some("should not write".to_string()),
            ..InlineSongUpdate::default()
        },
    )
    .expect("duplicate match should return typed result");
    assert!(matches!(result.status, UpdateSongTagsStatus::UnsafeToPatch));
    assert_eq!(before, fs::read(&db_path).expect("DB should remain unchanged"));

    fs::remove_dir_all(&dir).expect("temp dir should be removed");
}

#[test]
fn sequential_patches_preserve_both_updates_and_unknown_xml() {
    let dir = unique_temp_dir("database-patch-sequential");
    fs::create_dir_all(&dir).expect("temp dir should be created");
    let db_path = dir.join("database.xml");
    fs::copy(fixture("database_unknown_attrs.xml"), &db_path).expect("fixture should be copied");

    let first = patch_song_in_place(
        &db_path,
        r"D:\Music\Unknown.mp3",
        &InlineSongUpdate {
            title: Some("First patch".to_string()),
            ..InlineSongUpdate::default()
        },
    )
    .expect("first patch should run");
    assert!(matches!(first.status, UpdateSongTagsStatus::Completed));
    let second = patch_song_in_place(
        &db_path,
        r"d:/music/unknown.mp3",
        &InlineSongUpdate {
            author: Some("Second patch".to_string()),
            ..InlineSongUpdate::default()
        },
    )
    .expect("second patch should run");
    assert!(matches!(second.status, UpdateSongTagsStatus::Completed));

    let output = fs::read_to_string(&db_path).expect("patched DB should read");
    assert!(output.contains(r#"FutureTags="tags-value""#));
    let reparsed = parse_database(&db_path).expect("patched DB should reparse");
    let tags = reparsed.songs[0].tags.as_ref().expect("tags should remain");
    assert_eq!(tags.title.as_deref(), Some("First patch"));
    assert_eq!(tags.author.as_deref(), Some("Second patch"));

    fs::remove_dir_all(&dir).expect("temp dir should be removed");
}

#[test]
fn only_direct_song_children_of_database_root_are_targets() {
    let dir = unique_temp_dir("database-patch-nested-song");
    fs::create_dir_all(&dir).expect("temp dir should be created");
    let db_path = dir.join("database.xml");
    let xml = r#"<VirtualDJ_Database>
<Unknown Future="preserve"><Song FilePath="D:\Music\Target.mp3"><Tags Title="nested"/></Song></Unknown>
<Song FilePath="D:\Music\Target.mp3"><Tags Title="direct"/></Song>
</VirtualDJ_Database>
"#;
    fs::write(&db_path, xml).expect("nested fixture should write");

    let result = patch_song_in_place(
        &db_path,
        r"d:/music/target.mp3",
        &InlineSongUpdate {
            title: Some("patched-direct".to_string()),
            ..InlineSongUpdate::default()
        },
    )
    .expect("direct song should patch");
    assert!(matches!(result.status, UpdateSongTagsStatus::Completed));
    let output = fs::read_to_string(&db_path).expect("patched fixture should read");
    assert!(output.contains(r#"Future="preserve""#));
    assert!(output.contains(r#"Title="nested""#));
    assert!(output.contains(r#"Title="patched-direct""#));

    fs::remove_dir_all(&dir).expect("temp dir should be removed");
}

#[test]
fn self_closing_comments_expand_without_losing_unknown_attributes() {
    let dir = unique_temp_dir("database-patch-self-closing-comment");
    fs::create_dir_all(&dir).expect("temp dir should be created");
    let db_path = dir.join("database.xml");
    let xml = r#"<VirtualDJ_Database>
<Song FilePath="D:\Music\Plain.mp3"><Comment/></Song>
<Song FilePath="D:\Music\Future.mp3"><Comment Future="keep" /></Song>
</VirtualDJ_Database>
"#;
    fs::write(&db_path, xml).expect("comment fixture should write");

    for (path, comment) in [
        (r"D:\Music\Plain.mp3", "plain comment"),
        (r"D:\Music\Future.mp3", "future comment"),
    ] {
        let result = patch_song_in_place(
            &db_path,
            path,
            &InlineSongUpdate {
                comment_text: Some(comment.to_string()),
                ..InlineSongUpdate::default()
            },
        )
        .expect("comment patch should run");
        assert!(matches!(result.status, UpdateSongTagsStatus::Completed));
    }

    let output = fs::read_to_string(&db_path).expect("patched fixture should read");
    assert!(output.contains("<Comment>plain comment</Comment>"));
    assert!(output.contains(r#"<Comment Future="keep" >future comment</Comment>"#));
    let reparsed = parse_database(&db_path).expect("expanded comments should reparse");
    assert_eq!(
        reparsed.songs[0]
            .comment
            .as_ref()
            .and_then(|comment| comment.text.as_deref()),
        Some("plain comment")
    );
    assert_eq!(
        reparsed.songs[1]
            .comment
            .as_ref()
            .and_then(|comment| comment.text.as_deref()),
        Some("future comment")
    );

    fs::remove_dir_all(&dir).expect("temp dir should be removed");
}

#[test]
fn remove_song_in_place_removes_direct_song_and_preserves_unknown_xml() {
    let dir = unique_temp_dir("database-remove-in-place");
    fs::create_dir_all(&dir).expect("temp dir should be created");
    let db_path = dir.join("database.xml");
    fs::copy(fixture("database_unknown_attrs.xml"), &db_path).expect("fixture should be copied");

    let result = remove_song_in_place(&db_path, r"d:/music/unknown.mp3")
        .expect("remove should return a typed result");
    assert!(matches!(result.status, RemoveSongStatus::Completed));
    assert_eq!(result.current_file_path.as_deref(), Some(r"D:\Music\Unknown.mp3"));

    let output = fs::read_to_string(&db_path).expect("database should remain readable");
    for marker in [
        r#"FutureRoot="root-value""#,
        r#"FutureSong="song-value""#,
    ] {
        // FutureSong belongs to the removed entry and should not survive; the
        // root marker is the byte-preservation assertion that matters here.
        if marker.contains("FutureSong") {
            assert!(!output.contains(marker));
        } else {
            assert!(output.contains(marker));
        }
    }
    assert!(!output.contains(r#"FilePath="D:\Music\Unknown.mp3""#));
    assert_eq!(parse_database(&db_path).expect("database should reparse").songs.len(), 0);

    fs::remove_dir_all(&dir).expect("temp dir should be removed");
}

#[test]
fn remove_song_in_place_reports_not_found_without_writing() {
    let dir = unique_temp_dir("database-remove-not-found");
    fs::create_dir_all(&dir).expect("temp dir should be created");
    let db_path = dir.join("database.xml");
    fs::copy(fixture("database_unknown_attrs.xml"), &db_path).expect("fixture should be copied");
    let before = fs::read(&db_path).expect("fixture should be readable");

    let result = remove_song_in_place(&db_path, r"D:\Music\missing.mp3")
        .expect("not-found should be represented as a typed result");
    assert!(matches!(result.status, RemoveSongStatus::NotFound));
    assert_eq!(before, fs::read(&db_path).expect("database should remain unchanged"));

    fs::remove_dir_all(&dir).expect("temp dir should be removed");
}

#[test]
fn remove_song_in_place_reports_ambiguous_case_insensitive_identity_without_writing() {
    let dir = unique_temp_dir("database-remove-ambiguous");
    fs::create_dir_all(&dir).expect("temp dir should be created");
    let db_path = dir.join("database.xml");
    let xml = r#"<VirtualDJ_Database FutureRoot="keep">
<Song FilePath="D:\Music\Duplicate.mp3" FutureSong="one"/>
<Song FilePath="d:/music/duplicate.mp3" FutureSong="two"/>
</VirtualDJ_Database>
"#;
    fs::write(&db_path, xml).expect("database fixture should write");
    let before = fs::read(&db_path).expect("fixture should be readable");

    let result = remove_song_in_place(&db_path, r"D:\Music\Duplicate.mp3")
        .expect("ambiguous match should be represented as a typed result");
    assert!(matches!(result.status, RemoveSongStatus::Ambiguous));
    assert_eq!(before, fs::read(&db_path).expect("database should remain unchanged"));

    fs::remove_dir_all(&dir).expect("temp dir should be removed");
}

#[test]
fn song_summary_counts_and_orders_visible_cue_markers() {
    let song = Song {
        file_path: r"D:\Music\Cue Test.mp3".to_string(),
        file_size: None,
        flag: None,
        tags: None,
        infos: None,
        scan: None,
        pois: vec![
            Poi {
                pos: Some("64".to_string()),
                poi_type: Some("cue".to_string()),
                name: Some("Drop".to_string()),
                num: Some("2".to_string()),
                ..Poi::default()
            },
            Poi {
                pos: Some("0".to_string()),
                poi_type: Some("beatgrid".to_string()),
                name: Some("Grid".to_string()),
                ..Poi::default()
            },
            Poi {
                pos: Some("16".to_string()),
                poi_type: Some("cue".to_string()),
                name: Some("Intro".to_string()),
                num: Some("1".to_string()),
                ..Poi::default()
            },
        ],
        comment: None,
        custom_mix: None,
        link: None,
    };

    let summary = song.to_summary(0);

    assert_eq!(summary.cue_count, 2);
    assert_eq!(summary.cue_markers.len(), 2);
    assert_eq!(summary.cue_markers[0].name.as_deref(), Some("Intro"));
    assert_eq!(summary.cue_markers[1].name.as_deref(), Some("Drop"));
}
