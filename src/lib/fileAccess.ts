/**
 * Opening and saving files from the app. Where the File System Access API exists (Chromium,
 * including the desktop app's WebView2) the system's own Open, Save and folder dialogs are
 * used; elsewhere a file input and a download stand in. No folder can be saved without it.
 */

/** What a save dialog offers to save as. */
export interface FileType {
  description: string;
  mime: string;
  /** One extension the dialog filters by, like ".md". */
  extension: string;
}

// The parts of the File System Access API used here (not yet in TypeScript's DOM library).
interface WritableFile {
  write(data: string): Promise<void>;
  close(): Promise<void>;
}
interface FileHandle {
  kind: 'file';
  name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<WritableFile>;
}
interface DirectoryHandle {
  kind: 'directory';
  name: string;
  values(): AsyncIterable<FileHandle | DirectoryHandle>;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<DirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileHandle>;
}
interface PickerWindow {
  showSaveFilePicker?: (options: {
    suggestedName?: string;
    types?: { description: string; accept: Record<string, string[]> }[];
  }) => Promise<FileHandle>;
  showOpenFilePicker?: (options: {
    multiple?: boolean;
    types?: { description: string; accept: Record<string, string[]> }[];
  }) => Promise<FileHandle[]>;
  showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<DirectoryHandle>;
}
// The older entries API, for folders dropped on the page.
interface DropEntry {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  file?: (ok: (file: File) => void, fail: (err: unknown) => void) => void;
  createReader?: () => { readEntries: (ok: (entries: DropEntry[]) => void, fail: (err: unknown) => void) => void };
}

const pickers = () => window as unknown as PickerWindow;

/** True when the person closed a picker or dialog without choosing. */
export const isCancel = (err: unknown) => err instanceof DOMException && err.name === 'AbortError';

/** Folders nested deeper than this aren't looked into. */
const MAX_DEPTH = 8;
/** Folders named like this hold an app's settings (`.obsidian`, `.git`), not notes. */
const isHidden = (name: string) => name.startsWith('.');

/** Saves text as a file where the person chooses; false if they cancel. Without a Save dialog it downloads. */
export async function saveTextFile(name: string, text: string, type: FileType): Promise<boolean> {
  const { showSaveFilePicker } = pickers();
  if (showSaveFilePicker) {
    try {
      const handle = await showSaveFilePicker({
        suggestedName: name,
        types: [{ description: type.description, accept: { [type.mime]: [type.extension] } }]
      });
      const out = await handle.createWritable();
      await out.write(text);
      await out.close();
      return true;
    } catch (err) {
      if (isCancel(err)) return false;
      throw err;
    }
  }
  const url = URL.createObjectURL(new Blob([text], { type: `${type.mime};charset=utf-8` }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

/** Whether a whole folder can be saved here. */
export const canSaveFolder = () => typeof pickers().showDirectoryPicker === 'function';

async function exists(dir: DirectoryHandle, name: string): Promise<boolean> {
  try {
    await dir.getDirectoryHandle(name);
    return true;
  } catch (err) {
    // A file by that name counts as taken too.
    return err instanceof DOMException && err.name === 'TypeMismatchError';
  }
}

/**
 * Asks for a folder, then saves `files` in a new folder inside it named `folderName` (or
 * `folderName (2)`… when that's taken), so nothing there is ever replaced. Returns the name
 * it used, or null if the person cancels.
 */
export async function saveFolder(folderName: string, files: { name: string; text: string }[]): Promise<string | null> {
  const { showDirectoryPicker } = pickers();
  if (!showDirectoryPicker) throw new Error('Saving a folder needs the File System Access API.');
  let parent: DirectoryHandle;
  try {
    parent = await showDirectoryPicker({ mode: 'readwrite' });
  } catch (err) {
    if (isCancel(err)) return null;
    throw err;
  }
  let name = folderName;
  for (let n = 2; await exists(parent, name); n++) name = `${folderName} (${n})`;
  const dir = await parent.getDirectoryHandle(name, { create: true });
  for (const file of files) {
    const out = await (await dir.getFileHandle(file.name, { create: true })).createWritable();
    await out.write(file.text);
    await out.close();
  }
  return name;
}

/** Files found in a folder and the folders inside it, keeping those `keep` accepts. */
async function walkHandle(dir: DirectoryHandle, keep: (name: string) => boolean, depth = 0): Promise<File[]> {
  const files: File[] = [];
  for await (const entry of dir.values()) {
    if (isHidden(entry.name)) continue;
    if (entry.kind === 'file') {
      if (keep(entry.name)) files.push(await entry.getFile());
    } else if (depth < MAX_DEPTH) {
      files.push(...(await walkHandle(entry, keep, depth + 1)));
    }
  }
  return files;
}

/** A hidden file input, for browsers without the pickers. Resolves with nothing when it's cancelled. */
function inputPick(configure: (input: HTMLInputElement) => void): Promise<File[]> {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    configure(input);
    input.addEventListener('change', () => resolve([...(input.files ?? [])]), { once: true });
    input.addEventListener('cancel', () => resolve([]), { once: true });
    input.click();
  });
}

/** Files an Open dialog offers first: a description, and the extensions for each media type. */
export interface OpenType {
  description: string;
  accept: Record<string, string[]>;
}

/** Asks for one or more files; an empty list if the person cancels. */
export async function pickFiles(type: OpenType): Promise<File[]> {
  const { showOpenFilePicker } = pickers();
  if (showOpenFilePicker) {
    try {
      const handles = await showOpenFilePicker({ multiple: true, types: [type] });
      return Promise.all(handles.map(h => h.getFile()));
    } catch (err) {
      if (isCancel(err)) return [];
      throw err;
    }
  }
  return inputPick(input => {
    input.multiple = true;
    input.accept = Object.values(type.accept).flat().join(',');
  });
}

export interface PickedFolder {
  name: string;
  files: File[];
}

/** Asks for a folder and returns the files in it, and in the folders inside it, that `keep` accepts; null if cancelled. */
export async function pickFolder(keep: (name: string) => boolean): Promise<PickedFolder | null> {
  const { showDirectoryPicker } = pickers();
  if (showDirectoryPicker) {
    try {
      const dir = await showDirectoryPicker({ mode: 'read' });
      return { name: dir.name, files: await walkHandle(dir, keep) };
    } catch (err) {
      if (isCancel(err)) return null;
      throw err;
    }
  }
  const files = await inputPick(input => {
    input.webkitdirectory = true;
  });
  if (files.length === 0) return null;
  const inside = files.filter(f => !f.webkitRelativePath.split('/').slice(0, -1).some(isHidden) && keep(f.name));
  return { name: files[0].webkitRelativePath.split('/')[0] ?? '', files: inside };
}

const entryFile = (entry: DropEntry) => new Promise<File>((ok, fail) => entry.file!(ok, fail));

async function walkEntry(entry: DropEntry, keep: (name: string) => boolean, depth: number): Promise<File[]> {
  if (entry.isFile) return keep(entry.name) ? [await entryFile(entry)] : [];
  if (!entry.isDirectory || depth > MAX_DEPTH || isHidden(entry.name)) return [];
  const reader = entry.createReader!();
  const files: File[] = [];
  // readEntries hands them over a batch at a time, until an empty one.
  for (;;) {
    const batch = await new Promise<DropEntry[]>((ok, fail) => reader.readEntries(ok, fail));
    if (batch.length === 0) return files;
    for (const child of batch) files.push(...(await walkEntry(child, keep, depth + 1)));
  }
}

export interface DroppedFiles {
  files: File[];
  /** The folder's name, when exactly one folder was dropped. */
  folder?: string;
}

/**
 * The files dropped on the page, looking inside dropped folders (where only the files `keep`
 * accepts are taken). Files dropped on their own are all returned, so the import can say
 * which it left out.
 */
export async function droppedFiles(data: DataTransfer, keep: (name: string) => boolean): Promise<DroppedFiles> {
  const entries = [...data.items].flatMap(item => {
    const entry = (item as DataTransferItem & { webkitGetAsEntry?: () => DropEntry | null }).webkitGetAsEntry?.();
    return entry ? [entry] : [];
  });
  if (entries.length === 0) return { files: [...data.files] };
  const files: File[] = [];
  for (const entry of entries) files.push(...(await walkEntry(entry, entry.isFile ? () => true : keep, 0)));
  const folders = entries.filter(e => e.isDirectory);
  return { files, folder: folders.length === 1 && entries.length === 1 ? folders[0].name : undefined };
}

/** Whether a drag carries files from outside the page (not a note or row being dragged). */
export const dragHasFiles = (data: DataTransfer | null) => !!data && [...data.types].includes('Files');
