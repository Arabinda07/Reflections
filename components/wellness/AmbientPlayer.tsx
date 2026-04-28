import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Headphones, Pause, Play, SpeakerSlash } from '@phosphor-icons/react';
import { ModalSheet } from '../ui/ModalSheet';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface AmbientPlayerProps {
  isEditorFocused: boolean;
}

type ActiveNodes = {
  carrier: OscillatorNode;
  companion: OscillatorNode;
  modulator: OscillatorNode;
  modulationGain: GainNode;
  filter: BiquadFilterNode;
  gain: GainNode;
  stopTimeout?: number;
};

type AmbientPreset = {
  id: string;
  name: string;
  description: string;
  baseFrequency: number;
  modulationFrequency: number;
  filterFrequency: number;
  waveform: OscillatorType;
};

const AMBIENT_PRESETS: AmbientPreset[] = [
  {
    id: 'morning-air',
    name: 'Morning Air',
    description: 'Light, slow, and barely there',
    baseFrequency: 174,
    modulationFrequency: 0.07,
    filterFrequency: 520,
    waveform: 'sine',
  },
  {
    id: 'soft-hum',
    name: 'Soft Hum',
    description: 'Warm focus without rhythm',
    baseFrequency: 220,
    modulationFrequency: 0.05,
    filterFrequency: 430,
    waveform: 'triangle',
  },
  {
    id: 'quiet-tide',
    name: 'Quiet Tide',
    description: 'A slow breathing wash',
    baseFrequency: 196,
    modulationFrequency: 0.04,
    filterFrequency: 360,
    waveform: 'sine',
  },
];

export const AmbientPlayer: React.FC<AmbientPlayerProps> = ({ isEditorFocused }) => {
  const ambientOptionsId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const isMobileLayout = useMediaQuery('(max-width: 639px)');
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeNodesRef = useRef<Set<ActiveNodes>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const stopPreset = useCallback(() => {
    const context = audioContextRef.current;

    activeNodesRef.current.forEach((nodes) => {
      if (context) {
        try {
          const fadeEnd = context.currentTime + 0.35;
          nodes.gain.gain.cancelScheduledValues(context.currentTime);
          nodes.gain.gain.setValueAtTime(nodes.gain.gain.value, context.currentTime);
          nodes.gain.gain.linearRampToValueAtTime(0.0001, fadeEnd);

          nodes.stopTimeout = window.setTimeout(() => {
            try {
              nodes.carrier.stop();
              nodes.companion.stop();
              nodes.modulator.stop();
            } catch {
              // The Web Audio nodes may already be stopped if the user switches quickly.
            }
            activeNodesRef.current.delete(nodes);
          }, 400);
        } catch {}
      }
    });

    setActivePresetId(null);
  }, []);

  const playPreset = useCallback(async (preset: AmbientPreset) => {
    if (activePresetId === preset.id) {
      stopPreset();
      return;
    }

    stopPreset();

    const context = getAudioContext();
    await context.resume();

    const carrier = context.createOscillator();
    const companion = context.createOscillator();
    const modulator = context.createOscillator();
    const modulationGain = context.createGain();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    carrier.type = preset.waveform;
    companion.type = 'sine';
    modulator.type = 'sine';
    carrier.frequency.value = preset.baseFrequency;
    companion.frequency.value = preset.baseFrequency * 1.5;
    modulator.frequency.value = preset.modulationFrequency;
    modulationGain.gain.value = 14;
    filter.type = 'lowpass';
    filter.frequency.value = preset.filterFrequency;
    filter.Q.value = 0.4;
    gain.gain.value = 0.0001;

    modulator.connect(modulationGain);
    modulationGain.connect(filter.frequency);
    carrier.connect(filter);
    companion.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);

    carrier.start();
    companion.start();
    modulator.start();
    gain.gain.linearRampToValueAtTime(0.015, context.currentTime + 0.8);

    activeNodesRef.current.add({ carrier, companion, modulator, modulationGain, filter, gain });
    setActivePresetId(preset.id);
  }, [activePresetId, getAudioContext, stopPreset]);

  useEffect(() => {
    if (isEditorFocused) {
      setIsOpen(false);
    }
  }, [isEditorFocused]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      activeNodesRef.current.forEach((nodes) => {
        if (nodes.stopTimeout) window.clearTimeout(nodes.stopTimeout);
        try {
          nodes.carrier.stop();
          nodes.companion.stop();
          nodes.modulator.stop();
        } catch {}
      });
      activeNodesRef.current.clear();
      audioContextRef.current?.close();
      audioContextRef.current = null;
    };
  }, [stopPreset]);

  const activePresetName = AMBIENT_PRESETS.find((preset) => preset.id === activePresetId)?.name;
  const isPlaying = activePresetId !== null;
  const triggerLabel = isPlaying
    ? `${activePresetName || 'Ambient sound'} is playing. Choose ambient sound.`
    : 'Choose ambient sound.';

  return (
    <div className="relative" ref={containerRef}>
      <div className={`chooser-chip !p-0 overflow-hidden flex flex-row items-center flex-nowrap ${isPlaying ? 'active' : ''}`}>
        <button
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
          aria-controls={ambientOptionsId}
          aria-label={triggerLabel}
          className="flex h-full items-center gap-2 px-3 sm:px-4 py-2 flex-nowrap whitespace-nowrap"
          title="Choose ambient sound"
        >
          <Headphones size={16} weight="bold" className="shrink-0" />
          <span className="hidden sm:inline">{isPlaying ? activePresetName || 'Ambient' : 'Ambient'}</span>
        </button>
        {isPlaying && (
          <div className="flex items-center pr-2">
            <div className="w-[2px] h-4 bg-border dark:bg-white/20 mx-1"></div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                stopPreset();
              }}
              className="p-1 text-gray-nav hover:text-red hover:bg-red/5 rounded-lg transition-all duration-300 ease-out-quart"
              aria-label="Turn ambient sound off"
              title="Turn ambient sound off"
            >
              <SpeakerSlash size={16} weight="bold" />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && !isMobileLayout && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full z-[100] mt-2 chooser-popover w-[260px] sm:w-[280px]"
          >
            <div id={ambientOptionsId} role="group" aria-label="Ambient sounds" className="space-y-2">
              {AMBIENT_PRESETS.map((preset) => {
                const isPresetPlaying = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    aria-pressed={isPresetPlaying}
                    aria-label={isPresetPlaying ? `${preset.name} is playing` : `Play ${preset.name}`}
                    onClick={() => {
                      playPreset(preset);
                      setIsOpen(false);
                    }}
                    className={`w-full rounded-xl border-2 p-3 text-left transition-all duration-300 ease-out-quart ${
                      isPresetPlaying
                        ? 'border-green/25 bg-green/10 text-green shadow-sm dark:bg-green/12 dark:border-green/30 dark:text-green'
                        : 'border-transparent bg-gray-50/80 text-gray-text hover:border-border hover:bg-gray-100 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/10 dark:hover:bg-white/10'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-[12px] font-black">{preset.name}</span>
                      {isPresetPlaying ? <Pause size={14} weight="bold" /> : <Play size={14} weight="bold" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ModalSheet
        isOpen={isOpen && isMobileLayout}
        onClose={() => setIsOpen(false)}
        title="Ambient sounds"
        description={
          isPlaying
            ? `${activePresetName || 'Ambient'} is playing.`
            : 'Pick a gentle background texture for your writing session.'
        }
        size="sm"
        bodyClassName="pt-2"
      >
        <div id={ambientOptionsId} role="group" aria-label="Ambient sounds" className="space-y-2">
          {AMBIENT_PRESETS.map((preset) => {
            const isPresetPlaying = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                aria-pressed={isPresetPlaying}
                aria-label={isPresetPlaying ? `${preset.name} is playing` : `Play ${preset.name}`}
                onClick={() => {
                  playPreset(preset);
                  setIsOpen(false);
                }}
                className={`w-full rounded-xl border-2 p-4 text-left transition-all duration-300 ease-out-quart ${
                  isPresetPlaying
                    ? 'border-green/25 bg-green/10 text-green shadow-sm dark:bg-green/12 dark:border-green/30 dark:text-green'
                    : 'border-transparent bg-gray-50/80 text-gray-text hover:border-border hover:bg-gray-100 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/10 dark:hover:bg-white/10'
                }`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="text-[13px] font-black">{preset.name}</span>
                  {isPresetPlaying ? <Pause size={16} weight="bold" /> : <Play size={16} weight="bold" />}
                </span>
              </button>
            );
          })}
        </div>
      </ModalSheet>
    </div>
  );
};
