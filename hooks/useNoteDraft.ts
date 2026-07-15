import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBlocker } from 'react-router';
import type { Note, NoteAttachment, Task } from '../types';
import { RoutePath } from '../types';
import { noteService } from '../services/noteService';
import { notePublishingOrchestrator } from '../services/notePublishingOrchestrator';
import { useUserMode } from '../context/UserModeContext';
import { profileService } from '../services/profileService';
import { PRIVATE_WRITING_ONBOARDING_VERSION } from '../features/private-writing-onboarding/onboardingContent';
import { recordOnboardingFunnelEvent } from '../services/onboardingFunnelService';
import { ritualEventService } from '../services/ritualService';
import { getMonthlyNoteUsage } from '../services/wellnessPolicy';
import {
  buildCreateNoteDraftSnapshot,
  hasUnsavedCreateNoteChanges,
  type CreateNoteDraftSnapshot,
} from '../pages/dashboard/createNoteDraftState';

export interface SaveResult {
  observation: { text: string } | null;
  wasFirstPrivateReflection: boolean;
  /**
   * True only when the draft was fully published (note + attachments). Callers
   * must not navigate away on `false`, or in-flight writing/attachments would be
   * abandoned.
   */
  success: boolean;
}

interface NoteDraftState {
  // Core draft fields
  title: string;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  content: string;
  setContent: React.Dispatch<React.SetStateAction<string>>;
  mood: string | undefined;
  setMood: React.Dispatch<React.SetStateAction<string | undefined>>;
  tags: string[];
  setTags: React.Dispatch<React.SetStateAction<string[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  imagePreview: string | null;
  setImagePreview: React.Dispatch<React.SetStateAction<string | null>>;

  // Attachments
  existingAttachments: NoteAttachment[];
  newAttachments: File[];
  addFiles: (files: File[]) => void;

  // Lifecycle flags
  loading: boolean;
  saving: boolean;
  releasing: boolean;
  hasUnsavedChanges: boolean;
  canCreateNote: boolean;
  setCanCreateNote: React.Dispatch<React.SetStateAction<boolean>>;
  smartModeEnabled: boolean;

  // Computed
  currentSnapshot: CreateNoteDraftSnapshot;

  // Actions
  save: () => Promise<SaveResult>;
  release: () => Promise<string | null>;

  // Navigation blocker
  blocker: ReturnType<typeof useBlocker>;
  allowNavigationRef: React.MutableRefObject<boolean>;
  navigateWithBypass: (to: string, options?: { replace?: boolean; state?: unknown }) => void;
}

const EMPTY_DRAFT_INPUT = {
  title: '',
  content: '',
  mood: undefined,
  tags: [] as string[],
  tasks: [] as Task[],
  imagePreview: null as string | null,
  existingAttachments: [] as NoteAttachment[],
  newAttachments: [] as File[],
};

const NOTE_DRAFT_READY_DELAY_MS = 450;

// Upper bound on a single save. This is a stall guard for a wedged network
// socket that never errors — NOT a "give up and leave" timer. It is generous
// enough for large attachment uploads on slow connections, and on expiry the
// save is reported as failed (the draft stays on screen) rather than navigating
// away and silently dropping in-flight writing.
const SAVE_WATCHDOG_MS = 30000;

/**
 * Hook that owns the full note draft lifecycle:
 * create → edit → snapshot → save → navigate.
 *
 * Encapsulates all draft state, snapshot comparison, save orchestration
 * (upload, sync, smart-mode ingest, observation checks), release flow,
 * and navigation blocking for unsaved changes.
 */
export const useNoteDraft = (): NoteDraftState => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { userMode } = useUserMode();

  // Core state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<string | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingAttachments, setExistingAttachments] = useState<NoteAttachment[]>([]);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);

  // Lifecycle flags
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [canCreateNote, setCanCreateNote] = useState(true);
  const [smartModeEnabled, setSmartModeEnabled] = useState(false);

  const [baselineSnapshot, setBaselineSnapshot] = useState(() =>
    buildCreateNoteDraftSnapshot(EMPTY_DRAFT_INPUT),
  );

  const isUnmountedRef = useRef(false);
  const allowNavigationRef = useRef(false);
  const existingNoteCountRef = useRef<number | null>(null);

  useEffect(() => {
    isUnmountedRef.current = false;
    return () => {
      isUnmountedRef.current = true;
    };
  }, []);

  // Current snapshot for comparison
  const currentSnapshot = buildCreateNoteDraftSnapshot({
    title,
    content,
    mood,
    tags,
    tasks,
    imagePreview,
    existingAttachments,
    newAttachments,
  });

  const hasUnsavedChanges =
    !loading && hasUnsavedCreateNoteChanges(currentSnapshot, baselineSnapshot);

  // Navigation blocker
  const blocker = useBlocker(
    () => hasUnsavedChanges && !saving && !releasing && !allowNavigationRef.current,
  );

  const navigateWithBypass = useCallback(
    (to: string, options?: { replace?: boolean; state?: unknown }) => {
      allowNavigationRef.current = true;
      navigate(to, options);
      window.setTimeout(() => {
        allowNavigationRef.current = false;
      }, 0);
    },
    [navigate],
  );

  // beforeunload guard
  useEffect(() => {
    if (!hasUnsavedChanges || saving || releasing) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (allowNavigationRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, releasing, saving]);

  // Load existing note or check creation limits
  useEffect(() => {
    let blankDraftReadyTimer: number | undefined;

    const openBlankDraftAfterMinimumDelay = () => {
      blankDraftReadyTimer = window.setTimeout(() => {
        if (!isUnmountedRef.current) setLoading(false);
      }, NOTE_DRAFT_READY_DELAY_MS);
    };

    const loadNewDraftAccess = async () => {
      try {
        const access = await profileService.getWellnessAccess();
        if (!isUnmountedRef.current) {
          setSmartModeEnabled(access.smartModeEnabled);
        }

        const allNotes = await noteService.getAll();
        existingNoteCountRef.current = allNotes.length;
        const usage = getMonthlyNoteUsage(allNotes, access);
        if (!isUnmountedRef.current) {
          setCanCreateNote(usage.canCreateNote);
        }
      } catch (error) {
        console.warn('[useNoteDraft] Could not verify note limits for new draft:', error);
        if (!isUnmountedRef.current) {
          setCanCreateNote(true);
          setSmartModeEnabled(false);
        }
      }
    };

    const fetchNote = async () => {
      try {
        if (!id) {
          setBaselineSnapshot(buildCreateNoteDraftSnapshot(EMPTY_DRAFT_INPUT));
          openBlankDraftAfterMinimumDelay();
          await loadNewDraftAccess();
          return;
        }

        const access = await profileService.getWellnessAccess();
        if (!isUnmountedRef.current) {
          setSmartModeEnabled(access.smartModeEnabled);
        }

        const note = await noteService.getById(id);
        if (note && !isUnmountedRef.current) {
          const initialSnapshot = buildCreateNoteDraftSnapshot({
            title: note.title,
            content: note.content,
            mood: note.mood,
            tags: note.tags || [],
            tasks: note.tasks || [],
            imagePreview: note.thumbnailUrl || null,
            existingAttachments: note.attachments || [],
            newAttachments: [],
          });
          setTitle(note.title);
          setContent(note.content);
          setMood(note.mood);
          setTags(note.tags || []);
          setTasks(note.tasks || []);
          setImagePreview(note.thumbnailUrl || null);
          setExistingAttachments(note.attachments || []);
          setBaselineSnapshot(initialSnapshot);
          window.setTimeout(() => {
            if (!isUnmountedRef.current) setLoading(false);
          }, NOTE_DRAFT_READY_DELAY_MS);
        } else {
          navigate(RoutePath.DASHBOARD);
        }
      } catch {
        setLoading(false);
      }
    };
    fetchNote();

    return () => {
      if (blankDraftReadyTimer) {
        window.clearTimeout(blankDraftReadyTimer);
      }
    };
  }, [id, navigate]);

  const addFiles = useCallback((files: File[]) => {
    setNewAttachments((current) => [...current, ...files]);
  }, []);

  // ── Save orchestration ──
  const save = useCallback(async (): Promise<SaveResult> => {
    if (!currentSnapshot.title && !currentSnapshot.content) {
      return { observation: null, wasFirstPrivateReflection: false, success: false };
    }

    setSaving(true);

    // Stall guard only: reject if publishing wedges, so the UI can recover.
    // Unlike the old 5s "nuclear" timer, this never navigates away and never
    // clears the draft — the writing stays on screen so nothing is lost and the
    // writer can retry.
    let watchdogTimer: number | undefined;
    const watchdog = new Promise<never>((_, reject) => {
      watchdogTimer = window.setTimeout(() => {
        reject(new Error('save-watchdog-timeout'));
      }, SAVE_WATCHDOG_MS);
    });

    try {
      const result = await Promise.race([
        notePublishingOrchestrator.publishDraft({
          id,
          title,
          content,
          mood,
          tags,
          tasks,
          imagePreview,
          existingAttachments,
          newAttachments,
          smartModeEnabled,
          userMode,
        }),
        watchdog,
      ]);

      clearTimeout(watchdogTimer);

      setTasks(result.syncedTasks);

      const savedSnapshot = buildCreateNoteDraftSnapshot({
        title,
        content,
        mood,
        tags,
        tasks: result.syncedTasks,
        imagePreview: result.finalThumbnailUrl,
        existingAttachments: result.mergedAttachments,
        newAttachments: [],
      });

      if (isUnmountedRef.current) {
        return { observation: null, wasFirstPrivateReflection: false, success: true };
      }

      setExistingAttachments(result.mergedAttachments);
      setNewAttachments([]);
      setImagePreview(result.finalThumbnailUrl);
      setBaselineSnapshot(savedSnapshot);
      setSaving(false);

      const wasFirstPrivateReflection = !id && existingNoteCountRef.current === 0;
      if (wasFirstPrivateReflection) {
        recordOnboardingFunnelEvent('first_private_reflection_saved', {});
        recordOnboardingFunnelEvent('onboarding_completed', { source: 'first_reflection_saved' });
        void profileService.completeOnboarding(PRIVATE_WRITING_ONBOARDING_VERSION);
        existingNoteCountRef.current = 1;
      }

      return { observation: result.observation, wasFirstPrivateReflection, success: true };
    } catch {
      clearTimeout(watchdogTimer);
      if (!isUnmountedRef.current) {
        setSaving(false);
      }
      return { observation: null, wasFirstPrivateReflection: false, success: false };
    }
  }, [
    currentSnapshot.title,
    currentSnapshot.content,
    id,
    title,
    content,
    mood,
    tags,
    tasks,
    imagePreview,
    existingAttachments,
    newAttachments,
    smartModeEnabled,
    userMode,
  ]);

  // ── Release (write-and-let-go) orchestration ──
  const release = useCallback(async (): Promise<string | null> => {
    if (!currentSnapshot.title && !currentSnapshot.content) return null;

    setReleasing(true);

    try {
      await ritualEventService.recordReleaseCompleted();

      setTitle('');
      setContent('');
      setMood(undefined);
      setTags([]);
      setTasks([]);
      setImagePreview(null);
      setExistingAttachments([]);
      setNewAttachments([]);
      setBaselineSnapshot(buildCreateNoteDraftSnapshot(EMPTY_DRAFT_INPUT));

      return null; // success
    } catch (error) {
      console.error('[useNoteDraft] Could not release draft:', error);
      return 'Release could not finish just now. Your words are still only here on this screen.';
    } finally {
      if (!isUnmountedRef.current) {
        setReleasing(false);
      }
    }
  }, [currentSnapshot.title, currentSnapshot.content]);

  return {
    title,
    setTitle,
    content,
    setContent,
    mood,
    setMood,
    tags,
    setTags,
    tasks,
    setTasks,
    imagePreview,
    setImagePreview,
    existingAttachments,
    newAttachments,
    addFiles,
    loading,
    saving,
    releasing,
    hasUnsavedChanges,
    canCreateNote,
    setCanCreateNote,
    smartModeEnabled,
    currentSnapshot,
    save,
    release,
    blocker,
    allowNavigationRef,
    navigateWithBypass,
  };
};
