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

export const ProUpgradeCTA: React.FC<ProUpgradeCTAProps> = ({ onSuccess, className = '', variant = 'card' }) => {
  useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [wantsNewsletter, setWantsNewsletter] = useState(false);

  const loadRazorpay = () => {
    return new Promise<boolean>((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }

      const existingScript = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout="true"]');
      if (existingScript) {
        if (existingScript.dataset.razorpayFailed === 'true') {
          existingScript.remove();
        } else {
          existingScript.addEventListener('load', () => resolve(true), { once: true });
          existingScript.addEventListener('error', () => resolve(false), { once: true });
          return;
        }
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.dataset.razorpayCheckout = 'true';
      script.onload = () => resolve(true);
      script.onerror = () => {
        script.dataset.razorpayFailed = 'true';
        script.remove();
        resolve(false);
      };
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

      const { data: { session } } = await supabase.auth.getSession();
      
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
            const { data: { session } } = await supabase.auth.getSession();
            
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
          color: '#936F1F' // honey
        }
      };

      const razorpayLoaded = await loadRazorpay();
      if (!razorpayLoaded) {
        throw new Error('Could not load Razorpay checkout. Please try again.');
      }

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
      tone="honey"
      bodyClassName="px-6 pb-6 pt-2 sm:px-8"
    >
      <div className="space-y-6">
        {!isUnlocked ? (
          <>
            <div className="space-y-2">
              <p className="text-[15px] font-medium leading-relaxed text-gray-light">
                Keep writing unlimited. Add more on-demand reflections and Life Wiki refreshes when you need them.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedPlan('monthly')}
                className={`flex flex-col items-start rounded-[var(--radius-control)] border p-4 text-left transition-colors duration-300 ease-out-expo ${
                  selectedPlan === 'monthly' ? 'border-honey bg-honey/5' : 'control-surface hover:border-honey/30'
                }`}
              >
                <span className={`text-[12px] font-black uppercase tracking-widest ${selectedPlan === 'monthly' ? 'text-honey' : 'text-gray-nav'}`}>Monthly</span>
                <span className="text-2xl font-serif italic text-gray-text mt-1">₹99<span className="text-[14px] not-italic text-gray-light">/mo</span></span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlan('yearly')}
                className={`flex flex-col items-start rounded-[var(--radius-control)] border p-4 text-left transition-colors duration-300 ease-out-expo ${
                  selectedPlan === 'yearly' ? 'border-honey bg-honey/5' : 'control-surface hover:border-honey/30'
                }`}
              >
                <div className="flex w-full items-center justify-between gap-3">
                  <span className={`text-[12px] font-black uppercase tracking-widest ${selectedPlan === 'yearly' ? 'text-honey' : 'text-gray-nav'}`}>Yearly</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-honey">Save 15%</span>
                </div>
                <span className="text-2xl font-serif italic text-gray-text mt-1">₹999<span className="text-[14px] not-italic text-gray-light">/yr</span></span>
              </button>
            </div>

            <ul className="space-y-2 border-y border-border/50 py-4">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-[14px] font-semibold text-gray-text">
                  <CheckCircle size={16} weight="fill" className="text-honey" />
                  {feature}
                </li>
              ))}
            </ul>

            <div>
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="control-surface relative flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors group-hover:border-honey mt-0.5">
                  <input
                    type="checkbox"
                    checked={wantsNewsletter}
                    onChange={(e) => setWantsNewsletter(e.target.checked)}
                    className="peer absolute h-full w-full cursor-pointer opacity-0"
                  />
                  <div className="pointer-events-none opacity-0 transition-opacity peer-checked:opacity-100 text-honey">
                    <Check size={14} weight="bold" />
                  </div>
                </div>
                <span className="text-[14px] font-medium leading-relaxed text-gray-light">
                  Send me occasional journaling ideas and product updates.
                </span>
              </label>
            </div>

            {error && <p className="text-clay text-[13px] font-bold">{error}</p>}

            <Button
              variant="secondary"
              className="w-full h-14 text-[16px] rounded-xl !border-honey !bg-honey !text-white hover:!border-honey hover:!bg-honey/90"
              isLoading={isProcessing}
              onClick={handleSubscribe}
            >
              Join Pro
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-700">
            <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-[var(--radius-panel)] bg-honey text-white">
              <CheckCircle size={40} weight="fill" />
            </div>
            <h3 className="text-3xl font-display font-extrabold text-gray-text mb-3">Welcome to Pro</h3>
            <p className="text-[15px] font-medium text-gray-light leading-relaxed max-w-[280px]">
              Writing stays unlimited. You can refresh your Life Wiki whenever you ask.
            </p>
          </div>
        )}
      </div>
    </ModalSheet>
  );

  if (variant === 'fullscreen') {
    return (
      <div className={`surface-scope-honey fixed inset-0 z-50 flex items-center justify-center bg-body p-6 ${className}`}>
        <div className="max-w-md w-full relative z-10 text-center space-y-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[var(--radius-panel)] border border-honey/15 bg-honey/5 text-honey">
            <Crown size={40} weight="duotone" />
          </div>
          <div>
            <h2 className="text-4xl font-display font-extrabold text-gray-text mb-4">Reflections Pro</h2>
            <p className="text-[16px] text-gray-light leading-relaxed">
              Unlimited writing and on-demand Life Wiki refreshes.
            </p>
          </div>

          <div className="border-y border-border/50 py-5 text-left space-y-4">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <CheckCircle size={20} weight="fill" className="text-honey" />
                <span className="text-[14px] font-bold text-gray-text">{feature}</span>
              </div>
            ))}
          </div>

          <Button
            variant="primary"
            className="w-full h-14 text-[16px] rounded-xl"
            style={{ backgroundColor: 'var(--honey)', borderColor: 'var(--honey)', color: '#fff' }}
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
      <div className={`border-t border-border/50 pt-6 ${className}`}>
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-honey">
              <Crown size={18} weight="fill" />
              <span className="text-[11px] font-black uppercase tracking-widest">Reflections Pro</span>
            </div>
            <p className="text-[14px] font-medium leading-relaxed text-gray-light">
              More on-demand reflections, Life Wiki refreshes, and early Pro features.
            </p>
          </div>

          <Button
            variant="primary"
            className="w-full md:w-auto h-12 px-8 rounded-xl shrink-0"
            style={{ backgroundColor: 'var(--honey)', borderColor: 'var(--honey)', color: '#fff' }}
            onClick={() => setIsModalOpen(true)}
          >
            Join Pro
          </Button>
        </div>
      </div>
      {renderSubscriptionModal()}
    </>
  );
};
