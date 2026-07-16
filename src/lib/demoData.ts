import type { DatabaseStats, Page, SongSummary } from "../types/database";

export const DEMO_FOLDER = "D:\\Users\\DJ\\Documents\\VirtualDJ";
export const DEMO_MUSIC_ROOTS = [
  "D:\\Music\\Club",
  "D:\\Music\\Latin",
  "D:\\Music\\Edits",
];

export const demoSongs: SongSummary[] = [
  {
    index: 0,
    in_database: true,
    file_path: "D:\\Music\\Club\\Disclosure - You & Me.flac",
    file_name: "Disclosure - You & Me.flac",
    file_size: 53194240,
    title: "You & Me",
    author: "Disclosure",
    album: "Settle",
    genre: "House",
    year: "2013",
    bpm: 124.0,
    key: "8A",
    duration_secs: 276,
    bitrate: "1024",
    play_count: 42,
    stars: "5",
    cue_count: 6,
    cue_markers: [
      { pos: 0, poi_type: "cue", name: "Intro", color: "#38bdf8", num: 1 },
      { pos: 64, poi_type: "cue", name: "Drop", color: "#f472b6", num: 2 },
    ],
    remix: null,
    remixer: null,
    composer: null,
    label: "PMR",
    track_number: "1",
    grouping: "Peak",
    comment: "Main room favorite",
    user1: "Energy 4",
    user2: "Vocals",
    color: "16753920",
    user_color: "#38bdf8",
    gain: "-1.2",
    first_seen: "2025-09-12",
    first_play: "2025-09-18",
    last_play: "2026-04-20",
    has_stems: true,
  },
  {
    index: 1,
    in_database: true,
    file_path: "D:\\Music\\Latin\\Bomba Estereo - To My Love.mp3",
    file_name: "Bomba Estereo - To My Love.mp3",
    file_size: 10280960,
    title: "To My Love",
    author: "Bomba Estereo",
    album: "Amanecer",
    genre: "Latin House",
    year: "2015",
    bpm: 120.5,
    key: "9B",
    duration_secs: 221,
    bitrate: "320",
    play_count: 31,
    stars: "4",
    cue_count: 4,
    cue_markers: [{ pos: 32, poi_type: "cue", name: "Vocal", color: "#facc15", num: 1 }],
    remix: "Moombahton Edit",
    remixer: "Demo Edit",
    composer: null,
    label: "Sony",
    track_number: "3",
    grouping: "Warm",
    comment: null,
    user1: "Latin",
    user2: null,
    color: null,
    user_color: "#f59e0b",
    gain: "-0.4",
    first_seen: "2025-11-03",
    first_play: "2025-11-07",
    last_play: "2026-04-12",
    has_stems: false,
  },
  {
    index: 2,
    in_database: true,
    file_path: "D:\\Music\\Edits\\Peggy Gou - Starry Night (Short Edit).wav",
    file_name: "Peggy Gou - Starry Night (Short Edit).wav",
    file_size: 71147520,
    title: "Starry Night",
    author: "Peggy Gou",
    album: "DJ Edits",
    genre: "Deep House",
    year: "2019",
    bpm: 123.0,
    key: "7A",
    duration_secs: 196,
    bitrate: "1411",
    play_count: 57,
    stars: "5",
    cue_count: 8,
    cue_markers: [{ pos: 16, poi_type: "cue", name: "Hook", color: "#22c55e", num: 1 }],
    remix: "Short Edit",
    remixer: "Demo Edit",
    composer: null,
    label: "Gudu",
    track_number: "8",
    grouping: "Bridge",
    comment: "Works after latin percussion",
    user1: "Energy 3",
    user2: "Female vocal",
    color: null,
    user_color: "#22c55e",
    gain: "0.0",
    first_seen: "2025-08-18",
    first_play: "2025-08-25",
    last_play: "2026-04-21",
    has_stems: true,
  },
  {
    index: 3,
    in_database: true,
    file_path: "D:\\Music\\Club\\Fred again.. - Delilah.mp3",
    file_name: "Fred again.. - Delilah.mp3",
    file_size: 9482240,
    title: "Delilah",
    author: "Fred again..",
    album: "Actual Life 3",
    genre: "UK Garage",
    year: "2022",
    bpm: 133.0,
    key: "2A",
    duration_secs: 247,
    bitrate: "320",
    play_count: 18,
    stars: "4",
    cue_count: 3,
    cue_markers: [],
    remix: null,
    remixer: null,
    composer: null,
    label: "Atlantic",
    track_number: null,
    grouping: "Late",
    comment: null,
    user1: null,
    user2: null,
    color: null,
    user_color: "#a78bfa",
    gain: "-2.0",
    first_seen: "2026-01-04",
    first_play: "2026-01-10",
    last_play: "2026-03-29",
    has_stems: false,
  },
  {
    index: 4,
    in_database: true,
    file_path: "D:\\Music\\Club\\Kaytranada - Lite Spots.mp3",
    file_name: "Kaytranada - Lite Spots.mp3",
    file_size: 8811520,
    title: "Lite Spots",
    author: "Kaytranada",
    album: "99.9%",
    genre: "Funk",
    year: "2016",
    bpm: 107.0,
    key: "11B",
    duration_secs: 234,
    bitrate: "320",
    play_count: 26,
    stars: "4",
    cue_count: 5,
    cue_markers: [],
    remix: null,
    remixer: null,
    composer: null,
    label: "XL",
    track_number: "4",
    grouping: "Groove",
    comment: "Transition tool",
    user1: "Energy 2",
    user2: null,
    color: null,
    user_color: "#f472b6",
    gain: "-0.8",
    first_seen: "2025-07-14",
    first_play: "2025-07-20",
    last_play: "2026-04-02",
    has_stems: false,
  },
  {
    index: 5,
    in_database: false,
    file_path: "D:\\Music\\Incoming\\Unknown - Need Tags.aiff",
    file_name: "Unknown - Need Tags.aiff",
    file_size: null,
    title: null,
    author: null,
    album: null,
    genre: null,
    year: null,
    bpm: null,
    key: null,
    duration_secs: null,
    bitrate: null,
    play_count: null,
    stars: null,
    cue_count: 0,
    cue_markers: [],
    remix: null,
    remixer: null,
    composer: null,
    label: null,
    track_number: null,
    grouping: null,
    comment: "Archivo detectado fuera de database.xml",
    user1: null,
    user2: null,
    color: null,
    user_color: null,
    gain: null,
    first_seen: null,
    first_play: null,
    last_play: null,
    has_stems: false,
  },
];

export const demoStats: DatabaseStats = {
  total_songs: demoSongs.filter((song) => song.in_database).length,
  total_size_bytes: demoSongs.reduce((total, song) => total + (song.file_size ?? 0), 0),
  genres: [
    ["House", 2],
    ["Latin House", 1],
    ["Deep House", 1],
    ["UK Garage", 1],
    ["Funk", 1],
  ],
  artists: [
    ["Peggy Gou", 1],
    ["Disclosure", 1],
    ["Bomba Estereo", 1],
    ["Fred again..", 1],
    ["Kaytranada", 1],
  ],
  years: [
    ["2013", 1],
    ["2015", 1],
    ["2016", 1],
    ["2019", 1],
    ["2022", 1],
  ],
  avg_bpm: 121.5,
  songs_with_cues: 5,
  songs_with_tags: 5,
};

function statsForSongs(songs: SongSummary[]): DatabaseStats {
  const catalogued = songs.filter((song) => song.in_database);
  const countBy = (selector: (song: SongSummary) => string | null | undefined) => {
    const counts = new Map<string, number>();
    for (const song of catalogued) {
      const value = selector(song);
      if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  };
  const bpms = catalogued.flatMap((song) => song.bpm == null ? [] : [song.bpm]);
  return {
    total_songs: catalogued.length,
    total_size_bytes: catalogued.reduce((total, song) => total + (song.file_size ?? 0), 0),
    genres: countBy((song) => song.genre),
    artists: countBy((song) => song.author),
    years: countBy((song) => song.year),
    avg_bpm: bpms.length ? bpms.reduce((total, bpm) => total + bpm, 0) / bpms.length : null,
    songs_with_cues: catalogued.filter((song) => song.cue_count > 0).length,
    songs_with_tags: catalogued.filter((song) => song.title || song.author || song.genre).length,
  };
}

export function demoSongsForScenario(scenario: string): SongSummary[] {
  if (scenario === "empty") return [];
  if (scenario !== "dense") return demoSongs;
  const bases = demoSongs.filter((song) => song.in_database);
  return Array.from({ length: 160 }, (_, index) => {
    const base = bases[index % bases.length];
    const number = String(index + 1).padStart(3, "0");
    const artist = base.author ?? "Demo Artist";
    const title = `${base.title ?? "Untitled"} · Library Cut ${number}`;
    const fileName = `${artist} - ${title}.mp3`;
    return {
      ...base,
      index,
      file_name: fileName,
      file_path: `D:\\Music\\Archive\\2020s\\Curated Sets and Extended Versions\\${artist}\\Season ${Math.floor(index / 20) + 1}\\${fileName}`,
      title,
      play_count: (base.play_count ?? 0) + index,
    };
  });
}

const demoPages = new Set<Page>([
  "home",
  "dashboard",
  "songs",
  "playlists",
  "duplicates",
  "missing",
  "relink",
  "orphans",
  "batch",
  "configs",
  "pads",
  "mappers",
]);

export function isDemoMode(): boolean {
  return new URLSearchParams(window.location.search).has("demo");
}

export function getDemoInitialPage(): Page {
  const page = new URLSearchParams(window.location.search).get("page") as Page | null;
  return page && demoPages.has(page) ? page : "dashboard";
}

export function getDemoAppState(search = window.location.search) {
  const scenario = new URLSearchParams(search).get("state") ?? "healthy";
  if (scenario === "first-run") {
    return {
      vdjFolder: null,
      songs: [],
      stats: null,
      musicFolders: [],
    };
  }
  const songs = demoSongsForScenario(scenario);
  return {
    vdjFolder: DEMO_FOLDER,
    songs,
    stats: scenario === "healthy" || scenario === "problem" || scenario === "unverified" ? demoStats : statsForSongs(songs),
    musicFolders: DEMO_MUSIC_ROOTS,
  };
}
