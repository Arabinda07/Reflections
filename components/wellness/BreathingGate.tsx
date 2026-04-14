import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind } from 'lucide-react';

interface BreathingGateProps {
  active: boolean;
  durationMs: number;
  onComplete: () => void;
}

export const BreathingGate: React.FC<BreathingGateProps> = ({ active, durationMs, onComplete }) => {
  useEffect(() => {
    if (!active) return;

    const timer = window.setTimeout(onComplete, durationMs);
    return () => window.clearTimeout(timer);
  }, [active, durationMs, onComplete]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
          className="fixed inset-0 z-[300] flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,#F5FFF8_0%,#ECFEFF_42%,#FFFFFF_100%)] px-6"
        >
          <motion.div
            className="absolute h-[28rem] w-[28rem] rounded-full bg-emerald-200/20 blur-3xl"
            animate={{ scale: [0.85, 1.12, 0.85], opacity: [0.35, 0.65, 0.35] }}
            transition={{ duration: durationMs / 1000, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute h-[20rem] w-[20rem] rounded-full bg-sky-200/20 blur-2xl"
            animate={{ scale: [1.08, 0.92, 1.08], opacity: [0.45, 0.25, 0.45] }}
            transition={{ duration: durationMs / 1000, ease: 'easeInOut' }}
          />

          <div className="relative flex flex-col items-center text-center">
            <motion.div
              className="relative mb-8 flex h-52 w-52 items-center justify-center rounded-full border border-sky-200/70 bg-white/50 shadow-[0_30px_80px_-40px_rgba(14,165,233,0.55)] backdrop-blur-2xl"
              animate={{ scale: [0.82, 1.08, 0.82] }}
              transition={{ duration: durationMs / 1000, ease: 'easeInOut' }}
            >
              <motion.div
                className="absolute inset-5 rounded-full border border-emerald-200/80 bg-emerald-100/20"
                animate={{ scale: [0.9, 1.18, 0.9], opacity: [0.35, 0.75, 0.35] }}
                transition={{ duration: durationMs / 1000, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute inset-12 rounded-full bg-sky-100/60"
                animate={{ scale: [1, 0.82, 1], opacity: [0.55, 0.85, 0.55] }}
                transition={{ duration: durationMs / 1000, ease: 'easeInOut' }}
              />
              <Wind size={42} className="relative text-sky-500/70" />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: [0, 1, 1, 0], y: [8, 0, 0, -4] }}
              transition={{ duration: durationMs / 1000, ease: 'easeInOut' }}
              className="font-display text-[20px] lowercase tracking-wide text-gray-text"
            >
              take a soft breath
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
