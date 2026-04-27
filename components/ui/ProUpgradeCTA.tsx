import React, { useState } from 'react';
import { CheckCircle, Crown, Check } from '@phosphor-icons/react';
import { Button } from './Button';
import { ModalSheet } from './ModalSheet';
import { supabase } from '../../src/supabaseClient';
import { useAuth } from '../../context/AuthContext';

interface ProUpgradeCTAProps {
  onSuccess?: () => void;
  className?: string;
  variant?: 'card' | 'fullscreen';
}

const RAZORPAY_MONTHLY_PLAN_ID = import.meta.env.VITE_RAZORPAY_MONTHLY_PLAN_ID;
const RAZORPAY_YEARLY_PLAN_ID = import.meta.env.VITE_RAZORPAY_YEARLY_PLAN_ID;

export const ProUpgradeCTA: React.FC<ProUpgradeCTAProps> = ({ className = '', variant = 'card' }) => {
  const { session } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  
  // Form State
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [wantsNewsletter, setWantsNewsletter] = useState(false);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const planId = selectedPlan === 'monthly' ? RAZORPAY_MONTHLY_PLAN_ID : RAZORPAY_YEARLY_PLAN_ID;

      if (!planId) {
        throw new Error('Subscription plans are not fully configured yet.');
      }

      // 1. Create Subscription
      const res = await fetch('/api/create-razorpay-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ planId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize subscription');

      // 2. Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        subscription_id: data.subscriptionId,
        name: 'Reflections',
        description: 'Reflections Pro Subscription',
        handler: async function (response: any) {
          try {
            setIsProcessing(true);
            // 3. Verify Payment
            const verifyRes = await fetch('/api/verify-razorpay-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
                newsletterOptIn: wantsNewsletter
              })
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || 'Verification failed');

            // 4. Show Unlock Sequence
            setIsUnlocked(true);
            
            // Reload user profile data to reflect Pro status
            await supabase.auth.refreshSession();
            
            if (onSuccess) {
              setTimeout(() => {
                setIsModalOpen(false);
                onSuccess();
              }, 4000);
            }
          } catch (err: any) {
            setError(err.message || 'Payment verification failed');
            setIsProcessing(false);
          }
        },
        theme: {
          color: '#2A3F33' // green
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setError(response.error.description);
        setIsProcessing(false);
      });
      
      rzp.open();
    } catch (err: any) {
      console.error('Subscription error:', err);
      setError(err.message || 'Please try again later.');
      setIsProcessing(false);
    }
  };

  const features = [
    'Unlimited monthly reflections',
    'More on-demand Life Wiki refreshes',
    'Early access to Pro features',
  ];

  const renderSubscriptionModal = () => (
    <ModalSheet
      isOpen={isModalOpen}
      onClose={() => !isUnlocked && setIsModalOpen(false)}
      title="Join Pro"
      icon={<Crown size={20} weight="duotone" />}
      size="md"
      bodyClassName="p-0"
    >
      <div className="px-6 sm:px-8 pb-6 pt-2 space-y-6">
        {!isUnlocked ? (
          <>
            <div className="relative h-48 w-full overflow-hidden mb-6 bg-[#070b09] rounded-2xl transform-gpu">
              <video
                src="/assets/videos/cycling.mp4"
                autoPlay
                loop
                muted
                playsInline
                style={{ willChange: 'transform' }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedPlan('monthly')}
                className={`flex flex-col items-start p-4 rounded-xl border-2 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-lg ${
                  selectedPlan === 'monthly' ? 'border-green bg-green/5 shadow-md shadow-green/10' : 'border-border bg-white hover:border-green/50 dark:bg-[var(--body-bg)]'
                }`}
              >
                <span className={`text-[12px] font-black uppercase tracking-widest ${selectedPlan === 'monthly' ? 'text-green' : 'text-gray-nav'}`}>Monthly</span>
                <span className="text-2xl font-serif italic text-gray-text mt-1">₹99<span className="text-[14px] not-italic text-gray-light">/mo</span></span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlan('yearly')}
                className={`flex flex-col items-start p-4 rounded-xl border-2 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-lg ${
                  selectedPlan === 'yearly' ? 'border-green bg-green/5 shadow-md shadow-green/10' : 'border-border bg-white hover:border-green/50 dark:bg-[var(--body-bg)]'
                }`}
              >
                <div className="w-full flex justify-between items-center">
                  <span className={`text-[12px] font-black uppercase tracking-widest ${selectedPlan === 'yearly' ? 'text-green' : 'text-gray-nav'}`}>Yearly</span>
                  <span className="text-[10px] font-bold bg-green/10 text-green px-2 py-0.5 rounded-full">SAVE 15%</span>
                </div>
                <span className="text-2xl font-serif italic text-gray-text mt-1">₹999<span className="text-[14px] not-italic text-gray-light">/yr</span></span>
              </button>
            </div>

            <div className="space-y-4">
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
              variant="primary"
              className="w-full h-14 text-[16px] rounded-xl"
              isLoading={isProcessing}
              onClick={handleSubscribe}
            >
              Join Pro
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-700">
            <div className="relative h-48 w-full overflow-hidden mb-8 bg-[#070b09] rounded-3xl opacity-80 mix-blend-luminosity transform-gpu">
              <video
                src="/assets/videos/cycling.mp4"
                autoPlay
                loop
                muted
                playsInline
                style={{ willChange: 'transform' }}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="h-20 w-20 rounded-full bg-green text-white flex items-center justify-center">
                  <CheckCircle size={40} weight="fill" />
                </div>
              </div>
            </div>
            <h3 className="text-3xl font-serif italic text-gray-text mb-3">Your sanctuary is unlocked</h3>
            <p className="text-[15px] font-medium text-gray-light leading-relaxed max-w-[280px]">
              Welcome to Reflections Pro. The journey continues.
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
              Unlock unlimited reflections and deeper insights.
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
            Join Pro
          </Button>

          {renderSubscriptionModal()}
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
            <h3 className="text-2xl font-serif italic text-gray-text">Ready for more?</h3>
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
              Join Pro
            </Button>
          </div>
        </div>
      </div>
      {renderSubscriptionModal()}
    </>
  );
};
