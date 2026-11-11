import React, { useRef } from 'react';
import { cx } from '../../lib/cx';
import { useFlip, useNewIds } from '../../hooks/useListMotion';
import { Card, CardHeader } from './Card';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { Menu, type MenuItem } from './Menu';
import { IconPlus } from './icons';

export interface QueuePanelProps {
  /** The overline on the card's band, e.g. "Sessions". */
  overline: string;
  /** The card's title: the selected item's name, or a line saying none is. */
  title: string;
  /** The card's ⋮: a new item, then what can be done with the one in the title. */
  menuLabel: string;
  menuItems: MenuItem[];
  /** The neutral button that ends the list, e.g. "New session". */
  newLabel: string;
  onNew: () => void;
  /** id of the "new" button (tours point at it). */
  newId?: string;
  /** The items' ids, in order: new ones animate in and reorders glide. */
  ids: string[];
  emptyMessage: string;
  /** id of the list element. */
  listId?: string;
  className?: string;
  'data-tour'?: string;
  /** Renders the rows; isNew(id) is true for a row just added. */
  children: (isNew: (id: string) => boolean) => React.ReactNode;
}

/**
 * A card holding a queue of QueueItems (sessions, task lists; styles: components/queue.css):
 * the title band (overline, the selected item's name, the card's ⋮), the rows or an empty
 * state, and the "new" button last.
 */
export const QueuePanel: React.FC<QueuePanelProps> = ({
  overline,
  title,
  menuLabel,
  menuItems,
  newLabel,
  onNew,
  newId,
  ids,
  emptyMessage,
  listId,
  className,
  'data-tour': dataTour,
  children
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const newIds = useNewIds(ids);
  useFlip(listRef, ids);
  return (
    <Card className={cx('queue-panel', className)} data-tour={dataTour}>
      <CardHeader
        overline={overline}
        title={title}
        titleTooltip={title}
        actions={<Menu ariaLabel={menuLabel} items={menuItems} triggerSurface={2} />}
      />
      <div className="queue-list" id={listId} ref={listRef}>
        {ids.length === 0 ? <EmptyState size="sm">{emptyMessage}</EmptyState> : children(id => newIds.has(id))}
      </div>
      <div className="queue-foot">
        <Button id={newId} icon={<IconPlus size={16} strokeWidth={2.4} />} onClick={onNew}>
          {newLabel}
        </Button>
      </div>
    </Card>
  );
};
