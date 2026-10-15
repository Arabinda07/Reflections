import React, { useEffect, useRef, useState } from 'react';
import { CircleNotch } from '@phosphor-icons/react/CircleNotch';
import { MagnifyingGlass } from '@phosphor-icons/react/MagnifyingGlass';
import { Sparkle } from '@phosphor-icons/react/Sparkle';
import { Microphone } from '@phosphor-icons/react/Microphone';
import { Image } from '@phosphor-icons/react/Image';
import { ModalSheet } from './ModalSheet';
import { EmptyState } from './EmptyState';
import { noteService } from '../../services/noteService';
import { useViewTransitionNavigation } from '../../hooks/useViewTransitionNavigation';
import { type Note, RoutePath } from '../../types';
import { buildNotePreviewText } from '../../pages/dashboard/noteContent';
import {
  searchNotes,
  searchNotesHybrid,
  type ScoredNoteSearchResult,
} from '../../pages/dashboard/noteSearch';

interface NoteSearchPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_RESULTS = 50;

const formatNoteDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

export const NoteSearchPalette: React.FC<NoteSearchPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useViewTransitionNavigation();
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ScoredNoteSearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  // Load notes fresh each time the palette opens (offline-first, already decrypted).
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setNotes(null);
    setQuery('');
    setResults([]);
    setActiveIndex(0);

    noteService
      .getAll()
      .then((data) => {
        if (!cancelled) setNotes(data);
      })
      .catch(() => {
        if (!cancelled) setNotes([]);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Two-phase progressive search UX:
  // Phase 1: Instant synchronous keyword match on keystroke (0ms)
  // Phase 2: Debounced asynchronous hybrid search enriching with semantic scoring
  useEffect(() => {
    if (!notes) {
      setResults([]);
      return;
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setResults(
        [...notes].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)).slice(0, MAX_RESULTS).map((note) => ({
          note,
          score: 1.0,
          matchType: 'exact' as const,
        })),
      );
      return;
    }

    // Phase 1: Instant synchronous keyword match (0ms)
    const initialKeywordMatches = searchNotes(notes, trimmed).slice(0, MAX_RESULTS);
    setResults(
      initialKeywordMatches.map((note) => ({
        note,
        score: 1.0,
        matchType: 'keyword' as const,
      })),
    );

    // Phase 2: Debounced asynchronous hybrid re-ranking
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const hybridResults = await searchNotesHybrid(notes, trimmed, { topK: MAX_RESULTS });
        if (!cancelled) {
          setResults(hybridResults);
        }
      } catch {
        // Retain Phase 1 keyword matches on fallback
      }
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [notes, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const openNote = (note: Note) => {
    navigate(RoutePath.NOTE_DETAIL.replace(':id', note.id));
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = results[activeIndex];
      if (item) openNote(item.note);
    }
  };

  return (
    <ModalSheet
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="Search your notes"
      size="lg"
      mobilePlacement="center"
      hideClose
    >
      <div onKeyDown={handleKeyDown}>
        <div className="relative mb-4">
          <MagnifyingGlass
            size={18}
            weight="bold"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-nav"
          />
          <input
            data-autofocus="true"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your notes"
            aria-label="Search your notes"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="note-search-results"
            className="input-surface min-h-12 w-full rounded-control pl-11 pr-4 text-ui-base font-semibold text-gray-text outline-none placeholder:text-gray-nav focus-visible:ring-2 focus-visible:ring-green"
          />
        </div>

        {notes === null ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm font-bold text-gray-nav">
            <CircleNotch size={18} weight="bold" className="animate-spin" />
            Opening your notes...
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            surface="none"
            icon={<MagnifyingGlass size={28} weight="duotone" />}
            title={query ? 'No matches' : 'No notes yet'}
            description={
              query
                ? 'Nothing here matched that. Try a different word.'
                : 'Notes you write will show up here for quick searching.'
            }
          />
        ) : (
          <ul ref={listRef} id="note-search-results" role="listbox" className="max-h-[52vh] space-y-1 overflow-y-auto">
            {results.map((item, index) => {
              const { note, matchType } = item;
              const isActive = index === activeIndex;
              return (
                <li key={note.id} data-index={index}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => openNote(note)}
                    onMouseMove={() => setActiveIndex(index)}
                    className={`flex w-full flex-col gap-1 rounded-control px-4 py-3 text-left transition-colors ${
                      isActive ? 'bg-green/5 text-green' : 'text-gray-text hover:bg-green/5'
                    }`}
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-ui-base font-extrabold">{note.title || 'Untitled reflection'}</span>
                        {matchType === 'semantic' && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green/10 px-2 py-0.5 text-ui-xs font-bold text-green">
                            <Sparkle size={12} weight="fill" />
                            Related
                          </span>
                        )}
                        {item.modality === 'audio' && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-nav/10 px-2 py-0.5 text-ui-xs font-bold text-gray-text">
                            <Microphone size={12} weight="fill" />
                            Voice
                          </span>
                        )}
                        {item.modality === 'image' && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gray-nav/10 px-2 py-0.5 text-ui-xs font-bold text-gray-text">
                            <Image size={12} weight="fill" />
                            Photo
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-ui-xs font-black uppercase tracking-widest text-gray-nav">
                        {formatNoteDate(note.createdAt)}
                      </span>
                    </span>
                    <span className="truncate text-btn-sm font-medium text-gray-light">
                      {buildNotePreviewText(note.content)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </ModalSheet>
  );
};
