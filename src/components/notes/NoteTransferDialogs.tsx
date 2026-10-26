import React, { useState } from 'react';
import { strings } from '../../constants/strings';
import { canSaveFolder } from '../../lib/fileAccess';
import { format, LOCALE, plural } from '../../lib/i18n';
import type { ImportPlan, Skipped } from '../../lib/noteFiles';
import { Field, TextInput } from '../ui/Field';
import { FormActions } from '../ui/FormActions';
import { FormError, FormHint, ModalForm } from '../ui/FormLayout';
import { ListRow } from '../ui/ListRow';
import { IconFile, IconFolder, IconLayers } from '../ui/icons';
import { useNoteTransfer, type ExportFormat } from './useNoteTransfer';

const t = strings.notes.transfer;

/** How many titles the preview names before "and N more". */
const TITLES_SHOWN = 3;

const listText = (items: string[]) => new Intl.ListFormat(LOCALE, { type: 'conjunction' }).format(items);

const skippedText = (s: Skipped) =>
  format(t.skippedItem, {
    name: s.name,
    reason: s.reason === 'damaged' ? plural(s.count ?? 1, t.skipReasons.damaged) : t.skipReasons[s.reason]
  });

/** Where an import comes from: files or a folder (or files dropped on the page, which skip this). */
export const ImportChooser: React.FC<{ onPlan: (plan: ImportPlan) => void }> = ({ onPlan }) => {
  const { fromFiles, fromFolder } = useNoteTransfer();
  const [reading, setReading] = useState(false);

  const read = async (pick: () => Promise<ImportPlan | null>) => {
    setReading(true);
    const plan = await pick();
    setReading(false);
    if (plan) onPlan(plan);
  };

  return (
    <ModalForm as="div">
      <FormHint>{t.importIntro}</FormHint>
      {reading ? (
        <FormHint>{t.reading}</FormHint>
      ) : (
        <div className="note-transfer-options">
          <ListRow icon={<IconFile size={20} />} title={t.fromFiles} description={t.fromFilesHint} onClick={() => void read(fromFiles)} />
          <ListRow icon={<IconFolder size={20} />} title={t.fromFolder} description={t.fromFolderHint} onClick={() => void read(fromFolder)} />
        </div>
      )}
      <FormHint>{t.dropHint}</FormHint>
    </ModalForm>
  );
};

export interface ImportPreviewProps {
  plan: ImportPlan;
  onClose: () => void;
  /** After the import, with the first new collection, to show it. */
  onImported: (collectionId: string | null) => void;
}

/** What an import will create, before it does: the new collections (named here), the notes, the labels and what's left out. */
export const ImportPreview: React.FC<ImportPreviewProps> = ({ plan, onClose, onImported }) => {
  const { room, runImport } = useNoteTransfer();
  const [names, setNames] = useState<Record<string, string>>(() => Object.fromEntries(plan.groups.map(g => [g.key, g.name])));
  const [busy, setBusy] = useState(false);

  const count = plan.notes.length;
  const titles = plan.notes.map(n => n.title || strings.notes.untitled);
  const labels = [...new Map(plan.notes.flatMap(n => n.labels).map(l => [l.toLowerCase(), l])).values()];
  const over = count > room;
  const unnamed = plan.groups.some(g => !names[g.key]?.trim());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || count === 0 || over || unnamed) return;
    setBusy(true);
    const collectionId = await runImport(plan, names);
    onImported(collectionId);
    onClose();
  };

  return (
    <ModalForm onSubmit={e => void submit(e)}>
      {count === 0 && <FormError>{t.nothing}</FormError>}
      {plan.groups.map(g => {
        const inIt = plan.notes.filter(n => n.group === g.key).length;
        return (
          <Field key={g.key} label={plural(inIt, t.collectionLabel)}>
            <TextInput value={names[g.key] ?? ''} onChange={e => setNames(prev => ({ ...prev, [g.key]: e.target.value }))} />
          </Field>
        );
      })}
      {count > 0 && (
        <FormHint>
          {count <= TITLES_SHOWN
            ? format(t.includes, { titles: listText(titles) })
            : format(t.includesMore, { titles: titles.slice(0, TITLES_SHOWN).join(', '), count: count - TITLES_SHOWN })}
        </FormHint>
      )}
      {labels.length > 0 && <FormHint>{format(t.labels, { names: listText(labels) })}</FormHint>}
      {plan.skipped.length > 0 && <FormHint>{format(t.skipped, { list: plan.skipped.map(skippedText).join('; ') })}</FormHint>}
      {over && <FormError>{format(t.overLimit, { count, room })}</FormError>}
      <FormActions
        dirty
        onCancel={onClose}
        primaryLabel={busy ? t.importing : plural(count, t.importButton)}
        primaryDisabled={busy || count === 0 || over || unnamed}
      />
    </ModalForm>
  );
};

export interface ExportChooserProps {
  ids: string[];
  /** The bundle's title and the folder's name; a collection's name when it's exported whole. */
  title?: string;
  onClose: () => void;
}

/** How to save a copy: a Markdown file (or a folder of them) or a bundle. */
export const ExportChooser: React.FC<ExportChooserProps> = ({ ids, title, onClose }) => {
  const { exportNotes } = useNoteTransfer();
  const [busy, setBusy] = useState(false);
  const one = ids.length === 1;

  const save = async (as: ExportFormat) => {
    setBusy(true);
    const saved = await exportNotes(ids, as, title);
    setBusy(false);
    if (saved) onClose();
  };

  return (
    <ModalForm as="div">
      <FormHint>{plural(ids.length, t.exportIntro)}</FormHint>
      {busy ? (
        <FormHint>{t.exporting}</FormHint>
      ) : (
        <div className="note-transfer-options">
          {one ? (
            <ListRow icon={<IconFile size={20} />} title={t.asMarkdown} description={t.asMarkdownHint} onClick={() => void save('markdown')} />
          ) : (
            canSaveFolder() && <ListRow icon={<IconFolder size={20} />} title={t.asFolder} description={t.asFolderHint} onClick={() => void save('markdown')} />
          )}
          <ListRow icon={<IconLayers size={20} />} title={t.asBundle} description={t.asBundleHint} onClick={() => void save('bundle')} />
        </div>
      )}
      {!one && !canSaveFolder() && <FormHint>{t.folderUnavailable}</FormHint>}
    </ModalForm>
  );
};
