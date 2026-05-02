import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, Feather, Wind } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { CompletionCardActions } from '../../components/ui/CompletionCardActions';
import { buildCompletionCardPayload, type CompletionCardPayload } from '../../services/completionCardPayload';
import { ritualEventService } from '../../services/engagementServices';
import { RoutePath } from '../../types';

export const ReleaseMode: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [text, setText] = useState('');
  const [isReleasing, setIsReleasing] = useState(false);
  const [isReleased, setIsReleased] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardPayload, setCardPayload] = useState<CompletionCardPayload | null>(null);

  const canRelease = text.trim().length > 0 && !isReleasing && !isReleased;

  const handleRelease = async () => {
    if (!canRelease) return;

    setIsReleasing(true);
    setError(null);
    try {
      await ritualEventService.recordReleaseCompleted();
      setIsReleased(true);
      setCardPayload(
        buildCompletionCardPayload({
          kind: 'release_completed',
          date: new Date(),
        }),
      );
    } catch (releaseError) {
      console.error('Could not complete release:', releaseError);
      setError("I couldn't complete this release just now. Your words are still only here on this screen.");
    } finally {
      setIsReleasing(false);
    }
  };

  return (
    <div className="surface-scope-clay page-wash flex min-h-[100dvh] flex-1 flex-col bg-body">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-4xl flex-col px-5 py-5 sm:px-8 sm:py-8">
        <div className="mb-5 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(RoutePath.HOME)} className="-ml-2 min-h-11">
            <ArrowLeft size={16} weight="bold" className="mr-2" />
            Home
          </Button>
          <div className="flex items-center gap-2 label-caps text-gray-nav/70">
            <Wind size={16} weight="duotone" className="text-green" />
            Release mode
          </div>
        </div>

        <section className="flex flex-1 flex-col justify-start gap-5 pb-10 pt-2 sm:justify-center sm:gap-7 sm:pb-0 sm:pt-0">
          <div className="space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-green/15 bg-green/10 text-green">
              <Feather size={24} weight="duotone" />
            </div>
            <h1 className="h1-hero !leading-none">
              Write it here. Let it leave.
            </h1>
            <p className="mx-auto max-w-[65ch] text-base font-medium leading-relaxed text-gray-light">
              Release mode does not create a note. When you release, the written text disappears and only a content-free marker remains.
            </p>
          </div>

          <AnimatePresence mode="wait" initial={false} onExitComplete={() => setText('')}>
            {!isReleased ? (
              <motion.div
                key="release-writing"
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -18, filter: 'blur(10px)' }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.52, ease: [0.16, 1, 0.3, 1] }}
                className="release-writing-measure w-full space-y-7"
              >
                <div className="surface-flat p-4 sm:p-6">
                  <label htmlFor="release-writing" className="sr-only">
                    Release writing
                  </label>
                  <textarea
                    id="release-writing"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    disabled={isReleasing}
                    autoFocus
                    placeholder="Write what you are ready to put down."
                    className="input-surface min-h-[34dvh] w-full resize-none rounded-[22px] p-5 font-serif text-xl leading-relaxed text-gray-text placeholder:text-gray-nav/35 disabled:opacity-60 sm:min-h-[42dvh] sm:p-8 sm:text-2xl"
                  />
                </div>

                {error ? (
                  <p className="text-center text-sm font-bold text-clay" aria-live="polite">
                    {error}
                  </p>
                ) : null}

                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button variant="secondary" onClick={() => navigate(RoutePath.HOME)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleRelease}
                    disabled={!canRelease}
                    isLoading={isReleasing}
                    className="w-full px-10 sm:w-auto"
                  >
                    Release
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="release-complete"
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.36, ease: [0.16, 1, 0.3, 1] }}
                className="mx-auto w-full max-w-xl space-y-4 text-center"
              >
                <p className="font-serif text-2xl italic leading-relaxed text-gray-text">
                  Released. This can stay quiet now.
                </p>
                {cardPayload ? <CompletionCardActions payload={cardPayload} /> : null}
                <Button variant="ghost" onClick={() => navigate(RoutePath.HOME)} className="mx-auto">
                  Return home
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
};
