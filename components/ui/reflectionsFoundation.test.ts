import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('Reflections shadcn foundation layer', () => {
  it('defines semantic Reflections tokens before screen-level styling', () => {
    const css = read('index.css');
    const tailwind = read('tailwind.config.js');

    for (const token of [
      '--background: #fbfcfb',
      '--foreground: #252525',
      '--surface: #f7f8f6',
      '--surface-floating:',
      '--primary: #008151',
      '--secondary: #5383c2',
      '--destructive: #a46c53',
      '--border-subtle:',
      '--ring-focus:',
      '--motion-duration-steady:',
    ]) {
      expect(css, `missing ${token}`).toContain(token);
    }

    for (const token of [
      "background: 'var(--background)'",
      "foreground: 'var(--foreground)'",
      "surface: 'var(--surface)'",
      "primary: 'var(--primary)'",
      "secondary: 'var(--secondary)'",
      "destructive: 'var(--destructive)'",
      "'border-subtle': 'var(--border-subtle)'",
      "'ring-focus': 'var(--ring-focus)'",
    ]) {
      expect(tailwind, `missing Tailwind token ${token}`).toContain(token);
    }

    expect(tailwind).toContain("floating: 'var(--radius-floating)'");
    expect(tailwind).toContain("'steady': 'var(--motion-duration-steady)'");
  });

  it('adds one Reflections wrapper layer instead of scattering raw primitives', () => {
    const wrapperPath = path.resolve(process.cwd(), 'components/ui/reflections.tsx');

    expect(existsSync(wrapperPath), 'components/ui/reflections.tsx should exist').toBe(true);

    const wrapper = read('components/ui/reflections.tsx');

    for (const exportName of [
      'FloatingPanel',
      'PrimaryAction',
      'QuietAction',
      'DestructiveAction',
      'NoteEditor',
      'ReflectionDialog',
      'DestructiveConfirmDialog',
      'CalmEmptyState',
      'QuietToast',
    ]) {
      expect(wrapper, `missing ${exportName}`).toContain(`export const ${exportName}`);
    }

    expect(wrapper).toContain("from './Button'");
    expect(wrapper).toContain("from './Card'");
    expect(wrapper).toContain("from './Textarea'");
    expect(wrapper).toContain("from './ModalSheet'");
    expect(wrapper).toContain("from './ConfirmationDialog'");
    expect(wrapper).toContain("from './EmptyState'");
    expect(wrapper).toContain('Start with what is here.');
    expect(wrapper).not.toContain('Amazing work');
    expect(wrapper).not.toContain('Operation successful');
  });

  it('keeps shadcn-style local primitives calm and token-led', () => {
    for (const filePath of ['components/ui/Card.tsx', 'components/ui/Textarea.tsx']) {
      expect(existsSync(path.resolve(process.cwd(), filePath)), `${filePath} should exist`).toBe(true);
    }

    const card = read('components/ui/Card.tsx');
    const textarea = read('components/ui/Textarea.tsx');

    expect(card).toContain('bg-surface');
    expect(card).toContain('border-border-subtle');
    expect(card).toContain('rounded-[var(--radius-panel)]');
    expect(card).not.toContain('shadow-xl');

    expect(textarea).toContain('font-editor');
    expect(textarea).toContain('focus-visible:ring-[var(--ring-focus)]');
    expect(textarea).not.toContain('placeholder:text-slate');
  });
});
