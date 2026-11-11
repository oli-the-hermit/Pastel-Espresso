import React from 'react';
import { useApp } from '../../context/AppContext';
import { Session } from '../../types';
import { strings } from '../../constants/strings';
import { IconCalendar, IconChevronDown, IconChevronUp, IconCopy, IconEdit, IconGift, IconList, IconPlay, IconPlus, IconTrash } from '../ui/icons';
import { useContextMenu } from '../ui/ContextMenu';
import type { MenuItem } from '../ui/Menu';
import { getTodayStr } from '../../lib/dateUtils';
import { QueuePanel } from '../ui/QueuePanel';
import { QueueItem, QueueMetaItem } from '../ui/QueueItem';
import { useDragReorder } from '../../hooks/useDragReorder';
import { format } from '../../lib/i18n';

export const SessionsList: React.FC = () => {
  const {
    state,
    setActiveSession,
    openModal,
    duplicateSession,
    deleteSession,
    reorderSessions,
    toggleTimer
  } = useApp();
  const contextMenu = useContextMenu();
  const drag = useDragReorder(reorderSessions);

  const handleEditSession = (session: Session) => {
    openModal('EDIT_SESSION', { session });
  };

  const handleDeleteSession = (session: Session) => {
    openModal('CONFIRM_DELETE', {
      title: strings.sessions.deleteConfirmTitle,
      message: format(strings.sessions.deleteConfirmPrompt, { name: session.name }),
      confirmLabel: strings.common.delete,
      onConfirm: () => deleteSession(session.id)
    });
  };

  const startSession = (session: Session) => {
    setActiveSession(session.id);
    // setActiveSession resets the timer to idle; start it on the next tick.
    setTimeout(toggleTimer, 0);
  };

  // A session's ⋮ and its right-click menu.
  const sessionMenuItems = (session: Session, index: number): MenuItem[] => {
    const cm = strings.actions;
    const before = state.sessions[index - 1];
    const after = state.sessions[index + 1];
    return [
      { key: 'start', label: cm.startSession, icon: <IconPlay size={15} />, onSelect: () => startSession(session) },
      { key: 'edit', label: strings.common.edit, icon: <IconEdit size={15} />, onSelect: () => handleEditSession(session) },
      { key: 'dup', label: strings.common.duplicate, icon: <IconCopy size={15} />, onSelect: () => duplicateSession(session.id) },
      {
        key: 'schedule',
        label: cm.scheduleSession,
        icon: <IconCalendar size={16} />,
        onSelect: () => openModal('SCHEDULE_EVENT', { date: getTodayStr() })
      },
      { key: 'up', label: strings.common.moveUp, icon: <IconChevronUp size={15} />, disabled: !before, onSelect: () => before && reorderSessions(session.id, before.id) },
      { key: 'down', label: strings.common.moveDown, icon: <IconChevronDown size={15} />, disabled: !after, onSelect: () => after && reorderSessions(session.id, after.id) },
      { key: 'd1', divider: true },
      { key: 'delete', label: strings.common.delete, icon: <IconTrash size={15} />, danger: true, onSelect: () => handleDeleteSession(session) }
    ];
  };

  // The card's ⋮: a new session, then what can be done with the one in its title.
  const selected = state.sessions.find(s => s.id === state.activeSessionId);
  const cardMenuItems: MenuItem[] = [
    { key: 'new', label: strings.actions.newSession, icon: <IconPlus size={15} />, onSelect: () => openModal('NEW_SESSION') },
    { key: 'd0', divider: true },
    { key: 'edit', label: strings.actions.editSession, icon: <IconEdit size={15} />, disabled: !selected, onSelect: () => selected && handleEditSession(selected) },
    { key: 'dup', label: strings.common.duplicate, icon: <IconCopy size={15} />, disabled: !selected, onSelect: () => selected && duplicateSession(selected.id) },
    { key: 'd1', divider: true },
    { key: 'delete', label: strings.common.delete, icon: <IconTrash size={15} />, danger: true, disabled: !selected, onSelect: () => selected && handleDeleteSession(selected) }
  ];

  /** Focus and break lengths, attached lists and the reward, on the row under the name. */
  const sessionMeta = (session: Session) => {
    const reward = session.rewardId ? state.rewards.find(r => r.id === session.rewardId) : null;
    const listCount = (session.taskListIds || []).filter(id => state.taskLists.some(l => l.id === id)).length;
    return (
      <>
        <QueueMetaItem>
          {session.focusMinutes}′ {strings.timer.focusPhase.toLowerCase()} · {session.breakMinutes}′ {strings.timer.breakPhase.toLowerCase()}
        </QueueMetaItem>
        {listCount > 0 && (
          <QueueMetaItem title={`${listCount} ${strings.modals.taskListsLabel.toLowerCase()}`}>
            <IconList size={13} /> {listCount}
          </QueueMetaItem>
        )}
        {reward && (
          <QueueMetaItem title={reward.name}>
            <IconGift size={13} />
          </QueueMetaItem>
        )}
      </>
    );
  };

  return (
    <QueuePanel
      overline={strings.timer.sessionsTitle}
      title={selected ? selected.name : state.sessions.length ? strings.sessions.noneSelected : strings.sessions.noSessionsTitle}
      menuLabel={strings.sessions.moreSessionsActions}
      menuItems={cardMenuItems}
      newLabel={strings.actions.newSession}
      onNew={() => openModal('NEW_SESSION')}
      newId="addSessionBtn"
      ids={state.sessions.map(s => s.id)}
      emptyMessage={strings.sessions.emptySessionsMsg}
      listId="sessionsList"
    >
      {isNew =>
        state.sessions.map((session, index) => {
          const isActive = session.id === state.activeSessionId;
          const items = sessionMenuItems(session, index);
          return (
            <QueueItem
              key={session.id}
              id={session.id}
              title={session.name}
              active={isActive}
              onSelect={() => setActiveSession(session.id)}
              meta={sessionMeta(session)}
              menuLabel={strings.timer.moreSessionActions}
              menuItems={items}
              dragLabel={strings.common.dragToReorder}
              drag={drag.itemProps(session.id)}
              isDragging={drag.isDragging(session.id)}
              isDragOver={drag.isDragOver(session.id)}
              isNew={isNew(session.id)}
              onContextMenu={e => contextMenu(e, items)}
            />
          );
        })
      }
    </QueuePanel>
  );
};
