import React from 'react';
import { cx } from '../../lib/cx';
import { Card, PanelHeader } from './Card';
import { IconButton } from './IconButton';
import { Menu, type MenuItem } from './Menu';
import { useContextMenu } from './ContextMenu';
import { Select } from './Select';
import { useUiLabels } from './UiLabels';

export interface ScopeItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  /** Shown at the end of the row. */
  count?: number;
  active: boolean;
  onSelect: () => void;
  /** Actions for this row: a ⋮ on hover and the right-click menu. */
  menu?: MenuItem[];
  menuLabel?: string;
}

export interface ScopeSection {
  key: string;
  /** Uppercase heading; the first section can go without. */
  heading?: string;
  /** A small "+" beside the heading. */
  action?: { label: string; onClick: () => void; icon: React.ReactNode };
  items: ScopeItem[];
  /** Said when the section has no items. */
  empty?: string;
}

export interface ScopeListProps {
  sections: ScopeSection[];
  ariaLabel: string;
  /**
   * For narrow windows: one dropdown of every place instead of the card, and a ⋮ beside it
   * with the current place's actions and each section's action. Item keys must be unique
   * across sections.
   */
  compact?: boolean;
  className?: string;
  'data-tour'?: string;
}

/** The compact form: a Select of every place, and a ⋮ with what the card's menus and "+" buttons offer. */
const ScopeSelect: React.FC<Omit<ScopeListProps, 'compact'>> = ({ sections, ariaLabel, className, 'data-tour': dataTour }) => {
  const labels = useUiLabels();
  const items = sections.flatMap(s => s.items);
  const active = items.find(i => i.active);
  const adds = sections.flatMap(s =>
    s.action ? [{ key: `add-${s.key}`, label: s.action.label, icon: s.action.icon, onSelect: s.action.onClick }] : []
  );
  const actions: MenuItem[] = [...(active?.menu ?? []), ...(active?.menu?.length && adds.length ? [{ key: 'add-divider', divider: true as const }] : []), ...adds];
  return (
    <div className={cx('scope-select', className)} data-tour={dataTour}>
      <Select
        value={active?.key ?? ''}
        onChange={key => items.find(i => i.key === key)?.onSelect()}
        ariaLabel={ariaLabel}
        options={items.map(i => ({ value: i.key, label: i.label, icon: i.icon, meta: i.count ? i.count : undefined }))}
      />
      {actions.length > 0 && <Menu items={actions} ariaLabel={active?.menuLabel ?? labels.moreActions} align="end" />}
    </div>
  );
};

/**
 * A card of places to switch between (a mailbox's folders and labels): sections of rows with
 * an icon, a name and a count, one of them current (styles: components/scope-list.css).
 */
export const ScopeList: React.FC<ScopeListProps> = ({ sections, ariaLabel, compact = false, className, 'data-tour': dataTour }) => {
  const contextMenu = useContextMenu();
  if (compact) return <ScopeSelect sections={sections} ariaLabel={ariaLabel} className={className} data-tour={dataTour} />;
  return (
    <Card className={cx('scope-list', className)} data-tour={dataTour}>
      <nav aria-label={ariaLabel}>
        {sections.map(section => (
          <section key={section.key} className="scope-section">
            {(section.heading || section.action) && (
              <PanelHeader
                title={section.heading}
                action={
                  section.action && (
                    <IconButton size="xs" label={section.action.label} onClick={section.action.onClick}>
                      {section.action.icon}
                    </IconButton>
                  )
                }
              />
            )}
            {section.items.length === 0 && section.empty && <p className="scope-empty">{section.empty}</p>}
            {section.items.map(item => (
              <div
                key={item.key}
                className={cx('scope-item', item.active && 'is-active')}
                onContextMenu={item.menu ? e => contextMenu(e, item.menu!) : undefined}
              >
                <button type="button" className="scope-item-main" aria-current={item.active ? 'page' : undefined} onClick={item.onSelect}>
                  <span className="scope-item-icon">{item.icon}</span>
                  <span className="scope-item-name" title={item.label}>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && <span className="scope-item-count">{item.count}</span>}
                </button>
                {item.menu && (
                  <div className="scope-item-menu">
                    <Menu items={item.menu} ariaLabel={item.menuLabel} triggerSize="xs" triggerSurface={item.active ? 'accent' : 2} />
                  </div>
                )}
              </div>
            ))}
          </section>
        ))}
      </nav>
    </Card>
  );
};
