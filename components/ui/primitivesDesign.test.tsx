import { readFileSync } from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Button } from './Button';
import { Input } from './Input';

describe('design-system primitives', () => {
  it('renders buttons with structured control radii instead of pill defaults', () => {
    const markup = renderToStaticMarkup(<Button>Save changes</Button>);

    expect(markup).toContain('rounded-[var(--radius-control)]');
    expect(markup).not.toContain('rounded-full');
  });

  it('keeps primary buttons green-first by default', () => {
    const markup = renderToStaticMarkup(<Button variant="primary">Save changes</Button>);

    expect(markup).toContain('bg-green');
    expect(markup).toContain('text-white');
    expect(markup).not.toContain('text-blue');
  });

  it('keeps danger buttons on clay instead of red', () => {
    const markup = renderToStaticMarkup(<Button variant="danger">Delete</Button>);

    expect(markup).toContain('bg-clay');
    expect(markup).toContain('text-white');
    expect(markup).not.toContain('bg-red');
  });

  it('renders inputs with green focus treatment instead of blue', () => {
    const markup = renderToStaticMarkup(
      <Input id="email" label="Email" type="email" placeholder="Email" />,
    );

    expect(markup).toContain('focus:border-green');
    expect(markup).toContain('focus:ring-green/10');
    expect(markup).not.toContain('focus:border-blue');
  });

  it('renders input errors in clay while keeping the botanical focus ring', () => {
    const markup = renderToStaticMarkup(
      <Input id="email" label="Email" type="email" placeholder="Email" error="Required" />,
    );

    expect(markup).toContain('border-clay');
    expect(markup).toContain('text-clay');
    expect(markup).toContain('focus:ring-green/10');
    expect(markup).not.toContain('border-red');
    expect(markup).not.toContain('ring-red');
  });

  it('keeps the calendar contract aligned to the shared radius and green accent', () => {
    const css = readFileSync(path.resolve(process.cwd(), 'pages/dashboard/Calendar.css'), 'utf8');

    expect(css).toContain('border-radius: var(--radius-control);');
    expect(css).not.toContain('border-radius: 9999px');
    expect(css).toContain('border-color: var(--green);');
  });
});
