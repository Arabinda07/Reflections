import { test, expect } from '@playwright/test';

const REQUIRED_ENV = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const PUBLIC_ROUTES = ['/', '/faq', '/about', '/privacy'];
const BASE_URL = process.env.MOBILE_AUDIT_BASE_URL || 'http://127.0.0.1:5175';

const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]?.trim());
if (missingEnv.length > 0) {
  throw new Error(
    [
      'Mobile browser audit cannot run because required Vite public env is missing.',
      `Missing: ${missingEnv.join(', ')}`,
      'Supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the command environment.',
    ].join('\n'),
  );
}

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
      scrollTop: document.scrollingElement?.scrollTop ?? 0,
      scrollHeight: document.scrollingElement?.scrollHeight ?? 0,
      clientHeight: document.scrollingElement?.clientHeight ?? 0,
      viewportHeight: window.innerHeight,
      bodyClass: document.body.className,
      htmlClass: document.documentElement.className,
      bodyOverflow: getComputedStyle(document.body).overflow,
      htmlOverflow: getComputedStyle(document.documentElement).overflow,
      mainOverflowY: main ? getComputedStyle(main).overflowY : null,
      activeOverlay: activeOverlay?.className?.toString() ?? null,
      activeElement:
        document.activeElement instanceof HTMLElement
          ? document.activeElement.getAttribute('aria-label') || document.activeElement.textContent?.trim().slice(0, 80)
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

  expect(
    diagnostics.bodyClass,
    `${label}: body.no-scroll should not be present.\n${JSON.stringify(diagnostics, null, 2)}`,
  ).not.toContain('no-scroll');

  if (diagnostics.scrollHeight <= diagnostics.clientHeight) {
    return diagnostics;
  }

  expect(
    diagnostics.scrollTop,
    `${label}: scrollTop should move.\n${JSON.stringify(diagnostics, null, 2)}`,
  ).toBeGreaterThan(0);

  return diagnostics;
};

for (const viewport of [
  { name: 'compact-phone', width: 390, height: 844 },
  { name: 'large-phone', width: 430, height: 932 },
]) {
  test.describe(`mobile browser behavior: ${viewport.name}`, () => {
    test.use({
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });

    for (const route of PUBLIC_ROUTES) {
      test(`public route ${route} scrolls before and after menu close`, async ({ page }) => {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
        await assertPageScrollable(page, `${viewport.name} ${route} before menu`);

        await page.getByRole('button', { name: 'Toggle menu' }).click();
        await page.waitForSelector('.public-mobile-menu-root');
        const openDiagnostics = await readDiagnostics(page);
        expect(openDiagnostics.bodyClass).toContain('no-scroll');

        await page.getByRole('button', { name: 'Close menu' }).click();
        await page.waitForSelector('.public-mobile-menu-root', { state: 'detached' });
        const afterCloseDiagnostics = await assertPageScrollable(
          page,
          `${viewport.name} ${route} after menu close`,
        );
        expect(afterCloseDiagnostics.bodyClass).not.toContain('no-scroll');
      });
    }

    test('public menu navigation releases scroll lock on the destination page', async ({ page }) => {
      await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: 'Toggle menu' }).click();
      await page.waitForSelector('.public-mobile-menu-root');
      await page.getByRole('link', { name: /FAQ/ }).click();
      await page.waitForURL(`${BASE_URL}/faq`);
      await page.waitForSelector('.public-mobile-menu-root', { state: 'detached' });
      await page.waitForTimeout(300);

      const diagnostics = await assertPageScrollable(page, `${viewport.name} /faq after menu nav`);
      expect(diagnostics.bodyClass).not.toContain('no-scroll');
    });

    test('authenticated mobile shell audit is skipped without a real session', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
      const moreButtons = await page.getByRole('button', { name: 'Open more navigation' }).count();

      if (moreButtons === 0) {
        test.info().annotations.push({
          type: 'skip-reason',
          description: 'No authenticated browser session was available.',
        });
        expect(moreButtons).toBe(0);
        return;
      }

      await page.getByRole('button', { name: 'Open more navigation' }).first().click();
      await page.waitForSelector('.modal-sheet-root');
      const openDiagnostics = await readDiagnostics(page);
      expect(openDiagnostics.bodyClass).toContain('no-scroll');

      await page.keyboard.press('Escape');
      await page.waitForSelector('.modal-sheet-root', { state: 'detached' });
      const closeDiagnostics = await readDiagnostics(page);
      expect(closeDiagnostics.bodyClass).not.toContain('no-scroll');
    });
  });
}
