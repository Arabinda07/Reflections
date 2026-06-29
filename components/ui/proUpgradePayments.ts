// Pure payment plumbing for the Pro upgrade flow: Razorpay script loading,
// API response parsing, and error mapping. Kept out of the view component so the
// checkout behavior stays small, focused, and unit-testable on its own.

export interface PaymentApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface CreateSubscriptionResponse {
  keyId?: string;
  subscriptionId?: string;
}

export interface VerifyPaymentResponse {
  ok?: boolean;
  message?: string;
}

export const PAYMENT_SETUP_ERROR = 'Payment setup failed. Check the server logs for this request.';
export const PAYMENT_NOT_CONFIGURED_ERROR = 'Payment setup is not configured yet.';
export const PAYMENT_VERIFY_ERROR = 'Payment went through, but we could not verify it yet. Contact support with the payment ID.';
export const SIGN_IN_AGAIN_ERROR = 'Please sign in again before starting payment.';
export const RAZORPAY_LOAD_ERROR = 'Could not load Razorpay. Check your connection and try again.';
const RESPONSE_PREVIEW_LIMIT = 180;

export const readPaymentApiResponse = async <T,>(
  response: Response,
  endpoint: string,
): Promise<PaymentApiResponse<T>> => {
  const text = await response.text();
  const preview = text.slice(0, RESPONSE_PREVIEW_LIMIT);

  if (!text.trim()) {
    if (!response.ok) {
      console.error('[payments] Empty API response', {
        endpoint,
        status: response.status,
      });
    }

    return { data: null, error: null };
  }

  try {
    return { data: JSON.parse(text) as T, error: null };
  } catch (error) {
    console.error('[payments] Non-JSON API response', {
      endpoint,
      status: response.status,
      preview,
      error,
    });

    return { data: null, error: PAYMENT_SETUP_ERROR };
  }
};

export const getPaymentErrorMessage = (
  response: Response,
  parsed: PaymentApiResponse<{ error?: string | null }>,
  fallback: string,
) => {
  const serverError = parsed.data?.error || parsed.error;

  if (serverError === 'Razorpay plan is not configured' || serverError === 'Razorpay keys are missing in environment variables') {
    return PAYMENT_NOT_CONFIGURED_ERROR;
  }

  if (response.status === 401) {
    return SIGN_IN_AGAIN_ERROR;
  }

  return serverError || fallback;
};

export const getRazorpayThemeColor = () => {
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

export const loadRazorpay = () => {
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
