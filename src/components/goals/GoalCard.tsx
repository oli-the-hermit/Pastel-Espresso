import React, { useEffect, useRef, useState } from 'react';
import { Goal, Landmark } from '../../types';
import { useApp } from '../../context/AppContext';
import { strings } from '../../constants/strings';
import { IconCheck, IconChevronDown, IconChevronUp, IconCopy, IconEdit, IconFlag, IconNotes, IconPlus, IconReset, IconTrash } from '../ui/icons';
import { useContextMenu } from '../ui/ContextMenu';
import { Card, CardHeader } from '../ui/Card';
import { Menu, tidyMenuItems, type MenuItem } from '../ui/Menu';
import { ScheduleBadge } from './ScheduleBadge';
import { Checkbox } from '../ui/Checkbox';
import { Button } from '../ui/Button';
import { TextInput } from '../ui/Field';
import { ProgressBar } from '../ui/ProgressBar';
import { format } from '../../lib/i18n';
import { frequencyLabel } from '../../constants/frequencies';
import { cx } from '../../lib/cx';
import { InlineTextArea } from '../ui/InlineTextArea';
import { LIMITS } from '../../constants/limits';
import type { DragItemProps } from '../../hooks/useDragReorder';

export interface GoalCardProps {
  goal: Goal;
  dragProps?: DragItemProps;
  isDragging?: boolean;
  isDragOver?: boolean;
}

/**
 * A goal (styles: features/goals.css). The goal is the list of its landmarks, so its band is
 * that list's heading: the period as the overline, the count beside the ⋮, the title, its
 * chips (Done, the reward, the dates), and the bar closing the band. Under it: the description
 * once written, the landmarks as raised rows, and "Add a landmark" as the last row. A goal
 * with landmarks completes when the last one is ticked; one without has "Complete goal".
 */
export const GoalCard: React.FC<GoalCardProps> = ({ goal, dragProps, isDragging = false, isDragOver = false }) => {
  const {
    state,
    openModal,
    duplicateGoal,
    updateGoal,
    deleteGoal,
    toggleGoal,
    addLandmark,
    reorderLandmarks,
    toggleLandmark,
    duplicateLandmark,
    deleteLandmark
  } = useApp();
  const contextMenu = useContextMenu();

  const goalName = goal.name;
  const landmarks = goal.landmarks || [];
  const hasLandmarks = landmarks.length > 0;
  const total = landmarks.length;
  const done = landmarks.filter(l => l.completed).length;
  const pct = hasLandmarks ? Math.round((done / total) * 100) : goal.completed ? 100 : 0;
  const isComplete = pct === 100;
  const count = format(strings.goals.landmarksCount, { done, total });
  const hasDates = !!(goal.startDate || goal.dueDate);
  const linkedReward = goal.rewardId ? state.rewards.find(r => r.id === goal.rewardId) : null;

  // The description shows once written; "Add a description" opens an empty one.
  const [writing, setWriting] = useState(false);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (writing) descriptionRef.current?.focus();
  }, [writing]);

  const [newLandmark, setNewLandmark] = useState('');
  const hasText = !!newLandmark.trim();
  const handleAddLandmark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasText) return;
    addLandmark(goal.id, { name: newLandmark.trim(), completed: false });
    setNewLandmark('');
  };

  const handleDeleteGoal = () => {
    openModal('CONFIRM_DELETE', {
      title: strings.goals.deleteGoalTitle,
      message: format(strings.sessions.deleteConfirmPrompt, { name: goalName }),
      confirmLabel: strings.common.delete,
      onConfirm: () => deleteGoal(goal.id)
    });
  };

  const cm = strings.actions;

  // One list for the ⋮ button and the right-click menu.
  const goalMenuItems = tidyMenuItems([
    { key: 'edit', label: strings.common.edit, icon: <IconEdit size={15} />, onSelect: () => openModal('EDIT_GOAL', { goal }) },
    !goal.description && !writing && { key: 'describe', label: strings.goals.addDescription, icon: <IconNotes size={15} />, onSelect: () => setWriting(true) },
    { key: 'landmark', label: cm.addLandmark, icon: <IconFlag size={15} />, onSelect: () => openModal('NEW_LANDMARK', { goalId: goal.id }) },
    !hasLandmarks && {
      key: 'toggle',
      label: goal.completed ? cm.markNotDone : strings.common.markComplete,
      icon: goal.completed ? <IconReset size={15} /> : <IconCheck size={15} />,
      onSelect: () => toggleGoal(goal.id)
    },
    { key: 'dup', label: strings.common.duplicate, icon: <IconCopy size={15} />, onSelect: () => duplicateGoal(goal.id) },
    { key: 'd1', divider: true },
    { key: 'delete', label: strings.common.delete, icon: <IconTrash size={15} />, danger: true, onSelect: handleDeleteGoal }
  ]);

  // A landmark's ⋮ and its right-click menu. Move up / Move down reorder it.
  const landmarkMenuItems = (lm: Landmark, index: number): MenuItem[] => {
    const before = landmarks[index - 1];
    const after = landmarks[index + 1];
    return [
      {
        key: 'toggle',
        label: lm.completed ? cm.markNotDone : strings.common.markComplete,
        icon: lm.completed ? <IconReset size={15} /> : <IconCheck size={15} />,
        onSelect: () => toggleLandmark(goal.id, lm.id)
      },
      { key: 'edit', label: strings.common.edit, icon: <IconEdit size={15} />, onSelect: () => openModal('EDIT_LANDMARK', { goalId: goal.id, landmark: lm }) },
      { key: 'dup', label: strings.common.duplicate, icon: <IconCopy size={15} />, onSelect: () => duplicateLandmark(goal.id, lm.id) },
      { key: 'up', label: strings.common.moveUp, icon: <IconChevronUp size={15} />, disabled: !before, onSelect: () => before && reorderLandmarks(goal.id, lm.id, before.id) },
      { key: 'down', label: strings.common.moveDown, icon: <IconChevronDown size={15} />, disabled: !after, onSelect: () => after && reorderLandmarks(goal.id, lm.id, after.id) },
      { key: 'd1', divider: true },
      { key: 'delete', label: strings.common.delete, icon: <IconTrash size={15} />, danger: true, onSelect: () => deleteLandmark(goal.id, lm.id) }
    ];
  };

  const chips = (isComplete || linkedReward || hasDates) && (
    <>
      {isComplete && (
        <span className="goal-done-chip">
          <IconCheck size={13} strokeWidth={2.6} />
          {strings.goals.done}
        </span>
      )}
      {linkedReward && <span className="goal-reward-badge">{linkedReward.emoji} {linkedReward.name}</span>}
      <ScheduleBadge startDate={goal.startDate} dueDate={goal.dueDate} completed={isComplete} compact />
    </>
  );

  return (
    <Card
      className={cx('goal-card draggable-item drag-surface', isDragging && 'dragging', isDragOver && 'drag-over')}
      data-gid={goal.id}
      onContextMenu={e => contextMenu(e, goalMenuItems)}
      {...dragProps}
    >
      <CardHeader
        overline={frequencyLabel(goal.frequency)}
        count={hasLandmarks && count}
        title={goalName}
        titleWraps
        subtitle={chips}
        progress={hasLandmarks && <ProgressBar value={pct} complete={isComplete} label={format(strings.goals.landmarksCountLabel, { done, total })} />}
        actions={<Menu ariaLabel={strings.goals.goalActions} items={goalMenuItems} triggerSurface={2} />}
      />

      {(goal.description || writing) && (
        // Leaving an empty description puts it away again.
        <div className="goal-description-wrap" onBlur={() => setWriting(false)}>
          <InlineTextArea
            ref={descriptionRef}
            className="goal-description"
            value={goal.description ?? ''}
            onSave={description => updateGoal(goal.id, { description }, { silent: true })}
            placeholder={strings.goals.descriptionPlaceholder}
            ariaLabel={strings.goals.descriptionLabel}
            maxLength={LIMITS.goalDescription.max}
          />
        </div>
      )}

      <div className="task-list-items goal-landmarks">
        {landmarks.map((lm, index) => {
          const reward = lm.rewardId ? state.rewards.find(r => r.id === lm.rewardId) : null;
          const items = landmarkMenuItems(lm, index);
          return (
            <div
              key={lm.id}
              className={cx('task-row', lm.completed && 'done')}
              data-lmid={lm.id}
              onContextMenu={e => {
                // The goal card's own handler would otherwise replace this menu.
                e.stopPropagation();
                contextMenu(e, items);
              }}
            >
              <Checkbox checked={lm.completed} onChange={() => toggleLandmark(goal.id, lm.id)} aria-label={lm.name} />
              <span className="task-text">{lm.name}</span>
              {(lm.startDate || lm.dueDate || reward) && (
                <span className="landmark-meta">
                  <ScheduleBadge startDate={lm.startDate} dueDate={lm.dueDate} completed={lm.completed} compact />
                  {reward && <span className="landmark-reward-tag">{reward.emoji} {reward.name}</span>}
                </span>
              )}
              <Menu ariaLabel={strings.goals.landmarkActions} items={items} triggerSize="sm" triggerSurface={3} triggerQuiet />
            </div>
          );
        })}

        <form className={cx('add-task-row', hasText && 'has-text')} onSubmit={handleAddLandmark}>
          <span className="add-task-icon" aria-hidden="true"><IconPlus size={16} strokeWidth={2.2} /></span>
          <TextInput
            className="add-task-input"
            placeholder={strings.goals.addLandmarkPlaceholder}
            value={newLandmark}
            onChange={e => setNewLandmark(e.target.value)}
            autoComplete="off"
            aria-label={format(strings.goals.addLandmarkTo, { name: goalName })}
          />
          <Button variant="tonal" size="xs" type="submit" className="add-task-btn">
            {strings.tasks.addTaskBtn}
          </Button>
        </form>
      </div>

      {!hasLandmarks && !goal.completed && (
        <div className="goal-card-foot">
          <Button variant="tonal" icon={<IconCheck size={16} strokeWidth={2.6} />} onClick={() => toggleGoal(goal.id)}>
            {strings.goals.completeGoal}
          </Button>
        </div>
      )}
    </Card>
  );
};
