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
    nav: 'bg-mood-happy/10 border-mood-happy/20 text-mood-happy',
    modal: 'border-mood-happy bg-mood-happy/10 text-mood-happy',
    option: 'control-surface text-gray-text hover:border-mood-happy/30 hover:bg-mood-happy/5 hover:text-mood-happy',
    selectedOption: 'border-mood-happy/40 bg-mood-happy/10 text-mood-happy',
    labelClass: 'text-mood-happy',
    trackClass: 'bg-mood-happy/10',
    fillClass: 'bg-mood-happy',
  },
  calm: {
    label: 'Calm',
    icon: Sun,
    nav: 'bg-mood-calm/10 border-mood-calm/20 text-mood-calm',
    modal: 'border-mood-calm bg-mood-calm/10 text-mood-calm',
    option: 'control-surface text-gray-text hover:border-mood-calm/30 hover:bg-mood-calm/5 hover:text-mood-calm',
    selectedOption: 'border-mood-calm/40 bg-mood-calm/10 text-mood-calm',
    labelClass: 'text-mood-calm',
    trackClass: 'bg-mood-calm/10',
    fillClass: 'bg-mood-calm',
  },
  anxious: {
    label: 'Anxious',
    icon: Cloud,
    nav: 'bg-mood-anxious/10 border-mood-anxious/20 text-mood-anxious',
    modal: 'border-mood-anxious bg-mood-anxious/10 text-mood-anxious',
    option: 'control-surface text-gray-text hover:border-mood-anxious/30 hover:bg-mood-anxious/5 hover:text-mood-anxious',
    selectedOption: 'border-mood-anxious/40 bg-mood-anxious/10 text-mood-anxious',
    labelClass: 'text-mood-anxious',
    trackClass: 'bg-mood-anxious/10',
    fillClass: 'bg-mood-anxious',
  },
  sad: {
    label: 'Sad',
    icon: SmileySad,
    nav: 'bg-mood-sad/10 border-mood-sad/20 text-mood-sad',
    modal: 'border-mood-sad bg-mood-sad/10 text-mood-sad',
    option: 'control-surface text-gray-text hover:border-mood-sad/30 hover:bg-mood-sad/5 hover:text-mood-sad',
    selectedOption: 'border-mood-sad/40 bg-mood-sad/10 text-mood-sad',
    labelClass: 'text-mood-sad',
    trackClass: 'bg-mood-sad/10',
    fillClass: 'bg-mood-sad',
  },
  angry: {
    label: 'Angry',
    icon: Lightning,
    nav: 'bg-mood-angry/10 border-mood-angry/20 text-mood-angry',
    modal: 'border-mood-angry bg-mood-angry/10 text-mood-angry',
    option: 'control-surface text-gray-text hover:border-mood-angry/30 hover:bg-mood-angry/5 hover:text-mood-angry',
    selectedOption: 'border-mood-angry/40 bg-mood-angry/10 text-mood-angry',
    labelClass: 'text-mood-angry',
    trackClass: 'bg-mood-angry/10',
    fillClass: 'bg-mood-angry',
  },
  tired: {
    label: 'Tired',
    icon: Moon,
    nav: 'bg-mood-tired/10 border-mood-tired/20 text-mood-tired',
    modal: 'border-mood-tired bg-mood-tired/10 text-mood-tired',
    option: 'control-surface text-gray-text hover:border-mood-tired/30 hover:bg-mood-tired/5 hover:text-mood-tired',
    selectedOption: 'border-mood-tired/40 bg-mood-tired/10 text-mood-tired',
    labelClass: 'text-mood-tired',
    trackClass: 'bg-mood-tired/10',
    fillClass: 'bg-mood-tired',
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
