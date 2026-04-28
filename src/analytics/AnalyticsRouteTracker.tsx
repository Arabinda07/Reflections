import React, { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { useLocation } from 'react-router-dom';
import { captureAnalyticsEventDeferred } from './deferredEvents';
import { createScreenViewTracker } from './screenTracking';

export const AnalyticsRouteTracker: React.FC = () => {
  const location = useLocation();
  const trackerRef = useRef(
    createScreenViewTracker({
      capture: captureAnalyticsEventDeferred,
      isNative: Capacitor.isNativePlatform(),
    }),
  );

  useEffect(() => {
    trackerRef.current({
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
    });
  }, [location.hash, location.pathname, location.search]);

  return null;
};
