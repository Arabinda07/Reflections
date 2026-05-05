import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { RoutePath, Task } from '../../types';
import { CompanionObservation } from '../../components/ui/CompanionObservation';
import { ModalSheet } from '../../components/ui/ModalSheet';
import { PaperPlaneToast } from '../../components/ui/PaperPlaneToast';
import { InlineLoadingBadge } from '../../components/ui/InlineLoadingBadge';
import { DEFAULT_WELLNESS_PROMPTS, getCurrentWellnessPrompt, getNextWellnessPromptState } from '../../services/wellnessPrompts';
import { aiService } from '../../services/aiService';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useNoteDraft } from '../../hooks/useNoteDraft';
import { useFocusMode } from '../../hooks/useFocusMode';
import { useWhisperInput } from '../../hooks/useWhisperInput';
import { getOrderedTasks, getTaskDrawerTriggerLabel } from './createNoteTasks';
import { canNavigateBackInApp } from '../../src/native/androidBack';
import { NATIVE_PAGE_TOP_PADDING, NATIVE_TOP_CONTROL_OFFSET } from '../../src/native/safeArea';
import { ProUpgradeCTA } from '../../components/ui/ProUpgradeCTA';
import trailLoadingAnimation from '@/src/lottie/trail-loading.json';
import { MOOD_CONFIG, MOOD_OPTIONS, getMoodConfig } from './moodConfig';

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
  const [isSwipingToDelete, setIsSwipingToDelete] = useState(false);
  const [rippleKey, setRippleKey] = useState(0);
  const haptics = useHaptics();
  const wasCompleted = useRef(task.completed);
  const taskLabel = task.text.trim() || 'untitled task';

  useEffect(() => {
    if (task.completed) {
      if (!wasCompleted.current) {
        setRippleKey((key) => key + 1);
        // Fire haptic when checking off
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(10);
        }
      }
      const timer = window.setTimeout(() => setShowCompletedText(true), 180);
      wasCompleted.current = true;
      return () => window.clearTimeout(timer);
    }
    setShowCompletedText(false);
    wasCompleted.current = false;
  }, [task.completed]);

  return (
    <div className="relative overflow-hidden rounded-2xl mb-1 group/row">
      <div className="absolute inset-0 flex items-center justify-end bg-clay/10 px-5 rounded-2xl">
        <Trash size={18} weight="fill" className={`text-clay transition-transform duration-300 ${isSwipingToDelete ? 'scale-125' : 'group-hover/row:scale-110'}`} />
      </div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.4}
        onDrag={(e, info) => {
          if (info.offset.x < -60 && !isSwipingToDelete) {
             setIsSwipingToDelete(true);
             haptics.impactMedium();
          } else if (info.offset.x >= -60 && isSwipingToDelete) {
             setIsSwipingToDelete(false);
          }
        }}
        onDragEnd={(e, { offset, velocity }) => {
          setIsSwipingToDelete(false);
          if (offset.x < -60 || velocity.x < -500) {
            removeTask(task.id);
          }
        }}
        layout="position"
        className={`group relative z-10 flex items-center gap-3 rounded-2xl p-3 bg-surface transition-colors duration-300 hover:bg-green/5 dark:hover:bg-white/5 ${task.completed ? 'opacity-60' : ''}`}
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
        className="relative z-10 flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center group/checkbox"
      >
        <div className={`flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-colors duration-300 ${
          task.completed ? 'border-green bg-green text-white' : 'border-border text-transparent group-hover/checkbox:border-green/50'
        }`}>
          <motion.span animate={{ scale: task.completed ? 1 : 0 }}>
            <Check size={14} weight="bold" />
          </motion.span>
        </div>
      </button>

      <div className="relative flex-1 z-10 flex items-center">
        <input
          type="text"
          value={task.text}
          onChange={(e) => updateTask(task.id, { text: e.target.value })}
          readOnly={task.completed}
          placeholder="What needs to be done?"
          aria-label={`Edit task: ${taskLabel}`}
          className={`w-full bg-transparent border-none outline-none font-bold text-[14px] placeholder:text-gray-nav/40 transition-all duration-300 ${
            showCompletedText ? 'text-gray-text/40' : 'text-gray-text'
          }`}
        />
        {/* Animated Strikethrough */}
        <motion.div
          initial={false}
          animate={{ scaleX: showCompletedText ? 1 : 0, opacity: showCompletedText ? 1 : 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="pointer-events-none absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 origin-left bg-green"
        />
      </div>

      <button
        type="button"
        onClick={() => removeTask(task.id)}
        aria-label={`Remove task: ${taskLabel}`}
        className="opacity-0 lg:group-hover:opacity-100 flex min-h-[44px] min-w-[44px] items-center justify-center text-gray-nav hover:text-clay transition-opacity"
      >
        <Trash size={16} />
      </button>
      </motion.div>
    </div>
  );
};

export const CreateNote: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialPrompt = location.state?.initialPrompt;

  // â”€â”€ Core draft lifecycle (state, save, release, navigation blocking) â”€â”€
  const draft = useNoteDraft();

  // â”€â”€ Focus/flow mode â”€â”€
  const [isFocused, setIsFocused] = useState(false);
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const focusMode = useFocusMode({ isEditorFocused: isFocused, isTitleFocused });

  // â”€â”€ Whisper (speech-to-text) â”€â”€
  const whisper = useWhisperInput(
    useCallback((text: string) => {
      draft.setContent((prev: string) => {
        const clean = prev === '<p><br></p>' ? '' : prev;
        if (!clean) return `<p>${text}</p>`;
        return clean.endsWith('</p>') ? clean.slice(0, -4) + ' ' + text + '</p>' : clean + ' ' + text;
      });
    }, [draft.setContent]),
  );

  // â”€â”€ UI-local state (modals, editor chrome) â”€â”€
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const [tagInput, setTagInput] = useState('');
  const [activePlaceholder, setActivePlaceholder] = useState<string | null>(
    initialPrompt || getCurrentWellnessPrompt(0, DEFAULT_WELLNESS_PROMPTS),
  );
  const [promptIndex, setPromptIndex] = useState(0);
  const [isReflecting, setIsReflecting] = useState(false);
  const [aiReflection, setAiReflection] = useState<string | null>(null);
  const [isMobileOptionsOpen, setIsMobileOptionsOpen] = useState(false);
  const [isMoodOpen, setIsMoodOpen] = useState(false);
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [isMusicOpen, setIsMusicOpen] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isSaveChoiceOpen, setIsSaveChoiceOpen] = useState(false);
  const [releaseError, setReleaseError] = useState<string | null>(null);
  const [releaseSuccess, setReleaseSuccess] = useState<string | null>(null);
  const [newTaskText, setNewTaskText] = useState('');
  const [pendingTrackId, setPendingTrackId] = useState<string | null>(null);
  const [showObservation, setShowObservation] = useState(false);
  const [observationText, setObservationText] = useState<string | null>(null);
  const [showPlane, setShowPlane] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  const { isPlaying: musicPlaying, activeTrack: activeMusicTrack, playTrack: playMusicTrack, stopAll: stopMusic } = useAmbientAudio();
  const haptics = useHaptics();
  const { playSaveChime } = useSound();
  const ActiveMoodIcon = getMoodConfig(draft.mood)?.icon || Smiley;
  const editorInstanceRef = useRef<EditorRef>(null);
  const isUnmounted = useRef(false);

  useEffect(() => {
    isUnmounted.current = false;
    return () => { isUnmounted.current = true; };
  }, []);

  // Aliases from draft hook for template readability
  const { title, setTitle, content, setContent, mood, setMood, tags, setTags, tasks, setTasks } = draft;
  const { imagePreview, setImagePreview, loading, saving, releasing: isReleasing, canCreateNote, setCanCreateNote, hasUnsavedChanges } = draft;
  const { blocker, navigateWithBypass } = draft;
  const id = undefined as string | undefined; // id is read internally by useNoteDraft via useParams

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

  // Blocker â†’ leave dialog sync
  useEffect(() => {
    if (blocker.state === 'blocked') {
      setShowLeaveDialog(true);
      return;
    }
    if (blocker.state === 'unblocked') {
      setShowLeaveDialog(false);
    }
  }, [blocker.state]);

  // â”€â”€ Save handler (delegates to draft.save, adds UI feedback) â”€â”€
  const handleSave = async () => {
    if (!draft.currentSnapshot.title && !draft.currentSnapshot.content) return;

    setIsSaveChoiceOpen(false);
    setShowPlane(true);

    const result = await draft.save();

    if (isUnmounted.current) return;
    setShowPlane(false);

    haptics.confirming();
    playSaveChime();

    if (result.observation) {
      setObservationText(result.observation.text);
      setShowObservation(true);
    } else {
      navigateWithBypass(RoutePath.HOME, { state: { fromSave: true } });
    }
  };

  // â”€â”€ Release handler â”€â”€
  const handleReleaseDraft = async () => {
    if (!draft.currentSnapshot.title && !draft.currentSnapshot.content) return;
    setReleaseError(null);

    const error = await draft.release();
    if (error) {
      setReleaseError(error);
    } else {
      setReleaseSuccess('Released.');
      setTimeout(() => {
        setIsSaveChoiceOpen(false);
        setReleaseSuccess(null);
        navigateWithBypass(RoutePath.HOME, { state: { fromSave: true } });
      }, 1500);
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

  const handleAiReflect = async () => {
    if (!content || content === '<p><br></p>') return;
    setIsReflecting(true);
    setAiReflection(null);
    try {
      const now = new Date().toISOString();
      const reflection = await aiService.generateReflection({
        id: 'draft-reflection-preview',
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

  // â”€â”€ Derived values â”€â”€
  const hasContent = Boolean(draft.currentSnapshot.content);
  const wordCount = React.useMemo(() => {
    return draft.currentSnapshot.content.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length;
  }, [draft.currentSnapshot.content]);
  const canReflect = wordCount >= 100;
  const isFocusModeActive = focusMode.isActive;
  const isFocusModeEnabled = focusMode.isEnabled;
  const isWhispering = whisper.isWhispering;
  const interimTranscript = whisper.interimTranscript;
  const whisperFeedback = whisper.feedback;
  const toggleWhisper = whisper.toggle;
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
      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Mobile Back Button Ã¢â€â‚¬Ã¢â€â‚¬ */}
      {isMobile && (
        <button 
          onClick={handleMobileBack}
          className={`surface-floating fixed left-4 z-floating flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] transition hover:text-green ${isFocusModeActive ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}`}
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
            focusMode.disable();
          }}
          className="surface-floating fixed right-4 z-sticky-nav inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 label-caps text-green hover:text-green"
          style={{ top: NATIVE_TOP_CONTROL_OFFSET }}
        >
          <X size={12} weight="regular" />
          Exit focus
        </button>
      ) : null}

      {/* â”€â”€ Desktop Sidebar â”€â”€ */}
      {!isMobile && (
        <aside className={`${getSurfacePanelForMood(mood)} flex flex-col min-h-0 z-40 transition-[width,opacity,transform,border] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] border-r border-green/15 ${isFocusModeActive ? 'w-0 opacity-0 -translate-x-full overflow-hidden border-r-0' : 'w-[240px] opacity-100 translate-x-0'}`}>
          <div className="pt-8 px-6 pb-6 flex-1 overflow-y-auto custom-scrollbar space-y-4">
            
            {/* Desktop Back Button */}
            <button 
              onClick={() => navigate(RoutePath.NOTES)}
              className="flex min-h-11 items-center gap-2 text-gray-nav hover:text-gray-text text-[13px] font-bold mb-8 group transition-colors"
            >
              <div className="control-surface flex h-8 w-8 items-center justify-center transition-colors group-hover:border-green/20 group-hover:bg-green/5">
                <ArrowLeft size={14} weight="regular" />
              </div>
              Back to Notes
            </button>

            <span className="label-caps ml-2 text-gray-nav opacity-50">Personalize</span>
            
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
                draft.addFiles(Array.from(e.target.files || []));
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

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Main Canvas Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <main
        className="relative flex-1 w-full pb-40 px-6 sm:px-12 md:px-16 lg:px-24 transition-[padding] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{ paddingTop: NATIVE_PAGE_TOP_PADDING }}
      >
        <div className={`editor-writing-measure transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${isFocusModeActive ? 'mx-auto scale-[1.02]' : 'mr-auto lg:ml-12 xl:ml-24 scale-100'}`}>
          
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
            <span className="label-caps flex items-center gap-2 rounded-full bg-green/10 px-3 py-1 text-green">
              <CalendarBlank size={12} weight="regular" />
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}
            </span>
            <button
              type="button"
              aria-pressed={isFocusModeEnabled}
              onClick={() => {
                focusMode.toggle();
              }}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 label-caps transition-colors sm:min-h-0 sm:px-3 sm:py-1 ${
                isFocusModeEnabled
                  ? 'bg-green text-white'
                  : 'control-surface text-gray-text hover:bg-green/10 hover:text-green'
              }`}
            >
              <Target size={12} weight={isFocusModeEnabled ? 'fill' : 'bold'} />
              Focus mode
            </button>
            {canReflect && (
              <button onClick={handleAiReflect} disabled={isReflecting} className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] bg-green px-4 py-2 label-caps text-white transition-colors hover:bg-green-hover disabled:opacity-60 sm:min-h-0 sm:px-3 sm:py-1">
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
            onFocus={() => { setIsFocused(true); setIsTitleFocused(true); }}
            onBlur={() => { setIsFocused(false); setIsTitleFocused(false); }}
            className="editor-title-input"
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
            }}
            placeholder={activePlaceholder || "What's on your mind?"} 
            ariaLabel="Reflection body"
            hideToolbar={isMobile}
            className="text-[20px] md:text-[22px] font-serif leading-[1.8] text-gray-text/90" 
          />

          {/* Word count Ã¢â‚¬â€ shown only after 50+ words */}
          {wordCount >= 50 && (
            <p className="mt-2 text-right text-[12px] font-medium text-gray-nav/40 select-none" aria-label={`${wordCount} words`}>
              {wordCount} words
            </p>
          )}
        </div>
      </main>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Floating Actions Ã¢â€â‚¬Ã¢â€â‚¬ */}
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
                className="group relative h-16 w-16 rounded-full bg-green text-white shadow-2xl shadow-green/40 flex items-center justify-center transition-transform hover:scale-105 disabled:opacity-90"
                aria-label="Choose what to do with this reflection"
              >
                {/* Breathing Pulse Effect during save */}
                <AnimatePresence>
                  {(saving || isReleasing) && (
                    <motion.div
                      initial={{ scale: 1, opacity: 0.8 }}
                      animate={{ scale: 1.2, opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                      className="absolute inset-0 rounded-full bg-green pointer-events-none"
                    />
                  )}
                </AnimatePresence>
                
                <div className="absolute inset-2 rounded-full bg-white/12 group-hover:scale-110 transition-transform duration-500 ease-out" />
                {saving || isReleasing ? <CircleNotch size={28} className="relative z-10 animate-spin" /> : <FloppyDisk size={26} weight="fill" className="relative z-10" />}
              </motion.button>
            </Magnetic>
          )}
        </AnimatePresence>
      </div>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Shared Sheets Ã¢â€â‚¬Ã¢â€â‚¬ */}
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
                draft.addFiles(Array.from(e.target.files || []));
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

          {releaseSuccess ? (
            <p className="text-sm font-bold text-clay mt-2 text-center" aria-live="polite">
              {releaseSuccess}
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

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (newTaskText.trim()) {
                setTasks([...tasks, { id: Math.random().toString(36).substr(2, 9), text: newTaskText.trim(), completed: false }]);
                setNewTaskText('');
              }
            }} 
            className="flex items-center gap-3 mt-4"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-border">
              <Plus size={12} weight="bold" className="text-gray-nav/40" />
            </div>
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="What needs to be done?"
              className="flex-1 bg-transparent border-none outline-none font-bold text-[14px] text-gray-text placeholder:text-gray-nav/40"
            />
            {newTaskText.trim() && (
              <Button type="submit" variant="primary" size="sm" className="shrink-0">
                Add
              </Button>
            )}
          </form>
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
