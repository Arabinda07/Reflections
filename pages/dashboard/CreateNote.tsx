import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  FloppyDisk, 
  Image as ImageIcon, 
  X, 
  CalendarBlank, 
  Paperclip, 
  FileText, 
  Sparkle, 
  Smiley, 
  SmileyBlank,
  SmileyMeh,
  SmileySad,
  SmileyAngry,
  SmileyXEyes,
  Tag as TagIcon, 
  Check, 
  Plus, 
  Trash, 
  ListChecks, 
  Microphone, 
  MicrophoneSlash, 
  Headphones,
  CircleNotch,
  CaretRight,
  Brain,
  Wind,
  Target,
  Lightning,
  DotsThreeCircle,
  PaperPlaneTilt
} from '@phosphor-icons/react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useAmbientAudio, AMBIENT_TRACKS } from '../../hooks/useAmbientAudio';
import { Button } from '../../components/ui/Button';
import { Editor, EditorRef } from '../../components/ui/Editor';
import { noteService } from '../../services/noteService';
import { storageService } from '../../services/storageService';
import { RoutePath, NoteAttachment, Task } from '../../types';
import { supabase } from '../../src/supabaseClient';
import { StorageImage } from '../../components/ui/StorageImage';
import { CompanionObservation } from '../../components/ui/CompanionObservation';
import { PaperPlaneToast } from '../../components/ui/PaperPlaneToast';
import { observationService } from '../../services/observationService';
import { DEFAULT_WELLNESS_PROMPTS, getCurrentWellnessPrompt, getNextWellnessPromptState } from '../../services/wellnessPrompts';
import { aiService } from '../../services/aiService';
import { aiClient } from '../../services/aiClient';
import { getOrderedTasks, getTaskDrawerTriggerLabel } from './createNoteTasks';

const MOOD_CONFIG: Record<string, { nav: string, modal: string, icon: any }> = {
  happy: { nav: 'bg-golden/10 border-golden/20 text-golden', modal: 'border-golden bg-golden/10 text-golden', icon: Smiley },
  calm: { nav: 'bg-blue/10 border-blue/20 text-blue', modal: 'border-blue bg-blue/10 text-blue', icon: SmileyBlank },
  anxious: { nav: 'bg-orange/10 border-orange/20 text-orange', modal: 'border-orange bg-orange/10 text-orange', icon: SmileyMeh },
  sad: { nav: 'bg-dark-blue/10 border-dark-blue/20 text-dark-blue', modal: 'border-dark-blue bg-dark-blue/10 text-dark-blue', icon: SmileySad },
  angry: { nav: 'bg-red/10 border-red/20 text-red', modal: 'border-red bg-red/10 text-red', icon: SmileyAngry },
  tired: { nav: 'bg-gray-light/10 border-gray-light/20 text-gray-text', modal: 'border-gray-light bg-gray-light/10 text-gray-text', icon: SmileyXEyes },
};

// --- Sub-Component: TaskRow ---
interface TaskRowProps {
  task: Task;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  toggleTask: (taskId: string) => void;
  removeTask: (taskId: string) => void;
}

const TaskRow: React.FC<TaskRowProps> = ({ task, updateTask, toggleTask, removeTask }) => {
  const [showCompletedText, setShowCompletedText] = useState(task.completed);
  const [rippleKey, setRippleKey] = useState(0);
  const wasCompleted = useRef(task.completed);

  useEffect(() => {
    if (task.completed) {
      if (!wasCompleted.current) setRippleKey((key) => key + 1);
      const timer = window.setTimeout(() => setShowCompletedText(true), 180);
      wasCompleted.current = true;
      return () => window.clearTimeout(timer);
    }
    setShowCompletedText(false);
    wasCompleted.current = false;
  }, [task.completed]);

  return (
    <motion.div
      layout
      className={`group relative flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/5 ${task.completed ? 'opacity-60' : ''}`}
    >
      <AnimatePresence>
        {rippleKey > 0 && task.completed && (
          <motion.span
            key={rippleKey}
            initial={{ scale: 0.2, opacity: 0.4 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="pointer-events-none absolute left-5 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-green/30"
          />
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => toggleTask(task.id)}
        className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-300 ${
          task.completed ? 'border-green bg-green text-white' : 'border-border text-transparent hover:border-green/50'
        }`}
      >
        <motion.span animate={{ scale: task.completed ? 1 : 0 }}>
          <Check size={14} weight="bold" />
        </motion.span>
      </button>

      <input
        type="text"
        value={task.text}
        onChange={(e) => updateTask(task.id, { text: e.target.value })}
        readOnly={task.completed}
        placeholder="What needs to be done?"
        className={`relative z-10 flex-1 bg-transparent border-none outline-none font-bold text-[14px] text-gray-text placeholder:text-gray-nav/40 transition-all ${
          showCompletedText ? 'line-through text-gray-nav decoration-green decoration-2' : ''
        }`}
      />

      <button
        type="button"
        onClick={() => removeTask(task.id)}
        className="opacity-0 group-hover:opacity-100 p-2 text-gray-nav hover:text-red transition-all"
      >
        <Trash size={16} />
      </button>
    </motion.div>
  );
};

export const CreateNote: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); 
  const location = useLocation();
  const initialPrompt = location.state?.initialPrompt;
  const isNewNote = !id;
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<string | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [activePlaceholder, setActivePlaceholder] = useState<string | null>(initialPrompt || null);
  const [isReflecting, setIsReflecting] = useState(false);
  const [aiReflection, setAiReflection] = useState<string | null>(null);
  const [dynamicPrompts, setDynamicPrompts] = useState<string[]>([]);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<NoteAttachment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // UI States
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isFocused, setIsFocused] = useState(false);
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [isFlowing, setIsFlowing] = useState(false);
  const [isBreathing, setIsBreathing] = useState(true); 
  const [isMobileOptionsOpen, setIsMobileOptionsOpen] = useState(false);

  // Sub-modal states
  const [isMoodOpen, setIsMoodOpen] = useState(false);
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [isMusicOpen, setIsMusicOpen] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  
  const [isWhispering, setIsWhispering] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [showObservation, setShowObservation] = useState(false);
  const [observationText, setObservationText] = useState<string | null>(null);
  const [showPlane, setShowPlane] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);

  const { isPlaying: musicPlaying, activeTrack: activeMusicTrack, playTrack: playMusicTrack, stopAll: stopMusic } = useAmbientAudio();
  const ActiveMoodIcon = mood ? MOOD_CONFIG[mood]?.icon || Smiley : Smiley;
  const recognitionRef = useRef<any>(null);
  const isWhisperingRef = useRef(false);
  const editorInstanceRef = useRef<EditorRef>(null);
  const flowTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmounted = useRef(false);

  useEffect(() => {
    isUnmounted.current = false;
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => { 
      isUnmounted.current = true; 
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Auto-transition from Breathing to Editor
  useEffect(() => {
    if (!loading && isBreathing) {
      const timer = setTimeout(() => {
        if (!isUnmounted.current) {
          setIsBreathing(false);
          editorInstanceRef.current?.focus();
        }
      }, 3200); 
      return () => clearTimeout(timer);
    }
  }, [loading, isBreathing]);

  // Flow Logic (Zen Mode)
  useEffect(() => {
    const handleWake = () => {
      if (flowTimeoutRef.current) clearTimeout(flowTimeoutRef.current);
      if (isFlowing) setIsFlowing(false);
    };
    const handleKeydown = (e: KeyboardEvent) => {
      if (!isFocused && !isTitleFocused) return;
      if (e.key === 'Escape') return handleWake();
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
        if (isTitleFocused) return; // Don't flow while typing title
        setIsFlowing(true);
        if (flowTimeoutRef.current) clearTimeout(flowTimeoutRef.current);
        if (!isMobile) {
          flowTimeoutRef.current = setTimeout(() => {
            if (!isUnmounted.current) setIsFlowing(false);
          }, 5000);
        }
      }
    };
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('mousemove', handleWake);
    window.addEventListener('touchstart', handleWake, { passive: true });
    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('mousemove', handleWake);
      window.removeEventListener('touchstart', handleWake);
    };
  }, [isFocused, isTitleFocused, isFlowing, isMobile]);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        if (!id) {
          generateDynamicPrompts();
          setLoading(false);
          return;
        }
        const note = await noteService.getById(id);
        if (note && !isUnmounted.current) {
          setTitle(note.title);
          setContent(note.content);
          setMood(note.mood);
          setTags(note.tags || []);
          setTasks(note.tasks || []);
          setImagePreview(note.thumbnailUrl || null);
          setExistingAttachments(note.attachments || []);
          generateDynamicPrompts(note.mood);
          setLoading(false);
        } else {
          navigate(RoutePath.HOME);
        }
      } catch (err) {
        setLoading(false);
      }
    };
    fetchNote();
  }, [id]);

  // --- NUCLEAR SAVE LOGIC ---
  const handleSave = async () => {
    if (!title.trim() && !content.trim()) return;
    setSaving(true);
    setShowPlane(true);

    const nuclearTimer = setTimeout(() => {
      if (!isUnmounted.current) {
        setShowPlane(false);
        navigate(RoutePath.HOME);
      }
    }, 5000);

    const visualFloor = new Promise<void>(resolve => setTimeout(resolve, 1500));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthenticated");

      let noteId = id;
      if (!noteId) {
        const newNote = await noteService.create({ title, content, tags, mood, tasks });
        noteId = newNote.id;
      }

      let finalThumbnailUrl = imagePreview;
      if (imagePreview?.startsWith('blob:')) {
        const response = await fetch(imagePreview);
        const blob = await response.blob();
        const file = new File([blob], "cover.jpg", { type: blob.type });
        finalThumbnailUrl = await storageService.uploadFile(file, user.id, 'notes', noteId);
      }

      await noteService.update(noteId, {
        title, content, mood, tags, tasks,
        thumbnailUrl: finalThumbnailUrl || undefined,
        attachments: existingAttachments
      });

      aiService.processNoteIntoWiki({ id: noteId, title, content, tags, mood, tasks } as any).catch(() => {});
      
      await visualFloor;
      clearTimeout(nuclearTimer);
      setShowPlane(false);

      const [totalCount, recentNotes] = await Promise.all([
        noteService.getCount(),
        noteService.getRecent(10)
      ]).catch(() => [0, []]);

      const observation = observationService.checkMilestones(
        { title, content, createdAt: new Date().toISOString() } as any,
        totalCount as number,
        recentNotes as any[]
      );

      if (observation && !isUnmounted.current) {
        setObservationText(observation.text);
        setShowObservation(true);
        observationService.markObservationShown();
      } else {
        navigate(RoutePath.HOME, { state: { fromSave: true } });
      }

    } catch (err) {
      clearTimeout(nuclearTimer);
      setSaving(false);
      setShowPlane(false);
    }
  };

  const generateDynamicPrompts = async (m?: string) => {
    setIsGeneratingPrompts(true);
    try {
      const pastNotes = await noteService.getRecent(3);
      const result = await aiClient.requestJson<string[]>('prompts', {
        note: { title, content, mood: m || mood },
        recentNotes: pastNotes.filter(n => n.id !== id).map(n => ({ title: n.title, mood: n.mood, content: n.content }))
      });
      setDynamicPrompts(result);
    } catch (err) {
      setDynamicPrompts(DEFAULT_WELLNESS_PROMPTS.slice(0, 4));
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  const cycleSparkPrompt = () => {
    const nextState = getNextWellnessPromptState(promptIndex, dynamicPrompts);
    setPromptIndex(nextState.nextIndex);
    setActivePlaceholder(nextState.prompt);
  };

  const toggleWhisper = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Browser doesn't support speech recognition.");

    if (isWhispering) {
      setIsWhispering(false);
      isWhisperingRef.current = false;
      recognitionRef.current?.stop();
      setInterimTranscript('');
    } else {
      setIsWhispering(true);
      isWhisperingRef.current = true;
      if (!recognitionRef.current) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.onresult = (event: any) => {
          let final = '';
          let currentInterim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) final += event.results[i][0].transcript;
            else currentInterim += event.results[i][0].transcript;
          }
          if (final) {
            setContent(prev => {
              const clean = prev === '<p><br></p>' ? '' : prev;
              if (!clean) return `<p>${final}</p>`;
              return clean.endsWith('</p>') ? clean.slice(0, -4) + ' ' + final + '</p>' : clean + ' ' + final;
            });
          }
          setInterimTranscript(currentInterim);
        };
      }
      recognitionRef.current.start();
    }
  };

  const handleAiReflect = async () => {
    if (!content || content === '<p><br></p>') return;
    setIsReflecting(true);
    setAiReflection(null);
    try {
      const pastNotes = await noteService.getAll();
      const reflection = await aiClient.requestText('reflection', {
        note: { title, content, mood, createdAt: new Date().toISOString() },
        recentNotes: pastNotes.filter(n => n.id !== id).slice(0, 5).map(n => ({ title: n.title, mood: n.mood, content: n.content })),
        wikiPages: [],
        indexPage: null,
      });
      if (!isUnmounted.current) setAiReflection(reflection || "I'm here to listen.");
    } catch (error) {
      setAiReflection("I'm having trouble reflecting right now.");
    } finally {
      if (!isUnmounted.current) setIsReflecting(false);
    }
  };

  const hasContent = Boolean(content && content !== '<p><br></p>');
  const wordCount = content.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length;
  const canReflect = wordCount >= 100;
  const isDimmed = isFlowing && !isTitleFocused;

  if (loading || isBreathing) return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-body px-6 text-center animate-in fade-in duration-700">
      <motion.div 
        animate={{ opacity: [0.4, 0.7, 0.4] }} 
        transition={{ duration: 4, repeat: Infinity }} 
        className="w-[400px] h-[400px] rounded-full bg-green/5 blur-3xl absolute" 
      />
      <div className="relative z-10">
        <div className="w-48 h-48 mx-auto mb-12 opacity-80">
          <DotLottieReact src="/assets/lottie/loading2.json" autoplay loop />
        </div>
        <h2 className="text-[32px] md:text-[44px] font-display text-gray-text tracking-tighter mb-4 animate-pulse">Take a breath.</h2>
        <p className="text-[18px] font-serif italic text-gray-light max-w-sm mx-auto">Let the noise settle before you start.</p>
      </div>
    </div>
  );

  return (
    <div className="relative h-[100dvh] bg-body transition-colors duration-700 ease-out-quart overflow-hidden flex">
      <div className="grain-overlay" />

      {/* ── Subtle Back Button ── */}
      <button 
        onClick={() => navigate(RoutePath.HOME)}
        className={`fixed top-24 lg:top-6 left-4 lg:left-6 z-[80] h-12 w-12 rounded-full border border-border bg-white/50 dark:bg-black/20 backdrop-blur-xl flex items-center justify-center hover:bg-white dark:hover:bg-white/10 transition-all shadow-sm ${isDimmed ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}`}
      >
        <ArrowLeft size={20} weight="bold" className="text-gray-text" />
      </button>

      {/* ── Desktop Sidebar ── */}
      {!isMobile && (
        <aside className={`w-[240px] border-r-2 border-border flex flex-col h-full bg-white/50 dark:bg-panel-bg z-40 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${isDimmed ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`}>
          <div className="pt-24 px-6 pb-6 flex-1 overflow-y-auto custom-scrollbar space-y-4">
            <span className="text-[10px] font-black text-gray-nav tracking-widest uppercase opacity-40 ml-2">Personalize</span>
            
            {/* Options */}
            <button onClick={() => setIsMoodOpen(true)} className={`w-full flex items-center justify-between p-4 rounded-[20px] transition-all border-2 ${mood ? MOOD_CONFIG[mood]?.nav || 'bg-green/10 border-green/20 text-green' : 'bg-transparent border-transparent hover:bg-white dark:hover:bg-white/5 hover:border-border text-gray-text'}`}>
              <div className="flex items-center gap-3"><ActiveMoodIcon size={20} weight={mood ? "fill" : "regular"} /><span className="text-[13px] font-bold capitalize">{mood ? mood : 'Mood'}</span></div>
              <CaretRight size={14} className="opacity-40" />
            </button>

            <button onClick={() => setIsTagsOpen(true)} className={`w-full flex items-center justify-between p-4 rounded-[20px] transition-all border-2 ${tags.length > 0 ? 'bg-green/10 border-green/20 text-green' : 'bg-transparent border-transparent hover:bg-white dark:hover:bg-white/5 hover:border-border text-gray-text'}`}>
              <div className="flex items-center gap-3"><TagIcon size={20} weight={tags.length > 0 ? "fill" : "regular"} /><span className="text-[13px] font-bold">{tags.length > 0 ? `${tags.length} Tags` : 'Tags'}</span></div>
              <CaretRight size={14} className="opacity-40" />
            </button>

            <button onClick={() => setIsMusicOpen(true)} className={`w-full flex items-center justify-between p-4 rounded-[20px] transition-all border-2 ${musicPlaying ? 'bg-green/10 border-green/20 text-green' : 'bg-transparent border-transparent hover:bg-white dark:hover:bg-white/5 hover:border-border text-gray-text'}`}>
              <div className="flex items-center gap-3"><Headphones size={20} weight={musicPlaying ? "fill" : "regular"} /><span className="text-[13px] font-bold">{musicPlaying && activeMusicTrack ? activeMusicTrack.emoji : 'Sounds'}</span></div>
              <CaretRight size={14} className="opacity-40" />
            </button>

            <button onClick={toggleWhisper} className={`w-full flex items-center justify-between p-4 rounded-[20px] transition-all border-2 ${isWhispering ? 'bg-green/10 border-green/20 text-green animate-pulse' : 'bg-transparent border-transparent hover:bg-white dark:hover:bg-white/5 hover:border-border text-gray-text'}`}>
              <div className="flex items-center gap-3">{isWhispering ? <Microphone size={20} weight="fill" /> : <MicrophoneSlash size={20} weight="regular" />}<span className="text-[13px] font-bold">Whisper</span></div>
            </button>

            <button onClick={() => setIsTasksOpen(true)} className={`w-full flex items-center justify-between p-4 rounded-[20px] transition-all border-2 ${tasks.some(t => !t.completed) ? 'bg-green/10 border-green/20 text-green' : 'bg-transparent border-transparent hover:bg-white dark:hover:bg-white/5 hover:border-border text-gray-text'}`}>
              <div className="flex items-center gap-3"><ListChecks size={20} weight={tasks.some(t => !t.completed) ? "fill" : "regular"} /><span className="text-[13px] font-bold">{getTaskDrawerTriggerLabel(tasks).label}</span></div>
              <CaretRight size={14} className="opacity-40" />
            </button>
            
            <div className="grid grid-cols-2 gap-2 pt-2">
              <label className="flex flex-col items-center justify-center p-4 rounded-[20px] bg-transparent hover:bg-white dark:hover:bg-white/5 text-gray-text transition-all cursor-pointer">
                <Paperclip size={20} className="mb-2" /><span className="text-[10px] font-bold uppercase">Files</span>
                <input type="file" multiple className="hidden" onChange={(e) => {
                  if (e.target.files) setNewAttachments([...newAttachments, ...Array.from(e.target.files)]);
                }} />
              </label>
              <label className="flex flex-col items-center justify-center p-4 rounded-[20px] bg-transparent hover:bg-white dark:hover:bg-white/5 text-gray-text transition-all cursor-pointer">
                <ImageIcon size={20} className="mb-2" /><span className="text-[10px] font-bold uppercase">Cover</span>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                  if (e.target.files?.[0]) setImagePreview(URL.createObjectURL(e.target.files[0]));
                }} />
              </label>
            </div>
          </div>
        </aside>
      )}

      {/* ── Main Canvas ── */}
      <main className="flex-1 h-full overflow-y-auto relative pt-24 pb-40 px-6 sm:px-12 md:px-20 custom-scrollbar">
        <div className={`max-w-[800px] mx-auto transition-[opacity,transform] duration-1000 ease-[cubic-bezier(0.32,0.72,0,1)] ${isDimmed ? 'opacity-40 scale-[0.98]' : 'opacity-100'}`}>
          
          {/* Cover Image */}
          {imagePreview && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full aspect-[21/9] rounded-[2rem] overflow-hidden mb-12 bezel-outer group">
              <img src={imagePreview} alt="Cover" className="w-full h-full object-cover" />
              <button onClick={() => setImagePreview(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><X size={20} weight="bold" /></button>
            </motion.div>
          )}

          {/* Eyebrow Date */}
          <div className="mb-6 flex items-center gap-2">
            <span className="rounded-full bg-green/10 text-green px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold flex items-center gap-2">
              <CalendarBlank size={12} weight="bold" />
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}
            </span>
            {canReflect && (
               <button onClick={handleAiReflect} disabled={isReflecting} className="rounded-full bg-blue/10 text-blue px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold flex items-center gap-2 hover:bg-blue/20 transition-all">
                 {isReflecting ? <CircleNotch size={12} className="animate-spin" /> : <Brain size={12} weight="bold" />}
                 Reflect
               </button>
            )}
          </div>

          {/* Title as H1 */}
          <input
            type="text"
            placeholder="Untitled Reflection"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onFocus={() => { setIsFocused(true); setIsTitleFocused(true); setIsFlowing(false); }}
            onBlur={() => { setIsFocused(false); setIsTitleFocused(false); }}
            className="w-full bg-transparent border-none outline-none font-serif text-[42px] md:text-[56px] leading-tight text-gray-text placeholder:text-border/40 mb-8 p-0"
          />

          <AnimatePresence>
            {isWhispering && interimTranscript && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-4 rounded-[2rem] bg-green/5 border border-green/10 text-green font-serif italic text-[18px]">
                {interimTranscript}...
              </motion.div>
            )}
          </AnimatePresence>

          <Editor 
            ref={editorInstanceRef} 
            content={content} 
            onChange={setContent} 
            onFocusChange={setIsFocused} 
            placeholder={activePlaceholder || "What's on your mind?"} 
            hideToolbar={isMobile}
            className="text-[20px] md:text-[22px] font-serif leading-[1.8] text-gray-text/90" 
          />
        </div>
      </main>

      {/* ── Floating Actions ── */}
      <div className={`fixed z-50 flex gap-4 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${isDimmed ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'} ${isMobile ? 'bottom-8 left-6 right-6 justify-between' : 'bottom-10 right-10 flex-col'}`}>
        
        {/* Mobile Personalize FAB */}
        {isMobile && (
          <button 
            onClick={() => setIsMobileOptionsOpen(true)}
            className="group relative h-16 w-16 rounded-full bg-white/80 dark:bg-panel-bg/80 backdrop-blur-3xl border border-white/20 shadow-[0_24px_40px_-10px_rgba(0,0,0,0.15)] flex items-center justify-center text-gray-text hover:text-green transition-all"
          >
            <DotsThreeCircle size={28} weight="fill" className="opacity-80" />
          </button>
        )}

        {/* Interchangeable Action FAB (Spark / Save) */}
        <AnimatePresence mode="wait">
          {!hasContent ? (
            <motion.button
              key="spark-fab"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={cycleSparkPrompt}
              className="group relative h-16 w-16 rounded-full bg-white/80 dark:bg-panel-bg/80 backdrop-blur-3xl border border-white/20 shadow-[0_24px_40px_-10px_rgba(0,0,0,0.15)] flex items-center justify-center text-green transition-all"
            >
              <div className="absolute inset-2 rounded-full bg-green/5 group-hover:bg-green/10 transition-colors" />
              <Target size={28} weight="fill" className={isGeneratingPrompts ? 'animate-pulse' : ''} />
            </motion.button>
          ) : (
            <motion.button
              key="save-fab"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={saving}
              className="group relative h-16 w-16 rounded-full bg-green text-white shadow-[0_24px_40px_-10px_rgba(22,163,74,0.4)] flex items-center justify-center transition-all"
            >
              <div className="absolute inset-2 rounded-full bg-black/10 group-hover:scale-110 transition-transform duration-500 ease-out" />
              {saving ? <CircleNotch size={28} className="animate-spin" /> : <PaperPlaneTilt size={26} weight="fill" className="relative z-10" />}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Mobile Modal Expansion (Personalize) ── */}
      {createPortal(
        <AnimatePresence>
          {isMobile && isMobileOptionsOpen && (
            <div className="fixed inset-0 z-[100] flex flex-col justify-end p-4 pb-24">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-body/80 backdrop-blur-xl" onClick={() => setIsMobileOptionsOpen(false)} />
              
              <motion.div 
                initial={{ y: "100%", opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full bg-white dark:bg-panel-bg rounded-[2rem] p-6 shadow-2xl border border-border flex flex-col gap-4"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black tracking-widest uppercase opacity-40">Personalize</span>
                  <button onClick={() => setIsMobileOptionsOpen(false)} className="text-gray-nav hover:text-red p-2"><X size={20} weight="bold" /></button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => { setIsMobileOptionsOpen(false); setIsMoodOpen(true); }} className={`flex items-center gap-3 p-4 rounded-2xl border ${mood ? MOOD_CONFIG[mood]?.nav || 'bg-green/10 border-green/20 text-green' : 'border-border text-gray-text'}`}><ActiveMoodIcon size={24} weight={mood ? "fill" : "regular"} /><span className="text-[14px] font-bold capitalize">{mood ? mood : 'Mood'}</span></button>
                  <button onClick={() => { setIsMobileOptionsOpen(false); setIsTagsOpen(true); }} className={`flex items-center gap-3 p-4 rounded-2xl border ${tags.length > 0 ? 'bg-green/10 border-green/20 text-green' : 'border-border text-gray-text'}`}><TagIcon size={24} weight={tags.length > 0 ? "fill" : "regular"} /><span className="text-[14px] font-bold">Tags</span></button>
                  <button onClick={() => { setIsMobileOptionsOpen(false); setIsMusicOpen(true); }} className={`flex items-center gap-3 p-4 rounded-2xl border ${musicPlaying ? 'bg-green/10 border-green/20 text-green' : 'border-border text-gray-text'}`}><Headphones size={24} weight={musicPlaying ? "fill" : "regular"} /><span className="text-[14px] font-bold">Sounds</span></button>
                  <button onClick={() => { setIsMobileOptionsOpen(false); setIsTasksOpen(true); }} className={`flex items-center gap-3 p-4 rounded-2xl border ${tasks.some(t => !t.completed) ? 'bg-green/10 border-green/20 text-green' : 'border-border text-gray-text'}`}><ListChecks size={24} weight={tasks.some(t => !t.completed) ? "fill" : "regular"} /><span className="text-[14px] font-bold">Tasks</span></button>
                  <button onClick={toggleWhisper} className={`flex items-center gap-3 p-4 rounded-2xl border ${isWhispering ? 'bg-green/10 border-green/20 text-green animate-pulse' : 'border-border text-gray-text'}`}>{isWhispering ? <Microphone size={24} weight="fill" /> : <MicrophoneSlash size={24} weight="regular" />}<span className="text-[14px] font-bold">Whisper</span></button>
                  
                  <label className="flex items-center gap-3 p-4 rounded-2xl border border-border text-gray-text cursor-pointer hover:bg-black/5 dark:hover:bg-white/5">
                    <Paperclip size={24} weight="regular" /><span className="text-[14px] font-bold">Files</span>
                    <input type="file" multiple className="hidden" onChange={(e) => {
                      if (e.target.files) setNewAttachments([...newAttachments, ...Array.from(e.target.files)]);
                      setIsMobileOptionsOpen(false);
                    }} />
                  </label>
                  <label className="flex items-center gap-3 p-4 rounded-2xl border border-border text-gray-text cursor-pointer hover:bg-black/5 dark:hover:bg-white/5">
                    <ImageIcon size={24} weight="regular" /><span className="text-[14px] font-bold">Cover</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      if (e.target.files?.[0]) setImagePreview(URL.createObjectURL(e.target.files[0]));
                      setIsMobileOptionsOpen(false);
                    }} />
                  </label>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── Sub-Modals (Mood, Tags, Tasks, Music, Reflection) ── */}
      {/* ... keeping these identical to previous implementation, just ensuring they use green instead of blue ... */}
      {createPortal(
        <AnimatePresence>
          {isTasksOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setIsTasksOpen(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-[420px] bg-white dark:bg-panel-bg bezel-outer shadow-2xl flex flex-col max-h-[80vh]">
                <div className="bezel-inner p-8 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3"><ListChecks size={24} weight="bold" className="text-green" /><span className="text-[18px] font-display text-gray-text">Tasks</span></div>
                    <button onClick={() => setIsTasksOpen(false)} className="text-gray-nav hover:text-red transition-all"><X size={24} weight="bold" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 mb-8">
                    {getOrderedTasks(tasks).map(t => <TaskRow key={t.id} task={t} updateTask={(tid, updates) => setTasks(tasks.map(x => x.id === tid ? {...x, ...updates} : x))} toggleTask={tid => setTasks(tasks.map(x => x.id === tid ? {...x, completed: !x.completed} : x))} removeTask={tid => setTasks(tasks.filter(x => x.id !== tid))} />)}
                  </div>
                  <Button onClick={() => setTasks([...tasks, { id: Math.random().toString(36).substr(2, 9), text: '', completed: false }])} className="w-full h-14 rounded-2xl bg-green text-white font-bold"><Plus size={20} weight="bold" className="mr-2" /> Add Task</Button>
                </div>
              </motion.div>
            </div>
          )}
          {isTagsOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setIsTagsOpen(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative w-full max-w-[380px] bezel-outer">
                <div className="bezel-inner p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[20px] font-display text-gray-text">Tags</h3>
                    <button onClick={() => setIsTagsOpen(false)} className="text-gray-nav hover:text-red transition-all"><X size={24} weight="bold" /></button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {tags.map(t => <span key={t} className="px-3 py-1.5 rounded-xl bg-green/10 text-green text-[12px] font-bold flex items-center gap-2">#{t}<X size={12} className="cursor-pointer" onClick={() => setTags(tags.filter(x => x !== t))} /></span>)}
                  </div>
                  <input type="text" placeholder="Add tag (Press Enter)..." className="w-full bg-transparent border-none outline-none font-bold text-[14px]" onKeyDown={e => { if (e.key === 'Enter' && (e.target as any).value) { setTags([...tags, (e.target as any).value]); (e.target as any).value = ''; } }} />
                </div>
              </motion.div>
            </div>
          )}
          {isMoodOpen && (
             <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setIsMoodOpen(false)} />
               <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative w-full max-w-[380px] bezel-outer">
                 <div className="bezel-inner p-8">
                   <div className="flex items-center justify-between mb-6">
                     <h3 className="text-[20px] font-display text-gray-text">Mood</h3>
                     <button onClick={() => setIsMoodOpen(false)} className="text-gray-nav hover:text-red transition-all"><X size={24} weight="bold" /></button>
                   </div>
                   <div className="grid grid-cols-3 gap-3">
                      {['happy', 'calm', 'anxious', 'sad', 'angry', 'tired'].map(m => {
                        const Icon = MOOD_CONFIG[m]?.icon || Smiley;
                        return (
                          <button 
                            key={m} 
                            onClick={() => { 
                              if (mood === m) {
                                setMood(undefined);
                              } else {
                                setMood(m); 
                                generateDynamicPrompts(m);
                              }
                              setIsMoodOpen(false); 
                            }} 
                            className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${mood === m ? MOOD_CONFIG[m]?.modal || 'border-green bg-green/10 text-green' : 'border-border bg-white dark:bg-white/5 text-gray-text hover:border-border/60'}`}
                          >
                            <Icon size={32} weight={mood === m ? "fill" : "regular"} className="mb-2" />
                            <span className="text-[12px] font-bold capitalize">{m}</span>
                          </button>
                        );
                      })}
                   </div>
                 </div>
               </motion.div>
             </div>
          )}
          {isMusicOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setIsMusicOpen(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative w-full max-w-[340px] bezel-outer">
                <div className="bezel-inner p-6 space-y-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[20px] font-display text-gray-text">Sounds</h3>
                    <button onClick={() => setIsMusicOpen(false)} className="text-gray-nav hover:text-red transition-all"><X size={24} weight="bold" /></button>
                  </div>
                  {AMBIENT_TRACKS.map((track) => (
                    <button 
                      key={track.id} 
                      onClick={() => playMusicTrack(track)} 
                      className={`w-full p-4 rounded-2xl text-left text-[14px] font-bold flex items-center justify-between border-2 ${activeMusicTrack?.id === track.id ? 'border-green bg-green/10 text-green' : 'border-transparent hover:border-border text-gray-text'}`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-[18px]">{track.emoji}</span>
                        {track.label}
                      </span>
                      {activeMusicTrack?.id === track.id && <CircleNotch size={16} className="animate-spin" />}
                    </button>
                  ))}
                  <button onClick={stopMusic} className="w-full p-4 mt-2 border-2 border-transparent text-red font-bold hover:bg-red/5 rounded-2xl">Stop All</button>
                </div>
              </motion.div>
            </div>
          )}
          {aiReflection && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-body/60 backdrop-blur-xl">
              <div className="bezel-outer max-w-2xl w-full shadow-2xl">
                <div className="bezel-inner p-10">
                  <div className="flex justify-between items-start mb-8"><div className="flex items-center gap-4"><Brain size={32} weight="duotone" className="text-green" /><h3 className="text-[24px] font-display text-gray-text">Reflection</h3></div><button onClick={() => setAiReflection(null)}><X size={24} weight="bold" className="text-gray-nav" /></button></div>
                  <p className="text-[20px] font-serif italic text-gray-light leading-relaxed mb-10">"{aiReflection}"</p>
                  <Button variant="primary" className="w-full h-14 rounded-2xl" onClick={() => setAiReflection(null)}>Keep Writing</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <CompanionObservation isVisible={showObservation} text={observationText || ""} onComplete={() => { setShowObservation(false); navigate(RoutePath.HOME); }} />
      <PaperPlaneToast isVisible={showPlane} onAnimationComplete={() => {}} />
    </div>
  );
};
