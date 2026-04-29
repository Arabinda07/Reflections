import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, Feather, Wind } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { CompletionCardActions } from '../../components/ui/CompletionCardActions';
import { buildCompletionCardPayload, type CompletionCardPayload } from '../../services/completionCardService';
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

  const releaseCardPayload = useMemo(
    () =>
      buildCompletionCardPayload({
        kind: 'release_completed',
        date: new Date(),
      }),
    [],
  );

  const handleRelease = async () => {
    if (!canRelease) return;

    setIsReleasing(true);
    setError(null);
    try {
      await ritualEventService.recordReleaseCompleted();
      setIsReleased(true);
      setCardPayload(releaseCardPayload);

      if (shouldReduceMotion) {
        setText('');
      } else {
        window.setTimeout(() => setText(''), 520);
      }
    } catch (releaseError) {
      console.error('Could not complete release:', releaseError);
      setError("I couldn't complete this release just now. Your words are still only here on this screen.");
    } finally {
      setIsReleasing(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-1 flex-col bg-body">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-4xl flex-col px-5 py-5 sm:px-8 sm:py-8">
        <div className="mb-5 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(RoutePath.HOME)} className="-ml-2">
            <ArrowLeft size={16} weight="bold" className="mr-2" />
            Home
          </Button>
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-nav/70">
            <Wind size={16} weight="duotone" className="text-green" />
            Release mode
          </div>
        </div>

        <section className="flex flex-1 flex-col justify-center gap-7">
          <div className="space-y-3 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-green/15 bg-green/10 text-green">
              <Feather size={24} weight="duotone" />
            </div>
            <h1 className="font-display text-[clamp(2.2rem,7vw,5rem)] font-bold leading-none text-gray-text">
              Write it here. Let it leave.
            </h1>
            <p className="mx-auto max-w-2xl text-[15px] font-medium leading-7 text-gray-light">
              Release mode does not create a note. When you release, the written text disappears and only a content-free marker remains.
            </p>
          </div>

          <motion.div
            animate={isReleased && !shouldReduceMotion ? { opacity: 0, y: -18, filter: 'blur(10px)' } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.52, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-[28px] border border-border/60 bg-panel-bg/80 p-4 shadow-sm sm:p-6"
          >
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              disabled={isReleased || isReleasing}
              autoFocus
              placeholder="Write what you are ready to put down."
              className="min-h-[42dvh] w-full resize-none rounded-[22px] border border-border/40 bg-white/60 p-5 font-serif text-[20px] leading-9 text-gray-text outline-none transition-all placeholder:text-gray-nav/35 focus:border-green/30 focus:ring-4 focus:ring-green/10 disabled:opacity-60 dark:bg-white/5 sm:p-8 sm:text-[22px] sm:leading-10"
            />
          </motion.div>

          {error ? (
            <p className="text-center text-[13px] font-bold text-red" aria-live="polite">
              {error}
            </p>
          ) : null}

          {!isReleased ? (
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
          ) : (
            <div className="mx-auto w-full max-w-xl space-y-4 text-center">
              <p className="font-serif text-[22px] italic leading-relaxed text-gray-text">
                Released. This can stay quiet now.
              </p>
              {cardPayload ? <CompletionCardActions payload={cardPayload} /> : null}
              <Button variant="ghost" onClick={() => navigate(RoutePath.HOME)} className="mx-auto">
                Return home
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
