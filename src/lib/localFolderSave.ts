/**
 * File System Access API helper.
 *
 * Browsers that don't support `showDirectoryPicker` (Firefox, Safari) will
 * have `isLocalFolderSaveSupported()` return false. Callers should fall back
 * to the ZIP download flow.
 */

type FileSystemDirectoryHandleLike = {
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<FileSystemFileHandleLike>;
  getDirectoryHandle: (name: string, options?: { create?: boolean }) => Promise<FileSystemDirectoryHandleLike>;
};

type FileSystemFileHandleLike = {
  createWritable: () => Promise<FileSystemWritableFileStreamLike>;
};

type FileSystemWritableFileStreamLike = {
  write: (data: Blob | BufferSource | string) => Promise<void>;
  close: () => Promise<void>;
};

interface WindowWithDirectoryPicker extends Window {
  showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandleLike>;
}

export function isLocalFolderSaveSupported(): boolean {
  return typeof window !== 'undefined' && typeof (window as WindowWithDirectoryPicker).showDirectoryPicker === 'function';
}

export async function pickDirectory(): Promise<FileSystemDirectoryHandleLike | null> {
  const w = window as WindowWithDirectoryPicker;
  if (!w.showDirectoryPicker) return null;
  try {
    return await w.showDirectoryPicker({ mode: 'readwrite' });
  } catch {
    return null;
  }
}

export async function getOrCreateSubfolder(
  parent: FileSystemDirectoryHandleLike,
  name: string
): Promise<FileSystemDirectoryHandleLike> {
  return parent.getDirectoryHandle(name, { create: true });
}

export async function writeFileToDirectory(
  directory: FileSystemDirectoryHandleLike,
  filename: string,
  data: Blob
): Promise<void> {
  const fileHandle = await directory.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(data);
  await writable.close();
}
