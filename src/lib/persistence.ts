import type { AppState } from '../types';
import { encryptBlob, type SealedBlob } from './crypto';

/**
 * The state as it's saved. A running timer is stored as idle: the live run is
 * restored from its own record (loadTimerRun in lib/storage) instead.
 */
export function stateForSave(state: AppState): AppState {
  return { ...state, timer: { ...state.timer, status: 'idle', endsAt: null } };
}

/**
 * Encrypts the saveable state with the profile's data key. Notes are sealed with their own
 * key, which travels inside this blob (so a password change never re-seals a note); every
 * caller must pass it, or the saved profile would lose it and its notes with it.
 */
export function sealState(state: AppState, key: CryptoKey, notesKey: string | null): Promise<SealedBlob> {
  const saved = notesKey ? { ...stateForSave(state), notesKey } : stateForSave(state);
  return encryptBlob(JSON.stringify(saved), key);
}

/** The notes key stored in a decrypted blob, before normalizeState drops unknown fields. */
export function readNotesKey(raw: unknown): string | null {
  const value = raw && typeof raw === 'object' ? (raw as { notesKey?: unknown }).notesKey : null;
  return typeof value === 'string' && value.length > 0 ? value : null;
}
