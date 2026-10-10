import { zipSync, strToU8 } from 'fflate';
import { noteService } from './noteService';
import { nativeShareExport } from '../src/native/nativeShareExport';
import { buildNoteExportText, getNoteExportFilename } from '../pages/dashboard/noteExport';
import type { Note } from '../types';

export interface JournalBackupManifest {
  version: number;
  exportedAt: string;
  notesCount: number;
  notes: Array<{
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    mood?: string;
    tags?: string[];
  }>;
}

const getTodayDateStamp = () => new Date().toISOString().slice(0, 10);

export const journalBackupService = {
  async exportEncryptedJsonBackup(): Promise<{ success: boolean; notesCount: number }> {
    const notes = await noteService.getAll();
    const dateStamp = getTodayDateStamp();

    const payload = {
      version: 1,
      format: 'reflections-journal-backup',
      exportedAt: new Date().toISOString(),
      notesCount: notes.length,
      notes,
    };

    const jsonString = JSON.stringify(payload, null, 2);
    const filename = `reflections-backup-${dateStamp}.json`;

    const result = await nativeShareExport.exportFile({
      filename,
      data: jsonString,
      mimeType: 'application/json',
      title: 'Reflections Journal Backup',
      dialogTitle: 'Save or Share Journal Backup',
    });

    return { success: result.success, notesCount: notes.length };
  },

  async exportZipArchive(): Promise<{ success: boolean; notesCount: number }> {
    const notes: Note[] = await noteService.getAll();
    const dateStamp = getTodayDateStamp();

    const manifest: JournalBackupManifest = {
      version: 1,
      exportedAt: new Date().toISOString(),
      notesCount: notes.length,
      notes: notes.map((n) => ({
        id: n.id,
        title: n.title,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
        mood: n.mood,
        tags: n.tags,
      })),
    };

    const zipFiles: Record<string, Uint8Array> = {};

    // 1. Add each note as human-readable Markdown
    const usedFilenames = new Set<string>();
    for (const note of notes) {
      let noteFilename = getNoteExportFilename(note, 'md');
      if (usedFilenames.has(noteFilename)) {
        noteFilename = `${note.id}-${noteFilename}`;
      }
      usedFilenames.add(noteFilename);

      const markdownContent = buildNoteExportText(note, 'md');
      zipFiles[`notes/${noteFilename}`] = strToU8(markdownContent);
    }

    // 2. Add manifest.json and backup.json
    zipFiles['manifest.json'] = strToU8(JSON.stringify(manifest, null, 2));
    zipFiles['data/reflections-raw.json'] = strToU8(JSON.stringify(notes, null, 2));

    const zipBytes = zipSync(zipFiles);
    const filename = `reflections-journal-${dateStamp}.zip`;

    const result = await nativeShareExport.exportFile({
      filename,
      data: zipBytes,
      mimeType: 'application/zip',
      title: 'Reflections Journal Archive',
      dialogTitle: 'Save or Share Journal Archive',
    });

    return { success: result.success, notesCount: notes.length };
  },
};
