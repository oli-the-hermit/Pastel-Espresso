/**
 * Notes: Markdown documents, each stored as two sealed records — its metadata and its body —
 * under the notes key (useAuthSession → getNotesKey). The server keeps only ids and times.
 */
import { decryptBlob, encryptBlob, type SealedBlob } from './crypto';

export interface NoteMeta {
  title: string;
  /** Its collection; null is the Inbox, where new notes land. */
  collectionId: string | null;
  labelIds: string[];
  pinned: boolean;
  /** When it went to the Trash; null while it isn't there. */
  trashedAt: number | null;
  createdAt: number;
  /** When its text last changed. Renaming, moving or labelling doesn't count; imports keep the source's. */
  editedAt: number;
}

/** A note as the app lists it. `savedAt` is when the server last stored it. */
export interface Note extends NoteMeta {
  id: string;
  savedAt: number;
}

/** Collections and labels are small, so they live in the profile data, not with the notes. */
export interface NoteCollection {
  id: string;
  name: string;
  createdAt: number;
}

export interface NoteLabel {
  id: string;
  name: string;
}

/** A new note's id: the lowercase UUID v4 both backends require. */
export const newNoteId = (): string => crypto.randomUUID();

/** Metadata for a new note: untitled, in the Inbox, edited now. */
export function newNoteMeta(now: number, init: Partial<NoteMeta> = {}): NoteMeta {
  return normalizeNoteMeta(
    { title: '', collectionId: null, labelIds: [], pinned: false, trashedAt: null, createdAt: now, editedAt: now, ...init },
    now
  );
}

/** Coerces decrypted or imported metadata into a NoteMeta, filling gaps rather than failing. */
export function normalizeNoteMeta(raw: unknown, now = Date.now()): NoteMeta {
  const m = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const time = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
  const createdAt = time(m.createdAt) ?? now;
  return {
    title: typeof m.title === 'string' ? m.title : '',
    collectionId: typeof m.collectionId === 'string' ? m.collectionId : null,
    labelIds: Array.isArray(m.labelIds) ? [...new Set(m.labelIds.filter((l): l is string => typeof l === 'string'))] : [],
    pinned: m.pinned === true,
    trashedAt: time(m.trashedAt),
    createdAt,
    editedAt: time(m.editedAt) ?? createdAt
  };
}

export const sealNoteMeta = (meta: NoteMeta, key: CryptoKey): Promise<SealedBlob> =>
  encryptBlob(JSON.stringify(meta), key);

export const openNoteMeta = async (sealed: SealedBlob, key: CryptoKey): Promise<NoteMeta> =>
  normalizeNoteMeta(JSON.parse(await decryptBlob(sealed, key)));

export const sealNoteBody = (markdown: string, key: CryptoKey): Promise<SealedBlob> => encryptBlob(markdown, key);

export const openNoteBody = (sealed: SealedBlob, key: CryptoKey): Promise<string> => decryptBlob(sealed, key);

/** The metadata half of a listed note, as it's sealed. */
export function metaOf(note: Note): NoteMeta {
  const { title, collectionId, labelIds, pinned, trashedAt, createdAt, editedAt } = note;
  return { title, collectionId, labelIds, pinned, trashedAt, createdAt, editedAt };
}

/** The longest title taken from a note's text. */
const DERIVED_TITLE_MAX = 80;

/**
 * A title for a note that has none: its first line of text, without the Markdown around it
 * (heading hashes, list and quote marks, checkbox, emphasis, code ticks, link syntax).
 * Empty when the text has nothing to name it by.
 */
export function deriveNoteTitle(markdown: string): string {
  for (const raw of markdown.split(/\r?\n/)) {
    const text = raw
      .replace(/^\s*(?:#{1,6}\s+|>\s*|[-*+]\s+(?:\[[ xX]\]\s+)?|\d+[.)]\s+)+/, '')
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[*_~`]+/g, '')
      .replace(/\\([\\`*_{}[\]()#+\-.!&])/g, '$1')
      .trim();
    // A fence, a rule or a table row says nothing about the note.
    if (!text || /^[-=_*|:\s]+$/.test(text) || text.startsWith('|')) continue;
    return text.length > DERIVED_TITLE_MAX ? `${text.slice(0, DERIVED_TITLE_MAX).trimEnd()}…` : text;
  }
  return '';
}
