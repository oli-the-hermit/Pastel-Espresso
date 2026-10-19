import React from 'react';
import { cx } from '../../lib/cx';
import { IconSearch, IconClose } from './icons';
import { IconButton } from './IconButton';
import { useUiLabels } from './UiLabels';

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Accessible name; the placeholder says what is searched. */
  ariaLabel: string;
  placeholder?: string;
  /** Name of the clear button; defaults to the primitives' own "Clear". */
  clearLabel?: string;
  id?: string;
  className?: string;
}

/** A pill-shaped search box with a clear button once something is typed (styles: components/search-field.css). */
export const SearchField: React.FC<SearchFieldProps> = ({ value, onChange, ariaLabel, placeholder, clearLabel, id, className }) => {
  const labels = useUiLabels();
  return (
    <div className={cx('search-field', className)} role="search">
      <IconSearch size={17} />
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder ?? labels.search}
        aria-label={ariaLabel}
        autoComplete="off"
        spellCheck={false}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Escape' && value) {
            e.preventDefault();
            e.stopPropagation();
            onChange('');
          }
        }}
      />
      {value && (
        <IconButton size="xs" surface={2} label={clearLabel ?? labels.clear} onClick={() => onChange('')}>
          <IconClose size={14} strokeWidth={2.4} />
        </IconButton>
      )}
    </div>
  );
};
