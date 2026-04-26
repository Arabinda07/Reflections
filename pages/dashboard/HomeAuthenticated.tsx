import {
  ArrowsClockwise,
  Brain,
  FolderOpen,
  Plus,
  ShieldCheck,
  Sparkle,
  Target,
} from '@phosphor-icons/react';
import { animate, motion, useReducedMotion, AnimatePresence } from 'motion/react';
import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ListChecks, CheckCircle as CheckCircleIcon, X as XIcon } from '@phosphor-icons/react';

import { AmbientMusicButton } from '../../components/ui/AmbientMusicButton';
import { Button } from '../../components/ui/Button';
import { ModalSheet } from '../../components/ui/ModalSheet';
import { useAuth } from '../../context/AuthContext';
import { aiService } from '../../services/aiService';
import { noteService } from '../../services/noteService';
import { DEFAULT_WELLNESS_PROMPTS } from '../../services/wellnessPrompts';
import { supabase } from '../../src/supabaseClient';
import { RoutePath, Note, Task } from '../../types';
const bentoContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const bentoItemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 20,
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
  { text: 'The page can hold more than one feeling at once.', author: 'Unknown' },
];

const ONBOARDING_STEPS = [
  {
    icon: Sparkle,
    label: 'Welcome',
    title: 'Welcome',
    body:
      'Reflections is a private, writing-first wellness journal. It gives you a calm place to put thoughts into words and return to them with care.',
  },
  {
    icon: Target,
    label: 'Writing first',
    title: 'Writing first',
    body:
      'The main action is simple: begin with a sentence, stay with your own words, and let the page hold the unfinished parts.',
  },
  {
    icon: ShieldCheck,
    label: 'Private by default',
    title: 'Private by default',
    body:
      'Your notes stay tied to your account. AI is optional and appears only when you ask Reflections to help you notice a pattern.',
  },
  {
    icon: Brain,
    label: 'Begin',
    title: 'Begin',
    body:
      'Start with the daily focus, open a blank note, or read what you have already saved. Reflections will stay quiet until you choose the next step.',
  },
];

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
  const [intentions, setIntentions] = useState<{ id: string; text: string; noteId: string; completed: boolean }[]>([]);
  const shouldReduceMotion = useReducedMotion();

  const entranceDuration = isFromSave ? 0.3 : 0.8;
  const currentOnboardingStep = ONBOARDING_STEPS[onboardingStep];
  const OnboardingIcon = currentOnboardingStep.icon;
  const isLastOnboardingStep = onboardingStep === ONBOARDING_STEPS.length - 1;

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

    const controls = animate(0, noteCount, {
      duration: 2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(value) {
        setDisplayCount(Math.round(value));
      },
    });

    return () => controls.stop();
  }, [noteCount]);

  const handleCloseOnboarding = useCallback(() => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setOnboardingStep(0);
    setShowOnboarding(false);
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
        
        // Extract intentions from all notes
        const allIntentions = notes.flatMap(note => 
          (note.tasks || [])
            .filter(t => !t.completed)
            .map(t => ({ id: t.id, text: t.text, noteId: note.id, completed: t.completed }))
        );
        setIntentions(allIntentions);
      } catch {
        setNoteCount(0);
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
  }, [user]);

  const handleCreateClick = (prompt?: string) => {
    if (prompt) {
      navigate(RoutePath.CREATE_NOTE, { state: { initialPrompt: prompt } });
      return;
    }

    navigate(RoutePath.CREATE_NOTE);
  };

  const handleToggleIntention = async (noteId: string, taskId: string) => {
    try {
      const note = await noteService.getById(noteId);
      if (!note) return;

      const updatedTasks = (note.tasks || []).map(t => 
        t.id === taskId ? { ...t, completed: !t.completed } : t
      );

      // Also update the prose content [ ] -> [x]
      const taskToToggle = (note.tasks || []).find(t => t.id === taskId);
      if (taskToToggle) {
        const oldMarker = taskToToggle.completed ? '[x]' : '[ ]';
        const newMarker = taskToToggle.completed ? '[ ]' : '[x]';
        
        // Very simple string replacement, might need to be more robust for HTML
        // but for basic [ ] mirroring it works.
        const escapedText = taskToToggle.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`\\[${taskToToggle.completed ? '[xX]' : ' '}\\]\\s*${escapedText}`, 'g');
        const updatedContent = note.content.replace(pattern, `${newMarker} ${taskToToggle.text}`);
        
        await noteService.update(noteId, { 
          tasks: updatedTasks,
          content: updatedContent 
        });
      }

      // Update local state to trigger animation/removal
      setIntentions(prev => prev.filter(t => t.id !== taskId));
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
                type: 'spring',
                stiffness: 100,
                damping: 15,
                duration: entranceDuration,
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
          className="grid grid-cols-1 lg:grid-cols-3 border-t border-border/40 bg-white dark:bg-transparent min-h-[500px]"
        >
          {/* Overview Card */}
          <motion.div 
            variants={bentoItemVariants}
            className="p-8 sm:p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-border/40 flex flex-col justify-between h-full bg-white/50 dark:bg-white/12"
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
                <h2 className="text-5xl md:text-7xl font-display text-gray-text group-hover:text-green transition-colors tracking-tighter tabular-nums">
                  {isCountLoading ? '...' : displayCount}
                </h2>
                <p className="text-[13px] font-bold text-gray-nav uppercase tracking-tight">
                  Reflections Archived
                </p>
              </button>
            </div>

            <button
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
            </button>
          </motion.div>
          
          {/* Intentions Card */}
          <motion.div 
            variants={bentoItemVariants}
            className="p-8 sm:p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-border/40 flex flex-col justify-start h-full bg-white/30 dark:bg-white/8 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-2 text-gray-nav">
                <ListChecks size={18} weight="bold" className="text-green" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] opacity-60">
                  Your Intentions
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {intentions.length > 0 ? (
                  intentions.slice(0, 5).map((intention) => (
                    <motion.button
                      key={intention.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileTap={{ scale: 0.98 }}
                      className="group w-full flex items-start gap-4 p-4 rounded-2xl bg-panel-bg border border-border/40 hover:border-green/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/20 transition-all text-left min-h-[52px] shadow-none"
                      onClick={() => handleToggleIntention(intention.noteId, intention.id)}
                      aria-label={`Mark "${intention.text}" as finished`}
                    >
                      <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-border group-hover:border-green transition-colors">
                        <div className="h-2 w-2 rounded-full bg-green opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="font-serif italic text-[17px] text-gray-text group-hover:text-green transition-colors line-clamp-2 leading-relaxed">
                        {intention.text}
                      </span>
                    </motion.button>
                  ))
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-16 text-center"
                  >
                    <div className="mb-4 flex justify-center">
                      <div className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-gray-nav/20">
                        <CheckCircleIcon size={24} weight="duotone" />
                      </div>
                    </div>
                    <p className="text-[11px] font-black text-gray-nav/30 uppercase tracking-[0.2em]">
                      All intentions <br /> are settled
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {intentions.length > 5 && (
                <button 
                  onClick={() => navigate(RoutePath.NOTES)}
                  className="w-full text-center text-[10px] font-black uppercase tracking-[0.25em] text-gray-nav/40 hover:text-green transition-colors pt-6"
                >
                  + {intentions.length - 5} more in your notes
                </button>
              )}
            </div>
          </motion.div>

          {/* Quote Card */}
          <motion.div 
            variants={bentoItemVariants}
            className="p-8 sm:p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-border/40 flex flex-col justify-between h-full bg-white dark:bg-white/14"
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

          {/* Daily Focus Card */}
          <motion.div 
            variants={bentoItemVariants}
            className="p-6 sm:p-10 lg:p-12 flex flex-col justify-between h-full bg-white dark:bg-white/20 border-b lg:border-b-0 border-border/40"
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

              <div className="space-y-6">
                <p
                  className="text-2xl md:text-3xl text-gray-text font-serif italic leading-relaxed"
                  style={{ opacity: isRefreshing ? 0 : 1, transition: 'opacity 0.4s ease' }}
                >
                  &quot;{dailyPrompt}&quot;
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-10 h-14 rounded-xl text-[15px] font-bold bg-green text-white hover:bg-green/90 transition-colors shadow-none"
              onClick={() => handleCreateClick(dailyPrompt)}
              aria-label="Start a new reflection with this prompt"
            >
              Start Reflection
              <Plus size={18} weight="bold" className="ml-2" />
            </Button>
          </motion.div>
        </motion.section>
      </div>

      <ModalSheet
        isOpen={showOnboarding}
        onClose={handleCloseOnboarding}
        title={currentOnboardingStep.title}
        description="A short introduction to the writing space."
        icon={<OnboardingIcon size={20} weight="duotone" />}
        size="lg"
        closeLabel="Skip onboarding"
        bodyClassName="space-y-8"
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="ghost" onClick={handleCloseOnboarding} aria-label="Skip onboarding">
              Skip onboarding
            </Button>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handlePreviousOnboardingStep}
                disabled={onboardingStep === 0}
              >
                Back
              </Button>
              <Button variant="primary" onClick={handleNextOnboardingStep}>
                {isLastOnboardingStep ? 'Begin writing' : 'Next'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <p className="label-caps text-green" aria-live="polite">
              Step {onboardingStep + 1} of {ONBOARDING_STEPS.length}
            </p>
            <div className="flex items-center gap-2" aria-hidden="true">
              {ONBOARDING_STEPS.map((step, index) => (
                <span
                  key={step.label}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === onboardingStep ? 'w-8 bg-green' : 'w-2 bg-green/20'
                  }`}
                />
              ))}
            </div>
          </div>

          <motion.div
            key={currentOnboardingStep.title}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-5"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-panel)] border border-green/10 bg-green/5 text-green">
              <OnboardingIcon size={28} weight="duotone" />
            </div>
            <div className="space-y-3">
              <p className="text-[12px] font-black uppercase tracking-widest text-gray-nav">
                {currentOnboardingStep.label}
              </p>
              <h3 className="text-[32px] font-display leading-tight text-gray-text">
                {currentOnboardingStep.title}
              </h3>
              <p className="max-w-2xl font-serif text-[18px] leading-relaxed text-gray-light">
                {currentOnboardingStep.body}
              </p>
            </div>
          </motion.div>
        </div>
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
