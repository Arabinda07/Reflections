import React, { useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Wind } from 'lucide-react';

interface BreathingGateProps {
  active: boolean;
  durationMs: number;
  onComplete: () => void;
}

export const BreathingGate: React.FC<BreathingGateProps> = ({ active, durationMs, onComplete }) => {
  const shouldReduceMotion = useReducedMotion();
  const breathEase = [0.4, 0, 0.2, 1];

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
          className="fixed inset-0 z-[300] flex items-center justify-center overflow-hidden bg-white/95 backdrop-blur-md px-6 dark:bg-[#121212]/95"
        >
          <div className="relative flex flex-col items-center text-center">
            <motion.div
              className="relative mb-8 flex h-48 w-48 items-center justify-center rounded-full border border-border bg-gray-50 shadow-sm dark:border-white/10 dark:bg-white/5"
              animate={{ scale: shouldReduceMotion ? 1 : [0.95, 1.05, 0.95], opacity: shouldReduceMotion ? 1 : [0.7, 1, 0.7] }}
              transition={{ duration: durationMs / 1000, ease: breathEase }}
            >
              <Wind size={36} className="relative text-gray-nav opacity-50 dark:text-slate-400" />
            </motion.div>

            <motion.p
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={shouldReduceMotion ? { opacity: [0, 1, 1, 0] } : { opacity: [0, 1, 1, 0], y: [8, 0, 0, -4] }}
              transition={{ duration: durationMs / 1000, ease: breathEase }}
              className="font-display text-[20px] lowercase tracking-wide text-gray-text dark:text-slate-100"
            >
              take a soft breath
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
