import { describe, it, expect } from 'vitest';
import { multimodalEmbedder } from './multimodalEmbedder';
import type { Note } from '../../../types';

describe('multimodalEmbedder', () => {
  const baseNote: Note = {
    id: 'note-1',
    title: 'Autumn Rain',
    content: 'Watching the quiet precipitation through the window.',
    createdAt: '2026-10-10T10:00:00Z',
    updatedAt: '2026-10-10T10:00:00Z',
  };

  it('detects text modality when no media is attached', () => {
    expect(multimodalEmbedder.detectModality(baseNote)).toBe('text');
    expect(multimodalEmbedder.embedMedia(baseNote)).toBeNull();
  });

  it('detects image modality and computes image vector', () => {
    const imgNote: Note = {
      ...baseNote,
      content: '',
      thumbnailUrl: 'https://example.com/rain.jpg',
    };
    expect(multimodalEmbedder.detectModality(imgNote)).toBe('image');

    const vector = multimodalEmbedder.embedMedia(imgNote, 256);
    expect(vector).not.toBeNull();
    expect(vector?.length).toBe(256);
  });

  it('detects audio modality and computes audio vector', () => {
    const audioNote: Note = {
      ...baseNote,
      content: '',
      attachments: [
        { id: 'att-1', name: 'rain_memo.webm', path: 'notes/1/rain.webm', size: 32000, type: 'audio/webm' },
      ],
    };
    expect(multimodalEmbedder.detectModality(audioNote)).toBe('audio');

    const vector = multimodalEmbedder.embedMedia(audioNote, 256);
    expect(vector).not.toBeNull();
    expect(vector?.length).toBe(256);
  });

  it('detects unified modality when note has both text and media', () => {
    const unifiedNote: Note = {
      ...baseNote,
      thumbnailUrl: 'https://example.com/fog.jpg',
    };
    expect(multimodalEmbedder.detectModality(unifiedNote)).toBe('unified');
  });

  it('blends text and media vectors with unit normalization', () => {
    const v1 = new Float32Array([1, 0, 0, 0]);
    const v2 = new Float32Array([0, 1, 0, 0]);
    const blended = multimodalEmbedder.blendTextAndMedia(v1, v2, 0.6);

    let sumSq = 0;
    for (let i = 0; i < blended.length; i++) {
      sumSq += blended[i] * blended[i];
    }
    expect(Math.sqrt(sumSq)).toBeCloseTo(1.0, 4);
    expect(blended[0]).toBeGreaterThan(blended[1]); // 0.6 weight > 0.4 weight
  });
});
