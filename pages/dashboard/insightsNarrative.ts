// Editorial narrative builders for Insights. Pure string assembly so the
// weekly/monthly recap can read as prose instead of a stat scoreboard.

export const listToSentence = (items: string[]): string => {
  const list = items.filter(Boolean);
  if (list.length === 0) return '';
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} and ${list[1]}`;
  return `${list.slice(0, -1).join(', ')}, and ${list[list.length - 1]}`;
};

const plural = (count: number, singular: string, suffix = 's') =>
  count === 1 ? singular : `${singular}${suffix}`;

export const buildWeekSummary = (recap: {
  writingDays: number;
  reflectionsSaved: number;
  moodCheckins: number;
  releaseMoments: number;
}): string => {
  const parts: string[] = [];
  if (recap.reflectionsSaved > 0) {
    parts.push(`saved ${recap.reflectionsSaved} ${plural(recap.reflectionsSaved, 'reflection')}`);
  }
  if (recap.moodCheckins > 0) {
    parts.push(`checked in ${recap.moodCheckins} ${plural(recap.moodCheckins, 'time')}`);
  }
  if (recap.releaseMoments > 0) {
    parts.push(`let go of ${recap.releaseMoments} ${plural(recap.releaseMoments, 'moment')}`);
  }
  const tail = parts.length ? `, ${listToSentence(parts)}` : '';
  return `You returned ${recap.writingDays} ${plural(recap.writingDays, 'day')}${tail}.`;
};

export const buildMoodSentence = (labels: string[]): string | null => {
  const list = labels.filter(Boolean);
  if (list.length === 0) return null;
  return `Your mood leaned ${listToSentence(list)}.`;
};

export const buildTagsSentence = (tags: string[]): string | null => {
  const list = tags.filter(Boolean);
  if (list.length === 0) return null;
  return `You kept circling ${listToSentence(list)}.`;
};

export const buildMonthSummary = (stats: {
  monthNotes: number;
  daysCheckedIn: number;
  wordsWritten: number;
  tone?: string | null;
}): string => {
  if (stats.monthNotes === 0) {
    return "This month is still open — nothing written yet. Whenever you're ready.";
  }
  const wordsClause = stats.wordsWritten > 0 ? `, about ${stats.wordsWritten.toLocaleString()} words` : '';
  const toneClause = stats.tone ? `, and your tone has leaned ${stats.tone.toLowerCase()}` : '';
  return `This month you've written ${stats.monthNotes} ${plural(stats.monthNotes, 'reflection')} across ${stats.daysCheckedIn} ${plural(stats.daysCheckedIn, 'day')}${wordsClause}${toneClause}.`;
};
