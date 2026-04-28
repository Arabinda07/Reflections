import {
  Archive,
  ArrowsClockwise,
  Brain,
  CheckCircle as CheckCircleIcon,
  Feather,
  FolderOpen,
  ListChecks,
  LockKey,
  NotePencil,
  Plus,
  Sparkle,
  Target,
} from '@phosphor-icons/react';
import { animate, motion, useReducedMotion, AnimatePresence, Variants } from 'motion/react';
import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { AmbientMusicButton } from '../../components/ui/AmbientMusicButton';
import { Button } from '../../components/ui/Button';
import { ModalSheet } from '../../components/ui/ModalSheet';
import { useAuth } from '../../context/AuthContext';
import { aiService } from '../../services/aiService';
import { noteService } from '../../services/noteService';
import { DEFAULT_WELLNESS_PROMPTS } from '../../services/wellnessPrompts';
import { supabase } from '../../src/supabaseClient';
import { Note, RoutePath } from '../../types';
import {
  buildHomeIntentionSummary,
  getHomeIntentionToggleUpdate,
  type HomeIntentionSummary,
} from './homeIntentions';
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

export const HomeAuthenticated: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isFromSave = location.state?.fromSave;
  const { user } = useAuth();
  const [noteCount, setNoteCount] = useState<number | null>(null);
  const [displayCount, setDisplayCount] = useState<number | string>('...');
  const [isCountLoading, setIsCountLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [dailyPrompt, setDailyPrompt] = useState(DEFAULT_WELLNESS_PROMPTS[0]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [quote, setQuote] = useState({ text: '', author: '' });
  const [taskNotes, setTaskNotes] = useState<Note[]>([]);
  const [intentionSummary, setIntentionSummary] = useState<HomeIntentionSummary>(() =>
    buildHomeIntentionSummary([]),
  );
  const shouldReduceMotion = useReducedMotion();

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
          console.error('Failed to parse cached quotes', e);
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
          console.error('Failed to fetch dynamic quotes', e);
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

  const updateIntentionSummary = useCallback((notes: Note[]) => {
    setTaskNotes(notes);
    setIntentionSummary(buildHomeIntentionSummary(notes));
  }, []);

  const handleNextOnboardingStep = useCallback(() => {
    if (isLastOnboardingStep) {
      handleCloseOnboarding();
      return;
    }

    setOnboardingStep((current) => Math.min(current + 1, ONBOARDING_STEPS.length - 1));
  }, [handleCloseOnboarding, isLastOnboardingStep]);

  const handlePreviousOnboardingStep = useCallback(() => {
    setOnboardingStep((current) => Math.max(current - 1, 0));
  }, []);

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
      console.error('Failed to toggle intention:', err);
    }
  };

  return (
    <>
      <div
        className="relative min-h-full flex flex-col flex-1 bg-body selection:bg-green/10"
        {...((showOnboarding ? { 'aria-hidden': 'true' } : {}) as any)}
      >
        <section className="relative w-full h-[60dvh] min-h-[450px] overflow-hidden">
          <motion.video
            initial={{ scale: 1.05, filter: 'blur(10px) brightness(0.8)' }}
            animate={{ scale: 1, filter: 'blur(0px) brightness(1)' }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            src="/assets/videos/field.mp4"
            poster="/assets/videos/field.png"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover object-center z-0"
          />
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
                Welcome back, <br />
                <span className="font-serif italic hero-ink-accent">
                  {user?.name?.split(' ')[0] || 'Reflector'}
                </span>
              </h1>
            </motion.div>
          </div>
        </section>

        <motion.section 
          variants={bentoContainerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 md:p-10 max-w-[1440px] mx-auto min-h-[500px]"
        >
          {/* Overview Card */}
          <motion.div 
            variants={bentoItemVariants}
            className="p-8 sm:p-10 lg:p-12 flex flex-col justify-between h-full bg-white/50 dark:bg-white/5 rounded-3xl border border-border/40"
          >
            <div>
              <div className="flex items-center gap-2 text-gray-nav mb-12">
                <FolderOpen size={18} weight="bold" className="text-green" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-60">
                  Reflections Overview
                </span>
              </div>

              <button
                onClick={() => navigate(RoutePath.NOTES)}
                className="group flex flex-col items-start gap-4 mb-16 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
                aria-label="View all reflections"
              >
                <h2 className="text-5xl md:text-7xl font-display font-extrabold text-gray-text group-hover:text-green transition-colors tracking-normal tabular-nums">
                  {isCountLoading ? '...' : displayCount}
                </h2>
                <p className="text-[13px] font-bold text-gray-nav uppercase tracking-normal">
                  Reflections Archived
                </p>
              </button>
            </div>

            <motion.button
              onClick={() => navigate(RoutePath.INSIGHTS)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="group flex flex-col items-start gap-5 p-7 sm:p-8 rounded-3xl bg-panel-bg border border-border/40 hover:border-green/30 transition-all text-left shadow-none"
              aria-label="View writing patterns"
            >
              <div className="flex items-center gap-2 text-gray-nav mb-2">
                <Brain size={16} weight="bold" className="text-green" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                  Writing Patterns
                </span>
              </div>
              <p className="text-[15px] font-serif italic text-gray-light leading-relaxed group-hover:text-gray-text transition-colors">
                Patterns stay here quietly until you ask Reflections to build them.
              </p>
            </motion.button>
          </motion.div>
          
          {/* Daily Focus & Intentions Card */}
          <motion.div 
            variants={bentoItemVariants}
            className="p-8 sm:p-10 lg:p-12 flex flex-col justify-between h-full bg-white/40 dark:bg-white/5 rounded-3xl border border-border/40 overflow-hidden"
          >
            <div>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 text-gray-nav">
                  <Target size={18} weight="bold" className="text-green" />
                  <span className="text-[11px] font-black uppercase tracking-widest opacity-60">
                    Daily Focus
                  </span>
                </div>
                <button
                  onClick={refreshPrompt}
                  className={`flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] text-gray-nav transition-colors hover:text-green ${
                    isRefreshing ? 'animate-spin' : ''
                  }`}
                  aria-label="Refresh daily focus prompt"
                >
                  <ArrowsClockwise size={20} weight="bold" />
                </button>
              </div>

              <div className="space-y-8 mb-12">
                <p
                  className="text-2xl md:text-3xl text-gray-text font-serif italic leading-relaxed"
                  style={{ opacity: isRefreshing ? 0 : 1, transition: 'opacity 0.4s ease' }}
                >
                  {dailyPrompt}
                </p>
                <Button
                  variant="primary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="h-14 w-full md:w-auto px-8 rounded-xl text-[15px] font-bold bg-green text-white hover:bg-green/90 transition-colors shadow-none"
                  onClick={() => handleCreateClick(dailyPrompt)}
                  aria-label="Start a new reflection with this prompt"
                >
                  Start Reflection
                  <Plus size={18} weight="bold" className="ml-2" />
                </Button>
              </div>
            </div>

            {/* Nested Intentions Card */}
            <div className="group flex flex-col gap-4 p-7 sm:p-8 rounded-3xl bg-panel-bg border border-border/40 hover:border-green/20 transition-all text-left shadow-none">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-nav">
                  <ListChecks size={16} weight="bold" className="text-green" />
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                    Your Intentions
                  </span>
                </div>
                {intentionSummary.openCount > 0 && (
                  <span className="text-[11px] font-bold text-gray-nav/60">
                    {intentionSummary.openCount} open
                  </span>
                )}
              </div>

              <div className="space-y-3 mt-2">
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
                        className="w-full flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-border/40 hover:border-green/20 transition-all text-left shadow-none group/btn"
                        onClick={() => handleToggleIntention(intention.noteId, intention.id)}
                        aria-label={`Mark "${intention.text}" from ${intention.noteTitle} as complete`}
                      >
                        <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-border group-hover/btn:border-green transition-colors">
                          <div className="h-2 w-2 rounded-full bg-green opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                        </div>
                        <span className="min-w-0">
                          <span className="block font-serif italic text-[15px] text-gray-text group-hover/btn:text-green transition-colors line-clamp-2 leading-snug">
                            {intention.text}
                          </span>
                        </span>
                      </motion.button>
                    ))
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-6 text-center"
                    >
                      <div className="mb-3 flex justify-center">
                        <div className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-gray-nav/20">
                          <CheckCircleIcon size={18} weight="duotone" />
                        </div>
                      </div>
                      <p className="text-[11px] font-black text-gray-nav/30 uppercase tracking-[0.2em]">
                        {intentionSummary.hasAnyTasks ? 'All settled' : 'No intentions yet'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {(intentionSummary.hiddenCount > 0 || intentionSummary.items.length > 3) && (
                  <button 
                    onClick={() => navigate(RoutePath.NOTES)}
                    className="w-full text-center text-[10px] font-black uppercase tracking-[0.25em] text-gray-nav/40 hover:text-green transition-colors pt-4"
                  >
                    + {intentionSummary.hiddenCount + Math.max(0, intentionSummary.items.length - 3)} more
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Quote Card */}
          <motion.div 
            variants={bentoItemVariants}
            className="p-8 sm:p-10 lg:p-12 flex flex-col justify-between h-full bg-white/60 dark:bg-white/5 rounded-3xl border border-border/40"
          >
            <div className="flex-grow">
              <div className="flex items-center gap-2 text-gray-nav mb-12">
                <Sparkle size={18} weight="bold" className="text-orange" />
                <span className="text-[11px] font-black uppercase tracking-widest opacity-60">
                  Writing note
                </span>
              </div>

              <div className="space-y-8 pr-4">
                <p className="text-2xl md:text-3xl font-serif italic text-gray-text leading-relaxed relative">
                  <span className="absolute -left-8 -top-6 text-7xl text-orange/10 font-serif pointer-events-none">
                    "
                  </span>
                  {quote.text}
                </p>
                <div className="flex items-center gap-4">
                  <div className="h-px w-8 bg-orange/20" />
                  <p className="text-[13px] font-bold text-gray-nav uppercase tracking-widest">
                    {quote.author}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
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
              onClick={handleCloseOnboarding}
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
                  <p className="max-w-[32rem] text-[1.05rem] font-semibold leading-8 text-gray-text sm:text-ui-lg sm:leading-[1.7]">
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

      <div
        style={{
          position: 'fixed',
          bottom: 'calc(24px + env(safe-area-inset-bottom))',
          right: '20px',
          zIndex: 8000,
        }}
      >
        <AmbientMusicButton />
      </div>
    </>
  );
};
