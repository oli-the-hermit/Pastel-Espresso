import React from 'react';
import { cx } from '../../lib/cx';
import { IconCheck, IconClose, IconInfo, IconWarning } from './icons';

export type ToastTone = 'success' | 'info' | 'warning' | 'error';

export interface ToastData {
  id: string;
  message: React.ReactNode;
  tone: ToastTone;
  /** A button after the message, e.g. Undo. */
  action?: { label: string; onClick: () => void };
  /** Playing its exit animation. */
  leaving?: boolean;
}

/** Every tone has its own icon, so color is never the only signal. */
const TONE_ICONS: Record<ToastTone, React.ReactNode> = {
  success: <IconCheck size={18} strokeWidth={2.4} />,
  info: <IconInfo size={18} />,
  warning: <IconWarning size={18} />,
  error: <IconClose size={18} strokeWidth={2.4} />
};

/** One line of feedback: tone icon + message, and an optional action (styles: components/toast.css). */
export const Toast: React.FC<Omit<ToastData, 'id'>> = ({ message, tone, action, leaving }) => (
  <div className={cx('toast', `is-${tone}`, leaving && 'is-leaving')} role={tone === 'error' ? 'alert' : undefined}>
    <span className="toast-icon" aria-hidden="true">{TONE_ICONS[tone]}</span>
    <span className="toast-message">{message}</span>
    {action && (
      <button type="button" className="toast-action" onClick={action.onClick}>{action.label}</button>
    )}
  </div>
);

export interface ToastRegionProps {
  toasts: ToastData[];
  id?: string;
}

/**
 * Where toasts appear: top right, under the app bar. A polite live region; errors
 * interrupt on their own (role="alert").
 */
export const ToastRegion: React.FC<ToastRegionProps> = ({ toasts, id }) => (
  <div className="toast-container" id={id} role="status" aria-live="polite">
    {toasts.map(t => (
      <Toast key={t.id} message={t.message} tone={t.tone} action={t.action} leaving={t.leaving} />
    ))}
  </div>
);
