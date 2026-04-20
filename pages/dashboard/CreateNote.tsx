import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Brain
} from '@phosphor-icons/react';
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
import { DEFAULT_WELLNESS_PROMPTS } from '../../services/wellnessPrompts';
import { aiService } from '../../services/aiService';
import { aiClient } from '../../services/aiClient';

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.32, 0.72, 0, 1] } },
};

export const CreateNote: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); 
  const location = useLocation();
  const initialPrompt = location.state?.initialPrompt;
  
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
  const [isFocused, setIsFocused] = useState(false);
  const [isFlowing, setIsFlowing] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isMoodOpen, setIsMoodOpen] = useState(false);
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [isMusicOpen, setIsMusicOpen] = useState(false);
  const [isAttachmentsOpen, setIsAttachmentsOpen] = useState(false);
  const [isWhispering, setIsWhispering] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [showObservation, setShowObservation] = useState(false);
  const [observationText, setObservationText] = useState<string | null>(null);
  const [showPlane, setShowPlane] = useState(false);

  const { isPlaying: musicPlaying, activeTrack: activeMusicTrack, volume: musicVolume, playTrack: playMusicTrack, stopAll: stopMusic } = useAmbientAudio();
  const recognitionRef = useRef<any>(null);
  const isWhisperingRef = useRef(false);
  const editorInstanceRef = useRef<EditorRef>(null);
  const flowTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmounted = useRef(false);

  useEffect(() => {
    isUnmounted.current = false;
    return () => { isUnmounted.current = true; };
  }, []);

  // Flow State (Zen Mode)
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
        flowTimeoutRef.current = setTimeout(() => setIsFlowing(false), 5000);
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

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) return;
    setSaving(true);
    setShowPlane(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthenticated");

      let noteId = id;
      if (!noteId) {
        const newNote = await noteService.create({ title, content, tags, mood, tasks });
        noteId = newNote.id;
      }

      // Handle Cover Image
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
        attachments: existingAttachments // Simplified for now
      });

      // AI Ingestion
      aiService.processNoteIntoWiki({ id: noteId, title, content, tags, mood, tasks } as any).catch(() => {});

      // Finalize
      setTimeout(() => {
        setShowPlane(false);
        navigate(RoutePath.HOME, { state: { fromSave: true } });
      }, 1500);

    } catch (err) {
      setSaving(false);
      setShowPlane(false);
    }
  };

  const generateDynamicPrompts = async (m?: string) => {
    setIsGeneratingPrompts(true);
    try {
      const result = await aiClient.requestJson<string[]>('prompts', { note: { title, content, mood: m || mood } });
      setDynamicPrompts(result);
    } catch (err) {
      setDynamicPrompts(DEFAULT_WELLNESS_PROMPTS.slice(0, 3));
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  const toggleWhisper = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Browser doesn't support speech recognition.");

    if (isWhispering) {
      setIsWhispering(false);
      isWhisperingRef.current = false;
      recognitionRef.current?.stop();
    } else {
      setIsWhispering(true);
      isWhisperingRef.current = true;
      if (!recognitionRef.current) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.onresult = (event: any) => {
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) final += event.results[i][0].transcript;
          }
          if (final) setContent(prev => prev.endsWith('</p>') ? prev.slice(0, -4) + ' ' + final + '</p>' : prev + ' ' + final);
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
        recentNotes: pastNotes.filter(n => n.id !== id).slice(0, 5).map(n => ({
          title: n.title, mood: n.mood, content: n.content
        })),
        wikiPages: [],
        indexPage: null,
      });
      if (isUnmounted.current) return;
      setAiReflection(reflection || "I'm here to listen. Your thoughts are valid.");
    } catch (error) {
      if (isUnmounted.current) return;
      console.error("AI Reflection failed:", error);
      setAiReflection("I'm having trouble reflecting right now, but I'm still here for you.");
    } finally {
      if (!isUnmounted.current) setIsReflecting(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-body">
      <CircleNotch size={32} className="animate-spin text-green" />
    </div>
  );

  return (
    <div className="relative min-h-[100dvh] bg-body transition-all duration-700 ease-out-quart overflow-x-hidden">
      <div className="grain-overlay" />

      {/* ── Sanctuary Header ── */}
      <AnimatePresence>
        {!isFlowing && (
          <motion.header 
            initial={{ y: -64, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -64, opacity: 0 }}
            className="fixed top-0 left-0 right-0 h-20 z-50 flex items-center justify-between px-6 lg:px-10"
          >
            <div className="flex items-center gap-6">
              <button 
                onClick={() => navigate(RoutePath.HOME)}
                className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-white/5 transition-all"
              >
                <ArrowLeft size={20} weight="bold" />
              </button>
              <div className="h-8 w-[1px] bg-border hidden lg:block" />
              <input 
                type="text"
                placeholder="Untitled Reflection"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="bg-transparent border-none outline-none font-display text-[20px] lg:text-[24px] tracking-tight text-gray-text placeholder:text-gray-nav w-full max-w-md"
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleSave}
                disabled={saving || (!title && !content)}
                className="group flex items-center gap-3 pl-5 pr-2 py-2 rounded-full bg-green text-white font-bold text-[14px] shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                Save Reflection
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  {saving ? <CircleNotch size={18} className="animate-spin" /> : <FloppyDisk size={18} weight="bold" />}
                </div>
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* ── Main Canvas ── */}
      <main className="relative z-10 pt-32 pb-40 px-6 lg:px-0">
        <div className="max-w-[82ch] mx-auto min-h-[60vh]">
          {/* Cover Image Moment */}
          <AnimatePresence>
            {imagePreview && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full aspect-[21/9] rounded-[40px] overflow-hidden mb-12 bezel-outer"
              >
                <img src={imagePreview} alt="Cover" className="w-full h-full object-cover" />
                <button 
                  onClick={() => setImagePreview(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/20 backdrop-blur-xl text-white flex items-center justify-center hover:bg-black/40 transition-all"
                >
                  <X size={20} weight="bold" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <Editor 
            ref={editorInstanceRef}
            content={content}
            onChange={setContent}
            onFocusChange={setIsFocused}
            placeholder={activePlaceholder || "What's on your mind?"}
            className="text-[20px] lg:text-[22px] font-serif leading-relaxed text-gray-text"
          />
        </div>
      </main>

      {/* ── Fluid Island Bottom Toolbar ── */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-fit px-6">
        <motion.div 
          layout
          animate={{ 
            y: isFlowing ? 100 : 0, 
            opacity: isFlowing ? 0 : 1,
            scale: isFlowing ? 0.9 : 1
          }}
          className="bezel-outer p-1.5 backdrop-blur-3xl shadow-2xl"
        >
          <div className="bezel-inner px-4 py-2 flex items-center gap-2">
            
            {/* Mood Trigger */}
            <div className="relative">
              <button 
                onClick={() => { setIsMoodOpen(!isMoodOpen); setIsTagsOpen(false); setIsMusicOpen(false); }}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${mood ? 'bg-green/10 text-green' : 'text-gray-nav hover:bg-white/5'}`}
              >
                <Smiley size={24} weight={mood ? "fill" : "bold"} />
              </button>
              <AnimatePresence>
                {isMoodOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                    animate={{ opacity: 1, y: -80, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bezel-outer min-w-[200px]"
                  >
                    <div className="bezel-inner p-4 grid grid-cols-5 gap-2">
                      {['peaceful', 'happy', 'neutral', 'sad', 'stressed'].map(m => (
                        <button 
                          key={m}
                          onClick={() => { setMood(m); setIsMoodOpen(false); }}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${mood === m ? 'bg-green text-white' : 'hover:bg-white/5 text-gray-nav'}`}
                        >
                          {m[0].toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-[1px] h-6 bg-border mx-1" />

            {/* Core Tools */}
            <div className="flex items-center gap-1">
              <button 
                onClick={() => { setIsTagsOpen(!isTagsOpen); setIsMoodOpen(false); setIsMusicOpen(false); }}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${tags.length > 0 ? 'bg-blue/10 text-blue' : 'text-gray-nav hover:bg-white/5'}`}
              >
                <TagIcon size={22} weight="bold" />
              </button>

              <button 
                onClick={() => setIsMusicOpen(!isMusicOpen)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${musicPlaying ? 'bg-purple-500/10 text-purple-500' : 'text-gray-nav hover:bg-white/5'}`}
              >
                <MusicNotes size={22} weight="bold" />
              </button>

              <button 
                onClick={toggleWhisper}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isWhispering ? 'bg-red/10 text-red animate-pulse' : 'text-gray-nav hover:bg-white/5'}`}
              >
                {isWhispering ? <MicrophoneSlash size={22} weight="bold" /> : <Microphone size={22} weight="bold" />}
              </button>
            </div>

            <div className="w-[1px] h-6 bg-border mx-1" />

            {/* AI Action */}
            <button 
              onClick={handleAiReflect}
              disabled={isReflecting}
              className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-green hover:scale-110 transition-all shadow-sm"
            >
              {isReflecting ? <CircleNotch size={20} className="animate-spin" /> : <Sparkle size={22} weight="fill" />}
            </button>
          </div>
        </motion.div>
      </div>

      {/* AI Reflection Popup */}
      <AnimatePresence>
        {aiReflection && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-body/60 backdrop-blur-xl"
          >
            <div className="bezel-outer max-w-2xl w-full">
              <div className="bezel-inner p-10">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-green/5 text-green flex items-center justify-center">
                      <Brain size={28} weight="duotone" />
                    </div>
                    <h3 className="text-[24px] font-display text-gray-text">AI Reflection</h3>
                  </div>
                  <button onClick={() => setAiReflection(null)} className="text-gray-nav hover:text-gray-text transition-all">
                    <X size={24} weight="bold" />
                  </button>
                </div>
                <p className="text-[18px] font-serif italic text-gray-light leading-relaxed mb-10">
                  {aiReflection}
                </p>
                <Button variant="primary" className="w-full h-14 rounded-2xl" onClick={() => setAiReflection(null)}>
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PaperPlane Animation */}
      {showPlane && (
        <div className="fixed inset-0 z-[200] pointer-events-none">
          <PaperPlaneToast onAnimationComplete={() => {}} />
        </div>
      )}
    </div>
  );
};
