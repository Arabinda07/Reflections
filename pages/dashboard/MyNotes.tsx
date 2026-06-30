import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Calendar as CalendarIcon } from '@phosphor-icons/react/Calendar';
import { CircleNotch } from '@phosphor-icons/react/CircleNotch';
import { DownloadSimple } from '@phosphor-icons/react/DownloadSimple';
import { FileText } from '@phosphor-icons/react/FileText';
import { PencilSimpleLine } from '@phosphor-icons/react/PencilSimpleLine';
import { SquaresFour } from '@phosphor-icons/react/SquaresFour';
import { Tag } from '@phosphor-icons/react/Tag';
import { Trash } from '@phosphor-icons/react/Trash';
import { X } from '@phosphor-icons/react/X';
import { ArrowLeft } from '@phosphor-icons/react/ArrowLeft';
import { format, isSameDay } from 'date-fns';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { LottieAnimation } from '../../components/ui/LottieAnimation';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { LoadingState } from '../../components/ui/LoadingState';
import { MetadataPill } from '../../components/ui/MetadataPill';
import { ModalSheet } from '../../components/ui/ModalSheet';
import { PageContainer } from '../../components/ui/PageContainer';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { StorageImage } from '../../components/ui/StorageImage';
import { Surface } from '../../components/ui/Surface';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useHaptics } from '../../hooks/useHaptics';
import { useViewTransitionNavigation } from '../../hooks/useViewTransitionNavigation';
import { runScopedTransition } from '../../hooks/viewTransitionUtils';
import { noteService } from '../../services/noteService';
import { Note, RoutePath } from '../../types';
import { buildNotePreviewText } from './noteContent';
import { downloadNoteExport } from './noteExport';
import { getMoodConfig } from './moodConfig';

const MyNotesCalendar = lazy(() =>
  import('./MyNotesCalendar').then((module) => ({ default: module.MyNotesCalendar })),
);

const NOTE_SWIPE_OPEN_THRESHOLD = 72;
const NOTE_SWIPE_CLOSE_THRESHOLD = 48;
const NOTE_SWIPE_AXIS_INTENT_RATIO = 1.25;

export const MyNotes: React.FC = () => {
  const navigate = useViewTransitionNavigation();
  const rawNavigate = useNavigate();
  const haptics = useHaptics();
  const location = useLocation();
  const { user } = useAuthStore();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [noteIdToDelete, setNoteIdToDelete] = useState<string | null>(null);
  const [actionMenuNote, setActionMenuNote] = useState<Note | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [swipedNoteId, setSwipedNoteId] = useState<string | null>(null);
  const notesViewScopeRef = useRef<HTMLDivElement | null>(null);
  const swipeStartXRef = useRef<number | null>(null);
  const swipeStartYRef = useRef<number | null>(null);
  const swipeNoteIdRef = useRef<string | null>(null);

  const queryParams = new URLSearchParams(location.search);
  const tagFilter = queryParams.get('tag');

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const data = await noteService.getAll();
        setNotes(data);
      } catch (error) {
        console.error('Failed to fetch notes', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  const filteredNotes = tagFilter ? notes.filter((note) => note.tags?.includes(tagFilter)) : notes;
  const tagSummaries = Array.from(
    notes.reduce((tagCounts, note) => {
      for (const tag of note.tags || []) {
        const name = tag.trim();
        if (!name) continue;
        tagCounts.set(name, (tagCounts.get(name) || 0) + 1);
      }
      return tagCounts;
    }, new Map<string, number>()),
  )
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
  const selectedTagSummary = tagSummaries.find((tag) => tag.name === tagFilter);
  const countLabel = `${tagSummaries.length} ${tagSummaries.length === 1 ? 'tag' : 'tags'}`;
  const taggedReflectionCount = notes.filter((note) => (note.tags || []).length > 0).length;
  const taggedReflectionLabel = `${taggedReflectionCount} ${
    taggedReflectionCount === 1 ? 'reflection' : 'reflections'
  }`;
  const notesOnSelectedDate = filteredNotes.filter((note) =>
    isSameDay(new Date(note.updatedAt), selectedDate),
  );

  const initiateDelete = (event: React.MouseEvent, id: string) => {
    event.stopPropagation();
    setNoteIdToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleViewModeChange = (nextViewMode: 'grid' | 'calendar') => {
    runScopedTransition(notesViewScopeRef.current, () => {
      setViewMode(nextViewMode);
      setSwipedNoteId(null);
    });
  };

  const handleTagFilterChange = (path: string) => {
    setSwipedNoteId(null);
    rawNavigate(path);
  };

  const handleNotePointerDown = (event: React.PointerEvent, noteId: string) => {
    if (event.pointerType === 'mouse') return;
    swipeStartXRef.current = event.clientX;
    swipeStartYRef.current = event.clientY;
    swipeNoteIdRef.current = noteId;
  };

  const handleNotePointerEnd = (event: React.PointerEvent, noteId: string) => {
    if (
      swipeNoteIdRef.current !== noteId ||
      swipeStartXRef.current === null ||
      swipeStartYRef.current === null
    ) return;

    const deltaX = event.clientX - swipeStartXRef.current;
    const deltaY = event.clientY - swipeStartYRef.current;
    const hasHorizontalIntent = Math.abs(deltaX) > Math.abs(deltaY) * NOTE_SWIPE_AXIS_INTENT_RATIO;

    if (hasHorizontalIntent && deltaX < -NOTE_SWIPE_OPEN_THRESHOLD) {
      void haptics.light();
      setSwipedNoteId(noteId);
    } else if (hasHorizontalIntent && deltaX > NOTE_SWIPE_CLOSE_THRESHOLD) {
      setSwipedNoteId((current) => (current === noteId ? null : current));
    }

    swipeStartXRef.current = null;
    swipeStartYRef.current = null;
    swipeNoteIdRef.current = null;
  };

  const performDelete = async () => {
    if (!noteIdToDelete) return;

    setIsDeleting(true);
    try {
      await noteService.delete(noteIdToDelete);
      setNotes((previous) => previous.filter((note) => note.id !== noteIdToDelete));
      setIsConfirmOpen(false);
    } catch (error) {
      console.error('Failed to delete note:', error);
    } finally {
      setIsDeleting(false);
      setNoteIdToDelete(null);
    }
  };

  const getPreviewText = (html: string) => {
    return buildNotePreviewText(html);
  };

  const getMoodIcon = (mood?: string) => {
    const moodConfig = getMoodConfig(mood);
    if (!moodConfig) return null;

    const Icon = moodConfig.icon;
    return <Icon size={14} weight="fill" className={moodConfig.labelClass} />;
  };

  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null;

    const dayNotes = filteredNotes.filter((note) => isSameDay(new Date(note.updatedAt), date));
    if (dayNotes.length === 0) return null;

    return (
      <div className="mt-1 flex justify-center">
        <div className="flex -space-x-1">
          {dayNotes.slice(0, 3).map((note, index) => (
            <div key={note.id} className="flex items-center justify-center">
              {note.mood ? (
                <div className="scale-75 origin-center">{getMoodIcon(note.mood)}</div>
              ) : (
                <div
                  className={`h-1.5 w-1.5 rounded-full ${
                    index === 0 ? 'bg-green' : index === 1 ? 'bg-sky' : 'bg-honey'
                  }`}
                />
              )}
            </div>
          ))}
          {dayNotes.length > 3 ? <div className="h-1.5 w-1.5 rounded-full bg-gray-300 ml-1" /> : null}
        </div>
      </div>
    );
  };

  const renderNoteCard = (note: Note, index: number) => {
    const noteDetailPath = RoutePath.NOTE_DETAIL.replace(':id', note.id);
    const moodConfig = getMoodConfig(note.mood);
    const isSwipedOpen = swipedNoteId === note.id;
    const openNote = (event: React.MouseEvent) => {
      event.preventDefault();
      navigate(noteDetailPath);
    };

    return (
      <Surface
        key={note.id}
        variant="flat"
        className="group relative overflow-hidden rounded-[2.5rem] border border-border/40 transition-[transform,border-color,box-shadow] duration-500 hover:-translate-y-1 hover:border-green/20 hover:shadow-xl"
      >
        <div
          data-swipe-action-rail
          className="absolute inset-y-0 right-0 z-0 flex w-28 flex-col justify-center gap-2 bg-green/5 px-3"
          aria-hidden={!isSwipedOpen}
        >
          <button
            type="button"
            tabIndex={isSwipedOpen ? 0 : -1}
            disabled={!isSwipedOpen}
            onClick={(event) => {
              event.stopPropagation();
              if (!isSwipedOpen) return;
              downloadNoteExport(note, 'md');
              setSwipedNoteId(null);
            }}
            className="flex h-11 w-11 items-center justify-center self-end rounded-2xl bg-green text-white"
            aria-label={`Export ${note.title}`}
          >
            <DownloadSimple size={15} weight="bold" />
          </button>
          <button
            type="button"
            tabIndex={isSwipedOpen ? 0 : -1}
            disabled={!isSwipedOpen}
            onClick={(event) => {
              if (!isSwipedOpen) return;
              initiateDelete(event, note.id);
            }}
            className="flex h-11 w-11 items-center justify-center self-end rounded-2xl bg-clay/10 text-clay"
            aria-label={`Delete ${note.title}`}
          >
            <Trash size={15} weight="bold" />
          </button>
        </div>
        <article
          className={`relative z-10 flex h-full flex-col bg-surface transition-transform duration-300 ease-out [animation-delay:var(--note-card-delay)] animation-fill-mode-both ${
            isSwipedOpen ? '-translate-x-28' : 'translate-x-0'
          }`}
          onPointerDown={(event) => handleNotePointerDown(event, note.id)}
          onPointerUp={(event) => handleNotePointerEnd(event, note.id)}
          onPointerCancel={() => {
            swipeStartXRef.current = null;
            swipeStartYRef.current = null;
            swipeNoteIdRef.current = null;
          }}
          style={{ '--note-card-delay': `${index * 50}ms` } as React.CSSProperties}
        >
          <div className="relative h-44 w-full overflow-hidden border-b border-border/40">
            <Link
              to={noteDetailPath}
              onClick={openNote}
              className="block h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-green/40"
              aria-label={`Open ${note.title}`}
            >
              {note.thumbnailUrl ? (
                <>
                  <div className="absolute inset-0 z-10 bg-green/0 transition-colors duration-500 group-hover:bg-green/5" />
                  <StorageImage
                    path={note.thumbnailUrl}
                    alt={note.title}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center surface-inline-panel rounded-none border-0">
                  <FileText className="text-border transition-colors group-hover:text-green/30" size={48} weight="light" />
                </div>
              )}
            </Link>

            <div className="absolute right-4 top-4 z-20 flex flex-wrap justify-end gap-2">
              <MetadataPill icon={<CalendarIcon size={12} weight="regular" />}>
                {new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </MetadataPill>
              {note.mood ? (
                <MetadataPill icon={getMoodIcon(note.mood)} className={moodConfig?.nav || ''}>
                  <span>{moodConfig?.label || note.mood}</span>
                </MetadataPill>
              ) : null}
            </div>
          </div>

          <div className="flex flex-1 flex-col p-6">
            <div className="mb-3 flex flex-wrap gap-2">
              {note.tags?.map((tag) => (
                <Chip key={tag} as="span" active className="text-xs">
                  #{tag}
                </Chip>
              ))}
            </div>

            <Link
              to={noteDetailPath}
              onClick={openNote}
              className="group/title rounded-[var(--radius-control)] focus:outline-none focus-visible:ring-2 focus-visible:ring-green/40"
              aria-label={`Open ${note.title}`}
            >
              <h3 className="dashboard-card-title mb-2 transition-colors group-hover:text-green text-balance">
                {note.title}
              </h3>

              <p className="dashboard-editorial-preview mb-5 max-w-none transition-colors group-hover:text-gray-text line-clamp-3">
                {getPreviewText(note.content)}
              </p>
            </Link>

            <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/40 pt-4">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green text-xs font-extrabold text-white shadow-sm">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="truncate text-xs font-bold text-gray-nav">
                  Edited {format(new Date(note.updatedAt), 'MMM d')}
                </span>
              </div>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setActionMenuNote(note);
                }}
                className="control-surface inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-gray-nav transition-[transform,border-color,background-color,color] duration-500 hover:scale-110 hover:border-green/25 hover:bg-green/5 hover:text-green"
                aria-label={`More actions for ${note.title}`}
              >
                <SquaresFour size={18} weight="bold" />
              </button>
            </div>
          </div>
        </article>
      </Surface>
    );
  };

  return (
    <>
      <LoadingState
        isVisible={loading}
        title="Gathering your thoughts..."
      />

      {!loading ? (
        <PageContainer className="surface-scope-sage page-wash pb-14 pt-4 md:pt-8">
          <div 
            className="core-page-stack animate-fade-in-up"
          >
            <button
              onClick={() => navigate(RoutePath.DASHBOARD)}
              className="group flex min-h-11 w-fit items-center gap-2 rounded-[var(--radius-control)] px-2 text-sm font-bold text-gray-nav transition-[color,transform,background-color] duration-300 hover:-translate-x-1 hover:bg-green/5 hover:text-green"
              aria-label="Back to home"
            >
              <ArrowLeft size={16} weight="bold" className="transition-transform group-hover:scale-110" />
              <span>Back</span>
            </button>

            <SectionHeader
              title="Saved reflections"
              description="Cards or calendar: pick how you want to look through them."
              actions={
                <div className="core-control-cluster">
                  <div className="flex items-center gap-2">
                    <Chip
                      active={viewMode === 'grid'}
                      aria-pressed={viewMode === 'grid'}
                      icon={<SquaresFour size={16} weight="regular" />}
                      onClick={() => handleViewModeChange('grid')}
                      title="Grid view"
                    >
                      Grid
                    </Chip>
                    <Chip
                      active={viewMode === 'calendar'}
                      aria-pressed={viewMode === 'calendar'}
                      icon={<CalendarIcon size={16} weight="regular" />}
                      onClick={() => handleViewModeChange('calendar')}
                      title="Calendar view"
                    >
                      Calendar
                    </Chip>
                    {tagSummaries.length > 0 ? (
                      <Chip
                        active={!!tagFilter}
                        icon={<Tag size={16} weight="regular" />}
                        onClick={() => setIsFilterOpen(true)}
                        title="Filter by tag"
                        aria-label="Filter by tag"
                      >
                        Filter
                      </Chip>
                    ) : null}
                  </div>
                </div>
              }
            />

            {tagFilter ? (
              <div className="flex flex-wrap items-center gap-3">
                <Chip as="span" active icon={<Tag size={12} weight="regular" />}>
                  {tagFilter}
                </Chip>
                <p className="text-sm font-semibold text-gray-light">
                  Showing reflections tagged "{tagFilter}" · {selectedTagSummary?.count || 0}{' '}
                  {(selectedTagSummary?.count || 0) === 1 ? 'reflection' : 'reflections'}
                </p>
                <Button variant="ghost" size="sm" onClick={() => handleTagFilterChange(RoutePath.NOTES)} className="text-clay">
                  <X size={12} weight="regular" className="mr-1" />
                  Clear filter
                </Button>
              </div>
            ) : null}

            <div ref={notesViewScopeRef}>
            {viewMode === 'calendar' ? (
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                <div className="lg:col-span-7 xl:col-span-8">
                  <Surface variant="bezel" innerClassName="p-6 sm:p-8">
                    <Suspense
                      fallback={
                        <div className="flex h-[420px] items-center justify-center text-green">
                          <CircleNotch size={24} weight="bold" className="animate-spin" />
                        </div>
                      }
                    >
                      <MyNotesCalendar
                        onSelectDate={(value) => setSelectedDate(value)}
                        selectedDate={selectedDate}
                        tileContent={tileContent}
                      />
                    </Suspense>
                  </Surface>
                </div>

                <div className="space-y-5 lg:col-span-5 xl:col-span-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-gray-text">
                      <CalendarIcon size={18} weight="regular" className="text-green" />
                      {format(selectedDate, 'MMMM do, yyyy')}
                    </h3>
                    <MetadataPill tone="green">
                      {notesOnSelectedDate.length} {notesOnSelectedDate.length === 1 ? 'Note' : 'Notes'}
                    </MetadataPill>
                  </div>

                  <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1 wellness-scroll">
                    {notesOnSelectedDate.length > 0 ? (
                      notesOnSelectedDate.map((note, index) => renderNoteCard(note, index))
                    ) : (
                      <EmptyState
                        surface="flat"
                        icon={<FileText size={22} weight="duotone" />}
                        title="No notes on this day yet."
                        description="Pick another day, or write one here."
                        action={
                          <Button variant="ghost" size="sm" onClick={() => navigate(RoutePath.CREATE_NOTE)} className="text-green">
                            Write a note
                          </Button>
                        }
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : filteredNotes.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8" aria-live="polite">
                {filteredNotes.map((note, index) => renderNoteCard(note, index))}
              </div>
            ) : (
              <EmptyState
                surface="bezel"
                illustration={<LottieAnimation src="/assets/lottie/empty-notes.json" className="h-full w-full" autoplay loop />}
                title={tagFilter ? `No notes tagged “${tagFilter}” yet.` : 'No notes yet.'}
                description={
                  tagFilter
                    ? 'Clear the filter to see all your notes.'
                    : 'Start with the thought that keeps doing laps.'
                }
                action={
                  tagFilter ? (
                    <Button onClick={() => handleTagFilterChange(RoutePath.NOTES)} variant="secondary">
                      Clear filter
                    </Button>
                  ) : (
                    <Button onClick={() => navigate(RoutePath.CREATE_NOTE)} variant="primary">
                      Write a note
                    </Button>
                  )
                }
              />
            )}
            </div>
          </div>
        </PageContainer>
      ) : null}

      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={performDelete}
        title="Delete this note?"
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete note'}
        isConfirming={isDeleting}
        variant="danger"
      />

      <ModalSheet
        isOpen={!!actionMenuNote}
        onClose={() => setActionMenuNote(null)}
        title="Note actions"
        icon={<SquaresFour size={22} weight="duotone" />}
        ariaLabel="Choose an action for this reflection"
        size="sm"
      >
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              if (!actionMenuNote) return;
              navigate(RoutePath.EDIT_NOTE.replace(':id', actionMenuNote.id));
              setActionMenuNote(null);
            }}
            className="surface-inline-panel flex min-h-11 w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:border-green/20 hover:bg-green/5"
          >
            <PencilSimpleLine size={20} weight="regular" className="flex-none text-green" />
            <span className="text-sm font-extrabold text-gray-text">Edit</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!actionMenuNote) return;
              downloadNoteExport(actionMenuNote, 'md');
              setActionMenuNote(null);
            }}
            className="surface-inline-panel flex min-h-11 w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:border-green/20 hover:bg-green/5"
          >
            <DownloadSimple size={20} weight="regular" className="flex-none text-green" />
            <span className="text-sm font-extrabold text-gray-text">Export</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!actionMenuNote) return;
              setNoteIdToDelete(actionMenuNote.id);
              setActionMenuNote(null);
              setIsConfirmOpen(true);
            }}
            className="surface-inline-panel flex min-h-11 w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:border-clay/30 hover:bg-clay/5"
          >
            <Trash size={20} weight="regular" className="flex-none text-clay" />
            <span className="text-sm font-extrabold text-clay">Delete</span>
          </button>
        </div>
      </ModalSheet>

      <ModalSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filter by tag"
        description={`${countLabel} across ${taggedReflectionLabel}.`}
        ariaLabel="Filter reflections by tag"
        size="sm"
      >
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              setIsFilterOpen(false);
              handleTagFilterChange(RoutePath.NOTES);
            }}
            className={`surface-inline-panel flex min-h-11 w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:border-green/20 hover:bg-green/5 ${
              !tagFilter ? 'border-green/30 bg-green/5' : ''
            }`}
          >
            <span className="text-sm font-extrabold text-gray-text">All reflections</span>
          </button>
          {tagSummaries.map((tag) => (
            <button
              key={tag.name}
              type="button"
              onClick={() => {
                setIsFilterOpen(false);
                setSwipedNoteId(null);
                navigate(`${RoutePath.NOTES}?tag=${encodeURIComponent(tag.name)}`);
              }}
              aria-label={`Show ${tag.name} reflections`}
              className={`surface-inline-panel flex min-h-11 w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:border-green/20 hover:bg-green/5 ${
                tagFilter === tag.name ? 'border-green/30 bg-green/5' : ''
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-bold text-gray-text">
                <Tag size={14} weight="regular" className="text-green" />
                {tag.name}
              </span>
              <span className="metadata-pill metadata-pill--sage">{tag.count}</span>
            </button>
          ))}
        </div>
      </ModalSheet>
    </>
  );
};
