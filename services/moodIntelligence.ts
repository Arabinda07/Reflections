import {
  MOOD_ANCHOR_DEFINITIONS,
  HEAVY_OR_CHARGED_FAMILIES,
  RESTORATIVE_MOOD_FAMILIES,
} from './moodAnchors';
import {
  MOOD_OPTIONS,
  getMoodConfig,
  getMoodGroupForMood,
  type MoodGroupId,
  type MoodName,
  type MoodValue,
} from '../pages/dashboard/moodConfig';
import { embeddingService } from './embedding/embeddingService';
import { vectorStore } from './embedding/vectorStore';
import type { SupportedEmbeddingModel } from './embedding/embeddingTypes';
import type { Note } from '../types';

export interface MoodPredictionResult {
  mood: MoodName;
  group: MoodGroupId;
  label: string;
  confidence: number;
  rankings: Array<{ mood: MoodName; group: MoodGroupId; score: number }>;
}

export interface DissonanceResult {
  hasDissonance: boolean;
  dissonanceType: 'pos-neg' | 'neg-pos' | null;
  prompt: string | null;
}

export interface AntidoteMemoryItem {
  note: Note;
  similarity: number;
  reason: string;
}

const anchorVectorsCache = new Map<SupportedEmbeddingModel, Map<MoodName, Float32Array>>();

/**
 * Reset memory caches for tests.
 */
export const clearAnchorCacheForTests = () => {
  anchorVectorsCache.clear();
};

/**
 * Lazily embeds all 21 mood prototype descriptors for the active model tier
 * and caches them in memory.
 */
export async function getMoodAnchorVectors(): Promise<Map<MoodName, Float32Array>> {
  const activeModel = embeddingService.getActiveModel();
  const cached = anchorVectorsCache.get(activeModel);
  if (cached && cached.size === MOOD_OPTIONS.length) {
    return cached;
  }

  const modelCache = new Map<MoodName, Float32Array>();

  for (const moodName of MOOD_OPTIONS) {
    const def = MOOD_ANCHOR_DEFINITIONS[moodName];
    if (!def) continue;

    // Use embedQuery so the anchor uses the same asymmetric query prefix as user search/prompts
    const vec = await embeddingService.embedQuery(def.descriptor);
    modelCache.set(moodName, vec);
  }

  anchorVectorsCache.set(activeModel, modelCache);
  return modelCache;
}

const countWords = (text: string): number => {
  const plain = text.replace(/<[^>]*>/g, ' ').trim();
  return plain ? plain.split(/\s+/).filter(Boolean).length : 0;
};

/**
 * Predicts the closest mood from a draft note text using local cosine similarity
 * against the 21 mood anchor vectors.
 */
export async function predictMoodFromText(
  text: string,
  options?: { minWords?: number; minConfidence?: number },
): Promise<MoodPredictionResult | null> {
  const minWords = options?.minWords ?? 15;
  const minConfidence = options?.minConfidence ?? 0.25;

  const wordCount = countWords(text);
  if (wordCount < minWords || text.trim().length < 40) {
    return null;
  }

  const anchors = await getMoodAnchorVectors();
  const textVector = await embeddingService.embedQuery(text);

  const scores: Array<{ mood: MoodName; group: MoodGroupId; score: number }> = [];

  for (const [moodName, anchorVec] of anchors.entries()) {
    const score = vectorStore.cosineSimilarity(textVector, anchorVec);
    const group = getMoodGroupForMood(moodName)?.id || 'mixed';
    scores.push({ mood: moodName, group, score });
  }

  scores.sort((a, b) => b.score - a.score);
  const top = scores[0];

  if (!top || top.score < minConfidence) {
    return null;
  }

  const config = getMoodConfig(top.mood);

  return {
    mood: top.mood,
    group: top.group,
    label: config?.label || top.mood,
    confidence: top.score,
    rankings: scores,
  };
}

/**
 * Observantly detects whether a user's selected mood strongly contrasts
 * with the emotional tone expressed in their reflection writing.
 */
export async function detectEmotionalDissonance(
  text: string,
  selectedMood?: MoodValue | string,
): Promise<DissonanceResult> {
  if (!selectedMood) {
    return { hasDissonance: false, dissonanceType: null, prompt: null };
  }

  const wordCount = countWords(text);
  if (wordCount < 18 || text.trim().length < 50) {
    return { hasDissonance: false, dissonanceType: null, prompt: null };
  }

  const selectedGroup = getMoodGroupForMood(selectedMood)?.id;
  if (!selectedGroup) {
    return { hasDissonance: false, dissonanceType: null, prompt: null };
  }

  const prediction = await predictMoodFromText(text, { minWords: 15, minConfidence: 0.2 });
  if (!prediction) {
    return { hasDissonance: false, dissonanceType: null, prompt: null };
  }

  const isSelectedPositive = RESTORATIVE_MOOD_FAMILIES.includes(selectedGroup);
  const isSelectedHeavyOrCharged = HEAVY_OR_CHARGED_FAMILIES.includes(selectedGroup);

  const isPredictedHeavyOrCharged = HEAVY_OR_CHARGED_FAMILIES.includes(prediction.group);
  const isPredictedPositive = RESTORATIVE_MOOD_FAMILIES.includes(prediction.group);

  // Case 1: Selected Light/Calm, but writing is heavily charged/exhausted
  if (isSelectedPositive && isPredictedHeavyOrCharged && prediction.confidence >= 0.38) {
    return {
      hasDissonance: true,
      dissonanceType: 'pos-neg',
      prompt:
        "You chose a light or calm tone, but your words carry heavier weight. There's quiet space here to acknowledge whatever feels hard without trying to fix it.",
    };
  }

  // Case 2: Selected Heavy/Down, but writing expresses gratitude or grounded lightness
  if (isSelectedHeavyOrCharged && isPredictedPositive && prediction.confidence >= 0.38) {
    return {
      hasDissonance: true,
      dissonanceType: 'neg-pos',
      prompt:
        'You chose a heavier tone, but your words hold sparks of gratitude and warmth. Opposing feelings can sit side-by-side—give yourself permission to hold both.',
    };
  }

  return { hasDissonance: false, dissonanceType: null, prompt: null };
}

/**
 * Retrieves restorative "Antidote Memories" when a user logs or views a reflection
 * with a heavy or charged emotional tone.
 */
export async function getAntidoteMemories(
  currentNote: { id?: string; mood?: string; content?: string; title?: string },
  allNotes: Note[],
  options?: { limit?: number; minScore?: number },
): Promise<AntidoteMemoryItem[]> {
  const limit = options?.limit ?? 3;
  const minScore = options?.minScore ?? 0.25;

  const currentGroup = currentNote.mood ? getMoodGroupForMood(currentNote.mood)?.id : undefined;
  if (!currentGroup || !HEAVY_OR_CHARGED_FAMILIES.includes(currentGroup)) {
    return [];
  }

  // Filter candidate notes that have light or steady moods
  const candidateNotes = allNotes.filter((note) => {
    if (currentNote.id && note.id === currentNote.id) return false;
    if (!note.mood) return false;
    const g = getMoodGroupForMood(note.mood)?.id;
    return g && RESTORATIVE_MOOD_FAMILIES.includes(g);
  });

  if (candidateNotes.length === 0) {
    return [];
  }

  // Get current note vector or generate query vector
  let queryVector: Float32Array | null = null;
  if (currentNote.id) {
    const existing = await vectorStore.get(currentNote.id);
    if (existing?.vector && existing.vector.length > 0) {
      queryVector = existing.vector;
    }
  }

  if (!queryVector && (currentNote.content || currentNote.title)) {
    queryVector = await embeddingService.embedQuery(
      `${currentNote.title || ''} ${currentNote.content || ''}`.trim(),
    );
  }

  const items: AntidoteMemoryItem[] = [];

  for (const note of candidateNotes) {
    const record = await vectorStore.get(note.id);
    if (!record?.vector) continue;

    const score = queryVector
      ? vectorStore.cosineSimilarity(queryVector, record.vector)
      : 0.5; // fallback baseline resonance if no query vector

    if (score >= minScore) {
      const moodConfig = getMoodConfig(note.mood);
      items.push({
        note,
        similarity: score,
        reason: `Grounded in ${moodConfig?.label.toLowerCase() || note.mood || 'peace'}`,
      });
    }
  }

  items.sort((a, b) => b.similarity - a.similarity);
  return items.slice(0, limit);
}
