import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TaskListPanel } from './TaskListPanel';
import { strings } from '../../constants/strings';
import { IconEdit, IconExpand, IconList, IconPlus, IconTasks } from '../ui/icons';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Menu, tidyMenuItems } from '../ui/Menu';
import { ListPicker, type ListPickerItem, type ListPickerSort } from '../ui/ListPicker';
import { format, plural } from '../../lib/i18n';
import { moveById } from '../../lib/reorder';
import { normalizeName } from '../../lib/fuzzy';
import { useDragReorder } from '../../hooks/useDragReorder';
import { pushRecentList, recentLists } from '../../lib/recentLists';
import type { TaskList } from '../../types';

const openCount = (l: TaskList) => l.tasks.filter(t => !t.completed).length;

/** What the list picker is open for: adding a list, or switching the one at `index`. */
type PickerFor = { mode: 'add' } | { mode: 'switch'; index: number; name: string };

/**
 * Timer page center column: the active session (its name under a "Session" overline, on the
 * card's band) and every task list attached to it, stacked and folding, reorderable. The card
 * ends with "Add task list", which opens the list picker; a list's "Switch list…" opens the
 * same picker to put another list in its place.
 */
export const SessionTaskLists: React.FC = () => {
  const { state, setSessionTaskLists, createList, openModal, setActiveList, setActiveTab } = useApp();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [picker, setPicker] = useState<PickerFor | null>(null);
  const pickerAnchor = useRef<HTMLElement | null>(null);
  const addButton = useRef<HTMLButtonElement>(null);

  const session = state.sessions.find(s => s.id === state.activeSessionId) || state.sessions[0];
  const attachedIds = (session?.taskListIds || []).filter(id => state.taskLists.some(l => l.id === id));
  const lists = attachedIds.map(id => state.taskLists.find(l => l.id === id)!);
  const available = state.taskLists.filter(l => !attachedIds.includes(l.id));
  const drag = useDragReorder((sourceId, targetId) => {
    const next = moveById(attachedIds.map(id => ({ id })), sourceId, targetId);
    if (next && session) setSessionTaskLists(session.id, next.map(x => x.id));
  });

  if (!session) {
    return (
      <Card className="session-tasks">
        <EmptyState>{strings.timer.noSession}</EmptyState>
      </Card>
    );
  }

  const save = (ids: string[]) => setSessionTaskLists(session.id, ids);

  const attach = (listId: string) => {
    pushRecentList(listId);
    save([...attachedIds, listId]);
  };

  const swap = (index: number, newId: string) => {
    pushRecentList(newId);
    const next = [...attachedIds];
    next[index] = newId;
    save(next);
  };

  const move = (index: number, to: number) => {
    const next = moveById(attachedIds.map(id => ({ id })), attachedIds[index], attachedIds[to]);
    if (next) save(next.map(x => x.id));
  };

  const detach = (listId: string) => save(attachedIds.filter(id => id !== listId));

  const toggleCollapsed = (listId: string) =>
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(listId)) next.delete(listId);
      else next.add(listId);
      return next;
    });

  const openPicker = (anchor: HTMLElement | null, next: PickerFor) => {
    // A second click on what opened it closes it.
    if (picker && pickerAnchor.current === anchor) {
      setPicker(null);
      return;
    }
    pickerAnchor.current = anchor;
    setPicker(next);
  };
  const openAddPicker = () => openPicker(addButton.current, { mode: 'add' });

  const allCollapsed = lists.length > 0 && lists.every(l => collapsed.has(l.id));
  const sessionMenuItems = tidyMenuItems([
    { key: 'add', label: strings.timer.addTaskList, icon: <IconPlus size={15} />, onSelect: openAddPicker },
    lists.length > 0 && {
      key: 'collapse',
      label: allCollapsed ? strings.timer.expandAll : strings.timer.collapseAll,
      icon: <IconExpand size={15} />,
      onSelect: () => setCollapsed(allCollapsed ? new Set() : new Set(attachedIds))
    },
    lists.length > 0 && {
      key: 'open',
      label: strings.timer.openInTasks,
      icon: <IconTasks size={15} />,
      onSelect: () => {
        setActiveList(lists[0].id);
        setActiveTab('tasks');
      }
    },
    { key: 'edit', label: strings.actions.editSession, icon: <IconEdit size={15} />, onSelect: () => openModal('EDIT_SESSION', { session }) }
  ]);

  // The picker: lists not in the session yet, with their size and what's left.
  const byId = new Map(available.map(l => [l.id, l]));
  const pickerItems: ListPickerItem[] = available.map(l => ({
    id: l.id,
    label: l.name,
    meta: format(strings.timer.listMeta, {
      total: plural(l.tasks.length, strings.tasks.taskCount),
      left: format(strings.tasks.tasksLeft, { count: openCount(l) })
    })
  }));
  const sorts: ListPickerSort[] = [
    { key: 'order', label: strings.timer.sortOrder },
    { key: 'az', label: strings.timer.sortNameAsc, compare: (a, b) => a.label.localeCompare(b.label) },
    { key: 'za', label: strings.timer.sortNameDesc, compare: (a, b) => b.label.localeCompare(a.label) },
    { key: 'left', label: strings.timer.sortMostLeft, compare: (a, b) => openCount(byId.get(b.id)!) - openCount(byId.get(a.id)!) }
  ];
  // With no lists at all: the session's name and a few starters (names already taken left out).
  const taken = new Set(state.taskLists.map(l => normalizeName(l.name)));
  const suggestedNames = [session.name, ...Object.values(strings.timer.listNameStarters)]
    .filter((name, i, all) => !taken.has(normalizeName(name)) && all.findIndex(n => normalizeName(n) === normalizeName(name)) === i);

  const switching = picker?.mode === 'switch' ? picker : null;
  const pick = (id: string) => (switching ? swap(switching.index, id) : attach(id));

  const addListButton = (
    <Button ref={addButton} icon={<IconPlus size={16} strokeWidth={2.4} />} aria-haspopup="dialog" aria-expanded={picker?.mode === 'add'} onClick={openAddPicker}>
      {strings.timer.addTaskList}
    </Button>
  );

  return (
    <Card className="session-tasks">
      <CardHeader
        overline={strings.timer.sessionOverline}
        title={session.name}
        titleTooltip={session.name}
        actions={<Menu ariaLabel={strings.timer.moreSessionActions} items={sessionMenuItems} triggerSurface={2} />}
      />

      {lists.length === 0 ? (
        <div className="session-tasks-empty">
          <span className="session-tasks-empty-icon"><IconList size={22} /></span>
          <p className="session-tasks-empty-title">{strings.timer.noSessionListsTitle}</p>
          <p className="session-tasks-empty-hint">{strings.timer.noSessionListsHint}</p>
          {addListButton}
        </div>
      ) : (
        <>
          <div className="list-panel-stack">
            {lists.map((list, index) => (
              <TaskListPanel
                key={list.id}
                list={list}
                collapsed={collapsed.has(list.id)}
                onToggleCollapsed={() => toggleCollapsed(list.id)}
                onSwitch={anchor => openPicker(anchor, { mode: 'switch', index, name: list.name })}
                onDetach={() => detach(list.id)}
                onMoveUp={index > 0 ? () => move(index, index - 1) : undefined}
                onMoveDown={index < lists.length - 1 ? () => move(index, index + 1) : undefined}
                drag={drag.itemProps(list.id)}
                isDragging={drag.isDragging(list.id)}
                isDragOver={drag.isDragOver(list.id)}
              />
            ))}
          </div>
          <div className="session-tasks-foot">{addListButton}</div>
        </>
      )}

      <ListPicker
        open={!!picker}
        onClose={() => setPicker(null)}
        anchorRef={pickerAnchor}
        align={switching ? 'end' : 'start'}
        title={switching ? format(strings.timer.switchListTitle, { name: switching.name }) : strings.timer.addListTitle}
        items={pickerItems}
        icon={<IconList size={16} />}
        onPick={pick}
        recent={{ ids: recentLists(), label: strings.timer.recentLists }}
        sorts={sorts}
        newLabel={strings.modals.newTaskListOption}
        createLabel={name => format(strings.timer.createListNamed, { name })}
        onCreate={name => pick(createList(name, { activate: false }))}
        namePlaceholder={strings.modals.newTaskListPlaceholder}
        suggestions={{ names: suggestedNames, label: strings.timer.suggestedNames }}
      />
    </Card>
  );
};
