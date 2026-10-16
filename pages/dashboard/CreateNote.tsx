import React, { Suspense, lazy, useState, useEffect, useCallback, useRef, useDeferredValue, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react/ArrowLeft';
import { CalendarBlank } from '@phosphor-icons/react/CalendarBlank';
import { Check } from '@phosphor-icons/react/Check';
import { CircleNotch } from '@phosphor-icons/react/CircleNotch';
import { SquaresFour } from '@phosphor-icons/react/SquaresFour';
import { FloppyDisk } from '@phosphor-icons/react/FloppyDisk';
import { Headphones } from '@phosphor-icons/react/Headphones';
import { Sparkle } from '@phosphor-icons/react/Sparkle';
import { Tag } from '@phosphor-icons/react/Tag';
import { Image as ImageIcon } from '@phosphor-icons/react/Image';
import { Paperclip } from '@phosphor-icons/react/Paperclip';
import { Smiley } from '@phosphor-icons/react/Smiley';
import { Tag as TagIcon } from '@phosphor-icons/react/Tag';
import { Target } from '@phosphor-icons/react/Target';
import { UsersThree } from '@phosphor-icons/react/UsersThree';
import { Wind } from '@phosphor-icons/react/Wind';
import { X } from '@phosphor-icons/react/X';
import { Plus } from '@phosphor-icons/react/Plus';
import { useAmbientAudio, AMBIENT_TRACKS } from '../../hooks/useAmbientAudio';
import { useHaptics } from '../../hooks/useHaptics';
import { useSound } from '../../hooks/useSound';
import { Button } from '../../components/ui/Button';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { Editor, EditorRef } from '../../components/ui/Editor';
import { RoutePath } from '../../types';
import { ModalSheet } from '../../components/ui/ModalSheet';
import { WhisperComposerControl, appendTranscriptToHtml } from '../../components/ui/WhisperComposerControl';
import { InlineLoadingBadge } from '../../components/ui/InlineLoadingBadge';
import { DEFAULT_WELLNESS_PROMPTS, getCurrentWellnessPrompt, getNextWellnessPromptState } from '../../services/wellnessPrompts';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useNoteDraft } from '../../hooks/useNoteDraft';
import { canNavigateBackInApp } from '../../src/native/androidBack';
// Android shell safe area contract markers: NATIVE_TOP_CONTROL_OFFSET, NATIVE_PAGE_TOP_PADDING
import { ProUpgradeCTA } from '../../components/ui/ProUpgradeCTA';
import { embeddingService } from '../../services/embedding/embeddingService';
import { vectorStore } from '../../services/embedding/vectorStore';
import { noteService } from '../../services/noteService';
import { stripHtml } from '../../services/collectionUtils';
import { untaggedMentions } from '../../services/relationshipWikiLink';
import { relationshipService } from '../../services/relationshipService';
import type { RelationshipRecord } from '../../types';
import { getMoodConfig } from './moodConfig';
import { MoodPicker, type MoodPickerStage } from './MoodPicker';
import { detectEmotionalDissonance } from '../../services/moodIntelligence';

const PaperPlaneToast = lazy(() => import('../../components/ui/PaperPlaneToast')
  .then((module) => ({ default: module.PaperPlaneToast })));


const getSurfaceScopeForMood = (_mood?: string) => {
  return 'surface-scope-sage';
};

// On-device tag suggestions: most frequent tags on the nearest notes, minus ones already applied.
const suggestTagsFromSimilarNotes = async (content: string, existingTags: string[]): Promise<string[]> => {
  try {
    const matches = await vectorStore.findSimilar(await embeddingService.embedQuery(stripHtml(content)), 8);
    const notes = await Promise.all(matches.map((match) => noteService.getById(match.noteId)));
    const counts = new Map<string, number>();
    for (const tag of notes.flatMap((note) => note?.tags ?? [])) {
      if (!existingTags.includes(tag)) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([tag]) => tag);
  } catch {
    return [];
  }
};


export const CreateNote: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialPrompt = location.state?.initialPrompt;

  const initialContent =
    typeof location.state?.initialContent === 'string' ? location.state.initialContent : '';

  // â”€â”€ Core draft lifecycle (state, save, release, navigation blocking) â”€â”€
  const draft = useNoteDraft();
  const hasAppliedInitialContentRef = useRef(false);
  const initialRelationshipIds: string[] = Array.isArray(location.state?.relationshipIds) ? location.state.relationshipIds : [];
  const hasAppliedInitialPeopleRef = useRef(false);

  // â”€â”€ Focus/flow mode â”€â”€
  const [isFocused, setIsFocused] = useState(false);
  const [isTitleFocused, setIsTitleFocused] = useState(false);

  const appendWhisperTranscript = useCallback((text: string) => {
    draft.setContent((prev: string) => appendTranscriptToHtml(prev, text));
  }, [draft.setContent]);

  // â”€â”€ UI-local state (modals, editor chrome) â”€â”€
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const [tagInput, setTagInput] = useState('');
  const canReflect = false;
  const [isReflectProOpen, setIsReflectProOpen] = useState(false);
  if (canReflect && isReflectProOpen) {
    setIsReflectProOpen(false);
  }
  const [activePlaceholder, setActivePlaceholder] = useState<string | null>(
    initialPrompt || getCurrentWellnessPrompt(0, DEFAULT_WELLNESS_PROMPTS),
  );
  const [promptIndex, setPromptIndex] = useState(0);
  const [relationships, setRelationships] = useState<RelationshipRecord[]>([]);
  const [isPeoplePickerOpen, setIsPeoplePickerOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isMoodOpen, setIsMoodOpen] = useState(false);
  const [moodPickerStage, setMoodPickerStage] = useState<MoodPickerStage>('group');
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isMusicOpen, setIsMusicOpen] = useState(false);
  const [isSaveChoiceOpen, setIsSaveChoiceOpen] = useState(false);
  const [releaseError, setReleaseError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [releaseSuccess, setReleaseSuccess] = useState<string | null>(null);
  const [pendingTrackId, setPendingTrackId] = useState<string | null>(null);
  const [showPlane, setShowPlane] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  const { isPlaying: musicPlaying, activeTrack: activeMusicTrack, playTrack: playMusicTrack, stopAll: stopMusic } = useAmbientAudio();
  const haptics = useHaptics();
  const { playSaveChime, playPageTurn } = useSound();
  const ActiveMoodIcon = getMoodConfig(draft.mood)?.icon || Smiley;
  const editorInstanceRef = useRef<EditorRef>(null);
  const isUnmounted = useRef(false);

  useEffect(() => {
    isUnmounted.current = false;
    let active = true;
    void relationshipService.getAll().then((list) => {
      if (active) setRelationships(list.filter((r) => r.stage !== 'archived'));
    }).catch(() => {});
    return () => {
      isUnmounted.current = true;
      active = false;
    };
  }, []);

  // Open straight onto the page: no entrance, cursor ready for a new entry.
  const hasOpenedRef = useRef(false);
  useEffect(() => {
    if (draft.loading || hasOpenedRef.current) return;
    hasOpenedRef.current = true;
    playPageTurn();
    if (!draft.restoredDraft || !draft.title) editorInstanceRef.current?.focus();
  }, [draft.loading, draft.restoredDraft, draft.title, playPageTurn]);



  useEffect(() => {
    return () => {
      stopMusic();
    };
  }, [stopMusic]);

  useEffect(() => {
    if (hasAppliedInitialContentRef.current || !initialContent.trim()) return;
    hasAppliedInitialContentRef.current = true;
    draft.setContent((previous: string) => appendTranscriptToHtml(previous, initialContent));
  }, [draft.setContent, initialContent]);

  // Arriving from "Write about Sam" starts the page already about Sam.
  useEffect(() => {
    if (draft.loading || hasAppliedInitialPeopleRef.current || initialRelationshipIds.length === 0) return;
    hasAppliedInitialPeopleRef.current = true;
    draft.setRelationshipIds((previous) => Array.from(new Set([...previous, ...initialRelationshipIds])));
  }, [draft.loading, draft.setRelationshipIds, initialRelationshipIds]);

  // Aliases from draft hook for template readability
  const { title, setTitle, content, setContent, mood, setMood, tags, setTags, relationshipIds, setRelationshipIds } = draft;
  const { imagePreview, setImagePreview, saving, releasing: isReleasing, canCreateNote, setCanCreateNote } = draft;

  // Quietly notice known people named in the draft; one tap links them.
  const deferredDraftText = useDeferredValue(`${title}\n${content}`);
  const mentionedPeople = useMemo(
    () => untaggedMentions({ content: deferredDraftText }, relationships, relationshipIds).slice(0, 3),
    [deferredDraftText, relationships, relationshipIds],
  );
  const { blocker, navigateWithBypass } = draft;
  const id = undefined as string | undefined; // id is read internally by useNoteDraft via useParams

  const [dissonancePrompt, setDissonancePrompt] = useState<string | null>(null);

  useEffect(() => {
    if (!mood || !content) {
      setDissonancePrompt(null);
      return;
    }
    let cancelled = false;
    void detectEmotionalDissonance(content, mood).then((res) => {
      if (!cancelled) {
        setDissonancePrompt(res.hasDissonance ? res.prompt : null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [mood, content]);


  const handleMobileBack = useCallback(() => {
    stopMusic();
    if (
      typeof window !== 'undefined' &&
      canNavigateBackInApp(
        window.history.state as { idx?: unknown } | null,
        window.history.length,
      )
    ) {
      navigate(-1);
      return;
    }
    navigate(RoutePath.NOTES);
  }, [navigate, stopMusic]);

  // ── On-device tag suggestions when tags modal opens ──
  useEffect(() => {
    if (!isTagsOpen) {
      setSuggestedTags([]);
      return;
    }
    if (!content || content === '<p><br></p>') return;

    let active = true;
    setIsLoadingSuggestions(true);
    void suggestTagsFromSimilarNotes(content, tags).then((suggestions) => {
      if (!active) return;
      setSuggestedTags(suggestions);
      setIsLoadingSuggestions(false);
    });
    return () => { active = false; };
  }, [isTagsOpen, content, tags]);

  // Blocker ── leave dialog sync
  // Leaving saves, like a notebook closing. Only a failed save asks anything;
  // the writing is already kept (encrypted) on this device either way.
  const saveRef = useRef(draft.save);
  saveRef.current = draft.save;
  const blockerRef = useRef(blocker);
  blockerRef.current = blocker;
  useEffect(() => {
    if (blocker.state !== 'blocked') {
      if (blocker.state === 'unblocked') setShowLeaveDialog(false);
      return;
    }
    void saveRef.current().then((result) => {
      if (isUnmounted.current || blockerRef.current.state !== 'blocked') return;
      if (result.success) {
        stopMusic();
        blockerRef.current.proceed?.();
      } else {
        setShowLeaveDialog(true);
      }
    });
  }, [blocker.state, stopMusic]);

  // â”€â”€ Save handler (delegates to draft.save, adds UI feedback) â”€â”€
  const handleSave = async () => {
    if (!draft.currentSnapshot.title && !draft.currentSnapshot.content) return;

    setSaveError(null);
    setIsSaveChoiceOpen(false);
    setShowPlane(true);

    const result = await draft.save();

    if (isUnmounted.current) return;
    setShowPlane(false);

    if (!result.success) {
      // The publish stalled or failed. The draft is intact — keep the writer on
      // the page (never navigate away) and surface a retry instead of silently
      // dropping their writing and attachments.
      setSaveError('We couldn’t finish saving just now. Check your connection and try again — your writing is still here.');
      setIsSaveChoiceOpen(true);
      return;
    }

    haptics.confirming();
    playSaveChime();

    stopMusic();
    navigateWithBypass(RoutePath.DASHBOARD, { state: { fromSave: true } });
  };

  // â”€â”€ Release handler â”€â”€
  const handleReleaseDraft = async () => {
    if (!draft.currentSnapshot.title && !draft.currentSnapshot.content) return;
    setReleaseError(null);

    const error = await draft.release();
    if (error) {
      setReleaseError(error);
    } else {
      setReleaseSuccess('Released.');
      setTimeout(() => {
        setIsSaveChoiceOpen(false);
        setReleaseSuccess(null);
        stopMusic();
        navigateWithBypass(RoutePath.DASHBOARD, { state: { fromSave: true } });
      }, 1500);
    }
  };

  // First-ever save goes straight to a plain Save; the Save-vs-Release choice
  // only appears once the writer has saved before, so note one isn't a quiz.
  // ponytail: global flag (not per-user), set before save resolves; per-user
  // tracking only if shared-browser onboarding becomes a real concern.
  const handleSaveFabClick = () => {
    setReleaseError(null);
    setSaveError(null);

    let hasSavedBefore = false;
    try {
      hasSavedBefore = localStorage.getItem('reflections-save-choice-seen') === '1';
    } catch {
      // ignore storage access errors
    }

    if (!hasSavedBefore) {
      try {
        localStorage.setItem('reflections-save-choice-seen', '1');
      } catch {
        // Best-effort; if storage is blocked just fall through to a plain save.
      }
      void handleSave();
      return;
    }

    setIsSaveChoiceOpen(true);
  };

  const cycleSparkPrompt = () => {
    const nextState = getNextWellnessPromptState(promptIndex, DEFAULT_WELLNESS_PROMPTS);
    setPromptIndex(nextState.nextIndex);
    setActivePlaceholder(nextState.prompt);
  };

  const handleStopMusic = useCallback(() => {
    setPendingTrackId(null);
    stopMusic();
  }, [stopMusic]);

  const handleTrackSelect = useCallback(
    async (track: (typeof AMBIENT_TRACKS)[number]) => {
      if (pendingTrackId) return;
      if (activeMusicTrack?.id === track.id) {
        handleStopMusic();
        return;
      }
      setPendingTrackId(track.id);
      try {
        await playMusicTrack(track);
      } finally {
        if (!isUnmounted.current) {
          setPendingTrackId((current) => (current === track.id ? null : current));
        }
      }
    },
    [activeMusicTrack?.id, handleStopMusic, pendingTrackId, playMusicTrack],
  );

  // Derived values
  const hasContent = Boolean(draft.currentSnapshot.content);
  const wordCount = React.useMemo(() => {
    return draft.currentSnapshot.content.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length;
  }, [draft.currentSnapshot.content]);
  // While words are flowing, the chrome steps back (opacity only, no layout
  // shift). It returns the moment the writer pauses and taps away.
  const isWritingQuiet = isFocused && !isTitleFocused && wordCount > 0;


  const handleStayOnDraft = () => {
    setShowLeaveDialog(false);
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
   };
  const handleLeaveDraft = () => {
    setShowLeaveDialog(false);
    if (blocker.state === 'blocked') {
      stopMusic();
      draft.discardDraft();
      blocker.proceed();
    }
  };







  if (!id && !canCreateNote) {
    return (
      <div className="surface-scope-paper page-wash relative flex flex-1 min-h-dvh bg-body">
        <ProUpgradeCTA variant="fullscreen" onSuccess={() => setCanCreateNote(true)} />
      </div>
    );
  }

  return (
    <>
      <div className={`${getSurfaceScopeForMood(mood)} page-wash relative flex-1 flex min-h-0 bg-body overflow-hidden`}>
      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Mobile Back Button Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <button
        onClick={handleMobileBack}
        className={`surface-floating fixed left-4 z-floating flex h-11 w-11 items-center justify-center rounded-control transition hover:text-green top-[var(--native-top-control-offset)] lg:left-8 ${isWritingQuiet ? 'pointer-events-none opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}`}
        aria-label="Back to notes"
      >
        <ArrowLeft size={20} weight="regular" />
      </button>

      {/* Main Canvas */}
      <section
        aria-labelledby="create-note-heading"
        className="relative flex-1 w-full pb-40 px-6 sm:px-12 md:px-16 lg:px-24 pt-[var(--native-page-top-padding)]"
      >
        <h1 id="create-note-heading" className="sr-only">New reflection</h1>
        <div className="editor-writing-measure mx-auto">
          
          {/* Cover Image */}
          {imagePreview && (
            <div className="surface-flat group relative mb-12 w-full aspect-[21/9] overflow-hidden rounded-4xl">
              <img src={imagePreview} alt="" aria-hidden="true" className="w-full h-full object-cover" />
              <button
                onClick={() => setImagePreview(null)}
                className="surface-floating surface-floating--media absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-control opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                aria-label="Remove cover image"
              >
                <X size={20} weight="regular" />
              </button>
            </div>
          )}

          {/* Eyebrow Date */}
          <div className={`mb-6 flex flex-wrap items-center gap-2 transition-opacity duration-500 ${isWritingQuiet ? 'opacity-30 focus-within:opacity-100 hover:opacity-100' : 'opacity-100'}`}>
            <span className="label-caps flex items-center gap-2 rounded-full bg-green/10 px-3 py-1 text-green">
              <CalendarBlank size={12} weight="regular" />
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}
            </span>
            <button
              type="button"
              onClick={() => setIsPeoplePickerOpen(true)}
              className={`inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 label-caps transition-colors sm:px-3 ${
                relationshipIds.length > 0
                  ? 'bg-green/10 text-green border border-green/20'
                  : 'control-surface text-gray-text hover:bg-green/10 hover:text-green'
              }`}
              aria-label="Add or view people in this reflection"
            >
              <UsersThree size={14} weight={relationshipIds.length > 0 ? 'fill' : 'bold'} />
              <span>
                {relationshipIds.length === 0
                  ? 'With...'
                  : relationshipIds.length === 1
                  ? `With ${relationships.find((r) => r.id === relationshipIds[0])?.name || 'Someone'}`
                  : `With ${relationshipIds.length} people`}
              </span>
            </button>
            {mentionedPeople.map((person) => (
              <button
                key={person.id}
                type="button"
                onClick={() => setRelationshipIds((previous) => [...previous, person.id])}
                className="inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-full border border-dashed border-green/30 px-3 py-2 text-ui-xs font-bold text-green transition-colors hover:bg-green/10 animate-fade-in"
                aria-label={`Add ${person.name} to this reflection`}
              >
                <Plus size={12} weight="bold" />
                {person.name}
              </button>
            ))}
          </div>

          {dissonancePrompt ? (
            <div className="mb-4 flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-surface-muted/60 p-4 text-xs text-gray-text animate-fade-in">
              <div className="space-y-1">
                <p className="font-bold text-gray-nav" title="A reflection, not a verdict">Gentle reflection</p>
                <p className="leading-relaxed text-gray-text/90 font-serif italic text-sm">{dissonancePrompt}</p>
              </div>
              <button
                type="button"
                onClick={() => setDissonancePrompt(null)}
                className="text-xs font-bold text-gray-nav hover:text-gray-text shrink-0 cursor-pointer"
                aria-label="Dismiss gentle reflection"
              >
                Dismiss
              </button>
            </div>
          ) : null}

          {/* Reflection title field */}
          <input
            type="text"
            aria-label="Reflection title"
            placeholder="Untitled Reflection"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onFocus={() => { setIsFocused(true); setIsTitleFocused(true); }}
            onBlur={() => { setIsFocused(false); setIsTitleFocused(false); }}
            className="editor-title-input min-h-11"
          />

          <Editor 
            ref={editorInstanceRef} 
            value={content} 
            onChange={setContent} 
            onFocusChange={(nextIsFocused) => {
              setIsFocused(nextIsFocused);
            }}
            placeholder={activePlaceholder || "What's on your mind?"} 
            ariaLabel="Reflection body"
            className="text-xl md:text-2xl font-serif leading-relaxed text-gray-text/90" 
          />

          {draft.restoredDraft && (
            <p className="mt-2 text-ui-xs font-medium text-gray-nav/60 select-none" role="status">
              Picked up where you left off.
            </p>
          )}

          {/* Word count, shown only after 50+ words */}
          {wordCount >= 50 && (
            <p className="mt-2 text-right text-ui-xs font-medium text-gray-nav/40 select-none" aria-label={`${wordCount} words`}>
              {wordCount} words
            </p>
          )}
        </div>
      </section>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Floating Actions Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <div 
        className={`fixed z-50 flex gap-4 transition-[opacity,transform] duration-700 ease-out-expo ${isMobile ? 'bottom-[calc(2rem+env(safe-area-inset-bottom))] left-6 right-6 justify-between' : 'bottom-10 right-10 flex-col'} ${isWritingQuiet ? (isMobile ? 'pointer-events-none opacity-0 translate-y-8' : 'opacity-30 hover:opacity-100') : 'opacity-100 translate-y-0'}`}
      >
        
        <button
          onClick={() => setIsOptionsOpen(true)}
          className="surface-floating group relative flex h-16 w-16 items-center justify-center rounded-full hover:text-green"
          aria-label="Open reflection options"
        >
          <SquaresFour size={24} weight="fill" className="opacity-80" />
        </button>

        {/* Interchangeable Action FAB: cycles prompts while empty, becomes Save once you write */}
          {!hasContent ? (
            <button
              key="spark-fab"
              onClick={cycleSparkPrompt}
              className="surface-floating group relative flex h-16 items-center gap-2.5 rounded-full px-6 text-green transition-transform hover:scale-102 active:scale-98"
              aria-label="Show another writing prompt"
            >
              <Target size={24} weight="fill" className="shrink-0" />
              <span className="text-ui-sm font-bold">New prompt</span>
            </button>
          ) : (
            <button
              key="save-fab"
              onClick={handleSaveFabClick}
              disabled={saving || isReleasing}
              className="group relative flex h-16 items-center gap-2.5 rounded-full bg-green px-7 text-white shadow-floating transition-transform hover:scale-102 active:scale-98 disabled:opacity-90"
              aria-label="Save or release this reflection"
            >
              {saving || isReleasing ? (
                <CircleNotch size={24} className="relative z-10 animate-spin shrink-0" />
              ) : (
                <FloppyDisk size={24} weight="fill" className="relative z-10 shrink-0" />
              )}
              <span className="relative z-10 text-ui-base font-bold">
                {saving ? 'Saving' : isReleasing ? 'Releasing' : 'Save'}
              </span>
            </button>
          )}
      </div>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Shared Sheets Ã¢â€â‚¬Ã¢â€â‚¬ */}
      <ModalSheet
        isOpen={isOptionsOpen}
        onClose={() => setIsOptionsOpen(false)}
        title="Personalize"
        icon={<Sparkle size={22} weight="duotone" />}
        size="sm"
        bodyClassName="pt-2"
      >
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => { setIsOptionsOpen(false); setIsMoodOpen(true); }} className={`flex items-center gap-3 rounded-2xl border p-4 ${mood ? getMoodConfig(mood)?.nav || 'bg-green/10 border-green/20 text-green' : 'control-surface text-gray-text'}`}><ActiveMoodIcon size={24} weight={mood ? "fill" : "regular"} /><span className="text-ui-sm font-bold capitalize">{mood ? getMoodConfig(mood)?.label || mood : 'Mood'}</span></button>
          <button onClick={() => { setIsOptionsOpen(false); setIsTagsOpen(true); }} className={`flex items-center gap-3 rounded-2xl border p-4 ${tags.length > 0 ? 'bg-green/10 border-green/20 text-green' : 'control-surface text-gray-text'}`}><TagIcon size={24} weight={tags.length > 0 ? "fill" : "regular"} /><span className="text-ui-sm font-bold">Tags</span></button>
          <button onClick={() => { setIsOptionsOpen(false); setIsPeoplePickerOpen(true); }} className={`flex items-center gap-3 rounded-2xl border p-4 ${relationshipIds.length > 0 ? 'bg-green/10 border-green/20 text-green' : 'control-surface text-gray-text'}`}><UsersThree size={24} weight={relationshipIds.length > 0 ? "fill" : "regular"} /><span className="text-ui-sm font-bold">{relationshipIds.length > 0 ? `${relationshipIds.length} People` : 'People'}</span></button>
          <button onClick={() => { setIsOptionsOpen(false); setIsMusicOpen(true); }} className={`flex items-center gap-3 rounded-2xl border p-4 ${musicPlaying ? 'bg-green/10 border-green/20 text-green' : 'control-surface text-gray-text'}`}><Headphones size={24} weight={musicPlaying ? "fill" : "regular"} /><span className="text-ui-sm font-bold">Sounds</span></button>
          <WhisperComposerControl
            onFinalTranscript={appendWhisperTranscript}
            label="Whisper"
            buttonClassName="flex w-full items-center gap-3 rounded-2xl border p-4 text-ui-sm font-bold transition-colors"
          />

          <label className="control-surface flex cursor-pointer items-center gap-3 rounded-2xl p-4 text-gray-text transition-colors hover:border-green/20 hover:bg-green/5">
            <Paperclip size={24} weight="regular" /><span className="text-ui-sm font-bold">Files</span>
            <input type="file" multiple className="hidden" onChange={(e) => {
              if (e.target.files) {
                draft.addFiles(Array.from(e.target.files || []));
              }
              setIsOptionsOpen(false);
            }} />
          </label>
          <label className="control-surface flex cursor-pointer items-center gap-3 rounded-2xl p-4 text-gray-text transition-colors hover:border-green/20 hover:bg-green/5">
            <ImageIcon size={24} weight="regular" /><span className="text-ui-sm font-bold">Cover</span>
            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
              if (e.target.files?.[0]) setImagePreview(URL.createObjectURL(e.target.files[0]));
              setIsOptionsOpen(false);
            }} />
          </label>
        </div>
      </ModalSheet>

      <ModalSheet
        isOpen={isSaveChoiceOpen}
        onClose={() => {
          if (!saving && !isReleasing) setIsSaveChoiceOpen(false);
        }}
        title="Keep it, or let it go"
        icon={<FloppyDisk size={22} weight="duotone" />}
        size="sm"
        bodyClassName="pt-2"
      >
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || isReleasing}
            aria-label="Save reflection"
            className="flex min-h-16 w-full items-center justify-between rounded-2xl border border-green bg-green p-4 text-left text-white transition-colors hover:bg-green-hover disabled:opacity-60"
          >
            <span>
              <span className="block text-ui-base font-bold text-white">Keep this one</span>
              <span className="mt-1 block text-ui-xs font-medium text-white/75">Save it for the version of you who checks later.</span>
            </span>
            {saving ? <CircleNotch size={20} className="animate-spin" /> : <FloppyDisk size={20} weight="regular" />}
          </button>

          <button
            type="button"
            onClick={handleReleaseDraft}
            disabled={saving || isReleasing}
            aria-label="Release this writing without saving a note"
            className="flex min-h-16 w-full items-center justify-between rounded-2xl border border-clay/20 bg-clay/5 p-4 text-left text-clay transition-colors hover:border-clay/35 hover:bg-clay/10 disabled:opacity-60"
          >
            <span>
              <span className="block text-ui-base font-bold text-gray-text">Let it go</span>
              <span className="mt-1 block text-ui-xs font-medium text-gray-light">No archive. Just the exhale.</span>
            </span>
            {isReleasing ? <CircleNotch size={20} className="animate-spin" /> : <Wind size={20} weight="duotone" />}
          </button>

          {saveError ? (
            <p className="text-btn-sm font-bold leading-relaxed text-clay" aria-live="assertive" role="alert">
              {saveError}
            </p>
          ) : null}

          {releaseError ? (
            <p className="text-btn-sm font-bold leading-relaxed text-clay" aria-live="polite">
              {releaseError}
            </p>
          ) : null}

          {releaseSuccess ? (
            <p className="text-sm font-bold text-clay mt-2 text-center" aria-live="polite">
              {releaseSuccess}
            </p>
          ) : null}
        </div>
      </ModalSheet>

      <ModalSheet
        isOpen={isTagsOpen}
        onClose={() => setIsTagsOpen(false)}
        title="Tags"
        icon={<Tag size={22} weight="duotone" />}
        size="sm"
        bodyClassName="pt-2"
      >
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 rounded-xl bg-green/10 pl-3 pr-1 py-1.5 text-ui-xs font-bold text-green">
                #{tag}
                <button
                  type="button"
                  onClick={() => setTags(tags.filter((item) => item !== tag))}
                  className="inline-flex h-11 w-11 -my-2 items-center justify-center text-green/70 hover:text-clay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40 rounded-lg"
                  aria-label={`Remove ${tag} tag`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>

          <input
            type="text"
            value={tagInput}
            aria-label="Add tag"
            placeholder={isLoadingSuggestions ? 'Thinking...' : suggestedTags.filter((t) => !tags.includes(t)).length > 0 ? `Try #${suggestedTags.filter((t) => !tags.includes(t)).slice(0, 2).join(', #')} or type here` : 'Add tag and press Enter'}
            className="input-surface w-full px-4 py-3 text-ui-sm font-semibold text-gray-text"
            onChange={(event) => setTagInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && tagInput.trim()) {
                event.preventDefault();
                setTags([...tags, tagInput.trim()]);
                setTagInput('');
              }
            }}
          />
        </div>
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
          selectedMood={mood}
          draftText={content}
          onStageChange={setMoodPickerStage}
          onSelect={(nextMood) => {
            setMood(nextMood);
            setMoodPickerStage('group');
            setIsMoodOpen(false);
          }}
        />
      </ModalSheet>

      <ModalSheet
        isOpen={isMusicOpen}
        onClose={() => setIsMusicOpen(false)}
        title="Sounds"
        icon={<Headphones size={22} weight="duotone" />}
        size="sm"
        bodyClassName="pt-2"
      >
        <div className="space-y-2">
          {AMBIENT_TRACKS.map((track) => (
            <button
              key={track.id}
              onClick={() => {
                void handleTrackSelect(track);
              }}
              disabled={pendingTrackId !== null && pendingTrackId !== track.id}
              className={`flex w-full items-center justify-between rounded-2xl border-2 p-4 text-left text-ui-sm font-bold transition-opacity ${activeMusicTrack?.id === track.id || pendingTrackId === track.id ? 'border-green bg-green/10 text-green' : 'control-surface text-gray-text hover:border-border hover:bg-green/5'} ${pendingTrackId !== null && pendingTrackId !== track.id ? 'opacity-60' : ''}`}
            >
              <span className="flex items-center gap-3">
                <span className="text-lg">{track.emoji}</span>
                {track.label}
              </span>

              {pendingTrackId === track.id ? (
                <InlineLoadingBadge label="Starting..." className="shrink-0" />
              ) : null}

              {activeMusicTrack?.id === track.id && pendingTrackId !== track.id ? (
                <span className="metadata-pill metadata-pill--sage">
                  <Check size={14} weight="bold" />
                  <span className="leading-none">Playing</span>
                </span>
              ) : null}
            </button>
          ))}

          <button onClick={handleStopMusic} className="mt-2 w-full rounded-2xl border-2 border-transparent p-4 font-bold text-clay transition-colors hover:bg-clay/5">Stop All</button>
        </div>
      </ModalSheet>

      <ModalSheet
        isOpen={isPeoplePickerOpen}
        onClose={() => setIsPeoplePickerOpen(false)}
        title="People in this reflection"
        icon={<UsersThree size={22} weight="duotone" className="text-green" />}
        size="md"
        tone="sage"
      >
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-light leading-relaxed">
            Connect who was present or on your mind. This reflection will be saved in their memories timeline.
          </p>
          {relationships.length === 0 ? (
            <p className="py-6 text-center text-sm font-medium text-gray-nav">
              No people added yet in Relationships.
            </p>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-2 py-2">
              {relationships.map((person) => {
                const isSelected = relationshipIds.includes(person.id);
                return (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => {
                      setRelationshipIds((current) =>
                        isSelected ? current.filter((id) => id !== person.id) : [...current, person.id]
                      );
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-colors border ${
                      isSelected ? 'bg-green/10 border-green/25 text-green' : 'border-border/40 hover:bg-surface-muted text-gray-text'
                    }`}
                  >
                    <span className="text-sm font-bold">{person.name}</span>
                    {isSelected && <Check size={16} weight="bold" className="text-green" />}
                  </button>
                );
              })}
            </div>
          )}
          <Button variant="primary" size="md" className="w-full" onClick={() => setIsPeoplePickerOpen(false)}>
            Done
          </Button>
        </div>
      </ModalSheet>

      <ConfirmationDialog
        isOpen={showLeaveDialog}
        onClose={handleStayOnDraft}
        onConfirm={handleLeaveDraft}
        title="This didn’t save yet"
        description="Your writing is kept on this device. Stay and try again, or leave and discard it."
        confirmLabel="Discard and leave"
        cancelLabel="Stay"
      />
      {showPlane ? (
        <Suspense fallback={null}>
          <PaperPlaneToast isVisible onAnimationComplete={() => {}} />
        </Suspense>
      ) : null}
      </div>

    </>
  );
};
