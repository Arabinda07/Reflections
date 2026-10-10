import type { Note } from '../types';
import { vectorStore } from './embedding/vectorStore';
import { getMoodAnchorVectors } from './moodIntelligence';
import {
  MOOD_PICKER_GROUPS,
  type MoodGroupId,
  type MoodName,
} from '../pages/dashboard/moodConfig';

export interface MoodFamilyProportions {
  light: number;
  steady: number;
  charged: number;
  heavy: number;
  mixed: number;
}

export interface MindsetDriftReport {
  hasSufficientData: boolean;
  currentWindowNoteCount: number;
  previousWindowNoteCount: number;
  driftDistance: number;
  driftAngleDegrees: number;
  currentFamilyProportions: MoodFamilyProportions;
  previousFamilyProportions: MoodFamilyProportions | null;
  dominantCurrentFamily: MoodGroupId;
  trajectorySummary: string;
}

/**
 * Computes the normalized centroid vector from a collection of L2-normalized vectors.
 * Returns null if the collection is empty.
 */
export function computeCentroid(vectors: Float32Array[]): Float32Array | null {
  if (vectors.length === 0) return null;
  const dim = vectors[0].length;
  const sum = new Float32Array(dim);

  for (const vec of vectors) {
    if (vec.length !== dim) continue;
    for (let i = 0; i < dim; i++) {
      sum[i] += vec[i];
    }
  }

  // Calculate L2 norm
  let normSq = 0;
  for (let i = 0; i < dim; i++) {
    normSq += sum[i] * sum[i];
  }

  const norm = Math.sqrt(normSq);
  if (norm === 0 || Number.isNaN(norm)) return null;

  const centroid = new Float32Array(dim);
  for (let i = 0; i < dim; i++) {
    centroid[i] = sum[i] / norm;
  }

  return centroid;
}

/**
 * Projects a unit vector onto the 5 Mood Families by averaging its cosine similarity
 * against the anchors in each group, then normalizing the positive components to 100%.
 */
export function projectVectorToFamilies(
  vector: Float32Array,
  anchors: Map<MoodName, Float32Array>,
): MoodFamilyProportions {
  const familyRawScores: Record<MoodGroupId, number[]> = {
    light: [],
    steady: [],
    charged: [],
    heavy: [],
    mixed: [],
  };

  for (const group of MOOD_PICKER_GROUPS) {
    for (const moodName of group.options) {
      const anchorVec = anchors.get(moodName);
      if (anchorVec && anchorVec.length === vector.length) {
        const sim = vectorStore.cosineSimilarity(vector, anchorVec);
        familyRawScores[group.id].push(sim);
      }
    }
  }

  // Calculate positive averages
  const familyAverages: Record<MoodGroupId, number> = {
    light: 0,
    steady: 0,
    charged: 0,
    heavy: 0,
    mixed: 0,
  };

  let totalPositive = 0;
  for (const group of MOOD_PICKER_GROUPS) {
    const scores = familyRawScores[group.id];
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    // Floor at 0.01 to ensure a balanced, non-zero representation
    const clamped = Math.max(0.01, avg);
    familyAverages[group.id] = clamped;
    totalPositive += clamped;
  }

  const result: MoodFamilyProportions = {
    light: Math.round((familyAverages.light / totalPositive) * 100),
    steady: Math.round((familyAverages.steady / totalPositive) * 100),
    charged: Math.round((familyAverages.charged / totalPositive) * 100),
    heavy: Math.round((familyAverages.heavy / totalPositive) * 100),
    mixed: Math.round((familyAverages.mixed / totalPositive) * 100),
  };

  // Adjust rounding drift so it sums to exactly 100
  const sum = result.light + result.steady + result.charged + result.heavy + result.mixed;
  if (sum !== 100) {
    result.steady += 100 - sum;
  }

  return result;
}

/**
 * Synthesizes an observant, compassionate narrative summarizing mindset drift.
 */
function buildTrajectoryProse(
  dominant: MoodGroupId,
  previousProportions: MoodFamilyProportions | null,
  currentProportions: MoodFamilyProportions,
  driftDegrees: number,
): string {
  if (!previousProportions) {
    switch (dominant) {
      case 'steady':
        return 'Your writing this month reflects an overarching sense of quiet stillness and grounded balance.';
      case 'light':
        return 'Your reflections carry bright moments of warmth, celebration, and gratitude.';
      case 'charged':
        return 'Your reflections hold higher intensity and fast-moving mental energy right now.';
      case 'heavy':
        return 'Your words have gathered around tender, quieter reflections lately.';
      case 'mixed':
      default:
        return 'Your writing explores nuanced, multifaceted themes with room for emotional complexity.';
    }
  }

  // Measure delta in percentages
  const steadyDelta = currentProportions.steady - previousProportions.steady;
  const lightDelta = currentProportions.light - previousProportions.light;
  const chargedDelta = currentProportions.charged - previousProportions.charged;
  const heavyDelta = currentProportions.heavy - previousProportions.heavy;

  if (driftDegrees < 8) {
    return 'Your mindset has remained centered in a remarkably consistent, familiar rhythm over recent weeks.';
  }

  if (steadyDelta >= 8) {
    return 'Your thoughts have noticeably settled into greater calm and spaciousness compared to last month.';
  }

  if (lightDelta >= 8) {
    return 'A warmer, more uplifting current has been steadily emerging in your reflections.';
  }

  if (chargedDelta >= 8) {
    return 'There has been more active tension and mental speed in your writing—a reminder to pause when needed.';
  }

  if (heavyDelta >= 8) {
    return 'Your recent entries carry deeper, quieter weight. Gentleness with yourself is well earned.';
  }

  return 'Your writing shows a gentle shift in focus, embracing fresh emotional perspective and depth.';
}

/**
 * Computes rolling monthly mindset drift and thought centroid trajectory from user notes.
 */
export async function computeMindsetDrift(
  notes: Note[],
  options?: { windowDays?: number },
): Promise<MindsetDriftReport> {
  const windowDays = options?.windowDays ?? 30;
  const now = Date.now();
  const windowMs = windowDays * 24 * 60 * 60 * 1000;

  const currentWindowNotes: Note[] = [];
  const previousWindowNotes: Note[] = [];

  for (const note of notes) {
    const noteTime = new Date(note.createdAt).getTime();
    if (Number.isNaN(noteTime)) continue;

    const age = now - noteTime;
    if (age <= windowMs) {
      currentWindowNotes.push(note);
    } else if (age <= windowMs * 2) {
      previousWindowNotes.push(note);
    }
  }

  // Fetch vectors for current window
  const currentVectors: Float32Array[] = [];
  for (const note of currentWindowNotes) {
    const record = await vectorStore.get(note.id);
    if (record?.vector && record.vector.length > 0) {
      currentVectors.push(record.vector);
    }
  }

  if (currentVectors.length < 2) {
    return {
      hasSufficientData: false,
      currentWindowNoteCount: currentWindowNotes.length,
      previousWindowNoteCount: previousWindowNotes.length,
      driftDistance: 0,
      driftAngleDegrees: 0,
      currentFamilyProportions: { light: 20, steady: 20, charged: 20, heavy: 20, mixed: 20 },
      previousFamilyProportions: null,
      dominantCurrentFamily: 'steady',
      trajectorySummary: 'Patterns in your thoughts will begin forming here as you save more reflections.',
    };
  }

  const currentCentroid = computeCentroid(currentVectors)!;

  // Fetch vectors for previous window
  const previousVectors: Float32Array[] = [];
  for (const note of previousWindowNotes) {
    const record = await vectorStore.get(note.id);
    if (record?.vector && record.vector.length > 0) {
      previousVectors.push(record.vector);
    }
  }

  const previousCentroid = computeCentroid(previousVectors);
  const anchors = await getMoodAnchorVectors();

  const currentProportions = projectVectorToFamilies(currentCentroid, anchors);
  const previousProportions = previousCentroid
    ? projectVectorToFamilies(previousCentroid, anchors)
    : null;

  // Find dominant family
  const families: MoodGroupId[] = ['light', 'steady', 'charged', 'heavy', 'mixed'];
  let dominant: MoodGroupId = 'steady';
  let maxPct = -1;
  for (const f of families) {
    if (currentProportions[f] > maxPct) {
      maxPct = currentProportions[f];
      dominant = f;
    }
  }

  let driftDistance = 0;
  let driftAngleDegrees = 0;

  if (previousCentroid) {
    const dot = vectorStore.cosineSimilarity(currentCentroid, previousCentroid);
    const clampedDot = Math.max(-1, Math.min(1, dot));
    driftDistance = Number((1 - clampedDot).toFixed(3));
    driftAngleDegrees = Math.round((Math.acos(clampedDot) * 180) / Math.PI);
  }

  const trajectorySummary = buildTrajectoryProse(
    dominant,
    previousProportions,
    currentProportions,
    driftAngleDegrees,
  );

  return {
    hasSufficientData: true,
    currentWindowNoteCount: currentVectors.length,
    previousWindowNoteCount: previousVectors.length,
    driftDistance,
    driftAngleDegrees,
    currentFamilyProportions: currentProportions,
    previousFamilyProportions: previousProportions,
    dominantCurrentFamily: dominant,
    trajectorySummary,
  };
}
