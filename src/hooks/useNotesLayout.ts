import { useCallback, useState } from 'react';
import { storage } from '../lib/storage';
import { NOTE_SORTS, type NoteSort } from '../lib/noteList';

export type NotesView = 'grid' | 'list';

interface NotesLayout {
  view: NotesView;
  sort: NoteSort;
}

const DEFAULT_LAYOUT: NotesLayout = { view: 'grid', sort: 'edited' };

function load(): NotesLayout {
  const saved = storage.getJSON<Partial<NotesLayout>>('notesLayout');
  return {
    view: saved?.view === 'list' ? 'list' : DEFAULT_LAYOUT.view,
    sort: NOTE_SORTS.find(s => s === saved?.sort) ?? DEFAULT_LAYOUT.sort
  };
}

/** How the Notes screen lays its notes out, remembered per device. */
export function useNotesLayout() {
  const [layout, setLayout] = useState(load);
  const update = useCallback((change: Partial<NotesLayout>) => {
    setLayout(prev => {
      const next = { ...prev, ...change };
      storage.setJSON('notesLayout', next);
      return next;
    });
  }, []);
  return { ...layout, setView: (view: NotesView) => update({ view }), setSort: (sort: NoteSort) => update({ sort }) };
}
