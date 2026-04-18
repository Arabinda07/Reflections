import { describe, expect, it } from 'vitest';
import type { Task } from '../../types';
import {
  getOrderedTasks,
  getTaskDrawerTriggerLabel,
  getTaskMainPaddingClass,
} from './createNoteTasks';

const task = (id: string, text: string, completed: boolean): Task => ({
  id,
  text,
  completed,
});

describe('createNoteTasks', () => {
  it('shows the incomplete count in the trigger label', () => {
    expect(getTaskDrawerTriggerLabel([])).toEqual({
      label: 'Tasks',
      incompleteCount: 0,
    });

    expect(getTaskDrawerTriggerLabel([
      task('a', 'First', false),
      task('b', 'Second', true),
      task('c', 'Third', false),
    ])).toEqual({
      label: '2 Tasks',
      incompleteCount: 2,
    });
  });

  it('orders incomplete tasks before completed tasks without changing their relative order', () => {
    expect(getOrderedTasks([
      task('1', 'Complete later', true),
      task('2', 'Still open', false),
      task('3', 'Also open', false),
      task('4', 'Already done', true),
    ])).toEqual([
      task('2', 'Still open', false),
      task('3', 'Also open', false),
      task('1', 'Complete later', true),
      task('4', 'Already done', true),
    ]);
  });

  it('keeps mobile layouts from using the desktop drawer offset', () => {
    expect(getTaskMainPaddingClass({ isMobile: true, isTasksOpen: false })).toBe('lg:pl-0');
    expect(getTaskMainPaddingClass({ isMobile: true, isTasksOpen: true })).toBe('lg:pl-0');
    expect(getTaskMainPaddingClass({ isMobile: false, isTasksOpen: false })).toBe('lg:pl-[180px]');
    expect(getTaskMainPaddingClass({ isMobile: false, isTasksOpen: true })).toBe('lg:pl-[440px]');
  });
});
