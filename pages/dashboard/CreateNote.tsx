import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Save, ArrowLeft, Image as ImageIcon, Wand2, X, Calendar, Paperclip, File as FileIcon, FileText, Zap, Sparkles, ChevronRight, Smile, Frown, Sun, Cloud, Moon, Brain, Tag as TagIcon, CheckCircle2, Check, Plus, Trash2, Eye, EyeOff, ListTodo, Wind, Mic, MicOff, Music, Headphones, Play, Pause, Volume2, Loader2 } from 'lucide-react';
import { useAmbientAudio, AMBIENT_TRACKS } from '../../hooks/useAmbientAudio';
import { Button } from '../../components/ui/Button';
import { Editor, EditorRef } from '../../components/ui/Editor';
import { noteService } from '../../services/noteService';
import { storageService } from '../../services/storageService';
import { RoutePath, NoteAttachment, Task } from '../../types';
import { supabase } from '../../src/supabaseClient';
import { StorageImage } from '../../components/ui/StorageImage';
import { LoadingState } from '../../components/ui/LoadingState';
import { CompanionObservation } from '../../components/ui/CompanionObservation';
import { PaperPlaneToast } from '../../components/ui/PaperPlaneToast';
import { observationService } from '../../services/observationService';
import { DEFAULT_WELLNESS_PROMPTS, getCurrentWellnessPrompt, getNextWellnessPromptState } from '../../services/wellnessPrompts';
import { aiService } from '../../services/aiService';
import { aiClient } from '../../services/aiClient';
import {
  getOrderedTasks,
  getTaskDrawerTriggerLabel,
} from './createNoteTasks';

// Custom debounce function to avoid CommonJS import issues
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

interface TaskRowProps {
  task: Task;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  toggleTask: (taskId: string) => void;
  removeTask: (taskId: string) => void;
  addTask: () => void;
}

const TaskRow: React.FC<TaskRowProps> = ({ task, updateTask, toggleTask, removeTask, addTask }) => {
  const [showCompletedText, setShowCompletedText] = useState(task.completed);
  const [rippleKey, setRippleKey] = useState(0);
  const [isCommitted, setIsCommitted] = useState(false);
  const wasCompleted = useRef(task.completed);
  const taskLabel = task.text.trim() || 'Untitled task';
  const textInputId = `task-text-${task.id}`;
  const dueDateInputId = `task-due-${task.id}`;

  useEffect(() => {
    if (task.completed) {
      if (!wasCompleted.current) {
        setRippleKey((key) => key + 1);
      }

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
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={
        task.completed
          ? {
              opacity: 1,
              y: 0,
              scale: 0.99,
              borderColor: 'rgba(125, 211, 252, 0.45)',
              boxShadow: '0 0 0 1px rgba(186, 230, 253, 0.35), 0 18px 45px -35px rgba(14, 165, 233, 0.55)',
            }
          : {
              opacity: 1,
              y: 0,
              scale: 1,
              borderColor: 'var(--border-color)',
              boxShadow: '0 1px 2px rgba(var(--gray-text-rgb), 0.04)',
            }
      }
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative flex items-center gap-2 overflow-hidden rounded-[24px] border-2 p-3 sm:gap-4 sm:p-4 bg-white dark:bg-panel-bg transition-colors duration-300 ${task.completed ? 'bg-emerald-50/60 dark:bg-emerald-900/10' : ''}`}
    >
      <AnimatePresence>
        {rippleKey > 0 && task.completed && (
          <motion.span
            key={rippleKey}
            initial={{ scale: 0.2, opacity: 0.38 }}
            animate={{ scale: 4.6, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="pointer-events-none absolute left-5 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full bg-sky-200/60"
          />
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => toggleTask(task.id)}
        className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-300 ${
          task.completed
            ? 'border-sky-400 bg-sky-400 text-white shadow-sm'
            : 'border-border text-transparent hover:border-sky-300'
        }`}
        aria-label={task.completed ? 'Mark task incomplete' : 'Mark task complete'}
      >
        <motion.span
          animate={{ scale: task.completed ? 1 : 0, rotate: task.completed ? 0 : -20 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <Check size={14} strokeWidth={3} />
        </motion.span>
      </button>

      <input
        id={textInputId}
        type="text"
        value={task.text}
        onChange={(e) => updateTask(task.id, { text: e.target.value })}
        readOnly={task.completed}
        autoFocus={!task.text}
        placeholder="What needs to be done?"
        aria-label={`Task text for ${taskLabel}`}
        className={`relative z-10 flex-1 min-w-0 bg-transparent border-none outline-none ring-0 focus:ring-0 focus:outline-none text-[14px] px-1 font-bold text-gray-text placeholder:text-border transition-all duration-500 ${
          showCompletedText ? 'line-through text-gray-nav cursor-default decoration-sky-400 decoration-2' : ''
        }`}
      />

      <div className={`relative z-10 flex shrink-0 items-center gap-1 transition-all duration-300 sm:gap-2 ${task.completed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <motion.button
          type="button"
          onClick={() => {
            setIsCommitted(true);
            setTimeout(() => setIsCommitted(false), 1500);
          }}
          animate={{ 
            color: isCommitted ? 'rgb(59, 130, 246)' : 'rgb(156, 163, 175)'
          }}
          className="p-2 rounded-xl text-gray-nav hover:bg-blue/5 transition-all duration-300 ease-out-quart"
          aria-label="Commit task"
        >
          {isCommitted ? <Sparkles size={16} /> : <Plus size={16} />}
        </motion.button>
        <button
          type="button"
          onClick={() => removeTask(task.id)}
          className="p-2 rounded-xl text-gray-nav hover:text-red hover:bg-red/5 transition-all duration-300 ease-out-quart"
          aria-label="Remove task"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </motion.div>
  );
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
  
  // New UI states
  const [isBreathing, setIsBreathing] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);
  const [isPromptPulse, setIsPromptPulse] = useState(false);

  const [isMoodOpen, setIsMoodOpen] = useState(false);
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isFlowing, setIsFlowing] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  // Setting visibility to true immediately to avoid jank
  const [isContentVisible, setIsContentVisible] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const flowTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const shellRef = useRef<HTMLDivElement>(null);
  const taskTriggerRef = useRef<HTMLButtonElement>(null);
  const taskDrawerCloseRef = useRef<HTMLButtonElement>(null);
  const wasTaskDrawerOpenRef = useRef(isTasksOpen);
  const taskDrawerTitleId = 'create-note-task-drawer-title';
  const taskDrawerDescriptionId = 'create-note-task-drawer-description';
  
  // Mindful Features States
  const [isMusicOpen, setIsMusicOpen] = useState(false);
  // Shared audio hook — crossfade between tracks
  const { isPlaying: musicPlaying, activeTrack: activeMusicTrack, volume: musicVolume, playTrack: playMusicTrack, stopAll: stopMusic, setVolume: setMusicVolume } = useAmbientAudio();
  
  const [isWhispering, setIsWhispering] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const isWhisperingRef = useRef(false);
  // Observation states
  const [observationText, setObservationText] = useState<string | null>(null);
  const [showObservation, setShowObservation] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [showPlane, setShowPlane] = useState(false);
  const navigatePathRef = useRef<string | null>(null); // kept for type-safety, no longer drives nav


  const moodRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);
  const musicRef = useRef<HTMLDivElement>(null);
  
  const lastSavedRef = useRef({ title: '', content: '', mood: undefined as string | undefined, tags: [] as string[], tasks: [] as Task[] });
  const editorInstanceRef = useRef<EditorRef>(null);
  const isUnmounted = useRef(false);
  const shouldReduceMotion = useReducedMotion();
  const releaseEase = [0.4, 0, 0.2, 1];

  const toggleWhisper = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support voice journaling. Please try Chrome or Safari.");
      return;
    }

    if (isWhispering) {
      setIsWhispering(false);
      isWhisperingRef.current = false;
      recognitionRef.current?.stop();
      setInterimTranscript('');
    } else {
      setIsWhispering(true);
      isWhisperingRef.current = true;
      setInterimTranscript('');
      
      if (!recognitionRef.current) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          let currentInterim = '';
          
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              currentInterim += event.results[i][0].transcript;
            }
          }
          
          if (finalTranscript) {
            setContent((prev: string) => {
              const cleanPrev = prev === '<p><br></p>' ? '' : prev;
              if (!cleanPrev) return `<p>${finalTranscript}</p>`;
              if (cleanPrev.endsWith('</p>')) {
                return cleanPrev.slice(0, -4) + ' ' + finalTranscript + '</p>';
              }
              return cleanPrev + ' ' + finalTranscript;
            });
          }
          setInterimTranscript(currentInterim);
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          if (event.error === 'not-allowed') {
            setIsWhispering(false);
            isWhisperingRef.current = false;
            alert("Microphone access is required for Whisper Mode.");
          }
        };
        
        recognitionRef.current.onend = () => {
          if (isWhisperingRef.current) {
            try { recognitionRef.current.start(); } catch(e) {}
          }
        };
      }
      
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  useEffect(() => {
    isUnmounted.current = false;
    return () => {
      isUnmounted.current = true;
    };
  }, []);

  // Flow State (Auto-fade) mechanics
  useEffect(() => {
    const handleWake = () => {
      if (flowTimeoutRef.current) clearTimeout(flowTimeoutRef.current);
      if (isFlowing) setIsFlowing(false);
    };

    const handleKeydown = (e: KeyboardEvent) => {
      if (!isFocused) return;
      if (e.key === 'Escape') {
        handleWake();
        return;
      }
      
      // Enter Flow State on typable keys or interactions
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
        if (isTitleFocused) return; // Don't trigger flow while typing title
        setIsFlowing(true);
        if (flowTimeoutRef.current) clearTimeout(flowTimeoutRef.current);
        
        // Auto-return for Desktop only (5 seconds)
        if (!isMobile) {
          flowTimeoutRef.current = setTimeout(() => {
            setIsFlowing(false);
          }, 5000);
        }
      }
    };

    // Global desktop/mobile wake listeners
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('mousemove', handleWake);
    window.addEventListener('touchstart', handleWake, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('mousemove', handleWake);
      window.removeEventListener('touchstart', handleWake);
      if (flowTimeoutRef.current) clearTimeout(flowTimeoutRef.current);
    };
  }, [isFocused, isFlowing]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    
    // Drag to wake logic for mobile
    const handleTouchStart = (e: TouchEvent) => {
      setDragStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (dragStartY !== null && isFlowing && isMobile) {
        const deltaY = e.touches[0].clientY - dragStartY;
        if (Math.abs(deltaY) > 50) { // Dragged 50px
          if (flowTimeoutRef.current) clearTimeout(flowTimeoutRef.current);
          setIsFlowing(false);
          setDragStartY(null);
        }
      }
    };

    const handleTouchEnd = () => setDragStartY(null);

    window.addEventListener('resize', handleResize);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [dragStartY, isFlowing, isMobile]);

  // Robust Auto-Focus logic
  useEffect(() => {
    if (!loading && !isBreathing && !isReleasing) {
      const timer = setTimeout(() => {
        editorInstanceRef.current?.focus();
        // Force scroll to top on mobile to ensure header is visible if needed, 
        // or stay at top if Zen mode is about to engage
        window.scrollTo(0, 0);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [loading, isBreathing, isReleasing]);

  const handleBreathingComplete = useCallback(() => {
    setIsBreathing(false);
    // Focus the editor once breathing is complete
    setTimeout(() => {
      editorInstanceRef.current?.focus();
    }, 100);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (moodRef.current && !moodRef.current.contains(target) && !target.closest('.mood-popup-container')) {
        setIsMoodOpen(false);
      }
      if (tagsRef.current && !tagsRef.current.contains(target) && !target.closest('.tags-popup-container')) {
        setIsTagsOpen(false);
      }
      if (musicRef.current && !musicRef.current.contains(target) && !target.closest('.music-popup-container')) {
        setIsMusicOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const checkLimitAndFetch = async () => {
      try {
        if (!id) {
          // Generate initial prompts for new note without awaiting
          generateDynamicPrompts();

          if (isUnmounted.current) return;
          setLoading(false);
          setIsContentVisible(true);
          
          // Check count for current month asynchronously
          const count = await noteService.getMonthlyCount();
          if (isUnmounted.current) return;
          if (count >= 30) {
            setIsLimitReached(true);
          }
        } else {
          // Fetch EXISTING note data immediately
          const note = await noteService.getById(id);

          if (isUnmounted.current) return;
          if (note) {
            setTitle(note.title);
            setContent(note.content);
            setMood(note.mood);
            setTags(note.tags || []);
            setTasks(note.tasks || []);
            setImagePreview(note.thumbnailUrl || null);
            setExistingAttachments(note.attachments || []);
            lastSavedRef.current = { 
              title: note.title, 
              content: note.content, 
              mood: note.mood, 
              tags: note.tags || [],
              tasks: note.tasks || []
            };
            generateDynamicPrompts(note.mood);
            
            // Focus editor for existing note
            setTimeout(() => {
              editorInstanceRef.current?.focus();
            }, 500);
          } else {
             navigate(RoutePath.NOTES);
          }
          setLoading(false);
          setIsContentVisible(true);
        }
      } catch (error) {
        console.error("Failed to initialize note view", error);
        setLoading(false);
        setIsContentVisible(true);
      }
    };

    checkLimitAndFetch();
  }, [id, navigate]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const generateDynamicPrompts = async (currentMood?: string) => {
    setIsGeneratingPrompts(true);
    try {
      const pastNotes = await noteService.getRecent(3);

      const result = await aiClient.requestJson<string[]>('prompts', {
        note: {
          title,
          content,
          mood,
        },
        currentMood,
        recentNotes: pastNotes
          .filter(n => n.id !== id)
          .map(n => ({
            title: n.title,
            mood: n.mood,
            content: n.content,
          })),
      });

      if (Array.isArray(result) && result.length > 0) {
        setDynamicPrompts(result);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Failed to generate prompts:", error);
      // Fallback: shuffle default prompts
      const shuffled = [...DEFAULT_WELLNESS_PROMPTS].sort(() => 0.5 - Math.random()).slice(0, 4);
      setDynamicPrompts(shuffled);
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  const handleMoodSelect = async (mId: string) => {
    const isSelected = mood === mId;
    const newMood = isSelected ? undefined : mId;
    setMood(newMood);
    generateDynamicPrompts(newMood);

    // If editing, auto-save the mood
    if (id) {
      try {
        await noteService.update(id, { mood: newMood });
      } catch (error) {
        console.error("Failed to auto-save mood:", error);
      }
    }
  };

  const getFileIcon = (type?: string) => {
    if (!type) return <FileIcon size={20} />;
    if (type.startsWith('image/')) return <ImageIcon size={20} />;
    if (type.includes('pdf')) return <FileText size={20} className="text-red" />;
    if (type.includes('word') || type.includes('officedocument')) return <FileText size={20} className="text-blue" />;
    if (type.includes('zip') || type.includes('compressed')) return <Zap size={20} className="text-yellow-600" />;
    return <FileIcon size={20} />;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setNewAttachments((prev) => [...prev, ...newFiles]);
    }
  };

  const removeNewAttachment = (index: number) => {
    setNewAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = async (attachment: NoteAttachment) => {
    setExistingAttachments((prev) => prev.filter(a => a.path !== attachment.path));
    try {
      await storageService.deleteFile(attachment.path);
    } catch (err) {
      console.error("Error deleting file", err);
    }
  };

  const handleRemoveCover = () => {
    setImagePreview(null);
  };

  const handleAiReflect = async () => {
    if (!content || content === '<p><br></p>') return;
    setIsReflecting(true);
    setAiReflection(null);
    try {
      const pastNotes = await noteService.getAll();

      const reflection = await aiClient.requestText('reflection', {
        note: {
          title,
          content,
          mood,
          createdAt: new Date().toISOString(),
        },
        recentNotes: pastNotes
          .filter(n => n.id !== id)
          .slice(0, 5)
          .map(n => ({
            title: n.title,
            mood: n.mood,
            content: n.content,
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

  const generateSuggestedTags = async () => {
    if (!content || content === '<p><br></p>') return;
    try {
      const plainText = content.replace(/<[^>]*>/g, '');
      const result = await aiClient.requestJson<string[]>('tags', {
        content: plainText,
      });
      setSuggestedTags(result);
    } catch (error) {
      console.error("Failed to suggest tags:", error);
    }
  };

  useEffect(() => {
    if (isTagsOpen && suggestedTags.length === 0) {
      generateSuggestedTags();
    }
  }, [isTagsOpen]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * handlePlaneAnimationComplete — navigation is now fully owned by handleSave.
   * This callback is kept for PaperPlaneToast compatibility but takes no action.
   */
  const handlePlaneAnimationComplete = useCallback(() => {
    // intentionally empty — handleSave drives all timing
  }, []);

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) return;
    navigator.vibrate?.(10);
    setSaving(true);

    // ─── Step 1: Start the race. 
    //     We create a 3-second "Global Cap" to ensure the user isn't stuck if network hangs.
    //     We ALSO keep a 1.2-second "Visual Floor" for a satisfying animation.
    setShowPlane(true);
    const visualFloor = new Promise<void>(resolve => setTimeout(resolve, 1200));
    const globalCap = new Promise<void>(resolve => setTimeout(resolve, 3000));

    // ─── Step 2: Run the save.
    let saveSucceeded = false;
    let savedNoteId: string | null = null;

    try {
      // We wrap the save in a Promise.race with the globalCap to avoid deadlocks
      await Promise.race([
        (async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Not authenticated");

          let noteId = id;

          if (!noteId) {
            const newNote = await noteService.create({ title, content, tags, mood, tasks });
            noteId = newNote.id;
          }

          let finalThumbnailUrl = imagePreview;

          if (imagePreview && imagePreview.startsWith('blob:')) {
            const response = await fetch(imagePreview);
            const blob = await response.blob();
            const file = new File([blob], "cover.jpg", { type: blob.type });
            finalThumbnailUrl = await storageService.uploadFile(file, user.id, 'notes', noteId);
          } else if (!imagePreview) {
            finalThumbnailUrl = undefined;
          }

          const uploadedAttachments: NoteAttachment[] = [];
          for (const file of newAttachments) {
            const path = await storageService.uploadFile(file, user.id, 'notes', noteId);
            uploadedAttachments.push({ name: file.name, size: file.size, type: file.type, path, id: path });
          }

          await noteService.update(noteId, {
            title, content, mood, tags, tasks,
            thumbnailUrl: finalThumbnailUrl || undefined,
            attachments: [...existingAttachments, ...uploadedAttachments]
          });

          if (!isUnmounted.current) {
            if (!id) (window as any)._lastCreatedNoteId = noteId;
            savedNoteId = noteId;
            saveSucceeded = true;
            
            const currentNoteForAi = { id: noteId, title, content, tags, mood, tasks, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
            aiService.processNoteIntoWiki(currentNoteForAi).catch(e => console.error("Wiki ingestion background error:", e));
          }
        })(),
        globalCap
      ]);

    } catch (error: any) {
      if (isUnmounted.current) return;
      setShowPlane(false);
      if (error.message === 'FREE_LIMIT_REACHED') {
        setIsLimitReached(true);
      } else {
        console.error("Error saving note:", error);
        alert("Failed to save note.");
      }
      return;
    } finally {
      if (!isUnmounted.current) setSaving(false);
    }

    if (!saveSucceeded && !isUnmounted.current) {
      // If we reached here without success, it's likely a timeout or failure
      setShowPlane(false);
      return;
    }

    // ─── Step 3: Wait for the visual floor (if save was instant).
    await visualFloor;

    if (isUnmounted.current) return;

    // ─── Step 4: Check milestones, then navigate.
    const resolvedNoteId = savedNoteId || id || (window as any)._lastCreatedNoteId;
    const totalCount = await noteService.getCount();
    const recentNotes = await noteService.getRecent(10);
    const observation = observationService.checkMilestones(
      { title, content, createdAt: new Date().toISOString() } as any,
      totalCount,
      recentNotes
    );

    if (observation) {
      // Milestone: dismiss the plane, show the observation card, navigate home after.
      setShowPlane(false);
      if (!isUnmounted.current) {
        setObservationText(observation.text);
        setShowObservation(true);
        setPendingNavigation(RoutePath.HOME);
        observationService.markObservationShown();
      }
    } else {
      // Normal: fade the plane out, then glide to the homepage.
      setShowPlane(false);
      setTimeout(() => {
        if (!isUnmounted.current) navigate(RoutePath.HOME);
      }, 450); // matches the AnimatePresence exit duration (0.5s)
    }
  };

  const addTask = () => {
    navigator.vibrate?.(10);
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      text: '',
      completed: false
    };
    setTasks([...tasks, newTask]);
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, ...updates } : t));
  };

  const removeTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const toggleTask = (taskId: string) => {
    navigator.vibrate?.([10, 50, 10]);
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        const newCompleted = !t.completed;
        return { ...t, completed: newCompleted };
      }
      return t;
    }));
  };

  const cycleSparkPrompt = () => {
    const nextState = getNextWellnessPromptState(promptIndex, dynamicPrompts);
    setPromptIndex(nextState.nextIndex);
    setActivePlaceholder(nextState.prompt);
    
    // Trigger visual "blink" feedback
    setIsPromptPulse(true);
    setTimeout(() => setIsPromptPulse(false), 1000);
  };

  const handleRelease = () => {
    if (isReleasing) return;
    setIsReleasing(true);
    setTimeout(() => {
      navigate(RoutePath.NOTES);
    }, 1500);
  };

  const closeTaskDrawer = () => {
    setIsTasksOpen(false);
  };

  const toggleTaskDrawer = () => {
    if (isTasksOpen) {
      closeTaskDrawer();
      return;
    }

    if (isMobile) {
      setIsSidebarOpen(false);
    }

    setIsTasksOpen(true);
  };

  useEffect(() => {
    const wasOpen = wasTaskDrawerOpenRef.current;
    wasTaskDrawerOpenRef.current = isTasksOpen;

    if (wasOpen && !isTasksOpen) {
      taskTriggerRef.current?.focus();
      return;
    }

    if (!wasOpen && isTasksOpen && isMobile) {
      taskDrawerCloseRef.current?.focus();
    }
  }, [isMobile, isTasksOpen]);

  useEffect(() => {
    if (!isTasksOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeTaskDrawer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTasksOpen]);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) {
      return;
    }

    const shouldInertShell = isMobile && isTasksOpen;
    if (shouldInertShell) {
      shell.setAttribute('inert', '');
      shell.setAttribute('aria-hidden', 'true');
    } else {
      shell.removeAttribute('inert');
      shell.removeAttribute('aria-hidden');
    }

    return () => {
      shell.removeAttribute('inert');
      shell.removeAttribute('aria-hidden');
    };
  }, [isMobile, isTasksOpen]);



  // LIMIT REACHED UI
  const limitReachedOverlay = isLimitReached ? (
    <div className="fixed inset-0 z-[200] bg-white/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-500 py-12 md:py-20">
        <div className="relative overflow-hidden rounded-[40px] border border-white/80 bg-white/90 shadow-sm p-10 md:p-14 text-center ring-1 ring-white/50">
          
          {/* Ambient Glows */}
          <div className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] bg-blue/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-green/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center gap-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-blue/10 text-blue shadow-sm border-2 border-border border-blue/20">
              <Zap size={36} fill="currentColor" className="opacity-80" />
            </div>

            <div className="space-y-4">
              <h2 className="text-[32px] font-display tracking-tight text-gray-text leading-tight">
                Plan limit reached
              </h2>
              <p className="text-gray-light text-[18px] font-medium leading-relaxed max-w-sm mx-auto">
                Free users can create a maximum of <span className="text-blue font-bold">30 notes per month</span>. Upgrade for unlimited creative space.
              </p>
            </div>

            <div className="flex flex-col gap-4 w-full sm:flex-row sm:justify-center pt-4">
              <Button 
                variant="primary" 
                size="lg" 
                className="rounded-[20px] shadow-sm group h-14"
                onClick={() => {}} // Placeholder for upgrade
              >
                <Sparkles size={18} className="mr-2 group-hover:rotate-12 transition-transform" />
                <span>Upgrade to Pro</span>
                <ChevronRight size={16} className="ml-1 opacity-60" />
              </Button>
              <Button 
                variant="secondary" 
                size="lg" 
                className="rounded-[20px] h-14 shadow-sm text-gray-nav"
                onClick={() => {
                  setIsLimitReached(false);
                  navigate(RoutePath.NOTES);
                }}
              >
                Back to My Notes
              </Button>
            </div>
            
            <p className="text-[11px] font-black text-gray-nav/60">
              Join 2,000+ users on Pro
            </p>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  const hasContent = Boolean(content && content !== '<p><br></p>');
  const canSave = title.trim().length > 0 || hasContent;
  const canEnhance = hasContent;
  const sparkPrompt = activePlaceholder || getCurrentWellnessPrompt(promptIndex, dynamicPrompts);

  const moods = [
    { id: 'happy', icon: Smile, label: 'Happy', color: 'text-yellow-500 bg-yellow-50 border-yellow-100' },
    { id: 'calm', icon: Sun, label: 'Calm', color: 'text-emerald-500 bg-emerald-50 border-emerald-100' },
    { id: 'anxious', icon: Cloud, label: 'Anxious', color: 'text-blue-500 bg-blue-50 border-blue-100' },
    { id: 'sad', icon: Frown, label: 'Sad', color: 'text-indigo-500 bg-indigo-50 border-indigo-100' },
    { id: 'angry', icon: Zap, label: 'Angry', color: 'text-rose-500 bg-rose-50 border-rose-100' },
    { id: 'tired', icon: Moon, label: 'Tired', color: 'text-slate-500 bg-slate-50 border-slate-100' },
  ];

  // Word count for progressive AI Reflect disclosure
  const wordCount = content.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length;
  const canReflect = wordCount >= 100;

  const isDimmed = isFlowing && !isTitleFocused;

  return (
    <>
      <CompanionObservation 
        isVisible={showObservation} 
        text={observationText || ""} 
        onComplete={() => {
          setShowObservation(false);
          if (pendingNavigation) {
            navigate(pendingNavigation);
          }
        }} 
      />
      {limitReachedOverlay}

      {isContentVisible && (
        <div className="flex h-screen w-full bg-white dark:bg-panel-bg overflow-hidden relative selection:bg-blue/10">
          {/* Sidebar - Liquid Glass Drawer on Mobile, Fixed on Desktop */}
          <aside 
            className={`fixed left-0 top-0 bottom-0 w-[200px] lg:w-[180px] border-r-2 border-border z-50 transition-all duration-700 ease-out-expo px-4 py-8 flex flex-col gap-6 
              ${isMobile ? 'liquid-glass-strong rounded-r-[40px] shadow-2xl overflow-y-auto' : 'bg-white dark:bg-panel-bg'}
              ${isMobile ? (isSidebarOpen ? 'translate-x-0' : '-translate-x-full') : (isDimmed ? '-translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100')}
            `}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between lg:block mb-4">
                <span className="text-[10px] font-black text-blue tracking-widest uppercase opacity-70">Personalize Entry</span>
                <button 
                  onClick={() => setIsSidebarOpen(false)} 
                  className="lg:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-red/10 text-red hover:bg-red/20 transition-all active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex items-center gap-2 text-[12px] font-extrabold text-gray-nav">
                <Calendar size={14} className="text-gray-nav" />
                <span>{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
               <span className="text-[10px] font-black text-gray-nav tracking-widest uppercase opacity-40">Personalize</span>
               
               {/* Mood Button */}
               <div className="relative" ref={moodRef}>
                  <button 
                    onClick={() => setIsMoodOpen(!isMoodOpen)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all duration-700 ease-out-expo active:scale-95 ${mood ? 'bg-blue/10 border-blue text-blue shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-white dark:bg-panel-bg border-border text-gray-nav hover:border-blue/30'}`}
                  >
                    <div className="flex items-center gap-3">
                      {mood ? (
                        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex items-center gap-3">
                          {React.createElement(moods.find(m => m.id === mood)?.icon || Smile, { size: 18 })}
                          <span className="text-[12px] font-black">{mood}</span>
                        </motion.div>
                      ) : (
                        <>
                          <Smile size={18} />
                          <span className="text-[12px] font-black uppercase tracking-tight">Mood</span>
                        </>
                      )}
                    </div>
                    <ChevronRight size={14} className={isMoodOpen ? 'rotate-90' : ''} />
                  </button>
               </div>

               {/* Tags Button */}
               <div className="relative" ref={tagsRef}>
                  <button 
                    onClick={() => setIsTagsOpen(!isTagsOpen)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all duration-300 ease-out-expo active:scale-95 ${tags.length > 0 ? 'bg-green/5 border-green text-green' : 'bg-white dark:bg-panel-bg border-border text-gray-nav hover:border-green/30'}`}
                  >
                    <div className="flex items-center gap-3">
                      <TagIcon size={18} />
                      <span className="text-[12px] font-black uppercase tracking-tight">{tags.length > 0 ? `${tags.length} Tags` : 'Tags'}</span>
                    </div>
                    <ChevronRight size={14} className={isTagsOpen ? 'rotate-90' : ''} />
                  </button>
               </div>

               {/* Sounds Button (Consolidated from Header) */}
               <div className="relative" ref={musicRef}>
                  <button 
                    onClick={() => setIsMusicOpen(!isMusicOpen)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all duration-300 ease-out-expo active:scale-95 ${musicPlaying ? 'bg-purple-500/10 border-purple-500 text-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'bg-white dark:bg-panel-bg border-border text-gray-nav hover:border-purple-500/30'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Headphones size={18} />
                      <span className="text-[12px] font-black uppercase tracking-tight">{musicPlaying && activeMusicTrack ? activeMusicTrack.label : 'Sounds'}</span>
                    </div>
                    <ChevronRight size={14} className={isMusicOpen ? 'rotate-90' : ''} />
                  </button>
               </div>

               {/* Whisper Toggle (Consolidated from Header) */}
               <div className="relative">
                  <button 
                    onClick={toggleWhisper}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all duration-300 ease-out-expo active:scale-95 ${isWhispering ? 'bg-blue/10 border-blue text-blue shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-white dark:bg-panel-bg border-border text-gray-nav hover:border-blue/30'}`}
                  >
                    <div className="flex items-center gap-3">
                      {isWhispering ? <Mic size={18} className="animate-pulse" /> : <MicOff size={18} />}
                      <span className="text-[12px] font-black uppercase tracking-tight">Whisper</span>
                    </div>
                  </button>
               </div>

                {/* Tasks Button (Consolidated from Canvas) */}
                <div className="relative">
                   <button 
                     ref={taskTriggerRef}
                     onClick={toggleTaskDrawer}
                     aria-expanded={isTasksOpen}
                     aria-controls="create-note-task-drawer"
                     aria-haspopup={isMobile ? 'dialog' : undefined}
                     className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all duration-300 ease-out-expo active:scale-95 ${tasks.some(t => !t.completed) ? 'bg-blue/5 border-blue/40 text-blue shadow-[0_0_15px_rgba(59,130,246,0.05)]' : 'bg-white dark:bg-panel-bg border-border text-gray-nav hover:border-blue/30'}`}
                   >
                     <div className="flex items-center gap-3">
                       <ListTodo size={18} />
                       <span className="text-[12px] font-black uppercase tracking-tight">
                         {getTaskDrawerTriggerLabel(tasks).label}
                       </span>
                     </div>
                     <ChevronRight size={14} className={isTasksOpen ? 'rotate-90' : ''} />
                   </button>
                </div>

               {/* Attach & Cover Grid/Stack - Compact */}
               <div className={`grid gap-2 mt-2 grid-cols-2`}>
                  <label className="group flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-border bg-white dark:bg-panel-bg cursor-pointer transition-all duration-300 hover:bg-blue/5 hover:border-blue/30 hover:text-blue active:scale-95">
                     <Paperclip size={16} className="mb-1 opacity-50 group-hover:opacity-100" />
                     <span className="text-[9px] font-black">FILES</span>
                     <input type="file" multiple className="hidden" onChange={handleAttachmentUpload} />
                  </label>
                  
                  <label className="group flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-border bg-white dark:bg-panel-bg cursor-pointer transition-all duration-300 hover:bg-blue/5 hover:border-blue/30 hover:text-blue active:scale-95">
                     <ImageIcon size={16} className="mb-1 opacity-50 group-hover:opacity-100" />
                     <span className="text-[9px] font-black">COVER</span>
                     <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
               </div>
            </div>

            <div className="mt-auto space-y-4">
               {/* Quick Info */}
               <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-border transition-colors">
                  <p className="text-[10px] font-bold text-gray-nav flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue animate-pulse" />
                    Cloud Synced
                  </p>
               </div>
            </div>
          </aside>

          <div ref={shellRef} aria-hidden={isMobile && isTasksOpen ? true : undefined} className="contents">
            {/* Backdrop for Mobile Sidebar */}
            <AnimatePresence>
              {isMobile && isSidebarOpen && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsSidebarOpen(false)}
                  className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[45]"
                />
              )}
            </AnimatePresence>

            {/* Main Content Area */}
            <motion.main 
              layout
              className="flex-1 flex flex-col min-w-0 lg:pl-[180px]"
            >
            
            {/* Slim Top Bar */}
            <nav className={`sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-panel-bg/80 backdrop-blur-xl border-b border-border transition-all duration-700 ${isDimmed ? 'opacity-0 -translate-y-full pointer-events-none' : 'opacity-100 translate-y-0'}`}>
              <div className="flex items-center gap-4">
                 <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-xl border-2 border-border text-gray-nav hover:text-gray-text font-black text-[12px] px-4">
                   <ArrowLeft className="h-4 w-4 mr-2" />
                   Back
                 </Button>
              </div>

              <div className="flex items-center gap-3">
                {/* Personalize Trigger (Mobile Only) - Liquid Glass styled */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden flex items-center gap-2 rounded-xl border-2 border-border/40 liquid-glass font-black text-[11px] text-gray-text px-4 py-2"
                >
                  <Smile size={16} className="text-blue" />
                  <span>Personalize</span>
                </Button>

                <div className="h-6 w-[1.5px] bg-border mx-2"></div>

                {canReflect && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="border-2 border-border text-blue active:scale-95 font-black text-[11px] px-4"
                    disabled={isReflecting}
                    onClick={handleAiReflect}
                    isLoading={isReflecting}
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    Ai reflect
                  </Button>
                )}

                <Button 
                  onClick={handleSave} 
                  size="sm" 
                  variant="primary"
                  className="hidden lg:flex shadow-md active:scale-95 px-6 font-black text-[11px]"
                  disabled={!canSave || saving || showPlane}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </nav>

            {/* Content Canvas */}
            <div className={`flex-1 overflow-y-auto px-6 py-4 sm:px-12 md:px-24 transition-all duration-1000 ease-out-expo ${isDimmed ? 'pt-2' : 'pt-6'}`}>
              <div className={`w-full transition-all duration-1000 ease-out-expo ${isDimmed ? 'max-w-[1100px] ml-0' : 'max-w-[900px] mx-auto'}`}>
                <AnimatePresence mode="wait">
                  {!isReleasing && (
                    <motion.div
                      key="editor-canvas"
                      initial={false}
                      animate={{ 
                        y: isDimmed ? -80 : 0,
                        opacity: 1,
                        scale: isDimmed && isMobile ? 1 : 1
                      }}
                      transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
                      className="relative"
                    >
                      {/* Cover Image in Canvas */}
                      {imagePreview && (
                        <div className={`relative mb-12 aspect-[21/9] w-full group rounded-3xl overflow-hidden border-2 border-border shadow-sm transition-all duration-700 ${isDimmed ? (isMobile ? 'opacity-0 -translate-y-4' : 'opacity-25') : 'opacity-100'}`}>
                            <StorageImage 
                              path={imagePreview} 
                              alt="Cover" 
                              className="h-full w-full object-cover" 
                            />
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                <label className="cursor-pointer rounded-xl bg-white border-2 border-border px-3 py-1.5 text-[11px] font-bold text-gray-text shadow-sm hover:bg-gray-50">
                                    Change
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </label>
                                <button 
                                    onClick={handleRemoveCover}
                                    className="rounded-xl bg-white p-1.5 text-gray-nav border-2 border-border shadow-sm hover:text-red transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                      )}

                      {/* Editor Title & Body */}
                      <div className="relative">
                        <input
                            type="text"
                            placeholder="Title your entry..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onFocus={() => {
                              setIsFocused(true);
                              setIsTitleFocused(true);
                              if (isFlowing) setIsFlowing(false);
                            }}
                            onBlur={() => {
                              setIsFocused(false);
                              setIsTitleFocused(false);
                            }}
                            className={`w-full border-none bg-transparent text-[42px] font-serif font-semibold text-gray-text placeholder:text-border/40 focus:outline-none focus:ring-0 p-0 mb-4 tracking-tight transition-all duration-700 opacity-100 scale-100`}
                        />
                        
                        <div 
                          className={`relative min-h-[500px] transition-all duration-500 ${isPromptPulse ? 'opacity-40 animate-pulse' : 'opacity-100'}`}
                          onFocusCapture={() => setIsFocused(true)}
                          onBlurCapture={() => setIsFocused(false)}
                        >
                            <Editor 
                                ref={editorInstanceRef}
                                value={content} 
                                onChange={(val) => {
                                  setContent(val);
                                  // Strong trigger for Zen mode on any input
                                  if (isFocused || isTitleFocused) {
                                    setIsFlowing(true);
                                    if (flowTimeoutRef.current) clearTimeout(flowTimeoutRef.current);
                                    if (!isMobile) {
                                      flowTimeoutRef.current = setTimeout(() => setIsFlowing(false), 5000);
                                    }
                                  }
                                }} 
                                placeholder={activePlaceholder || (id ? "Continue writing..." : "Start typing... or click ✨ below for a spark.")}
                                hideToolbar={isMobile}
                                className="text-[19px] leading-[1.7] text-gray-text/90"
                            />
                            
                        </div>
                      </div>

                      {/* Actionable items - Faded in Flow State */}
                      <div className={`mt-20 space-y-20 transition-all duration-700 ${isDimmed ? (isMobile ? 'opacity-0 translate-y-8' : 'opacity-25') : 'opacity-100 translate-y-0'}`}>

                        {(newAttachments.length > 0 || existingAttachments.length > 0) && (
                          <div className="border-t-2 border-border pt-12 text-gray-nav">
                            <h3 className="text-[13px] font-black uppercase tracking-widest text-gray-nav/60 mb-8">Attachments</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                               {existingAttachments.map((att) => (
                                <div key={att.path} className="group relative flex items-center gap-4 p-5 rounded-[24px] border-2 border-border bg-white dark:bg-panel-bg hover:bg-blue/5 dark:hover:bg-blue/10 hover:border-blue/30 transition-all duration-500 shadow-sm hover:shadow-none hover:translate-y-[2px] liquid-glass">
                                  <div className="h-12 w-12 shrink-0 rounded-2xl bg-white dark:bg-panel-bg border-2 border-border flex items-center justify-center text-gray-nav shadow-inner overflow-hidden">
                                     {att.type?.startsWith('image/') ? (
                                       <StorageImage 
                                         path={att.path} 
                                         alt={att.name} 
                                         className="h-full w-full object-cover transition-transform group-hover:scale-110" 
                                       />
                                     ) : (
                                       <div className="text-blue/40 group-hover:text-blue transition-colors">
                                         {getFileIcon(att.type || '')}
                                       </div>
                                     )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[13px] font-bold text-gray-text truncate">{att.name}</p>
                                  </div>
                                  <button 
                                    onClick={() => removeExistingAttachment(att)}
                                    className="h-8 w-8 rounded-lg bg-white dark:bg-panel-bg text-gray-nav border-2 border-border shadow-sm flex items-center justify-center hover:text-red hover:border-red/30 active:scale-[0.98] transition-all duration-200"
                                    title="Remove attachment"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ))}
                              {newAttachments.map((file, index) => {
                                const isImage = file.type?.startsWith('image/');
                                return (
                                  <div key={`new-${index}`} className="group relative flex items-center gap-4 p-5 rounded-[24px] border-2 border-blue/20 bg-blue/5 hover:bg-white dark:hover:bg-panel-bg hover:border-blue/40 transition-all duration-500 shadow-sm hover:shadow-none hover:translate-y-[2px] liquid-glass animate-in zoom-in-95 duration-300">
                                    <div className="h-12 w-12 shrink-0 rounded-2xl bg-white border-2 border-blue/20 flex items-center justify-center text-blue shadow-inner overflow-hidden">
                                      {getFileIcon(file.type)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-[13px] font-bold text-gray-text truncate">{file.name}</p>
                                    </div>
                                    <button 
                                      onClick={() => removeNewAttachment(index)}
                                      className="h-8 w-8 rounded-lg bg-white dark:bg-panel-bg text-gray-nav border-2 border-border shadow-sm flex items-center justify-center hover:text-red hover:border-red/30 active:scale-[0.98] transition-all duration-200"
                                      title="Remove attachment"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Root-Level Universal Floating Actions (Ensures Screen Consistency) */}
                <div className={`fixed z-50 transition-all duration-700 ${isMobile ? 'right-4 top-1/2 -translate-y-1/2' : 'bottom-20 right-8'}`}>
                  <AnimatePresence mode="wait">
                    {showPlane ? null : !hasContent ? (
                      /* ── AI Spark FAB ── */
                      <motion.button
                        key="spark-fab"
                        initial={{ opacity: 0, scale: 0.85, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.85, y: 10 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={cycleSparkPrompt}
                        className={`flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-blue/20 bg-white/80 backdrop-blur-xl shadow-xl text-blue transition-all duration-700 hover:shadow-2xl active:scale-95 ${isDimmed ? 'opacity-0 pointer-events-none translate-x-4' : 'opacity-100 translate-x-0'}`}
                      >
                        <Sparkles size={24} className={isGeneratingPrompts ? 'animate-pulse' : ''} />
                      </motion.button>
                    ) : (
                      /* ── Save FAB ── */
                      <motion.button
                        key="save-fab"
                        initial={{ opacity: 0, scale: 0.85, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.85, y: 10 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSave}
                        disabled={!canSave || saving}
                        className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-green text-white shadow-xl transition-all duration-700 active:scale-95 ${isDimmed ? 'opacity-0 pointer-events-none translate-x-4' : 'opacity-100 translate-x-0'}`}
                      >
                        {saving ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
            </motion.main>
          </div>

          {/* Global Portals for Sidebar buttons */}
          {createPortal(
            <AnimatePresence>
              {isMoodOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-md" 
                    onClick={() => setIsMoodOpen(false)} 
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-[340px] bg-white/90 dark:bg-panel-bg/90 liquid-glass-strong border-2 border-border/40 rounded-[40px] p-8 shadow-2xl overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-[18px] font-black text-gray-text tracking-tight">How are you?</h3>
                        <p className="text-[11px] font-bold text-gray-nav">Select your current energy</p>
                      </div>
                      <button 
                        onClick={() => setIsMoodOpen(false)}
                        className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-nav hover:text-red transition-all"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                       {moods.map(m => (
                         <button 
                           key={m.id} 
                           onClick={() => { handleMoodSelect(m.id); setIsMoodOpen(false); }} 
                           className={`group flex flex-col items-center justify-center p-4 rounded-[28px] border-2 transition-all duration-300 active:scale-95 ${mood === m.id ? `${m.color} border-current shadow-lg` : 'bg-white dark:bg-white/5 border-transparent hover:border-border'}`}
                         >
                           <div className={`mb-2 transition-transform duration-500 group-hover:scale-110 ${mood === m.id ? 'scale-110' : ''}`}>
                             {React.createElement(m.icon, { size: 24 })}
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-tighter">{m.label}</span>
                         </button>
                       ))}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>,
            document.body
          )}

          {createPortal(
            <AnimatePresence>
              {isTagsOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-md" 
                    onClick={() => setIsTagsOpen(false)} 
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-[380px] bg-white/90 dark:bg-panel-bg/90 liquid-glass-strong border-2 border-border/40 rounded-[40px] p-8 shadow-2xl"
                  >
                    <div className="flex items-center justify-between mb-8">
                       <div>
                         <h3 className="text-[18px] font-black text-gray-text tracking-tight">Sanctuary Tags</h3>
                         <p className="text-[11px] font-bold text-gray-nav">Organize your thoughts</p>
                       </div>
                       <button 
                        onClick={() => setIsTagsOpen(false)}
                        className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-nav hover:text-red transition-all"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div className="relative">
                        <input 
                          type="text" 
                          placeholder="Type and press Enter..." 
                          value={tagInput} 
                          onChange={(e) => setTagInput(e.target.value)} 
                          onKeyDown={handleAddTag} 
                          className="w-full pl-4 pr-12 py-3.5 rounded-2xl border-2 border-border dark:border-white/10 bg-white/50 dark:bg-black/20 focus:border-blue outline-none text-[14px] font-bold transition-all" 
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-nav/40">
                          <TagIcon size={18} />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto pr-2">
                        {tags.length === 0 && <p className="text-[11px] font-bold text-gray-nav/40 italic">No tags added yet...</p>}
                        {tags.map(tag => (
                          <motion.span 
                            key={tag} 
                            initial={{ scale: 0.8, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }}
                            className="px-3 py-1.5 rounded-xl bg-blue/5 border-2 border-blue/20 text-[11px] font-black text-blue flex items-center gap-2 group"
                          >
                            #{tag} 
                            <X size={12} className="cursor-pointer opacity-40 group-hover:opacity-100 hover:text-red transition-all" onClick={() => removeTag(tag)} />
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>,
            document.body
          )}
          
          {createPortal(
            <AnimatePresence>
              {isMusicOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-md" 
                    onClick={() => setIsMusicOpen(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-[340px] bg-white/95 dark:bg-panel-bg/95 liquid-glass-strong border-2 border-border/40 rounded-[40px] p-8 shadow-2xl overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-[18px] font-black text-gray-text tracking-tight">Ambient sounds</h3>
                        <p className="text-[11px] font-bold text-gray-nav">Curated focus loops</p>
                      </div>
                      <button 
                        onClick={() => setIsMusicOpen(false)}
                        className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-nav hover:text-red transition-all"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {AMBIENT_TRACKS.map(track => {
                        const isActive = activeMusicTrack?.id === track.id;
                        return (
                          <button 
                            key={track.id} 
                            onClick={() => isActive ? stopMusic() : playMusicTrack(track)} 
                            className={`w-full group relative flex items-center gap-4 p-4 rounded-3xl border-2 transition-all duration-300 active:scale-[0.98] ${isActive ? 'bg-white dark:bg-panel-bg border-purple-500/30' : 'bg-white/50 dark:bg-white/5 border-transparent hover:border-border'}`}
                          >
                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl transition-all duration-500 ${isActive ? 'bg-purple-500/10 scale-105' : 'bg-gray-100 dark:bg-white/5'}`}>
                              {track.emoji}
                            </div>
                            <span className={`flex-1 text-left text-[14px] font-black ${isActive ? 'text-gray-text' : 'text-gray-nav'}`}>
                              {track.label}
                            </span>
                            {isActive && (
                              <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>,
            document.body
          )}

          {/* Task Portal Modal */}
          {createPortal(
            <AnimatePresence>
              {isTasksOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-md" 
                    onClick={closeTaskDrawer} 
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-[420px] bg-white/95 dark:bg-panel-bg/95 liquid-glass-strong border-2 border-border/40 rounded-[40px] p-8 shadow-2xl flex flex-col max-h-[80vh]"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-2xl bg-blue/10 flex items-center justify-center text-blue">
                            <ListTodo size={20} />
                         </div>
                         <span className="text-[14px] font-black text-gray-nav uppercase tracking-widest">Tasks</span>
                      </div>
                      <button 
                        ref={taskDrawerCloseRef}
                        onClick={closeTaskDrawer}
                        className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-nav hover:text-red transition-all"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar no-scrollbar scroll-smooth mb-6">
                      {tasks.length === 0 ? (
                        <div className="text-center py-12 opacity-30 select-none">
                          <ListTodo size={32} className="mx-auto mb-3 opacity-40" />
                          <p className="text-[11px] font-bold italic">Nothing here yet. Add one small thing you want to hold onto.</p>
                        </div>
                      ) : (
                        getOrderedTasks(tasks).map((task) => (
                          <TaskRow key={task.id} task={task} updateTask={updateTask} toggleTask={toggleTask} removeTask={removeTask} addTask={addTask} />
                        ))
                      )}
                    </div>

                    <div>
                      <button 
                        onClick={addTask}
                        className="w-full h-14 flex items-center justify-center gap-3 rounded-[24px] bg-blue text-white text-[13px] font-black hover:bg-blue/90 shadow-lg shadow-blue/20 transition-all active:scale-[0.98]"
                      >
                        <Plus size={20} />
                        <span>Add New Task</span>
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>,
            document.body
          )}

          <PaperPlaneToast isVisible={showPlane} onAnimationComplete={handlePlaneAnimationComplete} />
        </div>
      )}
    </>
  );
};
