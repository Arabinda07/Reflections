import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CloudOff, CloudLightning } from 'lucide-react';
import { useNetworkState } from '../../hooks/useNetworkState';

export const SyncBanner: React.FC = () => {
  const isOnline = useNetworkState();
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
    // Auto-hide the success banner after 4 seconds to give user time to read
    if (showBanner && bannerMode === 'recovery') {
      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showBanner, bannerMode]);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          key="sync-banner"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="fixed top-[80px] left-0 right-0 z-[90] flex justify-center pointer-events-none px-4"
        >
          <div
            className={`
              flex items-center gap-3 px-4 py-3 rounded-2xl border-2 shadow-2xl backdrop-blur-2xl liquid-glass
              ${bannerMode === 'offline' 
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:bg-[#1E1E1E]/80 dark:border-amber-500/30 dark:text-amber-400'
                : 'bg-green/10 border-green/20 text-green-700 dark:bg-[#1E1E1E]/80 dark:border-green/30 dark:text-green-400'
              }
            `}
            style={{ WebkitBackdropFilter: 'blur(20px)' }}
          >
            {bannerMode === 'offline' ? (
              <CloudOff size={18} className="shrink-0" />
            ) : (
              <CloudLightning size={18} className="shrink-0" />
            )}
            
            <span className="font-sans text-[12px] font-bold tracking-wide">
              {bannerMode === 'offline' 
                ? 'Offline. Notes saved securely to this device. Connect to sync.'
                : 'Online. Notes synced to sanctuary.'
              }
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
