import { Cloud } from '@phosphor-icons/react/Cloud';
import { Lightning } from '@phosphor-icons/react/Lightning';
import { Moon } from '@phosphor-icons/react/Moon';
import { Smiley } from '@phosphor-icons/react/Smiley';
import { SmileySad } from '@phosphor-icons/react/SmileySad';
import { Sun } from '@phosphor-icons/react/Sun';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react/lib';

export const MOOD_OPTIONS = [
  'happy',
  'glad',
  'sparked',
  'calm',
  'settled',
  'spacious',
  'anxious',
  'wired',
  'overthinking',
  'sad',
  'lonely',
  'tender',
  'angry',
  'irritated',
  'done',
  'tired',
  'drained',
  'foggy',
  'mixed',
  'raw',
  'numb',
] as const;

export const MOOD_GROUP_IDS = [
  'light',
  'steady',
  'charged',
  'heavy',
  'mixed',
] as const;

export type MoodName = (typeof MOOD_OPTIONS)[number];
export type MoodGroupId = (typeof MOOD_GROUP_IDS)[number];
export type MoodValue = MoodName | MoodGroupId;
export type MoodFamilyId = MoodGroupId;

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

export interface MoodGroup {
  id: MoodGroupId;
  label: string;
  helper: string;
  icon: PhosphorIcon;
  options: readonly MoodName[];
}

export type MoodFamily = MoodGroup;

const TONE_CLASSES = {
  happy: {
    nav: 'bg-mood-happy/10 border-mood-happy/20 text-mood-happy',
    modal: 'border-mood-happy bg-mood-happy/10 text-mood-happy',
    option: 'control-surface text-gray-text hover:border-mood-happy/30 hover:bg-mood-happy/5 hover:text-mood-happy',
    selectedOption: 'border-mood-happy/40 bg-mood-happy/10 text-mood-happy',
    labelClass: 'text-mood-happy',
    trackClass: 'bg-mood-happy/10',
    fillClass: 'bg-mood-happy',
  },
  calm: {
    nav: 'bg-mood-calm/10 border-mood-calm/20 text-mood-calm',
    modal: 'border-mood-calm bg-mood-calm/10 text-mood-calm',
    option: 'control-surface text-gray-text hover:border-mood-calm/30 hover:bg-mood-calm/5 hover:text-mood-calm',
    selectedOption: 'border-mood-calm/40 bg-mood-calm/10 text-mood-calm',
    labelClass: 'text-mood-calm',
    trackClass: 'bg-mood-calm/10',
    fillClass: 'bg-mood-calm',
  },
  anxious: {
    nav: 'bg-mood-anxious/10 border-mood-anxious/20 text-mood-anxious',
    modal: 'border-mood-anxious bg-mood-anxious/10 text-mood-anxious',
    option: 'control-surface text-gray-text hover:border-mood-anxious/30 hover:bg-mood-anxious/5 hover:text-mood-anxious',
    selectedOption: 'border-mood-anxious/40 bg-mood-anxious/10 text-mood-anxious',
    labelClass: 'text-mood-anxious',
    trackClass: 'bg-mood-anxious/10',
    fillClass: 'bg-mood-anxious',
  },
  sad: {
    nav: 'bg-mood-sad/10 border-mood-sad/20 text-mood-sad',
    modal: 'border-mood-sad bg-mood-sad/10 text-mood-sad',
    option: 'control-surface text-gray-text hover:border-mood-sad/30 hover:bg-mood-sad/5 hover:text-mood-sad',
    selectedOption: 'border-mood-sad/40 bg-mood-sad/10 text-mood-sad',
    labelClass: 'text-mood-sad',
    trackClass: 'bg-mood-sad/10',
    fillClass: 'bg-mood-sad',
  },
  angry: {
    nav: 'bg-mood-angry/10 border-mood-angry/20 text-mood-angry',
    modal: 'border-mood-angry bg-mood-angry/10 text-mood-angry',
    option: 'control-surface text-gray-text hover:border-mood-angry/30 hover:bg-mood-angry/5 hover:text-mood-angry',
    selectedOption: 'border-mood-angry/40 bg-mood-angry/10 text-mood-angry',
    labelClass: 'text-mood-angry',
    trackClass: 'bg-mood-angry/10',
    fillClass: 'bg-mood-angry',
  },
  tired: {
    nav: 'bg-mood-tired/10 border-mood-tired/20 text-mood-tired',
    modal: 'border-mood-tired bg-mood-tired/10 text-mood-tired',
    option: 'control-surface text-gray-text hover:border-mood-tired/30 hover:bg-mood-tired/5 hover:text-mood-tired',
    selectedOption: 'border-mood-tired/40 bg-mood-tired/10 text-mood-tired',
    labelClass: 'text-mood-tired',
    trackClass: 'bg-mood-tired/10',
    fillClass: 'bg-mood-tired',
  },
} as const;

const mood = (label: string, icon: PhosphorIcon, tone: keyof typeof TONE_CLASSES): MoodConfig => ({
  label,
  icon,
  ...TONE_CLASSES[tone],
});

export const MOOD_CONFIG: Record<MoodValue, MoodConfig> = {
  light: mood('Light', Smiley, 'happy'),
  steady: mood('Steady', Sun, 'calm'),
  charged: mood('Charged', Lightning, 'anxious'),
  heavy: mood('Heavy', Moon, 'sad'),
  happy: mood('Happy', Smiley, 'happy'),
  glad: mood('Glad', Smiley, 'happy'),
  sparked: mood('Sparked', Lightning, 'happy'),
  calm: mood('Calm', Sun, 'calm'),
  settled: mood('Settled', Sun, 'calm'),
  spacious: mood('Spacious', Cloud, 'calm'),
  anxious: mood('Anxious', Cloud, 'anxious'),
  wired: mood('Wired', Lightning, 'anxious'),
  overthinking: mood('Overthinking', Cloud, 'anxious'),
  sad: mood('Sad', SmileySad, 'sad'),
  lonely: mood('Lonely', Moon, 'sad'),
  tender: mood('Tender', SmileySad, 'sad'),
  angry: mood('Angry', Lightning, 'angry'),
  irritated: mood('Irritated', Lightning, 'angry'),
  done: mood('Done', Lightning, 'angry'),
  tired: mood('Tired', Moon, 'tired'),
  drained: mood('Drained', Moon, 'tired'),
  foggy: mood('Foggy', Cloud, 'tired'),
  mixed: mood('Mixed', Cloud, 'anxious'),
  raw: mood('Raw', SmileySad, 'sad'),
  numb: mood('Numb', Moon, 'tired'),
};

export const MOOD_PICKER_GROUPS: readonly MoodGroup[] = [
  {
    id: 'light',
    label: 'Light',
    helper: 'Good, bright, or a little more alive.',
    icon: Smiley,
    options: ['happy', 'sparked'],
  },
  {
    id: 'steady',
    label: 'Steady',
    helper: 'Calmer, clearer, or more spacious.',
    icon: Sun,
    options: ['calm', 'spacious'],
  },
  {
    id: 'charged',
    label: 'Charged',
    helper: 'Restless, wired, angry, or overfull.',
    icon: Lightning,
    options: ['anxious', 'wired', 'angry'],
  },
  {
    id: 'heavy',
    label: 'Heavy',
    helper: 'Sad, tired, tender, or low on room.',
    icon: Moon,
    options: ['sad', 'tired', 'drained'],
  },
  {
    id: 'mixed',
    label: 'Mixed',
    helper: 'Hard to name, layered, or in-between.',
    icon: Cloud,
    options: ['raw', 'numb'],
  },
];

export const MOOD_FAMILIES = MOOD_PICKER_GROUPS;

export const DEFAULT_MOOD_TONE = {
  labelClass: 'text-green',
  trackClass: 'bg-green/10',
  fillClass: 'bg-green',
};

const SPECIFIC_MOOD_GROUPS: Record<MoodName, MoodGroupId> = {
  happy: 'light',
  glad: 'light',
  sparked: 'light',
  calm: 'steady',
  settled: 'steady',
  spacious: 'steady',
  anxious: 'charged',
  wired: 'charged',
  overthinking: 'charged',
  sad: 'heavy',
  lonely: 'heavy',
  tender: 'heavy',
  angry: 'charged',
  irritated: 'charged',
  done: 'charged',
  tired: 'heavy',
  drained: 'heavy',
  foggy: 'heavy',
  mixed: 'mixed',
  raw: 'mixed',
  numb: 'mixed',
};

const LEGACY_GROUP_REMAP: Record<string, MoodGroupId> = {
  restless: 'charged',
  heated: 'charged',
  low: 'heavy',
  complex: 'mixed',
};

const isMoodConfigKey = (mood: string): mood is MoodValue =>
  Object.prototype.hasOwnProperty.call(MOOD_CONFIG, mood);

const isMoodGroupId = (mood: string): mood is MoodGroupId =>
  (MOOD_GROUP_IDS as readonly string[]).includes(mood);

const getNormalizedMoodValue = (mood?: string): MoodValue | undefined => {
  if (!mood) return undefined;
  if (isMoodConfigKey(mood)) return mood;
  return LEGACY_GROUP_REMAP[mood];
};

export const getMoodConfig = (mood?: string) => {
  const moodValue = getNormalizedMoodValue(mood);
  return moodValue ? MOOD_CONFIG[moodValue] : undefined;
};

export const getMoodGroupForMood = (mood?: string) => {
  const moodValue = getNormalizedMoodValue(mood);
  if (!moodValue) return undefined;

  const groupId = isMoodGroupId(moodValue) ? moodValue : SPECIFIC_MOOD_GROUPS[moodValue];
  return MOOD_PICKER_GROUPS.find((group) => group.id === groupId);
};

export const getMoodFamilyForMood = getMoodGroupForMood;

export const getMoodGroupConfig = (groupId?: string) => {
  const moodValue = getNormalizedMoodValue(groupId);
  if (!moodValue) return undefined;

  const normalizedGroupId = isMoodGroupId(moodValue) ? moodValue : SPECIFIC_MOOD_GROUPS[moodValue];
  return MOOD_PICKER_GROUPS.find((group) => group.id === normalizedGroupId);
};

export const getMoodFamilyConfig = getMoodGroupConfig;
