export const DEFAULT_WELLNESS_PROMPTS = [
  "What is one thing that made you feel peaceful today, even if just for a second?",
  "How did you handle a challenge today with kindness toward yourself?",
  "What's a small victory you want to celebrate right now?",
  "If you could send a message to your future self, what would it say?",
  "What's one thing you're letting go of to make room for growth?",
  "Describe a moment today where you felt truly present.",
  "What's a quality you admire in yourself that you used today?",
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
