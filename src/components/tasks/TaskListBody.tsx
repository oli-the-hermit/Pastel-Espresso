import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TaskItem } from './TaskItem';
import { Task, TaskList } from '../../types';
import { strings } from '../../constants/strings';
import { IconCheck, IconChevronDown, IconChevronUp, IconCopy, IconEdit, IconPlus, IconReset, IconTrash } from '../ui/icons';
import { useContextMenu } from '../ui/ContextMenu';
import type { MenuItem } from '../ui/Menu';
import { useFlip, useNewIds } from '../../hooks/useListMotion';
import { isDragLeavingElement } from '../../lib/dnd';
import { cx } from '../../lib/cx';
import { Button } from '../ui/Button';
import { TextInput } from '../ui/Field';
import { ProgressBar } from '../ui/ProgressBar';
import { format } from '../../lib/i18n';

export interface TaskListBodyProps {
  list: TaskList;
}

/**
 * One list's progress bar and its task rows, ending with the "Add a task" row (a field that is
 * the list's last row; its Add button appears once there is text). Shared by the Tasks tab
 * and the timer page so both behave identically.
 */
export const TaskListBody: React.FC<TaskListBodyProps> = ({ list }) => {
  const { addTask, toggleTask, duplicateTask, deleteTask, openModal, reorderTasks } = useApp();

  const contextMenu = useContextMenu();
  const itemsRef = useRef<HTMLDivElement>(null);
  const ids = list.tasks.map(t => t.id);
  const newIds = useNewIds(ids);
  useFlip(itemsRef, ids);

  const [newTaskText, setNewTaskText] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const total = list.tasks.length;
  const done = list.tasks.filter(t => t.completed).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const hasText = !!newTaskText.trim();

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    // Only this list's own task drags (not a list panel or a file passing over).
    if (!draggedId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) setDragOverId(id);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (isDragLeavingElement(e)) setDragOverId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedId && draggedId !== targetId) reorderTasks(list.id, draggedId, targetId);
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasText) return;
    addTask(list.id, newTaskText.trim());
    setNewTaskText('');
  };

  const handleRenameTask = (lId: string, task: Task) => openModal('RENAME_TASK', { listId: lId, task });

  const handleDeleteTask = (lId: string, task: Task) => {
    openModal('CONFIRM_DELETE', {
      title: strings.common.delete,
      message: format(strings.sessions.deleteConfirmPrompt, { name: task.text }),
      confirmLabel: strings.common.delete,
      onConfirm: () => deleteTask(lId, task.id)
    });
  };

  // A task's ⋮ menu and its right-click menu. Move up / Move down reorder without dragging.
  const taskMenuItems = (task: Task, index: number): MenuItem[] => {
    const cm = strings.actions;
    const before = list.tasks[index - 1];
    const after = list.tasks[index + 1];
    return [
      task.completed
        ? { key: 'undo', label: cm.markNotDone, icon: <IconReset size={15} />, onSelect: () => toggleTask(list.id, task.id, false) }
        : { key: 'done', label: strings.common.markComplete, icon: <IconCheck size={15} />, onSelect: () => toggleTask(list.id, task.id, true) },
      { key: 'rename', label: strings.common.rename, icon: <IconEdit size={15} />, onSelect: () => handleRenameTask(list.id, task) },
      { key: 'dup', label: strings.common.duplicate, icon: <IconCopy size={15} />, onSelect: () => duplicateTask(list.id, task.id) },
      { key: 'up', label: strings.common.moveUp, icon: <IconChevronUp size={15} />, disabled: !before, onSelect: () => before && reorderTasks(list.id, task.id, before.id) },
      { key: 'down', label: strings.common.moveDown, icon: <IconChevronDown size={15} />, disabled: !after, onSelect: () => after && reorderTasks(list.id, task.id, after.id) },
      { key: 'd1', divider: true },
      { key: 'delete', label: strings.common.delete, icon: <IconTrash size={15} />, danger: true, onSelect: () => handleDeleteTask(list.id, task) }
    ];
  };

  return (
    <div className="task-list-body">
      {total > 0 && <ProgressBar value={pct} label={format(strings.tasks.completedOf, { done, total })} />}

      <div className="task-list-items" ref={itemsRef}>
        {list.tasks.map((task, index) => (
          <TaskItem
            key={task.id}
            task={task}
            listId={list.id}
            onToggle={toggleTask}
            menuItems={taskMenuItems(task, index)}
            onContextMenu={contextMenu}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            isDragging={draggedId === task.id}
            isDragOver={dragOverId === task.id && draggedId !== task.id}
            isNew={newIds.has(task.id)}
          />
        ))}

        <form className={cx('add-task-row', hasText && 'has-text')} onSubmit={handleAddTask}>
          <span className="add-task-icon" aria-hidden="true"><IconPlus size={16} strokeWidth={2.2} /></span>
          <TextInput
            className="add-task-input"
            placeholder={strings.tasks.addTaskPlaceholder}
            value={newTaskText}
            onChange={e => setNewTaskText(e.target.value)}
            autoComplete="off"
            aria-label={format(strings.tasks.addTaskTo, { name: list.name })}
          />
          <Button variant="tonal" size="xs" type="submit" className="add-task-btn">
            {strings.tasks.addTaskBtn}
          </Button>
        </form>
      </div>
    </div>
  );
};
