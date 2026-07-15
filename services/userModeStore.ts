import type { UserMode } from './privateMode';

let currentUserMode: UserMode | null = null;

export const setCurrentUserMode = (mode: UserMode | null) => {
  currentUserMode = mode;
};

export const isUserModeInitialized = (): boolean => currentUserMode !== null;

export const getCurrentUserMode = (): UserMode => {
  if (currentUserMode === null) {
    throw new Error(
      'getCurrentUserMode() called before UserModeContext initialized. ' +
      'Ensure UserModeProvider has loaded before accessing user mode.',
    );
  }
  return currentUserMode;
};
