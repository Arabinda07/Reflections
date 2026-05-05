import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Check, CopySimple, PaperPlaneTilt, WarningCircle } from '@phosphor-icons/react';
import { Button } from './Button';
import { MetadataPill } from './MetadataPill';
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

  const handleCopy = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      await markShared();
      setStatus('Invite link copied.');
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
      console.error('Could not share invite:', error);
      setStatus('I could not share the invite just now.');
    }
  };

  if (isLoading) {
    return <p className="text-sm font-medium text-gray-light">Preparing your invite...</p>;
  }

  return (
    <div className={compact ? 'space-y-4' : 'space-y-5'}>
      <div className="flex flex-wrap items-center gap-2">
        <MetadataPill tone="green">
          {acceptedCount} {acceptedCount === 1 ? 'person' : 'people'} joined
        </MetadataPill>
        {invite?.lastSharedAt ? <MetadataPill>Shared {new Date(invite.lastSharedAt).toLocaleDateString()}</MetadataPill> : null}
      </div>

      <div className="surface-inline-panel p-4">
        <p className="mb-2 label-caps text-gray-nav">
          Invite link
        </p>
        <p className="break-all font-mono text-sm leading-relaxed text-gray-text">
          {inviteLink || 'Invite link unavailable'}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" size="sm" onClick={handleShare} disabled={!inviteLink} className="min-h-11 w-full sm:w-auto overflow-hidden group relative">
          <span className="relative z-10 flex items-center">
            Invite
            <motion.div
              animate={status === 'Invite shared.' ? { x: 30, y: -30, opacity: 0, scale: 0.5 } : { x: 0, y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <PaperPlaneTilt size={16} weight="bold" className="ml-2" />
            </motion.div>
          </span>
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={handleCopy} disabled={!inviteLink} className="min-h-11 w-full sm:w-auto">
          Copy link
          <CopySimple size={16} weight="bold" className="ml-2" />
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
