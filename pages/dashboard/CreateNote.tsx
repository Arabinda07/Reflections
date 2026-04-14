import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Save, ArrowLeft, Image as ImageIcon, Wand2, X, Calendar, Loader2, Paperclip, File as FileIcon, FileText, Zap, Sparkles, ChevronRight, Smile, Meh, Frown, Sun, Cloud, Moon, Heart, Brain, Coffee, MessageSquare, Tag as TagIcon, CheckCircle2, Check, CheckSquare, Square, Plus, Trash2, Eye, EyeOff, ListTodo, Wind, Target, Mic, MicOff, Music, Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Editor, EditorRef } from '../../components/ui/Editor';
import { noteService } from '../../services/noteService';
import { storageService } from '../../services/storageService';
import { RoutePath, NoteAttachment, Task } from '../../types';
import { supabase } from '../../src/supabaseClient';
import { StorageImage } from '../../components/ui/StorageImage';
import { GoogleGenAI, Type } from "@google/genai";
import { BreathingGate } from '../../components/wellness/BreathingGate';
import { DEFAULT_WELLNESS_PROMPTS, getCurrentWellnessPrompt, getNextWellnessPromptState } from '../../services/wellnessPrompts';

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

const apiKey = typeof process !== 'undefined' && process.env.GEMINI_API_KEY 
  ? process.env.GEMINI_API_KEY 
  : (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

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
      animate={
        task.completed
          ? {
              scale: 0.99,
              backgroundColor: 'rgba(236, 253, 245, 0.58)',
              borderColor: 'rgba(125, 211, 252, 0.55)',
              boxShadow: '0 0 0 1px rgba(186, 230, 253, 0.55), 0 18px 45px -35px rgba(14, 165, 233, 0.7)',
            }
          : {
              scale: 1,
              backgroundColor: 'rgba(255, 255, 255, 1)',
              borderColor: 'rgb(229, 229, 229)',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
            }
      }
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="group relative flex items-center gap-2 overflow-hidden rounded-[24px] border-2 p-3 sm:gap-4 sm:p-4"
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
            ? 'border-sky-400 bg-sky-400 text-white shadow-[0_0_18px_rgba(14,165,233,0.38)]'
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
        type="text"
        value={task.text}
        onChange={(e) => updateTask(task.id, { text: e.target.value })}
        readOnly={task.completed}
        placeholder="Your Task"
        className={`relative z-10 flex-1 min-w-0 bg-transparent border-none focus:ring-0 text-[14px] px-1 font-bold text-gray-text placeholder:text-border transition-all duration-500 ${
          showCompletedText ? 'line-through text-gray-nav cursor-default decoration-sky-400 decoration-2' : ''
        }`}
      />

      <div className={`relative z-10 flex shrink-0 items-center gap-1 transition-all duration-300 sm:gap-2 ${task.completed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <input
          type="date"
          value={task.dueDate || ''}
          onChange={(e) => updateTask(task.id, { dueDate: e.target.value })}
          className="text-[11px] font-bold text-gray-nav bg-gray-50 border-none rounded-lg p-1 focus:ring-0"
        />
        <button
          type="button"
          onClick={() => removeTask(task.id)}
          className="p-2 rounded-xl text-gray-nav hover:text-red hover:bg-red/5 transition-all"
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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
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
  const [isBreathing, setIsBreathing] = useState(!id);
  const [isReleasing, setIsReleasing] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);

  const [isMoodOpen, setIsMoodOpen] = useState(false);
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isFocusModeManual, setIsFocusModeManual] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  
  // Mindful Features States
  const [isMusicOpen, setIsMusicOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Whisper Mode States
  const [isWhispering, setIsWhispering] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const isWhisperingRef = useRef(false);

  const AMBIENT_TRACKS = [
    { id: 'rain', name: 'Soft Rain', url: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg' },
    { id: 'waves', name: 'Deep Focus', url: 'https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg' },
    { id: 'coffee', name: 'Calm Vibe', url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg' }
  ];
  
  const moodRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);
  const musicRef = useRef<HTMLDivElement>(null);
  
  const lastSavedRef = useRef({ title: '', content: '', mood: undefined as string | undefined, tags: [] as string[], tasks: [] as Task[] });
  const editorInstanceRef = useRef<EditorRef>(null);
  const isUnmounted = useRef(false);
  const shouldReduceMotion = useReducedMotion();
  const releaseEase = [0.4, 0, 0.2, 1];

  const toggleMusic = (trackUrl: string) => {
    if (currentTrack === trackUrl) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      setCurrentTrack(trackUrl);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.src = trackUrl;
        audioRef.current.play();
      }
    }
  };

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
          // If creating a NEW note, unblock UI immediately
          if (isUnmounted.current) return;
          setLoading(false);
          
          // Generate initial prompts for new note without awaiting
          generateDynamicPrompts();
          
          // Check count for current month asynchronously
          const count = await noteService.getMonthlyCount();
          if (isUnmounted.current) return;
          if (count >= 30) {
            setIsLimitReached(true);
          }
        } else {
          // If editing an EXISTING note, we must block to fetch data
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
            // Generate prompts based on existing mood
            generateDynamicPrompts(note.mood);
            
            // Focus editor for existing note
            setTimeout(() => {
              editorInstanceRef.current?.focus();
            }, 500);
          } else {
             navigate(RoutePath.NOTES);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to initialize note view", error);
        setLoading(false);
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
      const pastNotes = await noteService.getAll();
      // Use titles of last 3 notes for context
      const pastContext = pastNotes
        .filter(n => n.id !== id)
        .slice(0, 3)
        .map(n => n.title)
        .filter(Boolean)
        .join(', ');
      
      const moodContext = currentMood ? `The user is currently feeling ${currentMood}.` : 'The user hasn\'t specified their mood yet.';
      const context = pastContext ? `Their recent entries were about: ${pastContext}.` : '';

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a helpful journaling assistant. Generate 4 unique, personalized journaling prompts for the user. ${moodContext} ${context} The prompts should be short, encouraging, and relevant to their current state or past topics. Return only a JSON array of strings.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      const text = response.text || "[]";
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const result = JSON.parse(cleanText);
      
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
      const plainText = content.replace(/<[^>]*>/g, '');
      const moodText = mood ? `The user is feeling ${mood}.` : 'The user has not specified a specific mood.';
      const titleText = title ? `The entry is titled "${title}".` : 'The entry has no title.';
      
      const pastNotes = await noteService.getAll();
      const pastContext = pastNotes
        .filter(n => n.id !== id)
        .slice(0, 5)
        .map(n => n.title)
        .filter(Boolean)
        .join(', ');

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a compassionate mental health journaling assistant. 
        Based on the following journal entry and the user's past context, provide a brief (2-3 sentences), empathetic reflection.
        
        CRITICAL RULES:
        1. If the current entry is too short (less than 50 words) and there are fewer than 3 past entries, DO NOT hallucinate deep insights. Instead, warmly encourage the user to write more so you can get to know them better.
        2. If you have enough data, reference specific themes or emotions mentioned.
        3. Be supportive, non-judgmental, and deeply contextual.
        
        Past Context (titles of recent entries):
        ${pastContext || 'No past entries yet.'}
        
        Current Entry Context:
        - Title: ${title || 'Untitled'}
        - Mood: ${mood || 'Not specified'}
        
        Entry Content:
        ${plainText}
        
        Your response should be warm, insightful, and encourage further self-reflection.`,
      });
      
      if (isUnmounted.current) return;
      setAiReflection(response.text || "I'm here to listen. Your thoughts are valid.");
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
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Based on this journal entry, suggest 3 relevant tags for organization. Return only a JSON array of strings.
        
        Entry:
        ${plainText}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      const result = JSON.parse(response.text || "[]");
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

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) return;
    setSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let noteId = id;
      let noteData: any = { title, content, tags, mood, tasks };
      
      if (!noteId) {
        const newNote = await noteService.create(noteData);
        noteId = newNote.id;
      }

      let finalThumbnailUrl = imagePreview;
      
      if (imagePreview && imagePreview.startsWith('blob:')) {
        const response = await fetch(imagePreview);
        const blob = await response.blob();
        const file = new File([blob], "cover.jpg", { type: blob.type });
        
        finalThumbnailUrl = await storageService.uploadFile(
          file, 
          user.id, 
          'notes',
          noteId
        );
      } 
      else if (!imagePreview) {
        finalThumbnailUrl = undefined;
      }

      const uploadedAttachments: NoteAttachment[] = [];
      for (const file of newAttachments) {
        const path = await storageService.uploadFile(
          file, 
          user.id, 
          'notes',
          noteId
        );
        uploadedAttachments.push({
          name: file.name,
          size: file.size,
          type: file.type,
          path: path,
          id: path
        });
      }

      const finalAttachments = [...existingAttachments, ...uploadedAttachments];

      await noteService.update(noteId, {
        title,
        content,
        mood,
        tags,
        tasks,
        thumbnailUrl: finalThumbnailUrl || undefined,
        attachments: finalAttachments
      });

      if (isUnmounted.current) return;
      navigate(RoutePath.NOTE_DETAIL.replace(':id', noteId));
      
    } catch (error: any) {
      if (isUnmounted.current) return;
      if (error.message === 'FREE_LIMIT_REACHED') {
        setIsLimitReached(true);
      } else {
        console.error("Error saving note:", error);
        alert("Failed to save note.");
      }
    } finally {
      if (!isUnmounted.current) setSaving(false);
    }
  };

  const addTask = () => {
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
  };

  const handleRelease = () => {
    if (isReleasing) return;
    setIsReleasing(true);
    setTimeout(() => {
      navigate(RoutePath.NOTES);
    }, 1500);
  };

  if (loading) {
     return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>;
  }

  // LIMIT REACHED UI
  const limitReachedOverlay = isLimitReached ? (
    <div className="fixed inset-0 z-[200] bg-white/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-500 py-12 md:py-20">
        <div className="relative overflow-hidden rounded-[40px] border border-white/80 bg-white/90 shadow-[0_40px_100px_-15px_rgba(0,0,0,0.05)] p-10 md:p-14 text-center ring-1 ring-white/50">
          
          {/* Ambient Glows */}
          <div className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] bg-blue/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-green/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center gap-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-blue/10 text-blue shadow-3d-gray border-2 border-border border-blue/20">
              <Zap size={36} fill="currentColor" className="opacity-80" />
            </div>

            <div className="space-y-4">
              <h2 className="text-[32px] font-display lowercase tracking-tight text-gray-text leading-tight">
                Plan Limit Reached
              </h2>
              <p className="text-gray-light text-[18px] font-medium leading-relaxed max-w-sm mx-auto">
                Free users can create a maximum of <span className="text-blue font-bold">30 notes per month</span>. Upgrade for unlimited creative space.
              </p>
            </div>

            <div className="flex flex-col gap-4 w-full sm:flex-row sm:justify-center pt-4">
              <Button 
                variant="primary" 
                size="lg" 
                className="rounded-[20px] shadow-3d-green group h-14"
                onClick={() => {}} // Placeholder for upgrade
              >
                <Sparkles size={18} className="mr-2 group-hover:rotate-12 transition-transform" />
                <span>Upgrade to Pro</span>
                <ChevronRight size={16} className="ml-1 opacity-60" />
              </Button>
              <Button 
                variant="secondary" 
                size="lg" 
                className="rounded-[20px] h-14 shadow-3d-gray text-gray-nav"
                onClick={() => {
                  setIsLimitReached(false);
                  navigate(RoutePath.NOTES);
                }}
              >
                Back to My Notes
              </Button>
            </div>
            
            <p className="text-[11px] font-black text-gray-nav/60 uppercase tracking-widest">
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

  const isDimmed = isFocusModeManual;

  return (
    <>
      <BreathingGate active={isBreathing} durationMs={3600} onComplete={handleBreathingComplete} />
      {limitReachedOverlay}
      <div className={`mx-auto max-w-[1180px] transition-opacity duration-1000 ${isBreathing ? 'opacity-0 pointer-events-none' : 'opacity-100 animate-in fade-in duration-500'} pb-20 px-3 sm:px-4 md:px-6`}>
        <nav className={`sticky top-4 z-50 mb-8 flex items-center justify-between gap-2 rounded-2xl border-2 border-border bg-white/90 px-3 py-2 sm:px-4 sm:py-3 shadow-[0_4px_0_0_#E5E5E5] backdrop-blur-2xl transition-all duration-500 dark:bg-[#17171b]/90 dark:shadow-[0_4px_0_0_rgba(15,23,42,0.55)] ${isDimmed ? 'opacity-40 hover:opacity-100' : 'opacity-100'}`}>
        <div className="flex items-center gap-2 sm:gap-3">
           <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-gray-nav hover:text-gray-text font-bold uppercase text-[12px] px-2 sm:px-3">
             <ArrowLeft className="h-4 w-4 sm:mr-2" />
             <span className="hidden sm:inline">BACK</span>
           </Button>
           <div className="h-4 w-[2px] bg-border"></div>
           <div className="flex flex-col">
             <span className="text-[12px] font-extrabold text-gray-nav uppercase tracking-wider">
                {id ? 'EDIT' : ''}
             </span>
           </div>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFocusModeManual(!isFocusModeManual)}
            className={`flex items-center gap-2 font-bold uppercase text-[11px] transition-all ${
              isFocusModeManual ? 'text-blue bg-blue/5' : 'text-gray-nav'
            }`}
            title={isFocusModeManual ? "Disable Focus Mode" : "Enable Focus Mode"}
          >
            {isFocusModeManual ? <Eye size={16} /> : <EyeOff size={16} />}
            <span className="hidden sm:inline">Focus</span>
          </Button>

          {/* Whisper Mode Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleWhisper}
            className={`flex items-center gap-2 font-bold uppercase text-[11px] transition-all ${isWhispering ? 'text-blue bg-blue/5' : 'text-gray-nav'}`}
            title="Whisper Mode"
          >
            {isWhispering ? <Mic size={16} className="animate-pulse" /> : <MicOff size={16} />}
            <span className="hidden md:inline">Whisper</span>
          </Button>

          {/* Music Player Button */}
          <div className="relative" ref={musicRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (!isMusicOpen) {
                  setIsMusicOpen(true);
                } else if (isPlaying) {
                  audioRef.current?.pause();
                  setIsPlaying(false);
                } else {
                  setIsMusicOpen(false);
                }
              }}
              className={`flex items-center gap-2 font-bold uppercase text-[11px] transition-all ${isPlaying ? 'text-purple-500 bg-purple-500/5' : 'text-gray-nav'}`}
              title="Ambient Sounds"
            >
              <Music size={16} />
              <span className="hidden md:inline">Sounds</span>
            </Button>
            
            {createPortal(
              <AnimatePresence>
                {isMusicOpen && (
                  <div className="fixed inset-0 z-[10000] pointer-events-none flex items-end justify-center sm:items-start sm:justify-start">
                    <motion.div 
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      className="music-popup-container pointer-events-auto p-5 bg-white border-2 border-border rounded-[32px] shadow-2xl w-[calc(100%-32px)] sm:w-[260px] liquid-glass-strong sm:fixed relative mb-4 sm:mb-0"
                      style={window.innerWidth >= 640 ? {
                        top: musicRef.current ? musicRef.current.getBoundingClientRect().bottom + window.scrollY + 12 : 0,
                        left: musicRef.current ? musicRef.current.getBoundingClientRect().left - 100 + window.scrollX : 0
                      } : {}}
                    >
                      <div className="flex items-center justify-between mb-4 px-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-nav flex items-center gap-2">
                          <Volume2 size={12} /> Ambient Focus
                        </span>
                      </div>
                      <div className="space-y-2">
                        {AMBIENT_TRACKS.map(track => (
                          <button
                            key={track.id}
                            onClick={() => toggleMusic(track.url)}
                            className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${
                              currentTrack === track.url 
                                ? 'border-purple-500/30 bg-purple-500/5 text-purple-600' 
                                : 'border-border bg-white text-gray-text hover:border-purple-500/30'
                            }`}
                          >
                            <span className="text-[12px] font-bold">{track.name}</span>
                            {currentTrack === track.url && isPlaying ? (
                              <Pause size={14} className="text-purple-500" />
                            ) : (
                              <Play size={14} className={currentTrack === track.url ? "text-purple-500" : "text-gray-nav"} />
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>,
              document.body
            )}
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRelease} 
            className="text-gray-nav hover:text-red hover:bg-red/5 font-bold uppercase text-[11px] transition-all px-2 sm:px-3" 
            disabled={isReleasing}
          >
              <Wind className="h-3.5 w-3.5 sm:mr-2" />
              <span className="hidden sm:inline">RELEASE</span>
          </Button>

          <AnimatePresence mode="wait">
            {saveStatus === 'saving' && (
              <motion.div 
                key="saving"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-1.5 rounded-full border border-blue/10 bg-blue/5 px-3 py-1 text-[11px] font-bold text-blue dark:border-sky-400/20 dark:bg-sky-400/12 dark:text-sky-100"
              >
                <Loader2 size={12} className="animate-spin" />
                <span>Saving...</span>
              </motion.div>
            )}
            {saveStatus === 'saved' && (
              <motion.div 
                key="saved"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 rounded-full border border-green/10 bg-green/5 px-3 py-1 text-[11px] font-bold text-green dark:border-emerald-400/20 dark:bg-emerald-400/12 dark:text-emerald-100"
              >
                <Check size={12} className="text-green" />
                <span>Saved</span>
              </motion.div>
            )}
          </AnimatePresence>
            <Button 
              variant="secondary" 
              size="sm" 
              className="border-2 border-border text-blue shadow-3d-gray active:shadow-none active:translate-y-[2px] transition-all dark:bg-white/6 px-2 sm:px-3 dark:text-sky-100 dark:shadow-[0_3px_0_0_rgba(15,23,42,0.55)]"
              disabled={!canEnhance || isReflecting}
              onClick={handleAiReflect}
              isLoading={isReflecting}
            >
                <Wand2 className="h-3.5 w-3.5 sm:mr-2" />
                <span className="hidden sm:inline">AI REFLECT</span>
            </Button>
            <Button 
              onClick={handleSave} 
              size="sm" 
              variant="primary"
              className="shadow-3d-green px-2 sm:px-3 active:shadow-none active:translate-y-[2px] transition-all"
              isLoading={saving} 
              disabled={!canSave}
            >
              <Save className="h-3.5 w-3.5 sm:mr-2" />
              <span className="hidden sm:inline">SAVE</span>
            </Button>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {!isReleasing && (
          <motion.div
            key="editor-shell"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -50, scale: 0.98, filter: 'blur(12px)' }}
            transition={{ duration: 1.2, ease: releaseEase }}
            className="mx-auto w-full max-w-[1100px]"
          >
          <div className="relative min-h-[70vh] rounded-[32px] border-2 border-border bg-white shadow-[0_8px_0_0_#E5E5E5] flex flex-col liquid-glass !overflow-visible dark:bg-[#17171b] dark:shadow-[0_8px_0_0_rgba(15,23,42,0.58)]">
            {imagePreview && (
              <div className="relative aspect-[21/9] w-full group bg-white border-b-2 border-border rounded-t-[30px] overflow-hidden">
                  <StorageImage 
                    path={imagePreview} 
                    alt="Cover" 
                    className="h-full w-full object-cover" 
                  />
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      <label className="cursor-pointer rounded-xl bg-white border-2 border-border px-3 py-1.5 text-[11px] font-bold text-gray-text shadow-[0_2px_0_0_#E5E5E5] hover:bg-white transition-colors">
                          CHANGE
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </label>
                      <button 
                          onClick={handleRemoveCover}
                          className="rounded-xl bg-white p-1.5 text-gray-nav border-2 border-border shadow-[0_2px_0_0_#E5E5E5] hover:text-red transition-colors"
                      >
                          <X size={16} />
                      </button>
                  </div>
              </div>
            )}

            <div className="flex-1 px-4 py-6 sm:px-6 md:px-10 md:py-8 lg:px-12 lg:py-10">
                <div className={`mb-12 flex flex-wrap items-center justify-between gap-4 transition-all duration-500 ${isDimmed ? 'opacity-30 hover:opacity-100' : 'opacity-100'}`}>
                    <div className="flex items-center gap-2 text-[11px] font-extrabold text-gray-nav uppercase tracking-wider">
                        <Calendar size={13} />
                        <span>{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>

                    <div className="flex w-full items-center gap-2 overflow-x-auto no-scrollbar pb-2 sm:overflow-visible sm:pb-0 sm:flex-wrap sm:gap-3 sm:w-auto">


                       {/* Progressive Disclosure: Mood Button */}
                       <div className="relative" ref={moodRef}>
                          <button 
                            onClick={() => setIsMoodOpen(!isMoodOpen)}
                            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border-2 transition-all shadow-[0_2px_0_0_#E5E5E5] active:shadow-none active:translate-y-[2px] ${mood ? 'bg-blue/5 border-blue text-blue' : 'bg-white border-border text-gray-nav hover:border-blue/30'}`}
                          >
                            {mood ? (
                              <>
                                {React.createElement(moods.find(m => m.id === mood)?.icon || Smile, { size: 16 })}
                                <span className="text-[10px] sm:text-[11px] font-black uppercase">{mood}</span>
                              </>
                            ) : (
                              <>
                                <Smile size={16} />
                                <span className="text-[10px] sm:text-[11px] font-black uppercase">Mood</span>
                              </>
                            )}
                          </button>
                          
                          {createPortal(
                            <AnimatePresence>
                              {isMoodOpen && (
                                <div className="fixed inset-0 z-[10000] pointer-events-none flex items-end justify-center sm:items-start sm:justify-start">
                                  <motion.div 
                                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                                    className="mood-popup-container pointer-events-auto liquid-glass-strong border-2 border-border rounded-[32px] p-6 shadow-2xl w-[calc(100%-32px)] sm:w-[280px] sm:fixed relative mb-4 sm:mb-0"
                                    style={window.innerWidth >= 640 ? {
                                      top: moodRef.current ? moodRef.current.getBoundingClientRect().bottom + window.scrollY + 12 : 0,
                                      left: moodRef.current ? moodRef.current.getBoundingClientRect().left + window.scrollX : 0
                                    } : {}}
                                  >
                                    <div className="flex items-center justify-between mb-4 px-1">
                                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-nav">How are you?</span>
                                      {mood && <button onClick={() => handleMoodSelect(mood)} className="text-[10px] font-bold text-red uppercase">Clear</button>}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                      {moods.map((m) => {
                                        const Icon = m.icon;
                                        const isSelected = mood === m.id;
                                        return (
                                          <button
                                            key={m.id}
                                            onClick={() => {
                                              handleMoodSelect(m.id);
                                              setIsMoodOpen(false);
                                            }}
                                            className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${isSelected ? `${m.color} border-current` : 'border-transparent hover:bg-gray-50 text-gray-nav'}`}
                                          >
                                            <Icon size={20} />
                                            <span className="mt-1 text-[9px] font-bold uppercase">{m.label}</span>
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
                       </div>

                       {/* Progressive Disclosure: Tags Button */}
                       <div className="relative" ref={tagsRef}>
                          <button 
                            onClick={() => setIsTagsOpen(!isTagsOpen)}
                            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border-2 transition-all shadow-[0_2px_0_0_#E5E5E5] active:shadow-none active:translate-y-[2px] ${tags.length > 0 ? 'bg-green/5 border-green text-green' : 'bg-white border-border text-gray-nav hover:border-green/30'}`}
                          >
                            <TagIcon size={16} />
                            <span className="text-[10px] sm:text-[11px] font-black uppercase">{tags.length > 0 ? `${tags.length} Tags` : 'Tags'}</span>
                          </button>

                          {createPortal(
                            <AnimatePresence>
                              {isTagsOpen && (
                                <div className="fixed inset-0 z-[10000] pointer-events-none flex items-end justify-center sm:items-start sm:justify-start">
                                  <motion.div 
                                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                                    className="tags-popup-container pointer-events-auto liquid-glass-strong border-2 border-border rounded-[32px] p-6 shadow-2xl w-[calc(100%-32px)] sm:w-[320px] sm:fixed relative mb-4 sm:mb-0"
                                    style={window.innerWidth >= 640 ? {
                                      top: tagsRef.current ? tagsRef.current.getBoundingClientRect().bottom + window.scrollY + 12 : 0,
                                      left: tagsRef.current ? tagsRef.current.getBoundingClientRect().left - 40 + window.scrollX : 0
                                    } : {}}
                                  >
                                    <div className="mb-4">
                                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-nav block mb-3">Add Tags</span>
                                      <div className="relative">
                                        <TagIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-nav" />
                                        <input 
                                          type="text"
                                          placeholder="Type and press Enter..."
                                          value={tagInput}
                                          onChange={(e) => setTagInput(e.target.value)}
                                          onKeyDown={handleAddTag}
                                          className="w-full pl-9 pr-4 py-2 rounded-xl border-2 border-border bg-white text-[13px] font-bold focus:border-blue focus:outline-none transition-all"
                                        />
                                      </div>
                                    </div>

                                    {suggestedTags.length > 0 && (
                                      <div className="mb-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue block mb-2">AI Suggestions</span>
                                        <div className="flex flex-wrap gap-2">
                                          {suggestedTags.map(tag => (
                                            <button 
                                              key={tag}
                                              onClick={() => {
                                                if (!tags.includes(tag)) setTags([...tags, tag]);
                                                setSuggestedTags(prev => prev.filter(t => t !== tag));
                                              }}
                                              className="px-2 py-1 rounded-lg bg-blue/5 border border-blue/10 text-blue text-[10px] font-bold hover:bg-blue/10 transition-all"
                                            >
                                              +{tag}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                                      {tags.map(tag => (
                                        <span key={tag} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-100 border border-border text-gray-text text-[11px] font-bold">
                                          #{tag}
                                          <button onClick={() => removeTag(tag)} className="hover:text-red transition-colors">
                                            <X size={10} />
                                          </button>
                                        </span>
                                      ))}
                                    </div>
                                  </motion.div>
                                </div>
                              )}
                            </AnimatePresence>,
                            document.body
                          )}
                       </div>

                       <label className="group flex cursor-pointer items-center gap-1.5 rounded-xl border-2 border-border bg-white px-3 sm:px-4 py-2 text-[10px] sm:text-[11px] font-black uppercase text-gray-nav transition-all hover:bg-blue/5 hover:text-blue hover:border-blue/30 shadow-[0_2px_0_0_#E5E5E5] active:shadow-none active:translate-y-[2px]">
                          <Paperclip size={16} className="text-gray-nav group-hover:text-blue" />
                          <span className="hidden xs:inline">ATTACH</span>
                          <input type="file" multiple className="hidden" onChange={handleAttachmentUpload} />
                       </label>
                       {!imagePreview && (
                          <label className="group flex cursor-pointer items-center gap-1.5 rounded-xl border-2 border-border bg-white px-3 sm:px-4 py-2 text-[10px] sm:text-[11px] font-black uppercase text-gray-nav transition-all hover:bg-blue/5 hover:text-blue hover:border-blue/30 shadow-[0_2px_0_0_#E5E5E5] active:shadow-none active:translate-y-[2px]">
                             <ImageIcon size={16} className="text-gray-nav group-hover:text-blue" />
                             <span className="hidden xs:inline">COVER</span>
                             <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                          </label>
                       )}
                    </div>
                </div>

                <input
                    type="text"
                    placeholder="Title your entry..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="w-full border-none bg-transparent text-3xl sm:text-4xl font-display text-gray-text placeholder:text-border focus:outline-none focus:ring-0 p-0 mb-12 tracking-tight leading-tight lowercase"
                />
                
                <div 
                  className="relative min-h-[400px]"
                  onFocusCapture={() => setIsFocused(true)}
                  onBlurCapture={() => setIsFocused(false)}
                >
                    <div className="mx-auto max-w-[82ch] font-sans leading-[1.8] relative">
                      <Editor 
                          ref={editorInstanceRef}
                          value={content} 
                          onChange={setContent} 
                          placeholder={activePlaceholder || (id ? "Continue writing..." : "Start typing... or click ✨ below for a spark.")}
                          className="text-[17px] text-gray-text/90 min-h-[400px]"
                      />
                    </div>
                    {/* Persistent Spark Prompt FAB in Body */}
                    {(!content || content === '<p><br></p>') && (
                      <div className="absolute bottom-6 right-6 z-20">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={cycleSparkPrompt}
                            className={`flex h-14 w-14 items-center justify-center rounded-full border-2 border-border bg-white shadow-3d-gray backdrop-blur-xl transition-all text-blue hover:text-blue/80 hover:shadow-none hover:translate-y-[2px] ${isGeneratingPrompts ? 'animate-pulse' : ''}`}
                            title={sparkPrompt}
                          >
                              <Sparkles size={22} className="relative z-10" />
                          </motion.button>
                      </div>
                    )}

                </div>

                {/* Tasks Section */}
                <div className={`mt-12 border-t-2 border-border pt-8 transition-all duration-500 ${isDimmed ? 'opacity-30 hover:opacity-100' : 'opacity-100'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[12px] font-extrabold text-gray-text uppercase tracking-widest flex items-center gap-2">
                      <ListTodo size={16} className="text-blue" />
                      Actionable Tasks
                    </h3>
                    <button 
                      onClick={addTask}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-blue/20 bg-blue/5 text-blue text-[10px] font-black uppercase tracking-widest hover:bg-blue/10 transition-all shadow-[0_2px_0_0_#E5E5E5] active:shadow-none active:translate-y-[2px]"
                    >
                      <Plus size={14} />
                      Add Task
                    </button>
                  </div>

                  <div className="space-y-3">
                    {tasks.length === 0 ? (
                      <div className="p-8 rounded-3xl border-2 border-dashed border-border bg-gray-50/50 text-center">
                        <p className="text-[13px] font-bold text-gray-nav uppercase tracking-widest opacity-40">No tasks added yet</p>
                      </div>
                    ) : (
                      tasks.map((task) => (
                        <TaskRow
                          key={task.id} 
                          task={task}
                          updateTask={updateTask}
                          toggleTask={toggleTask}
                          removeTask={removeTask}
                        />
                      ))
                    )}
                  </div>
                </div>

                {aiReflection && (
                  <div className="mt-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div className="relative overflow-hidden rounded-[32px] border border-sky-100 bg-[linear-gradient(180deg,rgba(247,251,255,0.98),rgba(255,255,255,0.98))] p-6 shadow-[0_10px_30px_-22px_rgba(14,165,233,0.45)] sm:p-8">
                      <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.18),transparent_55%)] pointer-events-none" />
                      <div className="absolute bottom-0 left-0 h-20 w-20 rounded-full bg-emerald-100/40 blur-3xl pointer-events-none" />

                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-100 bg-white text-blue shadow-[0_2px_0_0_rgba(226,232,240,0.9)]">
                            <Brain size={20} />
                          </div>
                          <div className="flex-1 flex flex-col items-end">
                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue/55 leading-none mb-1 w-full text-left">Reflection</h4>
                            <p className="text-[13px] font-bold text-gray-text leading-none w-full text-right">A softer mirror for what you wrote</p>
                          </div>
                        </div>

                        <div className="rounded-[24px] border border-white/70 bg-white/80 px-4 py-5 sm:px-5">
                          <p className="text-[16px] leading-relaxed text-gray-text font-medium italic sm:text-[17px]">
                            "{aiReflection}"
                          </p>
                        </div>

                        <div className="mt-5 flex items-center gap-4">
                          <div className="h-[1px] flex-1 bg-gradient-to-r from-sky-100 to-transparent"></div>
                          <span className="text-[10px] font-extrabold text-gray-nav uppercase tracking-widest">For reflection, not medical advice</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(newAttachments.length > 0 || existingAttachments.length > 0) && (
                  <div className={`mt-12 border-t-2 border-border pt-8 transition-all duration-500 ${isFocused ? 'opacity-30 hover:opacity-100' : 'opacity-100'}`}>
                    <h3 className="text-[12px] font-extrabold text-gray-text uppercase tracking-wider mb-6 flex items-center gap-2">
                      <Paperclip size={16} className="text-gray-nav" />
                      Attachments ({newAttachments.length + existingAttachments.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {existingAttachments.map((att) => (
                        <div key={att.path} className="group relative flex items-center gap-4 p-5 rounded-[24px] border-2 border-border bg-white hover:bg-blue/5 hover:border-blue/30 transition-all duration-500 shadow-3d-gray hover:shadow-none hover:translate-y-[2px] liquid-glass">
                          <div className="h-16 w-16 shrink-0 rounded-2xl bg-white border-2 border-border flex items-center justify-center text-gray-nav shadow-inner overflow-hidden">
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
                            <p className="text-[14px] font-bold text-gray-text truncate mb-1">{att.name}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-nav font-black uppercase tracking-widest">{formatFileSize(att.size)}</span>
                              <span className="h-1 w-1 rounded-full bg-border"></span>
                              <div className="flex items-center gap-1">
                                <CheckCircle2 size={10} className="text-emerald-500" />
                                <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Cloud</span>
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeExistingAttachment(att)}
                            className="h-10 w-10 rounded-xl bg-white text-gray-nav border-2 border-border shadow-[0_2px_0_0_#E5E5E5] flex items-center justify-center hover:text-red hover:border-red/30 active:shadow-none active:translate-y-[2px] transition-all duration-200"
                            title="Remove attachment"
                          >
                            <X size={18} strokeWidth={2.5} />
                          </button>
                        </div>
                      ))}
                      {newAttachments.map((file, index) => {
                        const isImage = file.type?.startsWith('image/');
                        const previewUrl = isImage ? URL.createObjectURL(file) : null;
                        return (
                          <div key={`new-${index}`} className="group relative flex items-center gap-4 p-5 rounded-[24px] border-2 border-blue/20 bg-blue/5 hover:bg-white hover:border-blue/40 transition-all duration-500 shadow-3d-blue hover:shadow-none hover:translate-y-[2px] liquid-glass animate-in zoom-in-95 duration-300">
                            <div className="h-16 w-16 shrink-0 rounded-2xl bg-white border-2 border-blue/20 flex items-center justify-center text-blue shadow-inner overflow-hidden">
                              {isImage && previewUrl ? (
                                <img 
                                  src={previewUrl} 
                                  alt="preview" 
                                  className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                  onLoad={() => {
                                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                                  }}
                                />
                              ) : (
                                <div className="text-blue/60 group-hover:text-blue transition-colors">
                                  {getFileIcon(file.type)}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[14px] font-bold text-gray-text truncate mb-1">{file.name}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-nav font-black uppercase tracking-widest">{formatFileSize(file.size)}</span>
                                <span className="h-1 w-1 rounded-full bg-blue/20"></span>
                                <div className="flex items-center gap-1">
                                  <Loader2 size={10} className="text-blue animate-spin" />
                                  <span className="text-[10px] text-blue font-black uppercase tracking-tighter">Pending</span>
                                </div>
                              </div>
                            </div>
                            <button 
                              onClick={() => removeNewAttachment(index)}
                              className="h-10 w-10 rounded-xl bg-white text-gray-nav border-2 border-border shadow-[0_2px_0_0_#E5E5E5] flex items-center justify-center hover:text-red hover:border-red/30 active:shadow-none active:translate-y-[2px] transition-all duration-200"
                              title="Remove attachment"
                            >
                              <X size={18} strokeWidth={2.5} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>

            <div className={`border-t-2 border-border bg-white/50 px-8 py-4 text-center transition-all duration-500 ${isFocused ? 'opacity-20' : 'opacity-100'}`}>
                <p className="text-[11px] font-extrabold text-gray-nav uppercase tracking-widest">
                   Your journal is a safe space for your thoughts.
                </p>
            </div>
          </div>
        </motion.div>
        )}
      </AnimatePresence>
      <audio ref={audioRef} loop className="hidden" />
      </div>
    </>
  );
};
