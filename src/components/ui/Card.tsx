import React, { forwardRef } from 'react';
import { cx } from '../../lib/cx';

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

/** Tonal surface that groups related content (styles: components/card.css). */
export const Card = forwardRef<HTMLDivElement, CardProps>(({ className, ...rest }, ref) => (
  <div ref={ref} className={cx('card', className)} {...rest} />
));
Card.displayName = 'Card';

export interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  /** Tooltip for the title, which truncates with an ellipsis. */
  titleTooltip?: string;
  /** The title wraps onto more lines instead of ending in an ellipsis (e.g. a goal's name). */
  titleWraps?: boolean;
  /** Small uppercase line above the title. */
  overline?: React.ReactNode;
  /** A count beside the menu, on the overline's line (e.g. "2 of 5"). Needs an overline. */
  count?: React.ReactNode;
  /** Right after the title, on its line (e.g. a count chip). */
  titleAddon?: React.ReactNode;
  /** Chips or meta shown under the title. */
  subtitle?: React.ReactNode;
  /** A progress bar that closes the title block (e.g. a goal's landmarks). */
  progress?: React.ReactNode;
  /** Icon buttons on the right, grouped tightly. */
  actions?: React.ReactNode;
  /** Anything else on the right, unwrapped (e.g. a status chip). */
  aside?: React.ReactNode;
}

/**
 * Large card header: title (with optional overline and subtitle row) and trailing actions.
 * With an overline, the overline and the actions share a first row of the same height as every
 * card's head row (PanelHeader, the player's), so overlines line up across columns.
 */
export const CardHeader: React.FC<CardHeaderProps> = ({ title, titleTooltip, titleWraps, overline, count, titleAddon, subtitle, progress, actions, aside, className, ...rest }) => {
  const titleClass = cx('card-title', titleWraps && 'card-title--wrap');
  const side = (
    <>
      {count != null && count !== false && <span className="card-header-count">{count}</span>}
      {aside}
      {actions && <div className="card-header-actions">{actions}</div>}
    </>
  );
  return (
    <div className={cx('card-header', !!overline && 'has-overline', className)} {...rest}>
      {overline && (
        <div className="card-header-top">
          <span className="overline card-overline">{overline}</span>
          {side}
        </div>
      )}
      <div className="card-header-main">
        {titleAddon ? (
        <div className="card-title-row">
            <h2 className={titleClass} title={titleTooltip}>{title}</h2>
            {titleAddon}
          </div>
        ) : (
          <h2 className={titleClass} title={titleTooltip}>{title}</h2>
        )}
        {subtitle && <div className="card-subtitle-row">{subtitle}</div>}
        {progress && <div className="card-header-progress">{progress}</div>}
      </div>
      {!overline && side}
    </div>
  );
};

export interface PanelHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  /** Usually a small tonal button. */
  action?: React.ReactNode;
}

/** Compact header for side panels: an uppercase label and one optional action. */
export const PanelHeader: React.FC<PanelHeaderProps> = ({ title, action, className, ...rest }) => (
  <div className={cx('panel-card-header', className)} {...rest}>
    <span className="panel-card-title">{title}</span>
    {action}
  </div>
);
