import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBlocker } from 'react-router';
import type { Note, NoteAttachment, Task } from '../types';
import { RoutePath } from '../types';
import { noteService } from '../services/noteService';
import { notePublishingOrchestrator } from '../services/notePublishingOrchestrator';
import { profileService } from '../services/profileService';
import { ritualEventService } from '../services/ritualService';
import { getMonthlyNoteUsage } from '../services/wellnessPolicy';
import {
  buildCreateNoteDraftSnapshot,
  hasUnsavedCreateNoteChanges,
  type CreateNoteDraftSnapshot,
} from '../pages/dashboard/createNoteDraftState';

export interface SaveResult {
  observation: { text: string } | null;
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
    const fetchNote = async () => {
      try {
        const access = await profileService.getWellnessAccess();
        if (!isUnmountedRef.current) {
          setSmartModeEnabled(access.smartModeEnabled);
        }

        if (!id) {
          setBaselineSnapshot(buildCreateNoteDraftSnapshot(EMPTY_DRAFT_INPUT));
          setTimeout(() => {
            if (!isUnmountedRef.current) setLoading(false);
          }, 1200);

          // Check note limit for new notes
          const allNotes = await noteService.getAll();
          const usage = getMonthlyNoteUsage(allNotes, access);
          if (!isUnmountedRef.current) {
            setCanCreateNote(usage.canCreateNote);
          }
          return;
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
          setTimeout(() => {
            if (!isUnmountedRef.current) setLoading(false);
          }, 1200);
        } else {
          navigate(RoutePath.HOME);
        }
      } catch {
        setLoading(false);
      }
    };
    fetchNote();
  }, [id, navigate]);

  const addFiles = useCallback((files: File[]) => {
    setNewAttachments((current) => [...current, ...files]);
  }, []);

  // ── Save orchestration ──
  const save = useCallback(async (): Promise<SaveResult> => {
    if (!currentSnapshot.title && !currentSnapshot.content) {
      return { observation: null };
    }

    setSaving(true);

    const nuclearTimer = window.setTimeout(() => {
      if (!isUnmountedRef.current) {
        setSaving(false);
        navigateWithBypass(RoutePath.HOME);
      }
    }, 5000);

    try {
      const result = await notePublishingOrchestrator.publishDraft({
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
      });

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

      clearTimeout(nuclearTimer);
      if (isUnmountedRef.current) return { observation: null };

      setExistingAttachments(result.mergedAttachments);
      setNewAttachments([]);
      setImagePreview(result.finalThumbnailUrl);
      setBaselineSnapshot(savedSnapshot);
      setSaving(false);

      return { observation: result.observation };
    } catch {
      clearTimeout(nuclearTimer);
      if (!isUnmountedRef.current) {
        setSaving(false);
      }
      return { observation: null };
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
    navigateWithBypass,
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
