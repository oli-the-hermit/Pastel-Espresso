import { describe, expect, it } from 'vitest';
import { countNotes, inScope, listNotes, sameScope, type NoteListInput } from './noteList';
import type { Note } from './notes';

const note = (id: string, over: Partial<Note> = {}): Note => ({
  id,
  title: id,
  collectionId: null,
  labelIds: [],
  pinned: false,
  trashedAt: null,
  createdAt: 1,
  editedAt: 1,
  savedAt: 1,
  ...over
});

const base = (notes: Note[], over: Partial<NoteListInput> = {}): NoteListInput => ({
  notes,
  scope: { kind: 'all' },
  query: '',
  sort: 'edited',
  collections: [{ id: 'c1', name: 'Research', createdAt: 1 }],
  labels: [{ id: 'l1', name: 'handoff' }],
  untitled: 'Untitled note',
  ...over
});

const ids = (list: Note[]) => list.map(n => n.id);

describe('which notes a place holds', () => {
  const inbox = note('a');
  const filed = note('b', { collectionId: 'c1', labelIds: ['l1'] });
  const trashed = note('c', { trashedAt: 5 });

  it('keeps the Trash out of every other place', () => {
    expect(inScope(inbox, { kind: 'all' })).toBe(true);
    expect(inScope(trashed, { kind: 'all' })).toBe(false);
    expect(inScope(trashed, { kind: 'inbox' })).toBe(false);
    expect(inScope(trashed, { kind: 'trash' })).toBe(true);
    expect(inScope(inbox, { kind: 'trash' })).toBe(false);
  });

  it('puts unfiled notes in the Inbox and filed ones in their collection and labels', () => {
    expect(inScope(inbox, { kind: 'inbox' })).toBe(true);
    expect(inScope(filed, { kind: 'inbox' })).toBe(false);
    expect(inScope(filed, { kind: 'collection', id: 'c1' })).toBe(true);
    expect(inScope(filed, { kind: 'label', id: 'l1' })).toBe(true);
    expect(inScope(filed, { kind: 'label', id: 'other' })).toBe(false);
  });

  it('compares places by kind and id', () => {
    expect(sameScope({ kind: 'inbox' }, { kind: 'inbox' })).toBe(true);
    expect(sameScope({ kind: 'collection', id: 'x' }, { kind: 'collection', id: 'x' })).toBe(true);
    expect(sameScope({ kind: 'collection', id: 'x' }, { kind: 'label', id: 'x' })).toBe(false);
    expect(sameScope({ kind: 'collection', id: 'x' }, { kind: 'collection', id: 'y' })).toBe(false);
  });
});

describe('ordering', () => {
  const notes = [
    note('old', { title: 'Beta', editedAt: 1, createdAt: 3 }),
    note('new', { title: 'alpha', editedAt: 9, createdAt: 1 }),
    note('pinned', { title: 'Gamma', editedAt: 0, createdAt: 2, pinned: true })
  ];

  it('leads with pinned notes, then the most recently edited', () => {
    expect(ids(listNotes(base(notes)))).toEqual(['pinned', 'new', 'old']);
  });

  it('sorts by creation time or by title when asked', () => {
    expect(ids(listNotes(base(notes, { sort: 'created' })))).toEqual(['pinned', 'old', 'new']);
    expect(ids(listNotes(base(notes, { sort: 'title' })))).toEqual(['pinned', 'new', 'old']);
  });

  it('sorts untitled notes by what the list calls them', () => {
    const list = [note('x', { title: '' }), note('y', { title: 'Zebra' }), note('z', { title: 'Apple' })];
    expect(ids(listNotes(base(list, { sort: 'title' })))).toEqual(['z', 'x', 'y']);
  });

  it('has no pins in the Trash', () => {
    const trash = [note('a', { trashedAt: 1, editedAt: 1, pinned: true }), note('b', { trashedAt: 1, editedAt: 2 })];
    expect(ids(listNotes(base(trash, { scope: { kind: 'trash' } })))).toEqual(['b', 'a']);
  });
});

describe('searching', () => {
  const notes = [
    note('1', { title: 'Weekly plan', editedAt: 5 }),
    note('2', { title: 'Notes', collectionId: 'c1', editedAt: 4 }),
    note('3', { title: 'Plan B', editedAt: 9, trashedAt: 9 }),
    note('4', { title: 'Standup', labelIds: ['l1'], editedAt: 3 })
  ];

  it('looks in every place outside the Trash, whichever one is open', () => {
    const found = listNotes(base(notes, { scope: { kind: 'collection', id: 'c1' }, query: 'plan' }));
    expect(ids(found)).toEqual(['1']);
  });

  it('looks inside the Trash while you are there', () => {
    expect(ids(listNotes(base(notes, { scope: { kind: 'trash' }, query: 'plan' })))).toEqual(['3']);
  });

  it('matches the names of the collection and labels too', () => {
    expect(ids(listNotes(base(notes, { query: 'research' })))).toEqual(['2']);
    expect(ids(listNotes(base(notes, { query: 'handoff' })))).toEqual(['4']);
  });

  it('puts the best match first and finds untitled notes by their displayed name', () => {
    const list = [note('a', { title: 'My weekly plan', editedAt: 9 }), note('b', { title: 'Plan', editedAt: 1 }), note('c', { title: '', editedAt: 2 })];
    expect(ids(listNotes(base(list, { query: 'plan' })))).toEqual(['b', 'a']);
    expect(ids(listNotes(base(list, { query: 'untitled' })))).toEqual(['c']);
  });
});

describe('counting', () => {
  it('counts each place without the Trash', () => {
    const counts = countNotes([
      note('a'),
      note('b', { collectionId: 'c1', labelIds: ['l1'] }),
      note('c', { collectionId: 'c1' }),
      note('d', { trashedAt: 1, collectionId: 'c1', labelIds: ['l1'] })
    ]);
    expect(counts.all).toBe(3);
    expect(counts.inbox).toBe(1);
    expect(counts.trash).toBe(1);
    expect(counts.byCollection.get('c1')).toBe(2);
    expect(counts.byLabel.get('l1')).toBe(1);
  });
});
