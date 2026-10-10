import type { Note } from '../../../types';
import type { AttachmentModality } from './multimodalTypes';
import { imageEmbedder } from './imageEmbedder';
import { audioEmbedder } from './audioEmbedder';

export const multimodalEmbedder = {
  /**
   * Determine the predominant modality of a reflection.
   */
  detectModality(note: Note): AttachmentModality {
    const hasImage = Boolean(
      note.thumbnailUrl ||
        note.attachments?.some((a) => a.type?.startsWith('image/')),
    );
    const hasAudio = Boolean(
      note.attachments?.some((a) => a.type?.startsWith('audio/')),
    );
    const hasText = Boolean(note.content && note.content.trim().length > 30);

    if ((hasImage && hasAudio) || ((hasImage || hasAudio) && hasText)) {
      return 'unified';
    }
    if (hasAudio) return 'audio';
    if (hasImage) return 'image';
    return 'text';
  },

  /**
   * Compute a multimodal feature vector from note media attachments.
   * If note lacks media, returns null.
   */
  embedMedia(note: Note, targetDim = 256): Float32Array | null {
    const modality = this.detectModality(note);
    if (modality === 'text') {
      return null;
    }

    const vectors: Float32Array[] = [];

    // Process image attachments or thumbnail
    const hasImage = Boolean(
      note.thumbnailUrl ||
        note.attachments?.some((a) => a.type?.startsWith('image/')),
    );
    if (hasImage) {
      const imgFeatures = imageEmbedder.extractFeatures(1200, 800);
      vectors.push(imageEmbedder.projectToVector(imgFeatures, targetDim));
    }

    // Process audio attachments
    const audioAttachment = note.attachments?.find((a) => a.type?.startsWith('audio/'));
    if (audioAttachment) {
      const durationSeconds = audioAttachment.size ? Math.max(10, Math.min(300, audioAttachment.size / 16000)) : 30;
      const audioFeatures = audioEmbedder.extractFeatures(durationSeconds);
      vectors.push(audioEmbedder.projectToVector(audioFeatures, targetDim));
    }

    if (vectors.length === 0) {
      return null;
    }

    // Blend vectors with L2 normalization
    const blended = new Float32Array(targetDim);
    let sumSq = 0;
    for (let i = 0; i < targetDim; i++) {
      let sum = 0;
      for (const v of vectors) {
        sum += v[i];
      }
      const avg = sum / vectors.length;
      blended[i] = avg;
      sumSq += avg * avg;
    }

    const norm = Math.sqrt(sumSq);
    if (norm > 1e-12) {
      for (let i = 0; i < targetDim; i++) {
        blended[i] = blended[i] / norm;
      }
    }

    return blended;
  },

  /**
   * Blend a text vector with media vector using weighted harmonic combination.
   */
  blendTextAndMedia(
    textVector: Float32Array,
    mediaVector: Float32Array,
    textWeight = 0.6,
  ): Float32Array {
    const dim = textVector.length;
    const mediaDim = mediaVector.length;
    if (dim !== mediaDim || dim === 0) {
      return textVector;
    }

    const blended = new Float32Array(dim);
    let sumSq = 0;
    const mediaWeight = 1 - textWeight;

    for (let i = 0; i < dim; i++) {
      const val = textVector[i] * textWeight + mediaVector[i] * mediaWeight;
      blended[i] = val;
      sumSq += val * val;
    }

    const norm = Math.sqrt(sumSq);
    if (norm > 1e-12) {
      for (let i = 0; i < dim; i++) {
        blended[i] = blended[i] / norm;
      }
    }

    return blended;
  },
};
