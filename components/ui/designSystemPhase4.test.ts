import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('phase 4 design-system normalization', () => {
  it('moves the shared shell and portal-heavy surfaces onto the phase 4 contract', () => {
    const dashboardLayout = read('layouts/DashboardLayout.tsx');
    const createNote = read('pages/dashboard/CreateNote.tsx');
    const startupScreen = read('components/ui/StartupScreen.tsx');

    expect(dashboardLayout).toContain('min-h-[100dvh]');
    expect(dashboardLayout).not.toContain('h-screen');

    expect(createNote).toContain("from '../../components/ui/ModalSheet'");
    expect(createNote).not.toContain("from 'react-dom'");
    expect(createNote).not.toContain('window.innerWidth');

    expect(startupScreen).toContain("from './OverlayFeedback'");
    expect(startupScreen).not.toContain("from 'react-dom'");
  });

  it('removes the remaining user-facing naming drift from product surfaces', () => {
    const home = read('pages/dashboard/Home.tsx');
    const faq = read('pages/dashboard/FAQ.tsx');

    expect(home).not.toContain('Welcome to Sanctuary.');
    expect(home).not.toContain('Enter Sanctuary');
    expect(home).not.toContain('Sanctuary Overview');

    expect(faq).not.toContain('Everything you need to know about Sanctuary');
    expect(faq).not.toContain('Sanctuary intelligence');
  });
});
