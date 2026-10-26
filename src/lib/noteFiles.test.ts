import { describe, expect, it } from 'vitest';
import {
  BUNDLE_FORMAT,
  MAX_NOTE_BYTES,
  buildBundle,
  bundleText,
  markdownFileNames,
  planImport,
  readImportFiles,
  safeFileName,
  splitFrontMatter,
  toMarkdownFile,
  uniqueName,
  type ExportNote,
  type ReadSource
} from './noteFiles';

const T0 = Date.UTC(2026, 9, 1);
const note = (over: Partial<ExportNote> = {}): ExportNote => ({
  id: 'n1', title: 'Handoff', collectionId: 'c1', labels: ['handoff'], createdAt: T0, editedAt: T0 + 1000, body: '# Handoff\n\nText\n', ...over
});
const options = { looseName: 'Imported Oct 26, 2026', existingCollections: [] as string[], now: T0 };
const md = (name: string, text: string, lastModified = T0): ReadSource => ({ name, text, lastModified });

describe('bundles', () => {
  it('lists only the collections its notes are in, with ISO times', () => {
    const b = buildBundle('Pastel Studio', [note(), note({ id: 'n2', collectionId: null, labels: [] })], [
      { id: 'c1', name: 'Pastel Studio' },
      { id: 'c2', name: 'Unused' }
    ], T0);
    expect(b).toMatchObject({ format: BUNDLE_FORMAT, version: 1, title: 'Pastel Studio', collections: [{ id: 'c1', name: 'Pastel Studio' }] });
    expect(b.documents[0]).toEqual({
      id: 'n1', collection: 'c1', title: 'Handoff', labels: ['handoff'], created: '2026-10-01T00:00:00.000Z', updated: '2026-10-01T00:00:01.000Z', body: '# Handoff\n\nText\n'
    });
    expect(b.documents[1]).not.toHaveProperty('collection');
  });

  it('comes back in whole: titles, bodies, labels, dates and collections', () => {
    const notes = [note(), note({ id: 'n2', title: 'Plan', labels: ['plan', 'handoff'], body: '- [ ] one\n' })];
    const text = bundleText(buildBundle('Export', notes, [{ id: 'c1', name: 'Research' }], T0));
    const plan = planImport([md('x.focusbundle.json', text)], options);
    expect(plan.skipped).toEqual([]);
    expect(plan.groups).toEqual([{ key: '0:c1', name: 'Research' }]);
    expect(plan.notes.map(({ title, body, labels, createdAt, editedAt }) => ({ title, body, labels, createdAt, editedAt }))).toEqual(
      notes.map(({ title, body, labels, createdAt, editedAt }) => ({ title, body, labels, createdAt, editedAt }))
    );
  });

  it('puts notes without a collection in one named after the bundle', () => {
    const text = JSON.stringify({ format: BUNDLE_FORMAT, version: 1, title: 'Session, Oct 17', documents: [{ title: 'A', body: 'a' }, { body: '# From text' }] });
    const plan = planImport([md('s.json', text)], options);
    expect(plan.groups).toEqual([{ key: 'loose', name: 'Session, Oct 17' }]);
    expect(plan.notes.map(n => n.title)).toEqual(['A', 'From text']);
  });

  it('says why a file is left out', () => {
    const plan = planImport(
      [
        md('a.json', '{"hello": 1}'),
        md('b.json', 'not json'),
        md('c.json', JSON.stringify({ format: BUNDLE_FORMAT, version: 2, documents: [] })),
        md('d.json', JSON.stringify({ format: BUNDLE_FORMAT, version: 1, documents: [{ title: 'ok', body: 'x' }, { title: 'no body' }, 7] })),
        { name: 'e.png', lastModified: T0, skip: 'notSupported' }
      ],
      options
    );
    expect(plan.skipped).toEqual([
      { name: 'a.json', reason: 'notBundle' },
      { name: 'b.json', reason: 'notBundle' },
      { name: 'c.json', reason: 'newerBundle' },
      { name: 'd.json', reason: 'damaged', count: 2 },
      { name: 'e.png', reason: 'notSupported' }
    ]);
    expect(plan.notes).toHaveLength(1);
  });
});

describe('Markdown files', () => {
  it('are named by their file, dated by it, and share one new collection', () => {
    const plan = planImport([md('Plan.md', '# Plan\r\n\r\nSteps\r\n', T0 + 5), md('notes.txt', `${String.fromCharCode(0xfeff)}plain`)], options);
    expect(plan.groups).toEqual([{ key: 'loose', name: 'Imported Oct 26, 2026' }]);
    expect(plan.notes[0]).toEqual({ title: 'Plan', body: '# Plan\n\nSteps\n', labels: [], createdAt: T0 + 5, editedAt: T0 + 5, group: 'loose' });
    expect(plan.notes[1].body).toBe('plain');
  });

  it('take the title and tags from front matter and leave the rest out', () => {
    const text = '---\ntitle: "Real: title"\naliases: [x]\ntags:\n  - "#research"\n  - Handoff\n  - handoff\nsource: https://example.com\n---\n\n# Body\n';
    const plan = planImport([md('file.md', text)], options);
    expect(plan.notes[0]).toMatchObject({ title: 'Real: title', body: '# Body\n', labels: ['research', 'Handoff'] });
  });

  it('read tags written inline or as a comma list', () => {
    expect(splitFrontMatter('---\ntags: [a, "b c"]\n---\nx').tags).toEqual(['a', 'b c']);
    expect(splitFrontMatter('---\nlabels: one, two\n---\nx').tags).toEqual(['one', 'two']);
    expect(splitFrontMatter('No front matter\n---\n').body).toBe('No front matter\n---\n');
  });

  it('round-trip through export: labels, and a title the file name can’t hold', () => {
    const out = note({ title: 'Q3: plan/notes', labels: ['plan', 'Say "hi"'], body: 'Text' });
    const [fileName] = markdownFileNames([out.title], 'Untitled note');
    expect(fileName).toBe('Q3 plan notes.md');
    const text = toMarkdownFile(out, fileName.slice(0, -3));
    const plan = planImport([md(fileName, text)], options);
    expect(plan.notes[0]).toMatchObject({ title: out.title, labels: out.labels, body: 'Text\n' });
  });

  it('write plain text when there is nothing to add', () => {
    expect(toMarkdownFile({ title: 'Plan', labels: [], body: '# Plan' })).toBe('# Plan\n');
  });

  it('too long for one note are left out', () => {
    const plan = planImport([md('big.md', 'x'.repeat(MAX_NOTE_BYTES + 1))], options);
    expect(plan.skipped).toEqual([{ name: 'big', reason: 'tooLarge' }]);
    expect(plan.groups).toEqual([]);
  });
});

describe('new collections', () => {
  it('never take the name of one there is already', () => {
    const plan = planImport([md('a.md', 'a')], { ...options, looseName: 'Research', existingCollections: ['research', 'Research (2)'] });
    expect(plan.groups[0].name).toBe('Research (3)');
  });

  it('take looseName when several sources bring loose notes', () => {
    const bundle = JSON.stringify({ format: BUNDLE_FORMAT, version: 1, title: 'B', documents: [{ body: 'x' }] });
    expect(planImport([md('b.json', bundle), md('a.md', 'a')], options).groups).toEqual([{ key: 'loose', name: options.looseName }]);
  });
});

describe('file names', () => {
  it('drop characters no system accepts and avoid reserved names', () => {
    expect(safeFileName('a<b>:c"d/e\\f|g?h*i', 'x')).toBe('a b c d e f g h i');
    expect(safeFileName('  ...  ', 'Untitled')).toBe('Untitled');
    expect(safeFileName('con', 'x')).toBe('con_');
    expect(safeFileName('end.', 'x')).toBe('end');
  });

  it('are made unique without regard to case', () => {
    const taken = new Set<string>();
    expect([uniqueName('A', taken, '.md'), uniqueName('a', taken, '.md'), uniqueName('A', taken, '.md')]).toEqual(['A.md', 'a (2).md', 'A (3).md']);
  });
});

describe('readImportFiles', () => {
  it('reads Markdown and bundles and leaves the rest unread', async () => {
    const files = [
      new File(['# Hi'], 'hi.md', { lastModified: T0 }),
      new File(['png'], 'pic.png'),
      new File(['x'.repeat(MAX_NOTE_BYTES + 1)], 'huge.md')
    ];
    const read = await readImportFiles(files);
    expect(read[0]).toEqual({ name: 'hi.md', lastModified: T0, text: '# Hi' });
    expect(read[1].skip).toBe('notSupported');
    expect(read[2].skip).toBe('tooLarge');
  });
});
