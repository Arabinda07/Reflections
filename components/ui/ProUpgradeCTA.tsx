import React, { useState } from 'react';
import { CheckCircle, Crown, Check } from '@phosphor-icons/react';
import emailjs from '@emailjs/browser';
import { Button } from './Button';
import { ModalSheet } from './ModalSheet';

interface ProUpgradeCTAProps {
  onSuccess?: () => void;
  className?: string;
  variant?: 'card' | 'fullscreen';
}

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY; 

export const ProUpgradeCTA: React.FC<ProUpgradeCTAProps> = ({ className = '', variant = 'card' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [hasConsent, setHasConsent] = useState(false);
  const [wantsNewsletter, setWantsNewsletter] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!hasConsent || !email) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      const templateParams = {
        from_name: email,
        message: `Waitlist request. Consent: true. Newsletter: ${wantsNewsletter}`,
        page_url: window.location.href,
        timestamp: new Date().toLocaleString(),
      };

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );
      
      setIsSubmitted(true);
      if (onSuccess) onSuccess();
      
      setTimeout(() => {
        setIsModalOpen(false);
        setTimeout(() => {
          setIsSubmitted(false);
          setEmail('');
          setHasConsent(false);
          setWantsNewsletter(false);
        }, 500);
      }, 2500);
    } catch (err) {
      console.error('Could not submit waitlist request:', err);
      setError('Please try again or email support to join.');
    } finally {
      setIsProcessing(false);
    }
  };

  const features = [
    'Unlimited monthly reflections',
    'More on-demand Life Wiki refreshes',
    'Early access to Pro features',
  ];

  const WaitlistModal = () => (
    <ModalSheet
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      title="Join the Waitlist"
      icon={<Crown size={20} weight="duotone" />}
      size="md"
      bodyClassName="p-0"
    >
      <div className="relative h-48 w-full overflow-hidden mb-6 bg-black">
        <video
          src="/assets/videos/cycling.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--panel-bg)] to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-md">
            <Crown size={28} weight="fill" />
          </div>
          <div>
            <h3 className="font-serif italic text-2xl text-white">Reflections Pro</h3>
            <p className="text-[13px] font-bold uppercase tracking-widest text-white/70">Coming Soon</p>
          </div>
        </div>
      </div>
      
      <div className="px-6 sm:px-8 pb-8 space-y-6">
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="waitlist-email" className="block text-[11px] font-extrabold uppercase tracking-widest text-gray-nav">Email address</label>
              <input
                id="waitlist-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-12 rounded-[var(--radius-control)] border border-border bg-white px-4 text-[15px] font-medium text-gray-text shadow-sm transition-all focus:border-green focus:outline-none focus:ring-4 focus:ring-green/10 dark:bg-[var(--body-bg)]"
              />
            </div>

            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border bg-white transition-colors group-hover:border-green dark:bg-white/5 mt-0.5">
                  <input
                    type="checkbox"
                    checked={hasConsent}
                    onChange={(e) => setHasConsent(e.target.checked)}
                    className="peer absolute h-full w-full cursor-pointer opacity-0"
                  />
                  <div className="pointer-events-none opacity-0 transition-opacity peer-checked:opacity-100 text-green">
                    <Check size={14} weight="bold" />
                  </div>
                </div>
                <span className="text-[14px] font-medium leading-relaxed text-gray-light">
                  I consent to joining the Reflections Pro waitlist and being contacted when it is ready.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border bg-white transition-colors group-hover:border-green dark:bg-white/5 mt-0.5">
                  <input
                    type="checkbox"
                    checked={wantsNewsletter}
                    onChange={(e) => setWantsNewsletter(e.target.checked)}
                    className="peer absolute h-full w-full cursor-pointer opacity-0"
                  />
                  <div className="pointer-events-none opacity-0 transition-opacity peer-checked:opacity-100 text-green">
                    <Check size={14} weight="bold" />
                  </div>
                </div>
                <span className="text-[14px] font-medium leading-relaxed text-gray-light">
                  Sign up for the newsletter regarding journaling ideas and updates.
                </span>
              </label>
            </div>

            {error && <p className="text-red text-[13px] font-bold">{error}</p>}

            <Button
              type="submit"
              variant="primary"
              className="w-full h-14 text-[16px] rounded-xl"
              isLoading={isProcessing}
              disabled={!hasConsent || !email}
            >
              Join the waitlist
            </Button>
          </form>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="h-20 w-20 rounded-full bg-green/10 text-green flex items-center justify-center mb-6">
              <CheckCircle size={40} weight="fill" />
            </div>
            <h3 className="text-3xl font-serif italic text-gray-text mb-3">You're on the list</h3>
            <p className="text-[15px] font-medium text-gray-light leading-relaxed max-w-[250px]">
              We'll let you know the moment Reflections Pro is ready for you.
            </p>
          </div>
        )}
      </div>
    </ModalSheet>
  );

  if (variant === 'fullscreen') {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-body p-6 ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-green/5 to-transparent pointer-events-none" />
        <div className="max-w-md w-full relative z-10 text-center space-y-8">
          <div className="mx-auto w-20 h-20 bg-green/10 text-green rounded-full flex items-center justify-center mb-6">
            <Crown size={40} weight="duotone" />
          </div>
          <div>
            <h2 className="text-4xl font-serif italic text-gray-text mb-4">Reflections Pro</h2>
            <p className="text-[16px] text-gray-light leading-relaxed">
              Pro is not live yet. Join the waitlist and we will let you know when it is ready.
            </p>
          </div>

          <div className="bg-panel-bg border border-border/40 rounded-3xl p-6 text-left space-y-4">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <CheckCircle size={20} weight="fill" className="text-green" />
                <span className="text-[14px] font-bold text-gray-text">{feature}</span>
              </div>
            ))}
          </div>

          <Button
            variant="primary"
            className="w-full h-14 text-[16px] rounded-xl"
            onClick={() => setIsModalOpen(true)}
          >
            Join the waitlist
          </Button>

          <WaitlistModal />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`surface-floating p-6 md:p-8 rounded-[24px] border border-green/20 relative overflow-hidden group ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-green/10 to-transparent opacity-50 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4 max-w-sm">
            <div className="flex items-center gap-2 text-green">
              <Crown size={20} weight="fill" />
              <span className="text-[11px] font-black uppercase tracking-widest">Reflections Pro</span>
            </div>
            <h3 className="text-2xl font-serif italic text-gray-text">Pro is almost ready.</h3>
            <ul className="space-y-2">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-[13px] text-gray-light">
                  <CheckCircle size={14} className="text-green" /> {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2 md:items-end">
            <Button
              variant="primary"
              className="w-full md:w-auto h-12 px-6 rounded-xl"
              onClick={() => setIsModalOpen(true)}
            >
              Join the waitlist
            </Button>
          </div>
        </div>
      </div>
      <WaitlistModal />
    </>
  );
};

