import { describe, expect, it, vi, beforeEach } from 'vitest';
import { unzipSync, strFromU8 } from 'fflate';
import { journalBackupService } from './journalBackupService';
import { noteService } from './noteService';
import { nativeShareExport } from '../src/native/nativeShareExport';
import type { Note } from '../types';

const sampleNotes: Note[] = [
  {
    id: 'note-alpha',
    title: 'First Morning Reflection',
    content: '<p>A peaceful morning with green tea.</p>',
    createdAt: '2026-05-01T08:00:00.000Z',
    updatedAt: '2026-05-01T08:30:00.000Z',
    mood: 'peaceful',
    tags: ['morning', 'tea'],
  },
  {
    id: 'note-beta',
    title: 'Evening Walk Thoughts',
    content: '<p>Watching the sunset over the quiet trees.</p>',
    createdAt: '2026-05-02T19:00:00.000Z',
    updatedAt: '2026-05-02T19:15:00.000Z',
    mood: 'calm',
  },
];

describe('journalBackupService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('exports formatted JSON journal backup to share sheet / download', async () => {
    vi.spyOn(noteService, 'getAll').mockResolvedValue(sampleNotes);
    let capturedOptions: Parameters<typeof nativeShareExport.exportFile>[0] | null = null;
    vi.spyOn(nativeShareExport, 'exportFile').mockImplementation(async (opts) => {
      capturedOptions = opts;
      return { success: true };
    });

    const result = await journalBackupService.exportEncryptedJsonBackup();
    expect(result.success).toBe(true);
    expect(result.notesCount).toBe(2);

    expect(capturedOptions).not.toBeNull();
    expect(capturedOptions!.filename).toMatch(/^reflections-backup-\d{4}-\d{2}-\d{2}\.json$/);
    expect(capturedOptions!.mimeType).toBe('application/json');

    const parsed = JSON.parse(capturedOptions!.data as string);
    expect(parsed.version).toBe(1);
    expect(parsed.notesCount).toBe(2);
    expect(parsed.notes[0].title).toBe('First Morning Reflection');
    expect(parsed.notes[1].title).toBe('Evening Walk Thoughts');
  });

  it('packages notes and manifest into a valid ZIP archive', async () => {
    vi.spyOn(noteService, 'getAll').mockResolvedValue(sampleNotes);
    let capturedOptions: Parameters<typeof nativeShareExport.exportFile>[0] | null = null;
    vi.spyOn(nativeShareExport, 'exportFile').mockImplementation(async (opts) => {
      capturedOptions = opts;
      return { success: true };
    });

    const result = await journalBackupService.exportZipArchive();
    expect(result.success).toBe(true);
    expect(result.notesCount).toBe(2);

    expect(capturedOptions).not.toBeNull();
    expect(capturedOptions!.filename).toMatch(/^reflections-journal-\d{4}-\d{2}-\d{2}\.zip$/);
    expect(capturedOptions!.mimeType).toBe('application/zip');
    expect(capturedOptions!.data).toBeInstanceOf(Uint8Array);

    // Unpack ZIP to verify entries
    const unzipped = unzipSync(capturedOptions!.data as Uint8Array);
    const filenames = Object.keys(unzipped);

    expect(filenames).toContain('manifest.json');
    expect(filenames).toContain('data/reflections-raw.json');

    // Check notes/*.md exist
    const noteFiles = filenames.filter((f) => f.startsWith('notes/') && f.endsWith('.md'));
    expect(noteFiles.length).toBe(2);

    // Verify manifest contents
    const manifestJson = strFromU8(unzipped['manifest.json']);
    const manifest = JSON.parse(manifestJson);
    expect(manifest.notesCount).toBe(2);
    expect(manifest.notes[0].id).toBe('note-alpha');
  });
});
