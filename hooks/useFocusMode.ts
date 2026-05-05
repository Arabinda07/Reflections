import { useCallback, useState } from 'react';

interface FocusModeOptions {
  /** Whether the editor body is focused */
  isEditorFocused?: boolean;
  /** Whether the title input is focused */
  isTitleFocused?: boolean;
}

interface FocusModeState {
  /** Whether the user has toggled focus mode on */
  isEnabled: boolean;
  /** Whether focus mode is enabled AND active (not typing title) */
  isActive: boolean;
  /** Toggle focus mode on/off */
  toggle: () => void;
  /** Disable focus mode completely */
  disable: () => void;
}

/**
 * Manages the focus/zen mode behavior for the note editor.
 *
 * Zen mode is now a strict toggle. It only exits when the user explicitly disables it.
 * Title-focused typing suppresses the UI hiding temporarily so they can see what they're typing.
 */
export const useFocusMode = ({
  isTitleFocused,
}: FocusModeOptions = {}): FocusModeState => {
  const [isEnabled, setIsEnabled] = useState(false);

  const toggle = useCallback(() => {
    setIsEnabled((current) => !current);
  }, []);

  const disable = useCallback(() => {
    setIsEnabled(false);
  }, []);

  return {
    isEnabled,
    isActive: isEnabled && !isTitleFocused,
    toggle,
    disable,
  };
};
