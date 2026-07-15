import React, { useEffect, useMemo, useState } from 'react';
import { Check } from '@phosphor-icons/react/Check';

import { WarningCircle } from '@phosphor-icons/react/WarningCircle';
import { Button } from './Button';
import { buildReferralLink, referralService } from '../../services/referralService';
import type { ReferralInvite } from '../../types';
import { useHaptics } from '../../hooks/useHaptics';
import { useSound } from '../../hooks/useSound';

interface ReferralInvitePanelProps {
  compact?: boolean;
}

export const ReferralInvitePanel: React.FC<ReferralInvitePanelProps> = ({ compact = false }) => {
  const [invite, setInvite] = useState<ReferralInvite | null>(null);
  const [acceptedCount, setAcceptedCount] = useState(0);
  const haptics = useHaptics();
  const { playSaveChime } = useSound();
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [justCopied, setJustCopied] = useState(false);
  const isErrorStatus = status ? status.startsWith('I could not') || status.startsWith('Copy did not') : false;

  useEffect(() => {
    let isMounted = true;

    const loadInvite = async () => {
      setIsLoading(true);
      try {
        const [nextInvite, count] = await Promise.all([
          referralService.getOrCreateInvite(),
          referralService.getAcceptedReferralCount(),
        ]);
        if (!isMounted) return;
        setInvite(nextInvite);
        setAcceptedCount(count);
      } catch (error) {
        console.error('Could not load invite:', error);
        if (isMounted) {
          setStatus('I could not load your invite just now.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadInvite();

    return () => {
      isMounted = false;
    };
  }, []);

  const inviteLink = useMemo(() => {
    if (!invite) return '';
    return buildReferralLink(invite.code);
  }, [invite]);

  const markShared = async () => {
    if (!invite) return;
    try {
      const updatedInvite = await referralService.markInviteShared(invite.id);
      setInvite(updatedInvite);
    } catch (error) {
      console.error('Could not mark invite as shared:', error);
    }
  };

  const isShareCancellation = (error: unknown) => {
    if (!(error instanceof Error)) return false;

    const message = error.message.toLowerCase();
    return (
      error.name === 'AbortError' ||
      message.includes('cancel') ||
      message.includes('abort') ||
      message.includes('dismiss')
    );
  };

  const copyInviteLink = async (markAsShared = true) => {
    await navigator.clipboard.writeText(inviteLink);
    if (markAsShared) {
      await markShared();
    }
  };

  const handleCopy = async () => {
    if (!inviteLink) return;

    try {
      await copyInviteLink();
      setStatus('Invite link copied.');
      setJustCopied(true);
      window.setTimeout(() => setJustCopied(false), 2000);
      haptics.confirming();
      playSaveChime();
    } catch (error) {
      console.error('Could not copy invite link:', error);
      setStatus('Copy did not work. You can select the link instead.');
    }
  };

  const handleShare = async () => {
    if (!inviteLink) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Reflections',
          text: 'A quiet space for private writing.',
          url: inviteLink,
        });
        await markShared();
        setStatus('Invite shared.');
        haptics.confirming();
        playSaveChime();
        return;
      }

      await handleCopy();
    } catch (error) {
      if (isShareCancellation(error)) {
        setStatus(null);
        return;
      }

      console.error('Could not share invite:', error);
      try {
        await copyInviteLink(false);
        setStatus('I could not share the invite, so I copied the link instead.');
      } catch (copyError) {
        console.error('Could not copy invite link after share failed:', copyError);
        setStatus('I could not share or copy the invite just now.');
      }
    }
  };

  if (isLoading) {
    return <p className="text-sm font-medium text-gray-light">Preparing your invite...</p>;
  }

  return (
    <div className={`surface-inline-panel p-5 rounded-[22px] ${compact ? 'space-y-4' : 'space-y-5'}`}>
      <p className="text-xs font-bold text-gray-nav">
        {acceptedCount === 0 ? 'No one has joined yet' : `${acceptedCount} ${acceptedCount === 1 ? 'person' : 'people'} joined`}
        {invite?.lastSharedAt ? ` · Shared ${new Date(invite.lastSharedAt).toLocaleDateString()}` : ''}
      </p>

      <div className="pt-1">
        <Button 
          type="button" 
          size="md"
          onClick={handleShare} 
          disabled={!inviteLink || justCopied} 
          className="min-h-11 w-fit self-end sm:self-auto transition-all"
        >
          {justCopied ? (
            <span className="flex items-center gap-2">
              <Check size={18} weight="bold" />
              Link Copied!
            </span>
          ) : (
            'Invite a Friend'
          )}
        </Button>
      </div>

      {status ? (
        <p
          className={`flex items-center gap-2 text-xs font-bold ${isErrorStatus ? 'text-clay' : 'text-gray-light'}`}
          aria-live="polite"
        >
          {isErrorStatus ? (
            <WarningCircle size={14} weight="bold" className="text-clay" />
          ) : (
            <Check size={14} weight="bold" className="text-green" />
          )}
          {status}
        </p>
      ) : null}
    </div>
  );
};
