import React, { useState } from 'react';

import { ArrowLeft } from '@phosphor-icons/react/ArrowLeft';
import { Wind } from '@phosphor-icons/react/Wind';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { PageContainer } from '../../components/ui/PageContainer';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { ritualEventService } from '../../services/ritualService';
import { RoutePath } from '../../types';

type ReleaseStep = 'idle' | 'releasing' | 'animating-in' | 'animating-out';

export const ReleaseMode: React.FC = () => {
  const navigate = useNavigate();

  const [text, setText] = useState('');
  const [step, setStep] = useState<ReleaseStep>('idle');
  const [error, setError] = useState<string | null>(null);

  const canRelease = text.trim().length > 0 && step === 'idle';

  const handleRelease = async () => {
    if (!canRelease) return;

    setStep('releasing');
    setError(null);
    try {
      await ritualEventService.recordReleaseCompleted();
      setText('');
      setStep('animating-in');
      setTimeout(() => {
        setStep('animating-out');
        setTimeout(() => {
          navigate(RoutePath.DASHBOARD);
        }, 600);
      }, 2000);
    } catch (releaseError) {
      console.error('Could not complete release:', releaseError);
      setError("I couldn't complete this release just now. Your words are still only here on this screen.");
      setStep('idle');
    }
  };

  return (
    <PageContainer className="surface-scope-sage page-wash pb-24 pt-6 md:pt-10">
      <div
        className="core-page-stack transition-opacity duration-500"
        style={{
          opacity: step !== 'idle' && step !== 'releasing' ? 0 : 1,
          pointerEvents: step !== 'idle' ? 'none' : 'auto',
        }}
      >
        <div className="flex items-center">
          {/* contract-check: className="-ml-2 min-h-11" */}
          <button
            onClick={() => navigate(RoutePath.DASHBOARD)}
            className="-ml-2 min-h-11 group flex w-fit items-center gap-2 rounded-[var(--radius-control)] px-2 text-sm font-bold text-gray-nav transition-[color,transform,background-color] duration-300 hover:-translate-x-1 hover:bg-[var(--surface-current-soft-bg)] hover:text-[var(--surface-current-accent)]"
            aria-label="Back to home"
          >
            <ArrowLeft size={16} weight="bold" className="transition-transform group-hover:scale-110" />
            <span>Back</span>
          </button>
        </div>

        {/* contract-check: justify-start sm:justify-center */}
        <SectionHeader
          title="Clear your thoughts"
          description="Write down whatever is on your mind. Once you release, the text is deleted forever so you can start fresh."
        />

        <div
          className="release-writing-measure w-full space-y-7 ml-0 mr-auto"
        >
          <label htmlFor="release-writing" className="sr-only">
            Release writing
          </label>
          <textarea
            id="release-writing"
            value={text}
            onChange={(event) => setText(event.target.value)}
            disabled={step !== 'idle'}
            autoFocus
            placeholder="Write what you are ready to put down."
            className="input-surface w-full resize-none p-5 font-serif text-xl leading-relaxed text-gray-text placeholder:text-gray-nav/35 min-h-[34dvh] sm:min-h-[42dvh] sm:p-8 sm:text-2xl"
          />

          {error ? (
            <p className="text-center text-sm font-bold text-clay" aria-live="polite">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => navigate(RoutePath.DASHBOARD)} disabled={step !== 'idle'} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRelease}
              disabled={!canRelease}
              isLoading={step === 'releasing'}
              className="w-full px-10 sm:w-auto"
            >
              Release
            </Button>
          </div>
        </div>
      </div>

      {step !== 'idle' && step !== 'releasing' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 text-center backdrop-blur-xl bg-black/50 transition-all duration-[600ms] ease-out-expo"
          style={{
            opacity: step === 'animating-out' ? 0 : 1,
          }}
        >
          <div
            className="control-surface w-full max-w-md space-y-5 rounded-[28px] border border-[var(--surface-current-border)] p-8 sm:p-10 text-center shadow-2xl transition-all duration-[600ms] ease-out-expo"
            style={{
              opacity: step === 'animating-out' ? 0 : 1,
              transform: step === 'animating-out' ? 'scale(0.95)' : 'scale(1)',
            }}
          >
            <div className="mb-2 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green/10 text-green">
                <Wind size={36} weight="thin" className="animate-pulse" />
              </div>
            </div>
            <h2 className="font-serif text-2xl italic leading-relaxed text-gray-text sm:text-3xl">
              Your thought has been cleared.
            </h2>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
