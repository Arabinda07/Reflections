import React, { useState } from 'react';
import { CheckCircle, ShieldCheck, Lightning } from '@phosphor-icons/react';
import { Button } from './Button';

interface ProUpgradeCTAProps {
  onSuccess?: () => void;
  className?: string;
  variant?: 'card' | 'fullscreen';
}

const SUPPORT_EMAIL = 'robinsaha434@gmail.com';

export const ProUpgradeCTA: React.FC<ProUpgradeCTAProps> = ({ className = '', variant = 'card' }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = () => {
    setIsProcessing(true);
    setError(null);

    try {
      const subject = 'Reflections Pro waitlist';
      const body = 'Hi, I would like to be notified when Reflections Pro and Razorpay checkout are ready.';
      window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } catch (err) {
      console.error('Could not open Pro waitlist draft:', err);
      setError('Please email support to join the Pro waitlist.');
    } finally {
      window.setTimeout(() => setIsProcessing(false), 300);
    }
  };

  const features = [
    'Unlimited monthly reflections',
    'More on-demand Life Wiki refreshes',
    'Early access to Pro features',
  ];

  if (variant === 'fullscreen') {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-body p-6 ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-green/5 to-transparent pointer-events-none" />
        <div className="max-w-md w-full relative z-10 text-center space-y-8">
          <div className="mx-auto w-20 h-20 bg-green/10 text-green rounded-full flex items-center justify-center mb-6">
            <Lightning size={40} weight="duotone" />
          </div>
          <div>
            <h2 className="text-4xl font-serif italic text-gray-text mb-4">Reflections Pro</h2>
            <p className="text-[16px] text-gray-light leading-relaxed">
              Pro checkout is not live yet. Join the waitlist and we will let you know when Razorpay checkout is ready.
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

          {error && <p className="text-red text-sm font-bold">{error}</p>}

          <Button
            variant="primary"
            className="w-full h-14 text-[16px] rounded-xl"
            isLoading={isProcessing}
            onClick={handleUpgrade}
          >
            Join the Pro waitlist
          </Button>

          <p className="text-[12px] font-medium text-gray-nav flex items-center justify-center gap-1.5 opacity-60">
            <ShieldCheck size={14} /> Razorpay checkout is coming soon
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`surface-floating p-6 md:p-8 rounded-[24px] border border-green/20 relative overflow-hidden group ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-green/10 to-transparent opacity-50 pointer-events-none" />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4 max-w-sm">
          <div className="flex items-center gap-2 text-green">
            <Lightning size={20} weight="fill" />
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
          {error && <p className="text-red text-[11px] font-bold mb-2">{error}</p>}
          <Button
            variant="primary"
            className="w-full md:w-auto h-12 px-6 rounded-xl"
            isLoading={isProcessing}
            onClick={handleUpgrade}
          >
            Join the Pro waitlist
          </Button>
          <p className="text-[10px] font-medium text-gray-nav/60 uppercase tracking-widest text-center md:text-right">
            Razorpay checkout is coming soon
          </p>
        </div>
      </div>
    </div>
  );
};
