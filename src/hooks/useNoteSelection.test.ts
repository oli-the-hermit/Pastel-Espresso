import { describe, expect, it } from 'vitest';
import { EMPTY_SELECTION, pick, prune } from './useNoteSelection';

const list = ['a', 'b', 'c', 'd', 'e'];
const ids = (s: { ids: ReadonlySet<string> }) => [...s.ids].sort();

describe('picking notes', () => {
  it('replaces the selection with the one picked', () => {
    const one = pick(EMPTY_SELECTION, 'b', 'replace', list);
    expect(ids(pick(one, 'd', 'replace', list))).toEqual(['d']);
  });

  it('adds and removes with toggle', () => {
    const two = pick(pick(EMPTY_SELECTION, 'a', 'toggle', list), 'c', 'toggle', list);
    expect(ids(two)).toEqual(['a', 'c']);
    expect(ids(pick(two, 'a', 'toggle', list))).toEqual(['c']);
  });

  it('selects from the anchor to the one picked, in either direction', () => {
    const start = pick(EMPTY_SELECTION, 'b', 'replace', list);
    expect(ids(pick(start, 'd', 'range', list))).toEqual(['b', 'c', 'd']);
    expect(ids(pick(start, 'a', 'range', list))).toEqual(['a', 'b']);
  });

  it('keeps the anchor across ranges', () => {
    const start = pick(EMPTY_SELECTION, 'b', 'replace', list);
    const wide = pick(start, 'e', 'range', list);
    expect(ids(pick(wide, 'c', 'range', list))).toEqual(['b', 'c']);
  });

  it('starts a range from the note itself when there is no anchor', () => {
    expect(ids(pick(EMPTY_SELECTION, 'c', 'range', list))).toEqual(['c']);
  });
});

describe('keeping the selection to what is visible', () => {
  it('drops notes that left the list', () => {
    const picked = pick(pick(EMPTY_SELECTION, 'a', 'toggle', list), 'c', 'toggle', list);
    expect(ids(prune(picked, ['a', 'b']))).toEqual(['a']);
  });

  it('forgets the anchor when it leaves', () => {
    const picked = pick(EMPTY_SELECTION, 'c', 'replace', list);
    expect(prune(picked, ['a', 'b']).anchor).toBeNull();
  });

  it('returns the same selection when nothing left', () => {
    const picked = pick(EMPTY_SELECTION, 'a', 'replace', list);
    expect(prune(picked, list)).toBe(picked);
  });
});
