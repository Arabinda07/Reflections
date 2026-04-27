export const DEFAULT_WELLNESS_PROMPTS = [
  "What happened today?",
  "What is on your mind right now?",
  "What are you trying to figure out?",
  "Write down the thing you keep replaying.",
  "What do you need to handle next?",
  "What changed since yesterday?",
  "What did you not get to say?",
  "What do you want to remember later?",
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
