/** The notes endpoints (server/app.js and its Rust port), with imports and purges split to fit their limits. */
import { api } from './api';
import { LIMITS } from '../constants/limits';
import type { SealedBlob } from './crypto';

export interface StoredNoteSummary {
  id: string;
  meta: SealedBlob;
  createdAt: number;
  updatedAt: number;
}

export interface StoredNote extends StoredNoteSummary {
  body: SealedBlob;
}

export interface NoteSaved {
  id: string;
  createdAt: number;
  updatedAt: number;
}

export interface NewStoredNote {
  id: string;
  meta: SealedBlob;
  body: SealedBlob;
}

/** JSON per batch request, kept under the web server's 2 MB body limit (express.json in server/app.js). */
export const MAX_REQUEST_CHARS = 1_900_000;

/**
 * Splits `items`, in order, into runs of at most `maxCount` whose sizes add up to at most
 * `maxSize`. An item bigger than `maxSize` on its own still gets a run of its own.
 */
export function chunk<T>(items: T[], maxCount: number, maxSize: number, size: (item: T) => number): T[][] {
  const runs: T[][] = [];
  let current: T[] = [];
  let used = 0;
  for (const item of items) {
    const s = size(item);
    if (current.length > 0 && (current.length >= maxCount || used + s > maxSize)) {
      runs.push(current);
      current = [];
      used = 0;
    }
    current.push(item);
    used += s;
  }
  if (current.length > 0) runs.push(current);
  return runs;
}

const requestChars = (doc: NewStoredNote) => JSON.stringify(doc).length + 1;

export const notesApi = {
  /** Every note's sealed metadata, newest stored first. */
  list: async (token: string | null) =>
    (await api.get<{ documents: StoredNoteSummary[] }>('/api/documents', token)).documents,

  get: async (token: string | null, id: string) =>
    (await api.get<{ document: StoredNote }>(`/api/documents/${id}`, token)).document,

  /** Creates (needs `body`) or updates a note; leave `body` out to change only its metadata. */
  save: async (token: string | null, id: string, meta: SealedBlob, body?: SealedBlob) =>
    (await api.put<{ document: NoteSaved }>(`/api/documents/${id}`, body ? { meta, body } : { meta }, token)).document,

  /**
   * Adds new notes in as few requests as the limits allow. Each request is all or nothing;
   * if a later one fails, the earlier ones stay saved and the error says what stopped it.
   */
  async createMany(token: string | null, docs: NewStoredNote[]): Promise<NoteSaved[]> {
    const saved: NoteSaved[] = [];
    for (const run of chunk(docs, LIMITS.documents.maxBatch, MAX_REQUEST_CHARS, requestChars)) {
      saved.push(...(await api.post<{ documents: NoteSaved[] }>('/api/documents/batch', { documents: run }, token)).documents);
    }
    return saved;
  },

  /** Deletes notes for good; ids the server doesn't know don't count. */
  async purge(token: string | null, ids: string[]): Promise<number> {
    let deleted = 0;
    for (const run of chunk(ids, LIMITS.documents.maxBatch, Infinity, () => 0)) {
      deleted += (await api.post<{ deleted: number }>('/api/documents/purge', { ids: run }, token)).deleted;
    }
    return deleted;
  }
};
