export type CompletionCardKind = 'weekly_recap' | 'release_completed' | 'letter_scheduled';

export interface CompletionCardPayload {
  brand: 'Reflections';
  title: string;
  subtitle: string;
  dateLabel: string;
  kind: CompletionCardKind;
  badge: string;
}

interface CompletionCardInput {
  kind: CompletionCardKind;
  date: Date;
  weekLabel?: string;
  customTitle?: string;
}

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);

const cardCopy: Record<CompletionCardKind, { title: string; subtitle: string; badge: string }> = {
  weekly_recap: {
    title: 'My Reflections',
    subtitle: 'A quiet week in Reflections.',
    badge: 'Weekly Recap',
  },
  release_completed: {
    title: 'I let something go.',
    subtitle: 'A quiet moment was completed.',
    badge: 'Released',
  },
  letter_scheduled: {
    title: 'I wrote something for a future day.',
    subtitle: 'A letter is waiting in Reflections.',
    badge: 'Future Letter',
  },
};

export function buildCompletionCardPayload(input: CompletionCardInput): CompletionCardPayload {
  const dateLabel = formatDate(input.date);
  const copy = cardCopy[input.kind];

  return {
    brand: 'Reflections',
    title: input.customTitle?.trim() || copy.title,
    subtitle: input.kind === 'weekly_recap' && input.weekLabel ? input.weekLabel : copy.subtitle,
    dateLabel,
    kind: input.kind,
    badge: copy.badge,
  };
}
