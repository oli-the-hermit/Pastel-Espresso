import React, { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { TaskList } from '../../types';
import { TaskListBody } from './TaskListBody';
import { Menu, MenuItem } from '../ui/Menu';
import { useContextMenu } from '../ui/ContextMenu';
import { strings } from '../../constants/strings';
import { IconChevronDown, IconChevronRight, IconChevronUp, IconCopy, IconEdit, IconGrip, IconSwitch, IconTrash, IconUnlink } from '../ui/icons';
import { format } from '../../lib/i18n';
import { cx } from '../../lib/cx';
import type { DragItemProps } from '../../hooks/useDragReorder';

export interface TaskListPanelProps {
  list: TaskList;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Opens the list picker to put a different list in this one's place, under `anchor`. */
  onSwitch: (anchor: HTMLElement) => void;
  onDetach: () => void;
  /** Moves the list one place up or down among the session's; absent at that end. */
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  /** Reorders the panel among the session's lists; the heading is the handle. */
  drag?: DragItemProps;
  isDragging?: boolean;
  isDragOver?: boolean;
}

/**
 * One of the session's task lists on the timer page (styles: features/session-tasks.css). Its
 * heading is the list's name as type: one leading chevron, the count at its end, then the
 * list's ⋮. The whole heading folds the list and drags it; its grip shows in the card's
 * margin while it is pointed at.
 */
export const TaskListPanel: React.FC<TaskListPanelProps> = ({
  list,
  collapsed,
  onToggleCollapsed,
  onSwitch,
  onDetach,
  onMoveUp,
  onMoveDown,
  drag,
  isDragging = false,
  isDragOver = false
}) => {
  const { duplicateList, deleteList, openModal } = useApp();
  const contextMenu = useContextMenu();
  const headRef = useRef<HTMLElement>(null);
  const total = list.tasks.length;
  const done = list.tasks.filter(t => t.completed).length;

  const handleDelete = () => {
    openModal('CONFIRM_DELETE', {
      title: strings.tasks.deleteTooltip,
      message: format(strings.sessions.deleteConfirmPrompt, { name: list.name }),
      confirmLabel: strings.common.delete,
      onConfirm: () => deleteList(list.id)
    });
  };

  // Shared by the overflow menu and a right-click on the heading.
  const menuItems: MenuItem[] = [
    { key: 'switch', label: strings.timer.switchList, icon: <IconSwitch size={15} />, onSelect: () => headRef.current && onSwitch(headRef.current) },
    { key: 'rename', label: strings.tasks.renameTooltip, icon: <IconEdit size={15} />, onSelect: () => openModal('RENAME_LIST', { list }) },
    { key: 'duplicate', label: strings.tasks.duplicateTooltip, icon: <IconCopy size={15} />, onSelect: () => duplicateList(list.id) },
    { key: 'up', label: strings.common.moveUp, icon: <IconChevronUp size={15} />, disabled: !onMoveUp, onSelect: () => onMoveUp?.() },
    { key: 'down', label: strings.common.moveDown, icon: <IconChevronDown size={15} />, disabled: !onMoveDown, onSelect: () => onMoveDown?.() },
    { key: 'detach', label: strings.modals.removeFromSession, icon: <IconUnlink size={15} />, onSelect: onDetach },
    { key: 'd1', divider: true },
    { key: 'delete', label: strings.tasks.deleteTooltip, icon: <IconTrash size={15} />, danger: true, onSelect: handleDelete }
  ];

  // The panel takes the drop; only its heading starts a drag, so dragging inside the list
  // (tasks, text) never moves the whole panel.
  const { draggable, onDragStart, onDragEnd, ...dropProps } = drag ?? {};

  return (
    <section
      className={cx('list-panel draggable-item', collapsed && 'is-collapsed', isDragging && 'dragging', isDragOver && 'drag-over')}
      {...dropProps}
    >
      <header
        ref={headRef}
        className="list-head"
        onContextMenu={e => contextMenu(e, menuItems)}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <IconGrip title={strings.common.dragToReorder} className="drag-handle is-margin" />
        <div
          className="list-head-toggle"
          role="button"
          tabIndex={0}
          aria-expanded={!collapsed}
          aria-label={format(strings.timer.listHeading, { name: list.name, done, total })}
          title={collapsed ? strings.timer.expandList : strings.timer.collapseList}
          onClick={onToggleCollapsed}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleCollapsed();
            }
          }}
        >
          <span className="list-head-caret" aria-hidden="true"><IconChevronRight size={16} /></span>
          <span className="list-head-name">{list.name}</span>
          <span className="list-head-count" aria-hidden="true">{format(strings.timer.listCount, { done, total })}</span>
        </div>
        <Menu ariaLabel={strings.timer.moreListActions} items={menuItems} triggerSize="sm" triggerSurface={2} triggerQuiet />
      </header>

      {!collapsed && <TaskListBody list={list} />}
    </section>
  );
};
