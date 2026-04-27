import { useEffect } from 'react';

type KeyCombo = {
  key: string;
  ctrlOrCmd?: boolean;
  shift?: boolean;
  alt?: boolean;
};

export const useKeyboardShortcut = (
  combo: KeyCombo,
  callback: (e: KeyboardEvent) => void,
  dependencies: any[] = []
) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrlOrCmdPressed = event.ctrlKey || event.metaKey;
      const isShiftPressed = event.shiftKey;
      const isAltPressed = event.altKey;

      if (
        event.key.toLowerCase() === combo.key.toLowerCase() &&
        (combo.ctrlOrCmd === undefined || combo.ctrlOrCmd === isCtrlOrCmdPressed) &&
        (combo.shift === undefined || combo.shift === isShiftPressed) &&
        (combo.alt === undefined || combo.alt === isAltPressed)
      ) {
        event.preventDefault();
        callback(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [combo.key, combo.ctrlOrCmd, combo.shift, combo.alt, ...dependencies]);
};
