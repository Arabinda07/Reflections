/**
 * AudioEngine
 * 
 * A singleton service for managing gapless, offline-ready ambient audio
 * using the Web Audio API.
 */
class AudioEngine {
  private context: AudioContext | null = null;
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private activeSources: Map<string, { source: AudioBufferSourceNode; gain: GainNode }> = new Map();
  private masterGain: GainNode | null = null;

  constructor() {
    // We don't initialize context here because of the required user gesture.
  }

  private initContext() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
    return { context: this.context, masterGain: this.masterGain! };
  }

  /**
   * Pre-load an audio file into the cache.
   */
  async loadBuffer(url: string): Promise<AudioBuffer> {
    if (this.bufferCache.has(url)) {
      return this.bufferCache.get(url)!;
    }

    const { context } = this.initContext();
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch audio: ${url}`);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await context.decodeAudioData(arrayBuffer);
      this.bufferCache.set(url, audioBuffer);
      return audioBuffer;
    } catch (error) {
      console.error('AudioEngine: Error loading buffer', error);
      throw error;
    }
  }

  /**
   * Play a track with a 2-second fade-in.
   */
  async play(id: string, url: string, targetVolume: number) {
    const { context, masterGain } = this.initContext();
    
    // Stop existing instance of this ID if any (unlikely for ambient but safe)
    this.stop(id, 0);

    let buffer: AudioBuffer;
    try {
      buffer = await this.loadBuffer(url);
    } catch (e) {
      return; // Error logged in loadBuffer
    }

    const source = context.createBufferSource();
    const gainNode = context.createGain();

    source.buffer = buffer;
    source.loop   = true;
    
    // UX ENVELOPE: 2 second fade-in
    gainNode.gain.setValueAtTime(0, context.currentTime);
    gainNode.gain.linearRampToValueAtTime(targetVolume, context.currentTime + 2.0);

    source.connect(gainNode);
    gainNode.connect(masterGain);
    
    source.start(0);
    this.activeSources.set(id, { source, gain: gainNode });
  }

  /**
   * Stop a track with a 1.5-second fade-out.
   */
  stop(id: string, fadeDuration = 1.5) {
    const sourceData = this.activeSources.get(id);
    if (!sourceData) return;

    const { source, gain } = sourceData;
    const { context } = this.initContext();

    // UX ENVELOPE: 1.5 second fade-out
    gain.gain.cancelScheduledValues(context.currentTime);
    gain.gain.setValueAtTime(gain.gain.value, context.currentTime);
    gain.gain.linearRampToValueAtTime(0, context.currentTime + fadeDuration);

    source.stop(context.currentTime + fadeDuration + 0.1);
    
    // Clean up after fade
    setTimeout(() => {
      if (this.activeSources.get(id)?.source === source) {
        this.activeSources.delete(id);
      }
    }, (fadeDuration + 0.2) * 1000);
  }

  /**
   * Stop everything immediately or with fade.
   */
  stopAll(fadeDuration = 1.5) {
    this.activeSources.forEach((_, id) => this.stop(id, fadeDuration));
  }

  setVolume(volume: number) {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(volume, this.context?.currentTime || 0, 0.1);
    }
  }

  isPlaying(id: string): boolean {
    return this.activeSources.has(id);
  }
}

export const audioEngine = new AudioEngine();
