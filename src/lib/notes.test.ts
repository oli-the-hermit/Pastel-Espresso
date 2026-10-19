import { describe, expect, it } from 'vitest';
import { generateDataKey } from './crypto';
import { deriveNoteTitle, metaOf, newNoteId, newNoteMeta, normalizeNoteMeta, openNoteBody, openNoteMeta, sealNoteBody, sealNoteMeta } from './notes';

// The rule both backends check (DOC_ID_RE in server/app.js, valid_doc_id in handlers.rs).
const DOC_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('newNoteId', () => {
  it('makes ids the backends accept, and never the same one twice', () => {
    const ids = Array.from({ length: 200 }, newNoteId);
    for (const id of ids) expect(id).toMatch(DOC_ID);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('normalizeNoteMeta', () => {
  it('fills every field from nothing', () => {
    expect(normalizeNoteMeta(null, 1000)).toEqual({
      title: '', collectionId: null, labelIds: [], pinned: false, trashedAt: null, createdAt: 1000, editedAt: 1000
    });
  });
  it('keeps what is valid and drops what is not', () => {
    const meta = normalizeNoteMeta(
      { title: 'Plan', collectionId: 'c1', labelIds: ['a', 7, 'a', 'b'], pinned: 'yes', trashedAt: 'later', createdAt: 5, editedAt: Infinity },
      1000
    );
    expect(meta).toEqual({ title: 'Plan', collectionId: 'c1', labelIds: ['a', 'b'], pinned: false, trashedAt: null, createdAt: 5, editedAt: 5 });
  });
  it('starts a new note untitled, in the Inbox, edited now', () => {
    expect(newNoteMeta(42, { title: 'Draft' })).toMatchObject({ title: 'Draft', collectionId: null, createdAt: 42, editedAt: 42 });
  });
});

describe('sealing', () => {
  it('opens what it sealed: metadata and a Markdown body', async () => {
    const key = await generateDataKey();
    const meta = newNoteMeta(1, { title: 'Café ✓', labelIds: ['l1'] });
    const body = '# Título\n\n- [ ] tarea — ✓\n\n| A | B |\n|---|---|\n| 1 | 2 |\n';
    expect(await openNoteMeta(await sealNoteMeta(meta, key), key)).toEqual(meta);
    expect(await openNoteBody(await sealNoteBody(body, key), key)).toBe(body);
  });
  it('seals the same text differently each time (a fresh IV per record)', async () => {
    const key = await generateDataKey();
    const [a, b] = await Promise.all([sealNoteBody('same', key), sealNoteBody('same', key)]);
    expect(a.iv).not.toBe(b.iv);
    expect(a.cipher).not.toBe(b.cipher);
  });
  it('refuses to open with another key', async () => {
    const sealed = await sealNoteBody('private', await generateDataKey());
    await expect(openNoteBody(sealed, await generateDataKey())).rejects.toThrow();
  });
});

describe('metaOf', () => {
  it('returns exactly the sealed fields of a listed note', () => {
    const meta = newNoteMeta(3, { title: 'x' });
    expect(metaOf({ ...meta, id: 'n1', savedAt: 9 })).toEqual(meta);
  });
});

describe('deriveNoteTitle', () => {
  it('takes the first line of text', () => {
    expect(deriveNoteTitle('Weekly plan\nmore text')).toBe('Weekly plan');
    expect(deriveNoteTitle('\n\n  Second try  \n')).toBe('Second try');
  });

  it('drops the Markdown around it', () => {
    expect(deriveNoteTitle('## A heading')).toBe('A heading');
    expect(deriveNoteTitle('- [ ] buy milk')).toBe('buy milk');
    expect(deriveNoteTitle('> **quoted** and `code`')).toBe('quoted and code');
    expect(deriveNoteTitle('1. [the docs](https://example.com) first')).toBe('the docs first');
    expect(deriveNoteTitle('fish \\& chips')).toBe('fish & chips');
  });

  it('skips lines that name nothing', () => {
    expect(deriveNoteTitle('---\n\n```\n| a | b |\nreal start')).toBe('real start');
    expect(deriveNoteTitle('---\n***\n')).toBe('');
    expect(deriveNoteTitle('')).toBe('');
  });

  it('shortens a long line', () => {
    const title = deriveNoteTitle('word '.repeat(40));
    expect(title.length).toBeLessThanOrEqual(81);
    expect(title.endsWith('…')).toBe(true);
  });
});
