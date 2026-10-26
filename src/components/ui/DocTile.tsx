import React from 'react';
import { cx } from '../../lib/cx';
import { Checkbox } from './Checkbox';
import { Menu, type MenuItem } from './Menu';
import { IconPin } from './icons';

export interface DocTileProps {
  /** `grid` is a card in a grid; `list` a single row. */
  layout: 'grid' | 'list';
  title: string;
  /** Under the title: when it changed, where it lives. */
  meta: React.ReactNode;
  /** Labels (Chips), after the title in a list and under the meta in a grid. */
  chips?: React.ReactNode;
  pinned?: boolean;
  /** Accessible name of the pin mark. */
  pinnedLabel?: string;
  selected: boolean;
  /** Something is selected somewhere: every check box stays visible. */
  selecting: boolean;
  /** Names the check box, e.g. 'Select "Weekly plan"'. */
  checkLabel: string;
  /** The check box was clicked; the event says whether Shift was held (a range). */
  onCheck: (e: React.MouseEvent) => void;
  /** The tile was clicked: open it, or toggle it while something is selected. */
  onPress: (e: React.MouseEvent) => void;
  /** Enter. */
  onOpen: () => void;
  /** Space. */
  onToggle: () => void;
  menu: MenuItem[];
  menuLabel: string;
  onContextMenu?: (e: React.MouseEvent) => void;
  /** Muted, e.g. a note in the Trash. */
  dimmed?: boolean;
}

/**
 * A document in a grid or a list: title, details, a check box for picking several, a ⋮ menu
 * (styles: components/doc-tile.css). A press opens it; Enter opens, Space picks.
 */
export const DocTile: React.FC<DocTileProps> = ({
  layout,
  title,
  meta,
  chips,
  pinned,
  pinnedLabel,
  selected,
  selecting,
  checkLabel,
  onCheck,
  onPress,
  onOpen,
  onToggle,
  menu,
  menuLabel,
  onContextMenu,
  dimmed
}) => (
  <div
    className={cx('doc-tile', `doc-tile--${layout}`, selected && 'is-selected', selecting && 'is-selecting', dimmed && 'is-dimmed')}
    role="button"
    tabIndex={0}
    aria-pressed={selected}
    onClick={onPress}
    onContextMenu={onContextMenu}
    onKeyDown={e => {
      if (e.target !== e.currentTarget) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        onOpen();
      } else if (e.key === ' ') {
        e.preventDefault();
        onToggle();
      }
    }}
  >
    <Checkbox
      className="doc-tile-check"
      checked={selected}
      aria-label={checkLabel}
      onChange={() => {}}
      onClick={e => {
        e.stopPropagation();
        onCheck(e);
      }}
    />
    <div className="doc-tile-text">
      <span className="doc-tile-title" title={title}>{title}</span>
      <span className="doc-tile-meta">{meta}</span>
    </div>
    {pinned && <IconPin size={15} className="doc-tile-pin" aria-label={pinnedLabel} role="img" aria-hidden={false} />}
    {chips && <div className="doc-tile-chips">{chips}</div>}
    <div className="doc-tile-menu" onClick={e => e.stopPropagation()}>
      <Menu items={menu} ariaLabel={menuLabel} triggerSize="sm" triggerSurface={selected ? 'accent-container' : 2} />
    </div>
  </div>
);
