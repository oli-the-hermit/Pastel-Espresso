/**
 * What the Notes screen shows: which notes a place holds, how a search ranks them, and how
 * they sort. Pure functions over the notes' metadata, so they're easy to test.
 */
import { matchScore } from './fuzzy';
import type { Note, NoteCollection, NoteLabel } from './notes';

/** A place in the side list. Everything and the Inbox leave out what's in the Trash. */
export type NoteScope =
  | { kind: 'all' }
  | { kind: 'inbox' }
  | { kind: 'collection'; id: string }
  | { kind: 'label'; id: string }
  | { kind: 'trash' };

export type NoteSort = 'edited' | 'created' | 'title';

export const NOTE_SORTS: readonly NoteSort[] = ['edited', 'created', 'title'];

export const sameScope = (a: NoteScope, b: NoteScope): boolean =>
  a.kind === b.kind && ('id' in a ? a.id === (b as { id: string }).id : true);

/** Whether a note belongs in a place. */
export function inScope(note: Note, scope: NoteScope): boolean {
  if (scope.kind === 'trash') return note.trashedAt !== null;
  if (note.trashedAt !== null) return false;
  switch (scope.kind) {
    case 'all': return true;
    case 'inbox': return note.collectionId === null;
    case 'collection': return note.collectionId === scope.id;
    case 'label': return note.labelIds.includes(scope.id);
  }
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

function compare(a: Note, b: Note, sort: NoteSort, untitled: string): number {
  if (sort === 'title') return collator.compare(a.title || untitled, b.title || untitled);
  return sort === 'created' ? b.createdAt - a.createdAt : b.editedAt - a.editedAt;
}

export interface NoteListInput {
  notes: readonly Note[];
  scope: NoteScope;
  query: string;
  sort: NoteSort;
  collections: readonly NoteCollection[];
  labels: readonly NoteLabel[];
  /** What an untitled note is called; it's what the list shows and sorts by. */
  untitled: string;
}

/**
 * The notes to list. A search looks in every note outside the Trash (or inside it, while
 * you're there), so nothing has to be remembered by where it was filed; it matches the
 * title and the names of the note's collection and labels, best match first. Otherwise
 * pinned notes lead, then the chosen order. The Trash has no pins.
 */
export function listNotes({ notes, scope, query, sort, collections, labels, untitled }: NoteListInput): Note[] {
  const searching = query.trim() !== '';
  const place: NoteScope = searching && scope.kind !== 'trash' ? { kind: 'all' } : scope;
  const pool = notes.filter(n => inScope(n, place));

  const ordered = (list: Note[]) =>
    [...list].sort((a, b) => {
      if (scope.kind !== 'trash' && a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return compare(a, b, sort, untitled);
    });
  if (!searching) return ordered(pool);

  const collectionName = new Map(collections.map(c => [c.id, c.name]));
  const labelName = new Map(labels.map(l => [l.id, l.name]));
  const scored = pool.flatMap(note => {
    const text = [
      note.title || untitled,
      note.collectionId ? collectionName.get(note.collectionId) ?? '' : '',
      ...note.labelIds.map(id => labelName.get(id) ?? '')
    ].join(' ');
    const score = matchScore(text, query);
    return score === null ? [] : [{ note, score }];
  });
  // Best match first; equal matches keep the chosen order.
  const rank = new Map(ordered(scored.map(s => s.note)).map((n, i) => [n.id, i]));
  return scored
    .sort((a, b) => a.score - b.score || rank.get(a.note.id)! - rank.get(b.note.id)!)
    .map(s => s.note);
}

export interface NoteCounts {
  /** Every note outside the Trash. */
  all: number;
  inbox: number;
  trash: number;
  byCollection: ReadonlyMap<string, number>;
  byLabel: ReadonlyMap<string, number>;
}

export function countNotes(notes: readonly Note[]): NoteCounts {
  const byCollection = new Map<string, number>();
  const byLabel = new Map<string, number>();
  let all = 0;
  let inbox = 0;
  let trash = 0;
  for (const n of notes) {
    if (n.trashedAt !== null) {
      trash++;
      continue;
    }
    all++;
    if (n.collectionId === null) inbox++;
    else byCollection.set(n.collectionId, (byCollection.get(n.collectionId) ?? 0) + 1);
    for (const l of n.labelIds) byLabel.set(l, (byLabel.get(l) ?? 0) + 1);
  }
  return { all, inbox, trash, byCollection, byLabel };
}
