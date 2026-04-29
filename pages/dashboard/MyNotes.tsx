import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Plus,
  FileText,
  ArrowUpRight,
  Calendar as CalendarIcon,
  Trash,
  CircleNotch,
  Download,
  SquaresFour,
  Tag,
  X,
} from '@phosphor-icons/react';
import { format, isSameDay } from 'date-fns';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { LoadingState } from '../../components/ui/LoadingState';
import { MetadataPill } from '../../components/ui/MetadataPill';
import { PageContainer } from '../../components/ui/PageContainer';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { StorageImage } from '../../components/ui/StorageImage';
import { Surface } from '../../components/ui/Surface';
import { useAuth } from '../../context/AuthContext';
import { noteService } from '../../services/noteService';
import { Note, RoutePath } from '../../types';
import { buildNotePreviewText } from './noteContent';
import { downloadNoteExport } from './noteExport';
import { getMoodConfig } from './moodConfig';

const MyNotesCalendar = lazy(() =>
  import('./MyNotesCalendar').then((module) => ({ default: module.MyNotesCalendar })),
);

export const MyNotes: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [noteIdToDelete, setNoteIdToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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
  const allTags = Array.from(new Set(notes.flatMap((note) => note.tags || [])));
  const notesOnSelectedDate = filteredNotes.filter((note) =>
    isSameDay(new Date(note.updatedAt), selectedDate),
  );

  const initiateDelete = (event: React.MouseEvent, id: string) => {
    event.stopPropagation();
    setNoteIdToDelete(id);
    setIsConfirmOpen(true);
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
                    index === 0 ? 'bg-green' : index === 1 ? 'bg-blue' : 'bg-orange'
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

    return (
      <Surface
        key={note.id}
        variant="flat"
        className="group overflow-hidden hover:border-green/25 hover:shadow-xl hover:shadow-black/5 transition-all duration-500"
      >
        <article
          className="flex h-full flex-col"
          style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
        >
          <div className="relative h-44 w-full overflow-hidden border-b border-border/40">
            <Link
              to={noteDetailPath}
              className="block h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-green/40"
              aria-label={`Open ${note.title}`}
            >
              {note.thumbnailUrl ? (
                <>
                  <div className="absolute inset-0 z-10 bg-green/0 transition-colors duration-500 group-hover:bg-green/5" />
                  <StorageImage
                    path={note.thumbnailUrl}
                    alt={note.title}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-105"
                  />
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center surface-inline-panel rounded-none border-0">
                  <FileText className="text-border transition-colors group-hover:text-green/30" size={48} weight="light" />
                </div>
              )}
            </Link>

            <button
              onClick={(event) => initiateDelete(event, note.id)}
              disabled={isDeleting && noteIdToDelete === note.id}
              className="control-surface absolute left-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center text-gray-text shadow-sm backdrop-blur-xl transition-all duration-300 hover:border-red/30 hover:text-red"
              aria-label={`Delete ${note.title}`}
            >
              {isDeleting && noteIdToDelete === note.id ? (
                <CircleNotch size={16} weight="bold" className="animate-spin text-red" />
              ) : (
                <Trash size={16} weight="regular" />
              )}
            </button>

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
                <Chip key={tag} as="span" active className="text-[10px]">
                  #{tag}
                </Chip>
              ))}
            </div>

            <Link
              to={noteDetailPath}
              className="rounded-[var(--radius-control)] focus:outline-none focus-visible:ring-2 focus-visible:ring-green/40"
              aria-label={`Open ${note.title}`}
            >
              <h3 className="mb-2 text-[18px] font-bold tracking-normal text-gray-text leading-snug transition-colors group-hover:text-green text-balance">
                {note.title}
              </h3>

              <p className="mb-5 text-[14px] font-medium leading-relaxed text-gray-light line-clamp-3 font-serif italic">
                {getPreviewText(note.content)}
              </p>
            </Link>

            <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/40 pt-4">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green text-[10px] font-extrabold text-white shadow-sm">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="truncate text-[12px] font-bold text-gray-nav">
                  Edited {format(new Date(note.updatedAt), 'MMM d')}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    downloadNoteExport(note, 'md');
                  }}
                  className="control-surface inline-flex h-10 w-10 items-center justify-center text-gray-nav transition-all hover:border-green/25 hover:bg-green/5 hover:text-green"
                  title={`Export ${note.title}`}
                  aria-label={`Export ${note.title}`}
                >
                  <Download size={15} weight="regular" />
                </button>

                <Link
                  to={noteDetailPath}
                  className="inline-flex min-h-10 items-center rounded-[var(--radius-control)] px-2 text-[12px] font-bold text-green transition-all duration-300 hover:bg-green/5 group-hover:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-green/40"
                  aria-label={`Open ${note.title}`}
                >
                  <span>Open</span>
                  <ArrowUpRight
                    size={14}
                    weight="bold"
                    className="ml-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </Link>
              </div>
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
        <PageContainer className="surface-scope-sage pb-14 pt-4 md:pt-8">
          <div className="space-y-10 animate-in fade-in duration-500">
            <SectionHeader
              title="Saved reflections"
              description={
                tagFilter
                  ? `Showing reflections tagged "${tagFilter}".`
                  : 'Cards or calendar — pick how you want to look through them.'
              }
              actions={
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Chip
                      active={viewMode === 'grid'}
                      icon={<SquaresFour size={16} weight="regular" />}
                      onClick={() => setViewMode('grid')}
                      title="Grid view"
                    >
                      Grid
                    </Chip>
                    <Chip
                      active={viewMode === 'calendar'}
                      icon={<CalendarIcon size={16} weight="regular" />}
                      onClick={() => setViewMode('calendar')}
                      title="Calendar view"
                    >
                      Calendar
                    </Chip>
                  </div>

                  <Button onClick={() => navigate(RoutePath.CREATE_NOTE)} variant="primary" className="px-6">
                    <Plus className="mr-2 h-5 w-5" weight="regular" />
                    Create entry
                  </Button>
                </div>
              }
            />

            {tagFilter ? (
              <div className="flex flex-wrap items-center gap-2">
                <Chip as="span" active icon={<Tag size={12} weight="regular" />}>
                  {tagFilter}
                </Chip>
                <Button variant="ghost" size="sm" onClick={() => navigate(RoutePath.NOTES)} className="text-red">
                  <X size={12} weight="regular" className="mr-1" />
                  Clear filter
                </Button>
              </div>
            ) : allTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <Chip
                    key={tag}
                    icon={<Tag size={12} weight="regular" />}
                    onClick={() => navigate(`${RoutePath.NOTES}?tag=${encodeURIComponent(tag as string)}`)}
                  >
                    {tag}
                  </Chip>
                ))}
              </div>
            ) : null}

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
                    <h3 className="text-[14px] font-black text-gray-text flex items-center gap-2">
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
                        title="No entries for this day"
                        description="Choose another date or add a fresh reflection here."
                        action={
                          <Button variant="ghost" size="sm" onClick={() => navigate(RoutePath.CREATE_NOTE)} className="text-green">
                            Create one now
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
                illustration={<DotLottieReact src="/assets/lottie/empty%20notes.json" autoplay loop />}
                title={tagFilter ? `No reflections with “${tagFilter}” yet.` : 'Your library is ready when you are.'}
                description={
                  tagFilter
                    ? 'Clear the filter to return to your full reflection library.'
                    : 'Every entry becomes part of the narrative you can return to later.'
                }
                action={
                  tagFilter ? (
                    <Button onClick={() => navigate(RoutePath.NOTES)} variant="secondary">
                      Clear filter
                    </Button>
                  ) : (
                    <Button onClick={() => navigate(RoutePath.CREATE_NOTE)} variant="primary">
                      Log a reflection
                    </Button>
                  )
                }
              />
            )}
          </div>
        </PageContainer>
      ) : null}

      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={performDelete}
        title="Delete this reflection?"
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete note'}
        isConfirming={isDeleting}
        variant="danger"
      />
    </>
  );
};
