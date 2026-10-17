/**
 * Notes' collections and labels, which live in the profile data. Deleting one goes through
 * useNotes() (context/NotesContext), which first updates the notes that use it.
 */
import type { ActionDeps } from './types';
import { uid } from '../../lib/id';

export function createNoteActions({ setState }: Pick<ActionDeps, 'setState'>) {
  const createNoteCollection = (name: string): string => {
    const id = uid();
    setState(prev => ({ ...prev, noteCollections: [...prev.noteCollections, { id, name: name.trim(), createdAt: Date.now() }] }));
    return id;
  };

  const renameNoteCollection = (id: string, name: string) => {
    setState(prev => ({ ...prev, noteCollections: prev.noteCollections.map(c => (c.id === id ? { ...c, name: name.trim() } : c)) }));
  };

  const removeNoteCollection = (id: string) => {
    setState(prev => ({ ...prev, noteCollections: prev.noteCollections.filter(c => c.id !== id) }));
  };

  const createNoteLabel = (name: string): string => {
    const id = uid();
    setState(prev => ({ ...prev, noteLabels: [...prev.noteLabels, { id, name: name.trim() }] }));
    return id;
  };

  const renameNoteLabel = (id: string, name: string) => {
    setState(prev => ({ ...prev, noteLabels: prev.noteLabels.map(l => (l.id === id ? { ...l, name: name.trim() } : l)) }));
  };

  const removeNoteLabel = (id: string) => {
    setState(prev => ({ ...prev, noteLabels: prev.noteLabels.filter(l => l.id !== id) }));
  };

  return { createNoteCollection, renameNoteCollection, removeNoteCollection, createNoteLabel, renameNoteLabel, removeNoteLabel };
}
