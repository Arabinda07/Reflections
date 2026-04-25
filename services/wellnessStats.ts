import type { MonthlyWellnessSummary, Note } from '../types';
import { getMonthRange } from './wellnessPolicy';

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function countBy(values: string[]) {
  return values.reduce<Record<string, number>>((acc, value) => {
    if (!value) return acc;
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function topEntries(counts: Record<string, number>, limit: number) {
  return Object.entries(counts)
    .sort(([aKey, aValue], [bKey, bValue]) => bValue - aValue || aKey.localeCompare(bKey))
    .slice(0, limit);
}

function fallbackThemes(notes: Note[]) {
  const ignored = new Set(['about', 'after', 'again', 'also', 'because', 'been', 'from', 'have', 'just', 'that', 'this', 'today', 'with']);
  const words = notes
    .flatMap((note) => stripHtml(`${note.title} ${note.content}`).toLowerCase().match(/[a-z]{4,}/g) || [])
    .filter((word) => !ignored.has(word));

  return topEntries(countBy(words), 4).map(([theme]) => theme);
}

export function buildMonthlyWellnessSummary(notes: Note[], now = new Date()): MonthlyWellnessSummary {
  const { start, end } = getMonthRange(now);
  const monthNotes = notes.filter((note) => {
    const created = new Date(note.createdAt);
    return created >= start && created < end;
  });

  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(start);
  const monthName = new Intl.DateTimeFormat('en', { month: 'long', timeZone: 'UTC' }).format(start);
  const writingDays = new Set(monthNotes.map((note) => note.createdAt.slice(0, 10))).size;
  const moodCounts = countBy(monthNotes.map((note) => note.mood || '').filter(Boolean));
  const topMood = topEntries(moodCounts, 1)[0]?.[0];
  const tagCounts = countBy(monthNotes.flatMap((note) => note.tags || []));
  const topTags = topEntries(tagCounts, 5).map(([tag, count]) => ({ tag, count }));
  const recurringThemes = topTags.length ? topTags.map(({ tag }) => tag).slice(0, 4) : fallbackThemes(monthNotes);

  if (monthNotes.length === 0) {
    return {
      monthLabel,
      noteCount: 0,
      writingDays: 0,
      moodCounts: {},
      topTags: [],
      recurringThemes: [],
      summary: `${monthName} is still open. One honest note is enough to begin.`,
      nextStep: 'Start with one line about what has been taking up space today.',
    };
  }

  const themeCopy = recurringThemes.length
    ? `You kept coming back to ${recurringThemes.slice(0, 3).join(', ')}.`
    : 'A few different thoughts showed up without one clear theme yet.';
  const moodCopy = topMood ? `The mood that appeared most was ${topMood}.` : 'You did not label many moods yet, and that is okay.';

  return {
    monthLabel,
    noteCount: monthNotes.length,
    writingDays,
    topMood,
    moodCounts,
    topTags,
    recurringThemes,
    summary: `${monthLabel} had ${monthNotes.length} ${monthNotes.length === 1 ? 'note' : 'notes'} across ${writingDays} ${writingDays === 1 ? 'day' : 'days'}. ${themeCopy} ${moodCopy}`,
    nextStep: 'Choose one pattern that feels true and write one gentle sentence about what it might be asking for.',
  };
}
