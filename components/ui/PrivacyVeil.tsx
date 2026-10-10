import React from 'react';
import { Fingerprint } from '@phosphor-icons/react/Fingerprint';
import { LockKey } from '@phosphor-icons/react/LockKey';
import { ShieldCheck } from '@phosphor-icons/react/ShieldCheck';
import { CircleNotch } from '@phosphor-icons/react/CircleNotch';
import { Button } from './Button';

export interface PrivacyVeilProps {
  isOpen: boolean;
  requiresBiometric: boolean;
  isAuthenticating?: boolean;
  errorMessage?: string | null;
  onUnlock?: () => void;
}

export const PrivacyVeil: React.FC<PrivacyVeilProps> = ({
  isOpen,
  requiresBiometric,
  isAuthenticating = false,
  errorMessage = null,
  onUnlock,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Journal Sanctuary Privacy Shield"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-body/95 p-6 backdrop-blur-2xl transition-all duration-300 select-none animate-in fade-in"
    >
      <div className="flex max-w-sm flex-col items-center text-center space-y-6">
        {/* Emblem */}
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-green/10 text-green shadow-xl shadow-green/5 ring-1 ring-green/20">
          {requiresBiometric ? (
            <LockKey size={38} weight="duotone" className="animate-pulse" />
          ) : (
            <ShieldCheck size={38} weight="duotone" />
          )}
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-display font-bold text-gray-text">
            {requiresBiometric ? 'Journal Sanctuary Locked' : 'Writing Protected'}
          </h2>
          <p className="text-sm font-medium leading-relaxed text-gray-light">
            {requiresBiometric
              ? 'Scan your fingerprint or face to return to your thoughts.'
              : 'Your reflections are shielded from the multitasking view.'}
          </p>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="rounded-xl bg-clay/10 px-4 py-2 text-xs font-semibold text-clay ring-1 ring-clay/20">
            {errorMessage}
          </div>
        )}

        {/* Action */}
        {requiresBiometric && onUnlock && (
          <div className="pt-2 w-full flex justify-center">
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={onUnlock}
              disabled={isAuthenticating}
            >
              {isAuthenticating ? (
                <span className="flex items-center gap-2">
                  <CircleNotch size={18} className="animate-spin" />
                  <span>Verifying identity...</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Fingerprint size={20} weight="bold" />
                  <span>Unlock with Biometrics</span>
                </span>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
