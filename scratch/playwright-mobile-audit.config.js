import { defineConfig } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE_URL = process.env.MOBILE_AUDIT_BASE_URL || 'http://127.0.0.1:5175';
const BASE_PORT = new URL(BASE_URL).port || '5175';
const viteCommand = process.platform === 'win32'
  ? `.\\node_modules\\.bin\\vite.cmd --host 127.0.0.1 --port ${BASE_PORT} --strictPort`
  : `./node_modules/.bin/vite --host 127.0.0.1 --port ${BASE_PORT} --strictPort`;

export default defineConfig({
  testDir: '.',
  testMatch: /mobile-browser-audit\.spec\.js/,
  timeout: 30_000,
  workers: 1,
  webServer: {
    command: viteCommand,
    cwd: REPO_ROOT,
    url: BASE_URL,
    timeout: 30_000,
    reuseExistingServer: true,
  },
  use: {
    browserName: 'chromium',
    trace: 'retain-on-failure',
  },
});
