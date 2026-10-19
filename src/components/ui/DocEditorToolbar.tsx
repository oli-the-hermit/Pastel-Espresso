import React, { useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import { IconButton } from './IconButton';
import { Menu } from './Menu';
import { Popover } from './Popover';
import { Button } from './Button';
import { TextInput } from './Field';
import { ActionRow } from './ActionRow';
import { useUiLabels } from './UiLabels';
import {
  IconBold,
  IconChecklist,
  IconCode,
  IconCodeBlock,
  IconHeading,
  IconItalic,
  IconLink,
  IconList,
  IconListOrdered,
  IconQuote,
  IconRedo,
  IconStrike,
  IconTable,
  IconUndo
} from './icons';

/** Keeps the editor's focus and selection when a toolbar button is pressed. */
const keepFocus = (e: React.MouseEvent) => e.preventDefault();

interface ToolButtonProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const ToolButton: React.FC<ToolButtonProps> = ({ label, active, disabled, onClick, children }) => (
  <IconButton size="sm" label={label} active={active} disabled={disabled} aria-pressed={active} onMouseDown={keepFocus} onClick={onClick}>
    {children}
  </IconButton>
);

/** The link button: a small panel to type an address, apply it, or remove the link under the cursor. */
const LinkTool: React.FC<{ editor: Editor; active: boolean }> = ({ editor, active }) => {
  const labels = useUiLabels().docEditor;
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [href, setHref] = useState('');

  const show = () => {
    setHref((editor.getAttributes('link').href as string | undefined) ?? '');
    setOpen(true);
  };
  const apply = () => {
    const value = href.trim();
    const chain = editor.chain().focus().extendMarkRange('link');
    if (value) chain.setLink({ href: value }).run();
    else chain.unsetLink().run();
    setOpen(false);
  };

  return (
    <span ref={anchorRef} className="doc-editor-link">
      <ToolButton label={labels.link} active={active} onClick={show}>
        <IconLink size={17} />
      </ToolButton>
      <Popover open={open} anchorRef={anchorRef} onClose={() => setOpen(false)} matchWidth={false} role="dialog" ariaLabel={labels.link} className="doc-editor-link-panel">
        <form
          className="doc-editor-link-form"
          onSubmit={e => {
            e.preventDefault();
            apply();
          }}
        >
          <TextInput
            value={href}
            onChange={e => setHref(e.target.value)}
            placeholder={labels.linkPlaceholder}
            aria-label={labels.linkAddress}
            autoFocus
            inputMode="url"
          />
          <ActionRow>
            {active && (
              <Button
                size="sm"
                onClick={() => {
                  editor.chain().focus().extendMarkRange('link').unsetLink().run();
                  setOpen(false);
                }}
              >
                {labels.linkRemove}
              </Button>
            )}
            <Button size="sm" variant="primary" type="submit">{labels.linkApply}</Button>
          </ActionRow>
        </form>
      </Popover>
    </span>
  );
};

/** What the editor's toolbar shows as pressed or unavailable for the current selection. */
function useToolState(editor: Editor) {
  return useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h1: e.isActive('heading', { level: 1 }),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      strike: e.isActive('strike'),
      code: e.isActive('code'),
      link: e.isActive('link'),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      tasks: e.isActive('taskList'),
      quote: e.isActive('blockquote'),
      codeBlock: e.isActive('codeBlock'),
      table: e.isActive('table'),
      canUndo: e.can().undo(),
      canRedo: e.can().redo()
    })
  });
}

/** Formatting controls for a DocEditor (styles: components/doc-editor.css). */
export const DocEditorToolbar: React.FC<{ editor: Editor }> = ({ editor }) => {
  const labels = useUiLabels().docEditor;
  const on = useToolState(editor);
  const run = () => editor.chain().focus();

  return (
    <div className="doc-editor-toolbar" role="toolbar" aria-label={labels.toolbar}>
      <Menu
        ariaLabel={labels.textStyle}
        trigger={<IconHeading size={17} />}
        triggerSize="sm"
        align="start"
        items={[
          { key: 'p', label: labels.paragraph, onSelect: () => run().setParagraph().run() },
          { key: 'h1', label: labels.heading1, onSelect: () => run().setHeading({ level: 1 }).run() },
          { key: 'h2', label: labels.heading2, onSelect: () => run().setHeading({ level: 2 }).run() },
          { key: 'h3', label: labels.heading3, onSelect: () => run().setHeading({ level: 3 }).run() }
        ]}
      />
      <span className="doc-editor-sep" aria-hidden="true" />
      <ToolButton label={labels.bold} active={on.bold} onClick={() => run().toggleBold().run()}><IconBold size={17} /></ToolButton>
      <ToolButton label={labels.italic} active={on.italic} onClick={() => run().toggleItalic().run()}><IconItalic size={17} /></ToolButton>
      <ToolButton label={labels.strike} active={on.strike} onClick={() => run().toggleStrike().run()}><IconStrike size={17} /></ToolButton>
      <ToolButton label={labels.code} active={on.code} onClick={() => run().toggleCode().run()}><IconCode size={17} /></ToolButton>
      <LinkTool editor={editor} active={on.link} />
      <span className="doc-editor-sep" aria-hidden="true" />
      <ToolButton label={labels.bulletList} active={on.bullet} onClick={() => run().toggleBulletList().run()}><IconList size={17} /></ToolButton>
      <ToolButton label={labels.orderedList} active={on.ordered} onClick={() => run().toggleOrderedList().run()}><IconListOrdered size={17} /></ToolButton>
      <ToolButton label={labels.checklist} active={on.tasks} onClick={() => run().toggleTaskList().run()}><IconChecklist size={17} /></ToolButton>
      <span className="doc-editor-sep" aria-hidden="true" />
      <ToolButton label={labels.quote} active={on.quote} onClick={() => run().toggleBlockquote().run()}><IconQuote size={17} /></ToolButton>
      <ToolButton label={labels.codeBlock} active={on.codeBlock} onClick={() => run().toggleCodeBlock().run()}><IconCodeBlock size={17} /></ToolButton>
      <ToolButton label={labels.table} active={on.table} onClick={() => run().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><IconTable size={17} /></ToolButton>
      <span className="doc-editor-sep" aria-hidden="true" />
      <ToolButton label={labels.undo} disabled={!on.canUndo} onClick={() => run().undo().run()}><IconUndo size={17} /></ToolButton>
      <ToolButton label={labels.redo} disabled={!on.canRedo} onClick={() => run().redo().run()}><IconRedo size={17} /></ToolButton>
    </div>
  );
};
