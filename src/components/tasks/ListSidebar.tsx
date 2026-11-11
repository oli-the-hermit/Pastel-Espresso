import React from 'react';
import { useApp } from '../../context/AppContext';
import { TaskList } from '../../types';
import { strings } from '../../constants/strings';
import { IconChevronDown, IconChevronUp, IconCopy, IconEdit, IconList, IconPlus, IconTrash } from '../ui/icons';
import { useContextMenu } from '../ui/ContextMenu';
import type { MenuItem } from '../ui/Menu';
import { QueuePanel } from '../ui/QueuePanel';
import { QueueItem } from '../ui/QueueItem';
import { useDragReorder } from '../../hooks/useDragReorder';

/** The Tasks tab's side panel: task lists as a queue, like Sessions, one line each. */
export const ListSidebar: React.FC = () => {
  const { state, setActiveList, openModal, deleteList, duplicateList, reorderTaskLists } = useApp();
  const contextMenu = useContextMenu();
  const drag = useDragReorder(reorderTaskLists);

  const renameList = (list: TaskList) => openModal('RENAME_LIST', { list });

  const confirmDeleteList = (list: TaskList) => {
    openModal('CONFIRM_DELETE', {
      title: strings.tasks.deleteListTitle,
      message: `${strings.modals.confirmDeleteDefaultMsg.replace('item', `"${list.name}"`)}`,
      confirmLabel: strings.common.delete,
      onConfirm: () => deleteList(list.id)
    });
  };

  // A list's ⋮ and its right-click menu.
  const listMenuItems = (list: TaskList, index: number): MenuItem[] => {
    const before = state.taskLists[index - 1];
    const after = state.taskLists[index + 1];
    return [
      { key: 'open', label: strings.actions.open, icon: <IconList size={15} />, onSelect: () => setActiveList(list.id) },
      { key: 'new-task', label: strings.actions.newTask, icon: <IconPlus size={15} />, onSelect: () => openModal('NEW_TASK', { listId: list.id }) },
      { key: 'rename', label: strings.tasks.renameTooltip, icon: <IconEdit size={15} />, onSelect: () => renameList(list) },
      { key: 'dup', label: strings.tasks.duplicateTooltip, icon: <IconCopy size={15} />, onSelect: () => duplicateList(list.id) },
      { key: 'up', label: strings.common.moveUp, icon: <IconChevronUp size={15} />, disabled: !before, onSelect: () => before && reorderTaskLists(list.id, before.id) },
      { key: 'down', label: strings.common.moveDown, icon: <IconChevronDown size={15} />, disabled: !after, onSelect: () => after && reorderTaskLists(list.id, after.id) },
      { key: 'd1', divider: true },
      { key: 'delete', label: strings.tasks.deleteTooltip, icon: <IconTrash size={15} />, danger: true, onSelect: () => confirmDeleteList(list) }
    ];
  };

  // The card's ⋮: a new list, then what can be done with the one in its title.
  const selected = state.taskLists.find(l => l.id === state.activeListId);
  const cardMenuItems: MenuItem[] = [
    { key: 'new', label: strings.actions.newList, icon: <IconPlus size={15} />, onSelect: () => openModal('NEW_LIST') },
    { key: 'd0', divider: true },
    { key: 'rename', label: strings.tasks.renameTooltip, icon: <IconEdit size={15} />, disabled: !selected, onSelect: () => selected && renameList(selected) },
    { key: 'dup', label: strings.tasks.duplicateTooltip, icon: <IconCopy size={15} />, disabled: !selected, onSelect: () => selected && duplicateList(selected.id) },
    { key: 'd1', divider: true },
    { key: 'delete', label: strings.tasks.deleteTooltip, icon: <IconTrash size={15} />, danger: true, disabled: !selected, onSelect: () => selected && confirmDeleteList(selected) }
  ];

  return (
    <QueuePanel
      overline={strings.modals.taskListsLabel}
      title={selected ? selected.name : state.taskLists.length ? strings.sessions.noneSelected : strings.tasks.sidebarTitle}
      menuLabel={strings.tasks.moreListsActions}
      menuItems={cardMenuItems}
      newLabel={strings.actions.newList}
      onNew={() => openModal('NEW_LIST')}
      newId="addListBtn"
      ids={state.taskLists.map(l => l.id)}
      emptyMessage={strings.tasks.emptyLists}
      listId="listNav"
    >
      {isNew =>
        state.taskLists.map((list, index) => {
          const done = list.tasks.filter(t => t.completed).length;
          const items = listMenuItems(list, index);
          return (
            <QueueItem
              key={list.id}
              id={list.id}
              title={list.name}
              active={list.id === state.activeListId}
              onSelect={() => setActiveList(list.id)}
              trailing={`${done}/${list.tasks.length}`}
              menuLabel={strings.timer.moreListActions}
              menuItems={items}
              dragLabel={strings.common.dragToReorder}
              drag={drag.itemProps(list.id)}
              isDragging={drag.isDragging(list.id)}
              isDragOver={drag.isDragOver(list.id)}
              isNew={isNew(list.id)}
              onContextMenu={e => contextMenu(e, items)}
            />
          );
        })
      }
    </QueuePanel>
  );
};
