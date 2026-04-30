import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DownloadSimple, X } from '@phosphor-icons/react';
import { usePWAInstall } from '../../context/PWAInstallContext';
import { Button } from './Button';

const DISMISSED_KEY = 'reflections_pwa_prompt_dismissed';

interface PWAInstallPromptProps {
  /** Number of notes the user currently has */
  noteCount: number;
  /** Whether the user just came from a save action */
  isFromSave?: boolean;
}

/**
 * Contextual PWA install prompt shown after the user's first save.
 * Only appears on web (not Capacitor), and can be permanently dismissed.
 */
export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  noteCount,
  isFromSave = false,
}) => {
  const { canInstall, isInstalled, triggerInstall } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    // Only check after mount to avoid SSR issues
    setIsDismissed(localStorage.getItem(DISMISSED_KEY) === 'true');
  }, []);

  const shouldShow =
    canInstall &&
    !isInstalled &&
    !isDismissed &&
    isFromSave &&
    noteCount === 1;

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(DISMISSED_KEY, 'true');
  };

  const handleInstall = async () => {
    await triggerInstall();
    handleDismiss();
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="surface-floating surface-floating--strong !rounded-[24px] overflow-hidden p-6 space-y-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[15px] font-bold text-gray-text">
                Make this a nightly habit
              </p>
              <p className="text-[13px] font-medium text-gray-light leading-relaxed">
                Install it on your home screen
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-gray-nav transition-colors hover:bg-green/5 hover:text-gray-text"
              aria-label="Dismiss install prompt"
            >
              <X size={16} weight="regular" />
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={handleInstall}
            className="w-full h-11 rounded-xl"
          >
            <DownloadSimple size={16} weight="regular" className="mr-2" />
            Install Reflections
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
