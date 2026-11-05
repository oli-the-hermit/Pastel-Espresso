import React from 'react';
import { cx } from '../../lib/cx';
import { IconSidebar } from './icons';

export interface NavigationItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  /** A count shown on the icon (e.g. rewards ready); hidden at 0. */
  badge?: number;
  /** Screen-reader text for the badge, e.g. "2 ready to claim". */
  badgeLabel?: string;
}

export interface NavigationRailProps {
  ariaLabel: string;
  items: NavigationItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  /** `rail`: icons over small labels. `expanded`: labels beside the icons. */
  variant?: 'rail' | 'expanded';
  /** A side-panel button at the top that expands and collapses the drawer. */
  toggle?: { expandLabel: string; collapseLabel: string; onToggle: () => void };
  /** Pinned to the bottom, e.g. the account. */
  footer?: React.ReactNode;
  'data-tour'?: string;
  /** Rendered after the rail, e.g. dialogs opened from it. */
  children?: React.ReactNode;
}

/**
 * Material 3 navigation rail / drawer (styles: components/nav-rail.css). The app's mark lives
 * in the top bar (ui/AppMark), so the head holds only the toggle. The items sit
 * centered between the head and the footer; each carries data-tab={key}. The active pill is its own element, named for a view
 * transition, so page changes can slide it between items.
 */
export const NavigationRail: React.FC<NavigationRailProps> = ({
  ariaLabel,
  items,
  activeKey,
  onSelect,
  variant = 'rail',
  toggle,
  footer,
  'data-tour': dataTour,
  children
}) => {
  const expanded = variant === 'expanded';
  return (
    <nav className="nav-rail" data-variant={variant} aria-label={ariaLabel} data-tour={dataTour}>
      {toggle && (
        <div className="nav-rail-head">
          <button
            type="button"
            className="nav-rail-toggle"
            aria-label={expanded ? toggle.collapseLabel : toggle.expandLabel}
            title={expanded ? toggle.collapseLabel : toggle.expandLabel}
            aria-expanded={expanded}
            onClick={toggle.onToggle}
          >
            <IconSidebar size={16} />
          </button>
        </div>
      )}

      <div className="nav-rail-items">
        {items.map(item => {
          const isActive = item.key === activeKey;
          return (
            <button
              key={item.key}
              type="button"
              className={cx('nav-rail-item', isActive && 'active')}
              data-tab={item.key}
              title={expanded ? undefined : item.label}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSelect(item.key)}
            >
              <span className="nav-rail-indicator">
                {isActive && <span className="nav-rail-pill" aria-hidden="true" />}
                {item.icon}
                {!!item.badge && (
                  <span className="nav-badge" aria-label={item.badgeLabel}>
                    {item.badge}
                  </span>
                )}
              </span>
              <span className="nav-rail-label">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="nav-rail-footer">{footer}</div>

      {children}
    </nav>
  );
};
