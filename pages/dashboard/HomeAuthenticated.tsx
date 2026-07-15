import { ArrowsClockwise } from '@phosphor-icons/react/ArrowsClockwise';
import { Brain } from '@phosphor-icons/react/Brain';
import { CaretRight } from '@phosphor-icons/react/CaretRight';
import { CheckCircle as CheckCircleIcon } from '@phosphor-icons/react/CheckCircle';
import { EnvelopeSimple } from '@phosphor-icons/react/EnvelopeSimple';
import { FolderOpen } from '@phosphor-icons/react/FolderOpen';
import { Heart } from '@phosphor-icons/react/Heart';
import { ListChecks } from '@phosphor-icons/react/ListChecks';
import { Plus } from '@phosphor-icons/react/Plus';
import { Target } from '@phosphor-icons/react/Target';
import { Wind } from '@phosphor-icons/react/Wind';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isSameDay } from 'date-fns';

import { AmbientMusicButton } from '../../components/ui/AmbientMusicButton';
import { Button } from '../../components/ui/Button';
import { ModalSheet } from '../../components/ui/ModalSheet';
import { useToast } from '../../components/ui/Toast';
import { WhisperComposerControl } from '../../components/ui/WhisperComposerControl';
import { useCrypto } from '../../context/CryptoContext';
import {
  PrivateWritingOnboardingFlow,
  usePrivateWritingOnboarding,
} from '../../features/private-writing-onboarding';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useHaptics } from '../../hooks/useHaptics';
import { moodCheckinService } from '../../services/moodService';
import { noteService } from '../../services/noteService';
import { DEFAULT_WELLNESS_PROMPTS } from '../../services/wellnessPrompts';
import { hasPendingAccountPassword } from '../../src/auth/accountPasswordHandoff';
import { supabase } from '../../src/supabaseClient';
import { Note, RoutePath } from '../../types';
import {
  buildHomeIntentionSummary,
  getHomeIntentionToggleUpdate,
  MAX_ACTIVE_INTENTIONS,
  type HomeIntentionSummary,
} from './homeIntentions';
import { getMoodConfig } from './moodConfig';
import { MoodPicker, type MoodPickerStage } from './MoodPicker';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { RelationshipHomeModule } from './RelationshipHomeModule';


const prefetchCreateNoteRoute = () => {
  void import('@/pages/dashboard/CreateNote');
};

type HomeHeroIntroState = 'visible' | 'exiting' | 'gone';

const HOME_HERO_INTRO_DWELL_MS = 3000;
const HOME_HERO_EXIT_MS = 650;
const HOME_HERO_DRAG_DISMISS_THRESHOLD = 48;
const HOME_HERO_SCROLL_DISMISS_THRESHOLD = 32;
const HOME_HERO_VIDEO_LOAD_DELAY_MS = 1200;
const HOME_HERO_SEEN_STORAGE_KEY = 'home_hero_intro_seen';

const getInitialHomeHeroIntroState = (): HomeHeroIntroState => {
  if (typeof window === 'undefined') {
    return 'visible';
  }

  try {
    // Persist across sessions so return visits load straight into the dashboard.
    return window.localStorage.getItem(HOME_HERO_SEEN_STORAGE_KEY) === 'true'
      ? 'gone'
      : 'visible';
  } catch {
    return 'visible';
  }
};

const rememberHomeHeroIntroSeen = () => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(HOME_HERO_SEEN_STORAGE_KEY, 'true');
  } catch {
    // The dashboard still opens if local storage is unavailable.
  }
};

export const HomeAuthenticated: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const haptics = useHaptics();
  const { user } = useAuthStore();
  const cryptoContext = useCrypto();
  const [dailyPrompt, setDailyPrompt] = useState(DEFAULT_WELLNESS_PROMPTS[0]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [moodPickerStage, setMoodPickerStage] = useState<MoodPickerStage>('group');
  const [isSavingCheckIn, setIsSavingCheckIn] = useState(false);
  const [checkInFeedback, setCheckInFeedback] = useState<string | null>(null);
  const [intentionFeedback, setIntentionFeedback] = useState<string | null>(null);
  const [taskNotes, setTaskNotes] = useState<Note[]>([]);
  const [intentionSummary, setIntentionSummary] = useState<HomeIntentionSummary>(() =>
    buildHomeIntentionSummary([]),
  );
  const [newTaskText, setNewTaskText] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isIntentionModalOpen, setIsIntentionModalOpen] = useState(false);
  const [shouldLoadHeroVideo, setShouldLoadHeroVideo] = useState(false);
  const [isHeroVideoReady, setIsHeroVideoReady] = useState(false);
  const [hasHeroVideoFailed, setHasHeroVideoFailed] = useState(false);
  const [heroIntroState, setHeroIntroState] = useState<HomeHeroIntroState>(
    getInitialHomeHeroIntroState,
  );
  const shouldReduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const shouldAllowHeroVideoViewport = useMediaQuery('(min-width: 768px)');
  const { showToast } = useToast();
  const homeRootRef = useRef<HTMLDivElement>(null);
  const heroIntroRef = useRef<HTMLElement>(null);
  const dashboardGridRef = useRef<HTMLElement>(null);
  const isHeroInteractionActiveRef = useRef(false);
  const heroDismissPointerStartYRef = useRef<number | null>(null);
  const heroDismissPointerIdRef = useRef<number | null>(null);
  const authStoreDisplayName = user?.name?.trim() || 'Reflector';
  const shouldRenderHeroIntro = heroIntroState !== 'gone';
  const isPrivateWritingSetupRequired = cryptoContext.status === 'setupRequired';
  const isPrivateWritingReady = cryptoContext.status === 'unlocked';
  const onboarding = usePrivateWritingOnboarding({
    hasUser: Boolean(user),
    isSetupRequired: isPrivateWritingSetupRequired,
  });
  // shouldShowOnboarding only covers mandatory setup; justCompletedSetup keeps the
  // post-setup "ready" screen visible for this session (it resets on reload).
  const showOnboarding = onboarding.shouldShowOnboarding || cryptoContext.justCompletedSetup;
  const isGoogleLikeAuth = user?.authProvider === 'google';

  const moveFocusFromHeroIntro = useCallback(() => {
    if (typeof document === 'undefined') return;

    const activeElement = document.activeElement;
    if (!(activeElement instanceof Node)) return;
    if (!heroIntroRef.current?.contains(activeElement)) return;

    dashboardGridRef.current?.focus({ preventScroll: true });
  }, []);

  const collapseHeroIntro = useCallback(
    () => {
      rememberHomeHeroIntroSeen();
      moveFocusFromHeroIntro();
      setShouldLoadHeroVideo(false);
      setIsHeroVideoReady(false);
      setHeroIntroState((current) => {
        if (current === 'gone') return current;
        return shouldReduceMotion ? 'gone' : 'exiting';
      });
    },
    [moveFocusFromHeroIntro, shouldReduceMotion],
  );

  const resetHeroDismissPointer = useCallback(() => {
    heroDismissPointerStartYRef.current = null;
    heroDismissPointerIdRef.current = null;
    isHeroInteractionActiveRef.current = false;
  }, []);

  const handleHeroFocusCapture = useCallback(() => {
    isHeroInteractionActiveRef.current = true;
  }, []);

  const handleHeroBlurCapture = useCallback((event: React.FocusEvent<HTMLElement>) => {
    const nextTarget = event.relatedTarget;
    if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
      isHeroInteractionActiveRef.current = false;
    }
  }, []);

  const handleHeroShellPointerDownCapture = useCallback(() => {
    isHeroInteractionActiveRef.current = true;
  }, []);

  const handleHeroShellPointerEndCapture = useCallback(() => {
    if (heroDismissPointerStartYRef.current === null) {
      isHeroInteractionActiveRef.current = false;
    }
  }, []);

  const handleHeroDismissPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      heroDismissPointerStartYRef.current = event.clientY;
      heroDismissPointerIdRef.current = event.pointerId;
      isHeroInteractionActiveRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [],
  );

  const handleHeroDismissPointerMove = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const startY = heroDismissPointerStartYRef.current;
      if (startY === null) return;

      const upwardDistance = startY - event.clientY;
      if (upwardDistance < HOME_HERO_DRAG_DISMISS_THRESHOLD) return;

      const pointerId = heroDismissPointerIdRef.current;
      if (pointerId !== null && event.currentTarget.hasPointerCapture(pointerId)) {
        event.currentTarget.releasePointerCapture(pointerId);
      }
      resetHeroDismissPointer();
      collapseHeroIntro();
    },
    [collapseHeroIntro, resetHeroDismissPointer],
  );

  const handleHeroDismissPointerEnd = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const pointerId = heroDismissPointerIdRef.current;
      if (pointerId !== null && event.currentTarget.hasPointerCapture(pointerId)) {
        event.currentTarget.releasePointerCapture(pointerId);
      }
      resetHeroDismissPointer();
    },
    [resetHeroDismissPointer],
  );

  useEffect(() => {
    setDailyPrompt(
      DEFAULT_WELLNESS_PROMPTS[Math.floor(Math.random() * DEFAULT_WELLNESS_PROMPTS.length)],
    );
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
    const saveData = Boolean(
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData,
    );

    if (
      heroIntroState !== 'visible' ||
      showOnboarding ||
      saveData ||
      shouldReduceMotion ||
      !shouldAllowHeroVideoViewport ||
      hasHeroVideoFailed
    ) {
      setShouldLoadHeroVideo(false);
      setIsHeroVideoReady(false);
      return;
    }

    const videoLoadTimer = window.setTimeout(() => {
      setShouldLoadHeroVideo(true);
    }, HOME_HERO_VIDEO_LOAD_DELAY_MS);

    return () => window.clearTimeout(videoLoadTimer);
  }, [
    hasHeroVideoFailed,
    heroIntroState,
    shouldAllowHeroVideoViewport,
    shouldReduceMotion,
    showOnboarding,
  ]);

  useEffect(() => {
    if (heroIntroState === 'gone' || showOnboarding) return;

    if (heroIntroState !== 'visible') return;

    let dwellTimer: number;
    const tryTimerDismiss = () => {
      if (isHeroInteractionActiveRef.current) {
        dwellTimer = window.setTimeout(tryTimerDismiss, 1000);
        return;
      }
      collapseHeroIntro();
    };

    dwellTimer = window.setTimeout(() => {
      tryTimerDismiss();
    }, HOME_HERO_INTRO_DWELL_MS);

    return () => window.clearTimeout(dwellTimer);
  }, [collapseHeroIntro, heroIntroState, showOnboarding]);

  useEffect(() => {
    if (heroIntroState !== 'exiting') return;

    const exitTimer = window.setTimeout(() => {
      setHeroIntroState('gone');
    }, HOME_HERO_EXIT_MS);

    return () => window.clearTimeout(exitTimer);
  }, [heroIntroState]);

  useEffect(() => {
    if (heroIntroState !== 'visible' || showOnboarding) return;

    const scrollContainer = homeRootRef.current?.closest('main');
    if (!(scrollContainer instanceof HTMLElement)) return;

    const startScrollTop = scrollContainer.scrollTop;
    const handleHeroScroll = () => {
      if (scrollContainer.scrollTop > startScrollTop + HOME_HERO_SCROLL_DISMISS_THRESHOLD) {
        collapseHeroIntro();
      }
    };

    scrollContainer.addEventListener('scroll', handleHeroScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleHeroScroll);
    };
  }, [collapseHeroIntro, heroIntroState, showOnboarding]);

  const handleBeginWritingFromOnboarding = useCallback(() => {
    prefetchCreateNoteRoute();
    navigate(RoutePath.CREATE_NOTE, { state: { initialPrompt: 'Start with one true sentence.' } });
  }, [navigate]);

  const updateIntentionSummary = useCallback((notes: Note[]) => {
    setTaskNotes(notes);
    setIntentionSummary(buildHomeIntentionSummary(notes));
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
      if (!user || !isPrivateWritingReady) return;

      try {
        const notes = await noteService.getAll();
        updateIntentionSummary(notes);
      } catch {
        updateIntentionSummary([]);
      }
    };

    fetchCount();

    if (!isPrivateWritingReady) return;

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
  }, [isPrivateWritingReady, updateIntentionSummary, user]);

  const handleCreateClick = (prompt?: string) => {
    prefetchCreateNoteRoute();

    if (prompt) {
      navigate(RoutePath.CREATE_NOTE, { state: { initialPrompt: prompt } });
      return;
    }

    navigate(RoutePath.CREATE_NOTE);
  };

  const handleVoiceDraft = useCallback((text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;

    prefetchCreateNoteRoute();
    navigate(RoutePath.CREATE_NOTE, { state: { initialContent: cleanText } });
  }, [navigate]);


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
        setMoodPickerStage('group');
        setIsCheckInOpen(false);
        setTimeout(() => setCheckInFeedback(null), 300);
      }, 1500);
    } catch (error) {
      // Mood check-in could not save; feedback appears in the sheet.
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
      // Intention toggle could not save; UI remains in previous state.
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
        id: globalThis.crypto.randomUUID(),
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
      // Intention creation could not save; toast tells the user.
      showToast('Could not save intention right now');
    } finally {
      setIsCreatingTask(false);
    }
  };

  return (
    <>
      <div
        ref={homeRootRef}
        className="home-authenticated-mobile-safe surface-scope-sage page-wash relative min-h-full flex flex-col flex-1 bg-body selection:bg-green/10"
        aria-hidden={showOnboarding ? 'true' : undefined}
      >
        <div
          className="home-dashboard-intro-frame"
          data-intro-state={heroIntroState}
        >
          {shouldRenderHeroIntro ? (
            <section
              ref={heroIntroRef}
              className={`home-hero-shell relative isolate w-full overflow-hidden bg-body ${
                shouldReduceMotion ? 'home-hero-shell--reduced-motion' : ''
              }`}
              data-intro-state={heroIntroState}
              aria-hidden={heroIntroState === 'exiting' ? 'true' : undefined}
              onFocusCapture={handleHeroFocusCapture}
              onBlurCapture={handleHeroBlurCapture}
              onPointerDownCapture={handleHeroShellPointerDownCapture}
              onPointerUpCapture={handleHeroShellPointerEndCapture}
              onPointerCancelCapture={handleHeroShellPointerEndCapture}
            >
              <div className="home-hero-media" aria-hidden="true">
                <img
                  src="/assets/videos/field.png"
                  alt=""
                  aria-hidden="true"
                  loading="eager"
                  decoding="async"
                  className="absolute inset-0 z-0 h-full min-h-full w-full min-w-full object-cover object-center opacity-90"
                />
                {shouldLoadHeroVideo && !hasHeroVideoFailed && heroIntroState === 'visible' ? (
                  <video
                    src="/assets/videos/field.mp4"
                    poster="/assets/videos/field.png"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    onCanPlay={(event) => {
                      void event.currentTarget.play().catch(() => {
                        setHasHeroVideoFailed(true);
                        setShouldLoadHeroVideo(false);
                        setIsHeroVideoReady(false);
                      });
                    }}
                    onPlaying={() => setIsHeroVideoReady(true)}
                    onError={() => {
                      setHasHeroVideoFailed(true);
                      setShouldLoadHeroVideo(false);
                      setIsHeroVideoReady(false);
                    }}
                    className={`absolute inset-0 z-0 h-full min-h-full w-full min-w-full object-cover object-center bg-transparent transition-opacity duration-700 ease-out-expo ${
                      isHeroVideoReady ? 'opacity-70' : 'opacity-0'
                    }`}
                  >
                  </video>
                ) : null}
                <div className="absolute inset-0 z-10 hero-scrim" />
                <div className="absolute inset-0 z-10 screen-scrim opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-t from-body via-transparent to-transparent z-10" />
              </div>

              <div className="home-hero-copy relative z-20 flex h-full flex-col items-center justify-start text-center px-6">
                <div className="max-w-4xl">
                  <h1 className="h1-hero hero-ink mb-12 text-balance">
                    <span className="whitespace-nowrap">
                      {cryptoContext.justCompletedSetup ? 'Welcome,' : 'Welcome back,'}
                    </span>{' '}
                    <br className="home-hero-break" />
                    <span className="font-serif italic hero-ink-accent">
                      {authStoreDisplayName}
                    </span>
                  </h1>
                </div>
              </div>
              <button
                type="button"
                className="home-hero-dismiss-control"
                aria-label="Show dashboard"
                aria-controls="home-dashboard-grid"
                disabled={heroIntroState !== 'visible'}
                tabIndex={heroIntroState === 'visible' ? 0 : -1}
                onClick={() => collapseHeroIntro()}
                onPointerDown={handleHeroDismissPointerDown}
                onPointerMove={handleHeroDismissPointerMove}
                onPointerUp={handleHeroDismissPointerEnd}
                onPointerCancel={handleHeroDismissPointerEnd}
              >
                <span className="home-hero-dismiss-grip" aria-hidden="true" />
                <span>Show dashboard</span>
              </button>
            </section>
          ) : null}

          <section
            id="home-dashboard-grid"
            ref={dashboardGridRef}
            tabIndex={-1}
            aria-label="Dashboard"
            className="core-bento-grid"
          >
            <div className="flex flex-col gap-6">
            <div
              className="home-primary-reflection-card group relative surface-flat overflow-hidden rounded-[2rem] p-8 sm:p-10 lg:p-12 flex flex-col transition-colors duration-300 ease-out-expo hover:border-green/20"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2 text-gray-nav">
                    <Target size={18} weight="duotone" className="text-green" />
                    <span className="text-sm font-bold text-gray-nav">
                      Today's Reflection
                    </span>
                  </div>
                  <button
                    onClick={refreshPrompt}
                    className={`flex h-11 min-w-11 items-center justify-center rounded-[var(--radius-control)] text-gray-nav transition-colors hover:text-green ${
                      isRefreshing ? 'animate-spin' : ''
                    }`}
                    aria-label="Refresh today's reflection prompt"
                  >
                    <ArrowsClockwise size={20} weight="regular" />
                  </button>
                </div>

                <div className="space-y-8">
                  <p
                    className={`dashboard-prompt-text typographic-measure transition-opacity duration-[400ms] ease-out ${isRefreshing ? 'opacity-0' : 'opacity-100'}`}
                  >
                    {dailyPrompt}
                  </p>
                  <div className="space-y-6 lg:space-y-8 lg:mt-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
                      <Button
                        variant="primary"
                        className="min-h-12 py-3 px-6 w-full sm:w-auto rounded-xl bg-green text-sm sm:text-base font-bold text-white shadow-none transition-colors hover:bg-green/90"
                        onPointerEnter={prefetchCreateNoteRoute}
                        onFocus={prefetchCreateNoteRoute}
                        onClick={() => handleCreateClick(dailyPrompt)}
                        aria-label="Begin writing with today's prompt"
                      >
                        <span>Begin Writing</span>
                        <Plus size={16} weight="regular" className="ml-1.5 shrink-0" />
                      </Button>
                      <WhisperComposerControl
                        onFinalTranscript={handleVoiceDraft}
                        label="Speak a note"
                        stopOnFinalTranscript
                        className="w-full sm:w-auto"
                        buttonClassName="relative inline-flex min-h-12 py-3 px-6 w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border text-sm sm:text-base font-bold transition-colors text-green"
                        idleButtonClassName="control-surface hover:border-green/20 hover:bg-green/5"
                        activeButtonClassName="border-green/25 bg-green/20"
                      />
                    </div>
                    <div className="flex flex-row flex-wrap items-center justify-start gap-8 pb-2">
                      <button
                        onClick={() => setIsCheckInOpen(true)}
                        className="group inline-flex min-h-11 items-center gap-2 py-2 text-sm font-bold text-gray-nav transition-colors hover:text-green rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40"
                        aria-label="Save a quick mood check-in"
                      >
                        <Heart size={18} weight="duotone" className="text-green/80 transition-transform group-hover:scale-110" />
                        <span>Quick check-in</span>
                      </button>
                      <button
                        onClick={() => navigate(RoutePath.FUTURE_LETTERS)}
                        className="group inline-flex min-h-11 items-center gap-2 py-2 text-sm font-bold text-gray-nav transition-colors hover:text-green rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40"
                        aria-label="Write a future letter"
                      >
                        <EnvelopeSimple size={18} weight="duotone" className="text-green/80 transition-transform group-hover:scale-110" />
                        <span>Future letter</span>
                      </button>
                      <button
                        onClick={() => navigate(RoutePath.RELEASE)}
                        className="group inline-flex min-h-11 items-center gap-2 py-2 text-sm font-bold text-gray-nav transition-colors hover:text-green rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40"
                        aria-label="Release a thought"
                      >
                        <Wind size={18} weight="duotone" className="text-green/80 transition-transform group-hover:scale-110" />
                        <span>Release a thought</span>
                      </button>
                    </div>
                  </div>
                </div>
            </div>
              {/* Subtle background glow effect on hover */}
              <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-green/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </div>

            <div className="home-intentions-card surface-flat overflow-hidden rounded-[2rem] p-8 sm:p-10 lg:p-12 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-nav">
                  <ListChecks size={16} weight="duotone" className="text-green" />
                  <span className="text-sm font-bold text-gray-nav">
                    Your Intentions
                  </span>
                </div>
                {intentionSummary.openCount > 0 && (
                  <span className="text-xs font-bold text-gray-nav">
                    {intentionSummary.openCount} open
                  </span>
                )}
              </div>

              <div className="space-y-3 mt-4">
                  {intentionSummary.items.length > 0 ? (
                    intentionSummary.items.slice(0, 3).map((intention) => (
                      <button
                        key={intention.id}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl border border-green/15 bg-green/5 hover:border-green/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-green/40 transition-[colors,opacity,transform] text-left shadow-none group/btn active:scale-[0.98]"
                        onClick={() => handleToggleIntention(intention.noteId, intention.id)}
                        aria-label={`Mark "${intention.text}" from ${intention.noteTitle} as complete`}
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 border-border group-hover/btn:border-green transition-colors">
                           <div className="h-2 w-2 rounded-full bg-green opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                        </div>
                        <span className="min-w-0 flex-1">
                          <span className="block font-serif italic text-base text-gray-text group-hover/btn:text-green transition-colors line-clamp-2 leading-snug">
                            {intention.text}
                          </span>
                        </span>
                      </button>
                    ))
                  ) : null}

                  {/* Completed intentions — crossed-off state */}
                  {intentionSummary.completedItems.map((intention) => (
                    <div
                      key={`done-${intention.id}`}
                      className="flex items-center gap-4 p-4 rounded-2xl text-left opacity-50"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 border-green bg-green text-white">
                        <CheckCircleIcon size={12} weight="bold" />
                      </div>
                      <span className="min-w-0 flex-1">
                        <span className="block font-serif italic text-base text-gray-nav line-through decoration-green decoration-2 leading-snug">
                          {intention.text}
                        </span>
                      </span>
                    </div>
                  ))}

                {/* Empty state — horizontal layout so icon doesn't push text down */}
                {intentionSummary.items.length === 0 && intentionSummary.completedItems.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setIsIntentionModalOpen(true)}
                    className="w-full flex flex-col items-center justify-center gap-2 rounded-2xl bg-green/5 border border-green/10 p-8 text-green hover:bg-green/10 transition-colors"
                  >
                    <Plus size={24} weight="bold" />
                    <span className="text-base font-bold">Set your first intention</span>
                    <span className="text-sm font-medium text-gray-nav">What matters most today?</span>
                  </button>
                )}

                {(intentionSummary.hiddenCount > 0 || intentionSummary.items.length > 3) && (
                  <button 
                    onClick={() => navigate(RoutePath.NOTES)}
                    className="w-full text-center label-caps text-gray-nav hover:text-green transition-colors pt-4"
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
                      className="w-full flex items-center justify-center gap-2 py-2 text-sm font-bold text-green hover:text-green/80 transition-colors"
                    >
                      <Plus size={14} weight="bold" className="shrink-0" />
                      <span>Add intention</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <RelationshipHomeModule />

            <div
              className="relative surface-flat surface-tone-sage overflow-hidden rounded-[2rem] p-6 sm:p-8 transition-colors duration-300 ease-out-expo hover:border-green/20"
            >
              <div className="relative z-10">
              <div className="mb-6 flex items-center gap-2 text-gray-nav">
                <Brain size={18} weight="duotone" className="text-green" />
                <p className="text-sm font-bold text-gray-nav">
                  Your Rhythm
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate(RoutePath.NOTES)}
                  className="flex w-full items-center justify-between p-4 px-2 text-left rounded-xl transition-colors hover:bg-green/5 group"
                  aria-label="View all reflections"
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <p className="dashboard-action-title dashboard-hover-title">View archive</p>
                    <p className="dashboard-action-description">Read saved reflections</p>
                  </div>
                  <CaretRight size={16} weight="regular" className="text-gray-nav/40 group-hover:text-green transition-colors shrink-0" />
                </button>

                <button
                  onClick={() => navigate(RoutePath.INSIGHTS)}
                  className="flex w-full items-center justify-between p-4 px-2 text-left rounded-xl transition-colors hover:bg-green/5 group"
                  aria-label="View writing patterns"
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <p className="dashboard-action-title dashboard-hover-title">Writing patterns</p>
                    <p className="dashboard-action-description">Mood, rhythm, and recurring themes</p>
                  </div>
                  <CaretRight size={16} weight="regular" className="text-gray-nav/40 group-hover:text-green transition-colors shrink-0" />
                </button>
              </div>
            </div>
          </div>

          </div>
        </section>
        </div>
      </div>

      <PrivateWritingOnboardingFlow
        isOpen={showOnboarding}
        onClose={onboarding.dismiss}
        onExitToWriting={onboarding.exitToWriting}
        onBeginWriting={handleBeginWritingFromOnboarding}
        isSetupRequired={onboarding.isSetupRequired}
        canOfferAccountPassword={!isGoogleLikeAuth}
        hasFreshAccountPassword={Boolean(user?.id && hasPendingAccountPassword(user.id))}
        userId={user?.id || ''}
        email={user?.email}
        setupEncryption={cryptoContext.setupEncryption}
        confirmRecoveryKey={cryptoContext.confirmRecoveryKey}
        recoveryKey={cryptoContext.recoveryKey}
        completeOnboarding={onboarding.complete}
        justCompletedSetup={cryptoContext.justCompletedSetup}
        clearJustCompletedSetup={cryptoContext.clearJustCompletedSetup}
      />

      <ModalSheet
        isOpen={isCheckInOpen}
        onClose={() => {
          setMoodPickerStage('group');
          setIsCheckInOpen(false);
          setCheckInFeedback(null);
        }}
        title={moodPickerStage === 'group' ? 'How does it feel right now?' : undefined}
        description={moodPickerStage === 'group' ? 'Pick a broad mood. Details are optional.' : undefined}
        ariaLabel="Choose a mood for this reflection"
        size="sm"
        tone="sage"
        panelClassName={`modal-sheet-panel--compact ${moodPickerStage === 'detail' ? 'modal-sheet-panel--mood-detail' : ''}`.trim()}
        bodyClassName={`modal-sheet-body--compact ${moodPickerStage === 'detail' ? 'modal-sheet-body--mood-detail' : ''}`.trim()}
      >
        <div className="space-y-3">
          {!checkInFeedback ? (
            <MoodPicker
              selectedMood={undefined}
              onStageChange={setMoodPickerStage}
              onSelect={(nextMood) => {
                if (nextMood) {
                  setMoodPickerStage('group');
                  void handleMoodCheckIn(nextMood);
                }
              }}
            />
          ) : (
            <div
              className="flex flex-col items-center justify-center py-10 text-center animate-scale-in"
            >
              {checkInFeedback === 'error' ? (
                <p className="text-sm font-bold text-clay">Could not save that just now.</p>
              ) : (
                <>
                  <div 
                    className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green/10 text-green animate-shake-x"
                  >
                    {getMoodConfig(checkInFeedback)?.icon && React.createElement(getMoodConfig(checkInFeedback)!.icon, { size: 32, weight: "fill" })}
                  </div>
                  <h3 className="label-caps mb-2 text-green">Recorded</h3>
                  <p className="font-serif text-[16px] italic leading-relaxed text-gray-light">
                    Logged. Tiny check-in, useful signal.
                  </p>
                </>
              )}
            </div>
          )}
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
        icon={<ListChecks size={22} weight="duotone" />}
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
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-border text-transparent transition-colors group-hover:border-green/50">
                    <span />
                  </div>
                  <span className="flex-1 text-ui-sm font-bold text-gray-text line-clamp-2">{intention.text}</span>
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
              <div className="intention-entry-control flex-1">
                <input
                  type="text"
                  autoFocus
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="What needs to be done?"
                  aria-label="Add an intention"
                  disabled={isCreatingTask}
                  className="intention-entry-input"
                />
              </div>
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
            <p className="text-sm font-medium text-gray-nav text-center py-2">
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
      <div className="floating-audio-container">
        <AmbientMusicButton />
      </div>
    </>
  );
};
