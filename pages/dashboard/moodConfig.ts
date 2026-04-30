import {
  Cloud,
  Icon as PhosphorIcon,
  Lightning,
  Moon,
  Smiley,
  SmileySad,
  Sun,
} from '@phosphor-icons/react';

export const MOOD_OPTIONS = ['happy', 'calm', 'anxious', 'sad', 'angry', 'tired'] as const;

export type MoodName = (typeof MOOD_OPTIONS)[number];

interface MoodConfig {
  label: string;
  icon: PhosphorIcon;
  nav: string;
  modal: string;
  option: string;
  selectedOption: string;
  labelClass: string;
  trackClass: string;
  fillClass: string;
}

const BOTANICAL_MOOD_TONE = {
  nav: 'bg-green/10 border-green/20 text-green',
  modal: 'border-green bg-green/10 text-green',
  option: 'control-surface text-gray-text hover:border-green/30 hover:bg-green/5 hover:text-green',
  selectedOption: 'border-green/40 bg-green/10 text-green',
  labelClass: 'text-green',
  trackClass: 'bg-green/10',
  fillClass: 'bg-green',
};

export const MOOD_CONFIG: Record<MoodName, MoodConfig> = {
  happy: {
    label: 'Happy',
    icon: Smiley,
    ...BOTANICAL_MOOD_TONE,
  },
  calm: {
    label: 'Calm',
    icon: Sun,
    ...BOTANICAL_MOOD_TONE,
  },
  anxious: {
    label: 'Anxious',
    icon: Cloud,
    ...BOTANICAL_MOOD_TONE,
  },
  sad: {
    label: 'Sad',
    icon: SmileySad,
    ...BOTANICAL_MOOD_TONE,
  },
  angry: {
    label: 'Angry',
    icon: Lightning,
    ...BOTANICAL_MOOD_TONE,
  },
  tired: {
    label: 'Tired',
    icon: Moon,
    ...BOTANICAL_MOOD_TONE,
  },
};

export const DEFAULT_MOOD_TONE = {
  labelClass: 'text-green',
  trackClass: 'bg-green/10',
  fillClass: 'bg-green',
};

export const getMoodConfig = (mood?: string) =>
  mood && Object.prototype.hasOwnProperty.call(MOOD_CONFIG, mood)
    ? MOOD_CONFIG[mood as MoodName]
    : undefined;
