import React from 'react';
import { useApp } from '../../context/AppContext';
import { useNotes } from '../../context/NotesContext';
import { strings } from '../../constants/strings';
import { format } from '../../lib/i18n';
import { useNoteActions } from './useNoteActions';
import { sameScope, type NoteCounts, type NoteScope } from '../../lib/noteList';
import { IconEdit, IconExport, IconFolder, IconInbox, IconNotes, IconPlus, IconTag, IconTrash } from '../ui/icons';
import { ScopeList, type ScopeItem } from '../ui/ScopeList';
import type { NotesDialogState } from './NotesDialogs';

export interface NotesSidebarProps {
  scope: NoteScope;
  onScope: (scope: NoteScope) => void;
  counts: NoteCounts;
  onDialog: (dialog: NotesDialogState) => void;
}

/** The places notes live: everything, the Inbox, collections, labels and the Trash. */
export const NotesSidebar: React.FC<NotesSidebarProps> = ({ scope, onScope, counts, onDialog }) => {
  const { notes, collections, labels, deleteCollection, deleteLabel } = useNotes();
  const { openModal, showToast } = useApp();
  const { run } = useNoteActions();
  const s = strings.notes;

  const place = (key: string, label: string, icon: React.ReactNode, target: NoteScope, count?: number): ScopeItem => ({
    key,
    label,
    icon,
    count,
    active: sameScope(scope, target),
    onSelect: () => onScope(target)
  });

  /** A collection's or label's menu; a collection's can also export its notes (none while it's empty). */
  const menuFor = (name: string, rename: () => void, remove: () => void, exportIds?: string[]): Pick<ScopeItem, 'menu' | 'menuLabel'> => ({
    menuLabel: format(s.sideMenu.moreActions, { name }),
    menu: [
      { key: 'rename', label: s.sideMenu.rename, icon: <IconEdit size={15} />, onSelect: rename },
      ...(exportIds
        ? [{ key: 'export', label: s.sideMenu.export, icon: <IconExport size={15} />, disabled: exportIds.length === 0, onSelect: () => onDialog({ kind: 'export', ids: exportIds, title: name }) }]
        : []),
      { key: 'd1', divider: true },
      { key: 'delete', label: s.sideMenu.delete, icon: <IconTrash size={15} />, danger: true, onSelect: remove }
    ]
  });

  return (
    <ScopeList
      ariaLabel={s.scopesTitle}
      sections={[
        {
          key: 'places',
          items: [
            place('all', s.scopes.all, <IconNotes size={18} />, { kind: 'all' }, counts.all),
            place('inbox', s.scopes.inbox, <IconInbox size={18} />, { kind: 'inbox' }, counts.inbox),
            place('trash', s.scopes.trash, <IconTrash size={18} />, { kind: 'trash' }, counts.trash)
          ]
        },
        {
          key: 'collections',
          heading: s.collectionsHeading,
          action: { label: s.newCollection, icon: <IconPlus size={14} strokeWidth={2.4} />, onClick: () => onDialog({ kind: 'name', mode: 'new-collection' }) },
          items: collections.map(c => ({
            ...place(c.id, c.name, <IconFolder size={18} />, { kind: 'collection', id: c.id }, counts.byCollection.get(c.id)),
            ...menuFor(
              c.name,
              () => onDialog({ kind: 'name', mode: 'rename-collection', id: c.id, initial: c.name }),
              () =>
                openModal('CONFIRM_DELETE', {
                  title: s.confirm.deleteCollectionTitle,
                  message: format(s.confirm.deleteCollectionMessage, { name: c.name }),
                  confirmLabel: strings.common.delete,
                  onConfirm: () =>
                    void run(async () => {
                      await deleteCollection(c.id);
                      showToast(s.toasts.collectionDeleted);
                    })
                }),
              notes.filter(n => n.collectionId === c.id && n.trashedAt === null).map(n => n.id)
            )
          }))
        },
        {
          key: 'labels',
          heading: s.labelsHeading,
          action: { label: s.newLabel, icon: <IconPlus size={14} strokeWidth={2.4} />, onClick: () => onDialog({ kind: 'name', mode: 'new-label' }) },
          items: labels.map(l => ({
            ...place(l.id, l.name, <IconTag size={18} />, { kind: 'label', id: l.id }, counts.byLabel.get(l.id)),
            ...menuFor(
              l.name,
              () => onDialog({ kind: 'name', mode: 'rename-label', id: l.id, initial: l.name }),
              () =>
                openModal('CONFIRM_DELETE', {
                  title: s.confirm.deleteLabelTitle,
                  message: format(s.confirm.deleteLabelMessage, { name: l.name }),
                  confirmLabel: strings.common.delete,
                  onConfirm: () =>
                    void run(async () => {
                      await deleteLabel(l.id);
                      showToast(s.toasts.labelDeleted);
                    })
                })
            )
          }))
        }
      ]}
    />
  );
};
