import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Headphones, Pause, Play, X, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../ui/Button';

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
  colorClass: string;
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
    colorClass: 'border-emerald-200 bg-emerald-50/95 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/12 dark:text-emerald-100',
    baseFrequency: 174,
    modulationFrequency: 0.07,
    filterFrequency: 520,
    waveform: 'sine',
  },
  {
    id: 'soft-hum',
    name: 'Soft Hum',
    description: 'Warm focus without rhythm',
    colorClass: 'border-sky-200 bg-sky-50/95 text-sky-700 dark:border-sky-400/25 dark:bg-sky-400/12 dark:text-sky-100',
    baseFrequency: 220,
    modulationFrequency: 0.05,
    filterFrequency: 430,
    waveform: 'triangle',
  },
  {
    id: 'quiet-tide',
    name: 'Quiet Tide',
    description: 'A slow breathing wash',
    colorClass: 'border-teal-200 bg-teal-50/95 text-teal-700 dark:border-teal-400/25 dark:bg-teal-400/12 dark:text-teal-100',
    baseFrequency: 196,
    modulationFrequency: 0.04,
    filterFrequency: 360,
    waveform: 'sine',
  },
];

export const AmbientPlayer: React.FC<AmbientPlayerProps> = ({ isEditorFocused }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
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
    const mediaQuery = window.matchMedia('(max-width: 639px)');
    const syncLayout = () => setIsMobileLayout(mediaQuery.matches);

    syncLayout();
    mediaQuery.addEventListener('change', syncLayout);
    return () => mediaQuery.removeEventListener('change', syncLayout);
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

  const isPlaying = activePresetId !== null;

  return (
    <div className="relative" ref={containerRef}>
      <div className={`flex items-center rounded-xl border-2 transition-all shadow-[0_2px_0_0_#E5E5E5] active:shadow-none active:translate-y-[2px] ${
          isPlaying 
            ? 'bg-blue/5 border-blue text-blue dark:bg-sky-400/12 dark:border-sky-400/20 dark:text-sky-100' 
            : 'bg-white border-border text-gray-nav hover:border-blue/30 dark:bg-white/5 dark:border-white/10 dark:text-slate-300 dark:hover:border-sky-400/20'
        }`}
      >
        <button
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          className="flex items-center gap-2 px-3 sm:px-4 py-2 font-black uppercase text-[10px] sm:text-[11px]"
          title="Choose ambient sound"
        >
          <Headphones size={16} />
          <span className="hidden sm:inline">{isPlaying ? AMBIENT_PRESETS.find(p => p.id === activePresetId)?.name || 'Ambient' : 'Ambient'}</span>
        </button>
        {isPlaying && (
          <div className="flex items-center">
            <div className="w-[2px] h-4 bg-blue/20 dark:bg-sky-400/20"></div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                stopPreset();
              }}
              className="px-3 py-2 text-blue hover:text-red hover:bg-red/5 rounded-r-xl transition-all"
              title="Turn ambient sound off"
            >
              <VolumeX size={16} />
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
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 top-full z-[100] mt-2 w-[280px] rounded-[28px] border border-sky-100/90 bg-white/95 p-4 shadow-[0_24px_60px_-35px_rgba(14,165,233,0.7)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#16181d]/95 dark:shadow-[0_30px_70px_-40px_rgba(8,145,178,0.55)]"
          >
            <h4 className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-nav dark:text-slate-300">Ambient Focus</h4>
            <p className="mb-4 text-[11px] font-bold leading-relaxed text-gray-light dark:text-slate-400">Quiet tones for a softer writing room.</p>

            <div className="space-y-2">
              {AMBIENT_PRESETS.map((preset) => {
                const isPresetPlaying = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      playPreset(preset);
                      setIsOpen(false);
                    }}
                    className={`w-full rounded-xl border p-3 text-left transition-all ${
                      isPresetPlaying
                        ? preset.colorClass
                        : 'border-transparent bg-slate-50/85 text-gray-text hover:border-sky-100 hover:bg-sky-50/60 dark:bg-white/5 dark:text-slate-100 dark:hover:border-sky-400/20 dark:hover:bg-sky-400/10'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-[12px] font-black">{preset.name}</span>
                      {isPresetPlaying ? <Pause size={14} /> : <Play size={14} />}
                    </span>
                    <span className="mt-1 block text-[11px] font-bold opacity-70">{preset.description}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {isOpen && isMobileLayout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] flex items-end bg-slate-950/35 p-3 backdrop-blur-sm sm:hidden"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ y: 30, opacity: 0.85 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0.85 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="w-full rounded-[28px] border border-sky-100/90 bg-white/96 p-4 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.5)] dark:border-white/10 dark:bg-[#16181d]/96"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-nav dark:text-slate-300">Ambient Focus</h4>
                  <p className="mt-1 text-[12px] font-bold leading-relaxed text-gray-light dark:text-slate-400">
                    Choose a soft sound for writing without the menu leaving the screen.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-border/80 bg-white/75 text-gray-nav dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  aria-label="Close ambient sound choices"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2">
                {AMBIENT_PRESETS.map((preset) => {
                  const isPresetPlaying = activePresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        playPreset(preset);
                        setIsOpen(false);
                      }}
                      className={`w-full rounded-[22px] border p-4 text-left transition-all ${
                        isPresetPlaying
                          ? preset.colorClass
                          : 'border-transparent bg-slate-50/90 text-gray-text dark:bg-white/5 dark:text-slate-100'
                      }`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="text-[13px] font-black">{preset.name}</span>
                        {isPresetPlaying ? <Pause size={16} /> : <Play size={16} />}
                      </span>
                      <span className="mt-1 block text-[11px] font-bold opacity-75">{preset.description}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
