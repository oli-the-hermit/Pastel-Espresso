import React, { forwardRef } from 'react';
import { cx } from '../../lib/cx';
import { surfaceClass, type Surface } from './surface';

export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  /** Accessible name, also shown as the tooltip. Required: the button has no visible text. */
  label: string;
  size?: 'md' | 'sm' | 'xs';
  tone?: 'default' | 'danger';
  /** Toggled-on state (accent container). */
  active?: boolean;
  /** Faint at rest (e.g. a row's ⋮), so a list of rows stays calm. */
  quiet?: boolean;
  /** The surface it sits on (default 1, a card); its hover is one step above. */
  surface?: Surface;
  children: React.ReactNode;
}

export interface IconButtonLook {
  size?: 'md' | 'sm' | 'xs';
  tone?: 'default' | 'danger';
  active?: boolean;
  quiet?: boolean;
  surface?: Surface;
}

/** The classes of an icon button; also used by triggers that render their own <button> (Menu). */
export const iconButtonClass = ({ size = 'md', tone = 'default', active = false, quiet = false, surface }: IconButtonLook = {}): string =>
  cx('icon-btn', size !== 'md' && size, tone === 'danger' && 'danger', active && 'is-active', quiet && 'is-quiet', surfaceClass(surface));

/** Round icon-only button (styles: components/button.css). Defaults to type="button". */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, size, tone, active, quiet, surface, className, type = 'button', title, children, ...rest }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cx(iconButtonClass({ size, tone, active, quiet, surface }), className)}
      aria-label={label}
      title={title ?? label}
      {...rest}
    >
      {children}
    </button>
  )
);
IconButton.displayName = 'IconButton';
