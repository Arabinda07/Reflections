import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  PencilSimple,
  Trash,
  ArrowLeft,
  Calendar,
  Clock,
  WarningCircle,
  Paperclip,
  FileText,
  Download,
  Smiley,
  Tag,
  ListChecks,
  Check,
  Plus,
  X,
} from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { Input } from '../../components/ui/Input';
import { LoadingState } from '../../components/ui/LoadingState';
import { Alert } from '../../components/ui/Alert';
import { MetadataPill } from '../../components/ui/MetadataPill';
import { ModalSheet } from '../../components/ui/ModalSheet';
import { PageContainer } from '../../components/ui/PageContainer';
import { StorageImage } from '../../components/ui/StorageImage';
import { Surface } from '../../components/ui/Surface';
import { noteService } from '../../services/noteService';
import { storageService } from '../../services/storageService';
import { Note, RoutePath, Task } from '../../types';
import { sanitizeNoteHtml } from './noteContent';
import { downloadNoteExport } from './noteExport';
import { MOOD_OPTIONS, getMoodConfig } from './moodConfig';

export const SingleNote: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMoodOpen, setIsMoodOpen] = useState(false);
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [tagDraft, setTagDraft] = useState('');
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
        setError('This reflection could not be loaded right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [id, navigate]);

  const pendingTaskCount = useMemo(
    () => note?.tasks?.filter((task) => !task.completed).length ?? 0,
    [note?.tasks],
  );
  const sanitizedContent = useMemo(() => sanitizeNoteHtml(note?.content ?? ''), [note?.content]);

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
      setError('Something went wrong while deleting this note. Please try again.');
      setIsDeleting(false);
      setIsConfirmOpen(false);
    }
  };

  const handleEdit = () => {
    if (id) {
      navigate(RoutePath.EDIT_NOTE.replace(':id', id));
    }
  };

  const toggleTask = async (taskId: string) => {
    if (!note?.tasks) return;

    const updatedTasks = note.tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task,
    );

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

  const downloadAttachment = async (path: string) => {
    setError(null);
    const popup = window.open('', '_blank', 'noopener,noreferrer');

    try {
      const url = await storageService.getSignedUrl(path);

      if (!url) {
        throw new Error('Missing attachment URL');
      }

      if (popup) {
        popup.opener = null;
        popup.location.href = url;
        return;
      }

      window.location.assign(url);
    } catch (err) {
      popup?.close();
      console.error('Failed to open attachment', err);
      setError('This attachment could not be opened right now. Please try again.');
    }
  };

  const renderTaskRow = (task: Task) => {
    const taskLabel = task.text.trim() || 'untitled task';

    return (
      <div
        key={task.id}
        className={`surface-inline-panel flex items-center gap-3 px-4 py-4 transition-all ${
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
          <div className={`flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-all ${
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
          className={`flex-1 bg-transparent text-[14px] font-bold outline-none ${
            task.completed ? 'text-gray-nav line-through' : 'text-gray-text'
          }`}
        />

        <button
          type="button"
          onClick={() => removeTask(task.id)}
          aria-label={`Remove task: ${taskLabel}`}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] text-gray-nav transition-colors hover:bg-red/5 hover:text-red"
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
        message="A moment while we bring your thoughts back into focus."
        isVisible
      />
    );
  }

  if (!note) return null;
  const noteMoodConfig = getMoodConfig(note.mood);

  return (
    <>
      <PageContainer className="surface-scope-paper pb-20 pt-4 md:pt-8">
        <div className="space-y-8 selection:bg-green/10">
          <div className="sticky-bar !px-2 sm:!px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(RoutePath.NOTES)}
              className="text-gray-nav hover:text-gray-text font-bold text-[12px] !px-2 sm:!px-3"
              aria-label="Go back to my reflections"
            >
              <ArrowLeft className="h-5 w-5 shrink-0 sm:mr-2" weight="bold" />
              <span className="hidden sm:inline">Back</span>
            </Button>

            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => downloadNoteExport(note, 'md')}
                disabled={isDeleting}
                className="shadow-sm hover:border-green/20 hover:bg-green/5 !px-3 sm:!px-4"
                aria-label="Export this reflection"
              >
                <Download weight="bold" className="h-5 w-5 shrink-0 text-green sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={handleEdit}
                disabled={isDeleting}
                className="shadow-sm hover:border-green/20 hover:bg-green/5 !px-3 sm:!px-4"
                aria-label="Edit this reflection"
              >
                <PencilSimple weight="bold" className="h-5 w-5 shrink-0 text-green sm:mr-2" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsConfirmOpen(true)}
                isLoading={isDeleting}
                disabled={isDeleting}
                className="shadow-sm text-red hover:bg-red/5 hover:border-red/30 !px-3 sm:!px-4"
                aria-label="Delete this reflection"
              >
                <Trash weight="bold" className="h-5 w-5 shrink-0 text-red sm:mr-2" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </div>
          </div>

          {error ? (
            <Alert
              variant="error"
              icon={<WarningCircle size={20} weight="fill" />}
              title="Something went off track"
              description={error}
            />
          ) : null}

          <div className="mx-auto max-w-3xl">


            <Surface variant="bezel" tone="paper">
              <article>
                {note.thumbnailUrl ? (
                  <div className="h-64 w-full border-b border-border/40 bg-[var(--surface-current-control-bg)]">
                    <StorageImage path={note.thumbnailUrl} alt={note.title} className="h-full w-full object-cover" />
                  </div>
                ) : null}

                <div className="p-8 md:p-12">
                  <h1 className="h1-hero mb-8 !text-4xl">{note.title}</h1>

                  {note.tags && note.tags.length > 0 ? (
                    <div className="mb-6 flex flex-wrap gap-2">
                      {note.tags.map((tag) => (
                        <Chip
                          key={tag}
                          as="button"
                          active
                          icon={<Tag size={12} weight="bold" />}
                          onClick={() => navigate(`${RoutePath.NOTES}?tag=${encodeURIComponent(tag)}`)}
                        >
                          {tag}
                        </Chip>
                      ))}
                    </div>
                  ) : null}

                  <div className="mb-8 flex flex-wrap items-center gap-3 border-b border-border/40 pb-6">
                    <MetadataPill icon={<Calendar size={14} weight="bold" />}>
                      {new Date(note.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </MetadataPill>

                    <button
                      type="button"
                      onClick={() => setIsMoodOpen(true)}
                      aria-haspopup="dialog"
                      aria-expanded={isMoodOpen}
                      className={`group flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-widest transition-colors ${
                        noteMoodConfig
                          ? noteMoodConfig.selectedOption
                          : 'control-surface text-gray-nav hover:border-green/30 hover:bg-green/5 hover:text-green'
                      }`}
                    >
                      {note.mood ? getMoodIcon(note.mood) : <Smiley size={14} weight="bold" />}
                      <span className="mt-0.5">{note.mood || 'Mood'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsTagsOpen(true)}
                      aria-haspopup="dialog"
                      aria-expanded={isTagsOpen}
                      className="control-surface group flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-widest text-gray-nav transition-colors hover:border-green/30 hover:bg-green/5 hover:text-green"
                    >
                      <Tag size={14} weight="bold" />
                      <span className="mt-0.5">{note.tags?.length || 'Tags'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsTasksOpen(true)}
                      aria-haspopup="dialog"
                      aria-expanded={isTasksOpen}
                      className={`group flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-widest transition-colors ${
                        pendingTaskCount > 0
                          ? 'border-green/30 bg-green/5 text-green'
                          : 'control-surface text-gray-nav hover:border-green/30 hover:bg-green/5 hover:text-green'
                      }`}
                    >
                      <ListChecks size={14} weight="bold" />
                      <span className="mt-0.5">{pendingTaskCount || 'Tasks'}</span>
                    </button>
                  </div>

                  <div
                    className="prose prose-zinc prose-lg max-w-prose mx-auto text-gray-text leading-loose font-serif italic"
                    dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                  />

                  {note.attachments && note.attachments.length > 0 ? (
                    <div className="mt-12 border-t border-border/40 pt-8">
                      <h3 className="mb-4 flex items-center gap-2 text-[13px] font-extrabold text-gray-text">
                        <Paperclip size={16} weight="bold" className="text-gray-nav" />
                        Attachments
                      </h3>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {note.attachments.map((attachment, index) => (
                          <Surface key={index} variant="flat" tone="sky" className="overflow-hidden">
                            <div className="flex items-center gap-3 p-4">
                              <div className="tone-icon tone-icon-sky flex h-10 w-10 shrink-0 rounded-xl text-gray-nav shadow-sm">
                                <FileText size={20} weight="duotone" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-bold text-gray-text">{attachment.name}</p>
                                <p className="text-[11px] font-bold text-gray-nav">
                                  {(attachment.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => downloadAttachment(attachment.path)}
                                className="rounded-[var(--radius-control)] border border-transparent p-2 text-gray-nav transition-colors hover:border-green/20 hover:bg-green/10 hover:text-green"
                                title="Download attachment"
                                aria-label={`Download ${attachment.name}`}
                              >
                                <Download size={16} weight="bold" />
                              </button>
                            </div>
                          </Surface>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </article>
            </Surface>
          </div>
        </div>
      </PageContainer>

      <ModalSheet
        isOpen={isMoodOpen}
        onClose={() => setIsMoodOpen(false)}
        title="Mood"
        size="sm"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {MOOD_OPTIONS.map((moodOption) => {
            const moodConfig = getMoodConfig(moodOption);
            const Icon = moodConfig?.icon || Smiley;

            return (
              <button
                key={moodOption}
                type="button"
                onClick={async () => {
                  await persistNote({ mood: note.mood === moodOption ? undefined : moodOption });
                  setIsMoodOpen(false);
                }}
                className={`flex flex-col items-center rounded-[var(--radius-panel)] border px-4 py-5 transition-all ${
                  note.mood === moodOption ? moodConfig?.selectedOption : moodConfig?.option
                }`}
              >
                <Icon size={16} weight={note.mood === moodOption ? 'fill' : 'regular'} className={`mb-2 ${moodConfig?.labelClass || ''}`} />
                <span className="text-[12px] font-bold">{moodConfig?.label || moodOption}</span>
              </button>
            );
          })}
        </div>
      </ModalSheet>

      <ModalSheet
        isOpen={isTagsOpen}
        onClose={() => setIsTagsOpen(false)}
        title="Reflection tags"
        size="md"
        footer={
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              id="note-tag"
              value={tagDraft}
              onChange={(event) => setTagDraft(event.target.value)}
              placeholder="Add a tag"
              aria-label="Add a tag"
              className="sm:flex-1"
            />
            <Button onClick={addTag} variant="primary" className="sm:min-w-[120px]">
              Add tag
            </Button>
          </div>
        }
      >
        {note.tags && note.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {note.tags.map((tag) => (
              <Chip
                key={tag}
                as="button"
                active
                icon={<Tag size={12} weight="bold" />}
                onClick={() => removeTag(tag)}
                className="pr-3"
                aria-label={`Remove tag: ${tag}`}
              >
                {tag}
                <X size={12} weight="bold" />
              </Chip>
            ))}
          </div>
        ) : (
          <p className="text-[13px] font-medium text-gray-light">
            No tags yet. Add one below to keep this reflection organized.
          </p>
        )}
      </ModalSheet>

      <ModalSheet
        isOpen={isTasksOpen}
        onClose={() => setIsTasksOpen(false)}
        title="Tasks tied to this reflection"
        size="lg"
        footer={
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              id="note-task"
              value={taskDraft}
              onChange={(event) => setTaskDraft(event.target.value)}
              placeholder="Add a task"
              aria-label="Add a task"
              className="sm:flex-1"
            />
            <Button onClick={addTask} variant="primary" className="sm:min-w-[140px]">
              <Plus size={16} weight="bold" className="mr-2" />
              Add task
            </Button>
          </div>
        }
      >
        {note.tasks && note.tasks.length > 0 ? (
          <div className="space-y-3">
            {note.tasks.map(renderTaskRow)}
          </div>
        ) : (
          <p className="text-[13px] font-medium text-gray-light">
            No tasks yet. Add one below if this reflection points to a next step.
          </p>
        )}
      </ModalSheet>

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
