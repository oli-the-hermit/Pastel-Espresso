/**
 * Joins the hard-wrapped lines of plain-text paragraphs (license files wrap near 80 columns), so
 * the text reads well in a narrower box. A line continues the one before only when that one was
 * cut near the wrap width; blank lines, list items, rules and package lines
 * ("name 1.2.3 (MIT) url") always start a line of their own.
 */
const PACKAGE_LINE = /^[@\w][\w./@-]* v?\d+\.\d+\S* \(/;
const RULE = /^\s*([-=_*~#])\1{3,}\s*$/;
const ITEM = /^\s*([-*•]|\d+[.)]|\([a-z0-9]+\)|[a-z][.)])\s/i;

const startsLine = (line: string) => line.trim() === '' || PACKAGE_LINE.test(line) || RULE.test(line) || ITEM.test(line);

export function reflowText(text: string, wrapAt = 60): string {
  const out: string[] = [];
  for (const line of text.split('\n')) {
    const prev = out[out.length - 1];
    if (prev !== undefined && prev.length >= wrapAt && !startsLine(line) && !PACKAGE_LINE.test(prev) && !RULE.test(prev)) {
      out[out.length - 1] = `${prev.trimEnd()} ${line.trim()}`;
    } else {
      out.push(line);
    }
  }
  return out.join('\n');
}
