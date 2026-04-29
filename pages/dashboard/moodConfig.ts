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

export const MOOD_CONFIG: Record<MoodName, MoodConfig> = {
  happy: {
    label: 'Happy',
    icon: Smiley,
    nav: 'bg-golden/10 border-golden/20 text-golden',
    modal: 'border-golden bg-golden/10 text-golden',
    option: 'border-border bg-white/5 text-gray-text hover:border-golden/30 hover:bg-golden/5',
    selectedOption: 'border-golden/40 bg-golden/10 text-golden',
    labelClass: 'text-golden',
    trackClass: 'bg-golden/10',
    fillClass: 'bg-golden',
  },
  calm: {
    label: 'Calm',
    icon: Sun,
    nav: 'bg-green/10 border-green/20 text-green',
    modal: 'border-green bg-green/10 text-green',
    option: 'border-border bg-white/5 text-gray-text hover:border-green/30 hover:bg-green/5',
    selectedOption: 'border-green/40 bg-green/10 text-green',
    labelClass: 'text-green',
    trackClass: 'bg-green/10',
    fillClass: 'bg-green',
  },
  anxious: {
    label: 'Anxious',
    icon: Cloud,
    nav: 'bg-blue/10 border-blue/20 text-blue',
    modal: 'border-blue bg-blue/10 text-blue',
    option: 'border-border bg-white/5 text-gray-text hover:border-blue/30 hover:bg-blue/5',
    selectedOption: 'border-blue/40 bg-blue/10 text-blue',
    labelClass: 'text-blue',
    trackClass: 'bg-blue/10',
    fillClass: 'bg-blue',
  },
  sad: {
    label: 'Sad',
    icon: SmileySad,
    nav: 'bg-dark-blue/10 border-dark-blue/20 text-dark-blue',
    modal: 'border-dark-blue bg-dark-blue/10 text-dark-blue',
    option: 'border-border bg-white/5 text-gray-text hover:border-dark-blue/30 hover:bg-dark-blue/5',
    selectedOption: 'border-dark-blue/40 bg-dark-blue/10 text-dark-blue',
    labelClass: 'text-dark-blue',
    trackClass: 'bg-dark-blue/10',
    fillClass: 'bg-dark-blue',
  },
  angry: {
    label: 'Angry',
    icon: Lightning,
    nav: 'bg-red/10 border-red/20 text-red',
    modal: 'border-red bg-red/10 text-red',
    option: 'border-border bg-white/5 text-gray-text hover:border-red/30 hover:bg-red/5',
    selectedOption: 'border-red/40 bg-red/10 text-red',
    labelClass: 'text-red',
    trackClass: 'bg-red/10',
    fillClass: 'bg-red',
  },
  tired: {
    label: 'Tired',
    icon: Moon,
    nav: 'bg-gray-light/10 border-gray-light/20 text-gray-text',
    modal: 'border-gray-light bg-gray-light/10 text-gray-text',
    option: 'border-border bg-white/5 text-gray-text hover:border-gray-light/30 hover:bg-gray-light/10',
    selectedOption: 'border-gray-light/40 bg-gray-light/10 text-gray-text',
    labelClass: 'text-gray-light',
    trackClass: 'bg-gray-light/20',
    fillClass: 'bg-gray-light',
  },
};

export const DEFAULT_MOOD_TONE = {
  labelClass: 'text-gray-light',
  trackClass: 'bg-gray-light/20',
  fillClass: 'bg-gray-light',
};

export const getMoodConfig = (mood?: string) =>
  mood && Object.prototype.hasOwnProperty.call(MOOD_CONFIG, mood)
    ? MOOD_CONFIG[mood as MoodName]
    : undefined;
