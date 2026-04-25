import { describe, expect, it } from 'vitest';

import type { Task } from '../../types';
import {
  buildCreateNoteDraftSnapshot,
  CREATE_NOTE_SAVE_VISUAL_FLOOR_MS,
  CREATE_NOTE_UNSUPPORTED_WHISPER_MESSAGE,
  hasUnsavedCreateNoteChanges,
} from './createNoteDraftState';

const task = (id: string, text: string, completed: boolean, dueDate?: string): Task => ({
  id,
  text,
  completed,
  dueDate,
});

describe('createNoteDraftState', () => {
  it('treats blank editor states as unchanged draft content', () => {
    const baseline = buildCreateNoteDraftSnapshot({
      title: '',
      content: '<p><br></p>',
      mood: undefined,
      tags: [],
      tasks: [],
      imagePreview: null,
      existingAttachments: [],
      newAttachments: [],
    });

    const current = buildCreateNoteDraftSnapshot({
      title: '   ',
      content: '',
      mood: undefined,
      tags: [],
      tasks: [],
      imagePreview: null,
      existingAttachments: [],
      newAttachments: [],
    });

    expect(hasUnsavedCreateNoteChanges(current, baseline)).toBe(false);
  });

  it('detects meaningful changes across metadata and task content', () => {
    const baseline = buildCreateNoteDraftSnapshot({
      title: 'Morning note',
      content: '<p>Stayed grounded.</p>',
      mood: 'calm',
      tags: ['clarity'],
      tasks: [task('1', 'Take a walk', false)],
      imagePreview: null,
      existingAttachments: [],
      newAttachments: [],
    });

    const current = buildCreateNoteDraftSnapshot({
      title: 'Morning note',
      content: '<p>Stayed grounded.</p>',
      mood: 'calm',
      tags: ['clarity'],
      tasks: [task('1', 'Take a walk', true)],
      imagePreview: null,
      existingAttachments: [],
      newAttachments: [],
    });

    expect(hasUnsavedCreateNoteChanges(current, baseline)).toBe(true);
  });

  it('keeps save feedback tied to real work instead of an artificial visual floor', () => {
    expect(CREATE_NOTE_SAVE_VISUAL_FLOOR_MS).toBe(0);
  });

  it('locks in the whisper fallback copy', () => {
    expect(CREATE_NOTE_UNSUPPORTED_WHISPER_MESSAGE).toBe(
      "Whisper isn't available in this browser yet. You can keep writing normally or try Chrome on Android.",
    );
  });
});
