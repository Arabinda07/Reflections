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
  getTrialChargeDateLabel,
  type BillingPeriod,
} from '../../src/config/pricingCatalog';
import {
  getPaymentErrorMessage,
  getRazorpayThemeColor,
  loadRazorpay,
  readPaymentApiResponse,
  PAYMENT_NOT_CONFIGURED_ERROR,
  PAYMENT_VERIFY_ERROR,
  RAZORPAY_LOAD_ERROR,
  SIGN_IN_AGAIN_ERROR,
  type CreateSubscriptionResponse,
  type VerifyPaymentResponse,
} from './proUpgradePayments';

interface ProUpgradeCTAProps {
  onSuccess?: () => void;
  className?: string;
  variant?: 'card' | 'fullscreen';
}

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

  const openPaywall = () => {
    setIsModalOpen(true);
  };

  const closePaywall = () => {
    if (isUnlocked) return;
    setIsModalOpen(false);
  };

  const selectPlan = (billingPeriod: BillingPeriod) => {
    setSelectedPlan(billingPeriod);
  };

  const handleSubscribe = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error(SIGN_IN_AGAIN_ERROR);
      }
      
      const res = await fetch('/api/create-razorpay-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ billingPeriod: selectedPlan })
      });

      const { data, error: parseError } = await readPaymentApiResponse<CreateSubscriptionResponse & { error?: string }>(
        res,
        '/api/create-razorpay-subscription',
      );
      if (!res.ok || parseError) {
        throw new Error(getPaymentErrorMessage(res, { data, error: parseError }, 'Failed to initialize subscription'));
      }

      if (!data?.subscriptionId) {
        throw new Error(PAYMENT_NOT_CONFIGURED_ERROR);
      }

      const options = {
        key: data.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        subscription_id: data.subscriptionId,
        name: 'Reflections',
        description: `Reflections ${selectedPlanDetails.displayName}`,
        handler: async function (response: any) {
          try {
            setIsProcessing(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
              throw new Error(SIGN_IN_AGAIN_ERROR);
            }
            
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

            const { data: verifyData, error: verifyParseError } = await readPaymentApiResponse<VerifyPaymentResponse & { error?: string }>(
              verifyRes,
              '/api/verify-razorpay-payment',
            );
            if (!verifyRes.ok || verifyParseError) {
              throw new Error(getPaymentErrorMessage(verifyRes, { data: verifyData, error: verifyParseError }, PAYMENT_VERIFY_ERROR));
            }

            setIsUnlocked(true);
            await supabase.auth.refreshSession();
          } catch (err: any) {
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
        throw new Error(RAZORPAY_LOAD_ERROR);
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setError(response?.error?.description || "That payment didn't go through. You haven't been charged — try again.");
        setIsProcessing(false);
      });
      
      rzp.open();
    } catch (err: any) {
      console.error('Subscription error:', err);
      setError(err.message || "Checkout didn't start. You haven't been charged. Try again in a moment.");
      setIsProcessing(false);
    }
  };

  const features = [
    'Unlimited notes',
    'More AI reflections',
    'More Life Wiki refreshes',
  ];

  const renderSubscriptionModal = () => (
    <ModalSheet
      isOpen={isModalOpen}
      onClose={closePaywall}
      title="More room when life gets loud"
      icon={<Crown size={22} weight="duotone" />}
      size="md"
      tone="honey"
      panelClassName="modal-sheet-panel--compact"
      bodyClassName="modal-sheet-body--compact"
    >
      <div className="space-y-4">
        {!isUnlocked ? (
          <>
            <div className="space-y-1.5">
              <p className="text-sm font-medium leading-relaxed text-gray-light">
                Try Pro free. We’ll remind you before billing starts.
              </p>
              <p className="text-xs font-semibold leading-relaxed text-gray-nav sm:text-sm">
                No payment today. First charge {trialChargeDateLabel}: {selectedPlanDetails.displayPrice}/{selectedPlanDetails.intervalLabel}.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {PRO_PRICING_PLAN_LIST.map((plan) => (
                <button
                  key={plan.code}
                  type="button"
                  onClick={() => selectPlan(plan.code)}
                  className={`flex min-h-[6.2rem] flex-col items-start justify-between rounded-[var(--radius-control)] border p-3 text-left transition-colors duration-300 ease-out-expo sm:min-h-28 sm:p-4 ${
                    selectedPlan === plan.code ? 'border-honey bg-honey/5' : 'control-surface hover:border-honey/30'
                  }`}
                >
                  <span className={`label-caps ${selectedPlan === plan.code ? 'text-honey' : 'text-gray-nav'}`}>{plan.shortName}</span>
                  <span className="mt-2 text-xl font-serif italic text-gray-text sm:text-2xl">
                    {plan.displayPrice}
                    <span className="text-sm not-italic text-gray-light">/{plan.intervalLabel}</span>
                  </span>
                  <span className="mt-2 text-xs font-bold leading-snug text-gray-nav">{plan.renewalLabel}</span>
                </button>
              ))}
            </div>

            <ul className="space-y-3 py-3">
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

            <p className="text-xs font-semibold leading-relaxed text-gray-light">
              No surprise charges. No guilt trip. Cancel anytime.
            </p>

            {error && <p className="text-clay text-xs font-bold leading-relaxed sm:text-sm">{error}</p>}

            <Button
              variant="primary"
              className="w-full h-12 text-sm rounded-[var(--radius-control)] !bg-honey !text-white border-none hover:opacity-90 whitespace-nowrap sm:h-14 sm:text-base"
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
            <Button
              variant="primary"
              className="mt-8 h-12 px-8 rounded-[var(--radius-control)] !bg-honey !text-white border-none hover:opacity-90"
              onClick={() => {
                setIsModalOpen(false);
                onSuccess?.();
              }}
            >
              Start writing
            </Button>
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

          <div className="py-5 text-left space-y-4">
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
      <div className={`surface-tone-sage rounded-[var(--radius-panel)] p-5 ${className}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between items-start gap-4">
          <div className="space-y-2 max-w-lg">
            <div className="flex items-center gap-2 text-green">
              <Crown size={18} weight="fill" />
              <span className="label-caps">Reflections Pro</span>
            </div>
            <p className="text-sm font-medium leading-relaxed text-gray-light">
              Unlimited notes and more AI reflections, for the weeks when life is a lot.
            </p>
          </div>

          <Button
            variant="primary"
            className="w-fit h-12 px-6 rounded-[var(--radius-control)] whitespace-nowrap"
            onClick={openPaywall}
          >
            Start my free trial
          </Button>
        </div>
      </div>
      {renderSubscriptionModal()}
    </>
  );
};
