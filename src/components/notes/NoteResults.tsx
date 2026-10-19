import React from 'react';
import { useNotes } from '../../context/NotesContext';
import { strings } from '../../constants/strings';
import { format } from '../../lib/i18n';
import type { NoteScope } from '../../lib/noteList';
import type { Note } from '../../lib/notes';
import type { NotesView } from '../../hooks/useNotesLayout';
import { Chip } from '../ui/Chip';
import { useContextMenu } from '../ui/ContextMenu';
import { DocTile } from '../ui/DocTile';
import { GridItem, LayoutGrid, type GridSpan } from '../ui/LayoutGrid';
import type { MenuItem } from '../ui/Menu';
import { noteTitle, whenText } from './noteText';

/** Two cards a row from md, three from xl, four on very wide screens. The side list takes the rest. */
const CARD_SPAN: GridSpan = { base: 12, md: 6, xl: 4, '3xl': 3 };
const CHIPS_SHOWN = 3;

export interface NoteResultsProps {
  notes: Note[];
  view: NotesView;
  scope: NoteScope;
  /** Something is selected, so every check box shows. */
  selecting: boolean;
  isSelected: (id: string) => boolean;
  menuFor: (note: Note) => MenuItem[];
  onPress: (note: Note, e: React.MouseEvent) => void;
  onCheck: (note: Note, e: React.MouseEvent) => void;
  onOpen: (note: Note) => void;
  onToggle: (note: Note) => void;
}

/** The notes in view, as cards in a grid or as rows. */
export const NoteResults: React.FC<NoteResultsProps> = ({ notes, view, scope, selecting, isSelected, menuFor, onPress, onCheck, onOpen, onToggle }) => {
  const { collections, labels } = useNotes();
  const contextMenu = useContextMenu();
  const collectionName = new Map(collections.map(c => [c.id, c.name]));
  const labelName = new Map(labels.map(l => [l.id, l.name]));
  const showPlace = scope.kind !== 'collection';

  const tiles = notes.map(note => {
    const title = noteTitle(note);
    const place = showPlace && note.collectionId ? collectionName.get(note.collectionId) : undefined;
    const names = note.labelIds.flatMap(id => labelName.get(id) ?? []);
    const menu = menuFor(note);
    return (
      <DocTile
        key={note.id}
        layout={view}
        title={title}
        meta={place ? format(strings.notes.metaWithPlace, { edited: whenText(note), place }) : whenText(note)}
        chips={
          names.length > 0 && (
            <>
              {names.slice(0, CHIPS_SHOWN).map(name => <Chip key={name}>{name}</Chip>)}
              {names.length > CHIPS_SHOWN && <Chip>{format(strings.notes.moreLabels, { count: names.length - CHIPS_SHOWN })}</Chip>}
            </>
          )
        }
        pinned={note.pinned && note.trashedAt === null}
        pinnedLabel={strings.notes.pinned}
        selected={isSelected(note.id)}
        selecting={selecting}
        checkLabel={format(strings.notes.selectNote, { title })}
        onCheck={e => onCheck(note, e)}
        onPress={e => onPress(note, e)}
        onOpen={() => onOpen(note)}
        onToggle={() => onToggle(note)}
        menu={menu}
        menuLabel={strings.notes.menu.moreActions}
        onContextMenu={e => contextMenu(e, menu)}
        dimmed={note.trashedAt !== null}
      />
    );
  });

  if (view === 'list') return <div className="notes-rows">{tiles}</div>;
  return (
    <LayoutGrid>
      {tiles.map((tile, i) => <GridItem key={notes[i].id} span={CARD_SPAN}>{tile}</GridItem>)}
    </LayoutGrid>
  );
};
