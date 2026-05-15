use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use vdj_manager_lib::database::parser::{parse_database, write_database_checked};
use vdj_manager_lib::database::models::{Poi, Song};

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
