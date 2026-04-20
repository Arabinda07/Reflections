import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { 
  ArrowLeft, 
  FloppyDisk, 
  Image as ImageIcon, 
  MagicWand, 
  X, 
  Calendar, 
  Paperclip, 
  FileText, 
  Sparkle, 
  Smiley, 
  Tag as TagIcon, 
  Check, 
  Plus, 
  Trash, 
  Eye, 
  EyeSlash, 
  ListChecks, 
  Microphone, 
  MicrophoneSlash, 
  MusicNotes, 
  Play, 
  Pause, 
  SpeakerHigh, 
  CircleNotch,
  CaretRight,
  Brain,
  Wind,
  Target,
  Quotes
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
      className={`group relative flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 hover:bg-white/5 ${task.completed ? 'opacity-60' : ''}`}
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
  const [activePlaceholder, setActivePlaceholder] = useState<string | null>(initialPrompt || null);
  const [isReflecting, setIsReflecting] = useState(false);
  const [aiReflection, setAiReflection] = useState<string | null>(null);
  const [dynamicPrompts, setDynamicPrompts] = useState<string[]>([]);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingAttachments, setExistingAttachments] = useState<NoteAttachment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // UI States
  const [isFocused, setIsFocused] = useState(false);
  const [isFlowing, setIsFlowing] = useState(false);
  const [isBreathing, setIsBreathing] = useState(true);
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
  const recognitionRef = useRef<any>(null);
  const isWhisperingRef = useRef(false);
  const editorInstanceRef = useRef<EditorRef>(null);
  const flowTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmounted = useRef(false);

  useEffect(() => {
    isUnmounted.current = false;
    return () => { isUnmounted.current = true; };
  }, []);

  // Auto-transition from Breathing to Editor
  useEffect(() => {
    if (!loading && isBreathing) {
      const timer = setTimeout(() => {
        if (!isUnmounted.current) setIsBreathing(false);
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
      if (!isFocused) return;
      if (e.key === 'Escape') return handleWake();
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
        setIsFlowing(true);
        if (flowTimeoutRef.current) clearTimeout(flowTimeoutRef.current);
        flowTimeoutRef.current = setTimeout(() => {
          if (!isUnmounted.current) setIsFlowing(false);
        }, 5000);
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
  }, [isFocused, isFlowing]);

  useEffect(() => {
    const fetchNote = async () => {
      if (!id) {
        setLoading(false);
        generateDynamicPrompts();
        return;
      }
      try {
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

  const wordCount = content.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length;
  const canReflect = wordCount >= 100;

  if (loading || isBreathing) return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-body px-6 text-center animate-in fade-in duration-700">
      <motion.div 
        animate={{ opacity: [0.4, 0.7, 0.4] }} 
        transition={{ duration: 4, repeat: Infinity }} 
        className="w-[400px] h-[400px] rounded-full bg-green/5 blur-3xl absolute" 
      />
      <div className="relative z-10">
        <div className="w-48 h-48 mx-auto mb-12 opacity-80">
          <DotLottieReact
            src="/assets/lottie/loading2.json"
            autoplay
            loop
          />
        </div>
        <h2 className="text-[32px] md:text-[44px] font-display text-gray-text tracking-tighter mb-4 animate-pulse">Take a breath.</h2>
        <p className="text-[18px] font-serif italic text-gray-light max-w-sm mx-auto">Let the noise settle before you start.</p>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-[100dvh] bg-body transition-all duration-700 ease-out-quart overflow-x-hidden">
      <div className="grain-overlay" />

      {/* ── Sanctuary Header ── */}
      <AnimatePresence>
        {!isFlowing && (
          <motion.header initial={{ y: -64, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -64, opacity: 0 }} className="fixed top-0 left-0 right-0 h-20 z-50 flex items-center justify-between px-6 lg:px-10">
            <div className="flex items-center gap-6">
              <button onClick={() => navigate(RoutePath.HOME)} className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-white/5 transition-all"><ArrowLeft size={20} weight="bold" /></button>
              <div className="h-8 w-[1px] bg-border hidden lg:block" />
              <input type="text" placeholder="Untitled Reflection" value={title} onChange={e => setTitle(e.target.value)} className="bg-transparent border-none outline-none font-display text-[20px] lg:text-[24px] tracking-tight text-gray-text placeholder:text-gray-nav w-full max-w-md" />
            </div>
            <div className="flex items-center gap-4">
              <button onClick={handleSave} disabled={saving || (!title && !content)} className="group flex items-center gap-3 pl-5 pr-2 py-2 rounded-full bg-green text-white font-bold text-[14px] shadow-lg transition-all disabled:opacity-50">
                Save Reflection
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">{saving ? <CircleNotch size={18} className="animate-spin" /> : <FloppyDisk size={18} weight="bold" />}</div>
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* ── Main Canvas ── */}
      <main className={`relative z-10 pt-32 pb-40 px-6 lg:px-0 transition-all duration-1000 ${isFlowing ? 'opacity-30 blur-sm scale-[0.98]' : 'opacity-100'}`}>
        <div className="max-w-[82ch] mx-auto min-h-[60vh]">
          {imagePreview && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="relative w-full aspect-[21/9] rounded-[40px] overflow-hidden mb-12 bezel-outer group">
              <img src={imagePreview} alt="Cover" className="w-full h-full object-cover" />
              <button onClick={() => setImagePreview(null)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/20 backdrop-blur-xl text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><X size={20} weight="bold" /></button>
            </motion.div>
          )}

          <AnimatePresence>
            {isWhispering && interimTranscript && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-4 rounded-2xl bg-red/5 border border-red/10 text-red font-serif italic text-[18px]">
                {interimTranscript}...
              </motion.div>
            )}
          </AnimatePresence>

          <Editor ref={editorInstanceRef} content={content} onChange={setContent} onFocusChange={setIsFocused} placeholder={activePlaceholder || "What's on your mind?"} className="text-[20px] lg:text-[22px] font-serif leading-relaxed text-gray-text" />
        </div>
      </main>

      {/* ── Fluid Island Toolbar ── */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-fit px-6">
        <motion.div layout animate={{ y: isFlowing ? 100 : 0, opacity: isFlowing ? 0 : 1 }} className="bezel-outer p-1.5 backdrop-blur-3xl shadow-2xl">
          <div className="bezel-inner px-4 py-2 flex items-center gap-2">
            <div className="relative">
              <button onClick={() => { setIsMoodOpen(!isMoodOpen); setIsTagsOpen(false); setIsMusicOpen(false); setIsTasksOpen(false); }} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${mood ? 'bg-green/10 text-green' : 'text-gray-nav hover:bg-white/5'}`}><Smiley size={24} weight={mood ? "fill" : "bold"} /></button>
              <AnimatePresence>{isMoodOpen && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: -80 }} className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bezel-outer min-w-[280px]">
                  <div className="bezel-inner p-4 grid grid-cols-5 gap-2">
                    {['peaceful', 'happy', 'neutral', 'sad', 'stressed'].map(m => (
                      <button key={m} onClick={() => { setMood(m); setIsMoodOpen(false); generateDynamicPrompts(m); }} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${mood === m ? 'scale-110 ring-2 ring-green' : 'opacity-60'}`}><div className={`w-6 h-6 rounded-full bg-green`} /></button>
                    ))}
                  </div>
                </motion.div>
              )}</AnimatePresence>
            </div>
            <div className="w-[1px] h-6 bg-border mx-1" />
            <div className="flex items-center gap-1">
              <button onClick={() => { setIsTagsOpen(!isTagsOpen); setIsMoodOpen(false); }} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${tags.length > 0 ? 'bg-blue/10 text-blue' : 'text-gray-nav hover:bg-white/5'}`}><TagIcon size={22} weight="bold" /></button>
              <button onClick={() => setIsMusicOpen(!isMusicOpen)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${musicPlaying ? 'bg-purple-500/10 text-purple-500' : 'text-gray-nav hover:bg-white/5'}`}><MusicNotes size={22} weight="bold" /></button>
              <button onClick={() => setIsTasksOpen(!isTasksOpen)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${tasks.some(t => !t.completed) ? 'bg-blue/10 text-blue' : 'text-gray-nav hover:bg-white/5'}`}><ListChecks size={22} weight="bold" /></button>
              <button onClick={toggleWhisper} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isWhispering ? 'bg-red/10 text-red animate-pulse' : 'text-gray-nav hover:bg-white/5'}`}>{isWhispering ? <MicrophoneSlash size={22} weight="bold" /> : <Microphone size={22} weight="bold" />}</button>
              <label className="w-12 h-12 rounded-full flex items-center justify-center text-gray-nav hover:bg-white/5 cursor-pointer"><ImageIcon size={22} weight="bold" /><input type="file" className="hidden" accept="image/*" onChange={e => { const file = e.target.files?.[0]; if (file) setImagePreview(URL.createObjectURL(file)); }} /></label>
            </div>
            <div className="w-[1px] h-6 bg-border mx-1" />
            <button onClick={cycleSparkPrompt} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-blue hover:scale-110 transition-all shadow-sm"><Target size={22} weight="bold" /></button>
            <button onClick={handleAiReflect} disabled={isReflecting || !canReflect} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm ${canReflect ? 'bg-white/5 border border-white/10 text-green hover:scale-110' : 'opacity-20 cursor-not-allowed'}`}>{isReflecting ? <CircleNotch size={20} className="animate-spin" /> : <Sparkle size={22} weight="fill" />}</button>
          </div>
        </motion.div>
      </div>

      {/* ── Global Portals ── */}
      {createPortal(
        <AnimatePresence>
          {isTasksOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setIsTasksOpen(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-[420px] bg-white dark:bg-panel-bg bezel-outer shadow-2xl flex flex-col max-h-[80vh]">
                <div className="bezel-inner p-8 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3"><ListChecks size={24} weight="bold" className="text-blue" /><span className="text-[18px] font-display text-gray-text">Tasks</span></div>
                    <button onClick={() => setIsTasksOpen(false)} className="text-gray-nav hover:text-red transition-all"><X size={24} weight="bold" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 mb-8">
                    {getOrderedTasks(tasks).map(t => <TaskRow key={t.id} task={t} updateTask={(tid, updates) => setTasks(tasks.map(x => x.id === tid ? {...x, ...updates} : x))} toggleTask={tid => setTasks(tasks.map(x => x.id === tid ? {...x, completed: !x.completed} : x))} removeTask={tid => setTasks(tasks.filter(x => x.id !== tid))} />)}
                  </div>
                  <Button onClick={() => setTasks([...tasks, { id: Math.random().toString(36).substr(2, 9), text: '', completed: false }])} className="w-full h-14 rounded-2xl bg-blue text-white font-bold"><Plus size={20} weight="bold" className="mr-2" /> Add Task</Button>
                </div>
              </motion.div>
            </div>
          )}
          {isTagsOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setIsTagsOpen(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative w-full max-w-[380px] bezel-outer">
                <div className="bezel-inner p-8">
                  <h3 className="text-[20px] font-display text-gray-text mb-6">Tags</h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {tags.map(t => <span key={t} className="px-3 py-1.5 rounded-xl bg-blue/5 text-blue text-[12px] font-bold flex items-center gap-2">#{t}<X size={12} className="cursor-pointer" onClick={() => setTags(tags.filter(x => x !== t))} /></span>)}
                  </div>
                  <input type="text" placeholder="Add tag..." className="w-full bg-transparent border-none outline-none font-bold text-[14px]" onKeyDown={e => { if (e.key === 'Enter' && (e.target as any).value) { setTags([...tags, (e.target as any).value]); (e.target as any).value = ''; } }} />
                </div>
              </motion.div>
            </div>
          )}
          {isMusicOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setIsMusicOpen(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative w-full max-w-[340px] bezel-outer">
                <div className="bezel-inner p-6 space-y-2">
                  {Object.entries(AMBIENT_TRACKS).map(([tid, track]) => (
                    <button key={tid} onClick={() => playMusicTrack(tid as any)} className={`w-full p-4 rounded-2xl text-left text-[14px] font-bold flex items-center justify-between ${activeMusicTrack === tid ? 'bg-purple-500 text-white' : 'hover:bg-white/5 text-gray-nav'}`}>{track.name}{activeMusicTrack === tid && <CircleNotch size={14} className="animate-spin" />}</button>
                  ))}
                  <button onClick={stopMusic} className="w-full p-4 text-red font-bold hover:bg-red/5 rounded-2xl">Stop All</button>
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
