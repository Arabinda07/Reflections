import { Note } from '../types';

export interface Observation {
  id: string;
  text: string;
  triggered: boolean;
}

const STORAGE_KEY = 'reflections_last_observation';
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

export const observationService = {
  shouldShowObservation: (): boolean => {
    const lastObs = localStorage.getItem(STORAGE_KEY);
    if (!lastObs) return true;

    const lastDate = new Date(parseInt(lastObs));
    const now = new Date();

    return (now.getTime() - lastDate.getTime()) > WEEK_IN_MS;
  },

  markObservationShown: () => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  },

  checkMilestones: (currentNote: Note, totalCount: number, recentNotes: Note[]): Observation | null => {
    if (!observationService.shouldShowObservation()) return null;

    const now = new Date();
    const hour = now.getHours();
    const wordCount = currentNote.content.split(/\s+/).length;

    // Quiet Moment (Late night / Early morning)
    if (hour >= 23 || hour < 5) {
      return {
        id: 'quiet_moment',
        text: "late night reflections. the world is quiet.",
        triggered: true
      };
    }

    // Long Entry (Word count)
    if (wordCount > 300) {
      return {
        id: 'long_entry',
        text: "there was a lot here today.",
        triggered: true
      };
    }

    const hasEarlierNote = recentNotes.some((note) => note.id !== currentNote.id);

    if (hasEarlierNote && totalCount > 1) {
      return {
        id: 'returning',
        text: "the page is still here when you return.",
        triggered: true
      };
    }

    return null;
  }
};
