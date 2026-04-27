export const DEFAULT_WELLNESS_PROMPTS = [
  "Begin with what you remember.",
  "A few lines are enough.",
  "What do you want to remember about today?",
  "Write the plain version first.",
  "What happened that is still worth noting?",
  "Name one small detail before the day moves on.",
  "What do you need to remember later?",
  "Start with the last thing on your mind.",
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
