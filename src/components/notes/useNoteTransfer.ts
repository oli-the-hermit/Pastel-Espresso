import { useApp } from '../../context/AppContext';
import { useNotes } from '../../context/NotesContext';
import { strings } from '../../constants/strings';
import { LIMITS } from '../../constants/limits';
import { ApiError } from '../../lib/api';
import { pickFiles, pickFolder, saveFolder, saveTextFile } from '../../lib/fileAccess';
import { formatFullDate } from '../../lib/formatUtils';
import { format, plural } from '../../lib/i18n';
import {
  BUNDLE_EXTENSION,
  IMPORT_ACCEPT,
  MARKDOWN_EXTENSION,
  buildBundle,
  bundleText,
  isImportable,
  markdownFileNames,
  planImport,
  readImportFiles,
  safeFileName,
  toMarkdownFile,
  type ExportNote,
  type ImportPlan
} from '../../lib/noteFiles';
import type { Note } from '../../lib/notes';

export type ExportFormat = 'markdown' | 'bundle';

/** Bodies read at once for an export. */
const READ_AT_ONCE = 4;

/**
 * Notes in and out of files. An import is read into a plan first, so the person sees what
 * will be created before it is; an export saves a copy and leaves the notes as they are.
 */
export function useNoteTransfer() {
  const { notes, unreadable, collections, labels, readNote, importNotes, createCollection, createLabel, removeEmptyCollections } = useNotes();
  const { showToast } = useApp();
  const t = strings.notes.transfer;
  const toasts = strings.notes.toasts;
  const untitled = strings.notes.untitled;

  /** How many more notes the profile can hold (the Trash counts until it's emptied). */
  const room = Math.max(0, LIMITS.documents.maxPerProfile - notes.length - unreadable);

  /** Reads files into an import plan; null, after saying so, when they can't be read. */
  const plan = async (files: File[], folder?: string): Promise<ImportPlan | null> => {
    try {
      return planImport(await readImportFiles(files), {
        looseName: folder?.trim() || format(t.looseName, { date: formatFullDate(Date.now()) }),
        existingCollections: collections.map(c => c.name)
      });
    } catch {
      showToast(toasts.readFailed, 'error');
      return null;
    }
  };

  /** Asks for files, then reads them; null if nothing was picked. */
  const fromFiles = async (): Promise<ImportPlan | null> => {
    try {
      const files = await pickFiles({ description: t.fileTypes.notes, accept: IMPORT_ACCEPT });
      return files.length > 0 ? plan(files) : null;
    } catch {
      showToast(toasts.readFailed, 'error');
      return null;
    }
  };

  /** Asks for a folder, then reads the Markdown and bundles inside it; null if none was picked. */
  const fromFolder = async (): Promise<ImportPlan | null> => {
    try {
      const picked = await pickFolder(isImportable);
      return picked ? plan(picked.files, picked.name) : null;
    } catch {
      showToast(toasts.readFailed, 'error');
      return null;
    }
  };

  /**
   * Creates the plan's collections (with the names given, by group key), any labels not
   * there yet, then the notes. Returns the first new collection, to show it; null if
   * nothing came in.
   */
  const runImport = async (p: ImportPlan, names: Record<string, string>): Promise<string | null> => {
    const placeName = (key: string, fallback: string) => names[key]?.trim() || fallback;
    const collectionIds = new Map(p.groups.map(g => [g.key, createCollection(placeName(g.key, g.name))]));
    const labelIds = new Map(labels.map(l => [l.name.trim().toLowerCase(), l.id]));
    const labelId = (name: string) => {
      const key = name.toLowerCase();
      let id = labelIds.get(key);
      if (!id) {
        id = createLabel(name);
        labelIds.set(key, id);
      }
      return id;
    };
    const items = p.notes.map(n => ({
      body: n.body,
      meta: {
        title: n.title,
        collectionId: collectionIds.get(n.group) ?? null,
        labelIds: n.labels.map(labelId),
        createdAt: n.createdAt,
        editedAt: n.editedAt
      }
    }));

    try {
      await importNotes(items);
    } catch (err) {
      const kept = removeEmptyCollections([...collectionIds.values()]);
      showToast(err instanceof ApiError && err.code ? err.message : kept.length > 0 ? toasts.importStopped : toasts.importFailed, 'error');
      return kept[0] ?? null;
    }

    const [first] = p.groups;
    showToast(
      p.groups.length === 1
        ? plural(p.notes.length, toasts.imported, { place: placeName(first.key, first.name) })
        : format(toasts.importedMany, { count: p.notes.length, collections: p.groups.length }),
      'success'
    );
    return collectionIds.get(first.key) ?? null;
  };

  /** The notes to export, in the order given, with their text and their labels' names. Trashed notes are left out. */
  const gather = async (ids: string[]): Promise<ExportNote[]> => {
    const chosen = ids.flatMap(id => notes.filter((n): n is Note => n.id === id && n.trashedAt === null));
    const labelName = new Map(labels.map(l => [l.id, l.name]));
    const bodies: string[] = [];
    let next = 0;
    await Promise.all(
      Array.from({ length: Math.min(READ_AT_ONCE, chosen.length) }, async () => {
        while (next < chosen.length) {
          const i = next++;
          bodies[i] = await readNote(chosen[i].id);
        }
      })
    );
    return chosen.map((n, i) => ({
      id: n.id,
      title: n.title,
      collectionId: n.collectionId,
      labels: n.labelIds.flatMap(l => labelName.get(l) ?? []),
      createdAt: n.createdAt,
      editedAt: n.editedAt,
      body: bodies[i]
    }));
  };

  /**
   * Saves a copy of the notes: one note as a Markdown file, several as a folder of them, or
   * any number as a bundle named `title`. False if nothing was saved (cancelled or failed).
   */
  const exportNotes = async (ids: string[], as: ExportFormat, title?: string): Promise<boolean> => {
    try {
      const list = await gather(ids);
      if (list.length === 0) return false;
      const name = title?.trim() || (list.length === 1 ? list[0].title.trim() : '') || format(t.bundleTitle, { date: formatFullDate(Date.now()) });

      if (as === 'bundle') {
        const saved = await saveTextFile(`${safeFileName(name, untitled)}${BUNDLE_EXTENSION}`, bundleText(buildBundle(name, list, collections)), {
          description: t.fileTypes.bundle,
          mime: 'application/json',
          extension: '.json'
        });
        if (saved) showToast(plural(list.length, toasts.exported), 'success');
        return saved;
      }

      const fileNames = markdownFileNames(list.map(n => n.title), untitled);
      const files = list.map((n, i) => ({ name: fileNames[i], text: toMarkdownFile(n, fileNames[i].slice(0, -MARKDOWN_EXTENSION.length)) }));
      if (files.length === 1) {
        const saved = await saveTextFile(files[0].name, files[0].text, { description: t.fileTypes.markdown, mime: 'text/markdown', extension: MARKDOWN_EXTENSION });
        if (saved) showToast(plural(1, toasts.exported), 'success');
        return saved;
      }
      const folder = await saveFolder(safeFileName(name, untitled), files);
      if (folder !== null) showToast(plural(files.length, toasts.exportedFolder, { folder }), 'success');
      return folder !== null;
    } catch {
      showToast(toasts.exportFailed, 'error');
      return false;
    }
  };

  return { room, plan, fromFiles, fromFolder, runImport, exportNotes };
}
