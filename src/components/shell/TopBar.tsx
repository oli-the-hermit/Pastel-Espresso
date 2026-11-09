import React from 'react';
import { useApp } from '../../context/AppContext';
import { useMiniPlayer } from '../../mini/MiniPlayerProvider';
import { strings } from '../../constants/strings';
import { formatClock } from '../../lib/formatUtils';
import { isTauri } from '../../lib/desktop';
import { TabType } from '../../types';
import { IconBell, IconHelp, IconLogo, IconMiniPlayer, IconPause, IconPlay, IconSoundOff, IconSoundOn } from '../ui/icons';
import { IconSwap } from '../ui/IconSwap';
import { WindowControls } from './WindowControls';
import { IconButton } from '../ui/IconButton';
import { cx } from '../../lib/cx';
import { StatusChip, type StatusTone } from '../ui/StatusChip';
import { AppMark } from '../ui/AppMark';
import { tidyMenuItems } from '../ui/Menu';
import { useGlobalMenuItems } from './globalMenu';

const PAGE_TITLES: Record<TabType, string> = {
  timer: strings.tabs.timer,
  tasks: strings.tabs.tasks,
  notes: strings.tabs.notes,
  calendar: strings.tabs.calendar,
  stats: strings.tabs.stats,
  goals: strings.tabs.goals,
  rewards: strings.tabs.rewards
};

export interface TopBarProps {
  onOpenNotifications?: () => void;
}

/**
 * The window's top row, edge to edge: the app mark (its menu is the right-click menu's
 * items) over the drawer, then the page title, live timer status and global tools. Away
 * from the timer page the status chip also shows the countdown and a play/pause shortcut.
 * On desktop the bar doubles as the (frameless) window's title bar.
 */
export const TopBar: React.FC<TopBarProps> = ({ onOpenNotifications }) => {
  const { state, activeTab, setActiveTab, toggleSound, toggleTimer, setHelpOpen, alertRinging, bellDot, clearBellDot } = useApp();
  const mini = useMiniPlayer();
  const appMenuItems = useGlobalMenuItems();
  const desktop = isTauri();
  // Tauri only honours the attribute on the element actually pressed.
  const drag = desktop ? { 'data-tauri-drag-region': true } : {};

  const isBreak = state.timer.phase === 'break';
  const isRunning = state.timer.status === 'running';
  const isPaused = state.timer.status === 'paused';

  const statusClass: StatusTone = isPaused ? 'paused' : isBreak ? 'break' : 'running';
  const statusText = isPaused ? strings.status.paused : isBreak ? strings.status.onBreak : strings.status.focusing;

  const showCountdown = activeTab !== 'timer' && (isRunning || isPaused);

  return (
    <header className="top-bar" {...drag}>
      <div className="top-bar-brand" {...drag}>
        <AppMark mark={<IconLogo size={16} />} label={strings.header.appMenu} items={tidyMenuItems(appMenuItems())} />
      </div>

      <div className={cx('top-bar-main', desktop && 'has-window-controls')} {...drag}>
        <h1 className="top-bar-title" {...drag}>{PAGE_TITLES[activeTab]}</h1>

        {/* Only while the timer runs or waits paused on another page: idle says nothing, and
            the Timer page shows the player itself. A link back to the timer, with play/pause. */}
        {showCountdown && (
          <StatusChip
            id="headerStatus"
            tone={statusClass}
            label={statusText}
            value={formatClock(state.timer.remaining)}
            onOpen={() => setActiveTab('timer')}
            openTitle={strings.tabs.timer}
            action={{
              label: isRunning ? strings.timer.pauseTooltip : strings.timer.playTooltip,
              icon: <IconSwap on={isRunning} onIcon={<IconPause size={14} />} offIcon={<IconPlay size={14} />} />,
              onClick: toggleTimer
            }}
          />
        )}

        <div className="top-bar-spacer" {...drag} />

        <div className="top-bar-tools">
          {mini.supported && (
            <IconButton
              label={mini.isOpen ? strings.actions.closeMini : strings.actions.openMini}
              active={mini.isOpen}
              onClick={mini.toggle}
              aria-pressed={mini.isOpen}
              data-tour="mini-player-btn"
            >
              <IconMiniPlayer size={19} />
            </IconButton>
          )}
          {onOpenNotifications && (
            <IconButton
              label={strings.header.notifTooltip}
              className={cx('bell-btn', alertRinging && 'is-ringing')}
              id="notifSettingsBtn"
              onClick={() => {
                clearBellDot();
                onOpenNotifications();
              }}
              data-tour="alerts-btn"
            >
              <IconBell size={19} className="bell-icon" />
              {/* The most important toast since the bell was last opened (color and toast icons carry the meaning). */}
              {bellDot && <span className={`bell-dot is-${bellDot}`} aria-hidden="true" />}
            </IconButton>
          )}
          <IconButton
            label={strings.header.soundToggleTooltip}
            id="soundToggleBtn"
            aria-pressed={state.sound}
            onClick={toggleSound}
          >
            <IconSwap on={state.sound} onIcon={<IconSoundOn size={19} />} offIcon={<IconSoundOff size={19} />} />
          </IconButton>
          <IconButton
            label={strings.header.helpTooltip}
            id="helpBtn"
            aria-haspopup="dialog"
            onClick={() => setHelpOpen(true)}
            data-tour="help-btn"
          >
            <IconHelp size={19} />
          </IconButton>
        </div>

        {desktop && <WindowControls />}
      </div>
    </header>
  );
};
