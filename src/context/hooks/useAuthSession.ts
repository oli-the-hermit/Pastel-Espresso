import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Profile, ShowToast } from '../../types';
import { api } from '../../lib/api';
import { deriveDataKey, decryptBlob, randomSaltHex, exportRawKey, importRawKey, generateDataKey } from '../../lib/crypto';
import { readNotesKey, sealState } from '../../lib/persistence';
import { strings } from '../../constants/strings';
import { clearTimerRun, loadTimerRun, storage } from '../../lib/storage';
import { TIMING } from '../../constants/timing';
import { normalizeState } from '../../lib/normalize';

export type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated';

interface AuthDataResponse {
  salt: string;
  iv: string;
  cipher: string;
}

interface AuthResponse {
  token: string;
  profile: Profile;
  data: AuthDataResponse;
}

interface AuthSessionDeps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  showToast: ShowToast;
  /** Resets UI state (tab, tour, help, alert) after signing out. */
  onSignedOut: () => void;
}

/**
 * Sign-in state and the encrypted data layer: restores the session on startup,
 * auto-saves the sealed state (debounced), and the auth actions.
 */
export function useAuthSession({ state, setState, showToast, onSignedOut }: AuthSessionDeps) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [profile, setProfile] = useState<Profile | null>(null);
  const tokenRef = useRef<string | null>(null);
  const dataKeyRef = useRef<CryptoKey | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const authStatusRef = useRef<AuthStatus>('loading');
  authStatusRef.current = authStatus;
  const latestStateRef = useRef(state);
  latestStateRef.current = state;

  // Notes are sealed with their own key, kept inside the encrypted profile data (never in
  // React state). It is saved before any note is sealed with it.
  const notesKeyRef = useRef<string | null>(null);
  const notesKeySavedRef = useRef(false);
  const notesKeyTaskRef = useRef<Promise<CryptoKey> | null>(null);

  // Profile-data writes run one at a time, in order, and seal when they run: a slow earlier
  // save can't land on top of a newer one, and every save carries the current notes key.
  const writeChainRef = useRef<Promise<void>>(Promise.resolve());

  const adoptNotesKey = (raw: unknown) => {
    notesKeyRef.current = readNotesKey(raw);
    notesKeySavedRef.current = notesKeyRef.current !== null;
  };
  const forgetNotesKey = () => {
    notesKeyRef.current = null;
    notesKeySavedRef.current = false;
    notesKeyTaskRef.current = null;
  };

  /** Queues a save of `snapshot` under the current data key and notes key (reads refs only, so it's stable). */
  const writeBlob = useCallback((snapshot: AppState): Promise<void> => {
    const run = writeChainRef.current.then(async () => {
      const token = tokenRef.current;
      const key = dataKeyRef.current;
      if (!token || !key) return;
      await api.put('/api/data', await sealState(snapshot, key, notesKeyRef.current), token);
    });
    writeChainRef.current = run.catch(() => {});
    return run;
  }, []);

  // Auto-authenticate & restore persistent session on startup
  useEffect(() => {
    let cancelled = false;

    const bootstrapAuth = async () => {
      try {
        const storedToken = storage.get('authToken');
        const storedKeyMaterial = storage.get('authKey');

        if (!storedToken || !storedKeyMaterial) {
          if (!cancelled) setAuthStatus('unauthenticated');
          return;
        }

        const key = await importRawKey(storedKeyMaterial);
        tokenRef.current = storedToken;
        dataKeyRef.current = key;

        const [meRes, dataRes] = await Promise.all([
          api.get<{ profile: Profile }>('/api/auth/me', storedToken),
          api.get<AuthDataResponse>('/api/data', storedToken)
        ]);

        let nextState = normalizeState(null);
        forgetNotesKey();
        if (dataRes.cipher && dataRes.iv) {
          const raw: unknown = JSON.parse(await decryptBlob({ iv: dataRes.iv, cipher: dataRes.cipher }, key));
          adoptNotesKey(raw);
          nextState = normalizeState(raw);
        }

        // Restore active running timer if valid
        const runInfo = loadTimerRun();
        if (runInfo) {
          const now = Date.now();
          if (runInfo.targetEndTime > now) {
            const remainingSecs = Math.max(1, Math.ceil((runInfo.targetEndTime - now) / 1000));
            nextState = {
              ...nextState,
              timer: {
                ...nextState.timer,
                phase: runInfo.phase,
                status: 'running',
                remaining: remainingSecs,
                total: runInfo.total || nextState.timer.total,
                endsAt: runInfo.targetEndTime
              }
            };
          } else {
            clearTimerRun();
          }
        }

        if (!cancelled) {
          setProfile(meRes.profile);
          setState(nextState);
          setAuthStatus('authenticated');
        }
      } catch {
        if (!cancelled) {
          storage.remove('authToken', 'authKey', 'timerRun');
          tokenRef.current = null;
          dataKeyRef.current = null;
          forgetNotesKey();
          setProfile(null);
          setAuthStatus('unauthenticated');
        }
      }
    };

    bootstrapAuth();
    return () => {
      cancelled = true;
    };
    // setState is stable, so this runs once on mount.
  }, [setState]);

  // Encrypted persistence (debounced) — only when authenticated
  useEffect(() => {
    if (authStatus !== 'authenticated' || !dataKeyRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      if (authStatusRef.current !== 'authenticated') return;
      writeBlob(state).catch(err => console.warn('Failed to persist data:', err));
    }, TIMING.saveDebounceMs);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state, authStatus, writeBlob]);

  /**
   * The key notes are sealed with. Created on first use and saved into the profile data
   * before it's handed out, so no note is ever sealed with a key that could be lost.
   */
  const getNotesKey = (): Promise<CryptoKey> => {
    notesKeyTaskRef.current ??= (async () => {
      if (!tokenRef.current || !dataKeyRef.current) throw new Error(strings.errors.api.SESSION_EXPIRED);
      if (!notesKeyRef.current) notesKeyRef.current = await exportRawKey(await generateDataKey());
      if (!notesKeySavedRef.current) {
        await writeBlob(latestStateRef.current);
        notesKeySavedRef.current = true;
      }
      return importRawKey(notesKeyRef.current);
    })().finally(() => {
      notesKeyTaskRef.current = null;
    });
    return notesKeyTaskRef.current;
  };

  // ── Auth actions ─────────────────────────────────────────────────────
  const login = async (username: string, password: string) => {
    const res = await api.post<AuthResponse>('/api/auth/login', { username, password });
    tokenRef.current = res.token;
    let next = normalizeState(null);
    const key = await deriveDataKey(password, res.data.salt);
    forgetNotesKey();
    if (res.data.cipher && res.data.iv) {
      const raw: unknown = JSON.parse(await decryptBlob({ iv: res.data.iv, cipher: res.data.cipher }, key));
      adoptNotesKey(raw);
      next = normalizeState(raw);
    }
    dataKeyRef.current = key;
    const rawKeyB64 = await exportRawKey(key);
    storage.set('authToken', res.token);
    storage.set('authKey', rawKeyB64);
    setProfile(res.profile);
    setAuthStatus('authenticated');
    setState(next);
  };

  const setup = async (username: string, displayName: string, password: string) => {
    const legacyRaw = storage.get('legacyData');
    const res = await api.post<AuthResponse>('/api/auth/setup', { username, displayName, password });
    tokenRef.current = res.token;
    const key = await deriveDataKey(password, res.data.salt);
    dataKeyRef.current = key;
    forgetNotesKey();
    const rawKeyB64 = await exportRawKey(key);
    storage.set('authToken', res.token);
    storage.set('authKey', rawKeyB64);

    let next = normalizeState(null);
    let migrated = false;
    if (legacyRaw) {
      try {
        next = normalizeState(JSON.parse(legacyRaw));
        storage.remove('legacyData');
        migrated = true;
      } catch {
        // Fall back to fresh defaults
      }
    }
    setProfile(res.profile);
    setAuthStatus('authenticated');
    setState(next);
    showToast(migrated ? strings.toasts.dataImported : strings.toasts.setupComplete);
  };

  const logout = async () => {
    const token = tokenRef.current;
    if (token && dataKeyRef.current && authStatus === 'authenticated') {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      // Best effort: every change was already auto-saved; this only flushes the last one.
      await writeBlob(state).catch(() => {});
    }
    if (token) {
      try {
        await api.post('/api/auth/logout', {}, token);
      } catch {
        // Signing out locally must work even when the server can't be reached.
      }
    }
    storage.remove('authToken', 'authKey', 'timerRun');
    tokenRef.current = null;
    dataKeyRef.current = null;
    forgetNotesKey();
    setProfile(null);
    setAuthStatus('unauthenticated');
    onSignedOut();
    setState(() => normalizeState(null));
  };

  const deleteOwnProfile = async (password: string) => {
    await api.del('/api/profile', { password }, tokenRef.current);
    storage.remove('authToken', 'authKey', 'timerRun');
    tokenRef.current = null;
    dataKeyRef.current = null;
    forgetNotesKey();
    setProfile(null);
    setAuthStatus('unauthenticated');
    setState(() => normalizeState(null));
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!dataKeyRef.current || !tokenRef.current || authStatus !== 'authenticated') {
      throw new Error(strings.errors.api.SESSION_EXPIRED);
    }
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    // Re-encrypt the whole blob under a fresh salt + new password-derived key. It runs in the
    // write queue: earlier saves (old key) land first, later ones already use the new key.
    // The notes key travels inside unchanged, so no note needs re-sealing.
    const newSalt = randomSaltHex();
    const newKey = await deriveDataKey(newPassword, newSalt);
    const run = writeChainRef.current.then(async () => {
      const sealed = await sealState(latestStateRef.current, newKey, notesKeyRef.current);
      const res = await api.put<AuthResponse>(
        '/api/profile/password',
        {
          currentPassword,
          newPassword,
          salt: newSalt,
          iv: sealed.iv,
          cipher: sealed.cipher
        },
        tokenRef.current
      );
      tokenRef.current = res.token;
      dataKeyRef.current = newKey;
      return res;
    });
    writeChainRef.current = run.then(() => {}, () => {});
    const res = await run;
    const rawKeyB64 = await exportRawKey(newKey);
    storage.set('authToken', res.token);
    storage.set('authKey', rawKeyB64);
    setProfile(res.profile);
    showToast(strings.profile.passwordChangedMsg);
  };

  const refreshProfile = (updated: Profile) => setProfile(updated);

  return { authStatus, profile, tokenRef, getNotesKey, login, setup, logout, deleteOwnProfile, changePassword, refreshProfile };
}
