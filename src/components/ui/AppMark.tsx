import React from 'react';
import { Menu, type MenuItem } from './Menu';

export interface AppMarkProps {
  /** The app's logo, drawn on the accent tile. */
  mark: React.ReactNode;
  /** Names the button and its menu, e.g. "App menu". */
  label: string;
  items: MenuItem[];
}

/**
 * The app's mark as a button: an accent tile at the start of the top bar that opens the
 * app's menu (styles: components/app-mark.css).
 */
export const AppMark: React.FC<AppMarkProps> = ({ mark, label, items }) => (
  <Menu ariaLabel={label} items={items} trigger={mark} triggerClassName="app-mark" align="start" />
);
