import { useCallback, useEffect, useMemo, useState } from 'react';

export type SelectMode = 'replace' | 'toggle' | 'range';

interface Selection {
  ids: ReadonlySet<string>;
  /** Where a range starts: the last note picked on its own. */
  anchor: string | null;
}

export const EMPTY_SELECTION: Selection = { ids: new Set(), anchor: null };

/**
 * The selection after picking `id`: `replace` selects only it, `toggle` adds or removes it
 * (Ctrl or the checkbox), `range` selects everything between the anchor and it (Shift).
 * `ordered` is the visible list, which gives a range its meaning.
 */
export function pick(current: Selection, id: string, mode: SelectMode, ordered: readonly string[]): Selection {
  if (mode === 'replace') return { ids: new Set([id]), anchor: id };
  if (mode === 'toggle') {
    const ids = new Set(current.ids);
    if (!ids.delete(id)) ids.add(id);
    return { ids, anchor: id };
  }
  const from = ordered.indexOf(current.anchor ?? id);
  const to = ordered.indexOf(id);
  if (from < 0 || to < 0) return { ids: new Set([id]), anchor: id };
  const [lo, hi] = from < to ? [from, to] : [to, from];
  return { ids: new Set(ordered.slice(lo, hi + 1)), anchor: current.anchor ?? id };
}

/** The same selection without the ids that left the list (moved, deleted, filtered out). */
export function prune(current: Selection, ordered: readonly string[]): Selection {
  const visible = new Set(ordered);
  const ids = [...current.ids].filter(id => visible.has(id));
  if (ids.length === current.ids.size) return current;
  return { ids: new Set(ids), anchor: current.anchor && visible.has(current.anchor) ? current.anchor : null };
}

/**
 * Which notes are selected, over the list now on screen. Anything that leaves the list drops
 * out of the selection, so a bulk action never reaches a note you can't see.
 */
export function useNoteSelection(visibleIds: readonly string[]) {
  const [selection, setSelection] = useState<Selection>(EMPTY_SELECTION);
  const key = visibleIds.join('\n');
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` stands for the list's contents
  const ordered = useMemo(() => visibleIds, [key]);

  useEffect(() => setSelection(s => prune(s, ordered)), [ordered]);

  const select = useCallback(
    (id: string, mode: SelectMode = 'replace') => setSelection(s => pick(s, id, mode, ordered)),
    [ordered]
  );
  const selectAll = useCallback(() => setSelection({ ids: new Set(ordered), anchor: null }), [ordered]);
  const clear = useCallback(() => setSelection(EMPTY_SELECTION), []);

  return { ids: selection.ids, count: selection.ids.size, isSelected: (id: string) => selection.ids.has(id), select, selectAll, clear };
}
