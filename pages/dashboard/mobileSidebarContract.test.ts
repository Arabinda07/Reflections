import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('Mobile sidebar navigation contract', () => {
  it('uses a right-docked sidebar shell instead of the copied mobile header panel', () => {
    const sidebar = read('layouts/MobileSidebar.tsx');
    const css = read('index.css');

    expect(sidebar).toContain('mobile-sidebar-shell');
    expect(sidebar).toContain('mobile-sidebar-scrim');
    expect(sidebar).toContain('mobile-sidebar-link');
    expect(sidebar).toContain('aria-label="Close menu"');
    expect(sidebar).toContain("width: 'min(86vw, 352px)'");
    expect(sidebar).not.toContain('border-l-2');

    expect(css).toContain('.mobile-sidebar-shell');
    expect(css).toContain('.mobile-sidebar-scrim');
    expect(css).toContain('.mobile-sidebar-link[data-active="true"]');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
