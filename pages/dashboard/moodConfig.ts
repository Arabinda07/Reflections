import { Anchor } from '@phosphor-icons/react/Anchor';
import { BatteryEmpty } from '@phosphor-icons/react/BatteryEmpty';
import { Bed } from '@phosphor-icons/react/Bed';
import { Brain } from '@phosphor-icons/react/Brain';
import { Cloud } from '@phosphor-icons/react/Cloud';
import { CloudRain } from '@phosphor-icons/react/CloudRain';
import { Drop } from '@phosphor-icons/react/Drop';
import { EyeClosed } from '@phosphor-icons/react/EyeClosed';
import { Flame } from '@phosphor-icons/react/Flame';
import { SmileyAngry } from '@phosphor-icons/react/SmileyAngry';
import { HandPalm } from '@phosphor-icons/react/HandPalm';
import { Heart } from '@phosphor-icons/react/Heart';
import { Leaf } from '@phosphor-icons/react/Leaf';
import { Lightning } from '@phosphor-icons/react/Lightning';
import { Moon } from '@phosphor-icons/react/Moon';
import { Question } from '@phosphor-icons/react/Question';
import { Shield } from '@phosphor-icons/react/Shield';
import { Smiley } from '@phosphor-icons/react/Smiley';
import { SmileyBlank } from '@phosphor-icons/react/SmileyBlank';
import { SmileySad } from '@phosphor-icons/react/SmileySad';
import { SmileyWink } from '@phosphor-icons/react/SmileyWink';
import { Sparkle } from '@phosphor-icons/react/Sparkle';
import { Sun } from '@phosphor-icons/react/Sun';
import { SunHorizon } from '@phosphor-icons/react/SunHorizon';
import { Tornado } from '@phosphor-icons/react/Tornado';
import { User } from '@phosphor-icons/react/User';
import { WarningCircle } from '@phosphor-icons/react/WarningCircle';
import { Wind } from '@phosphor-icons/react/Wind';
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
  mixed: {
    nav: 'bg-mood-mixed/10 border-mood-mixed/20 text-mood-mixed',
    modal: 'border-mood-mixed bg-mood-mixed/10 text-mood-mixed',
    option: 'control-surface text-gray-text hover:border-mood-mixed/30 hover:bg-mood-mixed/5 hover:text-mood-mixed',
    selectedOption: 'border-mood-mixed/40 bg-mood-mixed/10 text-mood-mixed',
    labelClass: 'text-mood-mixed',
    trackClass: 'bg-mood-mixed/10',
    fillClass: 'bg-mood-mixed',
  },
} as const;

const mood = (label: string, icon: PhosphorIcon, tone: keyof typeof TONE_CLASSES): MoodConfig => ({
  label,
  icon,
  ...TONE_CLASSES[tone],
});

export const MOOD_CONFIG: Record<MoodValue, MoodConfig> = {
  light: mood('Happy', Smiley, 'happy'),
  steady: mood('Calm', Sun, 'calm'),
  charged: mood('Stressed', Lightning, 'anxious'),
  heavy: mood('Sad', Moon, 'sad'),
  happy: mood('Cheerful', SmileyWink, 'happy'),
  glad: mood('Content', Heart, 'happy'),
  sparked: mood('Excited', Sparkle, 'happy'),
  calm: mood('Relaxed', Wind, 'calm'),
  settled: mood('Peaceful', Anchor, 'calm'),
  spacious: mood('Clear', Leaf, 'calm'),
  anxious: mood('Anxious', WarningCircle, 'anxious'),
  wired: mood('Overwhelmed', Tornado, 'anxious'),
  overthinking: mood('Worrying', Brain, 'anxious'),
  sad: mood('Down', SmileySad, 'sad'),
  lonely: mood('Lonely', User, 'sad'),
  tender: mood('Vulnerable', Shield, 'sad'),
  angry: mood('Angry', Flame, 'angry'),
  irritated: mood('Frustrated', SmileyAngry, 'angry'),
  done: mood('Annoyed', HandPalm, 'angry'),
  tired: mood('Tired', Bed, 'tired'),
  drained: mood('Exhausted', BatteryEmpty, 'tired'),
  foggy: mood('Unfocused', EyeClosed, 'tired'),
  mixed: mood('Mixed', Cloud, 'mixed'),
  raw: mood('Sensitive', Drop, 'mixed'),
  numb: mood('Blank', SmileyBlank, 'mixed'),
};

export const MOOD_PICKER_GROUPS: readonly MoodGroup[] = [
  {
    id: 'light',
    label: 'Happy',
    helper: 'Feeling good, positive, or excited.',
    icon: Smiley,
    options: ['happy', 'sparked'],
  },
  {
    id: 'steady',
    label: 'Calm',
    helper: 'Feeling peaceful, relaxed, or clear.',
    icon: Sun,
    options: ['calm', 'spacious'],
  },
  {
    id: 'charged',
    label: 'Stressed',
    helper: 'Feeling worried, overwhelmed, or angry.',
    icon: Lightning,
    options: ['anxious', 'wired', 'angry'],
  },
  {
    id: 'heavy',
    label: 'Sad',
    helper: 'Feeling down, lonely, or exhausted.',
    icon: Moon,
    options: ['sad', 'tired', 'drained'],
  },
  {
    id: 'mixed',
    label: 'Mixed',
    helper: 'Feeling confused, unsure, or in-between.',
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
