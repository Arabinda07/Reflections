import type { NoteAttachment, Task } from '../../types';

export const CREATE_NOTE_SAVE_VISUAL_FLOOR_MS = 0;
export const CREATE_NOTE_UNSUPPORTED_WHISPER_MESSAGE =
  "Whisper isn't available in this browser yet. You can keep writing normally or try Chrome on Android.";

export interface CreateNoteDraftSnapshot {
  title: string;
  content: string;
  mood: string;
  tags: string[];
  tasks: Array<{
    text: string;
    completed: boolean;
    dueDate: string;
  }>;
  imagePreview: string;
  existingAttachmentIds: string[];
  newAttachmentNames: string[];
}

interface CreateNoteDraftInput {
  title: string;
  content: string;
  mood?: string;
  tags: string[];
  tasks: Task[];
  imagePreview: string | null;
  existingAttachments: NoteAttachment[];
  newAttachments: File[];
}

const EMPTY_EDITOR_PATTERNS = new Set(['', '<p><br></p>', '<p></p>', '<div><br></div>']);

const normalizeEditorContent = (content: string) => {
  const trimmed = content.trim();
  return EMPTY_EDITOR_PATTERNS.has(trimmed) ? '' : trimmed;
};

export const buildCreateNoteDraftSnapshot = ({
  title,
  content,
  mood,
  tags,
  tasks,
  imagePreview,
  existingAttachments,
  newAttachments,
}: CreateNoteDraftInput): CreateNoteDraftSnapshot => ({
  title: title.trim(),
  content: normalizeEditorContent(content),
  mood: mood ?? '',
  tags: tags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right)),
  tasks: tasks.map((task) => ({
    text: task.text.trim(),
    completed: task.completed,
    dueDate: task.dueDate?.trim() ?? '',
  })),
  imagePreview: imagePreview ?? '',
  existingAttachmentIds: existingAttachments
    .map((attachment) => attachment.id || attachment.path)
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right)),
  newAttachmentNames: newAttachments
    .map((file) => file.name.trim())
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right)),
});

export const hasUnsavedCreateNoteChanges = (
  currentDraftSnapshot: CreateNoteDraftSnapshot,
  baselineDraftSnapshot: CreateNoteDraftSnapshot,
) => JSON.stringify(currentDraftSnapshot) !== JSON.stringify(baselineDraftSnapshot);
