import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');

describe('mobile browser behavior audit harness', () => {
  it('fails clearly when required public Vite env is missing', () => {
    const audit = read('scratch/mobile-browser-audit.mjs');

    expect(audit).toContain("const REQUIRED_ENV = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];");
    expect(audit).toContain('Mobile browser audit cannot run because required Vite public env is missing.');
    expect(audit).toContain('Missing: ${missingEnv.join');
    expect(audit).toContain('process.exit(1);');
    expect(audit).toContain("const BASE_PORT = new URL(BASE_URL).port || '5173';");
    expect(audit).toContain("['--host', '127.0.0.1', '--port', BASE_PORT, '--strictPort']");
    expect(audit).toContain("shell: process.platform === 'win32'");
  });

  it('audits public mobile scroll state and stale scroll-lock leakage', () => {
    const audit = read('scratch/mobile-browser-audit.mjs');
    const auditSpec = read('scratch/mobile-browser-audit.spec.js');

    expect(audit).toContain("const VIEWPORTS = [");
    expect(audit).toContain("{ name: 'compact-phone', width: 390, height: 844 }");
    expect(audit).toContain("{ name: 'large-phone', width: 430, height: 932 }");
    expect(audit).toContain("const PUBLIC_ROUTES = ['/', '/faq', '/about', '/privacy'];");
    expect(audit).toContain('document.scrollingElement?.scrollTop');
    expect(audit).toContain('bodyClass: document.body.className');
    expect(audit).toContain('htmlClass: document.documentElement.className');
    expect(audit).toContain('mainOverflowY: main ? getComputedStyle(main).overflowY : null');
    expect(audit).toContain('document.elementFromPoint');
    expect(audit).toContain('public menu did not lock body scroll');
    expect(audit).toContain('body.no-scroll leaked after menu close');
    expect(audit).toContain('body.no-scroll leaked after public menu navigation');
    expect(auditSpec).toContain("import { test, expect } from '@playwright/test';");
    expect(auditSpec).toContain("const PUBLIC_ROUTES = ['/', '/faq', '/about', '/privacy'];");
    expect(auditSpec).toContain("await page.getByRole('button', { name: 'Toggle menu' }).click();");
    expect(auditSpec).toContain("Input.dispatchTouchEvent");
    expect(auditSpec).toContain("expect(afterCloseDiagnostics.bodyClass).not.toContain('no-scroll');");
    expect(auditSpec).toContain("expect(diagnostics.bodyClass).not.toContain('no-scroll');");
    expect(read('scratch/playwright-mobile-audit.config.js')).toContain(
      'testMatch: /mobile-browser-audit\\.spec\\.js/',
    );
    expect(read('scratch/playwright-mobile-audit.config.js')).toContain('cwd: REPO_ROOT');
  });

  it('keeps authenticated mobile checks conditional on a real browser session', () => {
    const audit = read('scratch/mobile-browser-audit.mjs');

    expect(audit).toContain('auditAuthenticatedShellIfAvailable');
    expect(audit).toContain("flow: 'authenticated-mobile-shell'");
    expect(audit).toContain("status: 'skipped'");
    expect(audit).toContain('No authenticated browser session was available.');
    expect(audit).toContain("flow: 'authenticated-more-sheet'");
    expect(audit).toContain('More sheet did not lock body scroll.');
    expect(audit).toContain('More sheet leaked body.no-scroll after close.');
  });
});
