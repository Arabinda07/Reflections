import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CircleNotch } from '@phosphor-icons/react/CircleNotch';
import { MagnifyingGlass } from '@phosphor-icons/react/MagnifyingGlass';
import { ModalSheet } from './ModalSheet';
import { EmptyState } from './EmptyState';
import { noteService } from '../../services/noteService';
import { useViewTransitionNavigation } from '../../hooks/useViewTransitionNavigation';
import { type Note, RoutePath } from '../../types';
import { buildNotePreviewText } from '../../pages/dashboard/noteContent';
import { searchNotes } from '../../pages/dashboard/noteSearch';

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
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  // Load notes fresh each time the palette opens (offline-first, already decrypted).
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    setNotes(null);
    setQuery('');
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

  const results = useMemo(
    () => (notes ? searchNotes(notes, query).slice(0, MAX_RESULTS) : []),
    [notes, query],
  );

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
      const note = results[activeIndex];
      if (note) openNote(note);
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
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
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
            className="input-surface min-h-12 w-full rounded-[var(--radius-control)] pl-11 pr-4 text-[15px] font-semibold text-gray-text outline-none placeholder:text-gray-nav focus-visible:ring-2 focus-visible:ring-green"
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
            {results.map((note, index) => {
              const isActive = index === activeIndex;
              return (
                <li key={note.id} data-index={index}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => openNote(note)}
                    onMouseMove={() => setActiveIndex(index)}
                    className={`flex w-full flex-col gap-1 rounded-[var(--radius-control)] px-4 py-3 text-left transition-colors ${
                      isActive ? 'bg-green/5 text-green' : 'text-gray-text hover:bg-green/5'
                    }`}
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-[15px] font-extrabold">{note.title || 'Untitled reflection'}</span>
                      <span className="shrink-0 text-[11px] font-black uppercase tracking-widest text-gray-nav">
                        {formatNoteDate(note.createdAt)}
                      </span>
                    </span>
                    <span className="truncate text-[13px] font-medium text-gray-light">
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
