import React from 'react';
import { useApp } from '../../context/AppContext';
import { TaskListBody } from './TaskListBody';
import { strings } from '../../constants/strings';
import { IconEdit, IconCopy, IconPlus, IconTrash } from '../ui/icons';
import { useContextMenu } from '../ui/ContextMenu';
import { Menu, type MenuItem } from '../ui/Menu';
import { Card, CardHeader } from '../ui/Card';
import { Chip } from '../ui/Chip';
import { EmptyState } from '../ui/EmptyState';
import { format } from '../../lib/i18n';

export interface TaskListCardProps {
  /** Defaults to the list selected in the Tasks sidebar. */
  listId?: string | null;
}

/** The main panel of the Tasks tab. The timer page uses SessionTaskLists instead. */
export const TaskListCard: React.FC<TaskListCardProps> = ({ listId }) => {
  const { state, duplicateList, deleteList, openModal } = useApp();
  const contextMenu = useContextMenu();

  const targetListId = listId !== undefined ? listId : state.activeListId;
  const activeList = state.taskLists.find(l => l.id === targetListId);

  // Sessions that load this list on the timer page.
  const usedBy = activeList
    ? state.sessions.filter(s => s.taskListIds?.includes(activeList.id))
    : [];

  const handleDeleteList = () => {
    if (!activeList) return;
    openModal('CONFIRM_DELETE', {
      title: strings.tasks.deleteTooltip,
      message: format(strings.sessions.deleteConfirmPrompt, { name: activeList.name }),
      confirmLabel: strings.common.delete,
      onConfirm: () => deleteList(activeList.id)
    });
  };

  // One list for the right-click menu and the header's ⋮.
  const listMenuItems: MenuItem[] = activeList
    ? [
        { key: 'new-task', label: strings.actions.newTask, icon: <IconPlus size={15} />, onSelect: () => openModal('NEW_TASK', { listId: activeList.id }) },
        { key: 'rename', label: strings.tasks.renameTooltip, icon: <IconEdit size={15} />, onSelect: () => openModal('RENAME_LIST', { list: activeList }) },
        { key: 'dup', label: strings.tasks.duplicateTooltip, icon: <IconCopy size={15} />, onSelect: () => duplicateList(activeList.id) },
        { key: 'd1', divider: true },
        { key: 'delete', label: strings.tasks.deleteTooltip, icon: <IconTrash size={15} />, danger: true, onSelect: handleDeleteList }
      ]
    : [];

  const openListMenu = (e: React.MouseEvent) => {
    if (!activeList) return;
    contextMenu(e, listMenuItems);
  };

  return (
    <Card className="tasks-content">
      <CardHeader
        onContextMenu={openListMenu}
        overline={strings.timer.listOverline}
        count={activeList && activeList.tasks.length > 0 && format(strings.timer.listCount, { done: activeList.tasks.filter(t => t.completed).length, total: activeList.tasks.length })}
        title={activeList ? activeList.name : strings.tasks.selectListPrompt}
        titleTooltip={activeList?.name}
        subtitle={usedBy.length > 0 && usedBy.map(s => (
          <Chip key={s.id} title={s.name}>
            {s.name}
          </Chip>
        ))}
        actions={activeList && <Menu ariaLabel={strings.timer.moreListActions} items={listMenuItems} triggerSurface={2} />}
      />

      {activeList ? (
        <TaskListBody list={activeList} />
      ) : (
        <EmptyState>{strings.tasks.emptyListPrompt}</EmptyState>
      )}
    </Card>
  );
};
