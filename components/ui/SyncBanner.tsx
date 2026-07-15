import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { CloudCheck } from '@phosphor-icons/react/CloudCheck';
import { CloudSlash } from '@phosphor-icons/react/CloudSlash';
import { useNetworkState } from '../../hooks/useNetworkState';

export const SyncBanner: React.FC = () => {
  const isOnline = useNetworkState();
  const prefersReducedMotion = useReducedMotion();
  const [showBanner, setShowBanner] = useState(false);
  const [bannerMode, setBannerMode] = useState<'offline' | 'recovery'>('offline');

  useEffect(() => {
    // If we drop offline, instantly show the offline warning
    if (!isOnline) {
      setBannerMode('offline');
      setShowBanner(true);
    } 
    // If we regain connection while the banner is showing, switch to recovery state
    else if (isOnline && showBanner && bannerMode === 'offline') {
      setBannerMode('recovery');
    }
  }, [isOnline, showBanner, bannerMode]);

  useEffect(() => {
    // Auto-hide the banner to prevent it from cluttering the sanctuary
    if (showBanner) {
      const duration = 3000;
      const timer = setTimeout(() => {
        setShowBanner(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [showBanner, bannerMode]);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          key="sync-banner"
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -20, scale: 0.95 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: prefersReducedMotion ? 0.15 : 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-[80px] left-0 right-0 z-[90] flex justify-center pointer-events-none px-4"
          role="alert"
          aria-live="assertive"
        >
          <div
            className={`
              surface-inline-panel flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-2xl
              ${bannerMode === 'offline' 
                ? 'border-clay/25 text-clay'
                : 'border-green/25 text-green'
              }
            `}
          >
            {bannerMode === 'offline' ? (
              <CloudSlash size={20} weight="bold" className="shrink-0" />
            ) : (
              <CloudCheck size={20} weight="bold" className="shrink-0" />
            )}
            
            <span className="font-sans text-ui-xs font-bold tracking-wide">
              {bannerMode === 'offline' 
                ? 'Offline. Changes are saved securely to this device.'
                : 'Online. Secure sync is available again.'
              }
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
