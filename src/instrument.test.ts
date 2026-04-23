import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const init = vi.fn();
const replayIntegration = vi.fn(() => ({ name: 'replay' }));

vi.mock('@sentry/react', () => ({
  init,
  replayIntegration,
}));

describe('instrument bootstrap', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    init.mockReset();
    replayIntegration.mockReset();
    replayIntegration.mockReturnValue({ name: 'replay' });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('skips Sentry initialization when the browser DSN is missing', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', '');
    vi.stubEnv('MODE', 'test');

    await import('./instrument');

    expect(replayIntegration).not.toHaveBeenCalled();
    expect(init).not.toHaveBeenCalled();
  });

  it('initializes Sentry when a browser DSN is present', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://examplePublicKey@o0.ingest.sentry.io/0');
    vi.stubEnv('MODE', 'test');
    vi.stubEnv('VITE_APP_VERSION', '1.0.0');

    await import('./instrument');

    expect(replayIntegration).toHaveBeenCalledOnce();
    expect(init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://examplePublicKey@o0.ingest.sentry.io/0',
        environment: 'test',
        release: 'reflections@1.0.0',
      }),
    );
  });
});
