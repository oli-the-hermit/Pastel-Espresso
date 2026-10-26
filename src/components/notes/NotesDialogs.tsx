import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNotes } from '../../context/NotesContext';
import { useDirty } from '../../hooks/useDirty';
import { strings } from '../../constants/strings';
import { format } from '../../lib/i18n';
import { ActionRow } from '../ui/ActionRow';
import { Button } from '../ui/Button';
import { Field, TextInput } from '../ui/Field';
import { FormActions } from '../ui/FormActions';
import { FormHint, ModalForm } from '../ui/FormLayout';
import { ChipSet, InputChip } from '../ui/InputChip';
import { IconFolder, IconInbox, IconPlus } from '../ui/icons';
import { MenuList, type MenuItem } from '../ui/Menu';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { useNoteActions } from './useNoteActions';
import { ExportChooser, ImportChooser, ImportPreview } from './NoteTransferDialogs';
import type { ImportPlan } from '../../lib/noteFiles';

export type NameMode = 'new-collection' | 'rename-collection' | 'new-label' | 'rename-label' | 'rename-note';

/**
 * The dialogs of the Notes screen. `name` asks for a name; `move`, `labels` and `export` act
 * on the notes they're given; `import` asks where from, and `import-preview` shows what an
 * import will create.
 */
export type NotesDialogState =
  | { kind: 'name'; mode: NameMode; id?: string; initial?: string; /** Notes to move into a collection made here. */ moveIds?: string[] }
  | { kind: 'move'; ids: string[] }
  | { kind: 'labels'; ids: string[] }
  | { kind: 'export'; ids: string[]; /** The bundle's title or folder's name. */ title?: string }
  | { kind: 'import' }
  | { kind: 'import-preview'; plan: ImportPlan };

const NAME_COPY: Record<NameMode, { title: string; label: string; placeholder: string; primary: string }> = {
  'new-collection': { title: strings.notes.nameDialog.newCollection, label: strings.notes.nameDialog.collectionName, placeholder: strings.notes.nameDialog.collectionPlaceholder, primary: strings.notes.nameDialog.create },
  'rename-collection': { title: strings.notes.nameDialog.renameCollection, label: strings.notes.nameDialog.collectionName, placeholder: strings.notes.nameDialog.collectionPlaceholder, primary: strings.common.save },
  'new-label': { title: strings.notes.nameDialog.newLabel, label: strings.notes.nameDialog.labelName, placeholder: strings.notes.nameDialog.labelPlaceholder, primary: strings.notes.nameDialog.create },
  'rename-label': { title: strings.notes.nameDialog.renameLabel, label: strings.notes.nameDialog.labelName, placeholder: strings.notes.nameDialog.labelPlaceholder, primary: strings.common.save },
  'rename-note': { title: strings.notes.nameDialog.renameNote, label: strings.notes.nameDialog.noteTitle, placeholder: strings.notes.nameDialog.notePlaceholder, primary: strings.common.save }
};

const NameForm: React.FC<{ state: Extract<NotesDialogState, { kind: 'name' }>; onClose: () => void }> = ({ state, onClose }) => {
  const { createCollection, renameCollection, createLabel, renameLabel } = useNotes();
  const { showToast } = useApp();
  const actions = useNoteActions();
  const copy = NAME_COPY[state.mode];
  const [name, setName] = useState(state.initial ?? '');
  const dirty = useDirty([name]);
  const t = strings.notes.toasts;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = name.trim();
    // A note can go back to untitled; collections and labels need a name.
    if (!value && state.mode !== 'rename-note') return;
    switch (state.mode) {
      case 'new-collection': {
        const id = createCollection(value);
        if (state.moveIds?.length) void actions.moveTo(state.moveIds, id);
        else showToast(format(t.collectionCreated, { name: value }));
        break;
      }
      case 'rename-collection':
        renameCollection(state.id!, value);
        showToast(t.collectionRenamed);
        break;
      case 'new-label':
        createLabel(value);
        showToast(format(t.labelCreated, { name: value }));
        break;
      case 'rename-label':
        renameLabel(state.id!, value);
        showToast(t.labelRenamed);
        break;
      case 'rename-note':
        void actions.rename(state.id!, value);
        break;
    }
    onClose();
  };

  return (
    <ModalForm onSubmit={submit}>
      <Field label={copy.label}>
        <TextInput value={name} onChange={e => setName(e.target.value)} placeholder={copy.placeholder} autoFocus />
      </Field>
      <FormActions
        dirty={dirty}
        onCancel={onClose}
        primaryLabel={copy.primary}
        primaryDisabled={!name.trim() && state.mode !== 'rename-note'}
      />
    </ModalForm>
  );
};

const MoveList: React.FC<{ ids: string[]; onClose: () => void; onNewCollection: () => void }> = ({ ids, onClose, onNewCollection }) => {
  const { notes, collections } = useNotes();
  const { moveTo } = useNoteActions();
  const chosen = notes.filter(n => ids.includes(n.id));
  // A place the notes are all in already can't be picked.
  const allIn = (collectionId: string | null) => chosen.length > 0 && chosen.every(n => n.collectionId === collectionId);

  const items: MenuItem[] = [
    { key: 'inbox', label: strings.notes.movePrompt.inbox, icon: <IconInbox size={16} />, disabled: allIn(null), onSelect: () => void moveTo(ids, null) },
    ...collections.map(c => ({
      key: c.id,
      label: c.name,
      icon: <IconFolder size={16} />,
      disabled: allIn(c.id),
      onSelect: () => void moveTo(ids, c.id)
    })),
    { key: 'd1', divider: true as const },
    { key: 'new', label: strings.notes.movePrompt.newCollection, icon: <IconPlus size={16} />, onSelect: onNewCollection }
  ];
  return (
    <div role="menu">
      <MenuList items={items} onPicked={onClose} />
    </div>
  );
};

const LabelsEditor: React.FC<{ ids: string[]; onClose: () => void }> = ({ ids, onClose }) => {
  const { notes, labels, createLabel } = useNotes();
  const { setLabel } = useNoteActions();
  const chosen = notes.filter(n => ids.includes(n.id));
  const countOf = (labelId: string) => chosen.filter(n => n.labelIds.includes(labelId)).length;
  const on = labels.filter(l => countOf(l.id) > 0);
  const toAdd = labels.filter(l => countOf(l.id) < chosen.length);

  return (
    <ModalForm as="div">
      {labels.length === 0 && <FormHint>{strings.notes.labelPrompt.none}</FormHint>}
      {on.length > 0 && (
        <ChipSet>
          {on.map(l => (
            <InputChip
              key={l.id}
              label={l.name}
              meta={countOf(l.id) < chosen.length ? `${countOf(l.id)}/${chosen.length}` : undefined}
              onRemove={() => void setLabel(ids, l.id, false)}
            />
          ))}
        </ChipSet>
      )}
      <Select
        value=""
        ariaLabel={strings.notes.labelPrompt.title}
        placeholder={strings.notes.labelPrompt.add}
        options={toAdd.map(l => ({ value: l.id, label: l.name }))}
        onChange={labelId => {
          if (labelId) void setLabel(ids, labelId, true);
        }}
        createOption={{
          label: strings.notes.labelPrompt.newLabel,
          placeholder: strings.notes.nameDialog.labelPlaceholder,
          onCreate: name => createLabel(name)
        }}
      />
      <ActionRow>
        <Button variant="primary" onClick={onClose}>{strings.notes.labelPrompt.done}</Button>
      </ActionRow>
    </ModalForm>
  );
};

export interface NotesDialogsProps {
  dialog: NotesDialogState | null;
  onDialog: (next: NotesDialogState | null) => void;
  /** After an import, with the first collection it created. */
  onImported?: (collectionId: string | null) => void;
}

/** Hosts the Notes screen's dialogs. Each opening gets its own key, so a form never keeps what was typed last time. */
export const NotesDialogs: React.FC<NotesDialogsProps> = ({ dialog, onDialog, onImported }) => {
  const [openCount, setOpenCount] = useState(0);
  const [last, setLast] = useState<NotesDialogState | null>(dialog);
  if (dialog && dialog !== last) {
    setLast(dialog);
    setOpenCount(c => c + 1);
  }
  const shown = dialog ?? last;
  if (!shown) return null;
  const close = () => onDialog(null);

  let title = '';
  let content: React.ReactNode = null;
  if (shown.kind === 'name') {
    title = NAME_COPY[shown.mode].title;
    content = <NameForm key={openCount} state={shown} onClose={close} />;
  } else if (shown.kind === 'move') {
    title = strings.notes.movePrompt.title;
    content = (
      <MoveList
        key={openCount}
        ids={shown.ids}
        onClose={close}
        onNewCollection={() => onDialog({ kind: 'name', mode: 'new-collection', moveIds: shown.ids })}
      />
    );
  } else if (shown.kind === 'labels') {
    title = strings.notes.labelPrompt.title;
    content = <LabelsEditor key={openCount} ids={shown.ids} onClose={close} />;
  } else if (shown.kind === 'export') {
    title = strings.notes.transfer.exportTitle;
    content = <ExportChooser key={openCount} ids={shown.ids} title={shown.title} onClose={close} />;
  } else if (shown.kind === 'import') {
    title = strings.notes.transfer.importTitle;
    content = <ImportChooser key={openCount} onPlan={plan => onDialog({ kind: 'import-preview', plan })} />;
  } else {
    title = strings.notes.transfer.previewTitle;
    content = <ImportPreview key={openCount} plan={shown.plan} onClose={close} onImported={id => onImported?.(id)} />;
  }

  // Forms keep what's typed until it's saved or cancelled, so Escape doesn't close them.
  const isForm = shown.kind === 'name' || shown.kind === 'import-preview';
  return (
    <Modal isOpen={!!dialog} title={title} onClose={close} dismissible={!isForm}>
      {content}
    </Modal>
  );
};
