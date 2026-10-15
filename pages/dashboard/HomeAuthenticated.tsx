import { ArrowsClockwise } from '@phosphor-icons/react/ArrowsClockwise';
import { CaretRight } from '@phosphor-icons/react/CaretRight';
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

const notePath = (id: string) => RoutePath.NOTE_DETAIL.replace(':id', encodeURIComponent(id));

export const HomeAuthenticated: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const haptics = useHaptics();
  const { user } = useAuthStore();
  const cryptoContext = useCrypto();
  const [dailyPrompt, setDailyPrompt] = useState(DEFAULT_WELLNESS_PROMPTS[0]);
  const [recentNotes, setRecentNotes] = useState<Note[] | null>(null);
  const isLaunchRef = useRef(isSessionLaunch());

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
        if (active) setRecentNotes(notes.slice(0, 3));
      })
      .catch(() => {
        if (active) setRecentNotes([]);
      });
    return () => {
      active = false;
    };
  }, [isPrivateWritingReady, user]);

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
        <section aria-label="Today" className="mx-auto w-full max-w-3xl px-5 pb-28 pt-native-top-offset sm:px-8 lg:pt-16">
          <header className="mb-10 mt-6">
            <p className="label-caps text-gray-nav">
              {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="h2-section mt-2 font-serif font-normal text-gray-text">
              {greetingFor(now)}{firstName ? `, ${firstName}` : ''}.
            </h1>
          </header>

          <div className="surface-flat rounded-4xl p-7 sm:p-10">
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
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <Button
                variant="primary"
                size="md"
                className="w-full sm:w-auto"
                onPointerEnter={prefetchCreateNoteRoute}
                onFocus={prefetchCreateNoteRoute}
                onClick={() => navigate(RoutePath.CREATE_NOTE, { state: { initialPrompt: dailyPrompt } })}
                aria-label="Begin writing with this prompt"
              >
                <PencilSimple size={16} weight="regular" className="mr-1.5 shrink-0" />
                <span>Begin writing</span>
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
            </div>
          </div>

          <div className="mt-6">
            <RelationshipHomeModule />
          </div>

          {recentNotes && recentNotes.length > 0 ? (
            <section aria-labelledby="today-recent" className="mt-10">
              <div className="mb-3 flex items-center justify-between">
                <h2 id="today-recent" className="label-caps text-gray-nav">Recently written</h2>
                <Link to={RoutePath.NOTES} className="text-xs font-bold uppercase tracking-wider text-green hover:text-green-hover">
                  All notes
                </Link>
              </div>
              <ul className="divide-y divide-border/60">
                {recentNotes.map((note) => (
                  <li key={note.id}>
                    <Link to={notePath(note.id)} className="group flex items-center gap-4 py-4">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-base font-bold text-gray-text group-hover:text-green">
                          {note.title || 'Untitled reflection'}
                        </span>
                        <span className="mt-1 block truncate text-sm text-gray-light">
                          {stripHtml(note.content).slice(0, 140)}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-medium text-gray-nav">
                        {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <nav aria-label="Other ways to write" className="mt-10 grid gap-1 sm:grid-cols-2">
            <Link to={RoutePath.FUTURE_LETTERS} className="group flex min-h-11 items-center gap-3 rounded-xl px-2 py-3 text-sm font-bold text-gray-nav hover:bg-green/5 hover:text-green">
              <EnvelopeSimple size={18} weight="duotone" className="text-green/80" />
              <span className="flex-1">Write to your future self</span>
              <CaretRight size={14} className="text-gray-nav/40" />
            </Link>
            <Link to={RoutePath.RELEASE} className="group flex min-h-11 items-center gap-3 rounded-xl px-2 py-3 text-sm font-bold text-gray-nav hover:bg-green/5 hover:text-green">
              <Wind size={18} weight="duotone" className="text-green/80" />
              <span className="flex-1">Release a thought</span>
              <CaretRight size={14} className="text-gray-nav/40" />
            </Link>
          </nav>
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
