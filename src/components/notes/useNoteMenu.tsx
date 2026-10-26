import React from 'react';
import { strings } from '../../constants/strings';
import type { Note } from '../../lib/notes';
import { IconEdit, IconExport, IconFolder, IconNotes, IconPin, IconReset, IconTag, IconTrash } from '../ui/icons';
import type { MenuItem } from '../ui/Menu';
import type { NotesDialogState } from './NotesDialogs';
import { useNoteActions } from './useNoteActions';

/**
 * The actions on one note, for its ⋮ and its right-click menu. In the Trash a note can only
 * be restored or deleted for good; the text of the others is in strings.notes.menu.
 */
export function useNoteMenu(onOpen: (id: string) => void, onDialog: (dialog: NotesDialogState) => void) {
  const actions = useNoteActions();
  const m = strings.notes.menu;

  return (note: Note): MenuItem[] => {
    if (note.trashedAt !== null) {
      return [
        { key: 'restore', label: m.restore, icon: <IconReset size={15} />, onSelect: () => void actions.restore([note.id]) },
        { key: 'd1', divider: true },
        { key: 'delete', label: m.deleteForever, icon: <IconTrash size={15} />, danger: true, onSelect: () => actions.confirmDeleteForever([note.id]) }
      ];
    }
    return [
      { key: 'open', label: m.open, icon: <IconNotes size={15} />, onSelect: () => onOpen(note.id) },
      { key: 'pin', label: note.pinned ? m.unpin : m.pin, icon: <IconPin size={15} />, onSelect: () => void actions.pin([note.id], !note.pinned) },
      { key: 'move', label: m.moveTo, icon: <IconFolder size={15} />, onSelect: () => onDialog({ kind: 'move', ids: [note.id] }) },
      { key: 'labels', label: m.labels, icon: <IconTag size={15} />, onSelect: () => onDialog({ kind: 'labels', ids: [note.id] }) },
      { key: 'rename', label: strings.common.rename, icon: <IconEdit size={15} />, onSelect: () => onDialog({ kind: 'name', mode: 'rename-note', id: note.id, initial: note.title }) },
      { key: 'export', label: m.export, icon: <IconExport size={15} />, onSelect: () => onDialog({ kind: 'export', ids: [note.id] }) },
      { key: 'd1', divider: true },
      { key: 'trash', label: m.moveToTrash, icon: <IconTrash size={15} />, danger: true, onSelect: () => void actions.trash([note.id]) }
    ];
  };
}
