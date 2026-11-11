import React from 'react';
import { cx } from '../../lib/cx';
import type { DragItemProps } from '../../hooks/useDragReorder';
import { IconGrip } from './icons';
import { Menu, type MenuItem } from './Menu';

export interface QueueItemProps {
  id: string;
  title: string;
  active: boolean;
  onSelect: () => void;
  /** After the name, e.g. a count. */
  trailing?: React.ReactNode;
  /** A second line of details under the name. */
  meta?: React.ReactNode;
  /** The row's ⋮; a right-click opens the same items. */
  menuLabel: string;
  menuItems: MenuItem[];
  /** Tooltip of the drag grip. */
  dragLabel: string;
  drag?: DragItemProps;
  isDragging?: boolean;
  isDragOver?: boolean;
  /** Just created: plays the enter animation. */
  isNew?: boolean;
  onContextMenu?: (e: React.MouseEvent) => void;
}

/** One detail on a row's meta line, e.g. a length or an icon with a count. */
export const QueueMetaItem: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => (
  <span className="queue-item-meta-item" title={title}>{children}</span>
);

/**
 * A selectable, reorderable row in a queue (sessions, task lists; styles: components/queue.css):
 * raised like a task row, the name (and a line of details under it), then its ⋮. Selected:
 * the soft tint. Its grip sits in the card's margin, shown on hover.
 * Pattern: a row that selects on click shows the pointer, and its grip the grab cursor.
 */
export const QueueItem: React.FC<QueueItemProps> = ({
  id,
  title,
  active,
  onSelect,
  trailing,
  meta,
  menuLabel,
  menuItems,
  dragLabel,
  drag,
  isDragging,
  isDragOver,
  isNew,
  onContextMenu
}) => (
  <div
    className={cx(
      'queue-item draggable-item',
      !meta && 'queue-item--single',
      active && 'active',
      isDragging && 'dragging',
      isDragOver && 'drag-over',
      isNew && 'item-enter'
    )}
    data-id={id}
    role="button"
    tabIndex={0}
    aria-pressed={active}
    onContextMenu={onContextMenu}
    onClick={onSelect}
    onKeyDown={e => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
        e.preventDefault();
        onSelect();
      }
    }}
    {...drag}
  >
    <IconGrip title={dragLabel} className="drag-handle is-margin" />

    <div className="queue-item-main">
      <span className="queue-item-name" title={title}>{title}</span>
      {meta && <span className="queue-item-meta">{meta}</span>}
    </div>
    {trailing && <span className="queue-item-trailing">{trailing}</span>}

    {/* Its own click never selects the row. */}
    <span className="queue-item-menu" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
      <Menu ariaLabel={menuLabel} items={menuItems} triggerSize="sm" triggerSurface={active ? 'accent-container' : 3} triggerQuiet={!active} />
    </span>
  </div>
);
