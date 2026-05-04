import type { Note, Task } from '../../types';

export const HOME_INTENTION_VISIBLE_LIMIT = 5;

export interface HomeIntention {
  id: string;
  text: string;
  noteId: string;
  noteTitle: string;
  completed: boolean;
}

export interface HomeIntentionSummary {
  items: HomeIntention[];
  completedItems: HomeIntention[];
  openCount: number;
  completedCount: number;
  hiddenCount: number;
  hasAnyTasks: boolean;
}

const getNoteTimestamp = (note: Note) => {
  const timestamp = Date.parse(note.updatedAt);
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const MAX_ACTIVE_INTENTIONS = 3;

export function buildHomeIntentionSummary(
  notes: Note[],
  visibleLimit = HOME_INTENTION_VISIBLE_LIMIT,
): HomeIntentionSummary {
  const orderedNotes = notes
    .map((note, index) => ({ note, index }))
    .sort((a, b) => getNoteTimestamp(b.note) - getNoteTimestamp(a.note) || a.index - b.index);

  const openIntentions: HomeIntention[] = [];
  const completedIntentions: HomeIntention[] = [];

  for (const { note } of orderedNotes) {
    const noteTitle = note.title.trim() || 'Untitled reflection';

    for (const task of note.tasks || []) {
      const text = task.text.trim();
      if (!text) continue;

      const intention: HomeIntention = {
        id: task.id,
        text,
        noteId: note.id,
        noteTitle,
        completed: task.completed,
      };

      if (task.completed) {
        completedIntentions.push(intention);
      } else {
        openIntentions.push(intention);
      }
    }
  }

  return {
    items: openIntentions.slice(0, visibleLimit),
    completedItems: completedIntentions.slice(0, 3),
    openCount: openIntentions.length,
    completedCount: completedIntentions.length,
    hiddenCount: Math.max(0, openIntentions.length - visibleLimit),
    hasAnyTasks: openIntentions.length + completedIntentions.length > 0,
  };
}

export function getHomeIntentionToggleUpdate(
  note: Note,
  taskId: string,
): Pick<Note, 'tasks' | 'content'> | null {
  const currentTasks = note.tasks || [];
  const taskToToggle = currentTasks.find((task) => task.id === taskId);
  if (!taskToToggle) return null;

  const nextCompleted = !taskToToggle.completed;
  const tasks: Task[] = currentTasks.map((task) =>
    task.id === taskId ? { ...task, completed: nextCompleted } : task,
  );

  const taskText = taskToToggle.text.trim();
  if (!taskText) {
    return { tasks, content: note.content };
  }

  const oldMarker = taskToToggle.completed ? '[xX]' : ' ';
  const newMarker = nextCompleted ? '[x]' : '[ ]';
  const markerPattern = new RegExp(`\\[${oldMarker}\\]\\s*${escapeRegExp(taskText)}`);
  const content = note.content.replace(markerPattern, `${newMarker} ${taskText}`);

  return { tasks, content };
}
