import React, { useState } from 'react';
import { CheckCircle, ShieldCheck, Lightning } from '@phosphor-icons/react';
import { Button } from './Button';
import { supabase } from '../../src/supabaseClient';

interface ProUpgradeCTAProps {
  onSuccess?: () => void;
  className?: string;
  variant?: 'card' | 'fullscreen';
}

export const ProUpgradeCTA: React.FC<ProUpgradeCTAProps> = ({ onSuccess, className = '', variant = 'card' }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // MOCK RAZORPAY INTEGRATION
      // In a real scenario, this would call a backend to generate an order_id
      // and then open the Razorpay checkout script.
      // For now, we simulate a successful payment after a short delay.
      await new Promise(resolve => setTimeout(resolve, 1500));

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update plan to pro in Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ plan: 'pro' })
        .eq('id', user.id);

      if (updateError) throw updateError;

      if (onSuccess) onSuccess();
      
      // Reload page to reflect changes globally if no onSuccess handler provided
      if (!onSuccess) {
        window.location.reload();
      }

    } catch (err: any) {
      console.error("Upgrade failed:", err);
      setError(err.message || "Failed to process upgrade. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const features = [
    "Unlimited monthly reflections",
    "Infinite AI Wiki generation",
    "Priority support & features",
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
              You've reached your monthly limit of 30 reflections. Upgrade to continue writing without limits and unlock the full potential of your Life Wiki.
            </p>
          </div>

          <div className="bg-panel-bg border border-border/40 rounded-3xl p-6 text-left space-y-4">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
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
            Upgrade to Pro — ₹999/yr
          </Button>

          <p className="text-[12px] font-medium text-gray-nav flex items-center justify-center gap-1.5 opacity-60">
            <ShieldCheck size={14} /> Secured by Razorpay (Test Mode)
          </p>
        </div>
      </div>
    );
  }

  // Card Variant
  return (
    <div className={`surface-floating p-6 md:p-8 rounded-[24px] border border-green/20 relative overflow-hidden group ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-green/10 to-transparent opacity-50 pointer-events-none" />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4 max-w-sm">
          <div className="flex items-center gap-2 text-green">
            <Lightning size={20} weight="fill" />
            <span className="text-[11px] font-black uppercase tracking-widest">Reflections Pro</span>
          </div>
          <h3 className="text-2xl font-serif italic text-gray-text">Write without limits.</h3>
          <ul className="space-y-2">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-[13px] text-gray-light">
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
            Upgrade Now
          </Button>
          <p className="text-[10px] font-medium text-gray-nav/60 uppercase tracking-widest text-center md:text-right">
            ₹999/year • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
};
