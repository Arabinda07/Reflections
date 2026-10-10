/**
 * Asymmetric Prefix Framing for Multimodal Media.
 *
 * Maps images and audio reflections into standard structured text representations
 * compatible with semantic embedding encoders.
 */

export const formatImageCaption = (
  title: string,
  caption?: string,
  tags: string[] = [],
): string => {
  const parts = [`VisualMemory: ${title.trim() || 'Untitled Photo'}`];
  if (caption && caption.trim()) {
    parts.push(caption.trim());
  } else {
    parts.push('Photographic journal memory');
  }
  if (tags.length > 0) {
    parts.push(`tags: ${tags.join(', ')}`);
  }
  return parts.join(' | ');
};

export const formatVoiceMemo = (
  title: string,
  durationSeconds = 0,
  transcript?: string,
): string => {
  const parts = [`AudioReflection: ${title.trim() || 'Untitled Voice Memo'}`];
  if (durationSeconds > 0) {
    parts.push(`duration: ${Math.round(durationSeconds)}s`);
  }
  if (transcript && transcript.trim()) {
    parts.push(transcript.trim());
  } else {
    parts.push('Spoken introspective audio note');
  }
  return parts.join(' | ');
};
