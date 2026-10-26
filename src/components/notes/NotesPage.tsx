import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNotes } from '../../context/NotesContext';
import { useNoteSelection } from '../../hooks/useNoteSelection';
import { useNotesLayout } from '../../hooks/useNotesLayout';
import { strings } from '../../constants/strings';
import { plural, format } from '../../lib/i18n';
import { countNotes, listNotes, type NoteScope } from '../../lib/noteList';
import type { Note } from '../../lib/notes';
import { dragHasFiles, droppedFiles } from '../../lib/fileAccess';
import { isImportable } from '../../lib/noteFiles';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { SelectionBar } from '../ui/SelectionBar';
import { TwoColumnLayout } from '../ui/TwoColumnLayout';
import { NoteEditorPage } from './NoteEditorPage';
import { NoteResults } from './NoteResults';
import { NotesDialogs, type NotesDialogState } from './NotesDialogs';
import { NotesSidebar } from './NotesSidebar';
import { NotesToolbar } from './NotesToolbar';
import { useNoteActions } from './useNoteActions';
import { useNoteMenu } from './useNoteMenu';
import { useNoteTransfer } from './useNoteTransfer';

const EMPTY_TEXT: Record<NoteScope['kind'], string> = {
  all: strings.notes.empty.all,
  inbox: strings.notes.empty.inbox,
  collection: strings.notes.empty.collection,
  label: strings.notes.empty.label,
  trash: strings.notes.empty.trash
};

/**
 * Notes: the places they live in on the left, the notes themselves on the right, and the
 * note being written once one is opened. Opening this page is all it takes to load them.
 */
export const NotesPage: React.FC = () => {
  const { activeTab } = useApp();
  const { notes, collections, labels, status, unreadable, loadNotes, createNote } = useNotes();
  const actions = useNoteActions();
  const layout = useNotesLayout();
  const [scope, setScope] = useState<NoteScope>({ kind: 'all' });
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState<NotesDialogState | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [dropping, setDropping] = useState(false);
  const transfer = useNoteTransfer();
  const s = strings.notes;

  // The notes load the first time the page is shown, and again on a retry.
  useEffect(() => {
    if (activeTab === 'notes' && status === 'idle') loadNotes().catch(() => {});
  }, [activeTab, status, loadNotes]);

  // A collection or label deleted while it's open sends you back to everything.
  useEffect(() => {
    const gone =
      (scope.kind === 'collection' && !collections.some(c => c.id === scope.id)) ||
      (scope.kind === 'label' && !labels.some(l => l.id === scope.id));
    if (gone) setScope({ kind: 'all' });
  }, [scope, collections, labels]);

  const counts = useMemo(() => countNotes(notes), [notes]);
  const visible = useMemo(
    () => listNotes({ notes, scope, query, sort: layout.sort, collections, labels, untitled: s.untitled }),
    [notes, scope, query, layout.sort, collections, labels, s.untitled]
  );
  const selection = useNoteSelection(useMemo(() => visible.map(n => n.id), [visible]));
  const inTrash = scope.kind === 'trash';
  // An export from a collection is named after it.
  const scopeTitle = scope.kind === 'collection' ? collections.find(c => c.id === scope.id)?.name : undefined;
  const selectedIds = [...selection.ids];

  const openNote = (id: string) => setOpenId(id);
  const menuFor = useNoteMenu(openNote, setDialog);

  const newNote = () =>
    actions.run(async () => {
      const id = await createNote({
        collectionId: scope.kind === 'collection' ? scope.id : null,
        labelIds: scope.kind === 'label' ? [scope.id] : []
      });
      openNote(id);
    });

  const press = (note: Note, e: React.MouseEvent) => {
    if (e.shiftKey) selection.select(note.id, 'range');
    else if (e.ctrlKey || e.metaKey || selection.count > 0) selection.select(note.id, 'toggle');
    // A note in the Trash can't be opened; it's picked to restore or delete.
    else if (inTrash) selection.select(note.id, 'toggle');
    else openNote(note.id);
  };
  const check = (note: Note, e: React.MouseEvent) => selection.select(note.id, e.shiftKey ? 'range' : 'toggle');

  const changeScope = (next: NoteScope) => {
    setScope(next);
    setQuery('');
    selection.clear();
  };
  const showImported = (collectionId: string | null) => {
    if (collectionId) changeScope({ kind: 'collection', id: collectionId });
  };

  // Files dropped anywhere on the list go to the import preview. Notes being dragged carry no files.
  const dropProps: React.HTMLAttributes<HTMLDivElement> = {
    onDragOver: e => {
      if (!dragHasFiles(e.dataTransfer)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setDropping(true);
    },
    onDragLeave: e => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropping(false);
    },
    onDrop: e => {
      if (!dragHasFiles(e.dataTransfer)) return;
      e.preventDefault();
      setDropping(false);
      const dropped = droppedFiles(e.dataTransfer, isImportable);
      void (async () => {
        const { files, folder } = await dropped;
        const plan = files.length > 0 ? await transfer.plan(files, folder) : null;
        if (plan) setDialog({ kind: 'import-preview', plan });
      })();
    }
  };

  if (openId) {
    return (
      <>
        <NoteEditorPage key={openId} id={openId} onBack={() => setOpenId(null)} onDialog={setDialog} />
        <NotesDialogs dialog={dialog} onDialog={setDialog} />
      </>
    );
  }

  const showResults = status === 'ready' || notes.length > 0;
  const emptyText = query.trim() ? format(s.empty.search, { query: query.trim() }) : EMPTY_TEXT[scope.kind];

  return (
    <>
      <TwoColumnLayout
        className="notes-layout"
        sidebar={<NotesSidebar scope={scope} onScope={changeScope} counts={counts} onDialog={setDialog} />}
        content={
          <div
            className="notes-main"
            onKeyDown={e => {
              if (e.key === 'Escape' && selection.count > 0) selection.clear();
            }}
            {...(inTrash ? {} : dropProps)}
          >
            <div className="notes-toolbar">
              <NotesToolbar
                query={query}
                onQuery={setQuery}
                sort={layout.sort}
                onSort={layout.setSort}
                view={layout.view}
                onView={layout.setView}
                onNewNote={() => void newNote()}
                onImport={() => setDialog({ kind: 'import' })}
                canCreate={!inTrash}
              />
              {inTrash && counts.trash > 0 && (
                <Button variant="danger" onClick={actions.confirmEmptyTrash}>{strings.notes.confirm.emptyTrash}</Button>
              )}
            </div>

            {selection.count > 0 && (
              <SelectionBar
                ariaLabel={s.selectionLabel}
                summary={format(s.selected, { count: selection.count })}
                clearLabel={s.clearSelection}
                onClear={selection.clear}
              >
                {selection.count < visible.length && <Button size="sm" onClick={selection.selectAll}>{s.selectAll}</Button>}
                {inTrash ? (
                  <>
                    <Button size="sm" onClick={() => void actions.restore(selectedIds)}>{s.menu.restore}</Button>
                    <Button size="sm" variant="danger" onClick={() => actions.confirmDeleteForever(selectedIds)}>{s.menu.deleteForever}</Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" onClick={() => setDialog({ kind: 'move', ids: selectedIds })}>{s.menu.moveTo}</Button>
                    <Button size="sm" onClick={() => setDialog({ kind: 'labels', ids: selectedIds })}>{s.menu.labels}</Button>
                    <Button size="sm" onClick={() => setDialog({ kind: 'export', ids: selectedIds, title: scopeTitle })}>{s.menu.export}</Button>
                    <Button size="sm" variant="danger" onClick={() => void actions.trash(selectedIds)}>{s.menu.moveToTrash}</Button>
                  </>
                )}
              </SelectionBar>
            )}

            {dropping ? (
              <EmptyState role="status">{s.transfer.dropHere}</EmptyState>
            ) : status === 'error' && notes.length === 0 ? (
              <EmptyState>
                <p>{s.loadError}</p>
                <Button onClick={() => loadNotes().catch(() => {})}>{s.retry}</Button>
              </EmptyState>
            ) : !showResults ? (
              <EmptyState role="status">{s.loading}</EmptyState>
            ) : visible.length === 0 ? (
              <EmptyState>{emptyText}</EmptyState>
            ) : (
              <NoteResults
                notes={visible}
                view={layout.view}
                scope={scope}
                selecting={selection.count > 0}
                isSelected={selection.isSelected}
                menuFor={menuFor}
                onPress={press}
                onCheck={check}
                onOpen={note => (inTrash ? selection.select(note.id, 'toggle') : openNote(note.id))}
                onToggle={note => selection.select(note.id, 'toggle')}
              />
            )}

            {unreadable > 0 && <EmptyState size="sm" role="status">{plural(unreadable, s.unreadable)}</EmptyState>}
          </div>
        }
      />
      <NotesDialogs dialog={dialog} onDialog={setDialog} onImported={showImported} />
    </>
  );
};
