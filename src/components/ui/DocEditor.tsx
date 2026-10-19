import React from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { TableKit } from '@tiptap/extension-table';
import { Placeholder } from '@tiptap/extensions';
import { Markdown } from '@tiptap/markdown';
import { DocEditorToolbar } from './DocEditorToolbar';

export interface DocEditorProps {
  /** The Markdown the editor opens with. The editor owns the text from then on and reports each change. */
  markdown: string;
  onChange: (markdown: string) => void;
  /** Names the writing area for screen readers. */
  ariaLabel: string;
  /** Shown while the document is empty. */
  placeholder?: string;
  autoFocus?: boolean;
}

/**
 * A Markdown document editor with a formatting toolbar (styles: components/doc-editor.css).
 * Underline is off: Markdown has no syntax for it, so it would vanish on export. Tables need
 * TableKit, or the Markdown parser drops them.
 */
export const DocEditor: React.FC<DocEditorProps> = ({ markdown, onChange, ariaLabel, placeholder, autoFocus }) => {
  const editor = useEditor({
    // The desktop CSP allows no inline styles, so TipTap's injected <style> stays off; its rules live in our CSS.
    injectCSS: false,
    extensions: [
      StarterKit.configure({ underline: false, link: { openOnClick: false, autolink: true } }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TableKit,
      Placeholder.configure({ placeholder: placeholder ?? '' }),
      Markdown
    ],
    content: markdown,
    contentType: 'markdown',
    autofocus: autoFocus ? 'end' : false,
    editorProps: { attributes: { role: 'textbox', 'aria-multiline': 'true', 'aria-label': ariaLabel } },
    onUpdate: ({ editor: e }) => onChange(e.getMarkdown())
  });

  return (
    <div className="doc-editor">
      {editor && <DocEditorToolbar editor={editor} />}
      <EditorContent editor={editor} className="doc-editor-content" />
    </div>
  );
};
