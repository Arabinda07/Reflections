import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('Echoes component contract', () => {
  it('implements serene luxury styling and proper service wiring in Echoes.tsx', () => {
    const echoesCode = read('components/ui/Echoes.tsx');

    // Phosphor Sparkle icon for resonance
    expect(echoesCode).toContain("from '@phosphor-icons/react/Sparkle'");
    // Local vector store and embedding service
    expect(echoesCode).toContain("from '../../services/embedding/vectorStore'");
    expect(echoesCode).toContain("from '../../services/embedding/embeddingService'");
    expect(echoesCode).toContain("from '../../services/noteService'");

    // Self-exclusion and limit
    expect(echoesCode).toContain('.filter((m) => m.noteId !== currentNoteId)');
    expect(echoesCode).toContain('.slice(0, 4)');

    // Quiet empty state (returns null to keep journal distraction-free)
    expect(echoesCode).toContain('if (isLoading || echoes.length === 0)');
    expect(echoesCode).toContain('return null;');

    // Resonance percentage display
    expect(echoesCode).toContain('Math.round(similarity * 100)');
    expect(echoesCode).toContain('% resonance');
  });

  it('is correctly integrated inside SingleNote.tsx article', () => {
    const singleNoteCode = read('pages/dashboard/SingleNote.tsx');

    expect(singleNoteCode).toContain("import { Echoes } from '../../components/ui/Echoes'");
    expect(singleNoteCode).toContain('<Echoes');
    expect(singleNoteCode).toContain('currentNoteId={note.id}');
    expect(singleNoteCode).toContain('currentNoteTitle={note.title}');
    expect(singleNoteCode).toContain('currentNoteContent={note.content}');
  });
});
