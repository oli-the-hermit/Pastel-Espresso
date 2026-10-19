import { useApp } from '../../context/AppContext';
import { useNotes } from '../../context/NotesContext';
import { strings } from '../../constants/strings';
import { format, plural } from '../../lib/i18n';
import type { Note } from '../../lib/notes';
import { noteTitle } from './noteText';

/** Groups notes by a value, so a change that differs per note can be undone in as few writes as possible. */
function groupBy<K>(notes: readonly Note[], key: (n: Note) => K): Map<K, string[]> {
  const groups = new Map<K, string[]>();
  for (const n of notes) groups.set(key(n), [...(groups.get(key(n)) ?? []), n.id]);
  return groups;
}

/**
 * What can be done to notes from a menu or the selection bar: each action saves, says what
 * happened, and, where it helps, offers Undo. A failed save is announced and the list
 * reloads to what the server holds.
 */
export function useNoteActions() {
  const { notes, collections, updateNotes, purgeNotes } = useNotes();
  const { showToast, openModal } = useApp();
  const t = strings.notes.toasts;

  const named = (ids: string[]) => notes.filter(n => ids.includes(n.id));

  const run = async (task: () => Promise<void>) => {
    try {
      await task();
    } catch {
      showToast(t.failed, 'error');
    }
  };

  const moveTo = (ids: string[], collectionId: string | null) => {
    const before = named(ids);
    const place = collectionId === null ? strings.notes.scopes.inbox : collections.find(c => c.id === collectionId)?.name ?? '';
    return run(async () => {
      await updateNotes(ids, { collectionId });
      showToast(plural(ids.length, t.moved, { place }), 'success', {
        label: t.undo,
        onClick: () => {
          void run(async () => {
            for (const [from, group] of groupBy(before, n => n.collectionId)) await updateNotes(group, { collectionId: from });
          });
        }
      });
    });
  };

  const trash = (ids: string[]) =>
    run(async () => {
      await updateNotes(ids, { trashedAt: Date.now() });
      showToast(plural(ids.length, t.trashed), 'success', {
        label: t.undo,
        onClick: () => void run(() => updateNotes(ids, { trashedAt: null }))
      });
    });

  const restore = (ids: string[]) =>
    run(async () => {
      await updateNotes(ids, { trashedAt: null });
      showToast(plural(ids.length, t.restored));
    });

  const pin = (ids: string[], pinned: boolean) => run(() => updateNotes(ids, { pinned }));

  /** Puts a label on every one of the notes that lacks it, or takes it off every one that has it. */
  const setLabel = (ids: string[], labelId: string, on: boolean) =>
    run(async () => {
      const targets = named(ids).filter(n => n.labelIds.includes(labelId) !== on);
      await Promise.all(
        targets.map(n =>
          updateNotes([n.id], { labelIds: on ? [...n.labelIds, labelId] : n.labelIds.filter(l => l !== labelId) })
        )
      );
    });

  const rename = (id: string, title: string) =>
    run(async () => {
      await updateNotes([id], { title });
      showToast(t.noteRenamed);
    });

  const confirmDeleteForever = (ids: string[]) => {
    const c = strings.notes.confirm;
    const [only] = named(ids);
    openModal('CONFIRM_DELETE', {
      title: c.deleteForeverTitle,
      message: ids.length === 1 && only ? format(c.deleteForeverOne, { title: noteTitle(only) }) : format(c.deleteForeverMany, { count: ids.length }),
      confirmLabel: strings.common.delete,
      onConfirm: () =>
        void run(async () => {
          await purgeNotes(ids);
          showToast(plural(ids.length, t.deleted));
        })
    });
  };

  const confirmEmptyTrash = () => {
    const ids = notes.filter(n => n.trashedAt !== null).map(n => n.id);
    if (ids.length === 0) return;
    const c = strings.notes.confirm;
    openModal('CONFIRM_DELETE', {
      title: c.emptyTrashTitle,
      message: plural(ids.length, c.emptyTrashMessage),
      confirmLabel: c.emptyTrash,
      onConfirm: () =>
        void run(async () => {
          await purgeNotes(ids);
          showToast(plural(ids.length, t.deleted));
        })
    });
  };

  return { run, moveTo, trash, restore, pin, setLabel, rename, confirmDeleteForever, confirmEmptyTrash };
}
