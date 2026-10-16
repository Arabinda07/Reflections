import { ArrowsClockwise } from '@phosphor-icons/react/ArrowsClockwise';
import { ArrowRight } from '@phosphor-icons/react/ArrowRight';
import { CaretRight } from '@phosphor-icons/react/CaretRight';
import { ClockCounterClockwise } from '@phosphor-icons/react/ClockCounterClockwise';
import { EnvelopeSimple } from '@phosphor-icons/react/EnvelopeSimple';
import { PencilSimple } from '@phosphor-icons/react/PencilSimple';
import { Wind } from '@phosphor-icons/react/Wind';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { WhisperComposerControl } from '../../components/ui/WhisperComposerControl';
import { useCrypto } from '../../context/CryptoContext';
import {
  PrivateWritingOnboardingFlow,
  usePrivateWritingOnboarding,
} from '../../features/private-writing-onboarding';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useHaptics } from '../../hooks/useHaptics';
import { stripHtml } from '../../services/collectionUtils';
import { noteService } from '../../services/noteService';
import { DEFAULT_WELLNESS_PROMPTS, getTimeAwareWellnessPrompts } from '../../services/wellnessPrompts';
import { hasPendingAccountPassword } from '../../src/auth/accountPasswordHandoff';
import { Note, RoutePath } from '../../types';
import { RelationshipHomeModule } from './RelationshipHomeModule';
import { findResurfacedNote, type ResurfacedNote } from './homeResurface';
import { isSessionLaunch, markLaunchRouted } from '../../src/utils/launchRouting';

const prefetchCreateNoteRoute = () => {
  void import('@/pages/dashboard/CreateNote');
};

const pickPrompt = (current?: string) => {
  const prompts = getTimeAwareWellnessPrompts();
  const options = prompts.filter((prompt) => prompt !== current);
  return options[Math.floor(Math.random() * options.length)] ?? prompts[0];
};

const greetingFor = (date: Date) => {
  const hour = date.getHours();
  if (hour < 5) return 'Still up';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const MOD_KEY = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘' : 'Ctrl';

const notePath = (id: string) => RoutePath.NOTE_DETAIL.replace(':id', encodeURIComponent(id));

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

export const HomeAuthenticated: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const haptics = useHaptics();
  const { user } = useAuthStore();
  const cryptoContext = useCrypto();
  const [dailyPrompt, setDailyPrompt] = useState(DEFAULT_WELLNESS_PROMPTS[0]);
  const [firstLines, setFirstLines] = useState('');
  const [recentNotes, setRecentNotes] = useState<Note[] | null>(null);
  const [resurfaced, setResurfaced] = useState<ResurfacedNote | null>(null);
  const isLaunchRef = useRef(isSessionLaunch());
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const isPrivateWritingReady = cryptoContext.status === 'unlocked';
  const onboarding = usePrivateWritingOnboarding({
    hasUser: Boolean(user),
    isSetupRequired: cryptoContext.status === 'setupRequired',
  });
  // shouldShowOnboarding only covers mandatory setup; justCompletedSetup keeps the
  // post-setup "ready" screen visible for this session (it resets on reload).
  const showOnboarding = onboarding.shouldShowOnboarding || cryptoContext.justCompletedSetup;
  const isGoogleLikeAuth = user?.authProvider === 'google';
  const firstName = user?.name?.trim().split(/\s+/)[0];

  useEffect(() => {
    setDailyPrompt(pickPrompt());
  }, []);

  useEffect(() => {
    if (location.state?.justLoggedIn) {
      haptics.success();
      window.history.replaceState({}, '');
    }
  }, [location.state, haptics]);

  // First arrival in a session goes straight to a blank page.
  useEffect(() => {
    if (!isLaunchRef.current) return;
    if (showOnboarding) {
      isLaunchRef.current = false;
      markLaunchRouted();
      return;
    }
    if (!isPrivateWritingReady) return;
    isLaunchRef.current = false;
    markLaunchRouted();
    navigate(RoutePath.CREATE_NOTE, { replace: true });
  }, [isPrivateWritingReady, navigate, showOnboarding]);

  useEffect(() => {
    if (!user || !isPrivateWritingReady) return;
    let active = true;
    noteService
      .getAll()
      .then((notes) => {
        if (!active) return;
        setRecentNotes(notes.slice(0, 3));
        setResurfaced(findResurfacedNote(notes, new Date()));
      })
      .catch(() => {
        if (active) setRecentNotes([]);
      });
    return () => {
      active = false;
    };
  }, [isPrivateWritingReady, user]);

  // "/" jumps to the page from anywhere on Today, like search in a good desktop app.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || isTypingTarget(event.target)) return;
      event.preventDefault();
      composerRef.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const beginWriting = useCallback(() => {
    prefetchCreateNoteRoute();
    const initialContent = firstLines.trim();
    navigate(RoutePath.CREATE_NOTE, {
      state: initialContent ? { initialPrompt: dailyPrompt, initialContent } : { initialPrompt: dailyPrompt },
    });
  }, [dailyPrompt, firstLines, navigate]);

  const handleBeginWritingFromOnboarding = useCallback(() => {
    prefetchCreateNoteRoute();
    navigate(RoutePath.CREATE_NOTE, { state: { initialPrompt: 'Start with one true sentence.' } });
  }, [navigate]);

  const handleVoiceDraft = useCallback((text: string) => {
    const cleanText = text.trim();
    if (!cleanText) return;
    prefetchCreateNoteRoute();
    navigate(RoutePath.CREATE_NOTE, { state: { initialContent: cleanText } });
  }, [navigate]);

  const now = new Date();

  return (
    <>
      <div
        className="home-authenticated-mobile-safe surface-scope-sage page-wash relative min-h-full flex flex-col flex-1 bg-body selection:bg-green/10"
        aria-hidden={showOnboarding ? 'true' : undefined}
      >
        <section aria-label="Today" className="page-container home-grid pb-28 pt-native-top-offset lg:pt-14">
          <header className="home-grid-head mt-6 lg:mt-0">
            <p className="label-caps text-gray-nav">
              {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="home-greeting mt-3">
              {greetingFor(now)}{firstName ? `, ${firstName}` : ''}.
            </h1>
          </header>

          <div className="home-grid-compose surface-flat home-composer rounded-4xl p-6 sm:p-10">
            <div className="flex items-start justify-between gap-4">
              <p className="dashboard-prompt-text typographic-measure">{dailyPrompt}</p>
              <button
                type="button"
                onClick={() => setDailyPrompt((current) => pickPrompt(current))}
                className="flex h-11 min-w-11 shrink-0 items-center justify-center rounded-2xl text-gray-nav transition-colors hover:text-green"
                aria-label="Show a different prompt"
              >
                <ArrowsClockwise size={20} weight="regular" />
              </button>
            </div>

            <label htmlFor="home-first-lines" className="sr-only">Start writing here</label>
            <textarea
              id="home-first-lines"
              ref={composerRef}
              value={firstLines}
              onChange={(event) => setFirstLines(event.target.value)}
              onFocus={prefetchCreateNoteRoute}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  beginWriting();
                }
              }}
              rows={2}
              placeholder="Start with one true sentence."
              className="home-composer-input mt-6"
            />

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Button
                variant="primary"
                size="md"
                className="w-full sm:w-auto"
                onPointerEnter={prefetchCreateNoteRoute}
                onFocus={prefetchCreateNoteRoute}
                onClick={beginWriting}
                aria-label={firstLines.trim() ? 'Continue on the page' : 'Begin writing with this prompt'}
              >
                <PencilSimple size={16} weight="regular" className="mr-1.5 shrink-0" />
                <span>{firstLines.trim() ? 'Continue on the page' : 'Begin writing'}</span>
              </Button>
              <WhisperComposerControl
                onFinalTranscript={handleVoiceDraft}
                label="Speak a note"
                stopOnFinalTranscript
                className="w-full sm:w-auto"
                buttonClassName="relative inline-flex min-h-12 py-3 px-6 w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl text-sm sm:text-base font-bold transition-colors text-gray-nav hover:text-green"
                idleButtonClassName="control-surface"
                activeButtonClassName="border-green/25 bg-green/20 text-green"
              />
              <p className="hidden text-ui-xs font-medium text-gray-nav lg:ml-auto lg:block" aria-hidden="true">
                {firstLines.trim() ? <><kbd className="home-kbd">{MOD_KEY}</kbd> <kbd className="home-kbd">Enter</kbd> to continue</> : <><kbd className="home-kbd">/</kbd> to start typing</>}
              </p>
            </div>
          </div>

          <aside aria-label="People and memories" className="home-grid-rail flex flex-col gap-6">
            <RelationshipHomeModule />

            {resurfaced ? (
              <Link
                to={notePath(resurfaced.note.id)}
                className="surface-flat home-card group block rounded-4xl p-6 sm:p-7"
              >
                <span className="flex items-center gap-2 label-caps text-gray-nav">
                  <ClockCounterClockwise size={14} weight="bold" className="text-green" />
                  {resurfaced.label}
                </span>
                <span className="mt-4 block font-serif text-lg italic leading-relaxed text-gray-text line-clamp-4">
                  {stripHtml(resurfaced.note.content).slice(0, 240) || resurfaced.note.title || 'Untitled reflection'}
                </span>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-green">
                  Read it again
                  <ArrowRight size={14} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ) : null}

            <nav aria-label="Other ways to write" className="grid gap-1">
              <Link to={RoutePath.FUTURE_LETTERS} className="group flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-gray-nav hover:bg-green/5 hover:text-green">
                <EnvelopeSimple size={18} weight="duotone" className="text-green/80" />
                <span className="flex-1">Write to your future self</span>
                <CaretRight size={14} className="text-gray-nav/40" />
              </Link>
              <Link to={RoutePath.RELEASE} className="group flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-gray-nav hover:bg-green/5 hover:text-green">
                <Wind size={18} weight="duotone" className="text-green/80" />
                <span className="flex-1">Release a thought</span>
                <CaretRight size={14} className="text-gray-nav/40" />
              </Link>
            </nav>
          </aside>

          {recentNotes && recentNotes.length > 0 ? (
            <section aria-labelledby="today-recent" className="home-grid-recent">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 id="today-recent" className="label-caps text-gray-nav">Recently written</h2>
                <Link to={RoutePath.NOTES} className="inline-flex min-h-11 items-center gap-1 text-xs font-bold uppercase tracking-wider text-green hover:text-green-hover">
                  All notes
                  <ArrowRight size={12} weight="bold" />
                </Link>
              </div>
              <ul className="grid gap-4 md:grid-cols-3">
                {recentNotes.map((note) => (
                  <li key={note.id} className="min-w-0">
                    <Link to={notePath(note.id)} className="surface-flat home-card group flex h-full flex-col rounded-3xl p-5">
                      <span className="label-caps text-gray-nav">
                        {new Date(note.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <span className="mt-3 block truncate text-base font-bold text-gray-text group-hover:text-green">
                        {note.title || 'Untitled reflection'}
                      </span>
                      <span className="mt-2 block font-serif text-sm leading-relaxed text-gray-light line-clamp-3">
                        {stripHtml(note.content).slice(0, 180)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </section>
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
    </>
  );
};
