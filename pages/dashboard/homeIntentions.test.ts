import { describe, expect, it } from 'vitest';
import type { Note } from '../../types';
import {
  buildHomeIntentionSummary,
  getHomeIntentionToggleUpdate,
} from './homeIntentions';

const note = (overrides: Partial<Note>): Note => ({
  id: 'note-1',
  title: 'Untitled reflection',
  content: '',
  createdAt: '2026-04-20T00:00:00.000Z',
  updatedAt: '2026-04-20T00:00:00.000Z',
  tasks: [],
  ...overrides,
});

describe('homeIntentions', () => {
  it('summarizes open note tasks with note context and a visible limit', () => {
    const summary = buildHomeIntentionSummary(
      [
        note({
          id: 'older',
          title: 'Older reflection',
          updatedAt: '2026-04-20T10:00:00.000Z',
          tasks: [
            { id: 'older-open', text: 'Pack the journal', completed: false },
            { id: 'older-done', text: 'Finished task', completed: true },
          ],
        }),
        note({
          id: 'newer',
          title: 'Sunday list',
          updatedAt: '2026-04-21T10:00:00.000Z',
          tasks: [
            { id: 'newer-open', text: 'Reply to Mira', completed: false },
            { id: 'blank', text: '   ', completed: false },
            { id: 'second-open', text: 'Buy paper', completed: false },
          ],
        }),
      ],
      2,
    );

    expect(summary.openCount).toBe(3);
    expect(summary.completedCount).toBe(1);
    expect(summary.hiddenCount).toBe(1);
    expect(summary.hasAnyTasks).toBe(true);
    expect(summary.items).toEqual([
      {
        id: 'newer-open',
        noteId: 'newer',
        noteTitle: 'Sunday list',
        text: 'Reply to Mira',
        completed: false,
      },
      {
        id: 'second-open',
        noteId: 'newer',
        noteTitle: 'Sunday list',
        text: 'Buy paper',
        completed: false,
      },
    ]);
  });

  it('distinguishes an empty task list from a settled task list', () => {
    expect(buildHomeIntentionSummary([])).toMatchObject({
      openCount: 0,
      completedCount: 0,
      hasAnyTasks: false,
    });

    expect(
      buildHomeIntentionSummary([
        note({
          tasks: [{ id: 'done', text: 'Already handled', completed: true }],
        }),
      ]),
    ).toMatchObject({
      openCount: 0,
      completedCount: 1,
      hasAnyTasks: true,
    });
  });

  it('returns the note update for completing a home intention', () => {
    const update = getHomeIntentionToggleUpdate(
      note({
        content: '<p>[ ] Reply to Mira</p>',
        tasks: [{ id: 'task-1', text: 'Reply to Mira', completed: false }],
      }),
      'task-1',
    );

    expect(update).toEqual({
      tasks: [{ id: 'task-1', text: 'Reply to Mira', completed: true }],
      content: '<p>[x] Reply to Mira</p>',
    });
  });
});
