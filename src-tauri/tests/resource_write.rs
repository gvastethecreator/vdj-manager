use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

use vdj_manager_lib::safety::{atomic_write_bytes, create_timestamped_backup};

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
fn create_timestamped_backup_copies_existing_file() {
    let dir = unique_temp_dir("backup");
    fs::create_dir_all(&dir).expect("temp dir should be created");
    let target = dir.join("database.xml");
    fs::write(&target, "original").expect("target should be written");

    let backup = create_timestamped_backup(&target, "database")
        .expect("backup should succeed")
        .expect("existing file should produce a backup path");

    assert!(backup.exists(), "backup path should exist");
    assert_eq!(
        fs::read_to_string(&backup).expect("backup should be readable"),
        "original"
    );
    assert_ne!(backup, target, "backup must not overwrite the source file");

    fs::remove_dir_all(&dir).expect("temp dir should be removed");
}

#[test]
fn create_timestamped_backup_returns_none_for_missing_file() {
    let dir = unique_temp_dir("missing-backup");
    fs::create_dir_all(&dir).expect("temp dir should be created");
    let target = dir.join("database.xml");

    let backup = create_timestamped_backup(&target, "database")
        .expect("missing target should not be an error");

    assert!(backup.is_none());

    fs::remove_dir_all(&dir).expect("temp dir should be removed");
}

#[test]
fn atomic_write_bytes_replaces_file_contents() {
    let dir = unique_temp_dir("atomic-write");
    fs::create_dir_all(&dir).expect("temp dir should be created");
    let target = dir.join("settings.xml");
    fs::write(&target, "original").expect("target should be written");

    atomic_write_bytes(&target, b"replacement").expect("atomic write should succeed");

    assert_eq!(
        fs::read_to_string(&target).expect("target should be readable"),
        "replacement"
    );

    fs::remove_dir_all(&dir).expect("temp dir should be removed");
}
