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

    // 1. Full Circle (Total count milestones)
    if ([10, 25, 50, 100].includes(totalCount)) {
      return { 
        id: 'milestone', 
        text: `${totalCount} entries. a journey beginning.`, 
        triggered: true 
      };
    }

    // 2. Quiet Moment (Late night / Early morning)
    if (hour >= 23 || hour < 5) {
      return { 
        id: 'quiet_moment', 
        text: "late night reflections. the world is quiet.", 
        triggered: true 
      };
    }

    // 3. Deep Thought (Word count)
    if (wordCount > 300) {
      return { 
        id: 'deep_thought', 
        text: "a lot on your mind today. glad you shared it.", 
        triggered: true 
      };
    }

    // 4. Rhythm (Consistency: 3 notes in 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCount = recentNotes.filter(n => new Date(n.createdAt) > sevenDaysAgo).length;
    
    if (recentCount >= 3) {
      return { 
        id: 'rhythm', 
        text: "finding your rhythm. three entries this week.", 
        triggered: true 
      };
    }

    return null;
  }
};
