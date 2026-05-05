import { noteService } from './noteService';
import { storageService } from './storageService';
import { aiService } from './aiService';
import { ritualEventService } from './ritualService';
import { observationService } from './observationService';
import { extractTasksFromContent, mergeTasks } from '../src/utils/taskParser';
import { trackNoteSavedDeferred } from '../src/analytics/deferredEvents';
import { supabase } from '../src/supabaseClient';
import type { Note, NoteAttachment, Task } from '../types';

export interface NotePublishInput {
  id?: string;
  title: string;
  content: string;
  mood?: string;
  tags: string[];
  tasks: Task[];
  imagePreview: string | null;
  existingAttachments: NoteAttachment[];
  newAttachments: File[];
  smartModeEnabled: boolean;
}

export interface NotePublishResult {
  savedNote: Note;
  mergedAttachments: NoteAttachment[];
  finalThumbnailUrl: string | null;
  observation: { text: string } | null;
  syncedTasks: Task[];
}

export const notePublishingOrchestrator = {
  publishDraft: async (input: NotePublishInput): Promise<NotePublishResult> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthenticated');

    let noteId = input.id;
    const saveMode = noteId ? 'edit' : 'new';

    // Auto-extract tasks from content
    const extractedTasks = extractTasksFromContent(input.content);
    const syncedTasks = mergeTasks(input.tasks, extractedTasks);

    if (!noteId) {
      const newNote = await noteService.create({
        title: input.title,
        content: input.content,
        tags: input.tags,
        mood: input.mood,
        tasks: syncedTasks,
      });
      noteId = newNote.id;
    }

    const uploadedAttachments = await Promise.all(
      input.newAttachments.map(async (file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        path: await storageService.uploadFile(file, user.id, 'notes', noteId!),
        size: file.size,
        type: file.type,
      })),
    );
    const mergedAttachments = [...input.existingAttachments, ...uploadedAttachments];

    let finalThumbnailUrl = input.imagePreview;
    if (input.imagePreview?.startsWith('blob:')) {
      const response = await fetch(input.imagePreview);
      const blob = await response.blob();
      const file = new File([blob], 'cover.jpg', { type: blob.type });
      finalThumbnailUrl = await storageService.uploadFile(file, user.id, 'notes', noteId!);
    }

    const savedNote = await noteService.update(noteId!, {
      title: input.title,
      content: input.content,
      mood: input.mood,
      tags: input.tags,
      tasks: syncedTasks,
      thumbnailUrl: finalThumbnailUrl || undefined,
      attachments: mergedAttachments,
    });

    trackNoteSavedDeferred({
      mode: saveMode,
      attachmentCount: mergedAttachments.length,
      tagCount: input.tags.length,
      taskCount: syncedTasks.length,
    });

    // Smart mode auto-ingest (fire-and-forget)
    if (input.smartModeEnabled) {
      noteService
        .getAll()
        .then((allNotes) => aiService.autoIngestSavedNote(savedNote, allNotes))
        .catch((error) => {
          console.error('[NotePublishingOrchestrator] Smart Mode auto-ingest failed:', error);
        });
    }

    // Observation check
    const [totalCount, recentNotes] = await Promise.all([
      noteService.getCount(),
      noteService.getRecent(10),
    ]).catch(() => [0, []] as [number, Note[]]);

    const observation = observationService.checkMilestones(
      { title: input.title, content: input.content, createdAt: new Date().toISOString() } as Note,
      totalCount as number,
      recentNotes as Note[],
    );

    if (observation) {
      observationService.markObservationShown();
    }

    return {
      savedNote,
      mergedAttachments,
      finalThumbnailUrl,
      observation: observation ? { text: observation.text } : null,
      syncedTasks,
    };
  },
};
