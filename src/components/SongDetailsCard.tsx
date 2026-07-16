import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Clock3, Database, FileAudio2, RotateCcw, Save } from "lucide-react";
import { useApp } from "../App";
import type { SongSummary } from "../types/database";
import { formatDuration, formatSize, getEffectiveColor } from "../lib/api";
import { shouldApplySongUpdate } from "../lib/songUpdateResult";
import { WaveformPreview } from "./WaveformPreview";

interface TagFormState {
  title: string;
  author: string;
  remix: string;
  album: string;
  remixer: string;
  composer: string;
  label: string;
  genre: string;
  year: string;
  trackNumber: string;
  grouping: string;
  bpm: string;
  key: string;
  gain: string;
  stars: string;
  commentText: string;
  user1: string;
  user2: string;
  color: string;
}

function valueOf(value: string | number | null | undefined): string {
  return value == null ? "" : String(value);
}

function formFromSong(song: SongSummary, color: string | null): TagFormState {
  return {
    title: valueOf(song.title),
    author: valueOf(song.author),
    remix: valueOf(song.remix),
    album: valueOf(song.album),
    remixer: valueOf(song.remixer),
    composer: valueOf(song.composer),
    label: valueOf(song.label),
    genre: valueOf(song.genre),
    year: valueOf(song.year),
    trackNumber: valueOf(song.track_number),
    grouping: valueOf(song.grouping),
    bpm: song.bpm == null ? "" : song.bpm.toFixed(2),
    key: valueOf(song.key),
    gain: valueOf(song.gain),
    stars: valueOf(song.stars),
    commentText: valueOf(song.comment),
    user1: valueOf(song.user1),
    user2: valueOf(song.user2),
    color: color ?? "#8258df",
  };
}

function nullable(value: string): string | null {
  return value.trim() || null;
}

function colorRef(hex: string): string {
  const normalized = hex.replace("#", "");
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return String((b << 16) | (g << 8) | r);
}

function songPatch(form: TagFormState, includeColor: boolean): Partial<SongSummary> {
  const bpm = Number.parseFloat(form.bpm);
  return {
    title: nullable(form.title),
    author: nullable(form.author),
    remix: nullable(form.remix),
    album: nullable(form.album),
    remixer: nullable(form.remixer),
    composer: nullable(form.composer),
    label: nullable(form.label),
    genre: nullable(form.genre),
    year: nullable(form.year),
    track_number: nullable(form.trackNumber),
    grouping: nullable(form.grouping),
    bpm: Number.isFinite(bpm) ? bpm : null,
    key: nullable(form.key),
    gain: nullable(form.gain),
    stars: nullable(form.stars),
    comment: nullable(form.commentText),
    user1: nullable(form.user1),
    user2: nullable(form.user2),
    ...(includeColor ? { color: colorRef(form.color) } : {}),
  };
}

function tagUpdate(form: TagFormState, includeColor: boolean) {
  return {
    title: form.title,
    author: form.author,
    remix: form.remix,
    album: form.album,
    remixer: form.remixer,
    composer: form.composer,
    label: form.label,
    genre: form.genre,
    year: form.year,
    trackNumber: form.trackNumber,
    grouping: form.grouping,
    bpm: form.bpm,
    key: form.key,
    gain: form.gain,
    stars: form.stars,
    commentText: form.commentText,
    user1: form.user1,
    user2: form.user2,
    ...(includeColor ? { color: colorRef(form.color) } : {}),
  };
}

function Field({ label, value, disabled, onChange }: { label: string; value: string; disabled: boolean; onChange: (value: string) => void }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-medium text-text-muted">{label}</span>
      <input className="input w-full" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function ReadonlyRow({ label, value, title }: { label: string; value: string; title?: string }) {
  return (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2 border-b border-border/60 py-2 last:border-0">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="truncate text-xs text-text-secondary" title={title ?? value}>{value || "—"}</span>
    </div>
  );
}

/** Contextual inspector: common metadata first, advanced editing behind disclosure. */
export function SongDetailsCard({ song }: { song: SongSummary }) {
  const { vdjFolder, patchSong, clearUiError, reportUiError, refreshRecovery, mutationsBlocked, services } = useApp();
  const rowColor = getEffectiveColor(song);
  const [form, setForm] = useState<TagFormState>(() => formFromSong(song, rowColor));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setForm(formFromSong(song, getEffectiveColor(song)));
    setStatus(null);
  }, [song]);

  const initial = useMemo(() => formFromSong(song, rowColor), [rowColor, song]);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const editable = song.in_database && Boolean(vdjFolder) && !mutationsBlocked;

  const setField = <K extends keyof TagFormState>(field: K, value: TagFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setStatus(null);
  };

  const reset = () => {
    setForm(initial);
    setStatus(null);
  };

  const save = async () => {
    if (!editable || !vdjFolder || saving) return;
    setSaving(true);
    clearUiError();
    try {
      const includeColor = Boolean(rowColor) || form.color !== initial.color;
      const result = await services.updateSongTags(vdjFolder, song.file_path, tagUpdate(form, includeColor));
      if (!shouldApplySongUpdate(result)) throw new Error(`Resultado de actualización: ${result.status}`);
      patchSong(song.index, songPatch(form, includeColor));
      setStatus("Cambios guardados");
    } catch (error) {
      await refreshRecovery();
      reportUiError("No se pudieron guardar las etiquetas.", error);
      setStatus("No se guardaron los cambios");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="border-b border-border p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="badge border border-border bg-surface text-text-secondary">
            {song.in_database ? <><Database className="mr-1 h-3.5 w-3.5" /> database.xml</> : <><FileAudio2 className="mr-1 h-3.5 w-3.5" /> externo</>}
          </span>
          {dirty ? <span className="badge bg-warning/12 text-warning">Sin guardar</span> : null}
        </div>
        <h2 className="mt-3 break-words text-base font-semibold text-text">{form.title || song.file_name}</h2>
        <p className="mt-1 text-sm text-text-secondary">{form.author || "Artista desconocido"}</p>
        <div className="mt-3 rounded-md border border-border bg-surface p-2">
          <WaveformPreview filePath={song.file_path} fileSize={song.file_size} bucketCount={64} cueMarkers={song.cue_markers} durationSecs={song.duration_secs} vdjFolder={vdjFolder} heightClass="h-14" svgClassName="h-14" />
        </div>
      </div>

      {mutationsBlocked ? <div className="border-b border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">Edición pausada por recuperación pendiente.</div> : null}

      <div className="space-y-3 p-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Field label="Título" value={form.title} disabled={!editable} onChange={(value) => setField("title", value)} /></div>
          <div className="col-span-2"><Field label="Artista" value={form.author} disabled={!editable} onChange={(value) => setField("author", value)} /></div>
          <Field label="BPM" value={form.bpm} disabled={!editable} onChange={(value) => setField("bpm", value)} />
          <Field label="Tono" value={form.key} disabled={!editable} onChange={(value) => setField("key", value)} />
          <div className="col-span-2"><Field label="Género" value={form.genre} disabled={!editable} onChange={(value) => setField("genre", value)} /></div>
          <div className="col-span-2"><Field label="Álbum" value={form.album} disabled={!editable} onChange={(value) => setField("album", value)} /></div>
        </div>

        <details className="group rounded-md border border-border bg-surface">
          <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-sm font-semibold text-text [&::-webkit-details-marker]:hidden">
            Edición avanzada <ChevronDown className="h-4 w-4 text-text-muted group-open:rotate-180" />
          </summary>
          <div className="grid grid-cols-2 gap-3 border-t border-border p-3">
            <Field label="Remix" value={form.remix} disabled={!editable} onChange={(value) => setField("remix", value)} />
            <Field label="Remixer" value={form.remixer} disabled={!editable} onChange={(value) => setField("remixer", value)} />
            <Field label="Compositor" value={form.composer} disabled={!editable} onChange={(value) => setField("composer", value)} />
            <Field label="Sello" value={form.label} disabled={!editable} onChange={(value) => setField("label", value)} />
            <Field label="Año" value={form.year} disabled={!editable} onChange={(value) => setField("year", value)} />
            <Field label="Track #" value={form.trackNumber} disabled={!editable} onChange={(value) => setField("trackNumber", value)} />
            <Field label="Agrupación" value={form.grouping} disabled={!editable} onChange={(value) => setField("grouping", value)} />
            <Field label="Gain" value={form.gain} disabled={!editable} onChange={(value) => setField("gain", value)} />
            <Field label="Estrellas" value={form.stars} disabled={!editable} onChange={(value) => setField("stars", value)} />
            <label className="block"><span className="mb-1 block text-xs font-medium text-text-muted">Color</span><input type="color" className="h-[34px] w-full rounded-md border border-border bg-background p-1" value={form.color} disabled={!editable} onChange={(event) => setField("color", event.target.value)} /></label>
            <div className="col-span-2"><Field label="User 1" value={form.user1} disabled={!editable} onChange={(value) => setField("user1", value)} /></div>
            <div className="col-span-2"><Field label="User 2" value={form.user2} disabled={!editable} onChange={(value) => setField("user2", value)} /></div>
            <label className="col-span-2 block"><span className="mb-1 block text-xs font-medium text-text-muted">Comentario</span><textarea className="input min-h-20 w-full resize-y" value={form.commentText} disabled={!editable} onChange={(event) => setField("commentText", event.target.value)} /></label>
          </div>
        </details>

        <details className="group rounded-md border border-border bg-surface">
          <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-sm font-semibold text-text [&::-webkit-details-marker]:hidden">
            Archivo y cues <ChevronDown className="h-4 w-4 text-text-muted group-open:rotate-180" />
          </summary>
          <div className="border-t border-border px-3 py-1">
            <ReadonlyRow label="Duración" value={formatDuration(song.duration_secs)} />
            <ReadonlyRow label="Tamaño" value={formatSize(song.file_size)} />
            <ReadonlyRow label="Bitrate" value={song.bitrate ? `${song.bitrate} kbps` : "—"} />
            <ReadonlyRow label="Plays" value={valueOf(song.play_count) || "—"} />
            <ReadonlyRow label="Ruta" value={song.file_path} title={song.file_path} />
            {song.cue_markers.length > 0 ? (
              <div className="py-2">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-text-muted"><Clock3 className="h-3.5 w-3.5" /> {song.cue_markers.length} cue markers</div>
                <div className="space-y-1">
                  {song.cue_markers.map((cue, index) => <div key={`${cue.pos}-${index}`} className="flex items-center justify-between rounded bg-background px-2 py-1.5 text-xs text-text-secondary"><span>{cue.name || `Cue ${cue.num ?? index + 1}`}</span><span className="font-mono text-text-muted">{cue.pos.toFixed(2)}s</span></div>)}
                </div>
              </div>
            ) : null}
          </div>
        </details>
      </div>

      <footer className="sticky bottom-0 flex items-center justify-between gap-2 border-t border-border bg-surface p-3">
        <span className="min-w-0 truncate text-xs text-text-muted">{status ?? (editable ? "Selecciona un campo para editar" : "Sólo lectura")}</span>
        <div className="flex shrink-0 gap-2">
          <button type="button" className="icon-button" onClick={reset} disabled={!dirty || saving} aria-label="Revertir cambios"><RotateCcw className="h-4 w-4" /></button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => void save()} disabled={!editable || !dirty || saving}><Save className="h-4 w-4" /> {saving ? "Guardando…" : "Guardar"}</button>
        </div>
      </footer>
    </section>
  );
}
