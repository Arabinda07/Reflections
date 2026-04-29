import React, { useState } from 'react';
import { CopySimple, DownloadSimple, ShareNetwork } from '@phosphor-icons/react';
import { Button } from './Button';
import type { CompletionCardPayload } from '../../services/completionCardPayload';
import { ritualEventService } from '../../services/engagementServices';

interface CompletionCardActionsProps {
  payload: CompletionCardPayload;
  className?: string;
}

const loadCompletionCardService = () => import('../../services/completionCardService');

export const CompletionCardActions: React.FC<CompletionCardActionsProps> = ({
  payload,
  className = '',
}) => {
  const [status, setStatus] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const isErrorStatus = status?.startsWith('I could not') ?? false;

  const recordCardCreated = async () => {
    try {
      await ritualEventService.record('completion_card_created');
    } catch (error) {
      console.error('Could not record completion card event:', error);
    }
  };

  const handleShare = async () => {
    if (isWorking) return;

    setIsWorking(true);
    setStatus(null);
    try {
      const { downloadCompletionCard, shareCompletionCard } = await loadCompletionCardService();
      const result = await shareCompletionCard(payload);
      if (result === 'unsupported') {
        await downloadCompletionCard(payload);
        setStatus('Card downloaded.');
      } else {
        setStatus('Card shared.');
      }
      await recordCardCreated();
    } catch (error) {
      console.error('Could not share completion card:', error);
      setStatus('I could not create the card just now.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleDownload = async () => {
    if (isWorking) return;

    setIsWorking(true);
    setStatus(null);
    try {
      const { downloadCompletionCard } = await loadCompletionCardService();
      await downloadCompletionCard(payload);
      await recordCardCreated();
      setStatus('Card downloaded.');
    } catch (error) {
      console.error('Could not download completion card:', error);
      setStatus('I could not create the card just now.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleCopy = async () => {
    if (isWorking) return;

    setIsWorking(true);
    setStatus(null);
    try {
      const { copyCompletionCardToClipboard, downloadCompletionCard } = await loadCompletionCardService();
      const copied = await copyCompletionCardToClipboard(payload);
      if (!copied) {
        await downloadCompletionCard(payload);
        setStatus('Card downloaded.');
      } else {
        setStatus('Card copied.');
      }
      await recordCardCreated();
    } catch (error) {
      console.error('Could not copy completion card:', error);
      setStatus('I could not create the card just now.');
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div
      className={`rounded-[var(--radius-panel)] border border-border/50 bg-white/5 p-5 ${className}`.trim()}
    >
      <div className="mb-4 space-y-1">
        <p className="text-[11px] font-black uppercase tracking-widest text-green">
          Completion card
        </p>
        <p className="text-[15px] font-semibold leading-relaxed text-gray-text">
          {payload.title}
        </p>
        <p className="text-[13px] font-medium text-gray-light">{payload.subtitle}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" variant="primary" size="sm" onClick={handleShare} isLoading={isWorking}>
          Share card
          <ShareNetwork size={16} weight="bold" className="ml-2" />
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={handleCopy} disabled={isWorking}>
          Copy image
          <CopySimple size={16} weight="bold" className="ml-2" />
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={handleDownload} disabled={isWorking}>
          Download
          <DownloadSimple size={16} weight="bold" className="ml-2" />
        </Button>
      </div>

      {status ? (
        <p
          className={`mt-3 text-[12px] font-bold ${isErrorStatus ? 'text-red' : 'text-gray-light'}`}
          aria-live="polite"
        >
          {status}
        </p>
      ) : null}
    </div>
  );
};
