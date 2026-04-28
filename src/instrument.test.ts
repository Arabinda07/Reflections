import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const init = vi.fn();
const replayIntegration = vi.fn(() => ({ name: 'replay' }));
const captureException = vi.fn();

vi.mock('@sentry/react', () => ({
  init,
  replayIntegration,
  captureException,
}));

describe('instrument bootstrap', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    init.mockReset();
    replayIntegration.mockReset();
    captureException.mockReset();
    replayIntegration.mockReturnValue({ name: 'replay' });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('skips Sentry initialization when the browser DSN is missing', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', '');
    vi.stubEnv('MODE', 'test');

    const { captureReactRootError, initSentry, scheduleSentryInitialization } = await import('./instrument');

    expect(await initSentry()).toBe(false);
    expect(captureReactRootError(new Error('missing dsn'))).toBe(false);
    expect(scheduleSentryInitialization()).toBeUndefined();
    expect(replayIntegration).not.toHaveBeenCalled();
    expect(init).not.toHaveBeenCalled();
  });

  it('initializes Sentry only when a browser DSN is present', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://examplePublicKey@o0.ingest.sentry.io/0');
    vi.stubEnv('MODE', 'test');
    vi.stubEnv('VITE_APP_VERSION', '1.0.0');

    const { initSentry } = await import('./instrument');

    await expect(initSentry()).resolves.toBe(true);
    expect(replayIntegration).toHaveBeenCalledOnce();
    expect(init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://examplePublicKey@o0.ingest.sentry.io/0',
        environment: 'test',
        release: 'reflections@1.0.0',
      }),
    );
  });

  it('captures root errors through the deferred Sentry module', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://examplePublicKey@o0.ingest.sentry.io/0');
    vi.stubEnv('MODE', 'test');

    const { captureReactRootError } = await import('./instrument');

    expect(captureReactRootError(new Error('root failed'), { componentStack: 'stack' })).toBe(true);

    await vi.waitFor(() => {
      expect(captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          extra: { componentStack: 'stack' },
        }),
      );
    });
  });
});
