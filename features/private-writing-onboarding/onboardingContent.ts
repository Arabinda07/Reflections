import { Archive } from '@phosphor-icons/react/Archive';
import { Feather } from '@phosphor-icons/react/Feather';
import { LockKey } from '@phosphor-icons/react/LockKey';
import { NotePencil } from '@phosphor-icons/react/NotePencil';

export const PRIVATE_WRITING_ONBOARDING_VERSION = 2;

export const PRIVATE_WRITING_ONBOARDING_STEPS = [
  {
    label: 'Intro',
    title: 'A private space for notes',
    body:
      'This is a private journal for your writing. Use it to get thoughts down and come back to them later.',
    note: 'One honest line is already enough to begin.',
  },
  {
    label: 'Focus',
    title: 'Focus on the writing',
    body:
      'Start with one sentence. Write what you need to say and let the page hold the rest.',
    note: 'The page can hold the unfinished part too.',
  },
  {
    label: 'Privacy',
    title: 'Private and secure',
    body:
      'Your notes stay with you. AI only runs if you specifically ask it to help you find a pattern.',
    note: 'Support appears only when you invite it in.',
  },
  {
    label: 'Ready',
    title: 'Ready to start',
    body:
      'Start with a blank note or use a daily focus prompt. Your archived reflections are always available.',
    note: 'When you are ready, begin with the smallest true thing.',
  },
];

export const privateWritingOnboardingStepIcons = [
  NotePencil,
  Feather,
  LockKey,
  Archive,
] as const;
