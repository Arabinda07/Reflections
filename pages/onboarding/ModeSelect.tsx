import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkle } from '@phosphor-icons/react/Sparkle';
import { LockKey } from '@phosphor-icons/react/LockKey';
import { Info } from '@phosphor-icons/react/Info';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { supabase } from '@/src/supabaseClient';
import { RoutePath } from '@/types';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { setCurrentUserMode } from '@/services/userModeStore';

type ModeChoice = 'reflective' | 'encrypted';

const MODE_ORDER: ModeChoice[] = ['reflective', 'encrypted'];

export const ModeSelect: React.FC = () => {
  useDocumentMeta({
    title: 'Choose your sanctuary - Reflections',
    description: 'Select how you want your data to be stored.',
    path: RoutePath.ONBOARDING_MODE_SELECT,
  });

  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [mode, setMode] = useState<ModeChoice>('reflective');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const optionRefs = useRef<Partial<Record<ModeChoice, HTMLButtonElement | null>>>({});

  const handleRadioKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const { key } = event;
    if (key !== 'ArrowRight' && key !== 'ArrowDown' && key !== 'ArrowLeft' && key !== 'ArrowUp') {
      return;
    }
    event.preventDefault();
    const currentIndex = MODE_ORDER.indexOf(mode);
    const delta = key === 'ArrowRight' || key === 'ArrowDown' ? 1 : -1;
    const nextIndex = (currentIndex + delta + MODE_ORDER.length) % MODE_ORDER.length;
    const nextMode = MODE_ORDER[nextIndex];
    setMode(nextMode);
    optionRefs.current[nextMode]?.focus();
  };

  // Redirect already-onboarded users away from this page.
  // The RPC enforces this at the database level too, but this prevents showing
  // a confusing UI to users who manually navigate here after onboarding.
  useEffect(() => {
    if (!user?.id) return;
    let isActive = true;

    const checkOnboarded = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('onboarding_completed_at')
        .eq('id', user.id)
        .maybeSingle();

      if (isActive && data?.onboarding_completed_at) {
        navigate(RoutePath.DASHBOARD, { replace: true });
      }
    };

    checkOnboarded();
    return () => { isActive = false; };
  }, [user?.id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      const { error: rpcError } = await supabase.rpc('set_user_mode', { mode });
      if (rpcError) throw rpcError;

      // Eagerly update the module-level store so storage-layer code has the
      // correct mode immediately when the AuthenticatedAppShell mounts.
      // UserModeContext will also fetch it from the DB on mount.
      setCurrentUserMode(mode);

      // Navigate to the authenticated dashboard, which mounts PrivateDataGate /
      // CryptoProvider so encrypted users hit the setup flow. RoutePath.HOME is
      // the public marketing page and would be an unnecessary detour.
      navigate(RoutePath.DASHBOARD, { replace: true });
    } catch (err) {
      console.error('Failed to set mode:', err);
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message: unknown }).message)
            : '';
      if (message.includes('already been set')) {
        // Already onboarded (or race with a prior submit). Prefer reading the
        // granted user_mode column so we leave with the correct store value
        // even if onboarding_completed_at is temporarily unreadable.
        const { data } = await supabase
          .from('profiles')
          .select('user_mode')
          .eq('id', user.id)
          .maybeSingle();
        const resolvedMode = data?.user_mode === 'encrypted' || data?.user_mode === 'reflective'
          ? data.user_mode
          : mode;
        setCurrentUserMode(resolvedMode);
        navigate(RoutePath.DASHBOARD, { replace: true });
        return;
      }
      setError('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="surface-scope-paper page-wash flex flex-1 items-center justify-center bg-body p-6 transition-colors duration-300 min-h-screen">
      <div className="w-full max-w-[600px]">
        <Surface variant="bezel">
          <div className="p-8 sm:p-10 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green/10 text-green">
                <Sparkle size={24} weight="duotone" />
              </div>
              <h1 className="text-2xl font-black text-primary">How do you want to reflect?</h1>
              <p className="text-base font-semibold leading-relaxed text-gray-text">
                Choose how you want to save your notes. You cannot change this later.
              </p>
            </div>

            {error && (
              <Alert
                variant="error"
                icon={<Info size={20} weight="fill" />}
                title="Could not save choice"
                description={error}
              />
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div
                role="radiogroup"
                aria-label="How you want to save your notes"
                className="grid gap-4 sm:grid-cols-2"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={mode === 'reflective'}
                  tabIndex={mode === 'reflective' ? 0 : -1}
                  ref={(el) => { optionRefs.current.reflective = el; }}
                  onClick={() => setMode('reflective')}
                  onKeyDown={handleRadioKeyDown}
                  className={`rounded-xl border p-5 text-left transition relative flex flex-col items-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2 ${
                    mode === 'reflective'
                      ? 'border-green bg-green/5 text-primary'
                      : 'border-border bg-surface text-gray-text hover:border-green/30'
                  }`}
                >
                  <Sparkle size={24} weight="duotone" className={mode === 'reflective' ? 'text-green' : 'text-gray-nav'} />
                  <span className="mt-3 block text-base font-bold text-primary">Reflective Sanctuary</span>
                  <span className="mt-1 inline-block text-ui-xs font-black uppercase tracking-widest text-green">
                    Recommended
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-gray-nav">
                    Most people choose this. You still control what you write.
                  </span>
                  <span className="mt-3 block text-sm leading-6">
                    AI helps you notice recurring patterns and themes in your writing. Notes are stored on our servers.
                  </span>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={mode === 'encrypted'}
                  tabIndex={mode === 'encrypted' ? 0 : -1}
                  ref={(el) => { optionRefs.current.encrypted = el; }}
                  onClick={() => setMode('encrypted')}
                  onKeyDown={handleRadioKeyDown}
                  className={`rounded-xl border p-5 text-left transition flex flex-col items-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2 ${
                    mode === 'encrypted'
                      ? 'border-green bg-green/5 text-primary'
                      : 'border-border bg-surface text-gray-text hover:border-green/30'
                  }`}
                >
                  <LockKey size={24} weight="duotone" className={mode === 'encrypted' ? 'text-green' : 'text-gray-nav'} />
                  <span className="mt-3 block text-base font-bold text-primary">Encrypted Vault</span>
                  <span className="mt-3 block text-sm leading-6">
                    Your writing is encrypted before it leaves your device. Only you can read it — not even Reflections can see it.
                  </span>
                </button>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-12"
                >
                  {isSubmitting ? 'Saving...' : 'Confirm selection'}
                </Button>
              </div>
            </form>
          </div>
        </Surface>
      </div>
    </div>
  );
};
