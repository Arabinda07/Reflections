import { WikiPageType } from './services/wikiService';

export interface NoteAttachment {
  name: string;
  path: string;
  size: number;
  type: string;
  id: string;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
  tags?: string[];
  attachments?: NoteAttachment[];
  mood?: string;
  tasks?: Task[];
}

export interface LifeTheme {
  id: string;
  userId: string;
  title: string;
  content: string;
  state: 'active' | 'archived' | 'resolved';
  // Distinguishes freeform user themes from LLM-maintained wiki pages.
  // 'theme' = user-created (default, backward compatible)
  pageType: WikiPageType;
  createdAt: string;
  updatedAt: string;
}

export interface ThemeCitation {
  id: string;
  // userId removed — ownership is enforced via RLS join on life_themes
  themeId: string;
  noteId: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export type PlanTier = 'free' | 'pro';

export interface WellnessAccess {
  userId: string;
  planTier: PlanTier;
  freeAiReflectionsUsed: number;
}

export interface NoteUsage {
  usedThisMonth: number;
  monthlyLimit: number;
  remainingThisMonth: number;
  canCreateNote: boolean;
}

export interface AiReflectionGate {
  canReflect: boolean;
  reason?: 'needs_more_notes' | 'sample_used' | 'missing_content';
  remainingFreeSamples: number;
  requiresUpgrade: boolean;
}

export interface MonthlyWellnessJourney {
  monthLabel: string;
  noteCount: number;
  writingDays: number;
  topMood?: string;
  moodCounts: Record<string, number>;
  topTags: Array<{ tag: string; count: number }>;
  recurringThemes: string[];
  summary: string;
  nextStep: string;
}

export enum RoutePath {
  HOME = '/',
  NOTES = '/notes',
  CREATE_NOTE = '/notes/new',
  EDIT_NOTE = '/notes/:id/edit',
  NOTE_DETAIL = '/notes/:id',
  ACCOUNT = '/account',
  LOGIN = '/login',
  SIGNUP = '/signup',
  INSIGHTS = '/insights',
  FAQ = '/faq',
  PRIVACY = '/privacy',
}
