import { describe, expect, it } from 'vitest';
import { mergeTasks } from './taskParser';
import type { Task } from '../../types';

const task = (overrides: Partial<Task>): Task => ({
  id: 'task-1',
  text: 'Reply to Mira',
  completed: false,
  ...overrides,
});

describe('taskParser', () => {
  it('timestamps tasks completed from parsed note text', () => {
    const [merged] = mergeTasks(
      [task({ completed: false })],
      [task({ id: 'new-task-1', completed: true })],
    );

    expect(merged).toMatchObject({
      id: 'task-1',
      text: 'Reply to Mira',
      completed: true,
    });
    expect(merged.completedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('clears stale completion timestamps when parsed note text reopens a task', () => {
    const [merged] = mergeTasks(
      [task({ completed: true, completedAt: '2026-05-09T08:00:00.000Z' })],
      [task({ id: 'new-task-1', completed: false })],
    );

    expect(merged).toMatchObject({
      id: 'task-1',
      text: 'Reply to Mira',
      completed: false,
    });
    expect(merged.completedAt).toBeUndefined();
  });
});
