import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { useNotes } from '../../context/NotesContext';
import { strings } from '../../constants/strings';
import { Chip } from '../ui/Chip';
import { EmptyState } from '../ui/EmptyState';
import { IconButton } from '../ui/IconButton';
import { InlineTextArea } from '../ui/InlineTextArea';
import { Menu } from '../ui/Menu';
import { IconChevronLeft } from '../ui/icons';
import type { NotesDialogState } from './NotesDialogs';
import { useNoteActions } from './useNoteActions';
import { useNoteMenu } from './useNoteMenu';

// The editor engine is large, so it loads when a note opens, not at startup.
const DocEditor = lazy(() => import('../ui/DocEditor').then(m => ({ default: m.DocEditor })));

/** How long typing pauses before it is saved. */
const SAVE_DELAY_MS = 600;

type SaveState = 'saved' | 'saving' | 'error';

export interface NoteEditorPageProps {
  id: string;
  onBack: () => void;
  onDialog: (dialog: NotesDialogState) => void;
}

/** One note, open for writing: a title, the formatting toolbar and the text. There is no Save button; it saves as you type. */
export const NoteEditorPage: React.FC<NoteEditorPageProps> = ({ id, onBack, onDialog }) => {
  const { notes, readNote, saveNote, updateNotes } = useNotes();
  const actions = useNoteActions();
  const menuFor = useNoteMenu(() => {}, onDialog);
  const e = strings.notes.editor;
  const note = notes.find(n => n.id === id);

  const [body, setBody] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const timer = useRef<number | undefined>(undefined);
  const unsaved = useRef<string | null>(null);

  useEffect(() => {
    let current = true;
    readNote(id).then(
      text => current && setBody(text),
      () => current && setLoadFailed(true)
    );
    return () => {
      current = false;
    };
  }, [id, readNote]);

  /** Saves what's typed so far, now. */
  const flush = useCallback(() => {
    window.clearTimeout(timer.current);
    const text = unsaved.current;
    if (text === null) return;
    unsaved.current = null;
    setSaveState('saving');
    saveNote(id, text).then(
      () => {
        if (unsaved.current === null) setSaveState('saved');
      },
      () => setSaveState('error')
    );
  }, [id, saveNote]);

  const change = (text: string) => {
    unsaved.current = text;
    setSaveState('saving');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, SAVE_DELAY_MS);
  };

  // Leaving the page, closing the window or hiding the tab saves what's waiting.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [flush]);

  // A note moved to the Trash or deleted for good isn't open any more.
  const gone = !note || note.trashedAt !== null;
  useEffect(() => {
    if (gone) onBack();
  }, [gone, onBack]);

  if (!note) return null;

  const status: Record<SaveState, string> = { saved: e.saved, saving: e.saving, error: e.saveError };

  return (
    <div className="note-editor">
      <div className="note-editor-head">
        <IconButton label={e.back} onClick={onBack}>
          <IconChevronLeft size={20} />
        </IconButton>
        <div className="note-editor-title">
          <InlineTextArea
            value={note.title}
            ariaLabel={e.titleLabel}
            size="title"
            placeholder={e.titlePlaceholder}
            onSave={title => void actions.run(() => updateNotes([id], { title }))}
          />
        </div>
        <span role="status" aria-live="polite">
          <Chip tone={saveState === 'error' ? undefined : 'accent'}>{status[saveState]}</Chip>
        </span>
        <Menu items={menuFor(note).filter(item => item.key !== 'open')} ariaLabel={strings.notes.menu.moreActions} />
      </div>

      {loadFailed ? (
        <EmptyState>{e.loadError}</EmptyState>
      ) : body === null ? (
        <EmptyState role="status">{e.loading}</EmptyState>
      ) : (
        <Suspense fallback={<EmptyState role="status">{e.loading}</EmptyState>}>
          <DocEditor markdown={body} onChange={change} ariaLabel={e.bodyLabel} placeholder={e.bodyPlaceholder} autoFocus={body === ''} />
        </Suspense>
      )}
    </div>
  );
};
