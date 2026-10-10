/**
 * Multimodal Embedding & Semantic Feature Contracts.
 *
 * Defines shared interfaces for cross-modal indexing across written reflections,
 * voice memo recordings, and image attachments.
 *
 * Reference: ADR 0004 §5.A & AI Roadmap Phase 6
 */

export type AttachmentModality = 'text' | 'image' | 'audio' | 'unified';

export interface ImageSemanticFeatures {
  warmthScore: number;
  luminosity: number;
  paletteHarmony: number;
  aspectRatio: number;
  width: number;
  height: number;
}

export interface AudioAcousticFeatures {
  durationSeconds: number;
  energyVariance: number;
  pitchCentroid: number;
  tempoCadence: number;
  silenceRatio: number;
}

export interface MultimodalFeaturePayload {
  modality: AttachmentModality;
  attachmentId?: string;
  noteId: string;
  caption?: string;
  imageFeatures?: ImageSemanticFeatures;
  audioFeatures?: AudioAcousticFeatures;
}

export interface MultimodalMatch {
  noteId: string;
  modality: AttachmentModality;
  score: number;
  attachmentId?: string;
  attachmentName?: string;
  previewUrl?: string;
}
