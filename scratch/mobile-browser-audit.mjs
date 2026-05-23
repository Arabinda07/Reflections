import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const REQUIRED_ENV = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const VIEWPORTS = [
  { name: 'compact-phone', width: 390, height: 844 },
  { name: 'large-phone', width: 430, height: 932 },
];
const PUBLIC_ROUTES = ['/', '/faq', '/about', '/privacy'];
const BASE_URL = process.env.MOBILE_AUDIT_BASE_URL || 'http://127.0.0.1:5173';
const BASE_PORT = new URL(BASE_URL).port || '5173';
const START_VITE = process.env.MOBILE_AUDIT_START_VITE !== '0';
const VITE_READY_TIMEOUT_MS = 30_000;

const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]?.trim());

if (missingEnv.length > 0) {
  console.error(
    [
      'Mobile browser audit cannot run because required Vite public env is missing.',
      `Missing: ${missingEnv.join(', ')}`,
      'Run with values supplied in the command environment, for example:',
      '$env:VITE_SUPABASE_URL="https://example.supabase.co"; $env:VITE_SUPABASE_ANON_KEY="anon"; npm exec --package playwright -- node scratch/mobile-browser-audit.mjs',
    ].join('\n'),
  );
  process.exit(1);
}

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error(
    [
      'Mobile browser audit requires Playwright.',
      'Run it with: npm exec --package playwright -- node scratch/mobile-browser-audit.mjs',
    ].join('\n'),
  );
  process.exit(1);
}

const wait = (ms) => new Promise((resolveWait) => setTimeout(resolveWait, ms));

const waitForVite = async () => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < VITE_READY_TIMEOUT_MS) {
    try {
      const response = await fetch(BASE_URL);
      if (response.ok) return;
    } catch {
      // Vite is still starting.
    }
    await wait(500);
  }

  throw new Error(`Timed out waiting for Vite at ${BASE_URL}`);
};

const startVite = () => {
  if (!START_VITE) return null;

  const viteCmd = process.platform === 'win32'
    ? resolve(process.cwd(), 'node_modules/.bin/vite.cmd')
    : resolve(process.cwd(), 'node_modules/.bin/vite');

  if (!existsSync(viteCmd)) {
    throw new Error('Cannot find local Vite binary. Run npm install before auditing.');
  }

  return spawn(viteCmd, ['--host', '127.0.0.1', '--port', BASE_PORT, '--strictPort'], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
    windowsHide: true,
  });
};

const readDiagnostics = async (page) =>
  page.evaluate(() => {
    const main = document.querySelector('#main-content');
    const activeOverlay = document.querySelector(
      '.public-mobile-menu-root, .modal-sheet-root, .mobile-sidebar-shell',
    );
    const pointTargets = [
      document.elementFromPoint(window.innerWidth / 2, 24),
      document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2),
      document.elementFromPoint(window.innerWidth / 2, window.innerHeight - 24),
    ];

    return {
      url: window.location.pathname,
      scrollTop: document.scrollingElement?.scrollTop ?? 0,
      scrollHeight: document.scrollingElement?.scrollHeight ?? 0,
      clientHeight: document.scrollingElement?.clientHeight ?? 0,
      viewportHeight: window.innerHeight,
      bodyClass: document.body.className,
      htmlClass: document.documentElement.className,
      bodyOverflow: getComputedStyle(document.body).overflow,
      htmlOverflow: getComputedStyle(document.documentElement).overflow,
      mainOverflow: main ? getComputedStyle(main).overflow : null,
      mainOverflowY: main ? getComputedStyle(main).overflowY : null,
      activeOverlay: activeOverlay?.className?.toString() ?? null,
      activeElement:
        document.activeElement instanceof HTMLElement
          ? {
              tag: document.activeElement.tagName,
              label: document.activeElement.getAttribute('aria-label'),
              text: document.activeElement.textContent?.trim().slice(0, 80),
            }
          : null,
      pointTargets: pointTargets.map((target) =>
        target instanceof HTMLElement
          ? {
              tag: target.tagName,
              id: target.id,
              className: target.className?.toString(),
              pointerEvents: getComputedStyle(target).pointerEvents,
            }
          : null,
      ),
    };
  });

const performTouchScroll = async (page) => {
  const client = await page.context().newCDPSession(page);
  const x = await page.evaluate(() => window.innerWidth / 2);
  const startY = await page.evaluate(() => Math.min(window.innerHeight - 96, 680));
  const endY = Math.max(120, startY - 460);

  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y: startY }],
  });
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x, y: endY }],
  });
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  });
};

const assertPageScrollable = async (page, label) => {
  await page.evaluate(() => window.scrollTo(0, 0));
  await performTouchScroll(page);
  await page.waitForTimeout(160);
  const diagnostics = await readDiagnostics(page);

  if (diagnostics.bodyClass.includes('no-scroll')) {
    throw new Error(`${label}: body.no-scroll should not be present.\n${JSON.stringify(diagnostics, null, 2)}`);
  }

  if (diagnostics.scrollHeight <= diagnostics.clientHeight) {
    return diagnostics;
  }

  if (diagnostics.scrollTop <= 0) {
    throw new Error(`${label}: scrollTop stayed at 0.\n${JSON.stringify(diagnostics, null, 2)}`);
  }

  return diagnostics;
};

const clickMenuButton = async (page) => {
  const menuButton = page.getByRole('button', { name: 'Toggle menu' });
  await menuButton.click();
  await page.waitForSelector('.public-mobile-menu-root');
};

const auditPublicRoutes = async (page, viewportName) => {
  const results = [];

  for (const route of PUBLIC_ROUTES) {
    await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
    results.push({
      viewport: viewportName,
      flow: `public-scroll:${route}`,
      status: 'passed',
      diagnostics: await assertPageScrollable(page, `${viewportName} ${route} before menu`),
    });

    await clickMenuButton(page);
    const menuOpenDiagnostics = await readDiagnostics(page);
    if (!menuOpenDiagnostics.bodyClass.includes('no-scroll')) {
      throw new Error(`${viewportName} ${route}: public menu did not lock body scroll.`);
    }

    await page.getByRole('button', { name: 'Close menu' }).click();
    await page.waitForSelector('.public-mobile-menu-root', { state: 'detached' });
    const afterCloseDiagnostics = await assertPageScrollable(
      page,
      `${viewportName} ${route} after menu close`,
    );
    if (afterCloseDiagnostics.bodyClass.includes('no-scroll')) {
      throw new Error(`${viewportName} ${route}: body.no-scroll leaked after menu close.`);
    }

    results.push({
      viewport: viewportName,
      flow: `public-menu-close:${route}`,
      status: 'passed',
      diagnostics: afterCloseDiagnostics,
    });
  }

  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await clickMenuButton(page);
  await page.getByRole('link', { name: /FAQ/ }).click();
  await page.waitForURL(`${BASE_URL}/faq`);
  await page.waitForSelector('.public-mobile-menu-root', { state: 'detached' });
  await page.waitForTimeout(300);
  const afterNavigationDiagnostics = await assertPageScrollable(
    page,
    `${viewportName} after public menu navigation`,
  );
  if (afterNavigationDiagnostics.bodyClass.includes('no-scroll')) {
    throw new Error(`${viewportName}: body.no-scroll leaked after public menu navigation.`);
  }

  results.push({
    viewport: viewportName,
    flow: 'public-menu-navigation',
    status: 'passed',
    diagnostics: afterNavigationDiagnostics,
  });

  return results;
};

const auditAuthenticatedShellIfAvailable = async (page, viewportName) => {
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
  const loginVisible = await page.getByRole('button', { name: /sign in|log in/i }).count()
    .catch(() => 0);
  const moreButton = page.getByRole('button', { name: 'Open more navigation' });
  const hasMoreButton = await moreButton.count().catch(() => 0);

  if (loginVisible > 0 || hasMoreButton === 0) {
    return [{
      viewport: viewportName,
      flow: 'authenticated-mobile-shell',
      status: 'skipped',
      reason: 'No authenticated browser session was available.',
      diagnostics: await readDiagnostics(page),
    }];
  }

  await moreButton.first().click();
  await page.waitForSelector('.modal-sheet-root');
  const openDiagnostics = await readDiagnostics(page);
  if (!openDiagnostics.bodyClass.includes('no-scroll')) {
    throw new Error(`${viewportName}: More sheet did not lock body scroll.`);
  }

  await page.keyboard.press('Escape');
  await page.waitForSelector('.modal-sheet-root', { state: 'detached' });
  const closeDiagnostics = await readDiagnostics(page);
  if (closeDiagnostics.bodyClass.includes('no-scroll')) {
    throw new Error(`${viewportName}: More sheet leaked body.no-scroll after close.`);
  }

  return [{
    viewport: viewportName,
    flow: 'authenticated-more-sheet',
    status: 'passed',
    diagnostics: closeDiagnostics,
  }];
};

let viteProcess = null;
let browser = null;

try {
  viteProcess = startVite();
  if (viteProcess) {
    viteProcess.stdout.on('data', (chunk) => process.stdout.write(`[vite] ${chunk}`));
    viteProcess.stderr.on('data', (chunk) => process.stderr.write(`[vite] ${chunk}`));
  }

  await waitForVite();
  browser = await chromium.launch();
  const allResults = [];

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    allResults.push(...await auditPublicRoutes(page, viewport.name));
    allResults.push(...await auditAuthenticatedShellIfAvailable(page, viewport.name));

    await context.close();
  }

  console.log(JSON.stringify({ status: 'passed', results: allResults }, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (viteProcess) viteProcess.kill();
}
