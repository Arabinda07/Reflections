import React, { useMemo, useState } from 'react';
import { Check } from '@phosphor-icons/react/Check';
import { CheckCircle } from '@phosphor-icons/react/CheckCircle';
import { Crown } from '@phosphor-icons/react/Crown';
import { Button } from './Button';
import { ModalSheet } from './ModalSheet';
import { supabase } from '../../src/supabaseClient';
import { useAuthStore } from '../../hooks/useAuthStore';
import { NEWSLETTER_SIGNUP_LABEL } from '../../src/newsletter';
import {
  DEFAULT_PRO_PLAN,
  PRO_PRICING_PLAN_LIST,
  PRO_PRICING_PLANS,
  PRO_TRIAL_DAYS,
  getTrialChargeDateLabel,
  type BillingPeriod,
} from '../../src/config/pricingCatalog';
import {
  trackCheckoutFailedDeferred,
  trackModalDismissedDeferred,
  trackPaywallViewedDeferred,
  trackPlanSelectedDeferred,
  trackTrialStartedDeferred,
} from '../../src/analytics/deferredEvents';

interface ProUpgradeCTAProps {
  onSuccess?: () => void;
  className?: string;
  variant?: 'card' | 'fullscreen';
}

const getRazorpayThemeColor = () => {
  if (typeof document === 'undefined' || !document.body) {
    return 'var(--honey)';
  }

  const probe = document.createElement('span');
  probe.style.color = 'var(--honey)';
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  document.body.appendChild(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();

  return color || 'var(--honey)';
};

export const ProUpgradeCTA: React.FC<ProUpgradeCTAProps> = ({ onSuccess, className = '', variant = 'card' }) => {
  useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<BillingPeriod>(DEFAULT_PRO_PLAN);
  const [wantsNewsletter, setWantsNewsletter] = useState(false);
  const trialChargeDateLabel = useMemo(() => getTrialChargeDateLabel(), []);
  const selectedPlanDetails = PRO_PRICING_PLANS[selectedPlan];

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

  const openPaywall = () => {
    setIsModalOpen(true);
    trackPaywallViewedDeferred({ surface: variant, defaultPlan: DEFAULT_PRO_PLAN });
  };

  const closePaywall = () => {
    if (isUnlocked) return;
    setIsModalOpen(false);
    trackModalDismissedDeferred({ modalId: 'pro_upgrade', surface: variant });
  };

  const selectPlan = (billingPeriod: BillingPeriod) => {
    setSelectedPlan(billingPeriod);
    trackPlanSelectedDeferred({ surface: variant, billingPeriod });
  };

  const handleSubscribe = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const res = await fetch('/api/create-razorpay-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ billingPeriod: selectedPlan })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize subscription');

      const options = {
        key: data.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        subscription_id: data.subscriptionId,
        name: 'Reflections',
        description: `Reflections ${selectedPlanDetails.displayName}`,
        handler: async function (response: any) {
          try {
            setIsProcessing(true);
            const { data: { session } } = await supabase.auth.getSession();
            
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

            trackTrialStartedDeferred({ billingPeriod: selectedPlan, trialDays: PRO_TRIAL_DAYS });
            setIsUnlocked(true);
            await supabase.auth.refreshSession();
            
            if (onSuccess) {
              setTimeout(() => {
                setIsModalOpen(false);
                onSuccess();
              }, 4000);
            }
          } catch (err: any) {
            trackCheckoutFailedDeferred({ billingPeriod: selectedPlan, errorCode: err.message });
            setError(err.message || 'Payment verification failed');
            setIsProcessing(false);
          }
        },
        theme: {
          color: getRazorpayThemeColor()
        }
      };

      const razorpayLoaded = await loadRazorpay();
      if (!razorpayLoaded) {
        throw new Error('Could not load Razorpay checkout. Please try again.');
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        trackCheckoutFailedDeferred({
          billingPeriod: selectedPlan,
          errorCode: response?.error?.code || response?.error?.description,
        });
        setError(response.error.description);
        setIsProcessing(false);
      });
      
      rzp.open();
    } catch (err: any) {
      console.error('Subscription error:', err);
      trackCheckoutFailedDeferred({ billingPeriod: selectedPlan, errorCode: err.message });
      setError(err.message || 'Please try again later.');
      setIsProcessing(false);
    }
  };

  const features = [
    'Unlimited writing after the free room fills',
    'On-demand AI reflections when your brain is doing laps',
    'More Life Wiki refreshes for messy weeks',
  ];

  const renderSubscriptionModal = () => (
    <ModalSheet
      isOpen={isModalOpen}
      onClose={closePaywall}
      title="More room when life gets loud"
      icon={<Crown size={20} weight="duotone" />}
      size="md"
      tone="honey"
      bodyClassName="px-6 pb-6 pt-2 sm:px-8"
    >
      <div className="space-y-6">
        {!isUnlocked ? (
          <>
            <div className="space-y-2">
              <p className="text-base font-medium leading-relaxed text-gray-light">
                Try Pro free. We’ll tell you before billing starts.
              </p>
              <p className="text-sm font-semibold leading-relaxed text-gray-nav">
                No payment today. First charge {trialChargeDateLabel}: {selectedPlanDetails.displayPrice}/{selectedPlanDetails.intervalLabel}.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {PRO_PRICING_PLAN_LIST.map((plan) => (
                <button
                  key={plan.code}
                  type="button"
                  onClick={() => selectPlan(plan.code)}
                  className={`flex min-h-32 flex-col items-start justify-between rounded-[var(--radius-control)] border p-4 text-left transition-colors duration-300 ease-out-expo ${
                    selectedPlan === plan.code ? 'border-honey bg-honey/5' : 'control-surface hover:border-honey/30'
                  }`}
                >
                  <span className={`label-caps ${selectedPlan === plan.code ? 'text-honey' : 'text-gray-nav'}`}>{plan.shortName}</span>
                  <span className="mt-3 text-2xl font-serif italic text-gray-text">
                    {plan.displayPrice}
                    <span className="text-sm not-italic text-gray-light">/{plan.intervalLabel}</span>
                  </span>
                  <span className="mt-2 text-xs font-bold leading-snug text-gray-nav">{plan.renewalLabel}</span>
                </button>
              ))}
            </div>

            <ul className="space-y-2 border-y border-border/50 py-4">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-sm font-semibold text-gray-text">
                  <CheckCircle size={16} weight="fill" className="text-honey" />
                  {feature}
                </li>
              ))}
            </ul>

            <div>
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="control-surface relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors group-hover:border-honey">
                  <input
                    type="checkbox"
                    checked={wantsNewsletter}
                    onChange={(e) => setWantsNewsletter(e.target.checked)}
                    className="peer absolute h-full w-full cursor-pointer opacity-0"
                  />
                  <div className="pointer-events-none text-honey opacity-0 transition-opacity peer-checked:opacity-100">
                    <Check size={14} weight="bold" />
                  </div>
                </div>
                <span className="text-sm font-medium leading-relaxed text-gray-light">
                  {NEWSLETTER_SIGNUP_LABEL}
                </span>
              </label>
            </div>

            <div className="rounded-[var(--radius-control)] border border-honey/20 bg-honey/5 p-3 text-xs font-semibold leading-relaxed text-gray-light">
              No surprise charges. No guilt trip. Cancel anytime. Free keeps your saved writing, mood history, and monthly note room.
            </div>

            {error && <p className="text-clay text-sm font-bold">{error}</p>}

            <Button
              variant="primary"
              className="w-full h-14 text-base rounded-[var(--radius-control)] !bg-honey !text-white border-none hover:opacity-90 whitespace-nowrap"
              isLoading={isProcessing}
              onClick={handleSubscribe}
            >
              {selectedPlanDetails.ctaLabel}
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-700">
            <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-[var(--radius-panel)] bg-honey text-white">
              <CheckCircle size={40} weight="fill" />
            </div>
            <h3 className="text-3xl font-display font-extrabold text-gray-text mb-3">Your trial has started</h3>
            <p className="text-base font-medium text-gray-light leading-relaxed max-w-[280px]">
              Pro access activates as soon as Razorpay confirms the subscription. First charge is scheduled for {trialChargeDateLabel}.
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
            <h2 className="text-4xl font-display font-extrabold text-gray-text mb-4">More room when life gets loud</h2>
            <p className="text-base text-gray-light leading-relaxed">
              You’ve filled this month’s free writing room. Everything you wrote is still here.
            </p>
          </div>

          <div className="border-y border-border/50 py-5 text-left space-y-4">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <CheckCircle size={20} weight="fill" className="text-honey" />
                <span className="text-sm font-bold text-gray-text">{feature}</span>
              </div>
            ))}
          </div>

          <Button
            variant="primary"
            className="w-full h-14 text-base rounded-[var(--radius-control)] !bg-honey !text-white border-none hover:opacity-90 whitespace-nowrap"
            onClick={openPaywall}
          >
            Start my free trial
          </Button>

          {renderSubscriptionModal()}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`border-t border-border/50 pt-6 surface-tone-honey ${className}`}>
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-honey">
              <Crown size={18} weight="fill" />
              <span className="label-caps">Reflections Pro</span>
            </div>
            <p className="text-sm font-medium leading-relaxed text-gray-light">
              More space for the weeks when life is a lot.
            </p>
          </div>

          <div className="flex flex-col gap-2 md:items-end">
            <Button
              variant="primary"
              className="w-full md:w-auto h-12 px-6 rounded-[var(--radius-control)] !bg-honey !text-white border-none hover:opacity-90 whitespace-nowrap"
              onClick={openPaywall}
            >
              Start my free trial
            </Button>
          </div>
        </div>
      </div>
      {renderSubscriptionModal()}
    </>
  );
};
