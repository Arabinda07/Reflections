import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const read = (path: string) => fs.readFileSync(path, 'utf8');

describe('WhisperComposerControl contract', () => {
  it('keeps voice capture local, accessible, and reusable', () => {
    const component = read('components/ui/WhisperComposerControl.tsx');
    const hook = read('hooks/useWhisperInput.ts');

    expect(component).toContain('useWhisperInput');
    expect(component).toContain('Start voice capture');
    expect(component).toContain('Stop voice capture');
    expect(component).toContain('interimTranscript');
    expect(component).toContain('aria-live="polite"');
    expect(component).toContain('stopOnFinalTranscript');
    expect(hook).toContain('stop: () => void');
    expect(hook).toContain('type BrowserSpeechRecognition');
    expect(hook).toContain('stopRecognition');
    expect(hook).toContain('return () => {');
    expect(component).not.toMatch(/fetch\(|aiClient|supabase|\/api\//);
  });

  it('is used by the full editor and the home quick-capture surface', () => {
    const createNote = read('pages/dashboard/CreateNote.tsx');
    const home = read('pages/dashboard/HomeAuthenticated.tsx');

    expect(createNote).toContain('WhisperComposerControl');
    expect(home).toContain('WhisperComposerControl');
    expect(home).toContain('stopOnFinalTranscript');
  });

  it('keeps Create Note whisper as a sidebar action instead of a duplicate editor mode', () => {
    const createNote = read('pages/dashboard/CreateNote.tsx');
    const whisperIndex = createNote.indexOf('label="Whisper"');
    const tasksIndex = createNote.indexOf('<button onClick={() => setIsTasksOpen(true)}', whisperIndex);
    const sidebarWhisper = createNote.slice(whisperIndex, tasksIndex);

    expect(createNote).not.toContain('label="Voice capture"');
    expect(sidebarWhisper).toContain('gap-3');
    expect(sidebarWhisper).toContain('text-[13px] font-bold');
    expect(sidebarWhisper).not.toContain('justify-between');
    expect(sidebarWhisper).not.toContain('CaretRight');
  });
});
