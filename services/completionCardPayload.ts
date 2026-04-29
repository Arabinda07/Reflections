export type CompletionCardKind = 'weekly_recap' | 'release_completed' | 'letter_scheduled';

export interface CompletionCardPayload {
  brand: 'Reflections';
  title: string;
  subtitle: string;
  dateLabel: string;
  kind: CompletionCardKind;
}

interface CompletionCardInput {
  kind: CompletionCardKind;
  date: Date;
  weekLabel?: string;
}

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);

const cardCopy: Record<CompletionCardKind, { title: string; subtitle: string }> = {
  weekly_recap: {
    title: 'I returned to myself this week.',
    subtitle: 'A quiet week in Reflections.',
  },
  release_completed: {
    title: 'I let something go.',
    subtitle: 'A quiet moment was completed.',
  },
  letter_scheduled: {
    title: 'I wrote something for a future day.',
    subtitle: 'A letter is waiting in Reflections.',
  },
};

export function buildCompletionCardPayload(input: CompletionCardInput): CompletionCardPayload {
  const dateLabel = formatDate(input.date);
  const copy = cardCopy[input.kind];

  return {
    brand: 'Reflections',
    title: copy.title,
    subtitle: input.kind === 'weekly_recap' && input.weekLabel ? input.weekLabel : copy.subtitle,
    dateLabel,
    kind: input.kind,
  };
}
