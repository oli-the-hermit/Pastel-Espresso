/**
 * Notes as files. A bundle is one versioned JSON file holding many notes with their
 * collections and labels (`.focusbundle.json`); a Markdown file is one note, its labels in
 * front matter. This module reads files into an import plan and writes notes out as text;
 * the pickers and save dialogs are in lib/fileAccess.ts.
 */
import { LIMITS } from '../constants/limits';
import { deriveNoteTitle } from './notes';

export const BUNDLE_FORMAT = 'focus-space-bundle';
export const BUNDLE_VERSION = 1;
export const BUNDLE_EXTENSION = '.focusbundle.json';
export const MARKDOWN_EXTENSION = '.md';

/** Files read as one Markdown note each. */
const MARKDOWN_EXTENSIONS = ['.md', '.markdown', '.mdown', '.mkd', '.txt'];

/** A note's text, in UTF-8 bytes; AES-GCM adds 16 bytes and the backends cap the sealed body at `documents.maxBytes`. */
export const MAX_NOTE_BYTES = LIMITS.documents.maxBytes - 16;
/** The largest bundle the app opens. Its notes are checked one by one after that. */
export const MAX_BUNDLE_BYTES = 64 * 1024 * 1024;
/** Titles and labels past these lengths are cut, so a note's sealed metadata stays well inside `documents.maxMetaBytes`. */
const TITLE_MAX = 200;
const LABELS_MAX = 50;
/** Windows' limit is 255 per name; shorter names leave room for the folder they're saved in. */
const FILE_NAME_MAX = 120;

// ── The bundle ───────────────────────────────────────────────────────────

export interface BundleCollection {
  id: string;
  name: string;
}

export interface BundleDocument {
  id: string;
  /** The id of one of the bundle's collections; absent for a note in no collection. */
  collection?: string;
  title: string;
  /** Label names. */
  labels: string[];
  /** ISO 8601 times. */
  created: string;
  updated: string;
  /** Markdown. */
  body: string;
}

export interface Bundle {
  format: typeof BUNDLE_FORMAT;
  version: number;
  createdAt: string;
  title: string;
  collections: BundleCollection[];
  documents: BundleDocument[];
}

/** A note on its way out, its labels already turned into names. */
export interface ExportNote {
  id: string;
  title: string;
  collectionId: string | null;
  labels: string[];
  createdAt: number;
  editedAt: number;
  body: string;
}

const iso = (ms: number) => new Date(ms).toISOString();

/** A bundle of `notes`, listing only the collections they're in. */
export function buildBundle(title: string, notes: ExportNote[], collections: readonly BundleCollection[], now = Date.now()): Bundle {
  const used = new Set(notes.map(n => n.collectionId));
  return {
    format: BUNDLE_FORMAT,
    version: BUNDLE_VERSION,
    createdAt: iso(now),
    title,
    collections: collections.filter(c => used.has(c.id)).map(c => ({ id: c.id, name: c.name })),
    documents: notes.map(n => ({
      id: n.id,
      ...(n.collectionId ? { collection: n.collectionId } : {}),
      title: n.title,
      labels: n.labels,
      created: iso(n.createdAt),
      updated: iso(n.editedAt),
      body: n.body
    }))
  };
}

export const bundleText = (bundle: Bundle): string => `${JSON.stringify(bundle, null, 2)}\n`;

// ── Markdown files ───────────────────────────────────────────────────────

/** YAML's double-quoted strings are JSON's, so JSON writes them safely. */
const yamlString = (s: string) => JSON.stringify(s);

/**
 * One note as a Markdown file. Its labels go in front matter as `tags` (what Obsidian reads),
 * and so does its title when the file name can't hold it as it is.
 */
export function toMarkdownFile(note: Pick<ExportNote, 'title' | 'labels' | 'body'>, fileTitle = safeFileName(note.title, note.title)): string {
  const lines: string[] = [];
  if (note.title && fileTitle !== note.title) lines.push(`title: ${yamlString(note.title)}`);
  if (note.labels.length > 0) lines.push('tags:', ...note.labels.map(l => `  - ${yamlString(l)}`));
  const body = note.body.endsWith('\n') || note.body === '' ? note.body : `${note.body}\n`;
  return lines.length > 0 ? `---\n${lines.join('\n')}\n---\n\n${body}` : body;
}

export interface FrontMatter {
  /** The text after the front matter. */
  body: string;
  title?: string;
  tags: string[];
}

const unquote = (raw: string): string => {
  const v = raw.trim();
  if (v.startsWith('"') && v.endsWith('"') && v.length > 1) {
    try {
      return String(JSON.parse(v));
    } catch {
      return v.slice(1, -1);
    }
  }
  if (v.startsWith("'") && v.endsWith("'") && v.length > 1) return v.slice(1, -1).replace(/''/g, "'");
  return v;
};

const tagList = (raw: string): string[] => {
  const v = raw.trim();
  const inner = v.startsWith('[') && v.endsWith(']') ? v.slice(1, -1) : v;
  return inner.split(',').map(unquote);
};

/**
 * Takes YAML front matter off the top of a Markdown file. Only `title` and `tags` (or `tag`,
 * `labels`) are kept; the editor would turn the rest into a heading, so it's left out.
 */
export function splitFrontMatter(text: string): FrontMatter {
  const match = /^---[ \t]*\r?\n([\s\S]*?)\r?\n(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/.exec(text);
  if (!match) return { body: text, tags: [] };
  let title: string | undefined;
  const tags: string[] = [];
  let listKey: string | null = null;
  for (const line of match[1].split(/\r?\n/)) {
    const item = /^\s+-\s*(.*)$/.exec(line) ?? /^-\s+(.*)$/.exec(line);
    if (item && listKey) {
      if (listKey === 'tags') tags.push(unquote(item[1]));
      continue;
    }
    const pair = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line);
    if (!pair) continue;
    const key = pair[1].toLowerCase();
    const value = pair[2];
    listKey = ['tags', 'tag', 'labels'].includes(key) ? 'tags' : key;
    if (key === 'title' && value.trim()) title = unquote(value);
    else if (listKey === 'tags' && value.trim()) tags.push(...tagList(value));
  }
  return { body: text.slice(match[0].length).replace(/^(?:[ \t]*\r?\n)+/, ''), title, tags };
}

/** Labels from tags: no `#`, no blanks, each name once (ignoring case). */
function cleanLabels(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of names) {
    const name = raw.trim().replace(/^#/, '').trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    out.push(name);
  }
  return out.slice(0, LABELS_MAX);
}

const cleanTitle = (title: string) => title.trim().slice(0, TITLE_MAX).trim();

// ── File names ───────────────────────────────────────────────────────────

const RESERVED_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

/** A name every system accepts for a file or folder: no path or reserved characters, not too long. */
export function safeFileName(name: string, fallback: string): string {
  let out = name
    // eslint-disable-next-line no-control-regex
    .replace(/[<>:"/\\|?*\u0000-\u001f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, FILE_NAME_MAX)
    .replace(/[. ]+$/, '');
  if (RESERVED_NAMES.test(out)) out = `${out}_`;
  return out || fallback;
}

/** `name`, or `name (2)`, `name (3)`… — the first that isn't in `taken` (compared without case). Adds it to `taken`. */
export function uniqueName(name: string, taken: Set<string>, extension = ''): string {
  let candidate = `${name}${extension}`;
  for (let n = 2; taken.has(candidate.toLowerCase()); n++) candidate = `${name} (${n})${extension}`;
  taken.add(candidate.toLowerCase());
  return candidate;
}

/** File names for notes saved side by side: each its title's safe form, made unique. */
export function markdownFileNames(titles: string[], untitled: string): string[] {
  const taken = new Set<string>();
  return titles.map(t => uniqueName(safeFileName(t, untitled), taken, MARKDOWN_EXTENSION));
}

// ── Reading files for an import ──────────────────────────────────────────

export type SkipReason = 'notSupported' | 'tooLarge' | 'notBundle' | 'newerBundle' | 'unreadable' | 'damaged';

export interface Skipped {
  /** A file name, or a note's title inside a bundle. */
  name: string;
  reason: SkipReason;
  /** For `damaged`: how many notes inside the bundle couldn't be read. */
  count?: number;
}

/** A file read for an import; `text` is absent when it was left out before reading. */
export interface ReadSource {
  name: string;
  lastModified: number;
  text?: string;
  skip?: SkipReason;
}

const extensionOf = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.endsWith(BUNDLE_EXTENSION)) return BUNDLE_EXTENSION;
  const dot = lower.lastIndexOf('.');
  return dot > 0 ? lower.slice(dot) : '';
};

const isMarkdownName = (name: string) => MARKDOWN_EXTENSIONS.includes(extensionOf(name));
const isBundleName = (name: string) => ['.json', BUNDLE_EXTENSION].includes(extensionOf(name));

/** The files an Open dialog offers for an import, by media type. */
export const IMPORT_ACCEPT: Record<string, string[]> = {
  'text/markdown': MARKDOWN_EXTENSIONS,
  'application/json': ['.json']
};

/** Whether a file can become notes: Markdown or text, or a bundle. */
export const isImportable = (name: string) => isMarkdownName(name) || isBundleName(name);

/** Reads each file that can become notes; the rest come back with the reason they're left out. */
export async function readImportFiles(files: readonly File[]): Promise<ReadSource[]> {
  return Promise.all(
    files.map(async (file): Promise<ReadSource> => {
      const base = { name: file.name, lastModified: file.lastModified || Date.now() };
      if (!isImportable(file.name)) return { ...base, skip: 'notSupported' };
      if (file.size > (isBundleName(file.name) ? MAX_BUNDLE_BYTES : MAX_NOTE_BYTES)) return { ...base, skip: 'tooLarge' };
      try {
        return { ...base, text: await file.text() };
      } catch {
        return { ...base, skip: 'unreadable' };
      }
    })
  );
}

/** A note read from a file, waiting for the collection it lands in. */
export interface IncomingNote {
  title: string;
  body: string;
  labels: string[];
  createdAt: number;
  editedAt: number;
  /** Key of its group in ImportPlan.groups. */
  group: string;
}

/** A new collection the import creates. */
export interface IncomingGroup {
  key: string;
  /** The suggested name: the source's, made unique among the collections there are. */
  name: string;
}

export interface ImportPlan {
  notes: IncomingNote[];
  /** Only groups with notes, in the order they were found. */
  groups: IncomingGroup[];
  skipped: Skipped[];
}

export interface PlanOptions {
  /** The name for notes that bring no collection of their own: a folder's name, or "Imported <date>". */
  looseName: string;
  /** The names of the collections there are, so a new one doesn't repeat them. */
  existingCollections: readonly string[];
  now?: number;
}

const LOOSE = 'loose';

const utf8Bytes = (text: string) => new TextEncoder().encode(text).length;

const timeOf = (v: unknown, fallback: number): number => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const t = Date.parse(v);
    if (Number.isFinite(t)) return t;
  }
  return fallback;
};

/** Text with the byte-order mark off and Windows line ends turned into plain ones. */
const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);
const cleanText = (text: string) => (text.startsWith(BYTE_ORDER_MARK) ? text.slice(1) : text).replace(/\r\n?/g, '\n');

type BundleRead =
  | { ok: true; title: string; collections: BundleCollection[]; documents: unknown[] }
  | { ok: false; reason: SkipReason };

function readBundle(text: string): BundleRead {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'notBundle' };
  }
  const b = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
  if (b.format !== BUNDLE_FORMAT || !Array.isArray(b.documents)) return { ok: false, reason: 'notBundle' };
  if (typeof b.version === 'number' && b.version > BUNDLE_VERSION) return { ok: false, reason: 'newerBundle' };
  const collections = (Array.isArray(b.collections) ? b.collections : []).flatMap(c => {
    const r = c && typeof c === 'object' ? (c as Record<string, unknown>) : {};
    return typeof r.id === 'string' && typeof r.name === 'string' ? [{ id: r.id, name: r.name }] : [];
  });
  return { ok: true, title: typeof b.title === 'string' ? b.title.trim() : '', collections, documents: b.documents };
}

/**
 * What an import would create, before anything is: the notes, the new collections they land
 * in and the files left out. An import never adds to a collection that's there already.
 * A bundle's collections each become a new one; notes without one (Markdown files, or a
 * bundle's loose notes) share a single new collection, named `looseName` unless one bundle
 * alone brought them, which names it.
 */
export function planImport(sources: readonly ReadSource[], options: PlanOptions): ImportPlan {
  const now = options.now ?? Date.now();
  const notes: IncomingNote[] = [];
  const skipped: Skipped[] = [];
  const groupNames = new Map<string, string>();
  const looseFrom = new Set<string>();

  const add = (note: IncomingNote, sourceName: string) => {
    if (utf8Bytes(note.body) > MAX_NOTE_BYTES) {
      skipped.push({ name: note.title || sourceName, reason: 'tooLarge' });
      return;
    }
    notes.push(note);
  };

  sources.forEach((source, index) => {
    if (source.skip || source.text === undefined) {
      skipped.push({ name: source.name, reason: source.skip ?? 'unreadable' });
      return;
    }
    const text = cleanText(source.text);
    if (isMarkdownName(source.name)) {
      const { body, title, tags } = splitFrontMatter(text);
      const fileTitle = source.name.replace(/\.[^.]+$/, '');
      looseFrom.add('files');
      add(
        {
          title: cleanTitle(title ?? fileTitle) || deriveNoteTitle(body),
          body,
          labels: cleanLabels(tags),
          createdAt: source.lastModified,
          editedAt: source.lastModified,
          group: LOOSE
        },
        source.name
      );
      return;
    }
    const bundle = readBundle(text);
    if (!bundle.ok) {
      skipped.push({ name: source.name, reason: bundle.reason });
      return;
    }
    const known = new Map(bundle.collections.map(c => [c.id, c.name]));
    let damaged = 0;
    for (const raw of bundle.documents) {
      const d = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
      if (typeof d.body !== 'string') {
        damaged++;
        continue;
      }
      const body = cleanText(d.body);
      const inCollection = typeof d.collection === 'string' && known.has(d.collection) ? d.collection : null;
      let group = LOOSE;
      if (inCollection) {
        group = `${index}:${inCollection}`;
        if (!groupNames.has(group)) groupNames.set(group, known.get(inCollection)!.trim());
      } else {
        looseFrom.add(`bundle:${index}:${bundle.title}`);
      }
      const createdAt = timeOf(d.created, source.lastModified || now);
      add(
        {
          title: cleanTitle(typeof d.title === 'string' ? d.title : '') || deriveNoteTitle(body),
          body,
          labels: cleanLabels(Array.isArray(d.labels) ? d.labels.filter((l): l is string => typeof l === 'string') : []),
          createdAt,
          editedAt: timeOf(d.updated, createdAt),
          group
        },
        source.name
      );
    }
    if (damaged > 0) skipped.push({ name: source.name, reason: 'damaged', count: damaged });
  });

  // One bundle alone names its loose notes' collection; anything mixed takes looseName.
  const [onlyLoose] = looseFrom;
  const bundleTitle = looseFrom.size === 1 && onlyLoose.startsWith('bundle:') ? onlyLoose.split(':').slice(2).join(':') : '';
  groupNames.set(LOOSE, bundleTitle || options.looseName);

  const taken = new Set(options.existingCollections.map(n => n.trim().toLowerCase()));
  const groups: IncomingGroup[] = [];
  for (const key of new Set(notes.map(n => n.group))) {
    const name = groupNames.get(key)?.trim() || options.looseName;
    groups.push({ key, name: uniqueName(name, taken) });
  }
  return { notes, groups, skipped };
}
