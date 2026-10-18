import React from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { TableKit } from '@tiptap/extension-table';
import { Markdown } from '@tiptap/markdown';

/** A Markdown document editor. Underline is off: Markdown has no syntax for it, so it would vanish on export. */
export function DocEditor({ markdown, onChange }: { markdown: string; onChange?: (markdown: string) => void }) {
  const editor = useEditor({
    // The desktop CSP allows no inline styles, so TipTap's injected <style> stays off; its rules live in our CSS.
    injectCSS: false,
    extensions: [StarterKit.configure({ underline: false }), TaskList, TaskItem.configure({ nested: true }), TableKit, Markdown],
    content: markdown,
    contentType: 'markdown',
    onUpdate: ({ editor: e }) => onChange?.(e.getMarkdown()),
  });
  return <EditorContent editor={editor} className="doc-editor" />;
}
