//! Tauri command for extracting compact waveform previews from media files.

use std::collections::HashMap;
use std::f32::consts::PI;
use std::fs::{self, File};
use std::path::{Path, PathBuf};
use std::sync::{Mutex, OnceLock};

use dirs::cache_dir;
use md5::{Digest, Md5};
use realfft::RealFftPlanner;
use rusqlite::{Connection, OpenFlags, OptionalExtension};
use symphonia::core::audio::SampleBuffer;
use symphonia::core::codecs::{DecoderOptions, CODEC_TYPE_NULL};
use symphonia::core::errors::Error;
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::MetadataOptions;
use symphonia::core::probe::Hint;

const CACHE_SCHEMA_VERSION: u32 = 3;
const BLOCK_FRAMES: usize = 1024;
const FFT_SIZE: usize = 4096;
const MAX_SPECTRUM_WINDOWS: usize = 8;
const DEFAULT_FREQUENCY_BANDS: usize = 20;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct WaveformPreview {
    pub peaks: Vec<u8>,
    pub bucket_count: usize,
    pub frequency_bands: Vec<u8>,
    pub frequency_band_count: usize,
    pub colors: Vec<String>,
    pub values_per_second: Option<f64>,
    pub source: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
struct PersistedWaveformPreview {
    schema_version: u32,
    cache_key: String,
    preview: WaveformPreview,
}

static WAVEFORM_CACHE: OnceLock<Mutex<HashMap<String, WaveformPreview>>> = OnceLock::new();
static WAVEFORM_SEMAPHORE: OnceLock<tokio::sync::Semaphore> = OnceLock::new();

fn waveform_cache() -> &'static Mutex<HashMap<String, WaveformPreview>> {
    WAVEFORM_CACHE.get_or_init(|| Mutex::new(HashMap::new()))
}

fn waveform_semaphore() -> &'static tokio::sync::Semaphore {
    WAVEFORM_SEMAPHORE.get_or_init(|| {
        let available = std::thread::available_parallelism()
            .map(|n| n.get())
            .unwrap_or(4);
        let permits = available.saturating_sub(1).clamp(2, 6);
        tokio::sync::Semaphore::new(permits)
    })
}

fn build_cache_key(
    path: &Path,
    bucket_count: usize,
    vdj_folder: Option<&Path>,
) -> Result<String, String> {
    let metadata = fs::metadata(path)
        .map_err(|err| format!("No se pudo leer metadata de {}: {}", path.display(), err))?;
    let modified = metadata
        .modified()
        .ok()
        .and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|duration| duration.as_secs())
        .unwrap_or_default();

    Ok(format!(
        "v{}::{}::{}::{}::{}",
        CACHE_SCHEMA_VERSION,
        path.to_string_lossy(),
        bucket_count,
        metadata.len(),
        modified,
    ) + &vdj_folder
        .map(|folder| format!("::vdj={}", folder.to_string_lossy()))
        .unwrap_or_default())
}

fn split_virtualdj_file_path(path: &Path) -> Option<(String, String)> {
    let raw = path.to_string_lossy();
    let split_at = raw.rfind(['\\', '/'])?;
    let parent = raw[..split_at].to_string();
    let filename = raw[split_at + 1..].to_string();

    if parent.is_empty() || filename.is_empty() {
        return None;
    }

    Some((parent, filename))
}

fn virtualdj_filepath_candidates(parent: &str) -> Vec<String> {
    let mut candidates = Vec::new();
    let normalized_backslash = parent.replace('/', "\\");
    let normalized_forward = parent.replace('\\', "/");

    for candidate in [
        normalized_backslash.as_str(),
        normalized_forward.as_str(),
        parent,
    ] {
        let trimmed = candidate.trim_end_matches(['\\', '/']);
        for variant in [
            trimmed.to_string(),
            format!("{trimmed}\\"),
            format!("{trimmed}/"),
        ] {
            let lowered = variant.to_lowercase();
            if !candidates.iter().any(|existing| existing == &lowered) {
                candidates.push(lowered);
            }
        }
    }

    candidates
}

fn virtualdj_cache_candidates(vdj_folder: Option<&Path>) -> Vec<PathBuf> {
    let mut candidates = Vec::new();

    if let Some(folder) = vdj_folder {
        candidates.push(folder.join("Cache").join("cache.db"));
    }

    if let Some(documents) = dirs::document_dir() {
        candidates.push(documents.join("VirtualDJ").join("Cache").join("cache.db"));
    }

    if let Some(home) = dirs::home_dir() {
        candidates.push(
            home.join("Documents")
                .join("VirtualDJ")
                .join("Cache")
                .join("cache.db"),
        );
    }

    #[cfg(windows)]
    {
        candidates.push(PathBuf::from(r"D:\Documents\VirtualDJ\Cache\cache.db"));
    }

    let mut deduped = Vec::new();
    for candidate in candidates {
        let key = candidate.to_string_lossy().to_lowercase();
        if deduped
            .iter()
            .any(|existing: &PathBuf| existing.to_string_lossy().to_lowercase() == key)
        {
            continue;
        }
        deduped.push(candidate);
    }

    deduped
}

fn sqlite_immutable_uri(db_path: &Path) -> String {
    let raw = db_path.to_string_lossy().replace('\\', "/");
    if raw.starts_with('/') {
        format!("file:{raw}?mode=ro&immutable=1")
    } else {
        format!("file:/{raw}?mode=ro&immutable=1")
    }
}

fn open_virtualdj_cache_readonly(db_path: &Path) -> Result<Connection, String> {
    let flags = OpenFlags::SQLITE_OPEN_READ_ONLY | OpenFlags::SQLITE_OPEN_NO_MUTEX;
    match Connection::open_with_flags(db_path, flags) {
        Ok(conn) => Ok(conn),
        Err(first_err) => {
            let uri = sqlite_immutable_uri(db_path);
            Connection::open_with_flags(uri, flags | OpenFlags::SQLITE_OPEN_URI).map_err(
                |second_err| {
                    format!(
                        "No se pudo abrir cache.db en modo lectura ({}; fallback immutable: {})",
                        first_err, second_err
                    )
                },
            )
        }
    }
}

fn color_hex(r: u8, g: u8, b: u8) -> String {
    format!("#{r:02x}{g:02x}{b:02x}")
}

fn decode_virtualdj_type_one_waveform(
    waveform: &[u8],
    bucket_count: usize,
    values_per_second: f64,
) -> Result<WaveformPreview, String> {
    let samples: Vec<[u8; 4]> = waveform
        .chunks_exact(4)
        .map(|chunk| [chunk[0], chunk[1], chunk[2], chunk[3]])
        .collect();

    if samples.is_empty() {
        return Err("El waveform cacheado de VirtualDJ está vacío".to_string());
    }

    let bucket_count = bucket_count.max(1);
    let mut raw_peaks = Vec::with_capacity(bucket_count);
    let mut colors = Vec::with_capacity(bucket_count);

    for bucket_index in 0..bucket_count {
        let start = bucket_index * samples.len() / bucket_count;
        let mut end = (bucket_index + 1) * samples.len() / bucket_count;
        if end <= start {
            end = (start + 1).min(samples.len());
        }

        let mut strongest = samples[start];
        for sample in &samples[start..end] {
            if sample[3] >= strongest[3] {
                strongest = *sample;
            }
        }

        raw_peaks.push(strongest[3] as f32);
        colors.push(color_hex(strongest[0], strongest[1], strongest[2]));
    }

    Ok(WaveformPreview {
        peaks: downsample_peaks(&raw_peaks, bucket_count),
        bucket_count,
        frequency_bands: Vec::new(),
        frequency_band_count: 0,
        colors,
        values_per_second: Some(values_per_second),
        source: Some("virtualdj-cache".to_string()),
    })
}

fn load_virtualdj_cached_waveform_from_db(
    db_path: &Path,
    media_path: &Path,
    file_size: u64,
    bucket_count: usize,
) -> Result<Option<WaveformPreview>, String> {
    if !db_path.exists() {
        return Ok(None);
    }

    let Some((parent, filename)) = split_virtualdj_file_path(media_path) else {
        return Ok(None);
    };
    let parent_candidates = virtualdj_filepath_candidates(&parent);

    if parent_candidates.is_empty() {
        return Ok(None);
    }

    let placeholders = (0..parent_candidates.len())
        .map(|index| format!("?{}", index + 3))
        .collect::<Vec<_>>()
        .join(", ");
    let sql = format!(
        "SELECT valuesPerSecond, waveform \
         FROM waveforms \
         WHERE lower(filename) = lower(?1) \
           AND filesize = ?2 \
           AND type = 1 \
           AND lower(filepath) IN ({placeholders}) \
         ORDER BY version DESC, id DESC \
         LIMIT 1"
    );

    let conn = open_virtualdj_cache_readonly(db_path)?;
    let mut stmt = conn
        .prepare(&sql)
        .map_err(|err| format!("No se pudo preparar consulta de waveform cacheado: {err}"))?;

    let mut params: Vec<&dyn rusqlite::ToSql> = Vec::with_capacity(parent_candidates.len() + 2);
    params.push(&filename);
    let file_size_i64 = file_size as i64;
    params.push(&file_size_i64);
    for candidate in &parent_candidates {
        params.push(candidate);
    }

    let row = stmt
        .query_row(params.as_slice(), |row| {
            let values_per_second: f64 = row.get(0)?;
            let waveform: Vec<u8> = row.get(1)?;
            Ok((values_per_second, waveform))
        })
        .optional()
        .map_err(|err| format!("No se pudo leer waveform cacheado de VirtualDJ: {err}"))?;

    let Some((values_per_second, waveform)) = row else {
        return Ok(None);
    };

    decode_virtualdj_type_one_waveform(&waveform, bucket_count, values_per_second).map(Some)
}

fn load_virtualdj_cached_waveform(
    vdj_folder: Option<&Path>,
    media_path: &Path,
    file_size: u64,
    bucket_count: usize,
) -> Option<WaveformPreview> {
    for db_path in virtualdj_cache_candidates(vdj_folder) {
        match load_virtualdj_cached_waveform_from_db(&db_path, media_path, file_size, bucket_count)
        {
            Ok(Some(preview)) => return Some(preview),
            Ok(None) => continue,
            Err(_) => continue,
        }
    }

    None
}

fn waveform_cache_dir() -> PathBuf {
    cache_dir()
        .unwrap_or_else(std::env::temp_dir)
        .join("vdj-db-manager")
        .join("waveforms")
}

fn waveform_cache_file(cache_key: &str) -> PathBuf {
    let mut hasher = Md5::new();
    hasher.update(cache_key.as_bytes());
    let digest = hasher.finalize();
    waveform_cache_dir().join(format!("{:x}.json", digest))
}

fn load_waveform_from_disk(cache_key: &str) -> Option<WaveformPreview> {
    let cache_file = waveform_cache_file(cache_key);
    let raw = fs::read_to_string(cache_file).ok()?;
    let persisted = serde_json::from_str::<PersistedWaveformPreview>(&raw).ok()?;

    if persisted.schema_version != CACHE_SCHEMA_VERSION || persisted.cache_key != cache_key {
        return None;
    }

    Some(persisted.preview)
}

fn persist_waveform_to_disk(cache_key: &str, preview: &WaveformPreview) -> Result<(), String> {
    let cache_dir = waveform_cache_dir();
    fs::create_dir_all(&cache_dir).map_err(|err| {
        format!(
            "No se pudo crear el directorio de caché {}: {}",
            cache_dir.display(),
            err
        )
    })?;

    let cache_file = waveform_cache_file(cache_key);
    let persisted = PersistedWaveformPreview {
        schema_version: CACHE_SCHEMA_VERSION,
        cache_key: cache_key.to_string(),
        preview: preview.clone(),
    };

    let payload = serde_json::to_vec(&persisted)
        .map_err(|err| format!("No se pudo serializar el caché persistente: {}", err))?;

    fs::write(&cache_file, payload).map_err(|err| {
        format!(
            "No se pudo escribir el caché persistente {}: {}",
            cache_file.display(),
            err
        )
    })
}

fn downsample_peaks(raw_peaks: &[f32], bucket_count: usize) -> Vec<u8> {
    if raw_peaks.is_empty() {
        return Vec::new();
    }

    let bucket_count = bucket_count.max(1);
    let mut buckets = Vec::with_capacity(bucket_count);

    if raw_peaks.len() <= bucket_count {
        for bucket_index in 0..bucket_count {
            let source_index = bucket_index * raw_peaks.len() / bucket_count;
            buckets.push(raw_peaks[source_index]);
        }
    } else {
        for bucket_index in 0..bucket_count {
            let start = bucket_index * raw_peaks.len() / bucket_count;
            let mut end = (bucket_index + 1) * raw_peaks.len() / bucket_count;
            if end <= start {
                end = (start + 1).min(raw_peaks.len());
            }

            let local_peak = raw_peaks[start..end]
                .iter()
                .copied()
                .fold(0.0_f32, f32::max);

            buckets.push(local_peak);
        }
    }

    let max_peak = buckets
        .iter()
        .copied()
        .fold(0.0_f32, f32::max)
        .max(0.000_001);

    buckets
        .into_iter()
        .map(|peak| ((peak / max_peak).clamp(0.0, 1.0) * 255.0).round() as u8)
        .collect()
}

fn compute_frequency_band_range(
    band_index: usize,
    band_count: usize,
    max_bin: usize,
) -> (usize, usize) {
    let min_bin = 1.0_f32;
    let max_bin = max_bin.max(2);
    let min_log = min_bin.ln();
    let max_log = (max_bin as f32).ln();
    let start_ratio = band_index as f32 / band_count as f32;
    let end_ratio = (band_index + 1) as f32 / band_count as f32;

    let start = (min_log + (max_log - min_log) * start_ratio).exp().floor() as usize;
    let mut end = (min_log + (max_log - min_log) * end_ratio).exp().ceil() as usize;

    let start = start.clamp(1, max_bin);
    end = end.clamp(start + 1, max_bin + 1);

    (start, end)
}

fn compute_frequency_bands(samples: &[f32], band_count: usize) -> Vec<u8> {
    if samples.is_empty() {
        return Vec::new();
    }

    let band_count = band_count.clamp(8, 48);
    let available_windows = samples.len().div_ceil(FFT_SIZE).max(1);
    let sampled_windows = available_windows.min(MAX_SPECTRUM_WINDOWS);

    let mut planner = RealFftPlanner::<f32>::new();
    let r2c = planner.plan_fft_forward(FFT_SIZE);
    let mut input = r2c.make_input_vec();
    let mut spectrum = r2c.make_output_vec();
    let mut scratch = r2c.make_scratch_vec();
    let mut bands = vec![0.0_f32; band_count];
    let mut processed_windows = 0usize;

    for window_index in 0..sampled_windows {
        let source_window = if sampled_windows == 1 {
            0
        } else {
            window_index * (available_windows.saturating_sub(1)) / (sampled_windows - 1)
        };
        let start_offset = source_window * FFT_SIZE;

        input.fill(0.0);
        for (sample_index, input_sample) in input.iter_mut().enumerate().take(FFT_SIZE) {
            let sample = samples
                .get(start_offset + sample_index)
                .copied()
                .unwrap_or(0.0);
            let hann = 0.5 - 0.5 * ((2.0 * PI * sample_index as f32) / FFT_SIZE as f32).cos();
            *input_sample = sample * hann;
        }

        if r2c
            .process_with_scratch(&mut input, &mut spectrum, &mut scratch)
            .is_err()
        {
            continue;
        }

        let max_bin = spectrum.len().saturating_sub(1);
        if max_bin <= 1 {
            continue;
        }

        for (band_index, band) in bands.iter_mut().enumerate().take(band_count) {
            let (start_bin, end_bin) =
                compute_frequency_band_range(band_index, band_count, max_bin);
            let mut magnitude_sum = 0.0_f32;
            let mut sample_count = 0usize;

            for value in spectrum.iter().take(end_bin).skip(start_bin) {
                magnitude_sum += (value.re * value.re + value.im * value.im).sqrt();
                sample_count += 1;
            }

            if sample_count > 0 {
                *band += magnitude_sum / sample_count as f32;
            }
        }

        processed_windows += 1;
    }

    if processed_windows == 0 {
        return vec![0; band_count];
    }

    for band in &mut bands {
        *band /= processed_windows as f32;
    }

    let max_band = bands.iter().copied().fold(0.0_f32, f32::max).max(0.000_001);

    bands
        .into_iter()
        .map(|band| ((band / max_band).clamp(0.0, 1.0) * 255.0).round() as u8)
        .collect()
}

fn extract_waveform_preview(path: &Path, bucket_count: usize) -> Result<WaveformPreview, String> {
    let src =
        File::open(path).map_err(|err| format!("No se pudo abrir {}: {}", path.display(), err))?;

    let mut hint = Hint::new();
    if let Some(extension) = path.extension().and_then(|ext| ext.to_str()) {
        hint.with_extension(extension);
    }

    let meta_opts: MetadataOptions = Default::default();
    let fmt_opts: FormatOptions = Default::default();
    let mss = MediaSourceStream::new(Box::new(src), Default::default());

    let probed = symphonia::default::get_probe()
        .format(&hint, mss, &fmt_opts, &meta_opts)
        .map_err(|err| format!("Formato no soportado para {}: {}", path.display(), err))?;

    let mut format = probed.format;
    let track = format
        .tracks()
        .iter()
        .find(|track| track.codec_params.codec != CODEC_TYPE_NULL)
        .ok_or_else(|| {
            format!(
                "No se encontró una pista de audio soportada en {}",
                path.display()
            )
        })?;

    let track_id = track.id;
    let mut decoder = symphonia::default::get_codecs()
        .make(&track.codec_params, &DecoderOptions::default())
        .map_err(|err| format!("Codec no soportado para {}: {}", path.display(), err))?;

    let mut coarse_peaks: Vec<f32> = Vec::new();
    let mut spectrum_samples: Vec<f32> = Vec::with_capacity(FFT_SIZE * MAX_SPECTRUM_WINDOWS);
    let mut block_peak = 0.0_f32;
    let mut block_frames = 0usize;

    loop {
        let packet = match format.next_packet() {
            Ok(packet) => packet,
            Err(Error::ResetRequired) => {
                return Err(format!(
                    "El stream cambió durante el decode de {} y no se pudo continuar",
                    path.display(),
                ));
            }
            Err(Error::IoError(_)) => break,
            Err(err) => {
                return Err(format!(
                    "No se pudo leer paquetes de audio de {}: {}",
                    path.display(),
                    err,
                ));
            }
        };

        while !format.metadata().is_latest() {
            format.metadata().pop();
        }

        if packet.track_id() != track_id {
            continue;
        }

        let decoded = match decoder.decode(&packet) {
            Ok(decoded) => decoded,
            Err(Error::IoError(_)) | Err(Error::DecodeError(_)) => continue,
            Err(err) => {
                return Err(format!(
                    "No se pudo decodificar audio de {}: {}",
                    path.display(),
                    err,
                ));
            }
        };

        let spec = *decoded.spec();
        let channels = spec.channels.count().max(1);
        let mut sample_buffer = SampleBuffer::<f32>::new(decoded.capacity() as u64, spec);
        sample_buffer.copy_interleaved_ref(decoded);

        for frame in sample_buffer.samples().chunks(channels) {
            let frame_peak = frame
                .iter()
                .fold(0.0_f32, |acc, sample| acc.max(sample.abs()));
            let mono_sample = frame.iter().copied().sum::<f32>() / channels as f32;

            if spectrum_samples.len() < FFT_SIZE * MAX_SPECTRUM_WINDOWS {
                spectrum_samples.push(mono_sample);
            }

            block_peak = block_peak.max(frame_peak);
            block_frames += 1;

            if block_frames >= BLOCK_FRAMES {
                coarse_peaks.push(block_peak);
                block_peak = 0.0;
                block_frames = 0;
            }
        }
    }

    if block_frames > 0 {
        coarse_peaks.push(block_peak);
    }

    if coarse_peaks.is_empty() {
        return Err(format!(
            "No se pudieron extraer muestras útiles de {}",
            path.display(),
        ));
    }

    Ok(WaveformPreview {
        peaks: downsample_peaks(&coarse_peaks, bucket_count),
        bucket_count,
        frequency_bands: compute_frequency_bands(&spectrum_samples, DEFAULT_FREQUENCY_BANDS),
        frequency_band_count: DEFAULT_FREQUENCY_BANDS,
        colors: Vec::new(),
        values_per_second: None,
        source: Some("decoded-audio".to_string()),
    })
}

#[tauri::command]
pub async fn get_waveform_preview(
    file_path: String,
    bucket_count: Option<usize>,
    vdj_folder: Option<String>,
    file_size: Option<u64>,
) -> Result<WaveformPreview, String> {
    let bucket_count = bucket_count.unwrap_or(64).clamp(16, 256);
    let path = PathBuf::from(&file_path);
    let vdj_folder_path = vdj_folder.as_deref().map(PathBuf::from);
    let metadata = fs::metadata(&path).ok();
    let resolved_file_size = metadata
        .as_ref()
        .map(|metadata| metadata.len())
        .or(file_size);

    if let Some(size) = resolved_file_size {
        if let Some(cached) =
            load_virtualdj_cached_waveform(vdj_folder_path.as_deref(), &path, size, bucket_count)
        {
            return Ok(cached);
        }
    }

    if metadata.as_ref().is_none_or(|metadata| !metadata.is_file()) {
        return Err(format!(
            "El archivo no existe o no es válido y no se encontró waveform cacheado: {}",
            file_path
        ));
    }

    let cache_key = build_cache_key(&path, bucket_count, vdj_folder_path.as_deref())?;

    if let Ok(cache) = waveform_cache().lock() {
        if let Some(cached) = cache.get(&cache_key).cloned() {
            return Ok(cached);
        }
    }

    if let Some(cached) = load_waveform_from_disk(&cache_key) {
        if let Ok(mut cache) = waveform_cache().lock() {
            cache.insert(cache_key.clone(), cached.clone());
        }
        return Ok(cached);
    }

    let _permit = waveform_semaphore().acquire().await.map_err(|err| {
        format!(
            "No se pudo reservar worker de waveform para {}: {}",
            file_path, err
        )
    })?;

    let path_for_task = path.clone();
    let waveform =
        tokio::task::spawn_blocking(move || extract_waveform_preview(&path_for_task, bucket_count))
            .await
            .map_err(|err| format!("La tarea de waveform falló para {}: {}", file_path, err))??;

    if let Ok(mut cache) = waveform_cache().lock() {
        cache.insert(cache_key.clone(), waveform.clone());
    }

    let _ = persist_waveform_to_disk(&cache_key, &waveform);

    Ok(waveform)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::{Connection, OpenFlags};

    fn unique_test_db_path(name: &str) -> PathBuf {
        let suffix = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        std::env::temp_dir().join(format!("vdj-manager-{name}-{suffix}.db"))
    }

    fn create_waveform_cache_db(path: &Path) {
        let conn = Connection::open(path).unwrap();
        conn.execute_batch(
            r#"
            CREATE TABLE waveforms (
                id INTEGER PRIMARY KEY,
                filepath TEXT,
                filename TEXT,
                filesize INTEGER,
                type INTEGER,
                version INTEGER,
                valuesPerSecond REAL,
                waveform BLOB
            );
            CREATE INDEX idx_waveform_filename ON waveforms (filename, type);
            "#,
        )
        .unwrap();
    }

    #[test]
    fn decodes_virtualdj_type_one_blob_into_downsampled_peaks_and_colors() {
        let waveform = vec![
            10, 20, 30, 4, 40, 50, 60, 8, 70, 80, 90, 16, 100, 110, 120, 32,
        ];

        let preview = decode_virtualdj_type_one_waveform(&waveform, 2, 12.5).unwrap();

        assert_eq!(preview.source.as_deref(), Some("virtualdj-cache"));
        assert_eq!(preview.bucket_count, 2);
        assert_eq!(preview.peaks, vec![64, 255]);
        assert_eq!(
            preview.colors,
            vec!["#28323c".to_string(), "#646e78".to_string()]
        );
        assert_eq!(preview.values_per_second, Some(12.5));
    }

    #[test]
    fn loads_virtualdj_waveform_cache_read_only_and_prefers_type_one_latest_version() {
        let db_path = unique_test_db_path("waveforms-readonly");
        create_waveform_cache_db(&db_path);

        {
            let conn = Connection::open(&db_path).unwrap();
            conn.execute(
                "INSERT INTO waveforms (filepath, filename, filesize, type, version, valuesPerSecond, waveform) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                (&"D:\\Music\\", &"Song.wav", 1234_i64, 0_i64, 4_i64, 8.0_f64, vec![1_u8; 28]),
            ).unwrap();
            conn.execute(
                "INSERT INTO waveforms (filepath, filename, filesize, type, version, valuesPerSecond, waveform) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                (&"D:\\Music\\", &"Song.wav", 1234_i64, 1_i64, 3_i64, 8.0_f64, vec![1_u8, 2, 3, 4]),
            ).unwrap();
            conn.execute(
                "INSERT INTO waveforms (filepath, filename, filesize, type, version, valuesPerSecond, waveform) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                (&"D:\\Music\\", &"Song.wav", 1234_i64, 1_i64, 4_i64, 8.0_f64, vec![100_u8, 110, 120, 40]),
            ).unwrap();
        }

        let preview = load_virtualdj_cached_waveform_from_db(
            &db_path,
            Path::new("D:\\Music\\Song.wav"),
            1234,
            16,
        )
        .unwrap()
        .unwrap();

        assert_eq!(preview.peaks, vec![255; 16]);
        assert_eq!(preview.colors, vec!["#646e78".to_string(); 16]);

        let readonly =
            Connection::open_with_flags(&db_path, OpenFlags::SQLITE_OPEN_READ_ONLY).unwrap();
        let row_count: i64 = readonly
            .query_row("SELECT COUNT(*) FROM waveforms", [], |row| row.get(0))
            .unwrap();
        assert_eq!(row_count, 3);

        let _ = fs::remove_file(db_path);
    }

    #[test]
    fn returns_none_when_virtualdj_cache_is_missing_or_does_not_match_file() {
        let db_path = unique_test_db_path("waveforms-missing");
        create_waveform_cache_db(&db_path);

        let preview = load_virtualdj_cached_waveform_from_db(
            &db_path,
            Path::new("E:\\Other\\Missing.wav"),
            4321,
            16,
        )
        .unwrap();

        assert!(preview.is_none());

        let _ = fs::remove_file(db_path);
    }
}
