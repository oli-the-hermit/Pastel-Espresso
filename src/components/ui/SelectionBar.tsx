import React, { useLayoutEffect, useRef, useState } from 'react';
import { Button } from './Button';
import { IconButton, iconButtonClass } from './IconButton';
import { Menu } from './Menu';
import { IconClose } from './icons';

export interface SelectionAction {
  key: string;
  label: string;
  danger?: boolean;
  onSelect: () => void;
}

export interface SelectionBarProps {
  /** E.g. "3 selected". */
  summary: string;
  /** The bulk actions, in order; the ones that don't fit move, from the end, into a "More actions" menu. */
  actions: SelectionAction[];
  clearLabel: string;
  onClear: () => void;
  ariaLabel: string;
}

/** The bar that appears while several things are picked: how many, what to do with them, a way out (styles: components/selection-bar.css). */
export const SelectionBar: React.FC<SelectionBarProps> = ({ summary, actions, clearLabel, onClear, ariaLabel }) => {
  const actionsRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(actions.length);
  const labelsKey = actions.map(a => a.label).join('\n');

  // An invisible copy of every action (and the More button, last) gives their widths at any size.
  useLayoutEffect(() => {
    const box = actionsRef.current;
    const measure = measureRef.current;
    if (!box || !measure) return;
    const fit = () => {
      const gap = parseFloat(getComputedStyle(measure).columnGap) || 0;
      const widths = Array.from(measure.children, c => (c as HTMLElement).offsetWidth);
      const more = widths.pop() ?? 0;
      const span = (n: number) => (n === 0 ? 0 : widths.slice(0, n).reduce((sum, w) => sum + w, 0) + gap * (n - 1));
      const room = box.clientWidth;
      let n = widths.length;
      if (span(n) > room) {
        n -= 1;
        while (n > 0 && span(n) + gap + more > room) n -= 1;
      }
      setShown(n);
    };
    fit();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    return () => ro.disconnect();
  }, [labelsKey]);

  const overflow = actions.slice(shown);
  return (
    <div className="selection-bar" role="toolbar" aria-label={ariaLabel}>
      <span className="selection-bar-summary" aria-live="polite">{summary}</span>
      <div ref={actionsRef} className="selection-bar-actions">
        {actions.slice(0, shown).map(a => (
          <Button key={a.key} size="sm" variant={a.danger ? 'danger' : undefined} onClick={a.onSelect}>{a.label}</Button>
        ))}
        {overflow.length > 0 && (
          <Menu
            items={overflow.map(a => ({ key: a.key, label: a.label, danger: a.danger, onSelect: a.onSelect }))}
            triggerSize="sm"
            triggerSurface="accent-container"
          />
        )}
      </div>
      <IconButton size="sm" surface="accent-container" label={clearLabel} onClick={onClear}>
        <IconClose size={16} strokeWidth={2.4} />
      </IconButton>
      <div ref={measureRef} className="selection-bar-measure" aria-hidden="true">
        {actions.map(a => (
          <Button key={a.key} size="sm" variant={a.danger ? 'danger' : undefined} tabIndex={-1}>{a.label}</Button>
        ))}
        <span className={iconButtonClass({ size: 'sm' })} />
      </div>
    </div>
  );
};
