import type { AiReflectionGate, Note, NoteUsage, WellnessAccess, WikiInsightsGate } from '../types';

export const FREE_MONTHLY_NOTE_LIMIT = 30;
export const FREE_AI_REFLECTION_SAMPLES = 1;
export const FREE_AI_MINIMUM_NOTES = 3;
export const FREE_WIKI_INSIGHT_GENERATIONS = 1;
export const FREE_WIKI_MINIMUM_ENTRIES = 3;

export function getMonthRange(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}

export function getMonthlyNoteUsage(notes: Note[], access: WellnessAccess, now = new Date()): NoteUsage {
  if (access.planTier === 'pro') {
    return {
      usedThisMonth: notes.length,
      monthlyLimit: Infinity,
      remainingThisMonth: Infinity,
      canCreateNote: true,
    };
  }

  const { start, end } = getMonthRange(now);
  const usedThisMonth = notes.filter((note) => {
    const created = new Date(note.createdAt);
    return created >= start && created < end;
  }).length;

  return {
    usedThisMonth,
    monthlyLimit: FREE_MONTHLY_NOTE_LIMIT,
    remainingThisMonth: Math.max(FREE_MONTHLY_NOTE_LIMIT - usedThisMonth, 0),
    canCreateNote: usedThisMonth < FREE_MONTHLY_NOTE_LIMIT,
  };
}

export function getAiReflectionGate(
  access: WellnessAccess,
  noteCount: number,
  hasContent: boolean,
): AiReflectionGate {
  const remainingFreeSamples = Math.max(FREE_AI_REFLECTION_SAMPLES - access.freeAiReflectionsUsed, 0);

  if (!hasContent) {
    return {
      canReflect: false,
      reason: 'missing_content',
      remainingFreeSamples,
      requiresUpgrade: false,
    };
  }

  if (access.planTier === 'pro') {
    return {
      canReflect: true,
      remainingFreeSamples: 0,
      requiresUpgrade: false,
    };
  }

  if (noteCount < FREE_AI_MINIMUM_NOTES) {
    return {
      canReflect: false,
      reason: 'needs_more_notes',
      remainingFreeSamples,
      requiresUpgrade: false,
    };
  }

  if (remainingFreeSamples <= 0) {
    return {
      canReflect: false,
      reason: 'sample_used',
      remainingFreeSamples: 0,
      requiresUpgrade: true,
    };
  }

  return {
    canReflect: true,
    remainingFreeSamples,
    requiresUpgrade: false,
  };
}

export function getWikiInsightsGate(
  access: WellnessAccess,
  entryCount: number,
): WikiInsightsGate {
  const remainingFreeGenerations = Math.max(FREE_WIKI_INSIGHT_GENERATIONS - access.freeWikiInsightsUsed, 0);

  if (entryCount < FREE_WIKI_MINIMUM_ENTRIES) {
    return {
      canGenerate: false,
      reason: 'needs_more_entries',
      remainingFreeGenerations,
      requiresUpgrade: false,
    };
  }

  if (access.planTier === 'pro') {
    return {
      canGenerate: true,
      remainingFreeGenerations: 0,
      requiresUpgrade: false,
    };
  }

  if (remainingFreeGenerations <= 0) {
    return {
      canGenerate: false,
      reason: 'free_limit_reached',
      remainingFreeGenerations: 0,
      requiresUpgrade: true,
    };
  }

  return {
    canGenerate: true,
    remainingFreeGenerations,
    requiresUpgrade: false,
  };
}
