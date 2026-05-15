use std::fs::{self, File};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

fn timestamp_millis() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
}

fn sanitized_label(label: &str) -> String {
    let normalized: String = label
        .chars()
        .map(|ch| {
            if ch.is_ascii_alphanumeric() || ch == '-' || ch == '_' {
                ch
            } else {
                '_'
            }
        })
        .collect();

    if normalized.is_empty() {
        "backup".to_string()
    } else {
        normalized
    }
}

fn temp_write_path(target: &Path) -> Result<PathBuf, String> {
    let parent = target
        .parent()
        .ok_or_else(|| format!("Ruta sin directorio padre: {}", target.display()))?;
    let file_name = target
        .file_name()
        .and_then(|name| name.to_str())
        .ok_or_else(|| format!("Ruta sin nombre de archivo valido: {}", target.display()))?;

    Ok(parent.join(format!(
        ".{file_name}.{}.tmp",
        timestamp_millis()
    )))
}

fn backup_file_name(target: &Path, label: &str) -> String {
    let file_name = target
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("file");
    format!(
        "{}.{}.{}.bak",
        file_name,
        sanitized_label(label),
        timestamp_millis()
    )
}

pub fn create_timestamped_backup(target: &Path, label: &str) -> Result<Option<PathBuf>, String> {
    if !target.exists() {
        return Ok(None);
    }

    let parent = target
        .parent()
        .ok_or_else(|| format!("Ruta sin directorio padre: {}", target.display()))?;
    let backup = parent.join(backup_file_name(target, label));
    fs::copy(target, &backup).map_err(|err| {
        format!(
            "No se pudo crear backup {} -> {}: {}",
            target.display(),
            backup.display(),
            err
        )
    })?;

    Ok(Some(backup))
}

pub fn atomic_write_string(target: &Path, payload: &str) -> Result<(), String> {
    atomic_write_bytes(target, payload.as_bytes())
}

pub fn atomic_write_bytes(target: &Path, payload: &[u8]) -> Result<(), String> {
    let parent = target
        .parent()
        .ok_or_else(|| format!("Ruta sin directorio padre: {}", target.display()))?;
    fs::create_dir_all(parent).map_err(|err| {
        format!(
            "No se pudo crear directorio {} antes de escribir {}: {}",
            parent.display(),
            target.display(),
            err
        )
    })?;

    let temp_path = temp_write_path(target)?;
    {
        let mut temp_file = File::create(&temp_path).map_err(|err| {
            format!(
                "No se pudo crear archivo temporal {}: {}",
                temp_path.display(),
                err
            )
        })?;
        temp_file.write_all(payload).map_err(|err| {
            let _ = fs::remove_file(&temp_path);
            format!(
                "No se pudo escribir archivo temporal {}: {}",
                temp_path.display(),
                err
            )
        })?;
        temp_file.sync_all().map_err(|err| {
            let _ = fs::remove_file(&temp_path);
            format!(
                "No se pudo sincronizar archivo temporal {}: {}",
                temp_path.display(),
                err
            )
        })?;
    }

    match fs::rename(&temp_path, target) {
        Ok(()) => Ok(()),
        Err(rename_err) if target.exists() => replace_existing_target(target, &temp_path, rename_err),
        Err(rename_err) => {
            let _ = fs::remove_file(&temp_path);
            Err(format!(
                "No se pudo reemplazar {} con {}: {}",
                target.display(),
                temp_path.display(),
                rename_err
            ))
        }
    }
}

fn replace_existing_target(
    target: &Path,
    temp_path: &Path,
    original_error: std::io::Error,
) -> Result<(), String> {
    let rollback_path = target.with_extension(format!(
        "{}.rollback.{}",
        target
            .extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("file"),
        timestamp_millis()
    ));

    fs::rename(target, &rollback_path).map_err(|rollback_err| {
        let _ = fs::remove_file(temp_path);
        format!(
            "No se pudo preparar reemplazo de {} despues de error inicial '{}': {}",
            target.display(),
            original_error,
            rollback_err
        )
    })?;

    match fs::rename(temp_path, target) {
        Ok(()) => {
            let _ = fs::remove_file(&rollback_path);
            Ok(())
        }
        Err(replace_err) => {
            let restore_result = fs::rename(&rollback_path, target);
            let _ = fs::remove_file(temp_path);
            match restore_result {
                Ok(()) => Err(format!(
                    "No se pudo reemplazar {} con {}: {}. El archivo original fue restaurado.",
                    target.display(),
                    temp_path.display(),
                    replace_err
                )),
                Err(restore_err) => Err(format!(
                    "No se pudo reemplazar {} con {}: {}. Ademas fallo restaurar {}: {}",
                    target.display(),
                    temp_path.display(),
                    replace_err,
                    rollback_path.display(),
                    restore_err
                )),
            }
        }
    }
}
