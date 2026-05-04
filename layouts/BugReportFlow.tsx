import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import {
  Bug,
  X,
  PaperPlaneTilt,
  CheckCircle,
} from '@phosphor-icons/react';
import { Button } from '../components/ui/Button';
import { ModalSheet } from '../components/ui/ModalSheet';
import { useAuthStore } from '../hooks/useAuthStore';
import { useHaptics } from '../hooks/useHaptics';
import { useSound } from '../hooks/useSound';
import { registerAndroidBackAction } from '../src/native/androidBack';
import { useEffect } from 'react';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

/**
 * Self-contained bug report flow.
 * Owns its own open/close state, form state, EmailJS submission, and success feedback.
 */
export const BugReportFlow: React.FC = () => {
  const { user } = useAuthStore();
  const haptics = useHaptics();
  const { playSaveChime } = useSound();

  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Android back button dismisses the bug modal
  useEffect(() => {
    if (!isOpen) return;

    return registerAndroidBackAction(() => {
      setIsOpen(false);
      return true;
    });
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const templateParams = {
        from_name: user?.email || 'Guest User',
        message,
        page_url: window.location.href,
        timestamp: new Date().toLocaleString(),
      };

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY,
      );

      setIsSubmitting(false);
      setIsSubmitted(true);
      setMessage('');

      haptics.confirming();
      playSaveChime();

      setTimeout(() => {
        setIsOpen(false);
        setTimeout(() => setIsSubmitted(false), 500);
      }, 2500);
    } catch (error) {
      console.error('Failed to send bug report:', error);
      setIsSubmitting(false);
      setSubmitError(
        "I couldn't send your report just now. Please try again or email us directly.",
      );
    }
  };

  return (
    <>
      {/* Floating Bug Report Button — desktop only */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 left-6 z-[110] hidden h-11 w-11 items-center justify-center rounded-2xl transition duration-300 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/20 group shadow-sm md:flex ${
          isOpen
            ? 'bg-green text-white border-[1.5px] border-green'
            : 'surface-floating hover:text-green'
        }`}
        aria-label={isOpen ? 'Close bug report' : 'Report a bug'}
      >
        {isOpen ? (
          <X size={20} weight="regular" />
        ) : (
          <Bug
            size={20}
            weight="regular"
            className="transition-transform group-hover:rotate-12"
          />
        )}
      </button>

      <ModalSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Report a bug"
        description="Tell us what broke or felt off. Add the page or step if you can."
        icon={<Bug size={20} weight="duotone" />}
        tone="sage"
        size="md"
      >
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="bug-message" className="sr-only">
                Describe the bug
              </label>
              <textarea
                id="bug-message"
                autoFocus
                data-autofocus="true"
                required
                placeholder="Describe what happened..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full min-h-[160px] resize-none rounded-[20px] border border-border/40 bg-body/50 p-5 font-serif text-[17px] leading-relaxed text-gray-text transition-colors placeholder:text-gray-nav/50 focus:border-green/30 focus:outline-none focus:ring-2 focus:ring-green/10"
              />
              {submitError && (
                <p className="text-[12px] font-bold text-clay animate-in fade-in slide-in-from-top-1">
                  {submitError}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={!message.trim()}
              className="h-11 w-full rounded-xl"
            >
              Send report
              <PaperPlaneTilt size={16} weight="regular" className="ml-2" />
            </Button>
          </form>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center animate-in fade-in zoom-in duration-500">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green/10 text-green">
              <CheckCircle size={36} weight="fill" />
            </div>
            <h3 className="label-caps mb-2">Thank you</h3>
            <p className="font-serif text-[16px] italic leading-relaxed text-gray-light">
              We've received your report. <br /> Your feedback helps a lot.
            </p>
          </div>
        )}
      </ModalSheet>
    </>
  );
};
