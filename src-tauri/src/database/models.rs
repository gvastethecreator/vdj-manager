//! Data models for the VirtualDJ database XML schema.
//!
//! The XML structure is `<VirtualDJ_Database>` → `<Song>` with sub-elements
//! for `<Tags>`, `<Infos>`, `<Scan>`, `<Poi>`, `<Comment>`, `<CustomMix>`, `<Link>`.

use serde::{Deserialize, Serialize};

/// Root element of the VDJ database XML
#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename = "VirtualDJ_Database")]
pub struct VdjDatabase {
    #[serde(rename = "@Version", skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
    #[serde(rename = "Song", default, skip_serializing_if = "Vec::is_empty")]
    pub songs: Vec<Song>,
}

/// A single song entry in the database
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Song {
    #[serde(rename = "@FilePath")]
    pub file_path: String,
    #[serde(rename = "@FileSize", default, skip_serializing_if = "Option::is_none")]
    pub file_size: Option<u64>,
    #[serde(rename = "@Flag", default, skip_serializing_if = "Option::is_none")]
    pub flag: Option<u32>,
    #[serde(rename = "Tags", default, skip_serializing_if = "Option::is_none")]
    pub tags: Option<Tags>,
    #[serde(rename = "Infos", default, skip_serializing_if = "Option::is_none")]
    pub infos: Option<Infos>,
    #[serde(rename = "Scan", default, skip_serializing_if = "Option::is_none")]
    pub scan: Option<Scan>,
    #[serde(rename = "Poi", default, skip_serializing_if = "Vec::is_empty")]
    pub pois: Vec<Poi>,
    #[serde(rename = "Comment", default, skip_serializing_if = "Option::is_none")]
    pub comment: Option<CommentEl>,
    #[serde(rename = "CustomMix", default, skip_serializing_if = "Option::is_none")]
    pub custom_mix: Option<CommentEl>,
    #[serde(rename = "Link", default, skip_serializing_if = "Option::is_none")]
    pub link: Option<Link>,
}

/// ID3/metadata tags for a song (author, title, genre, etc.).
#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct Tags {
    #[serde(rename = "@Author", default, skip_serializing_if = "Option::is_none")]
    pub author: Option<String>,
    #[serde(rename = "@Title", default, skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(rename = "@Year", default, skip_serializing_if = "Option::is_none")]
    pub year: Option<String>,
    #[serde(rename = "@Genre", default, skip_serializing_if = "Option::is_none")]
    pub genre: Option<String>,
    #[serde(rename = "@Bpm", default, skip_serializing_if = "Option::is_none")]
    pub bpm: Option<String>,
    #[serde(rename = "@Key", default, skip_serializing_if = "Option::is_none")]
    pub key: Option<String>,
    #[serde(rename = "@Album", default, skip_serializing_if = "Option::is_none")]
    pub album: Option<String>,
    #[serde(rename = "@Composer", default, skip_serializing_if = "Option::is_none")]
    pub composer: Option<String>,
    #[serde(rename = "@Label", default, skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
    #[serde(rename = "@TrackNumber", default, skip_serializing_if = "Option::is_none")]
    pub track_number: Option<String>,
    #[serde(rename = "@Remix", default, skip_serializing_if = "Option::is_none")]
    pub remix: Option<String>,
    #[serde(rename = "@Stars", default, skip_serializing_if = "Option::is_none")]
    pub stars: Option<String>,
    #[serde(rename = "@Remixer", default, skip_serializing_if = "Option::is_none")]
    pub remixer: Option<String>,
    #[serde(rename = "@Grouping", default, skip_serializing_if = "Option::is_none")]
    pub grouping: Option<String>,
    #[serde(rename = "@User1", default, skip_serializing_if = "Option::is_none")]
    pub user1: Option<String>,
    #[serde(rename = "@User2", default, skip_serializing_if = "Option::is_none")]
    pub user2: Option<String>,
    #[serde(rename = "@Internal", default, skip_serializing_if = "Option::is_none")]
    pub internal: Option<String>,
    #[serde(rename = "@Flag", default, skip_serializing_if = "Option::is_none")]
    pub flag: Option<String>,
}

/// Playback / analysis metadata (duration, bitrate, cover, play history).
#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct Infos {
    #[serde(rename = "@SongLength", default, skip_serializing_if = "Option::is_none")]
    pub song_length: Option<String>,
    #[serde(rename = "@Bitrate", default, skip_serializing_if = "Option::is_none")]
    pub bitrate: Option<String>,
    #[serde(rename = "@Cover", default, skip_serializing_if = "Option::is_none")]
    pub cover: Option<String>,
    #[serde(rename = "@Color", default, skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
    #[serde(rename = "@FirstSeen", default, skip_serializing_if = "Option::is_none")]
    pub first_seen: Option<String>,
    #[serde(rename = "@FirstPlay", default, skip_serializing_if = "Option::is_none")]
    pub first_play: Option<String>,
    #[serde(rename = "@LastPlay", default, skip_serializing_if = "Option::is_none")]
    pub last_play: Option<String>,
    #[serde(rename = "@PlayCount", default, skip_serializing_if = "Option::is_none")]
    pub play_count: Option<String>,
    #[serde(rename = "@Corrupted", default, skip_serializing_if = "Option::is_none")]
    pub corrupted: Option<String>,
    #[serde(rename = "@Gain", default, skip_serializing_if = "Option::is_none")]
    pub gain: Option<String>,
    #[serde(rename = "@UserColor", default, skip_serializing_if = "Option::is_none")]
    pub user_color: Option<String>,
}

/// Audio analysis scan data (BPM as period, key, volume).
#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct Scan {
    #[serde(rename = "@Version", default, skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
    #[serde(rename = "@Flag", default, skip_serializing_if = "Option::is_none")]
    pub flag: Option<String>,
    #[serde(rename = "@Volume", default, skip_serializing_if = "Option::is_none")]
    pub volume: Option<String>,
    #[serde(rename = "@Bpm", default, skip_serializing_if = "Option::is_none")]
    pub bpm: Option<String>,
    #[serde(rename = "@AltBpm", default, skip_serializing_if = "Option::is_none")]
    pub alt_bpm: Option<String>,
    #[serde(rename = "@Key", default, skip_serializing_if = "Option::is_none")]
    pub key: Option<String>,
}

/// Cue point / point-of-interest marker.
#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct Poi {
    #[serde(rename = "@Pos", default, skip_serializing_if = "Option::is_none")]
    pub pos: Option<String>,
    #[serde(rename = "@Type", default, skip_serializing_if = "Option::is_none")]
    pub poi_type: Option<String>,
    #[serde(rename = "@Point", default, skip_serializing_if = "Option::is_none")]
    pub point: Option<String>,
    #[serde(rename = "@Name", default, skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(rename = "@Num", default, skip_serializing_if = "Option::is_none")]
    pub num: Option<String>,
    #[serde(rename = "@Bpm", default, skip_serializing_if = "Option::is_none")]
    pub bpm: Option<String>,
    #[serde(rename = "@Size", default, skip_serializing_if = "Option::is_none")]
    pub size: Option<String>,
    #[serde(rename = "@Color", default, skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
    #[serde(rename = "@Slot", default, skip_serializing_if = "Option::is_none")]
    pub slot: Option<String>,
}

/// Text content element (used for Comment and CustomMix).
#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct CommentEl {
    #[serde(rename = "$text", default, skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
}

/// Linked source reference.
#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct Link {
    #[serde(rename = "@Src", default, skip_serializing_if = "Option::is_none")]
    pub src: Option<String>,
}

// ───── Derived / frontend-friendly types ─────

/// Lightweight cue marker sent to the frontend for waveform overlays.
#[derive(Debug, Serialize, Clone)]
pub struct CueMarker {
    /// Position in seconds (fractional).
    pub pos: f64,
    /// VDJ Poi type (e.g. "cue", "beatgrid", "automix", etc.).
    pub poi_type: Option<String>,
    /// User-assigned name for this cue.
    pub name: Option<String>,
    /// CSS-ready colour (parsed from VDJ COLORREF).
    pub color: Option<String>,
    /// Cue number / slot.
    pub num: Option<u32>,
}

#[derive(Debug, Serialize, Clone)]
pub struct SongSummary {
    pub index: usize,
    pub in_database: bool,
    pub file_path: String,
    pub file_name: String,
    pub file_size: Option<u64>,
    pub title: Option<String>,
    pub author: Option<String>,
    pub album: Option<String>,
    pub genre: Option<String>,
    pub year: Option<String>,
    pub bpm: Option<f64>,
    pub key: Option<String>,
    pub duration_secs: Option<f64>,
    pub bitrate: Option<String>,
    pub play_count: Option<u32>,
    pub stars: Option<String>,
    pub cue_count: usize,
    /// Cue markers with position/colour for waveform overlays.
    pub cue_markers: Vec<CueMarker>,
    // ── Extended tags from VDJ Tag Editor ──
    pub remix: Option<String>,
    pub remixer: Option<String>,
    pub composer: Option<String>,
    pub label: Option<String>,
    pub track_number: Option<String>,
    pub grouping: Option<String>,
    pub comment: Option<String>,
    pub user1: Option<String>,
    pub user2: Option<String>,
    // ── Extended Infos ──
    pub color: Option<String>,
    pub user_color: Option<String>,
    pub gain: Option<String>,
    pub first_seen: Option<String>,
    pub first_play: Option<String>,
    pub last_play: Option<String>,
    // ── Derived ──
    pub has_stems: bool,
}

/// Fields accepted by the single-song, patch-in-place writer.
///
/// This is deliberately separate from [`SongUpdate`], which still carries the
/// positional index used by the legacy batch save command.  The inline writer
/// must never use that index as its identity.
#[derive(Debug, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct InlineSongUpdate {
    pub title: Option<String>,
    pub author: Option<String>,
    pub album: Option<String>,
    pub genre: Option<String>,
    pub year: Option<String>,
    pub key: Option<String>,
    pub bpm: Option<String>,
    pub grouping: Option<String>,
    pub label: Option<String>,
    pub remix: Option<String>,
    pub remixer: Option<String>,
    pub composer: Option<String>,
    pub track_number: Option<String>,
    pub stars: Option<String>,
    pub user1: Option<String>,
    pub user2: Option<String>,
    pub comment_text: Option<String>,
    pub color: Option<String>,
    pub gain: Option<String>,
}

impl InlineSongUpdate {
    /// Return the public field names that will be touched by this update.
    pub fn updated_fields(&self) -> Vec<String> {
        let mut fields = Vec::new();
        macro_rules! push_if_some {
            ($field:ident, $name:literal) => {
                if self.$field.is_some() {
                    fields.push($name.to_string());
                }
            };
        }
        push_if_some!(title, "title");
        push_if_some!(author, "author");
        push_if_some!(album, "album");
        push_if_some!(genre, "genre");
        push_if_some!(year, "year");
        push_if_some!(key, "key");
        push_if_some!(bpm, "bpm");
        push_if_some!(grouping, "grouping");
        push_if_some!(label, "label");
        push_if_some!(remix, "remix");
        push_if_some!(remixer, "remixer");
        push_if_some!(composer, "composer");
        push_if_some!(track_number, "trackNumber");
        push_if_some!(stars, "stars");
        push_if_some!(user1, "user1");
        push_if_some!(user2, "user2");
        push_if_some!(comment_text, "commentText");
        push_if_some!(color, "color");
        push_if_some!(gain, "gain");
        fields
    }
}

/// Machine-readable result for the single-song patch-in-place writer.
#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "snake_case")]
pub enum UpdateSongTagsStatus {
    Completed,
    FailedValidation,
    NotFound,
    UnsafeToPatch,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSongTagsResult {
    pub status: UpdateSongTagsStatus,
    pub original_file_path: String,
    pub current_file_path: String,
    pub updated_fields: Vec<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct DatabaseStats {
    pub total_songs: usize,
    pub total_size_bytes: u64,
    pub genres: Vec<(String, usize)>,
    pub artists: Vec<(String, usize)>,
    pub years: Vec<(String, usize)>,
    pub avg_bpm: Option<f64>,
    pub songs_with_cues: usize,
    pub songs_with_tags: usize,
}

#[derive(Debug, Serialize, Clone)]
pub struct FileVerification {
    pub file_path: String,
    pub title: Option<String>,
    pub author: Option<String>,
    pub exists: bool,
    pub size_match: bool,
    pub expected_size: Option<u64>,
    pub actual_size: Option<u64>,
}

/// A structured candidate returned by the backend relink scorer.
///
/// The backend owns both the score and the ordering.  Consumers may decorate
/// these values for display, but must not recompute or reorder them as a new
/// source of truth.
#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SimilarFileCandidate {
    pub path: String,
    pub score: i32,
    pub reasons: Vec<String>,
    pub same_extension: bool,
    pub same_stem: bool,
    pub same_name: bool,
    pub size_match: bool,
}

/// Candidates for one missing database entry.
#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SimilarFileMatch {
    pub status: SimilarFileMatchStatus,
    pub original_file_path: String,
    pub candidates: Vec<SimilarFileCandidate>,
    pub message: Option<String>,
}

#[derive(Debug, Serialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SimilarFileMatchStatus {
    Completed,
    NotFound,
    ManualReviewRequired,
}

/// Machine-readable result of a single-item path reconciliation.
#[derive(Debug, Serialize, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum RelinkFileStatus {
    Completed,
    FailedValidation,
    ReferenceCollision,
    ManualReviewRequired,
    NotFound,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RelinkFileResult {
    pub status: RelinkFileStatus,
    pub original_file_path: String,
    pub new_file_path: String,
    pub file_size: Option<u64>,
    pub collision_path: Option<String>,
    pub message: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct DuplicateGroup {
    pub key: String,
    pub songs: Vec<SongSummary>,
}

impl Song {
    /// Convert a raw [`Song`] to a frontend-friendly [`SongSummary`].
    ///
    /// BPM is converted from the Scan period (1/bpm) to actual beats-per-minute.
    pub fn to_summary(&self, index: usize) -> SongSummary {
        let file_name = std::path::Path::new(&self.file_path)
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_default();

        let bpm = self
            .scan
            .as_ref()
            .and_then(|s| s.bpm.as_ref())
            .and_then(|b| b.parse::<f64>().ok())
            .map(|v| if v > 0.0 { 60.0 / v } else { 0.0 });

        let duration_secs = self
            .infos
            .as_ref()
            .and_then(|i| i.song_length.as_ref())
            .and_then(|s| s.parse::<f64>().ok());

        let play_count = self
            .infos
            .as_ref()
            .and_then(|i| i.play_count.as_ref())
            .and_then(|s| s.parse::<u32>().ok());

        // Check if .vdjstems file exists alongside the audio file
        let has_stems = {
            let p = std::path::Path::new(&self.file_path);
            let stems_path = p.with_extension("vdjstems");
            stems_path.exists()
        };

        let mut cue_markers: Vec<CueMarker> = self.pois.iter().filter_map(|p| {
            let pos = p.pos.as_ref()?.parse::<f64>().ok()?;
            let pt = p.poi_type.as_deref().unwrap_or("");
            if pt.eq_ignore_ascii_case("beatgrid") || pt.eq_ignore_ascii_case("automix") {
                return None;
            }

            let color = p.color.as_ref().and_then(|c| {
                if c.starts_with('#') {
                    return Some(c.clone());
                }
                let n = c.parse::<u32>().ok()?;
                if n == 0 { return None; }
                let r = n & 0xff;
                let g = (n >> 8) & 0xff;
                let b = (n >> 16) & 0xff;
                Some(format!("#{:02x}{:02x}{:02x}", r, g, b))
            });

            Some(CueMarker {
                pos,
                poi_type: p.poi_type.clone(),
                name: p.name.clone(),
                color,
                num: p.num.as_ref().and_then(|n| n.parse::<u32>().ok()),
            })
        }).collect();
        cue_markers.sort_by(|a, b| {
            a.pos
                .partial_cmp(&b.pos)
                .unwrap_or(std::cmp::Ordering::Equal)
                .then_with(|| a.num.cmp(&b.num))
        });
        let cue_count = cue_markers.len();

        SongSummary {
            index,
            in_database: true,
            file_path: self.file_path.clone(),
            file_name,
            file_size: self.file_size,
            title: self.tags.as_ref().and_then(|t| t.title.clone()),
            author: self.tags.as_ref().and_then(|t| t.author.clone()),
            album: self.tags.as_ref().and_then(|t| t.album.clone()),
            genre: self.tags.as_ref().and_then(|t| t.genre.clone()),
            year: self.tags.as_ref().and_then(|t| t.year.clone()),
            bpm,
            key: self
                .scan
                .as_ref()
                .and_then(|s| s.key.clone())
                .or_else(|| self.tags.as_ref().and_then(|t| t.key.clone())),
            duration_secs,
            bitrate: self.infos.as_ref().and_then(|i| i.bitrate.clone()),
            play_count,
            stars: self.tags.as_ref().and_then(|t| t.stars.clone()),
            cue_count,
            cue_markers,
            // Extended tags
            remix: self.tags.as_ref().and_then(|t| t.remix.clone()),
            remixer: self.tags.as_ref().and_then(|t| t.remixer.clone()),
            composer: self.tags.as_ref().and_then(|t| t.composer.clone()),
            label: self.tags.as_ref().and_then(|t| t.label.clone()),
            track_number: self.tags.as_ref().and_then(|t| t.track_number.clone()),
            grouping: self.tags.as_ref().and_then(|t| t.grouping.clone()),
            comment: self.comment.as_ref().and_then(|c| c.text.clone()),
            user1: self.tags.as_ref().and_then(|t| t.user1.clone()),
            user2: self.tags.as_ref().and_then(|t| t.user2.clone()),
            // Extended infos
            color: self.infos.as_ref().and_then(|i| i.color.clone()),
            user_color: self.infos.as_ref().and_then(|i| i.user_color.clone()),
            gain: self.infos.as_ref().and_then(|i| i.gain.clone()),
            first_seen: self.infos.as_ref().and_then(|i| i.first_seen.clone()),
            first_play: self.infos.as_ref().and_then(|i| i.first_play.clone()),
            last_play: self.infos.as_ref().and_then(|i| i.last_play.clone()),
            has_stems,
        }
    }
}
