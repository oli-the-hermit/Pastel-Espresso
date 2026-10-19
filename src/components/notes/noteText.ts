import { strings } from '../../constants/strings';
import { format } from '../../lib/i18n';
import { formatFullDate, formatTimeOfDay } from '../../lib/formatUtils';
import type { Note } from '../../lib/notes';

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (ts: number) => new Date(ts).setHours(0, 0, 0, 0);

/** What the list calls a note: its title, or "Untitled note". */
export const noteTitle = (note: Pick<Note, 'title'>): string => note.title.trim() || strings.notes.untitled;

/** "Edited today, 14:05", "Edited yesterday" or "Edited Sep 24, 2026"; "In the Trash since …" for a deleted note. */
export function whenText(note: Note, now = Date.now()): string {
  const n = strings.notes;
  if (note.trashedAt !== null) return format(n.trashedOn, { date: formatFullDate(note.trashedAt) });
  const days = Math.round((startOfDay(now) - startOfDay(note.editedAt)) / DAY_MS);
  if (days <= 0) return format(n.editedToday, { time: formatTimeOfDay(note.editedAt) });
  if (days === 1) return n.editedYesterday;
  return format(n.editedOn, { date: formatFullDate(note.editedAt) });
}
