import React from 'react';
import { IconButton } from './IconButton';
import { IconClose } from './icons';

export interface SelectionBarProps {
  /** E.g. "3 selected". */
  summary: string;
  /** The bulk actions: Buttons. */
  children: React.ReactNode;
  clearLabel: string;
  onClear: () => void;
  ariaLabel: string;
}

/** The bar that appears while several things are picked: how many, what to do with them, a way out (styles: components/selection-bar.css). */
export const SelectionBar: React.FC<SelectionBarProps> = ({ summary, children, clearLabel, onClear, ariaLabel }) => (
  <div className="selection-bar" role="toolbar" aria-label={ariaLabel}>
    <span className="selection-bar-summary" aria-live="polite">{summary}</span>
    <div className="selection-bar-actions">{children}</div>
    <IconButton size="sm" surface="accent-container" label={clearLabel} onClick={onClear}>
      <IconClose size={16} strokeWidth={2.4} />
    </IconButton>
  </div>
);
