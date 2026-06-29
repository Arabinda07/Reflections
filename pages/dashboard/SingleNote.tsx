import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react/ArrowLeft';
import { Calendar } from '@phosphor-icons/react/Calendar';
import { CaretLeft } from '@phosphor-icons/react/CaretLeft';
import { CaretRight } from '@phosphor-icons/react/CaretRight';
import { Check } from '@phosphor-icons/react/Check';
import { SquaresFour } from '@phosphor-icons/react/SquaresFour';
import { DownloadSimple } from '@phosphor-icons/react/DownloadSimple';
import { FileText } from '@phosphor-icons/react/FileText';
import { ListChecks } from '@phosphor-icons/react/ListChecks';
import { Paperclip } from '@phosphor-icons/react/Paperclip';
import { PencilSimpleLine } from '@phosphor-icons/react/PencilSimpleLine';
import { Plus } from '@phosphor-icons/react/Plus';
import { Smiley } from '@phosphor-icons/react/Smiley';
import { Tag } from '@phosphor-icons/react/Tag';
import { Trash } from '@phosphor-icons/react/Trash';
import { WarningCircle } from '@phosphor-icons/react/WarningCircle';
import { X } from '@phosphor-icons/react/X';
import { Button } from '../../components/ui/Button';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { Alert } from '../../components/ui/Alert';
import { MetadataPill } from '../../components/ui/MetadataPill';
import { ModalSheet } from '../../components/ui/ModalSheet';
import { Tooltip } from '../../components/ui/Tooltip';
import { PageContainer } from '../../components/ui/PageContainer';
import { StorageImage } from '../../components/ui/StorageImage';
import { noteService } from '../../services/noteService';
import { storageService } from '../../services/storageService';
import { useViewTransitionNavigation } from '../../hooks/useViewTransitionNavigation';
import { type Note, type NoteAttachment, RoutePath, type Task } from '../../types';
import { sanitizeNoteHtml } from './noteContent';
import { downloadNoteExport } from './noteExport';
import { getMoodConfig } from './moodConfig';
import { getAdjacent } from './noteAdjacency';
import { MoodPicker, type MoodPickerStage } from './MoodPicker';

export const SingleNote: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useViewTransitionNavigation();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMoodOpen, setIsMoodOpen] = useState(false);
  const [moodPickerStage, setMoodPickerStage] = useState<MoodPickerStage>('group');
  const [isExportSheetOpen, setIsExportSheetOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [tagDraft, setTagDraft] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [taskDraft, setTaskDraft] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchNote = async () => {
      try {
        const data = await noteService.getById(id);
        if (!data) {
          navigate(RoutePath.NOTES);
          return;
        }

        setNote(data);
      } catch (err) {
        console.error('Failed to fetch note', err);
        setError("This note couldn't be loaded right now. Try again in a moment.");
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [id, navigate]);

  // Ordered note ids (createdAt desc) for prev/next — loaded once per visit.
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    noteService
      .getAll()
      .then((all) => {
        if (cancelled) return;
        const ids = [...all]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map((entry) => entry.id);
        setOrderedIds(ids);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const { prevId, nextId } = getAdjacent(orderedIds, id ?? '');
  const goToNote = (targetId: string | null) => {
    if (targetId) navigate(RoutePath.NOTE_DETAIL.replace(':id', targetId));
  };

  const pendingTaskCount = useMemo(
    () => note?.tasks?.filter((task) => !task.completed).length ?? 0,
    [note?.tasks],
  );
  const sanitizedContent = useMemo(() => sanitizeNoteHtml(note?.content ?? ''), [note?.content]);
  const hasAttachments = Boolean(note?.attachments?.length);

  const persistNote = async (updates: Partial<Note>) => {
    if (!note || !id) return;

    const previous = note;
    const next = { ...note, ...updates };
    setNote(next);
    setError(null);

    try {
      await noteService.update(id, updates);
    } catch (err) {
      console.error('Failed to update note:', err);
      setNote(previous);
      setError('We could not save that change. Please try again.');
    }
  };

  const performDelete = async () => {
    if (!id) return;

    setIsDeleting(true);
    setError(null);

    try {
      await noteService.delete(id);
      navigate(RoutePath.NOTES);
    } catch (err) {
      console.error('Failed to delete note:', err);
      setError("That delete didn't go through. Your note is safe — try again.");
      setIsDeleting(false);
      setIsConfirmOpen(false);
    }
  };

  const handleEdit = () => {
    if (id) {
      navigate(RoutePath.EDIT_NOTE.replace(':id', id));
    }
  };

  const downloadMarkdown = () => {
    if (!note) return;

    downloadNoteExport(note, 'md');
    setIsExportSheetOpen(false);
  };

  const handleExportClick = () => {
    if (!note) return;

    if (hasAttachments) {
      setIsExportSheetOpen(true);
      return;
    }

    downloadMarkdown();
  };

  const toggleTask = async (taskId: string) => {
    if (!note?.tasks) return;

    const updatedTasks = note.tasks.map((task) => {
      if (task.id !== taskId) return task;
      const completed = !task.completed;
      return {
        ...task,
        completed,
        completedAt: completed ? new Date().toISOString() : undefined,
      };
    });

    await persistNote({ tasks: updatedTasks });
  };

  const updateTaskText = async (taskId: string, text: string) => {
    if (!note?.tasks) return;

    const updatedTasks = note.tasks.map((task) => (task.id === taskId ? { ...task, text } : task));
    await persistNote({ tasks: updatedTasks });
  };

  const setTaskTextLocal = (taskId: string, text: string) => {
    setNote((previous) => {
      if (!previous?.tasks) return previous;

      return {
        ...previous,
        tasks: previous.tasks.map((task) => (task.id === taskId ? { ...task, text } : task)),
      };
    });
  };

  const removeTask = async (taskId: string) => {
    if (!note?.tasks) return;

    await persistNote({ tasks: note.tasks.filter((task) => task.id !== taskId) });
  };

  const addTask = async () => {
    if (!taskDraft.trim()) return;

    const nextTask: Task = {
      id: crypto.randomUUID(),
      text: taskDraft.trim(),
      completed: false,
    };

    await persistNote({ tasks: [...(note?.tasks || []), nextTask] });
    setTaskDraft('');
  };

  const addTag = async () => {
    if (!tagDraft.trim()) return;

    const cleanTag = tagDraft.trim().replace(/^#/, '');
    const nextTags = Array.from(new Set([...(note?.tags || []), cleanTag]));
    await persistNote({ tags: nextTags });
    setTagDraft('');
  };

  const removeTag = async (tagToRemove: string) => {
    await persistNote({ tags: (note?.tags || []).filter((tag) => tag !== tagToRemove) });
  };

  const getMoodIcon = (mood?: string) => {
    const moodConfig = getMoodConfig(mood);
    if (!moodConfig) return null;
    const Icon = moodConfig.icon;

    return <Icon size={16} weight="fill" className={moodConfig.labelClass} />;
  };

  const downloadAttachment = async (attachment: NoteAttachment) => {
    setError(null);

    try {
      const url = await storageService.getSignedUrl(attachment.path);

      if (!url) {
        throw new Error('Missing attachment URL');
      }

      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.name;
      link.rel = 'noopener';
      link.click();
      if (url.startsWith('blob:')) window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (err) {
      console.error('Failed to open attachment', err);
      setError('This attachment could not be opened right now. Please try again.');
    }
  };

  const renderTaskRow = (task: Task) => {
    const taskLabel = task.text.trim() || 'untitled task';

    return (
      <div
        key={task.id}
        className={`surface-inline-panel flex items-center gap-3 px-4 py-4 transition-colors ${
          task.completed
            ? 'border-green/20 bg-green/5'
            : 'hover:border-green/20'
        }`}
      >
        <button
          type="button"
          onClick={() => toggleTask(task.id)}
          aria-label={task.completed ? `Mark "${taskLabel}" as open` : `Mark "${taskLabel}" as complete`}
          className="group relative flex h-11 w-11 shrink-0 items-center justify-center"
        >
          <div className={`flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-colors ${
            task.completed ? 'border-green bg-green text-white' : 'border-border text-transparent group-hover:border-green/40'
          }`}>
            <Check size={14} weight="bold" />
          </div>
        </button>

        <input
          type="text"
          value={task.text}
          onChange={(event) => setTaskTextLocal(task.id, event.target.value)}
          onBlur={(event) => updateTaskText(task.id, event.target.value)}
          aria-label={`Edit task: ${taskLabel}`}
          className={`flex-1 bg-transparent text-sm font-bold outline-none ${
            task.completed ? 'text-gray-nav line-through' : 'text-gray-text'
          }`}
        />

        <button
          type="button"
          onClick={() => removeTask(task.id)}
          aria-label={`Remove task: ${taskLabel}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-gray-nav transition-colors hover:bg-clay/5 hover:text-clay"
        >
          <Trash size={16} weight="bold" />
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <LoadingState
        title="Opening your reflection..."
        isVisible
      />
    );
  }

  if (!note) return null;
  const noteMoodConfig = getMoodConfig(note.mood);
  const noteAttachments = note.attachments || [];

  const fullDate = new Date(note.createdAt).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const navButtonClass =
    'flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] text-gray-nav transition-colors hover:bg-green/5 hover:text-green disabled:pointer-events-none disabled:opacity-30';

  return (
    <>
      <PageContainer className="surface-scope-paper page-wash pb-24 pt-6 md:pt-10">
          {/* Top row — Back (matches Insights) + prev/next only */}
          <div className="mb-8 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => navigate(RoutePath.NOTES)}
              className="group flex min-h-11 w-fit items-center gap-2 rounded-[var(--radius-control)] px-2 text-sm font-bold text-gray-nav transition-[color,transform,background-color] duration-300 hover:-translate-x-1 hover:bg-green/5 hover:text-green"
              aria-label="Go back to my reflections"
            >
              <ArrowLeft size={16} weight="bold" className="transition-transform group-hover:scale-110" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-1">
              <Tooltip label="Older entry" placement="bottom">
                <button
                  type="button"
                  onClick={() => goToNote(prevId)}
                  disabled={!prevId}
                  aria-label="Older entry"
                  className={navButtonClass}
                >
                  <CaretLeft size={18} weight="bold" />
                </button>
              </Tooltip>
              <Tooltip label="Newer entry" placement="bottom">
                <button
                  type="button"
                  onClick={() => goToNote(nextId)}
                  disabled={!nextId}
                  aria-label="Newer entry"
                  className={navButtonClass}
                >
                  <CaretRight size={18} weight="bold" />
                </button>
              </Tooltip>
              <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
              <Tooltip label="Actions" placement="bottom">
                <button
                  type="button"
                  onClick={() => setIsActionsOpen(true)}
                  aria-haspopup="dialog"
                  aria-expanded={isActionsOpen}
                  aria-label="Note actions"
                  className={navButtonClass}
                >
                  <SquaresFour size={20} weight="bold" />
                </button>
              </Tooltip>
            </div>
          </div>

          <div aria-live="polite">
            {error ? (
              <Alert
                variant="error"
                icon={<WarningCircle size={20} weight="fill" />}
                title="Something went off track"
                description={error}
                className="mb-8"
              />
            ) : null}
          </div>

          <article className="max-w-[var(--measure-wide)] selection:bg-green/10">
                {note.thumbnailUrl ? (
                  <div className="mb-10 overflow-hidden rounded-[var(--radius-panel)] border border-border/40">
                    <StorageImage path={note.thumbnailUrl} alt={note.title} className="h-64 w-full object-cover" />
                  </div>
                ) : null}

                {/* Date-led header */}
                <header className="mb-8">
                  <div className="mb-4 flex flex-wrap items-center gap-2.5">
                    <MetadataPill icon={<Calendar size={14} weight="bold" />}>{fullDate}</MetadataPill>
                    <button
                      type="button"
                      onClick={() => setIsMoodOpen(true)}
                      aria-haspopup="dialog"
                      aria-expanded={isMoodOpen}
                      className={`group flex items-center gap-1.5 rounded-full border px-2.5 py-1 label-caps transition-colors ${
                        noteMoodConfig
                          ? noteMoodConfig.selectedOption
                          : 'control-surface text-gray-nav hover:border-green/30 hover:bg-green/5 hover:text-green'
                      }`}
                    >
                      {note.mood ? getMoodIcon(note.mood) : <Smiley size={14} weight="bold" />}
                      <span className="mt-0.5">{noteMoodConfig?.label || note.mood || 'Add mood'}</span>
                    </button>
                  </div>

                  <h1 className="font-serif text-[2.25rem] font-semibold leading-[1.12] text-gray-text text-balance sm:text-[2.75rem]">
                    {note.title || 'Untitled reflection'}
                  </h1>

                  {/* Inline tags — add expands on click */}
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    {(note.tags || []).map((tag) => (
                      <span key={tag} className="chip-filter chip-filter--active inline-flex items-center gap-1.5 !pr-1.5">
                        <Tag size={12} weight="bold" />
                        <span className="chip-filter-label">{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          aria-label={`Remove tag ${tag}`}
                          className="flex h-5 w-5 items-center justify-center rounded-full text-gray-nav transition-colors hover:bg-clay/10 hover:text-clay"
                        >
                          <X size={11} weight="bold" />
                        </button>
                      </span>
                    ))}
                    {isAddingTag ? (
                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          void addTag();
                        }}
                        className="inline-flex items-center duration-200 animate-in fade-in slide-in-from-left-2 motion-reduce:animate-none"
                      >
                        <input
                          autoFocus
                          value={tagDraft}
                          onChange={(event) => setTagDraft(event.target.value)}
                          onBlur={() => {
                            if (!tagDraft.trim()) setIsAddingTag(false);
                          }}
                          placeholder="Add tag"
                          aria-label="Add a tag"
                          className="input-surface min-h-9 w-32 rounded-full px-3 text-btn-sm font-bold text-gray-text placeholder:text-gray-nav"
                        />
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAddingTag(true)}
                        className="inline-flex min-h-9 items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-ui-xs font-bold text-gray-nav transition-colors hover:border-green/40 hover:bg-green/5 hover:text-green"
                      >
                        <Plus size={12} weight="bold" />
                        Add tag
                      </button>
                    )}
                  </div>
                </header>

                <div
                  className="dashboard-prose prose prose-zinc prose-lg"
                  dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                />

                {/* Attachments */}
                {noteAttachments.length > 0 ? (
                  <section className="mt-12">
                    <h2 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-gray-text">
                      <Paperclip size={16} weight="bold" className="text-gray-nav" />
                      Attachments
                    </h2>
                    <ul className="space-y-1">
                      {noteAttachments.map((attachment, index) => (
                        <li key={attachment.id || attachment.path || index} className="flex items-center gap-3 py-3">
                          <span className="tone-icon tone-icon-sky flex h-10 w-10 shrink-0 rounded-xl text-gray-nav">
                            <FileText size={20} weight="duotone" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-gray-text">{attachment.name}</p>
                            <p className="text-xs font-bold text-gray-nav">{(attachment.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => downloadAttachment(attachment)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-gray-nav transition-colors hover:bg-green/10 hover:text-green"
                            title="Download attachment"
                            aria-label={`Download ${attachment.name}`}
                          >
                            <DownloadSimple size={16} weight="bold" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
          </article>
      </PageContainer>

      <ModalSheet
        isOpen={isExportSheetOpen}
        onClose={() => setIsExportSheetOpen(false)}
        title="Export this reflection"
        description="Download the Markdown note, or choose an attachment to download separately."
        ariaLabel="Choose what to export from this reflection"
        size="md"
      >
        <div className="space-y-5">
          <button
            type="button"
            onClick={downloadMarkdown}
            className="surface-inline-panel flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:border-green/20 hover:bg-green/5"
          >
            <DownloadSimple size={20} weight="regular" className="flex-none text-green" />
            <span className="min-w-0">
              <span className="block text-sm font-extrabold text-gray-text">Download Markdown</span>
              <span className="block text-xs font-bold text-gray-nav">Save the written note as a .md file.</span>
            </span>
          </button>

          <div className="space-y-3">
            <p className="label-caps text-gray-nav">Choose an attachment to download</p>
            {noteAttachments.map((attachment) => (
              <button
                key={attachment.id || attachment.path}
                type="button"
                onClick={() => {
                  void downloadAttachment(attachment);
                  setIsExportSheetOpen(false);
                }}
                className="surface-inline-panel flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:border-green/20 hover:bg-green/5"
                aria-label={`Download attachment: ${attachment.name}`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <FileText size={20} weight="regular" className="flex-none text-gray-nav" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-extrabold text-gray-text">{attachment.name}</span>
                    <span className="block text-xs font-bold text-gray-nav">
                      {(attachment.size / 1024).toFixed(1)} KB
                    </span>
                  </span>
                </span>
                <DownloadSimple size={16} weight="bold" className="shrink-0 text-green" />
              </button>
            ))}
          </div>
        </div>
      </ModalSheet>

      <ModalSheet
        isOpen={isActionsOpen}
        onClose={() => setIsActionsOpen(false)}
        title="Note actions"
        icon={<SquaresFour size={22} weight="duotone" />}
        ariaLabel="Choose an action for this reflection"
        size="sm"
      >
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              setIsActionsOpen(false);
              handleEdit();
            }}
            className="surface-inline-panel flex min-h-11 w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:border-green/20 hover:bg-green/5"
          >
            <PencilSimpleLine size={20} weight="regular" className="flex-none text-green" />
            <span className="text-sm font-extrabold text-gray-text">Edit</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsActionsOpen(false);
              handleExportClick();
            }}
            aria-label="Export this reflection"
            className="surface-inline-panel flex min-h-11 w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:border-green/20 hover:bg-green/5"
          >
            <DownloadSimple size={20} weight="regular" className="flex-none text-green" />
            <span className="text-sm font-extrabold text-gray-text">Export</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsActionsOpen(false);
              setIsTasksOpen(true);
            }}
            className="surface-inline-panel flex min-h-11 w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:border-green/20 hover:bg-green/5"
          >
            <span className="flex items-center gap-3">
              <ListChecks size={20} weight="regular" className="flex-none text-honey" />
              <span className="text-sm font-extrabold text-gray-text">Tasks</span>
            </span>
            {pendingTaskCount > 0 ? <span className="label-caps text-green">{pendingTaskCount} open</span> : null}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsActionsOpen(false);
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
        isOpen={isTasksOpen}
        onClose={() => setIsTasksOpen(false)}
        title="Tasks"
        icon={<ListChecks size={22} weight="duotone" />}
        ariaLabel="Tasks for this reflection"
        size="md"
        footer={
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void addTask();
            }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <Input
              id="note-task"
              value={taskDraft}
              onChange={(event) => setTaskDraft(event.target.value)}
              placeholder="Add a task"
              aria-label="Add a task"
              className="sm:flex-1"
            />
            <Button type="submit" variant="primary" className="sm:min-w-[140px]">
              <Plus size={16} weight="bold" className="mr-2" />
              Add task
            </Button>
          </form>
        }
      >
        {note.tasks && note.tasks.length > 0 ? (
          <div className="space-y-3">{note.tasks.map(renderTaskRow)}</div>
        ) : (
          <p className="text-sm font-medium text-gray-light">No associated tasks</p>
        )}
      </ModalSheet>

      <ModalSheet
        isOpen={isMoodOpen}
        onClose={() => {
          setMoodPickerStage('group');
          setIsMoodOpen(false);
        }}
        title={moodPickerStage === 'group' ? 'How does it feel right now?' : undefined}
        description={moodPickerStage === 'group' ? 'Pick a broad mood. Details are optional.' : undefined}
        ariaLabel="Choose a mood for this reflection"
        size="sm"
        panelClassName={`modal-sheet-panel--compact ${moodPickerStage === 'detail' ? 'modal-sheet-panel--mood-detail' : ''}`.trim()}
        bodyClassName={`modal-sheet-body--compact ${moodPickerStage === 'detail' ? 'modal-sheet-body--mood-detail' : ''}`.trim()}
      >
        <MoodPicker
          selectedMood={note.mood}
          onStageChange={setMoodPickerStage}
          onSelect={async (nextMood) => {
            await persistNote({ mood: nextMood });
            setMoodPickerStage('group');
            setIsMoodOpen(false);
          }}
        />
      </ModalSheet>

      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={performDelete}
        title="Delete this note?"
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete note'}
        isConfirming={isDeleting}
        variant="danger"
      />
    </>
  );
};
