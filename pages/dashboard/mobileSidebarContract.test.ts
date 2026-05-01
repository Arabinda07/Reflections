import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('Mobile sidebar navigation contract', () => {
  it('uses a right-docked sidebar shell instead of the copied mobile header panel', () => {
    const layout = read('layouts/DashboardLayout.tsx');
    const css = read('index.css');

    expect(layout).toContain('mobile-sidebar-shell');
    expect(layout).toContain('mobile-sidebar-scrim');
    expect(layout).toContain('mobile-sidebar-link');
    expect(layout).toContain('aria-label="Close menu"');
    expect(layout).toContain("width: 'min(92vw, 390px)'");
    expect(layout).not.toContain('border-l-2');

    expect(css).toContain('.mobile-sidebar-shell');
    expect(css).toContain('.mobile-sidebar-scrim');
    expect(css).toContain('.mobile-sidebar-link[data-active="true"]');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
