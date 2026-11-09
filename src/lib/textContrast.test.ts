import { describe, expect, it } from 'vitest';
import css from '../styles/foundation/tokens.css?raw';
import { parseTokens } from './accentPalette';
import { contrast } from './color';

// Text people read meets WCAG AA (4.5:1) on every surface it can sit on, in both themes.
// --text-3 is kept for placeholders, disabled controls and finished items (faded on purpose),
// so it only needs the 3:1 of a control's edge (docs/patterns.md, "Contrast").
const SURFACES = ['--bg', '--surface-1', '--surface-2', '--surface-3'];
const RULES: [token: string, min: number][] = [
  ['--text-1', 4.5],
  ['--text-2', 4.5],
  ['--text-3', 3]
];

describe('text contrast', () => {
  const themes = parseTokens(css);
  for (const [theme, tokens] of Object.entries(themes)) {
    for (const [text, min] of RULES) {
      it(`${text} reaches ${min}:1 on every surface (${theme})`, () => {
        const low = SURFACES
          .map(surface => ({ surface, ratio: contrast(tokens[text], tokens[surface]) }))
          .filter(r => r.ratio < min)
          .map(r => `${r.surface} ${r.ratio.toFixed(2)}`);
        expect(low).toEqual([]);
      });
    }
  }
});
