import {
  Archive,
  ArrowsClockwise,
  Brain,
  CaretRight,
  CheckCircle as CheckCircleIcon,
  Feather,
  FolderOpen,
  Heart,
  ListChecks,
  LockKey,
  NotePencil,
  EnvelopeSimple,
  Plus,
  Sparkle,
  Target,
} from '@phosphor-icons/react';
import { animate, motion, useReducedMotion, AnimatePresence, Variants } from 'motion/react';
import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isSameDay } from 'date-fns';

import { AmbientMusicButton } from '../../components/ui/AmbientMusicButton';
import { Button } from '../../components/ui/Button';
import { ModalSheet } from '../../components/ui/ModalSheet';
import { useToast } from '../../components/ui/Toast';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useHaptics } from '../../hooks/useHaptics';
import { aiService } from '../../services/aiService';
import { moodCheckinService } from '../../services/engagementServices';
import { noteService } from '../../services/noteService';
import { DEFAULT_WELLNESS_PROMPTS } from '../../services/wellnessPrompts';
import { supabase } from '../../src/supabaseClient';
import { Note, RoutePath } from '../../types';
import {
  buildHomeIntentionSummary,
  getHomeIntentionToggleUpdate,
  MAX_ACTIVE_INTENTIONS,
  type HomeIntentionSummary,
} from './homeIntentions';
import { MOOD_CONFIG, MOOD_OPTIONS } from './moodConfig';
const bentoContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const bentoItemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
};

const WRITING_NOTES = [
  {
    text: 'Start with the sentence that keeps trying to get your attention.',
    author: 'Julia Cameron',
  },
  {
    text: 'You do not need to explain the whole day. One true detail is enough.',
    author: 'Natalie Goldberg',
  },
  {
    text: 'Write what happened. Then write what stayed with you.',
    author: 'Joan Didion',
  },
  { text: 'If the thought feels messy, put it down messy.', author: 'Natalie Goldberg' },
  { text: 'Notice the thing you keep circling. It may be asking for a name.', author: 'Julia Cameron' },
  { text: 'You do not have to be certain before you start writing.', author: 'Reflections' },
];

const ONBOARDING_STEPS = [
  {
    label: 'Intro',
    title: 'A private space for notes',
    body:
      'This is a private journal for your writing. Use it to get thoughts down and come back to them later.',
    note: 'One honest line is already enough to begin.',
  },
  {
    label: 'Focus',
    title: 'Focus on the writing',
    body:
      'Start with one sentence. Write what you need to say and let the page hold the rest.',
    note: 'The page can hold the unfinished part too.',
  },
  {
    label: 'Privacy',
    title: 'Private and secure',
    body:
      'Your notes stay with you. AI only runs if you specifically ask it to help you find a pattern.',
    note: 'Support appears only when you invite it in.',
  },
  {
    label: 'Ready',
    title: 'Ready to start',
    body:
      'Start with a blank note or use a daily focus prompt. Your archived reflections are always available.',
    note: 'When you are ready, begin with the smallest true thing.',
  },
];

const onboardingStepIcons = [NotePencil, Feather, LockKey, Archive] as const;

const BENTO_VIEWPORT_CONFIG = { once: true, margin: "-100px" };

export const HomeAuthenticated: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const haptics = useHaptics();
  const isFromSave = location.state?.fromSave;
  const { user } = useAuthStore();
  const [noteCount, setNoteCount] = useState<number | null>(null);
  const [displayCount, setDisplayCount] = useState<number | string>('...');
  const [isCountLoading, setIsCountLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [dailyPrompt, setDailyPrompt] = useState(DEFAULT_WELLNESS_PROMPTS[0]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isSavingCheckIn, setIsSavingCheckIn] = useState(false);
  const [checkInFeedback, setCheckInFeedback] = useState<string | null>(null);
  const [intentionFeedback, setIntentionFeedback] = useState<string | null>(null);
  const [quote, setQuote] = useState({ text: '', author: '' });
  const [taskNotes, setTaskNotes] = useState<Note[]>([]);
  const [intentionSummary, setIntentionSummary] = useState<HomeIntentionSummary>(() =>
    buildHomeIntentionSummary([]),
  );
  const [newTaskText, setNewTaskText] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isIntentionModalOpen, setIsIntentionModalOpen] = useState(false);
  const [isHeroVideoReady, setIsHeroVideoReady] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const { showToast } = useToast();

  const entranceDuration = isFromSave ? 0.3 : 0.8;
  const currentOnboardingStep = ONBOARDING_STEPS[onboardingStep];
  const isLastOnboardingStep = onboardingStep === ONBOARDING_STEPS.length - 1;
  const CurrentOnboardingIcon = onboardingStepIcons[onboardingStep];

  useEffect(() => {
    setDailyPrompt(
      DEFAULT_WELLNESS_PROMPTS[Math.floor(Math.random() * DEFAULT_WELLNESS_PROMPTS.length)],
    );

    const loadQuotes = async () => {
      const cached = localStorage.getItem('dynamic_writing_notes');
      const lastFetch = localStorage.getItem('dynamic_writing_notes_time');
      const now = Date.now();
      const ONE_DAY = 24 * 60 * 60 * 1000;

      let quotesPool = WRITING_NOTES;

      if (cached && lastFetch && now - Number(lastFetch) < ONE_DAY) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            quotesPool = [...WRITING_NOTES, ...parsed];
          }
        } catch (e) {
          console.error('Could not parse cached quotes', e);
        }
      } else {
        // Fetch new quotes from AI
        try {
          const freshQuotes = await aiService.generateWritingNotes();
          if (freshQuotes.length > 0) {
            localStorage.setItem('dynamic_writing_notes', JSON.stringify(freshQuotes));
            localStorage.setItem('dynamic_writing_notes_time', now.toString());
            quotesPool = [...WRITING_NOTES, ...freshQuotes];
          }
        } catch (e) {
          console.error('Could not fetch dynamic quotes', e);
        }
      }

      setQuote(quotesPool[Math.floor(Math.random() * quotesPool.length)]);
    };

    loadQuotes();

    const hasSeen = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeen) setShowOnboarding(true);
  }, []);

  const refreshPrompt = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      if (isRefreshing) return;
      setIsRefreshing(true);

      let nextPrompt = dailyPrompt;
      while (nextPrompt === dailyPrompt) {
        nextPrompt =
          DEFAULT_WELLNESS_PROMPTS[
            Math.floor(Math.random() * DEFAULT_WELLNESS_PROMPTS.length)
          ];
      }

      setDailyPrompt(nextPrompt);
      window.requestAnimationFrame(() => {
        setIsRefreshing(false);
      });
    },
    [dailyPrompt, isRefreshing],
  );

  useEffect(() => {
    if (noteCount === null) return;

    if (shouldReduceMotion) {
      setDisplayCount(noteCount);
      return;
    }

    const controls = animate(0, noteCount, {
      duration: 2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(value) {
        setDisplayCount(Math.round(value));
      },
    });

    return () => controls.stop();
  }, [noteCount, shouldReduceMotion]);

  const handleCloseOnboarding = useCallback(() => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setOnboardingStep(0);
    setShowOnboarding(false);
  }, []);

  const handleFinishOnboarding = useCallback(() => {
    handleCloseOnboarding();
    // Route directly to the editor with a gentle first-time prompt
    navigate(RoutePath.CREATE_NOTE, { state: { initialPrompt: "What's on your mind?" } });
  }, [handleCloseOnboarding, navigate]);

  const handleSkipOnboarding = useCallback(() => {
    handleCloseOnboarding();
    navigate(RoutePath.DASHBOARD, { replace: true });
  }, [handleCloseOnboarding, navigate]);

  const updateIntentionSummary = useCallback((notes: Note[]) => {
    setTaskNotes(notes);
    setIntentionSummary(buildHomeIntentionSummary(notes));
  }, []);

  const handleNextOnboardingStep = useCallback(() => {
    if (isLastOnboardingStep) {
      handleFinishOnboarding();
      return;
    }

    setOnboardingStep((current) => Math.min(current + 1, ONBOARDING_STEPS.length - 1));
  }, [handleFinishOnboarding, isLastOnboardingStep]);

  const handlePreviousOnboardingStep = useCallback(() => {
    setOnboardingStep((current) => Math.max(current - 1, 0));
  }, []);

  useEffect(() => {
    if (location.state?.justLoggedIn) {
      haptics.success();
      // Clear the state so it doesn't trigger again on reload
      window.history.replaceState({}, '');
    }
  }, [location.state, haptics]);

  useEffect(() => {
    const fetchCount = async () => {
      if (!user) return;

      setIsCountLoading(true);
      try {
        const [count, notes] = await Promise.all([
          noteService.getCount(),
          noteService.getAll()
        ]);
        setNoteCount(count);
        updateIntentionSummary(notes);
      } catch {
        setNoteCount(0);
        updateIntentionSummary([]);
      } finally {
        setIsCountLoading(false);
      }
    };

    fetchCount();

    const channel = supabase
      .channel('note-count-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes' },
        () => fetchCount(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [updateIntentionSummary, user]);

  const handleCreateClick = (prompt?: string) => {
    if (prompt) {
      navigate(RoutePath.CREATE_NOTE, { state: { initialPrompt: prompt } });
      return;
    }

    navigate(RoutePath.CREATE_NOTE);
  };


  const handleMoodCheckIn = async (mood: string) => {
    if (isSavingCheckIn) return;

    setIsSavingCheckIn(true);
    setCheckInFeedback(null);

    try {
      await moodCheckinService.create({
        mood,
        source: 'home',
      });
      setCheckInFeedback(mood);
      setTimeout(() => {
        setIsCheckInOpen(false);
        setTimeout(() => setCheckInFeedback(null), 300);
      }, 1500);
    } catch (error) {
      console.error('Could not save mood check-in:', error);
      setCheckInFeedback('error');
    } finally {
      setIsSavingCheckIn(false);
    }
  };

  const handleToggleIntention = async (noteId: string, taskId: string) => {
    try {
      const note = taskNotes.find((item) => item.id === noteId) || await noteService.getById(noteId);
      if (!note) return;

      const update = getHomeIntentionToggleUpdate(note, taskId);
      if (!update) return;

      const updatedNote = await noteService.update(noteId, update);
      const nextNotes = taskNotes.some((item) => item.id === noteId)
        ? taskNotes.map((item) => (item.id === noteId ? updatedNote : item))
        : [...taskNotes, updatedNote];
      updateIntentionSummary(nextNotes);
    } catch (err) {
      console.error('Could not update intention:', err);
    }
  };

  const handleCreateIntention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim() || isCreatingTask) return;

    if (intentionSummary.openCount >= MAX_ACTIVE_INTENTIONS) {
      showToast('Cross off an existing intention first to keep your focus.');
      return;
    }

    setIsCreatingTask(true);
    try {
      let targetNote = taskNotes[0];
      
      const newTask = {
        id: crypto.randomUUID(),
        text: newTaskText.trim(),
        completed: false,
      };

      const taskHtml = `<ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>${newTaskText}</p></li></ul>`;
      
      if (!targetNote) {
        targetNote = await noteService.create({
          title: 'My Intentions',
          content: taskHtml,
          tasks: [newTask]
        });
        updateIntentionSummary([...taskNotes, targetNote]);
      } else {
        const updatedContent = targetNote.content + taskHtml;
        const updatedTasks = [...(targetNote.tasks || []), newTask];
        const updatedNote = await noteService.update(targetNote.id, { 
          content: updatedContent,
          tasks: updatedTasks
        });
        updateIntentionSummary(taskNotes.map(n => n.id === targetNote.id ? updatedNote : n));
      }
      setNewTaskText('');
      setIntentionFeedback('Intention saved.');
      setTimeout(() => {
        setIsIntentionModalOpen(false);
        setIntentionFeedback(null);
      }, 1500);
    } catch (err) {
      console.error('Could not create intention', err);
      showToast('Could not save intention');
    } finally {
      setIsCreatingTask(false);
    }
  };

  return (
    <>
      <div
        className="surface-scope-sage page-wash relative min-h-full flex flex-col flex-1 bg-body selection:bg-green/10"
        {...((showOnboarding ? { 'aria-hidden': 'true' } : {}) as any)}
      >
        <section className="relative isolate h-[56dvh] min-h-[360px] w-full overflow-hidden bg-body sm:h-[60dvh] sm:min-h-[450px]">
          <img
            src="/assets/videos/field.png"
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="async"
            className="absolute inset-0 z-0 h-full min-h-full w-full min-w-full object-cover object-center opacity-100"
          />
          <video
            src="/assets/videos/field.mp4"
            poster="/assets/videos/field.png"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            onLoadedData={() => setIsHeroVideoReady(true)}
            className={`absolute inset-0 z-0 h-full min-h-full w-full min-w-full object-cover object-center bg-transparent transition-opacity duration-700 ease-out-expo ${
              isHeroVideoReady ? 'opacity-95' : 'opacity-0'
            }`}
          >
          </video>
          <div className="absolute inset-0 z-10 hero-scrim" />
          <div className="absolute inset-0 z-10 screen-scrim opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-t from-body via-transparent to-transparent z-10" />

          <div className="relative z-20 h-full flex flex-col items-center justify-start pt-[10vh] text-center px-6">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: entranceDuration,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="max-w-4xl"
            >
              <h1 className="h1-hero hero-ink mb-12 text-balance">
                <span className="whitespace-nowrap">Welcome back,</span> <br />
                <span className="font-serif italic hero-ink-accent">
                  {user?.name?.split(' ')[0] || 'Reflector'}
                </span>
              </h1>
            </motion.div>
          </div>

          <div className="floating-audio-container">
            <AmbientMusicButton />
          </div>
        </section>

        <motion.section
          variants={bentoContainerVariants}
          initial="hidden"
          whileInView="show"
          viewport={BENTO_VIEWPORT_CONFIG}
          className="core-bento-grid"
        >
          <motion.div
            variants={bentoItemVariants}
            className="group relative surface-flat overflow-hidden rounded-[2.5rem] p-8 sm:p-10 lg:p-12 flex flex-col justify-between h-full transition-[border-color,box-shadow] duration-500 ease-out-expo hover:shadow-[0_20px_50px_rgba(34,197,94,0.05)] hover:border-green/10"
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 text-gray-nav">
                  <Target size={18} weight="duotone" className="text-green" />
                  <span className="label-caps">
                    Today's Reflection
                  </span>
                </div>
                <button
                  onClick={refreshPrompt}
                  className={`flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] text-gray-nav transition-colors hover:text-green ${
                    isRefreshing ? 'animate-spin' : ''
                  }`}
                  aria-label="Refresh today's reflection prompt"
                >
                  <ArrowsClockwise size={20} weight="regular" />
                </button>
              </div>

              <div className="mb-12 space-y-8">
                <p
                  className="dashboard-prompt-text typographic-measure"
                  style={{ opacity: isRefreshing ? 0 : 1, transition: 'opacity 0.4s ease' }}
                >
                  {dailyPrompt}
                </p>
                <div className="flex max-w-xl flex-col gap-3">
                  <Button
                    variant="primary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="h-14 w-full px-8 rounded-xl text-base font-bold bg-green text-white hover:bg-green/90 transition-colors shadow-none sm:w-fit"
                    onClick={() => handleCreateClick(dailyPrompt)}
                    aria-label="Begin writing with today's prompt"
                  >
                    Begin Writing
                    <Plus size={18} weight="regular" className="ml-2" />
                  </Button>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      variant="secondary"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="h-12 w-full rounded-xl px-6 text-base font-bold"
                      onClick={() => setIsCheckInOpen(true)}
                      aria-label="Save a quick mood check-in"
                    >
                      Quick check-in
                      <Heart size={18} weight="duotone" className="ml-2" />
                    </Button>
                    <Button
                      variant="outline"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="h-12 w-full justify-center rounded-xl border-sky/25 bg-sky/5 px-6 text-sky hover:bg-sky/10"
                      onClick={() => navigate(RoutePath.FUTURE_LETTERS)}
                      aria-label="Write a future letter"
                    >
                      Future letter
                      <EnvelopeSimple size={18} weight="duotone" className="ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border/60 pt-8 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-nav">
                  <ListChecks size={16} weight="duotone" className="text-honey" />
                  <span className="label-caps">
                    Your Intentions
                  </span>
                </div>
                {intentionSummary.openCount > 0 && (
                  <span className="text-xs font-bold text-gray-nav/60">
                    {intentionSummary.openCount} open
                  </span>
                )}
              </div>

              <div className="space-y-3 mt-4">
                <AnimatePresence mode="popLayout">
                  {intentionSummary.items.length > 0 ? (
                    intentionSummary.items.slice(0, 3).map((intention) => (
                      <motion.button
                        key={intention.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl border border-honey/15 bg-honey/5 hover:border-honey/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-honey/40 transition-colors text-left shadow-none group/btn"
                        onClick={() => handleToggleIntention(intention.noteId, intention.id)}
                        aria-label={`Mark "${intention.text}" from ${intention.noteTitle} as complete`}
                      >
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-border group-hover/btn:border-honey transition-colors">
                           <div className="h-2 w-2 rounded-full bg-honey opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                        </div>
                        <span className="min-w-0 flex-1">
                          <span className="block font-serif italic text-base text-gray-text group-hover/btn:text-honey transition-colors line-clamp-2 leading-snug">
                            {intention.text}
                          </span>
                        </span>
                      </motion.button>
                    ))
                  ) : null}

                  {/* Completed intentions — crossed-off state */}
                  {intentionSummary.completedItems.map((intention) => (
                    <motion.div
                      key={`done-${intention.id}`}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.5 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center gap-4 p-4 rounded-2xl text-left"
                    >
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-green bg-green text-white">
                        <CheckCircleIcon size={12} weight="bold" />
                      </div>
                      <span className="min-w-0 flex-1">
                        <span className="block font-serif italic text-base text-gray-nav line-through decoration-green decoration-2 leading-snug">
                          {intention.text}
                        </span>
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Empty state — horizontal layout so icon doesn't push text down */}
                {intentionSummary.items.length === 0 && intentionSummary.completedItems.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setIsIntentionModalOpen(true)}
                    className="w-full flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-honey/25 p-8 text-honey hover:border-honey/40 hover:bg-honey/5 transition-colors"
                  >
                    <Plus size={24} weight="bold" />
                    <span className="text-base font-bold">Set your first intention</span>
                    <span className="text-sm font-medium text-gray-nav/60">What matters most today?</span>
                  </button>
                )}

                {(intentionSummary.hiddenCount > 0 || intentionSummary.items.length > 3) && (
                  <button 
                    onClick={() => navigate(RoutePath.NOTES)}
                    className="w-full text-center label-caps text-gray-nav/40 hover:text-honey transition-colors pt-4"
                  >
                    + {intentionSummary.hiddenCount + Math.max(0, intentionSummary.items.length - 3)} more
                  </button>
                )}

                {/* Secondary add button — only when tasks already exist */}
                {(intentionSummary.items.length > 0 || intentionSummary.completedItems.length > 0) && intentionSummary.openCount < MAX_ACTIVE_INTENTIONS && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setIsIntentionModalOpen(true)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-bold text-honey/60 hover:text-honey transition-colors"
                    >
                      <Plus size={14} weight="bold" />
                      Add intention
                    </button>
                  </div>
                )}
              </div>
            </div>
            {/* Subtle background glow effect on hover */}
            <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-green/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </motion.div>

          <div className="grid gap-6">
            <motion.div
              variants={bentoItemVariants}
              className="group relative surface-flat surface-tone-sky overflow-hidden rounded-[2.5rem] p-6 sm:p-8 transition-shadow duration-500 ease-out-expo hover:shadow-[0_20px_50px_rgba(14,165,233,0.05)]"
            >
              <div className="relative z-10">
              <div className="mb-6 flex items-center gap-2 text-gray-nav">
                <FolderOpen size={18} weight="duotone" className="text-sky" />
                <p className="label-caps">
                  Your Rhythm
                </p>
              </div>

              <div className="mb-6">
                <p className="dashboard-stat-value flex items-center overflow-hidden h-[1.2em]">
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={isCountLoading ? 'loading' : displayCount}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      className="inline-block"
                    >
                      {isCountLoading ? '...' : displayCount}
                    </motion.span>
                  </AnimatePresence>
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-nav">reflections saved</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate(RoutePath.NOTES)}
                  className="surface-inline-panel surface-tone-sage dashboard-tone-card group flex w-full items-center justify-between p-4 text-left transition-colors"
                  aria-label="View all reflections"
                >
                  <div className="flex items-center gap-3">
                    <FolderOpen size={18} weight="duotone" className="text-gray-nav group-hover:text-green transition-transform duration-300 group-hover:rotate-6" />
                    <div>
                      <p className="dashboard-action-title dashboard-hover-title">View archive</p>
                      <p className="dashboard-action-description">Read saved reflections</p>
                    </div>
                  </div>
                  <CaretRight size={16} weight="regular" className="text-gray-nav/40 group-hover:text-green transition-colors" />
                </button>

                <button
                  onClick={() => navigate(RoutePath.INSIGHTS)}
                  className="surface-inline-panel surface-tone-sky dashboard-tone-card group flex w-full items-center justify-between p-4 text-left transition-colors"
                  aria-label="View writing patterns"
                >
                  <div className="flex items-center gap-3">
                    <Brain size={18} weight="duotone" className="text-sky transition-transform duration-300 group-hover:-rotate-6" />
                    <div>
                      <p className="dashboard-action-title dashboard-hover-title">Writing patterns</p>
                      <p className="dashboard-action-description">Mood, rhythm, and recurring themes</p>
                    </div>
                  </div>
                  <CaretRight size={16} weight="regular" className="text-gray-nav/40 group-hover:text-sky transition-colors" />
                </button>
              </div>
            </div>
            {/* Subtle background glow effect on hover */}
            <div className="dashboard-accent-glow pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </motion.div>

            <motion.div
              variants={bentoItemVariants}
              className="group relative surface-flat surface-tone-honey overflow-hidden rounded-[2.5rem] p-6 sm:p-8 transition-shadow duration-500 ease-out-expo hover:shadow-[0_20px_50px_rgba(245,158,11,0.05)]"
            >
              <div className="relative z-10">
              <div className="mb-8 flex items-center gap-2 text-gray-nav">
                <Sparkle size={18} weight="duotone" className="text-honey" />
                <span className="label-caps">
                  Before you write
                </span>
              </div>

              <div className="space-y-5">
                {isFromSave ? (
                  <p className="text-sm font-bold text-green">Reflection saved.</p>
                ) : null}
                <p className="dashboard-prose typographic-measure-compact relative italic">
                  <span className="absolute -left-4 -top-5 font-serif text-5xl text-honey/10 pointer-events-none">
                    "
                  </span>
                  {quote.text}
                </p>
                <div className="flex items-center gap-4">
                  <div className="h-px w-8 bg-honey/20" />
                  <p className="dashboard-caption text-gray-nav">
                    {quote.author}
                  </p>
                </div>
                </div>
              </div>
              {/* Subtle sweep effect on hover */}
              <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-honey/0 via-honey/5 to-honey/0 translate-x-[-100%] transition-transform duration-1000 group-hover:translate-x-[100%]" />
            </motion.div>
          </div>
        </motion.section>
      </div>

      <ModalSheet
        isOpen={showOnboarding}
        onClose={handleCloseOnboarding}
        title={currentOnboardingStep.title}
        size="lg"
        mobilePlacement="center"
        closeLabel="Skip onboarding"
        panelClassName="onboarding-modal-panel"
        bodyClassName="onboarding-modal-body"
        footer={
          <div className="onboarding-footer-actions flex flex-col gap-3 sm:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkipOnboarding}
              aria-label="Skip onboarding"
              className="self-center px-3 text-gray-nav/75 hover:text-green"
            >
              Skip onboarding
            </Button>
            <div className="flex items-center justify-between gap-3 sm:justify-between">
              <Button
                variant="secondary"
                onClick={handlePreviousOnboardingStep}
                disabled={onboardingStep === 0}
                className="min-w-[6.75rem] flex-1 sm:flex-none"
              >
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleNextOnboardingStep}
                className="min-w-[8.75rem] flex-1 sm:flex-none"
              >
                {isLastOnboardingStep ? 'Begin writing' : 'Next'}
              </Button>
            </div>
          </div>
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentOnboardingStep.title}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.24,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="onboarding-step-copy flex min-h-[18rem] flex-col justify-between gap-6 pb-1 sm:min-h-[19rem]"
          >
            <div className="space-y-4">
              <p className="label-caps text-green" aria-live="polite">
                Step {onboardingStep + 1} of {ONBOARDING_STEPS.length}
              </p>

              <div className="onboarding-progress-rail grid grid-cols-4 gap-2" aria-hidden="true">
                {ONBOARDING_STEPS.map((step, index) => (
                  <span
                    key={step.label}
                    className={`h-1.5 rounded-full bg-green transition-opacity duration-300 ease-out-expo ${
                      index <= onboardingStep ? 'opacity-100' : 'opacity-20'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="onboarding-step-stage">
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start">
                <div className="onboarding-step-icon" aria-hidden="true">
                  <CurrentOnboardingIcon size={28} weight="duotone" />
                </div>
                <div className="space-y-4">
                  <p className="max-w-[65ch] text-base font-semibold leading-relaxed text-gray-text sm:text-lg">
                    {currentOnboardingStep.body}
                  </p>
                  <p className="onboarding-step-note font-serif italic">
                    {currentOnboardingStep.note}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </ModalSheet>

      <ModalSheet
        isOpen={isCheckInOpen}
        onClose={() => {
          setIsCheckInOpen(false);
          setCheckInFeedback(null);
        }}
        title="Quick check-in"
        icon={<Heart size={20} weight="duotone" />}
        size="sm"
        tone="sage"
        bodyClassName="pt-2"
      >
        <div className="space-y-5">
          <p className="text-base font-medium leading-relaxed text-gray-light">
            Name the weather of this moment without writing a full reflection.
          </p>
          <AnimatePresence mode="wait">
            {!checkInFeedback ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-2 gap-3"
              >
                {MOOD_OPTIONS.map((moodOption) => {
                  const moodConfig = MOOD_CONFIG[moodOption];
                  const Icon = moodConfig.icon;

                  return (
                    <button
                      key={moodOption}
                      type="button"
                      onClick={() => handleMoodCheckIn(moodOption)}
                      disabled={isSavingCheckIn}
                      className={`group rounded-[1.5rem] border p-5 text-left transition-[border-color,background-color,box-shadow,transform,opacity] duration-300 ease-out-expo disabled:opacity-60 hover:scale-[1.02] hover:shadow-lg ${moodConfig.option}`}
                    >
                      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-body/50 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-12">
                        <Icon size={24} weight="duotone" className={moodConfig.labelClass} />
                      </div>
                      <span className="text-base font-bold text-gray-text transition-colors group-hover:text-green">{moodConfig.label}</span>
                    </button>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-10 text-center"
              >
                {checkInFeedback === 'error' ? (
                  <p className="text-sm font-bold text-clay">Could not save that just now.</p>
                ) : (
                  <>
                    <motion.div 
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, -10, 10, -10, 0]
                      }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green/10 text-green"
                    >
                      {MOOD_CONFIG[checkInFeedback]?.icon && React.createElement(MOOD_CONFIG[checkInFeedback].icon, { size: 32, weight: "fill" })}
                    </motion.div>
                    <h3 className="label-caps mb-2 text-green">Recorded</h3>
                    <p className="font-serif text-[16px] italic leading-relaxed text-gray-light">
                      Your mood has been saved.
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ModalSheet>
      <ModalSheet
        isOpen={isIntentionModalOpen}
        onClose={() => {
          setIsIntentionModalOpen(false);
          setNewTaskText('');
          setIntentionFeedback(null);
        }}
        title="Intentions"
        icon={<ListChecks size={24} weight="bold" className="text-green" />}
        size="md"
        bodyClassName="max-h-[72vh] pt-2"
      >
        <div className="flex flex-col gap-6">
          {/* Existing open intentions */}
          {intentionSummary.items.length > 0 && (
            <div className="space-y-2">
              {intentionSummary.items.map((intention) => (
                <button
                  key={intention.id}
                  type="button"
                  onClick={() => handleToggleIntention(intention.noteId, intention.id)}
                  className="group relative flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-green/5"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 border-border text-transparent transition-colors group-hover:border-green/50">
                    <span />
                  </div>
                  <span className="flex-1 text-[14px] font-bold text-gray-text line-clamp-2">{intention.text}</span>
                </button>
              ))}
            </div>
          )}

          {/* Add new intention form */}
          {intentionSummary.openCount < MAX_ACTIVE_INTENTIONS ? (
            <form onSubmit={handleCreateIntention} className="flex items-center gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-border">
                <Plus size={12} weight="bold" className="text-gray-nav/40" />
              </div>
              <input
                type="text"
                autoFocus
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="What needs to be done?"
                disabled={isCreatingTask}
                className="flex-1 bg-transparent border-none outline-none font-bold text-[14px] text-gray-text placeholder:text-gray-nav/40"
              />
              {newTaskText.trim() && (
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isCreatingTask}
                  className="shrink-0"
                >
                  {isCreatingTask ? 'Saving...' : 'Add'}
                </Button>
              )}
            </form>
          ) : (
            <p className="text-sm font-medium text-gray-nav/60 text-center py-2">
              Cross off an existing intention to add a new one.
            </p>
          )}

          {intentionFeedback ? (
            <p className="text-sm font-bold text-green mt-2" aria-live="polite">
              {intentionFeedback}
            </p>
          ) : null}
        </div>
      </ModalSheet>
    </>
  );
};
