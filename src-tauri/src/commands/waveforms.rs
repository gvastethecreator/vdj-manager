//! Tauri command for extracting compact waveform previews from media files.

use std::collections::HashMap;
use std::f32::consts::PI;
use std::fs::{self, File};
use std::path::{Path, PathBuf};
use std::sync::{Mutex, OnceLock};

use dirs::cache_dir;
use md5::{Digest, Md5};
use realfft::RealFftPlanner;
use symphonia::core::audio::SampleBuffer;
use symphonia::core::codecs::{CODEC_TYPE_NULL, DecoderOptions};
use symphonia::core::errors::Error;
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::MetadataOptions;
use symphonia::core::probe::Hint;

const CACHE_SCHEMA_VERSION: u32 = 2;
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

fn build_cache_key(path: &Path, bucket_count: usize) -> Result<String, String> {
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
    ))
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
    fs::create_dir_all(&cache_dir)
        .map_err(|err| format!("No se pudo crear el directorio de caché {}: {}", cache_dir.display(), err))?;

    let cache_file = waveform_cache_file(cache_key);
    let persisted = PersistedWaveformPreview {
        schema_version: CACHE_SCHEMA_VERSION,
        cache_key: cache_key.to_string(),
        preview: preview.clone(),
    };

    let payload = serde_json::to_vec(&persisted)
        .map_err(|err| format!("No se pudo serializar el caché persistente: {}", err))?;

    fs::write(&cache_file, payload)
        .map_err(|err| format!("No se pudo escribir el caché persistente {}: {}", cache_file.display(), err))
}

fn downsample_peaks(raw_peaks: &[f32], bucket_count: usize) -> Vec<u8> {
    if raw_peaks.is_empty() {
        return Vec::new();
    }

    let bucket_count = bucket_count.clamp(16, 256);
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

    let max_peak = buckets.iter().copied().fold(0.0_f32, f32::max).max(0.000_001);

    buckets
        .into_iter()
        .map(|peak| ((peak / max_peak).clamp(0.0, 1.0) * 255.0).round() as u8)
        .collect()
}

fn compute_frequency_band_range(band_index: usize, band_count: usize, max_bin: usize) -> (usize, usize) {
    let min_bin = 1.0_f32;
    let max_bin = max_bin.max(2);
    let min_log = min_bin.ln();
    let max_log = (max_bin as f32).ln();
    let start_ratio = band_index as f32 / band_count as f32;
    let end_ratio = (band_index + 1) as f32 / band_count as f32;

    let start = (min_log + (max_log - min_log) * start_ratio)
        .exp()
        .floor() as usize;
    let mut end = (min_log + (max_log - min_log) * end_ratio)
        .exp()
        .ceil() as usize;

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
        for sample_index in 0..FFT_SIZE {
            let sample = samples.get(start_offset + sample_index).copied().unwrap_or(0.0);
            let hann = 0.5 - 0.5 * ((2.0 * PI * sample_index as f32) / FFT_SIZE as f32).cos();
            input[sample_index] = sample * hann;
        }

        if r2c.process_with_scratch(&mut input, &mut spectrum, &mut scratch).is_err() {
            continue;
        }

        let max_bin = spectrum.len().saturating_sub(1);
        if max_bin <= 1 {
            continue;
        }

        for band_index in 0..band_count {
            let (start_bin, end_bin) = compute_frequency_band_range(band_index, band_count, max_bin);
            let mut magnitude_sum = 0.0_f32;
            let mut sample_count = 0usize;

            for bin_index in start_bin..end_bin {
                let value = &spectrum[bin_index];
                magnitude_sum += (value.re * value.re + value.im * value.im).sqrt();
                sample_count += 1;
            }

            if sample_count > 0 {
                bands[band_index] += magnitude_sum / sample_count as f32;
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
    let src = File::open(path)
        .map_err(|err| format!("No se pudo abrir {}: {}", path.display(), err))?;

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
        .ok_or_else(|| format!("No se encontró una pista de audio soportada en {}", path.display()))?;

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
    })
}

#[tauri::command]
pub async fn get_waveform_preview(
    file_path: String,
    bucket_count: Option<usize>,
) -> Result<WaveformPreview, String> {
    let bucket_count = bucket_count.unwrap_or(64).clamp(16, 256);
    let path = PathBuf::from(&file_path);

    if !path.exists() || !path.is_file() {
        return Err(format!("El archivo no existe o no es válido: {}", file_path));
    }

    let cache_key = build_cache_key(&path, bucket_count)?;

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

    let _permit = waveform_semaphore()
        .acquire()
        .await
        .map_err(|err| format!("No se pudo reservar worker de waveform para {}: {}", file_path, err))?;

    let path_for_task = path.clone();
    let waveform = tokio::task::spawn_blocking(move || {
        extract_waveform_preview(&path_for_task, bucket_count)
    })
    .await
    .map_err(|err| format!("La tarea de waveform falló para {}: {}", file_path, err))??;

    if let Ok(mut cache) = waveform_cache().lock() {
        cache.insert(cache_key.clone(), waveform.clone());
    }

    let _ = persist_waveform_to_disk(&cache_key, &waveform);

    Ok(waveform)
}