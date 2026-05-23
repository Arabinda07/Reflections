import React, { useEffect, useState } from 'react';
import { CaretLeft } from '@phosphor-icons/react/CaretLeft';
import { Check } from '@phosphor-icons/react/Check';
import {
  MOOD_PICKER_GROUPS,
  getMoodConfig,
  getMoodGroupForMood,
  type MoodGroup,
  type MoodGroupId,
  type MoodName,
  type MoodValue,
} from './moodConfig';

export type MoodPickerStage = 'group' | 'detail';

interface MoodPickerProps {
  selectedMood?: string;
  onSelect: (mood: MoodValue | undefined) => void | Promise<void>;
  onStageChange?: (stage: MoodPickerStage) => void;
}

const getInitialGroupId = (mood?: string) => getMoodGroupForMood(mood)?.id || null;

export const MoodPicker: React.FC<MoodPickerProps> = ({ selectedMood, onSelect, onStageChange }) => {
  const [selectedGroupId, setSelectedGroupId] = useState<MoodGroupId | null>(() => getInitialGroupId(selectedMood));
  const selectedGroup = MOOD_PICKER_GROUPS.find((group) => group.id === selectedGroupId) || null;

  useEffect(() => {
    if (!onStageChange) return;
    onStageChange(selectedGroup ? 'detail' : 'group');
  }, [onStageChange, selectedGroup]);

  const handleGroupSelect = (group: MoodGroup) => {
    setSelectedGroupId(group.id);
  };

  const handleKeepGroup = (group: MoodGroup) => {
    void onSelect(group.id);
  };

  const handleMoodSelect = (mood: MoodName) => {
    const nextMood = selectedMood === mood ? undefined : mood;

    void onSelect(nextMood);
  };

  if (!selectedGroup) {
    return (
      <div className="space-y-2.5">
        {MOOD_PICKER_GROUPS.map((group) => {
          const Icon = group.icon;
          const groupConfig = getMoodConfig(group.id);

          return (
            <button
              key={group.id}
              type="button"
              onClick={() => handleGroupSelect(group)}
              className={`group flex min-h-[4.65rem] w-full items-center gap-3.5 rounded-[1.15rem] border p-3.5 text-left transition-[border-color,background-color,box-shadow,transform] duration-300 ease-out-expo hover:-translate-y-px sm:min-h-[5rem] sm:rounded-[1.25rem] sm:p-4 ${groupConfig?.option || 'control-surface text-gray-text'}`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/40 transition-transform duration-500 group-hover:scale-105 sm:h-11 sm:w-11">
                <Icon size={22} weight="duotone" className={groupConfig?.labelClass} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold leading-tight text-gray-text sm:text-base">{group.label}</span>
                <span className="mt-1 block text-[11px] font-semibold leading-snug text-gray-nav sm:text-xs">{group.helper}</span>
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  const selectedGroupConfig = getMoodConfig(selectedGroup.id);
  const GroupIcon = selectedGroup.icon;

  return (
    <div className="mood-picker-detail space-y-3">
      <button
        type="button"
        onClick={() => setSelectedGroupId(null)}
        className="inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-control)] px-1 text-sm font-bold text-gray-nav transition-colors hover:text-green"
      >
        <CaretLeft size={16} weight="bold" />
        Back
      </button>

      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${selectedGroupConfig?.trackClass || 'bg-green/10'}`}>
            <GroupIcon size={20} weight="duotone" className={selectedGroupConfig?.labelClass || 'text-green'} />
          </span>
          <div>
            <h3 className="font-display text-[18px] font-bold leading-tight text-gray-text">Want a closer word?</h3>
            <p className="mt-1 text-sm font-medium leading-relaxed text-gray-light">
              Choose one, or keep it broad.
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => handleKeepGroup(selectedGroup)}
        className={`flex min-h-12 w-full items-center justify-between rounded-[var(--radius-control)] border px-4 py-3 text-left text-sm font-bold transition-[border-color,background-color,color,transform] duration-300 ease-out-expo hover:-translate-y-px ${selectedGroupConfig?.selectedOption || 'border-green/30 bg-green/10 text-green'}`}
      >
        <span>Keep {selectedGroup.label}</span>
        {selectedMood === selectedGroup.id ? (
          <span className="rounded-full bg-white/70 p-1 text-green">
            <Check size={12} weight="bold" />
          </span>
        ) : null}
      </button>

      <div className="flex flex-wrap gap-2">
        {selectedGroup.options.map((entry) => {
          const moodConfig = getMoodConfig(entry);
          const Icon = moodConfig?.icon;
          const isSelected = selectedMood === entry;

          if (!moodConfig || !Icon) return null;

          return (
            <button
              key={entry}
              type="button"
              onClick={() => handleMoodSelect(entry)}
              className={`relative inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border px-3.5 py-2 text-sm font-bold transition-[border-color,background-color,color,transform] duration-300 ease-out-expo hover:-translate-y-px ${isSelected ? moodConfig.modal : `${moodConfig.option} dark:bg-white/5`}`}
            >
              <Icon size={18} weight={isSelected ? 'fill' : 'regular'} />
              <span>{moodConfig.label}</span>
              {isSelected ? <Check size={13} weight="bold" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};
