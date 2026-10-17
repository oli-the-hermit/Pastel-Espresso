import { describe, expect, it } from 'vitest';
import { chunk } from './notesApi';

const size = (n: number) => n;

describe('chunk', () => {
  it('returns nothing for nothing', () => {
    expect(chunk([], 3, 10, size)).toEqual([]);
  });
  it('splits by count', () => {
    expect(chunk([1, 1, 1, 1, 1], 2, 100, size)).toEqual([[1, 1], [1, 1], [1]]);
  });
  it('splits by size, keeping the order', () => {
    expect(chunk([4, 4, 4, 1, 1], 10, 8, size)).toEqual([[4, 4], [4, 1, 1]]);
  });
  it('gives an item bigger than the limit a run of its own', () => {
    expect(chunk([1, 20, 1], 10, 8, size)).toEqual([[1], [20], [1]]);
  });
  it('never makes an empty run', () => {
    for (const run of chunk([9, 9, 9], 1, 1, size)) expect(run.length).toBe(1);
  });
});
