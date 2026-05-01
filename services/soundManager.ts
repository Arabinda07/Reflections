import { Howl } from 'howler';

// Since the user doesn't have the audio assets yet, we'll use placeholder paths.
// The user can drop the real files into public/assets/sounds/ later.
const SOUND_ASSETS = {
  save: '/assets/sounds/save-note.mp3',         // soft paper tap + low felt click (80–160ms)
  openPanel: '/assets/sounds/open-panel.mp3',   // warm breathy swell (180–300ms)
  closePanel: '/assets/sounds/close-panel.mp3', // reverse soft swell (150–250ms)
  aiStart: '/assets/sounds/ai-start.mp3',       // quiet glass/air shimmer (300–600ms)
  error: '/assets/sounds/error-tick.mp3',       // low muted wood tick, not alarm (120–220ms)
};

// Map of Howl instances
const sounds: Record<string, Howl> = {};

export const initSounds = () => {
  if (typeof window !== 'undefined' && Object.keys(sounds).length === 0) {
    sounds.save = new Howl({ src: [SOUND_ASSETS.save], preload: true, volume: 0.6 });
    sounds.openPanel = new Howl({ src: [SOUND_ASSETS.openPanel], preload: true, volume: 0.4 });
    sounds.closePanel = new Howl({ src: [SOUND_ASSETS.closePanel], preload: true, volume: 0.4 });
    sounds.aiStart = new Howl({ src: [SOUND_ASSETS.aiStart], preload: true, volume: 0.5 });
    sounds.error = new Howl({ src: [SOUND_ASSETS.error], preload: true, volume: 0.7 });
  }
};

export type SoundMoment = 'save' | 'openPanel' | 'closePanel' | 'aiStart' | 'error';

/**
 * Play a specific UI sound.
 * Fails silently if the sound file is missing (e.g., placeholder state).
 */
export const playSound = (moment: SoundMoment) => {
  initSounds(); // Ensure initialization
  if (sounds[moment]) {
    try {
      sounds[moment].play();
    } catch (e) {
      console.warn(`[SoundManager] Failed to play sound: ${moment}`);
    }
  }
};
