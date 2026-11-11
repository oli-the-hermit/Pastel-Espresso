import React from 'react';
import { Task } from '../../types';
import { formatDuration } from '../../lib/formatUtils';
import { strings } from '../../constants/strings';
import { cx } from '../../lib/cx';
import { IconGrip } from '../ui/icons';
import { Checkbox } from '../ui/Checkbox';
import { Menu, type MenuItem } from '../ui/Menu';

export interface TaskItemProps {
  task: Task;
  listId: string;
  onToggle: (listId: string, taskId: string, checked: boolean) => void;
  /** The row's actions: its ⋮ button and a right-click show the same list. */
  menuItems: MenuItem[];
  /** Opens a right-click menu (the main window and the mini player each have their own). */
  onContextMenu: (e: React.MouseEvent, items: MenuItem[]) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  isDragging: boolean;
  isDragOver: boolean;
  /** Just added: plays the enter animation. */
  isNew?: boolean;
}

/**
 * A task, as a raised row (styles: features/task-list.css): check box, name, the completion
 * time when it has one, and its ⋮ menu. Its grip sits in the card's margin, shown on hover.
 */
export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  listId,
  onToggle,
  menuItems,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragging,
  isDragOver,
  isNew
}) => {
  return (
    <div
      className={cx('task-row draggable-item', task.completed && 'done', isDragging && 'dragging', isDragOver && 'drag-over', isNew && 'item-enter')}
      draggable={true}
      data-tid={task.id}
      data-id={task.id}
      onContextMenu={e => onContextMenu(e, menuItems)}
      onDragStart={e => onDragStart(e, task.id)}
      onDragOver={e => onDragOver(e, task.id)}
      onDragLeave={onDragLeave}
      onDrop={e => onDrop(e, task.id)}
    >
      <IconGrip title={strings.common.dragToReorder} className="drag-handle is-margin" />
      <Checkbox
        checked={task.completed}
        onChange={checked => onToggle(listId, task.id, checked)}
        aria-label={task.text}
      />
      <span className="task-text">{task.text}</span>

      {task.durationSeconds ? (
        <span className="task-time-badge" title={strings.tasks.completionTimeTooltip}>
          {formatDuration(task.durationSeconds)}
        </span>
      ) : null}

      <Menu ariaLabel={strings.tasks.moreTaskActions} items={menuItems} triggerSize="sm" triggerSurface={3} triggerQuiet />
    </div>
  );
};
