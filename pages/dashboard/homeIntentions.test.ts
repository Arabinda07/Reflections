import { describe, expect, it } from 'vitest';
import type { Note, Task } from '../../types';
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
            {
              id: 'older-done',
              text: 'Finished task',
              completed: true,
              completedAt: '2026-04-21T11:00:00.000Z',
            },
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
      new Date('2026-04-21T12:00:00.000Z'),
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
          updatedAt: '2026-05-10T08:00:00.000Z',
          tasks: [{ id: 'done', text: 'Already handled', completed: true }],
        }),
        ],
        undefined,
        new Date('2026-05-10T09:00:00.000Z'),
      ),
    ).toMatchObject({
      openCount: 0,
      completedCount: 1,
      hasAnyTasks: true,
    });
  });

  it('hides completed intentions from the home card 24 hours after completion', () => {
    const summary = buildHomeIntentionSummary(
      [
        note({
          updatedAt: '2026-05-10T08:00:00.000Z',
          tasks: [
            {
              id: 'fresh-done',
              text: 'Freshly crossed off',
              completed: true,
              completedAt: '2026-05-09T08:01:00.000Z',
            } satisfies Task,
            {
              id: 'old-done',
              text: 'Already faded',
              completed: true,
              completedAt: '2026-05-09T08:00:00.000Z',
            } satisfies Task,
            { id: 'still-open', text: 'Keep showing this', completed: false },
          ],
        }),
      ],
      5,
      new Date('2026-05-10T08:00:00.000Z'),
    );

    expect(summary.completedItems.map((item) => item.id)).toEqual(['fresh-done']);
    expect(summary.completedCount).toBe(1);
    expect(summary.hasAnyTasks).toBe(true);
  });

  it('returns the note update for completing a home intention', () => {
    const update = getHomeIntentionToggleUpdate(
      note({
        content: '<p>[ ] Reply to Mira</p>',
        tasks: [{ id: 'task-1', text: 'Reply to Mira', completed: false }],
      }),
      'task-1',
    );

    expect(update).toMatchObject({
      tasks: [{ id: 'task-1', text: 'Reply to Mira', completed: true }],
      content: '<p>[x] Reply to Mira</p>',
    });
    expect(update?.tasks[0].completedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
