import { describe, expect, it } from 'vitest';
import { marked, type Token } from 'marked';
import { MarkdownManager } from '@tiptap/markdown';
import { decodeBasicEntities, escapeMarkdownText } from './markdownText';

const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/** What marked reads back from one paragraph: its plain text, or null if it found any formatting. */
function readBack(markdown: string): string | null {
  const [block, ...rest] = marked.lexer(markdown);
  if (rest.length > 0 || block?.type !== 'paragraph') return null;
  let text = '';
  for (const t of (block as Token & { tokens: Token[] }).tokens) {
    if (t.type !== 'text' && t.type !== 'escape') return null;
    text += decode((t as { text: string }).text);
  }
  return text;
}

const SAMPLES = [
  'R&D and Q&A',
  'snake_case_name and __init__',
  '2 * 3 = 6, and 2*3 too',
  'C:\\Users\\me\\notes',
  'ends with a backslash \\',
  'a -> b, x <- y, <3',
  'press [ ] to tick, see [1]',
  'about ~5 minutes, ~~not struck~~',
  'use `code` here',
  '*not emphasis* and _not either_',
  '&amp; typed as is, &#38; too',
  '<div> not html, <!-- not a comment -->',
  // A bare URL is a link in GFM whatever is escaped, as it is in the editor (autolink), so none here.
  'a [link](somewhere) written out',
  '\\* a typed escape'
];

describe('escapeMarkdownText', () => {
  it.each(SAMPLES)('reads back exactly: %s', sample => {
    expect(readBack(escapeMarkdownText(sample))).toBe(sample);
  });

  it('leaves ordinary text alone', () => {
    expect(escapeMarkdownText('R&D, snake_case, 2 * 3, C:\\Users, a -> b, <3')).toBe('R&D, snake_case, 2 * 3, C:\\Users, a -> b, <3');
  });

  it('undoes the entities TipTap adds before escaping', () => {
    expect(decodeBasicEntities('&amp;lt; &lt;b&gt; R&amp;D')).toBe('&lt; <b> R&D');
  });

  it('can still replace the serializer step it patches (DocEditor)', () => {
    expect(typeof (MarkdownManager.prototype as unknown as { escapeMarkdownSyntax?: unknown }).escapeMarkdownSyntax).toBe('function');
  });
});
