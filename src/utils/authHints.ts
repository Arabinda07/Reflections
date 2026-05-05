export const hasStoredAuthSessionHint = (): boolean => {
  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);

      if (key?.startsWith('sb-') && key.endsWith('-auth-token')) {
        return true;
      }
    }
  } catch (error) {
    console.warn('Could not inspect local auth storage.', error);
  }

  return false;
};
