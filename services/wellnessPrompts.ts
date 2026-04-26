export const DEFAULT_WELLNESS_PROMPTS = [
  "Begin with what you remember.",
  "A few lines are enough.",
  "What do you want to remember about today?",
  "Write the part you keep returning to.",
  "What was the quietest moment of your day?",
  "Notice one thing that felt heavy today.",
  "One detail that felt true.",
  "Where did you find a little room today?",
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
