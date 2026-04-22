import { describe, expect, it } from 'vitest';

import { buildNotePreviewText, sanitizeNoteHtml } from './noteContent';

describe('noteContent', () => {
  it('removes executable html from saved note content', () => {
    const html =
      '<p onclick="alert(1)">Hello</p><script>alert(2)</script><a href="javascript:alert(3)">link</a><img src="x" onerror="alert(4)" />';

    const sanitized = sanitizeNoteHtml(html);

    expect(sanitized).toContain('<p>Hello</p>');
    expect(sanitized).not.toContain('<script');
    expect(sanitized).not.toContain('onclick=');
    expect(sanitized).not.toContain('onerror=');
    expect(sanitized).not.toContain('javascript:');
    expect(sanitized).not.toContain('<img');
  });

  it('builds readable preview copy from rich note content', () => {
    const preview = buildNotePreviewText(
      '<h2>Morning</h2><p>Quiet writing with <strong>enough detail</strong> to prove the preview trims cleanly when it runs long.</p>',
      60,
    );

    expect(preview).toBe('Morning Quiet writing with enough detail to prove the prev...');
  });
});
