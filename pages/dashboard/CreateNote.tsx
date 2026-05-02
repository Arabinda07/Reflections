import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useBlocker } from 'react-router';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  FloppyDisk, 
  Image as ImageIcon, 
  X, 
  CalendarBlank, 
  Paperclip, 
  Smiley, 
  Tag as TagIcon, 
  Check, 
  Plus, 
  Trash, 
  ListChecks, 
  Microphone, 
  MicrophoneSlash, 
  Headphones,
  CircleNotch,
  CaretRight,
  Brain,
  Target,
  DotsThreeCircle,
  Wind,
} from '@phosphor-icons/react';
import { Magnetic } from '../../components/ui/Magnetic';
import { useAmbientAudio, AMBIENT_TRACKS } from '../../hooks/useAmbientAudio';
import { useHaptics } from '../../hooks/useHaptics';
import { useSound } from '../../hooks/useSound';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { Editor, EditorRef } from '../../components/ui/Editor';
import { noteService } from '../../services/noteService';
import { ritualEventService } from '../../services/engagementServices';
import { storageService } from '../../services/storageService';
import { RoutePath, NoteAttachment, Task } from '../../types';
import { supabase } from '../../src/supabaseClient';
import { CompanionObservation } from '../../components/ui/CompanionObservation';
import { ModalSheet } from '../../components/ui/ModalSheet';
import { PaperPlaneToast } from '../../components/ui/PaperPlaneToast';
import { InlineLoadingBadge } from '../../components/ui/InlineLoadingBadge';
import { observationService } from '../../services/observationService';
import { DEFAULT_WELLNESS_PROMPTS, getCurrentWellnessPrompt, getNextWellnessPromptState } from '../../services/wellnessPrompts';
import { aiService } from '../../services/aiService';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { getOrderedTasks, getTaskDrawerTriggerLabel } from './createNoteTasks';
import { canNavigateBackInApp } from '../../src/native/androidBack';
import { NATIVE_PAGE_TOP_PADDING, NATIVE_TOP_CONTROL_OFFSET } from '../../src/native/safeArea';
import { profileService } from '../../services/profileService';
import { getMonthlyNoteUsage } from '../../services/wellnessPolicy';
import { ProUpgradeCTA } from '../../components/ui/ProUpgradeCTA';
import {
  buildCreateNoteDraftSnapshot,
  CREATE_NOTE_SAVE_VISUAL_FLOOR_MS,
  CREATE_NOTE_UNSUPPORTED_WHISPER_MESSAGE,
  hasUnsavedCreateNoteChanges,
} from './createNoteDraftState';
import { extractTasksFromContent, mergeTasks } from '../../src/utils/taskParser';
import trailLoadingAnimation from '@/src/lottie/trail-loading.json';
import { MOOD_CONFIG, MOOD_OPTIONS, getMoodConfig } from './moodConfig';
import { trackNoteSavedDeferred } from '../../src/analytics/deferredEvents';

const getSurfaceScopeForMood = (mood?: string) => {
  switch (mood) {
    case 'happy': return 'surface-scope-sky';
    case 'calm': return 'surface-scope-sage';
    case 'anxious': return 'surface-scope-neutral';
    case 'sad': return 'surface-scope-sky';
    case 'angry': return 'surface-scope-neutral';
    case 'tired': return 'surface-scope-paper';
    default: return 'surface-scope-paper';
  }
};

const getSurfacePanelForMood = (mood?: string) => {
  switch (mood) {
    case 'happy': return 'surface-panel-sky';
    case 'calm': return 'surface-panel-sage';
    case 'anxious': return 'surface-panel-neutral';
    case 'sad': return 'surface-panel-sky';
    case 'angry': return 'surface-panel-neutral';
    case 'tired': return 'surface-panel-paper';
    default: return 'surface-panel-sage';
  }
};
// --- Sub-Component: TaskRow ---
interface TaskRowProps {
  task: Task;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  toggleTask: (taskId: string) => void;
  removeTask: (taskId: string) => void;
}

const TaskRow: React.FC<TaskRowProps> = ({ task, updateTask, toggleTask, removeTask }) => {
  const [showCompletedText, setShowCompletedText] = useState(task.completed);
  const [rippleKey, setRippleKey] = useState(0);
  const wasCompleted = useRef(task.completed);
  const taskLabel = task.text.trim() || 'untitled task';

  useEffect(() => {
    if (task.completed) {
      if (!wasCompleted.current) setRippleKey((key) => key + 1);
      const timer = window.setTimeout(() => setShowCompletedText(true), 180);
      wasCompleted.current = true;
      return () => window.clearTimeout(timer);
    }
    setShowCompletedText(false);
    wasCompleted.current = false;
  }, [task.completed]);

  return (
    <motion.div
      layout
      className={`group relative flex items-center gap-3 rounded-2xl p-3 transition-colors duration-300 hover:bg-green/5 dark:hover:bg-white/5 ${task.completed ? 'opacity-60' : ''}`}
    >
      <AnimatePresence>
        {rippleKey > 0 && task.completed && (
          <motion.span
            key={rippleKey}
            initial={{ scale: 0.2, opacity: 0.4 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="pointer-events-none absolute left-5 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-green/30"
          />
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => toggleTask(task.id)}
        aria-label={task.completed ? `Mark "${taskLabel}" as open` : `Mark "${taskLabel}" as complete`}
        className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors duration-300 ${
          task.completed ? 'border-green bg-green text-white' : 'border-border text-transparent hover:border-green/50'
        }`}
      >
        <motion.span animate={{ scale: task.completed ? 1 : 0 }}>
          <Check size={14} weight="bold" />
        </motion.span>
      </button>

      <input
        type="text"
        value={task.text}
        onChange={(e) => updateTask(task.id, { text: e.target.value })}
        readOnly={task.completed}
        placeholder="What needs to be done?"
        aria-label={`Edit task: ${taskLabel}`}
        className={`relative z-10 flex-1 bg-transparent border-none outline-none font-bold text-[14px] text-gray-text placeholder:text-gray-nav/40 transition-colors ${
          showCompletedText ? 'line-through text-gray-nav decoration-green decoration-2' : ''
        }`}
      />

      <button
        type="button"
        onClick={() => removeTask(task.id)}
        aria-label={`Remove task: ${taskLabel}`}
        className="opacity-0 group-hover:opacity-100 p-2 text-gray-nav hover:text-clay transition-opacity"
      >
        <Trash size={16} />
      </button>
    </motion.div>
  );
};

export const CreateNote: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); 
  const location = useLocation();
  const initialPrompt = location.state?.initialPrompt;
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<string | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activePlaceholder, setActivePlaceholder] = useState<string | null>(
    initialPrompt || getCurrentWellnessPrompt(0, DEFAULT_WELLNESS_PROMPTS),
  );
  const [isReflecting, setIsReflecting] = useState(false);
  const [aiReflection, setAiReflection] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<NoteAttachment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [canCreateNote, setCanCreateNote] = useState<boolean>(true);
  
  // UI States
  const isMobile = useMediaQuery('(max-width: 1023px)');

  const handleMobileBack = useCallback(() => {
    if (
      typeof window !== 'undefined' &&
      canNavigateBackInApp(
        window.history.state as { idx?: unknown } | null,
        window.history.length,
      )
    ) {
      navigate(-1);
      return;
    }

    navigate(RoutePath.NOTES);
  }, [navigate]);
  const [isFocused, setIsFocused] = useState(false);
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isFocusModeEnabled, setIsFocusModeEnabled] = useState(false);
  const [isFlowing, setIsFlowing] = useState(false);
  const [isMobileOptionsOpen, setIsMobileOptionsOpen] = useState(false);

  // Sub-modal states
  const [isMoodOpen, setIsMoodOpen] = useState(false);
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [isMusicOpen, setIsMusicOpen] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isSaveChoiceOpen, setIsSaveChoiceOpen] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [releaseError, setReleaseError] = useState<string | null>(null);
  
  const [isWhispering, setIsWhispering] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [whisperFeedback, setWhisperFeedback] = useState<string | null>(null);
  const [pendingTrackId, setPendingTrackId] = useState<string | null>(null);
  const [showObservation, setShowObservation] = useState(false);
  const [observationText, setObservationText] = useState<string | null>(null);
  const [showPlane, setShowPlane] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);
  const [smartModeEnabled, setSmartModeEnabled] = useState(false);
  const [baselineDraftSnapshot, setBaselineDraftSnapshot] = useState(() =>
    buildCreateNoteDraftSnapshot({
      title: '',
      content: '',
      mood: undefined,
      tags: [],
      tasks: [],
      imagePreview: null,
      existingAttachments: [],
      newAttachments: [],
    }),
  );

  const { isPlaying: musicPlaying, activeTrack: activeMusicTrack, playTrack: playMusicTrack, stopAll: stopMusic } = useAmbientAudio();
  const haptics = useHaptics();
  const { playSaveChime } = useSound();
  const ActiveMoodIcon = getMoodConfig(mood)?.icon || Smiley;
  const recognitionRef = useRef<any>(null);
  const isWhisperingRef = useRef(false);
  const editorInstanceRef = useRef<EditorRef>(null);
  const flowTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmounted = useRef(false);
  const lastFocusToggleRef = useRef<number>(0);

  const allowNavigationRef = useRef(false);
  const currentDraftSnapshot = buildCreateNoteDraftSnapshot({
    title,
    content,
    mood,
    tags,
    tasks,
    imagePreview,
    existingAttachments,
    newAttachments,
  });
  const hasUnsavedChanges = !loading && hasUnsavedCreateNoteChanges(currentDraftSnapshot, baselineDraftSnapshot);
  const blocker = useBlocker(() => hasUnsavedChanges && !saving && !isReleasing && !allowNavigationRef.current);
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

  useEffect(() => {
    isUnmounted.current = false;
    return () => { 
      isUnmounted.current = true; 
    };
  }, []);

  useEffect(() => {
    if (isFocusModeEnabled) return;
    if (flowTimeoutRef.current) clearTimeout(flowTimeoutRef.current);
    if (isFlowing) setIsFlowing(false);
  }, [isFlowing, isFocusModeEnabled]);

  // Flow Logic (Zen Mode)
  useEffect(() => {
    const handleWake = () => {
      // Grace period of 1s after toggling Focus Mode to prevent immediate wake from the click movement
      if (Date.now() - lastFocusToggleRef.current < 1000) return;
      
      if (flowTimeoutRef.current) clearTimeout(flowTimeoutRef.current);
      if (isFlowing) setIsFlowing(false);
    };
    const handleKeydown = (e: KeyboardEvent) => {
      if (!isFocusModeEnabled) return;
      if (!isFocused && !isTitleFocused) return;
      if (e.key === 'Escape') return handleWake();
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
        if (isTitleFocused) return; // Don't flow while typing title
        setIsFlowing(true);
        if (flowTimeoutRef.current) clearTimeout(flowTimeoutRef.current);
        if (!isMobile) {
          flowTimeoutRef.current = setTimeout(() => {
            if (!isUnmounted.current) setIsFlowing(false);
          }, 5000);
        }
      }
    };
    if (!isFocusModeEnabled) return;
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('mousemove', handleWake);
    window.addEventListener('touchstart', handleWake, { passive: true });
    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('mousemove', handleWake);
      window.removeEventListener('touchstart', handleWake);
    };
  }, [isFocusModeEnabled, isFocused, isTitleFocused, isFlowing, isMobile]);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const access = await profileService.getWellnessAccess();
        if (!isUnmounted.current) {
          setSmartModeEnabled(access.smartModeEnabled);
        }

        if (!id) {
          setBaselineDraftSnapshot(
            buildCreateNoteDraftSnapshot({
              title: '',
              content: '',
              mood: undefined,
              tags: [],
              tasks: [],
              imagePreview: null,
              existingAttachments: [],
              newAttachments: [],
            }),
          );
          setTimeout(() => {
            if (!isUnmounted.current) setLoading(false);
          }, 1200);
          
          // Check note limit for new notes
          const allNotes = await noteService.getAll();
          const usage = getMonthlyNoteUsage(allNotes, access);
          if (!isUnmounted.current) {
            setCanCreateNote(usage.canCreateNote);
          }
          return;
        }
        const note = await noteService.getById(id);
        if (note && !isUnmounted.current) {
          const initialDraftSnapshot = buildCreateNoteDraftSnapshot({
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
          setBaselineDraftSnapshot(initialDraftSnapshot);
          setTimeout(() => {
            if (!isUnmounted.current) setLoading(false);
          }, 1200);
        } else {
          navigate(RoutePath.HOME);
        }
      } catch (err) {
        setLoading(false);
      }
    };
    fetchNote();
  }, [id, navigate]);

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setShowLeaveDialog(true);
      return;
    }

    if (blocker.state === 'unblocked') {
      setShowLeaveDialog(false);
    }
  }, [blocker.state]);

  useEffect(() => {
    if (!whisperFeedback) return;

    const timer = window.setTimeout(() => {
      setWhisperFeedback(null);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [whisperFeedback]);

  useEffect(() => {
    if (!hasUnsavedChanges || saving || isReleasing) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (allowNavigationRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, isReleasing, saving]);

  // --- NUCLEAR SAVE LOGIC ---
  const handleSave = async () => {
    if (!currentDraftSnapshot.title && !currentDraftSnapshot.content) return;

    setIsSaveChoiceOpen(false);
    setSaving(true);
    setShowPlane(true);
    setWhisperFeedback(null);

    const nuclearTimer = window.setTimeout(() => {
      if (!isUnmounted.current) {
        setSaving(false);
        setShowPlane(false);
        navigateWithBypass(RoutePath.HOME);
      }
    }, 5000);

    const visualFloor =
      CREATE_NOTE_SAVE_VISUAL_FLOOR_MS > 0
        ? new Promise<void>((resolve) =>
            window.setTimeout(resolve, CREATE_NOTE_SAVE_VISUAL_FLOOR_MS),
          )
        : Promise.resolve();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthenticated");

      let noteId = id;
      
      // Auto-extract tasks from content
      const extractedTasks = extractTasksFromContent(content);
      const syncedTasks = mergeTasks(tasks, extractedTasks);
      setTasks(syncedTasks); // Sync local state for UI consistency

      const saveMode = noteId ? 'edit' : 'new';

      if (!noteId) {
        const newNote = await noteService.create({ title, content, tags, mood, tasks: syncedTasks });
        noteId = newNote.id;
      }

      const uploadedAttachments = await Promise.all(
        newAttachments.map(async (file) => ({
          id: crypto.randomUUID(),
          name: file.name,
          path: await storageService.uploadFile(file, user.id, 'notes', noteId),
          size: file.size,
          type: file.type,
        })),
      );
      const mergedAttachments = [...existingAttachments, ...uploadedAttachments];

      let finalThumbnailUrl = imagePreview;
      if (imagePreview?.startsWith('blob:')) {
        const response = await fetch(imagePreview);
        const blob = await response.blob();
        const file = new File([blob], "cover.jpg", { type: blob.type });
        finalThumbnailUrl = await storageService.uploadFile(file, user.id, 'notes', noteId);
      }

      const savedNote = await noteService.update(noteId, {
        title, content, mood, tags, tasks: syncedTasks,
        thumbnailUrl: finalThumbnailUrl || undefined,
        attachments: mergedAttachments
      });
      trackNoteSavedDeferred({
        mode: saveMode,
        attachmentCount: mergedAttachments.length,
        tagCount: tags.length,
        taskCount: syncedTasks.length,
      });

      const savedDraftSnapshot = buildCreateNoteDraftSnapshot({
        title,
        content,
        mood,
        tags,
        tasks,
        imagePreview: finalThumbnailUrl || null,
        existingAttachments: mergedAttachments,
        newAttachments: [],
      });
      
      await visualFloor;
      clearTimeout(nuclearTimer);
      if (isUnmounted.current) return;

      setExistingAttachments(mergedAttachments);
      setNewAttachments([]);
      setImagePreview(finalThumbnailUrl || null);
      setBaselineDraftSnapshot(savedDraftSnapshot);
      setSaving(false);
      setShowPlane(false);

      haptics.confirming();
      playSaveChime();

      if (smartModeEnabled) {
        void noteService.getAll()
          .then((allNotes) => aiService.autoIngestSavedNote(savedNote, allNotes))
          .catch((error) => {
            console.error('[CreateNote] Smart Mode auto-ingest failed:', error);
          });
      }

      const [totalCount, recentNotes] = await Promise.all([
        noteService.getCount(),
        noteService.getRecent(10)
      ]).catch(() => [0, []]);

      const observation = observationService.checkMilestones(
        { title, content, createdAt: new Date().toISOString() } as any,
        totalCount as number,
        recentNotes as any[]
      );

      if (observation && !isUnmounted.current) {
        setObservationText(observation.text);
        setShowObservation(true);
        observationService.markObservationShown();
      } else {
        navigateWithBypass(RoutePath.HOME, { state: { fromSave: true } });
      }

    } catch (err) {
      clearTimeout(nuclearTimer);
      if (!isUnmounted.current) {
        setSaving(false);
        setShowPlane(false);
      }
    }
  };

  const handleReleaseDraft = async () => {
    if (!currentDraftSnapshot.title && !currentDraftSnapshot.content) return;

    setIsReleasing(true);
    setReleaseError(null);

    try {
      await ritualEventService.recordReleaseCompleted();

      const emptyDraftSnapshot = buildCreateNoteDraftSnapshot({
        title: '',
        content: '',
        mood: undefined,
        tags: [],
        tasks: [],
        imagePreview: null,
        existingAttachments: [],
        newAttachments: [],
      });

      setTitle('');
      setContent('');
      setMood(undefined);
      setTags([]);
      setTagInput('');
      setTasks([]);
      setImagePreview(null);
      setExistingAttachments([]);
      setNewAttachments([]);
      setBaselineDraftSnapshot(emptyDraftSnapshot);
      setIsSaveChoiceOpen(false);
      navigateWithBypass(RoutePath.HOME, { state: { fromSave: true } });
    } catch (error) {
      console.error('[CreateNote] Could not release draft:', error);
      setReleaseError('Release could not finish just now. Your words are still only here on this screen.');
    } finally {
      if (!isUnmounted.current) {
        setIsReleasing(false);
      }
    }
  };

  const cycleSparkPrompt = () => {
    const nextState = getNextWellnessPromptState(promptIndex, DEFAULT_WELLNESS_PROMPTS);
    setPromptIndex(nextState.nextIndex);
    setActivePlaceholder(nextState.prompt);
  };

  const handleStopMusic = useCallback(() => {
    setPendingTrackId(null);
    stopMusic();
  }, [stopMusic]);

  const handleTrackSelect = useCallback(
    async (track: (typeof AMBIENT_TRACKS)[number]) => {
      if (pendingTrackId) return;

      if (activeMusicTrack?.id === track.id) {
        handleStopMusic();
        return;
      }

      setPendingTrackId(track.id);
      try {
        await playMusicTrack(track);
      } finally {
        if (!isUnmounted.current) {
          setPendingTrackId((current) => (current === track.id ? null : current));
        }
      }
    },
    [activeMusicTrack?.id, handleStopMusic, pendingTrackId, playMusicTrack],
  );

  const toggleWhisper = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setWhisperFeedback(CREATE_NOTE_UNSUPPORTED_WHISPER_MESSAGE);
      return;
    }

    setWhisperFeedback(null);

    if (isWhispering) {
      setIsWhispering(false);
      isWhisperingRef.current = false;
      recognitionRef.current?.stop();
      setInterimTranscript('');
    } else {
      setIsWhispering(true);
      isWhisperingRef.current = true;
      if (!recognitionRef.current) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.onresult = (event: any) => {
          let final = '';
          let currentInterim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) final += event.results[i][0].transcript;
            else currentInterim += event.results[i][0].transcript;
          }
          if (final) {
            setContent(prev => {
              const clean = prev === '<p><br></p>' ? '' : prev;
              if (!clean) return `<p>${final}</p>`;
              return clean.endsWith('</p>') ? clean.slice(0, -4) + ' ' + final + '</p>' : clean + ' ' + final;
            });
          }
          setInterimTranscript(currentInterim);
        };
      }
      recognitionRef.current.start();
    }
  };

  const handleAiReflect = async () => {
    if (!content || content === '<p><br></p>') return;
    setIsReflecting(true);
    setAiReflection(null);
    try {
      const now = new Date().toISOString();
      const reflection = await aiService.generateReflection({
        id: id || 'draft-reflection-preview',
        title,
        content,
        mood,
        createdAt: now,
        updatedAt: now,
        tags,
        tasks,
        attachments: [],
      });
      if (!isUnmounted.current) setAiReflection(reflection || "I'm here with you.");
    } catch {
      setAiReflection("I couldn't reflect on that right now. Try again in a moment.");
    } finally {
      if (!isUnmounted.current) setIsReflecting(false);
    }
  };

  const hasContent = Boolean(currentDraftSnapshot.content);
  const wordCount = currentDraftSnapshot.content.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length;
  const canReflect = wordCount >= 100;
  const isFocusModeActive = isFocusModeEnabled && isFlowing && !isTitleFocused;
  const showEntryExperience = loading;
  const handleStayOnDraft = () => {
    setShowLeaveDialog(false);
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  };
  const handleLeaveDraft = () => {
    setShowLeaveDialog(false);
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  };

  if (showEntryExperience) {
    return (
      <div className="relative flex min-h-[100dvh] flex-1 items-center justify-center overflow-hidden bg-body px-6 text-center">
        <motion.div
          initial={{ opacity: 0.72, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          className="relative z-10 flex max-w-md flex-col items-center"
        >
          <div className="mb-8 h-48 w-48 max-w-full" aria-hidden="true">
            <DotLottieReact data={trailLoadingAnimation} autoplay loop />
          </div>

          <h2 className="h2-section mb-4">Take a breath.</h2>
          <p className="body-editorial max-w-sm">Let the noise settle before you start.</p>
        </motion.div>
      </div>
    );
  }

  if (!id && !canCreateNote) {
    return (
      <div className="surface-scope-paper page-wash relative flex flex-1 min-h-[100dvh] bg-body">
        <ProUpgradeCTA variant="fullscreen" onSuccess={() => setCanCreateNote(true)} />
      </div>
    );
  }

  return (
    <div className={`${getSurfaceScopeForMood(mood)} page-wash relative flex-1 flex min-h-0 bg-body overflow-hidden`}>
      {/* â”€â”€ Mobile Back Button â”€â”€ */}
      {isMobile && (
        <button 
          onClick={handleMobileBack}
          className={`surface-floating fixed left-4 z-[80] flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] transition hover:text-green ${isFocusModeActive ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}`}
          style={{ top: NATIVE_TOP_CONTROL_OFFSET }}
          aria-label="Back to notes"
        >
          <ArrowLeft size={20} weight="regular" />
        </button>
      )}

      {isFocusModeActive ? (
        <button
          type="button"
          onClick={() => {
            setIsFlowing(false);
            setIsFocusModeEnabled(false);
          }}
          className="surface-floating fixed right-4 z-[85] inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-green hover:text-green"
          style={{ top: NATIVE_TOP_CONTROL_OFFSET }}
        >
          <X size={12} weight="regular" />
          Exit focus
        </button>
      ) : null}

      {/* ── Desktop Sidebar ── */}
      {!isMobile && (
        <aside className={`${getSurfacePanelForMood(mood)} flex flex-col min-h-0 z-40 transition-[width,opacity,transform,border] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] border-r border-green/15 ${isFocusModeActive ? 'w-0 opacity-0 -translate-x-full overflow-hidden border-r-0' : 'w-[240px] opacity-100 translate-x-0'}`}>
          <div className="pt-8 px-6 pb-6 flex-1 overflow-y-auto custom-scrollbar space-y-4">
            
            {/* Desktop Back Button */}
            <button 
              onClick={() => navigate(RoutePath.NOTES)}
              className="flex items-center gap-2 text-gray-nav hover:text-gray-text text-[13px] font-bold mb-8 group transition-colors"
            >
              <div className="control-surface flex h-8 w-8 items-center justify-center transition-colors group-hover:border-green/20 group-hover:bg-green/5">
                <ArrowLeft size={14} weight="regular" />
              </div>
              Back to Notes
            </button>

            <span className="text-[10px] font-black text-gray-nav tracking-widest uppercase opacity-40 ml-2">Personalize</span>
            
            {/* Options */}
            <button onClick={() => setIsMoodOpen(true)} className={`w-full flex items-center justify-between p-4 min-h-[52px] rounded-[20px] transition-colors border border-border/40 ${mood ? getMoodConfig(mood)?.nav || 'bg-green/10 border-green/20 text-green' : 'control-surface text-gray-text'}`}>
              <div className="flex items-center gap-3"><ActiveMoodIcon size={20} weight={mood ? "fill" : "regular"} /><span className="text-[13px] font-bold capitalize">{mood ? getMoodConfig(mood)?.label || mood : 'Mood'}</span></div>
              <CaretRight size={14} className="opacity-40" />
            </button>

            <button onClick={() => setIsTagsOpen(true)} className={`w-full flex items-center justify-between p-4 min-h-[52px] rounded-[20px] transition-colors border border-border/40 ${tags.length > 0 ? 'bg-green/10 border-green/20 text-green' : 'control-surface text-gray-text'}`}>
              <div className="flex items-center gap-3"><TagIcon size={20} weight={tags.length > 0 ? "fill" : "regular"} /><span className="text-[13px] font-bold">{tags.length > 0 ? `${tags.length} Tags` : 'Tags'}</span></div>
              <CaretRight size={14} className="opacity-40" />
            </button>

            <button onClick={() => setIsMusicOpen(true)} className={`w-full flex items-center justify-between p-4 min-h-[52px] rounded-[20px] transition-colors border border-border/40 ${musicPlaying ? 'bg-honey/10 border-honey/25 text-honey' : 'control-surface text-gray-text'}`}>
              <div className="flex items-center gap-3"><Headphones size={20} weight={musicPlaying ? "fill" : "regular"} /><span className="text-[13px] font-bold">{musicPlaying && activeMusicTrack ? activeMusicTrack.emoji : 'Sounds'}</span></div>
              <CaretRight size={14} className="opacity-40" />
            </button>

            <button onClick={toggleWhisper} className={`w-full flex items-center justify-between p-4 min-h-[52px] rounded-[20px] transition-colors border border-border/40 ${isWhispering ? 'bg-green/10 border-green/20 text-green' : 'control-surface text-gray-text'}`}>
              <div className="flex items-center gap-3">{isWhispering ? <Microphone size={20} weight="fill" /> : <MicrophoneSlash size={20} weight="regular" />}<span className="text-[13px] font-bold">Whisper</span></div>
            </button>

            <button onClick={() => setIsTasksOpen(true)} className={`w-full flex items-center justify-between p-4 min-h-[52px] rounded-[20px] transition-colors border border-border/40 ${tasks.some(t => !t.completed) ? 'bg-green/10 border-green/20 text-green' : 'control-surface text-gray-text'}`}>
              <div className="flex items-center gap-3"><ListChecks size={20} weight={tasks.some(t => !t.completed) ? "fill" : "regular"} /><span className="text-[13px] font-bold">{getTaskDrawerTriggerLabel(tasks).label}</span></div>
              <CaretRight size={14} className="opacity-40" />
            </button>
            
            <div className="grid grid-cols-2 gap-2 pt-2">
              <label className="control-surface flex flex-col items-center justify-center p-4 rounded-[20px] text-gray-text transition-colors cursor-pointer">
                <Paperclip size={20} className="mb-2" /><span className="text-[10px] font-bold uppercase">Files</span>
                <input type="file" multiple className="hidden" onChange={(e) => {
                  if (e.target.files) {
                    setNewAttachments((current) => [...current, ...Array.from(e.target.files || [])]);
                  }
                }} />
              </label>
              <label className="control-surface flex flex-col items-center justify-center p-4 rounded-[20px] text-gray-text transition-colors cursor-pointer">
                <ImageIcon size={20} className="mb-2" /><span className="text-[10px] font-bold uppercase">Cover</span>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                  if (e.target.files?.[0]) setImagePreview(URL.createObjectURL(e.target.files[0]));
                }} />
              </label>
            </div>
          </div>
        </aside>
      )}

      {/* â”€â”€ Main Canvas â”€â”€ */}
      <main
        className="relative flex-1 w-full pb-40 px-6 sm:px-12 md:px-16 lg:px-24 transition-[padding] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{ paddingTop: NATIVE_PAGE_TOP_PADDING }}
      >
        <div className={`max-w-[800px] transition-[margin,width] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${isFocusModeActive ? 'mx-auto' : 'mr-auto lg:ml-12 xl:ml-24'}`}>
          
          {/* Cover Image */}
          {imagePreview && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="surface-flat group relative mb-12 w-full aspect-[21/9] overflow-hidden rounded-[2rem]">
              <img src={imagePreview} alt="Cover" className="w-full h-full object-cover" />
              <button
                onClick={() => setImagePreview(null)}
                className="surface-floating surface-floating--media absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                aria-label="Remove cover image"
              >
                <X size={20} weight="regular" />
              </button>
            </motion.div>
          )}

          {/* Eyebrow Date */}
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-green/10 text-green px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold flex items-center gap-2">
              <CalendarBlank size={12} weight="regular" />
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsFocusModeEnabled((current) => {
                  const next = !current;
                  if (!next) {
                    setIsFlowing(false);
                  } else {
                    // Activate immediately when enabling
                    setIsFlowing(true);
                    lastFocusToggleRef.current = Date.now();
                  }
                  return next;
                });
              }}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] transition-colors sm:min-h-0 sm:px-3 sm:py-1 sm:text-[10px] ${
                isFocusModeEnabled
                  ? 'bg-green text-white'
                  : 'control-surface text-gray-text hover:bg-green/10 hover:text-green'
              }`}
            >
              <Target size={12} weight={isFocusModeEnabled ? 'fill' : 'bold'} />
              Focus mode
            </button>
            {canReflect && (
              <button onClick={handleAiReflect} disabled={isReflecting} className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] bg-green px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-green-hover disabled:opacity-60 sm:min-h-0 sm:px-3 sm:py-1 sm:text-[10px]">
                <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center sm:h-3 sm:w-3">
                  {isReflecting ? <CircleNotch size={14} className="animate-spin" /> : <Brain size={14} weight="regular" />}
                </span>
                <span className="leading-none">Reflect with AI</span>
              </button>
            )}
          </div>

          {whisperFeedback ? (
            <div className="mb-6">
              <Alert
                variant="info"
                title="Whisper needs a supported browser"
                description={whisperFeedback}
                icon={<MicrophoneSlash size={18} weight="fill" />}
              />
            </div>
          ) : null}

          {/* Title as H1 */}
          <input
            type="text"
            aria-label="Reflection title"
            placeholder="Untitled Reflection"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onFocus={() => { setIsFocused(true); setIsTitleFocused(true); setIsFlowing(false); }}
            onBlur={() => { setIsFocused(false); setIsTitleFocused(false); }}
            className="w-full bg-transparent border-none outline-none font-serif text-[36px] sm:text-[42px] md:text-[56px] leading-tight text-gray-text placeholder:text-border/40 mb-8 p-0"
          />

          <AnimatePresence>
            {isWhispering && interimTranscript && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-4 rounded-[2rem] bg-green/5 border border-green/10 text-green font-serif italic text-[18px]">
                {interimTranscript}...
              </motion.div>
            )}
          </AnimatePresence>

          <Editor 
            ref={editorInstanceRef} 
            value={content} 
            onChange={setContent} 
            onFocusChange={(nextIsFocused) => {
              setIsFocused(nextIsFocused);
              if (!nextIsFocused) {
                setIsFlowing(false);
              }
            }}
            placeholder={activePlaceholder || "What's on your mind?"} 
            ariaLabel="Reflection body"
            hideToolbar={isMobile}
            className="text-[20px] md:text-[22px] font-serif leading-[1.8] text-gray-text/90" 
          />

          {/* Word count â€” shown only after 50+ words */}
          {wordCount >= 50 && (
            <p className="mt-2 text-right text-[12px] font-medium text-gray-nav/40 select-none" aria-label={`${wordCount} words`}>
              {wordCount} words
            </p>
          )}
        </div>
      </main>

      {/* â”€â”€ Floating Actions â”€â”€ */}
      <div 
        className={`fixed z-50 flex gap-4 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${isFocusModeActive ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'} ${isMobile ? 'left-6 right-6 justify-between' : 'flex-col'}`}
        style={{ bottom: isMobile ? 'calc(2rem + env(safe-area-inset-bottom))' : '2.5rem', right: isMobile ? undefined : '2.5rem' }}
      >
        
        {/* Mobile Personalize FAB */}
        {isMobile && (
          <button 
            onClick={() => setIsMobileOptionsOpen(true)}
            className="surface-floating group relative flex h-16 w-16 items-center justify-center rounded-full hover:text-green"
            aria-label="Open reflection options"
          >
            <DotsThreeCircle size={28} weight="fill" className="opacity-80" />
          </button>
        )}

        {/* Interchangeable Action FAB (Spark / Save) */}
        <AnimatePresence mode="wait">
          {!hasContent ? (
            <Magnetic key="spark-mag" strength={20}>
              <motion.button
                key="spark-fab"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={cycleSparkPrompt}
                className="surface-floating group relative flex h-16 w-16 items-center justify-center rounded-full text-green"
                aria-label="Show another writing prompt"
              >
                <div className="absolute inset-2 rounded-full bg-green/5 group-hover:bg-green/10 transition-colors" />
                <Target size={28} weight="fill" />
              </motion.button>
            </Magnetic>
          ) : (
            <Magnetic key="save-mag" strength={20}>
              <motion.button
                key="save-fab"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setReleaseError(null);
                  setIsSaveChoiceOpen(true);
                }}
                disabled={saving || isReleasing}
                className="group relative h-16 w-16 rounded-full bg-green text-white shadow-2xl shadow-green/40 flex items-center justify-center transition-transform hover:scale-105"
                aria-label="Choose what to do with this reflection"
              >
                <div className="absolute inset-2 rounded-full bg-white/12 group-hover:scale-110 transition-transform duration-500 ease-out" />
                {saving || isReleasing ? <CircleNotch size={28} className="animate-spin" /> : <FloppyDisk size={26} weight="fill" className="relative z-10" />}
              </motion.button>
            </Magnetic>
          )}
        </AnimatePresence>
      </div>

      {/* â”€â”€ Shared Sheets â”€â”€ */}
      <ModalSheet
        isOpen={isMobile && isMobileOptionsOpen}
        onClose={() => setIsMobileOptionsOpen(false)}
        title="Personalize"
        size="sm"
        bodyClassName="pt-2"
      >
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => { setIsMobileOptionsOpen(false); setIsMoodOpen(true); }} className={`flex items-center gap-3 rounded-2xl border p-4 ${mood ? getMoodConfig(mood)?.nav || 'bg-green/10 border-green/20 text-green' : 'control-surface text-gray-text'}`}><ActiveMoodIcon size={24} weight={mood ? "fill" : "regular"} /><span className="text-[14px] font-bold capitalize">{mood ? getMoodConfig(mood)?.label || mood : 'Mood'}</span></button>
          <button onClick={() => { setIsMobileOptionsOpen(false); setIsTagsOpen(true); }} className={`flex items-center gap-3 rounded-2xl border p-4 ${tags.length > 0 ? 'bg-green/10 border-green/20 text-green' : 'control-surface text-gray-text'}`}><TagIcon size={24} weight={tags.length > 0 ? "fill" : "regular"} /><span className="text-[14px] font-bold">Tags</span></button>
          <button onClick={() => { setIsMobileOptionsOpen(false); setIsMusicOpen(true); }} className={`flex items-center gap-3 rounded-2xl border p-4 ${musicPlaying ? 'bg-green/10 border-green/20 text-green' : 'control-surface text-gray-text'}`}><Headphones size={24} weight={musicPlaying ? "fill" : "regular"} /><span className="text-[14px] font-bold">Sounds</span></button>
          <button onClick={() => { setIsMobileOptionsOpen(false); setIsTasksOpen(true); }} className={`flex items-center gap-3 rounded-2xl border p-4 ${tasks.some(t => !t.completed) ? 'bg-green/10 border-green/20 text-green' : 'control-surface text-gray-text'}`}><ListChecks size={24} weight={tasks.some(t => !t.completed) ? "fill" : "regular"} /><span className="text-[14px] font-bold">Tasks</span></button>
          <button onClick={toggleWhisper} className={`flex items-center gap-3 rounded-2xl border p-4 ${isWhispering ? 'bg-green/10 border-green/20 text-green' : 'control-surface text-gray-text'}`}>{isWhispering ? <Microphone size={24} weight="fill" /> : <MicrophoneSlash size={24} weight="regular" />}<span className="text-[14px] font-bold">Whisper</span></button>

          <label className="control-surface flex cursor-pointer items-center gap-3 rounded-2xl p-4 text-gray-text transition-colors hover:border-green/20 hover:bg-green/5">
            <Paperclip size={24} weight="regular" /><span className="text-[14px] font-bold">Files</span>
            <input type="file" multiple className="hidden" onChange={(e) => {
              if (e.target.files) {
                setNewAttachments((current) => [...current, ...Array.from(e.target.files || [])]);
              }
              setIsMobileOptionsOpen(false);
            }} />
          </label>
          <label className="control-surface flex cursor-pointer items-center gap-3 rounded-2xl p-4 text-gray-text transition-colors hover:border-green/20 hover:bg-green/5">
            <ImageIcon size={24} weight="regular" /><span className="text-[14px] font-bold">Cover</span>
            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
              if (e.target.files?.[0]) setImagePreview(URL.createObjectURL(e.target.files[0]));
              setIsMobileOptionsOpen(false);
            }} />
          </label>
        </div>
      </ModalSheet>

      <ModalSheet
        isOpen={isSaveChoiceOpen}
        onClose={() => {
          if (!saving && !isReleasing) setIsSaveChoiceOpen(false);
        }}
        title="Choose what this becomes"
        icon={<FloppyDisk size={20} weight="duotone" />}
        size="sm"
        bodyClassName="pt-2"
      >
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || isReleasing}
            aria-label="Save reflection"
            className="flex min-h-16 w-full items-center justify-between rounded-2xl border border-green bg-green p-4 text-left text-white transition-colors hover:bg-green-hover disabled:opacity-60"
          >
            <span>
              <span className="block text-[15px] font-bold text-white">Save reflection</span>
              <span className="mt-1 block text-[12px] font-medium text-white/75">Keep this as a saved note.</span>
            </span>
            {saving ? <CircleNotch size={20} className="animate-spin" /> : <FloppyDisk size={20} weight="regular" />}
          </button>

          <button
            type="button"
            onClick={handleReleaseDraft}
            disabled={saving || isReleasing}
            aria-label="Release this writing without saving a note"
            className="flex min-h-16 w-full items-center justify-between rounded-2xl border border-clay/20 bg-clay/5 p-4 text-left text-clay transition-colors hover:border-clay/35 hover:bg-clay/10 disabled:opacity-60"
          >
            <span>
              <span className="block text-[15px] font-bold text-gray-text">Release</span>
              <span className="mt-1 block text-[12px] font-medium text-gray-light">Let it go without creating a note.</span>
            </span>
            {isReleasing ? <CircleNotch size={20} className="animate-spin" /> : <Wind size={20} weight="duotone" />}
          </button>

          {releaseError ? (
            <p className="text-[13px] font-bold leading-relaxed text-clay" aria-live="polite">
              {releaseError}
            </p>
          ) : null}
        </div>
      </ModalSheet>

      <ModalSheet
        isOpen={isTasksOpen}
        onClose={() => setIsTasksOpen(false)}
        title="Tasks"
        icon={<ListChecks size={24} weight="bold" className="text-green" />}
        size="md"
        bodyClassName="max-h-[72vh] pt-2"
      >
        <div className="flex flex-col gap-6">
          <div className="space-y-2 overflow-y-auto">
            {getOrderedTasks(tasks).map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                updateTask={(taskId, updates) => setTasks(tasks.map((item) => item.id === taskId ? { ...item, ...updates } : item))}
                toggleTask={(taskId) => setTasks(tasks.map((item) => item.id === taskId ? { ...item, completed: !item.completed } : item))}
                removeTask={(taskId) => setTasks(tasks.filter((item) => item.id !== taskId))}
              />
            ))}
          </div>

          <Button onClick={() => setTasks([...tasks, { id: Math.random().toString(36).substr(2, 9), text: '', completed: false }])} className="h-14 w-full rounded-2xl bg-green text-white font-bold">
            <Plus size={20} weight="regular" className="mr-2" /> Add Task
          </Button>
        </div>
      </ModalSheet>

      <ModalSheet
        isOpen={isTagsOpen}
        onClose={() => setIsTagsOpen(false)}
        title="Tags"
        size="sm"
        bodyClassName="pt-2"
      >
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="flex items-center gap-2 rounded-xl bg-green/10 px-3 py-1.5 text-[12px] font-bold text-green">
                #{tag}
                <button
                  type="button"
                  onClick={() => setTags(tags.filter((item) => item !== tag))}
                  className="text-green/70 hover:text-clay"
                  aria-label={`Remove ${tag} tag`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>

          <input
            type="text"
            value={tagInput}
            placeholder="Add tag and press Enter"
            className="input-surface w-full px-4 py-3 text-[14px] font-semibold text-gray-text"
            onChange={(event) => setTagInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && tagInput.trim()) {
                event.preventDefault();
                setTags([...tags, tagInput.trim()]);
                setTagInput('');
              }
            }}
          />
        </div>
      </ModalSheet>

      <ModalSheet
        isOpen={isMoodOpen}
        onClose={() => setIsMoodOpen(false)}
        title="Mood"
        size="sm"
        bodyClassName="pt-2"
      >
        <div className="grid grid-cols-3 gap-3">
          {MOOD_OPTIONS.map((entry) => {
            const moodConfig = MOOD_CONFIG[entry];
            const Icon = moodConfig.icon;

            return (
              <button
                key={entry}
                onClick={() => {
                  if (mood === entry) {
                    setMood(undefined);
                  } else {
                    setMood(entry);
                  }
                  setIsMoodOpen(false);
                }}
                className={`flex flex-col items-center rounded-2xl border-2 p-4 transition-colors ${mood === entry ? moodConfig.modal : `${moodConfig.option} dark:bg-white/5`}`}
              >
                <Icon size={32} weight={mood === entry ? 'fill' : 'regular'} className="mb-2" />
                <span className="text-[12px] font-bold">{moodConfig.label}</span>
              </button>
            );
          })}
        </div>
      </ModalSheet>

      <ModalSheet
        isOpen={isMusicOpen}
        onClose={() => setIsMusicOpen(false)}
        title="Sounds"
        size="sm"
        bodyClassName="pt-2"
      >
        <div className="space-y-2">
          {AMBIENT_TRACKS.map((track) => (
            <button
              key={track.id}
              onClick={() => {
                void handleTrackSelect(track);
              }}
              disabled={pendingTrackId !== null && pendingTrackId !== track.id}
              className={`flex w-full items-center justify-between rounded-2xl border-2 p-4 text-left text-[14px] font-bold transition-opacity ${activeMusicTrack?.id === track.id || pendingTrackId === track.id ? 'border-green bg-green/10 text-green' : 'control-surface text-gray-text hover:border-border hover:bg-green/5'} ${pendingTrackId !== null && pendingTrackId !== track.id ? 'opacity-60' : ''}`}
            >
              <span className="flex items-center gap-3">
                <span className="text-[18px]">{track.emoji}</span>
                {track.label}
              </span>

              {pendingTrackId === track.id ? (
                <InlineLoadingBadge label="Starting..." className="shrink-0" />
              ) : null}

              {activeMusicTrack?.id === track.id && pendingTrackId !== track.id ? (
                <span className="metadata-pill metadata-pill--sage">
                  <Check size={14} weight="bold" />
                  <span className="leading-none">Playing</span>
                </span>
              ) : null}
            </button>
          ))}

          <button onClick={handleStopMusic} className="mt-2 w-full rounded-2xl border-2 border-transparent p-4 font-bold text-clay transition-colors hover:bg-clay/5">Stop All</button>
        </div>
      </ModalSheet>

      <ModalSheet
        isOpen={Boolean(aiReflection)}
        onClose={() => setAiReflection(null)}
        title="AI reflection"
        icon={<Brain size={24} weight="duotone" className="text-green" />}
        size="lg"
        tone="sage"
        bodyClassName="pt-4"
      >
        <div className="space-y-8">
          <div className="surface-inline-panel surface-tone-sage p-5 sm:p-6">
            <p className="text-[20px] leading-relaxed text-gray-text font-serif italic">"{aiReflection}"</p>
          </div>
          <Button variant="primary" className="h-14 w-full rounded-2xl" onClick={() => setAiReflection(null)}>
            Back to writing
          </Button>
        </div>
      </ModalSheet>

      <ConfirmationDialog
        isOpen={showLeaveDialog}
        onClose={handleStayOnDraft}
        onConfirm={handleLeaveDraft}
        title="Leave this draft?"
        confirmLabel="Leave without saving"
        cancelLabel="Keep writing"
      />
      <CompanionObservation isVisible={showObservation} text={observationText || ""} onComplete={() => { setShowObservation(false); navigateWithBypass(RoutePath.HOME, { state: { fromSave: true } }); }} />
      <PaperPlaneToast isVisible={showPlane} onAnimationComplete={() => {}} />
    </div>
  );
};
