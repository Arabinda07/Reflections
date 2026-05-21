import React, { useState } from 'react';
import { CaretLeft } from '@phosphor-icons/react/CaretLeft';
import { Check } from '@phosphor-icons/react/Check';
import {
  MOOD_CONFIG,
  MOOD_FAMILIES,
  getMoodFamilyForMood,
  type MoodFamily,
  type MoodFamilyId,
  type MoodName,
} from './moodConfig';
import {
  trackMoodFamilySelectedDeferred,
  trackMoodSelectedDeferred,
} from '../../src/analytics/deferredEvents';

type MoodPickerSource = 'note' | 'home' | 'single_note';

interface MoodPickerProps {
  selectedMood?: string;
  source: MoodPickerSource;
  onSelect: (mood: MoodName | undefined) => void | Promise<void>;
}

const getInitialFamilyId = (mood?: string) => getMoodFamilyForMood(mood)?.id || null;

export const MoodPicker: React.FC<MoodPickerProps> = ({ selectedMood, source, onSelect }) => {
  const [selectedFamilyId, setSelectedFamilyId] = useState<MoodFamilyId | null>(() => getInitialFamilyId(selectedMood));
  const selectedFamily = MOOD_FAMILIES.find((family) => family.id === selectedFamilyId) || null;

  const handleFamilySelect = (family: MoodFamily) => {
    setSelectedFamilyId(family.id);
    trackMoodFamilySelectedDeferred({ source, familyId: family.id });
  };

  const handleMoodSelect = (mood: MoodName) => {
    const family = getMoodFamilyForMood(mood);
    const nextMood = selectedMood === mood ? undefined : mood;

    if (nextMood && family) {
      trackMoodSelectedDeferred({ source, mood: nextMood, familyId: family.id });
    }

    void onSelect(nextMood);
  };

  if (!selectedFamily) {
    return (
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {MOOD_FAMILIES.map((family) => {
          const Icon = family.icon;
          const firstMoodConfig = MOOD_CONFIG[family.options[0]];

          return (
            <button
              key={family.id}
              type="button"
              onClick={() => handleFamilySelect(family)}
              className={`group min-h-[5.9rem] rounded-[1.1rem] border p-3 text-left transition-[border-color,background-color,box-shadow,transform] duration-300 ease-out-expo hover:scale-[1.01] hover:shadow-lg sm:min-h-[6.7rem] sm:rounded-[1.35rem] sm:p-4 ${firstMoodConfig.option}`}
            >
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white/40 transition-transform duration-500 group-hover:scale-105 sm:h-10 sm:w-10">
                <Icon size={21} weight="duotone" className={firstMoodConfig.labelClass} />
              </div>
              <span className="block text-sm font-bold leading-tight text-gray-text sm:text-base">{family.label}</span>
              <span className="mt-1 block text-[11px] font-semibold leading-snug text-gray-nav sm:text-xs">{family.helper}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setSelectedFamilyId(null)}
        className="flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] px-2 text-sm font-bold text-gray-nav transition-colors hover:bg-green/5 hover:text-green"
      >
        <CaretLeft size={16} weight="bold" />
        Back to moods
      </button>

      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {selectedFamily.options.map((entry) => {
          const moodConfig = MOOD_CONFIG[entry];
          const Icon = moodConfig.icon;
          const isSelected = selectedMood === entry;

          return (
            <button
              key={entry}
              type="button"
              onClick={() => handleMoodSelect(entry)}
              className={`relative flex min-h-20 flex-col items-center justify-center rounded-2xl border-2 p-2.5 text-center transition-colors sm:min-h-24 sm:p-3 ${isSelected ? moodConfig.modal : `${moodConfig.option} dark:bg-white/5`}`}
            >
              {isSelected ? (
                <span className="absolute right-2 top-2 rounded-full bg-white/70 p-1 text-green">
                  <Check size={12} weight="bold" />
                </span>
              ) : null}
              <Icon size={26} weight={isSelected ? 'fill' : 'regular'} className="mb-1.5" />
              <span className="text-[12px] font-bold">{moodConfig.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
