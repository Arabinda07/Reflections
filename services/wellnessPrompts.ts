export const DEFAULT_WELLNESS_PROMPTS = [
  "What happened today?",
  "What made today different?",
  "What stood out today?",
  "What surprised you today?",
  "What do you want to remember from today?",
  "What's been on your mind today?",
  "What can't you stop thinking about?",
  "What's been distracting you today?",
  "What's worrying you today?",
  "What's making you smile today?",
  "Who did you talk to today?",
  "What conversation stayed with you?",
  "Did someone say something you keep thinking about?",
  "Who were you thinking about today?",
  "Who made today easier?",
  "Did someone surprise you today?",
  "What happened at work today?",
  "What took most of your time today?",
  "What felt harder than you expected today?",
  "Is there a decision on your mind?",
  "What are you trying to decide?",
  "What are you looking forward to?",
  "What's coming up that's on your mind?",
  "What do you want to remember for tomorrow?",
  "Is there something you wish you'd said today?",
  "Is there something you wish had gone differently?",
  "What's still on your mind tonight?",
  "What made you laugh today?",
  "What annoyed you today?",
];

export function getCurrentWellnessPrompt(index: number, prompts: string[]) {
  const source = prompts.length > 0 ? prompts : DEFAULT_WELLNESS_PROMPTS;
  return source[((index % source.length) + source.length) % source.length];
}

export function getNextWellnessPromptState(index: number, prompts: string[]) {
  const source = prompts.length > 0 ? prompts : DEFAULT_WELLNESS_PROMPTS;
  const nextIndex = (index + 1) % source.length;

  return {
    nextIndex,
    prompt: source[nextIndex],
  };
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

export function getTimeOfDay(date: Date = new Date()): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
}

export const TIME_AWARE_PROMPT_MAP: Record<TimeOfDay, string[]> = {
  morning: [
    "What are you looking forward to?",
    "What's coming up that's on your mind?",
    "What's been on your mind today?",
    "Is there a decision on your mind?",
    "What are you trying to decide?",
    "What do you want to remember from today?",
  ],
  afternoon: [
    "What happened at work today?",
    "What took most of your time today?",
    "What felt harder than you expected today?",
    "What's been distracting you today?",
    "Who did you talk to today?",
    "What conversation stayed with you?",
    "Did someone say something you keep thinking about?",
    "What annoyed you today?",
  ],
  evening: [
    "What stood out today?",
    "What made today different?",
    "What surprised you today?",
    "Who made today easier?",
    "What's making you smile today?",
    "What made you laugh today?",
    "What's still on your mind tonight?",
    "Is there something you wish had gone differently?",
    "What do you want to remember for tomorrow?",
    "Who were you thinking about today?",
  ],
};

export function getTimeAwareWellnessPrompts(date: Date = new Date()): string[] {
  const time = getTimeOfDay(date);
  return TIME_AWARE_PROMPT_MAP[time] || DEFAULT_WELLNESS_PROMPTS;
}
