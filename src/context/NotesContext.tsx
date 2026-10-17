/**
 * Notes, kept apart from the app's main state so a change to one doesn't re-render the rest.
 * The list holds every note's metadata, opened on the device; a body loads when its note
 * opens. Changes are saved straight away, one write at a time per note.
 */
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from './AppContext';
import {
  metaOf,
  newNoteId,
  newNoteMeta,
  openNoteBody,
  openNoteMeta,
  sealNoteBody,
  sealNoteMeta,
  type Note,
  type NoteCollection,
  type NoteLabel,
  type NoteMeta
} from '../lib/notes';
import { notesApi } from '../lib/notesApi';

export type NotesStatus = 'idle' | 'loading' | 'ready' | 'error';

/** A note to import: its Markdown and whatever metadata the source had. */
export interface NoteImport {
  body: string;
  meta?: Partial<NoteMeta>;
}

interface NotesActions {
  /** Opens every note's metadata. Lists only; bodies load per note with readNote. */
  loadNotes: () => Promise<void>;
  /** Saves a new note (untitled, in the Inbox unless `meta` says otherwise) and returns its id. */
  createNote: (meta?: Partial<NoteMeta>, body?: string) => Promise<string>;
  readNote: (id: string) => Promise<string>;
  /** Saves new text. Saves of one note run in order, and a save a newer one replaced is skipped. */
  saveNote: (id: string, body: string) => Promise<void>;
  /** Renames, moves, labels, pins, trashes or restores; the text and its edit time stay as they are. */
  updateNotes: (ids: string[], changes: Partial<NoteMeta>) => Promise<void>;
  /** Deletes for good. */
  purgeNotes: (ids: string[]) => Promise<number>;
  /** Adds many notes at once (import), keeping their dates; returns the new ids in order. */
  importNotes: (items: NoteImport[]) => Promise<string[]>;
  createCollection: (name: string) => string;
  renameCollection: (id: string, name: string) => void;
  /** Moves the collection's notes to the Inbox, then removes it. */
  deleteCollection: (id: string) => Promise<void>;
  createLabel: (name: string) => string;
  renameLabel: (id: string, name: string) => void;
  /** Takes the label off every note, then removes it. */
  deleteLabel: (id: string) => Promise<void>;
}

interface NotesContextType extends NotesActions {
  notes: Note[];
  status: NotesStatus;
  /** Notes whose metadata couldn't be opened on this device (left out of `notes`). */
  unreadable: number;
  collections: NoteCollection[];
  labels: NoteLabel[];
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const app = useApp();
  const appRef = useRef(app);
  appRef.current = app;

  const [notes, setNotes] = useState<Note[]>([]);
  const [status, setStatus] = useState<NotesStatus>('idle');
  const [unreadable, setUnreadable] = useState(0);
  // Writes read the list when they run, which can be before React applies a change, so the
  // ref is updated first (changeNotes) and is the one source both read.
  const notesRef = useRef<Note[]>([]);
  const statusRef = useRef<NotesStatus>('idle');
  const loadingRef = useRef<Promise<void> | null>(null);
  const writesRef = useRef(new Map<string, Promise<void>>());
  const pendingBodyRef = useRef(new Map<string, { body: string; version: number }>());
  const versionRef = useRef(0);

  const profileId = app.profile?.id ?? null;
  useEffect(() => {
    notesRef.current = [];
    statusRef.current = 'idle';
    loadingRef.current = null;
    writesRef.current.clear();
    pendingBodyRef.current.clear();
    setNotes([]);
    setStatus('idle');
    setUnreadable(0);
  }, [profileId]);

  const actions = useMemo<NotesActions>(() => {
    const token = () => appRef.current.token;
    const key = () => appRef.current.getNotesKey();

    const changeNotes = (fn: (list: Note[]) => Note[]) => {
      notesRef.current = fn(notesRef.current);
      setNotes(notesRef.current);
    };
    const changeStatus = (next: NotesStatus) => {
      statusRef.current = next;
      setStatus(next);
    };

    /** Runs `task` after every earlier write of the same note. */
    const queueWrite = (id: string, task: () => Promise<void>): Promise<void> => {
      const run = (writesRef.current.get(id) ?? Promise.resolve()).then(task);
      const tail = run.catch(() => {});
      writesRef.current.set(id, tail);
      tail.then(() => {
        if (writesRef.current.get(id) === tail) writesRef.current.delete(id);
      });
      return run;
    };

    const loadNotes = (): Promise<void> => {
      loadingRef.current ??= (async () => {
        changeStatus('loading');
        try {
          const stored = await notesApi.list(token());
          // Nothing stored yet means there's no key to fetch: opening Notes alone creates nothing.
          const k = stored.length > 0 ? await key() : null;
          const opened = await Promise.allSettled(
            stored.map(async d => ({ ...(await openNoteMeta(d.meta, k!)), id: d.id, savedAt: d.updatedAt }))
          );
          const list = opened.flatMap(r => (r.status === 'fulfilled' ? [r.value] : []));
          setUnreadable(opened.length - list.length);
          changeNotes(() => list);
          changeStatus('ready');
        } catch (err) {
          changeStatus('error');
          throw err;
        } finally {
          loadingRef.current = null;
        }
      })();
      return loadingRef.current;
    };

    const ensureLoaded = () => (statusRef.current === 'ready' ? Promise.resolve() : loadNotes());

    /** Saves each note's metadata after `change`; on any failure the list reloads from the server. */
    const patchNotes = async (ids: string[], change: (note: Note) => Partial<NoteMeta>) => {
      const targets = new Set(ids);
      changeNotes(list => list.map(n => (targets.has(n.id) ? { ...n, ...change(n) } : n)));
      const results = await Promise.allSettled(
        ids.map(id =>
          queueWrite(id, async () => {
            const note = notesRef.current.find(n => n.id === id);
            if (!note) return;
            const saved = await notesApi.save(token(), id, await sealNoteMeta(metaOf(note), await key()));
            changeNotes(list => list.map(n => (n.id === id ? { ...n, savedAt: saved.updatedAt } : n)));
          })
        )
      );
      const failed = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
      if (failed) {
        await loadNotes().catch(() => {});
        throw failed.reason;
      }
    };

    return {
      loadNotes,

      async createNote(meta = {}, body = '') {
        const k = await key();
        const id = newNoteId();
        const full = newNoteMeta(Date.now(), meta);
        const [sealedMeta, sealedBody] = await Promise.all([sealNoteMeta(full, k), sealNoteBody(body, k)]);
        const saved = await notesApi.save(token(), id, sealedMeta, sealedBody);
        changeNotes(list => [{ ...full, id, savedAt: saved.updatedAt }, ...list]);
        return id;
      },

      async readNote(id) {
        // Text still waiting to be saved is the newest there is.
        const pending = pendingBodyRef.current.get(id);
        if (pending) return pending.body;
        const [k, stored] = await Promise.all([key(), notesApi.get(token(), id)]);
        return openNoteBody(stored.body, k);
      },

      saveNote(id, body) {
        const version = ++versionRef.current;
        pendingBodyRef.current.set(id, { body, version });
        return queueWrite(id, async () => {
          if (pendingBodyRef.current.get(id)?.version !== version) return; // a newer save writes instead
          const note = notesRef.current.find(n => n.id === id);
          if (!note) return;
          const k = await key();
          const meta = { ...metaOf(note), editedAt: Date.now() };
          const [sealedMeta, sealedBody] = await Promise.all([sealNoteMeta(meta, k), sealNoteBody(body, k)]);
          const saved = await notesApi.save(token(), id, sealedMeta, sealedBody);
          if (pendingBodyRef.current.get(id)?.version === version) pendingBodyRef.current.delete(id);
          changeNotes(list => list.map(n => (n.id === id ? { ...n, editedAt: meta.editedAt, savedAt: saved.updatedAt } : n)));
        });
      },

      updateNotes: (ids, changes) => patchNotes(ids, () => changes),

      async purgeNotes(ids) {
        // A save still on its way would otherwise create the note again after the purge.
        for (const id of ids) pendingBodyRef.current.delete(id);
        await Promise.all(ids.map(id => writesRef.current.get(id)));
        const deleted = await notesApi.purge(token(), ids);
        const gone = new Set(ids);
        changeNotes(list => list.filter(n => !gone.has(n.id)));
        return deleted;
      },

      async importNotes(items) {
        if (items.length === 0) return [];
        const k = await key();
        const now = Date.now();
        const prepared = await Promise.all(
          items.map(async item => {
            const id = newNoteId();
            const meta = newNoteMeta(now, item.meta);
            const [sealedMeta, sealedBody] = await Promise.all([sealNoteMeta(meta, k), sealNoteBody(item.body, k)]);
            return { id, meta, stored: { id, meta: sealedMeta, body: sealedBody } };
          })
        );
        try {
          const saved = new Map((await notesApi.createMany(token(), prepared.map(p => p.stored))).map(s => [s.id, s.updatedAt]));
          changeNotes(list => [...prepared.map(p => ({ ...p.meta, id: p.id, savedAt: saved.get(p.id) ?? now })), ...list]);
          return prepared.map(p => p.id);
        } catch (err) {
          // Imports go in several requests; show whichever landed before the error.
          await loadNotes().catch(() => {});
          throw err;
        }
      },

      createCollection: name => appRef.current.createNoteCollection(name),
      renameCollection: (id, name) => appRef.current.renameNoteCollection(id, name),
      async deleteCollection(id) {
        await ensureLoaded();
        const inIt = notesRef.current.filter(n => n.collectionId === id).map(n => n.id);
        if (inIt.length > 0) await patchNotes(inIt, () => ({ collectionId: null }));
        appRef.current.removeNoteCollection(id);
      },

      createLabel: name => appRef.current.createNoteLabel(name),
      renameLabel: (id, name) => appRef.current.renameNoteLabel(id, name),
      async deleteLabel(id) {
        await ensureLoaded();
        const tagged = notesRef.current.filter(n => n.labelIds.includes(id)).map(n => n.id);
        if (tagged.length > 0) await patchNotes(tagged, n => ({ labelIds: n.labelIds.filter(l => l !== id) }));
        appRef.current.removeNoteLabel(id);
      }
    };
  }, []);

  return (
    <NotesContext.Provider
      value={{ notes, status, unreadable, collections: app.state.noteCollections, labels: app.state.noteLabels, ...actions }}
    >
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error('useNotes must be used within NotesProvider');
  return ctx;
};
