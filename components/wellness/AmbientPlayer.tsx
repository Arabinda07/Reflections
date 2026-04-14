import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Headphones, Pause, Play } from 'lucide-react';
import { Button } from '../ui/Button';

interface AmbientPlayerProps {
  isEditorFocused: boolean;
}

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
    colorClass: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    baseFrequency: 174,
    modulationFrequency: 0.07,
    filterFrequency: 520,
    waveform: 'sine',
  },
  {
    id: 'soft-hum',
    name: 'Soft Hum',
    description: 'Warm focus without rhythm',
    colorClass: 'bg-sky-50 text-sky-600 border-sky-100',
    baseFrequency: 220,
    modulationFrequency: 0.05,
    filterFrequency: 430,
    waveform: 'triangle',
  },
  {
    id: 'quiet-tide',
    name: 'Quiet Tide',
    description: 'A slow breathing wash',
    colorClass: 'bg-teal-50 text-teal-600 border-teal-100',
    baseFrequency: 196,
    modulationFrequency: 0.04,
    filterFrequency: 360,
    waveform: 'sine',
  },
];

export const AmbientPlayer: React.FC<AmbientPlayerProps> = ({ isEditorFocused }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{
    carrier: OscillatorNode;
    companion: OscillatorNode;
    modulator: OscillatorNode;
    modulationGain: GainNode;
    filter: BiquadFilterNode;
    gain: GainNode;
  } | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const stopPreset = useCallback(() => {
    const context = audioContextRef.current;
    const nodes = nodesRef.current;

    if (context && nodes) {
      const fadeEnd = context.currentTime + 0.35;
      nodes.gain.gain.cancelScheduledValues(context.currentTime);
      nodes.gain.gain.setValueAtTime(nodes.gain.gain.value, context.currentTime);
      nodes.gain.gain.linearRampToValueAtTime(0.0001, fadeEnd);

      window.setTimeout(() => {
        try {
          nodes.carrier.stop();
          nodes.companion.stop();
          nodes.modulator.stop();
        } catch {
          // The Web Audio nodes may already be stopped if the user switches quickly.
        }
        if (nodesRef.current === nodes) {
          nodesRef.current = null;
        }
      }, 400);
    }

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
    modulationGain.gain.value = 18;
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
    gain.gain.linearRampToValueAtTime(0.026, context.currentTime + 0.8);

    nodesRef.current = { carrier, companion, modulator, modulationGain, filter, gain };
    setActivePresetId(preset.id);
  }, [activePresetId, getAudioContext, stopPreset]);

  useEffect(() => {
    if (isEditorFocused) {
      setIsOpen(false);
    }
  }, [isEditorFocused]);

  useEffect(() => {
    return () => {
      stopPreset();
      audioContextRef.current?.close();
      audioContextRef.current = null;
    };
  }, [stopPreset]);

  const isPlaying = activePresetId !== null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={`mr-2 hidden border border-transparent sm:flex ${
          isPlaying ? 'bg-sky-50 text-sky-600' : 'text-gray-nav hover:bg-emerald-50 hover:text-emerald-600'
        }`}
        title="Ambient sound"
      >
        <Headphones size={16} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-0 top-full z-[100] mt-2 w-[250px] rounded-2xl border border-sky-100 bg-white/95 p-4 shadow-[0_20px_60px_-35px_rgba(14,165,233,0.7)] backdrop-blur-2xl"
          >
            <h4 className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-nav">Ambient Focus</h4>
            <p className="mb-4 text-[11px] font-bold leading-relaxed text-gray-light">Quiet tones for a softer writing room.</p>

            <div className="space-y-2">
              {AMBIENT_PRESETS.map((preset) => {
                const isPresetPlaying = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => playPreset(preset)}
                    className={`w-full rounded-xl border p-3 text-left transition-all ${
                      isPresetPlaying
                        ? preset.colorClass
                        : 'border-transparent bg-gray-50/80 text-gray-text hover:border-sky-100 hover:bg-sky-50/60'
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
      </AnimatePresence>
    </div>
  );
};
