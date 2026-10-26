import React from 'react';
import { strings } from '../../constants/strings';
import { NOTE_SORTS, type NoteSort } from '../../lib/noteList';
import type { NotesView } from '../../hooks/useNotesLayout';
import { Button } from '../ui/Button';
import { IconGridView, IconImport, IconList, IconPlus } from '../ui/icons';
import { SearchField } from '../ui/SearchField';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Select } from '../ui/Select';

export interface NotesToolbarProps {
  query: string;
  onQuery: (query: string) => void;
  sort: NoteSort;
  onSort: (sort: NoteSort) => void;
  view: NotesView;
  onView: (view: NotesView) => void;
  onNewNote: () => void;
  onImport: () => void;
  /** In the Trash there is nothing to create. */
  canCreate: boolean;
}

/** Search, order, layout, Import and the New note button. */
export const NotesToolbar: React.FC<NotesToolbarProps> = ({ query, onQuery, sort, onSort, view, onView, onNewNote, onImport, canCreate }) => {
  const s = strings.notes;
  return (
    <>
      <SearchField value={query} onChange={onQuery} ariaLabel={s.searchLabel} placeholder={s.searchPlaceholder} clearLabel={s.clearSearch} />
      <Select
        value={sort}
        onChange={onSort}
        ariaLabel={s.sortLabel}
        className="notes-sort"
        options={NOTE_SORTS.map(value => ({ value, label: s.sortOptions[value] }))}
      />
      <SegmentedControl
        ariaLabel={s.viewLabel}
        value={view}
        onChange={onView}
        options={[
          { value: 'grid', label: <IconGridView size={16} />, ariaLabel: s.viewGrid },
          { value: 'list', label: <IconList size={16} />, ariaLabel: s.viewList }
        ]}
      />
      {canCreate && (
        <Button icon={<IconImport size={16} />} onClick={onImport}>
          {s.transfer.import}
        </Button>
      )}
      {canCreate && (
        <Button variant="primary" icon={<IconPlus size={16} strokeWidth={2.4} />} onClick={onNewNote}>
          {s.newNote}
        </Button>
      )}
    </>
  );
};
