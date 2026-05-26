import { describe, expect, it } from 'vitest';
import type { Note } from '../../types';
import { buildNoteExportText, getNoteExportFilename } from './noteExport';

const note: Note = {
  id: 'note-1',
  title: 'A quiet Tuesday / draft',
  content: '<p>Hello <strong>there</strong>.</p><script>alert("no")</script>',
  createdAt: '2026-04-20T10:00:00.000Z',
  updatedAt: '2026-04-21T11:30:00.000Z',
  mood: 'calm',
  tags: ['work', 'rest'],
  tasks: [
    { id: 'task-1', text: 'Reply to Mira', completed: false },
    { id: 'task-2', text: 'Pack notes', completed: true },
  ],
};

describe('noteExport', () => {
  it('builds a calm plain-text export with note metadata and tasks', () => {
    expect(buildNoteExportText(note, 'txt')).toContain('A quiet Tuesday / draft');
    expect(buildNoteExportText(note, 'txt')).toContain('Mood: calm');
    expect(buildNoteExportText(note, 'txt')).toContain('Tags: work, rest');
    expect(buildNoteExportText(note, 'txt')).toContain('[ ] Reply to Mira');
    expect(buildNoteExportText(note, 'txt')).toContain('[x] Pack notes');
    expect(buildNoteExportText(note, 'txt')).toContain('Hello there.');
    expect(buildNoteExportText(note, 'txt')).not.toContain('<script>');
  });

  it('uses a safe filename for downloaded note exports', () => {
    expect(getNoteExportFilename(note, 'md')).toBe('a-quiet-tuesday-draft-2026-04-21.md');
  });

  it('builds a human-readable markdown export with preserved structure', () => {
    const structuredNote: Note = {
      ...note,
      content: [
        '<h2>Morning notes</h2>',
        '<p>Hello <strong>there</strong>, <em>reader</em>.</p>',
        '<p><u>Underlined</u> and <s>removed</s>.</p>',
        '<p><a href="https://example.com">Example link</a></p>',
        '<blockquote><p>A useful line.</p></blockquote>',
        '<ul><li>First item</li><li>Second item</li></ul>',
        '<ol><li>Number one</li><li>Number two</li></ol>',
        '<pre><code>const value = 1;</code></pre>',
        '<script>alert("no")</script>',
      ].join(''),
      attachments: [
        {
          id: 'attachment-1',
          name: 'photo.png',
          path: 'user-1/notes/note-1/photo.png.enc',
          size: 2048,
          type: 'image/png',
        },
      ],
    };

    const markdown = buildNoteExportText(structuredNote, 'md');

    expect(markdown).toMatch(/^# A quiet Tuesday \/ draft\n\n/);
    expect(markdown).toContain('Created: April 20, 2026, 3:30 PM');
    expect(markdown).toContain('Updated: April 21, 2026, 5:00 PM');
    expect(markdown).toContain('Mood: calm');
    expect(markdown).toContain('Tags: work, rest');
    expect(markdown).not.toContain('---');
    expect(markdown).not.toContain('id: note-1');
    expect(markdown).not.toContain('created_at:');
    expect(markdown).not.toContain('updated_at:');
    expect(markdown).not.toContain('tags: []');
    expect(markdown).toContain('## Morning notes');
    expect(markdown).toContain('Hello **there**, *reader*.');
    expect(markdown).toContain('<u>Underlined</u> and ~~removed~~.');
    expect(markdown).toContain('[Example link](https://example.com)');
    expect(markdown).toContain('> A useful line.');
    expect(markdown).toContain('- First item\n- Second item');
    expect(markdown).toContain('1. Number one\n2. Number two');
    expect(markdown).toContain('```\nconst value = 1;\n```');
    expect(markdown).toContain('- [ ] Reply to Mira');
    expect(markdown).toContain('- [x] Pack notes');
    expect(markdown).not.toContain('## Attachments');
    expect(markdown).not.toContain('user-1/notes/note-1/photo.png.enc');
    expect(markdown).not.toContain('<script>');
    expect(markdown).not.toContain('alert("no")');
  });

  it('omits empty optional metadata from markdown exports', () => {
    const markdown = buildNoteExportText({ ...note, mood: undefined, tags: [] }, 'md');

    expect(markdown).not.toContain('Mood:');
    expect(markdown).not.toContain('Tags:');
    expect(markdown).not.toContain('tags: []');
  });

  it('wraps long markdown paragraphs without wrapping code blocks', () => {
    const longText =
      'This is a long paragraph that should be wrapped into readable lines instead of continuing forever across the screen when someone opens the exported markdown file.';
    const longCode = 'const message = "This code line should remain as one long line because code blocks must not be wrapped by the markdown exporter.";';
    const markdown = buildNoteExportText(
      {
        ...note,
        content: `<p>${longText}</p><pre><code>${longCode}</code></pre>`,
        tasks: [],
      },
      'md',
    );

    expect(markdown).toContain(
      [
        'This is a long paragraph that should be wrapped into readable lines instead of',
        'continuing forever across the screen when someone opens the exported markdown file.',
      ].join('\n'),
    );
    expect(
      markdown
        .split('\n')
        .filter((line) => line.startsWith('This is') || line.startsWith('continuing'))
        .every((line) => line.length <= 88),
    ).toBe(true);
    expect(markdown).toContain(`\`\`\`\n${longCode}\n\`\`\``);
  });

  it('keeps markdown exports readable when a note has no written text', () => {
    expect(buildNoteExportText({ ...note, content: '' }, 'md')).toContain('No written text.');
  });
});
