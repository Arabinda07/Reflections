import { useEffect, useRef, useState, useCallback } from 'react';
import { useMediaQuery } from './useMediaQuery';

interface FocusModeOptions {
  /** Whether the editor body is focused */
  isEditorFocused: boolean;
  /** Whether the title input is focused */
  isTitleFocused: boolean;
}

interface FocusModeState {
  /** Whether the user has toggled focus mode on */
  isEnabled: boolean;
  /** Whether focus mode is enabled AND the user is actively flowing (typing) */
  isActive: boolean;
  /** Toggle focus mode on/off */
  toggle: () => void;
  /** Disable focus mode completely */
  disable: () => void;
}

/**
 * Manages the focus/flow mode behavior for the note editor.
 *
 * When enabled, the UI enters "flow" state after keystrokes and exits
 * when the user moves the mouse, touches the screen, or is idle for 5s.
 * Title-focused typing does not trigger flow.
 */
export const useFocusMode = ({
  isEditorFocused,
  isTitleFocused,
}: FocusModeOptions): FocusModeState => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isFlowing, setIsFlowing] = useState(false);
  const isMobile = useMediaQuery('(max-width: 1023px)');

  const flowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUnmountedRef = useRef(false);
  const lastToggleRef = useRef<number>(0);

  useEffect(() => {
    isUnmountedRef.current = false;
    return () => {
      isUnmountedRef.current = true;
    };
  }, []);

  // Kill flow state when focus mode is disabled
  useEffect(() => {
    if (isEnabled) return;
    if (flowTimeoutRef.current) clearTimeout(flowTimeoutRef.current);
    if (isFlowing) setIsFlowing(false);
  }, [isFlowing, isEnabled]);

  // Keyboard + mouse/touch listeners for flow state
  useEffect(() => {
    if (!isEnabled) return;

    const handleWake = () => {
      // Grace period of 1s after toggling to prevent immediate wake from click
      if (Date.now() - lastToggleRef.current < 1000) return;

      if (flowTimeoutRef.current) clearTimeout(flowTimeoutRef.current);
      if (isFlowing) setIsFlowing(false);
    };

    const handleKeydown = (e: KeyboardEvent) => {
      if (!isEditorFocused && !isTitleFocused) return;
      if (e.key === 'Escape') return handleWake();
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
        if (isTitleFocused) return; // Don't flow while typing title
        setIsFlowing(true);
        if (flowTimeoutRef.current) clearTimeout(flowTimeoutRef.current);
        if (!isMobile) {
          flowTimeoutRef.current = setTimeout(() => {
            if (!isUnmountedRef.current) setIsFlowing(false);
          }, 5000);
        }
      }
    };

    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('mousemove', handleWake);
    window.addEventListener('touchstart', handleWake, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('mousemove', handleWake);
      window.removeEventListener('touchstart', handleWake);
    };
  }, [isEnabled, isEditorFocused, isTitleFocused, isFlowing, isMobile]);

  const toggle = useCallback(() => {
    setIsEnabled((current) => {
      const next = !current;
      if (!next) {
        setIsFlowing(false);
      } else {
        setIsFlowing(true);
        lastToggleRef.current = Date.now();
      }
      return next;
    });
  }, []);

  const disable = useCallback(() => {
    setIsFlowing(false);
    setIsEnabled(false);
  }, []);

  return {
    isEnabled,
    isActive: isEnabled && isFlowing && !isTitleFocused,
    toggle,
    disable,
  };
};
