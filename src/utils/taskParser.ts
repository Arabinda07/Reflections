import { Task } from '../types';

/**
 * Extracts task items from note content.
 * Looks for patterns like [ ] Task name or [x] Task name.
 * @param htmlContent The raw HTML content from the editor.
 * @returns Array of Task objects.
 */
export const extractTasksFromContent = (htmlContent: string): Task[] => {
  // Strip HTML tags to get plain text
  const plainText = htmlContent.replace(/<[^>]*>/g, ' ');
  
  // Regex to find [ ] or [x] followed by text until the end of the line or next marker
  const taskRegex = /\[([ xX]?)\]\s*([^[\n\r]+)/g;
  const tasks: Task[] = [];
  let match;

  while ((match = taskRegex.exec(plainText)) !== null) {
    const isCompleted = match[1].toLowerCase() === 'x';
    const text = match[2].trim();
    
    if (text) {
      tasks.push({
        id: crypto.randomUUID(),
        text,
        completed: isCompleted,
      });
    }
  }

  return tasks;
};

/**
 * Merges newly extracted tasks with existing tasks to preserve IDs if possible.
 * This prevents tasks from jumping around or losing their identity when editing.
 */
export const mergeTasks = (existingTasks: Task[], newTasks: Task[]): Task[] => {
  // If we wanted to be very smart, we could do fuzzy matching on text.
  // For now, we'll just return the new ones as the "source of truth" from the prose.
  // But we can check if a task with the same text already exists and keep its ID.
  
  return newTasks.map(newTask => {
    const existing = existingTasks.find(et => et.text === newTask.text);
    if (existing) {
      return { ...existing, completed: newTask.completed };
    }
    return newTask;
  });
};
