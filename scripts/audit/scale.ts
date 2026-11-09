// Lists stylesheet values that step off the app's scale (docs/patterns.md, "Scale").
// The tokens file keeps the full scale for the design system; the stylesheets use a subset:
//   type     the role tokens (--type-*), never the raw sizes (--text-xs, --text-lg, ...)
//   weight   --weight-body, --weight-label, --weight-title
//   spacing  the 4px grid: --space-{1,2,4,8,12,16,20,24,32,40,48} (1 and 2 for hairline groups)
//   radius   --radius-sm (small parts), -md (rows), -xl (tiles, panels, popovers), -3xl (cards and
//            modals), -pill (buttons, chips, single-line fields), -round
// A deliberate exception says so in a comment starting with "Exception (scale" on the lines right
// above it; it covers the lines that follow up to the next blank line or comment. (Plain
// "Exception" comments belong to audit:inline and don't excuse a value here.)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const STYLES = path.join(ROOT, 'src', 'styles');

const RULES: [string, RegExp][] = [
  ['type size', /var\(--text-(3xs|2xs|xs|sm|md|base|lg|xl|2xl|3xl|4xl|5xl|6xl)\)/g],
  ['weight', /var\(--weight-(regular|medium|semibold|bold|heavy)\)/g],
  ['spacing', /var\(--space-(6|10|14|18|22|28|36)\)/g],
  ['radius', /var\(--radius-(2xs|xs|lg|2xl|4xl)\)/g]
];

const files: string[] = [];
const walk = (dir: string) => {
  for (const name of fs.readdirSync(dir).sort()) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (name.endsWith('.css') && name !== 'tokens.css') files.push(p);
  }
};
walk(STYLES);

const problems: string[] = [];
const counts = new Map<string, number>();
let exceptions = 0;

for (const file of files) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  let excepted = false;
  fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach((line, i) => {
    if (line.trim().startsWith('/*')) excepted = /^\/\*\s*Exception \(scale\b/.test(line.trim());
    else if (!line.trim()) excepted = false;
    const code = line.replace(/\/\*.*?\*\//g, '');
    for (const [kind, re] of RULES) {
      for (const m of code.matchAll(re)) {
        if (excepted) { exceptions++; continue; }
        counts.set(kind, (counts.get(kind) ?? 0) + 1);
        problems.push(`  ${rel}:${i + 1}  ${kind}: ${m[0]}`);
      }
    }
  });
}

const summary = [...counts].map(([k, n]) => `${k} ${n}`).join(', ');
console.log(`Scale: ${problems.length} value(s) off the scale${problems.length ? ` (${summary})` : ''}; ${exceptions} marked as exceptions.`);
for (const p of problems) console.log(p);
if (problems.length) {
  console.log('Use a role token (--type-*, --weight-body/label/title), a 4px-grid space, or a role radius; or mark it with an "Exception (scale: why)" comment.');
  process.exitCode = 1;
}
