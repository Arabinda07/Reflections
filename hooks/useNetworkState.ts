import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';

/**
 * useNetworkState
 * 
 * Actively tracks connectivity using Capacitor Network API.
 * This is more reliable than navigator.onLine for mobile-hybrid apps.
 */
export const useNetworkState = () => {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    // Initial check
    Network.getStatus().then(status => {
      setIsOnline(status.connected);
    });

    // Listen for changes
    const listener = Network.addListener('networkStatusChange', status => {
      setIsOnline(status.connected);
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, []);

  return isOnline;
};
