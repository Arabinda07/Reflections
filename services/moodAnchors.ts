import type { MoodGroupId, MoodName } from '../pages/dashboard/moodConfig';

export type MoodValence = 'light' | 'steady' | 'charged' | 'heavy' | 'mixed';

export interface MoodAnchorDefinition {
  mood: MoodName;
  family: MoodGroupId;
  valence: MoodValence;
  descriptor: string;
}

/**
 * Rich affective semantic descriptions for each of the 21 moods in MOOD_OPTIONS.
 * These descriptors serve as local prototype texts for cosine similarity against
 * document and query embeddings.
 */
export const MOOD_ANCHOR_DEFINITIONS: Record<MoodName, MoodAnchorDefinition> = {
  // --- Light Family (Positive, Energizing, Heart-warming) ---
  happy: {
    mood: 'happy',
    family: 'light',
    valence: 'light',
    descriptor: 'cheerful, joyful, delighted, beaming, uplifting spirits, laughing, pleasant, good day',
  },
  glad: {
    mood: 'glad',
    family: 'light',
    valence: 'light',
    descriptor: 'content, grateful, appreciating the moment, blessed, warm satisfaction, thankful, fortunate',
  },
  sparked: {
    mood: 'sparked',
    family: 'light',
    valence: 'light',
    descriptor: 'excited, inspired, energized, fired up, creative spark, enthusiasm, passionate momentum',
  },

  // --- Steady Family (Calm, Grounded, Centered) ---
  calm: {
    mood: 'calm',
    family: 'steady',
    valence: 'steady',
    descriptor: 'relaxed, tranquil, breathing easy, gentle rhythm, quiet stillness, unwinding, soft peace',
  },
  settled: {
    mood: 'settled',
    family: 'steady',
    valence: 'steady',
    descriptor: 'grounded, peaceful, centered, rooted, steady balance, anchored, safe and stable, at rest',
  },
  spacious: {
    mood: 'spacious',
    family: 'steady',
    valence: 'steady',
    descriptor: 'clear-headed, open, unburdened, mental breathing room, wide perspective, spacious clarity',
  },

  // --- Charged Family (High arousal, Stress, Friction) ---
  anxious: {
    mood: 'anxious',
    family: 'charged',
    valence: 'charged',
    descriptor: 'worried, nervous, anticipating catastrophe, uneasy, trembling, dread, apprehension, anxious jitter',
  },
  wired: {
    mood: 'wired',
    family: 'charged',
    valence: 'charged',
    descriptor: 'overwhelmed, sensory overload, racing thoughts, frantic, jittery, restless energy, buzzing',
  },
  overthinking: {
    mood: 'overthinking',
    family: 'charged',
    valence: 'charged',
    descriptor: 'ruminating, looping thoughts, analyzing every detail, mental exhaustion, spiraling, spinning wheels',
  },
  angry: {
    mood: 'angry',
    family: 'charged',
    valence: 'charged',
    descriptor: 'furious, enraged, heated indignation, resentment, burning irritation, mad, clenched fists',
  },
  irritated: {
    mood: 'irritated',
    family: 'charged',
    valence: 'charged',
    descriptor: 'frustrated, annoyed, snappy, aggravated, prickly, impatient friction, provoked',
  },
  done: {
    mood: 'done',
    family: 'charged',
    valence: 'charged',
    descriptor: 'fed up, no more patience, exasperated, finished dealing with this, exhausted boundary, done',
  },

  // --- Heavy Family (Low arousal, Depletion, Sadness) ---
  sad: {
    mood: 'sad',
    family: 'heavy',
    valence: 'heavy',
    descriptor: 'down, sorrow, weeping, grief, heavy heartache, melancholy, despair, blue, tearful ache',
  },
  lonely: {
    mood: 'lonely',
    family: 'heavy',
    valence: 'heavy',
    descriptor: 'isolated, yearning for connection, feeling unseen, detached from others, alone, solitary emptiness',
  },
  tender: {
    mood: 'tender',
    family: 'heavy',
    valence: 'heavy',
    descriptor: 'vulnerable, fragile, soft-hearted, sensitive, open wound, emotional exposure, delicate care',
  },
  tired: {
    mood: 'tired',
    family: 'heavy',
    valence: 'heavy',
    descriptor: 'sleepy, physically weary, drooping eyelids, needing rest, fatigued body, heavy limbs',
  },
  drained: {
    mood: 'drained',
    family: 'heavy',
    valence: 'heavy',
    descriptor: 'depleted, exhausted reserves, burnt out, empty tank, hollowed out, completely spent',
  },
  foggy: {
    mood: 'foggy',
    family: 'heavy',
    valence: 'heavy',
    descriptor: 'cloudy mind, unfocused, mental haze, disoriented, sluggish thoughts, wandering, detached haze',
  },

  // --- Mixed Family (Nuanced, Ambivalent, Complex) ---
  mixed: {
    mood: 'mixed',
    family: 'mixed',
    valence: 'mixed',
    descriptor: 'bittersweet, ambivalent, conflicting feelings, holding multiple opposing truths, torn in two',
  },
  raw: {
    mood: 'raw',
    family: 'mixed',
    valence: 'mixed',
    descriptor: 'emotionally sensitive, easily bruised, exposed nerve, deeply touched, thin skin, intensely felt',
  },
  numb: {
    mood: 'numb',
    family: 'mixed',
    valence: 'mixed',
    descriptor: 'blank, feeling nothing, disconnected, hollow, detached, apathy, flat affect, emotionless',
  },
};

/**
 * List of moods classified as restorative / grounding "antidotes"
 * to surface when a reflection carries heavy or charged emotional weight.
 */
export const RESTORATIVE_MOOD_FAMILIES: readonly MoodGroupId[] = ['steady', 'light'];

export const HEAVY_OR_CHARGED_FAMILIES: readonly MoodGroupId[] = ['heavy', 'charged'];
