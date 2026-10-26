import { strings } from './strings';
import { detectOs } from '../lib/platform';

/**
 * Every keyboard shortcut, once. useShortcuts dispatches from it, menus show
 * its key caps as hints, and Help → Keyboard shortcuts lists it in this order.
 */
export const SHORTCUTS = [
  { id: 'toggleTimer', keys: [' '], caps: [strings.keys.space] },
  { id: 'skip', keys: ['s'], caps: ['S'] },
  { id: 'reset', keys: ['r'], caps: ['R'] },
  { id: 'newSession', keys: ['n'], caps: ['N'] },
  { id: 'miniPlayer', keys: ['m'], caps: ['M'] },
  { id: 'help', keys: ['?'], caps: ['?'] },
  // Handled by the context menu itself (and Windows' Menu key); listed for Help only.
  { id: 'contextMenu', keys: [], caps: [strings.keys.shift, 'F10'] }
] as const;

export type ShortcutId = (typeof SHORTCUTS)[number]['id'];

/** Key caps joined for a menu hint: "Space", "Shift+F10". */
export function shortcutHint(id: ShortcutId): string {
  return SHORTCUTS.find(s => s.id === id)!.caps.join('+');
}

/**
 * The note editor's own shortcuts (TipTap's defaults, handled by the editor), for Help only.
 * `mod` is Ctrl, or ⌘ on a Mac.
 */
export const EDITOR_SHORTCUTS = [
  { id: 'bold', caps: ['mod', 'B'] },
  { id: 'italic', caps: ['mod', 'I'] },
  { id: 'strike', caps: ['mod', 'shift', 'S'] },
  { id: 'code', caps: ['mod', 'E'] },
  { id: 'heading', caps: ['mod', 'alt', '1–6'] },
  { id: 'bulletList', caps: ['mod', 'shift', '8'] },
  { id: 'orderedList', caps: ['mod', 'shift', '7'] },
  { id: 'checklist', caps: ['mod', 'shift', '9'] },
  { id: 'quote', caps: ['mod', 'shift', 'B'] },
  { id: 'codeBlock', caps: ['mod', 'alt', 'C'] },
  { id: 'undo', caps: ['mod', 'Z'] },
  { id: 'redo', caps: ['mod', 'shift', 'Z'] }
] as const;

/** Modifier names as this computer's keyboard prints them. */
export function modifierCaps(userAgent: string = navigator.userAgent): Record<'mod' | 'alt' | 'shift', string> {
  const mac = detectOs(userAgent) === 'macOS';
  return { mod: mac ? '⌘' : strings.keys.ctrl, alt: mac ? '⌥' : strings.keys.alt, shift: strings.keys.shift };
}

/** The shortcut bound to a KeyboardEvent.key (letters matched case-insensitively). */
export function shortcutForKey(key: string): ShortcutId | undefined {
  const k = key.length === 1 ? key.toLowerCase() : key;
  return SHORTCUTS.find(s => (s.keys as readonly string[]).includes(k))?.id;
}
