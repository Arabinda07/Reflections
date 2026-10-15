import React, { useEffect, useState } from 'react';
import { Sparkle } from '@phosphor-icons/react/Sparkle';
import { Microphone } from '@phosphor-icons/react/Microphone';
import { Image } from '@phosphor-icons/react/Image';
import { vectorStore } from '../../services/embedding/vectorStore';
import { embeddingService } from '../../services/embedding/embeddingService';
import { noteService } from '../../services/noteService';
import { useViewTransitionNavigation } from '../../hooks/useViewTransitionNavigation';
import { type Note, RoutePath } from '../../types';
import { buildNotePreviewText } from '../../pages/dashboard/noteContent';
import { getMoodGroupForMood } from '../../pages/dashboard/moodConfig';
import { HEAVY_OR_CHARGED_FAMILIES } from '../../services/moodAnchors';
import { getAntidoteMemories } from '../../services/moodIntelligence';

export interface EchoesProps {
  currentNoteId: string;
  currentNoteTitle?: string;
  currentNoteContent?: string;
  /** Needed so an on-the-fly embedding is stored with the note's real hash. */
  currentNoteUpdatedAt?: string;
  currentMood?: string;
  minScore?: number; // default 0.40
}

interface EchoItem {
  note: Note;
  similarity: number;
}

const formatEchoDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

export const Echoes: React.FC<EchoesProps> = ({
  currentNoteId,
  currentNoteTitle = '',
  currentNoteContent = '',
  currentNoteUpdatedAt,
  currentMood,
  minScore = 0.4,
}) => {
  const navigate = useViewTransitionNavigation();
  const [echoes, setEchoes] = useState<EchoItem[]>([]);
  const [isAntidoteMode, setIsAntidoteMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    async function loadEchoes() {
      try {
        // 1. Fetch current vector or generate on-the-fly
        const vectorRecord = await vectorStore.get(currentNoteId);
        let noteVector = vectorRecord?.vector;

        if (!noteVector || noteVector.length === 0) {
          noteVector = await embeddingService.embedNote({
            id: currentNoteId,
            title: currentNoteTitle,
            content: currentNoteContent,
            createdAt: currentNoteUpdatedAt ?? new Date().toISOString(),
            updatedAt: currentNoteUpdatedAt ?? new Date().toISOString(),
          });
        }

        if (cancelled || !noteVector || noteVector.length === 0) {
          setIsLoading(false);
          return;
        }

        // Check if current mood is heavy or charged to prioritize antidote memories
        const currentGroup = currentMood ? getMoodGroupForMood(currentMood)?.id : undefined;
        const isHeavyOrCharged = currentGroup ? HEAVY_OR_CHARGED_FAMILIES.includes(currentGroup) : false;

        let resolved: EchoItem[] = [];

        if (isHeavyOrCharged) {
          const allNotes = await noteService.getAll();
          const antidotes = await getAntidoteMemories(
            { id: currentNoteId, mood: currentMood, content: currentNoteContent, title: currentNoteTitle },
            allNotes,
            { limit: 4, minScore: 0.25 },
          );
          if (antidotes.length > 0 && !cancelled) {
            resolved = antidotes.map((a) => ({ note: a.note, similarity: a.similarity }));
            setIsAntidoteMode(true);
          }
        }

        if (resolved.length === 0) {
          setIsAntidoteMode(false);
          // 2. Query vector store for similar memories
          const matches = await vectorStore.findSimilar(noteVector, 10, minScore);
          if (cancelled) return;

          // 3. Exclude current note
          const candidates = matches.filter((m) => m.noteId !== currentNoteId).slice(0, 4);

          if (candidates.length === 0) {
            if (!cancelled) {
              setEchoes([]);
              setIsLoading(false);
            }
            return;
          }

          // 4. Resolve full note data
          for (const candidate of candidates) {
            const note = await noteService.getById(candidate.noteId);
            if (note && !cancelled) {
              resolved.push({ note, similarity: candidate.score });
            }
          }
        }

        if (!cancelled) {
          setEchoes(resolved);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setEchoes([]);
          setIsLoading(false);
        }
      }
    }

    void loadEchoes();

    return () => {
      cancelled = true;
    };
  }, [currentNoteId, currentNoteTitle, currentNoteContent, currentNoteUpdatedAt, currentMood, minScore]);

  // If loading or no echoes cross the threshold, quietly render nothing
  // to keep the journal reading experience serene and distraction-free.
  if (isLoading || echoes.length === 0) {
    return null;
  }

  return (
    <section className="mt-14 border-t border-border/40 pt-8" aria-label="Related reflections">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkle size={16} weight="duotone" className="text-green" />
          <h2 className="text-ui-sm font-extrabold text-gray-text">
            {isAntidoteMode ? 'Grounding Echoes' : 'Echoes'}
          </h2>
        </div>
        <span className="text-ui-xs font-bold text-gray-nav">
          {isAntidoteMode
            ? 'Past moments of lightness and calm to ground this thought'
            : 'Past reflections resonating with this thought'}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {echoes.map(({ note }) => {
          return (
            <button
              key={note.id}
              type="button"
              onClick={() => navigate(RoutePath.NOTE_DETAIL.replace(':id', note.id))}
              className="group surface-inline-panel flex flex-col justify-between rounded-panel p-4 text-left transition-all duration-200 hover:border-green/30 hover:bg-green/5"
            >
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-green/10 px-2 py-0.5 text-ui-xs font-bold text-green">
                      <Sparkle size={11} weight="fill" />
                      {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {note.attachments?.some((a) => a.type?.startsWith('audio/')) && (
                      <span className="inline-flex items-center text-gray-nav" title="Voice reflection">
                        <Microphone size={12} weight="fill" />
                      </span>
                    )}
                    {(note.thumbnailUrl || note.attachments?.some((a) => a.type?.startsWith('image/'))) && (
                      <span className="inline-flex items-center text-gray-nav" title="Photo memory">
                        <Image size={12} weight="fill" />
                      </span>
                    )}
                  </div>
                  <span className="text-ui-xs font-bold text-gray-nav">
                    {formatEchoDate(note.createdAt)}
                  </span>
                </div>
                <h3 className="line-clamp-1 text-ui-sm font-extrabold text-gray-text transition-colors group-hover:text-green">
                  {note.title || 'Untitled reflection'}
                </h3>
                <p className="mt-1 line-clamp-2 text-btn-sm font-medium text-gray-light">
                  {buildNotePreviewText(note.content)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
