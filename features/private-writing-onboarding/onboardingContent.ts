import { Archive } from '@phosphor-icons/react/Archive';
import { UsersThree } from '@phosphor-icons/react/UsersThree';
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
    label: 'People',
    title: 'The people you write about',
    body:
      'Add the people who matter. When they come up in your writing, Reflections notices and brings them back gently, with your own words.',
    note: 'No streaks, no scores. Just a reminder of who is on your mind.',
  },
  {
    label: 'Privacy',
    title: 'Private by design',
    body:
      'Notes and people are encrypted on this device before they sync. Search, related notes and name matching run here too, so your writing never has to leave.',
    note: 'Only you hold the key. Keep your recovery key somewhere safe.',
  },
  {
    label: 'Ready',
    title: 'Ready to start',
    body:
      'The app opens on a blank page. Today, your notes and your people are one tap away.',
    note: 'When you are ready, begin with the smallest true thing.',
  },
];

export const privateWritingOnboardingStepIcons = [
  NotePencil,
  UsersThree,
  LockKey,
  Archive,
] as const;
