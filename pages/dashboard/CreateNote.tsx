import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Image as ImageIcon, Wand2, X, Calendar, Loader2, Paperclip, File as FileIcon, FileText, Zap, Sparkles, ChevronRight, Smile, Meh, Frown, Sun, Cloud, Moon, Heart, Brain, Coffee, MessageSquare } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Editor } from '../../components/ui/Editor';
import { noteService } from '../../services/noteService';
import { storageService } from '../../services/storageService';
import { RoutePath, NoteAttachment } from '../../types';
import { supabase } from '../../src/supabaseClient';
import { StorageImage } from '../../components/ui/StorageImage';
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const CreateNote: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); 
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [isReflecting, setIsReflecting] = useState(false);
  const [aiReflection, setAiReflection] = useState<string | null>(null);
  const [dynamicPrompts, setDynamicPrompts] = useState<string[]>([]);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  
  // Image preview can be a Blob URL (new) or Storage Path (existing)
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Attachments: Mixed list of new Files and existing NoteAttachments
  const [newAttachments, setNewAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<NoteAttachment[]>([]);

  useEffect(() => {
    const checkLimitAndFetch = async () => {
      setLoading(true);
      try {
        if (!id) {
          // If creating a NEW note, check count
          const count = await noteService.getCount();
          if (count >= 3) {
            setIsLimitReached(true);
            setLoading(false);
            return;
          }
          // Generate initial prompts for new note
          generateDynamicPrompts();
        } else {
          // If editing an EXISTING note
          const note = await noteService.getById(id);
          if (note) {
            setTitle(note.title);
            setContent(note.content);
            setMood(note.mood);
            setImagePreview(note.thumbnailUrl || null);
            setExistingAttachments(note.attachments || []);
            // Generate prompts based on existing mood
            generateDynamicPrompts(note.mood);
          } else {
             navigate(RoutePath.NOTES);
          }
        }
      } catch (error) {
        console.error("Failed to initialize note view", error);
      } finally {
        setLoading(false);
      }
    };

    checkLimitAndFetch();
  }, [id, navigate]);

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

      const result = JSON.parse(response.text || "[]");
      if (Array.isArray(result) && result.length > 0) {
        setDynamicPrompts(result);
      }
    } catch (error) {
      console.error("Failed to generate prompts:", error);
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

  const getFileIcon = (type: string) => {
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
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a compassionate mental health journaling assistant. 
        Based on the following journal entry, provide a brief (2-3 sentences), empathetic reflection or a thoughtful follow-up question to help the user process their thoughts. 
        Be supportive, non-judgmental, and deeply contextual.
        
        Context:
        - ${titleText}
        - ${moodText}
        
        Entry Content:
        ${plainText}
        
        Your response should be warm, insightful, and encourage further self-reflection.`,
      });
      
      setAiReflection(response.text || "I'm here to listen. Your thoughts are valid.");
    } catch (error) {
      console.error("AI Reflection failed:", error);
      setAiReflection("I'm having trouble reflecting right now, but I'm still here for you.");
    } finally {
      setIsReflecting(false);
    }
  };

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
      let noteData: any = { title, content, tags: [], mood };
      
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
        thumbnailUrl: finalThumbnailUrl || undefined,
        attachments: finalAttachments
      });

      navigate(RoutePath.NOTE_DETAIL.replace(':id', noteId));
      
    } catch (error: any) {
      if (error.message === 'FREE_LIMIT_REACHED') {
        setIsLimitReached(true);
      } else {
        console.error("Error saving note:", error);
        alert("Failed to save note.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
     return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>;
  }

  // LIMIT REACHED UI
  if (isLimitReached) {
    return (
      <div className="mx-auto max-w-2xl animate-in fade-in zoom-in-95 duration-500 py-12 md:py-20">
        <div className="relative overflow-hidden rounded-[40px] border border-white/80 bg-white/40 backdrop-blur-3xl shadow-[0_40px_100px_-15px_rgba(0,0,0,0.05)] p-10 md:p-14 text-center ring-1 ring-white/50">
          
          {/* Ambient Glows */}
          <div className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center gap-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 shadow-inner ring-1 ring-indigo-100/50">
              <Zap size={36} fill="currentColor" className="opacity-80" />
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Plan Limit Reached
              </h2>
              <p className="text-slate-600 text-lg font-medium leading-relaxed max-w-sm mx-auto">
                Free users can create a maximum of <span className="text-indigo-600 font-bold">3 notes</span>. Upgrade to Pro for unlimited creative space.
              </p>
            </div>

            <div className="flex flex-col gap-4 w-full sm:flex-row sm:justify-center pt-4">
              <Button 
                variant="primary" 
                size="lg" 
                className="rounded-full shadow-lg shadow-indigo-500/20 group h-14"
                onClick={() => {}} // Placeholder for upgrade
              >
                <Sparkles size={18} className="mr-2 group-hover:rotate-12 transition-transform" />
                <span>Upgrade to Pro</span>
                <ChevronRight size={16} className="ml-1 opacity-60" />
              </Button>
              <Button 
                variant="secondary" 
                size="lg" 
                className="rounded-full h-14"
                onClick={() => navigate(RoutePath.NOTES)}
              >
                Back to My Notes
              </Button>
            </div>
            
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Join 2,000+ users on Pro
            </p>
          </div>
        </div>
      </div>
    );
  }

  const hasContent = content && content !== '<p><br></p>';
  const canSave = title.trim().length > 0 || hasContent;
  const canEnhance = hasContent;

  const moods = [
    { id: 'happy', icon: Smile, label: 'Happy', color: 'text-yellow-500 bg-yellow-50 border-yellow-100' },
    { id: 'calm', icon: Sun, label: 'Calm', color: 'text-emerald-500 bg-emerald-50 border-emerald-100' },
    { id: 'anxious', icon: Cloud, label: 'Anxious', color: 'text-blue-500 bg-blue-50 border-blue-100' },
    { id: 'sad', icon: Frown, label: 'Sad', color: 'text-indigo-500 bg-indigo-50 border-indigo-100' },
    { id: 'angry', icon: Zap, label: 'Angry', color: 'text-rose-500 bg-rose-50 border-rose-100' },
    { id: 'tired', icon: Moon, label: 'Tired', color: 'text-slate-500 bg-slate-50 border-slate-100' },
  ];

  const prompts = [
    "What are three things you're grateful for today?",
    "How did you feel when you woke up this morning?",
    "What's one small win you had today?",
    "What's something you're looking forward to?",
    "Describe a moment today that made you smile.",
    "What's one thing you want to let go of today?",
  ];

  return (
    <div className="mx-auto max-w-5xl animate-in fade-in duration-500 pb-20 px-4 md:px-10">
      <nav className="sticky top-4 z-50 mb-8 flex items-center justify-between rounded-2xl border-2 border-border bg-white/90 px-4 py-3 shadow-[0_4px_0_0_#E5E5E5] backdrop-blur-2xl transition-all">
        <div className="flex items-center gap-3">
           <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-gray-nav hover:text-gray-text font-bold uppercase text-[12px]">
             <ArrowLeft className="mr-2 h-4 w-4" />
             BACK
           </Button>
           <div className="h-4 w-[2px] bg-border"></div>
           <span className="text-[12px] font-extrabold text-gray-nav uppercase tracking-wider">
              {id ? 'edit note' : 'new journal entry'}
           </span>
        </div>
        
        <div className="flex items-center gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              className="hidden sm:flex border-2 border-border text-blue shadow-3d-gray active:shadow-none active:translate-y-[2px] transition-all" 
              disabled={!canEnhance || isReflecting}
              onClick={handleAiReflect}
              isLoading={isReflecting}
            >
                <Wand2 className="mr-2 h-3.5 w-3.5" />
                <span>AI REFLECT</span>
            </Button>
            <Button 
              onClick={handleSave} 
              size="sm" 
              variant="primary"
              className="shadow-3d-green active:shadow-none active:translate-y-[2px] transition-all"
              isLoading={saving} 
              disabled={!canSave}
            >
              <Save className="mr-2 h-3.5 w-3.5" />
              SAVE ENTRY
            </Button>
        </div>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <div className="relative min-h-[70vh] rounded-[32px] border-2 border-border bg-white shadow-[0_8px_0_0_#E5E5E5] overflow-hidden flex flex-col liquid-glass">
            {imagePreview && (
              <div className="relative aspect-[21/9] w-full group bg-white border-b-2 border-border">
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

            <div className="flex-1 px-8 py-10 md:px-12 md:py-10">
                <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-[11px] font-extrabold text-gray-nav uppercase tracking-wider">
                        <Calendar size={13} />
                        <span>{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>

                    <div className="flex items-center gap-3">
                       <label className="group flex cursor-pointer items-center gap-1.5 rounded-xl border-2 border-border bg-white px-3 py-1.5 text-[11px] font-extrabold text-gray-nav uppercase transition-all hover:bg-blue/5 hover:text-blue hover:border-blue/30 shadow-[0_2px_0_0_#E5E5E5] active:shadow-none active:translate-y-[2px]">
                          <Paperclip size={14} className="text-gray-nav group-hover:text-blue" />
                          <span>ATTACH</span>
                          <input type="file" multiple className="hidden" onChange={handleAttachmentUpload} />
                       </label>
                       {!imagePreview && (
                          <label className="group flex cursor-pointer items-center gap-1.5 rounded-xl border-2 border-border bg-white px-3 py-1.5 text-[11px] font-extrabold text-gray-nav uppercase transition-all hover:bg-blue/5 hover:text-blue hover:border-blue/30 shadow-[0_2px_0_0_#E5E5E5] active:shadow-none active:translate-y-[2px]">
                             <ImageIcon size={14} className="text-gray-nav group-hover:text-blue" />
                             <span>COVER</span>
                             <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                          </label>
                       )}
                    </div>
                </div>

                <div className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[11px] font-extrabold text-gray-nav uppercase tracking-widest">How are you feeling?</p>
                    {mood && (
                      <button 
                        onClick={() => handleMoodSelect(mood)}
                        className="text-[10px] font-extrabold text-gray-nav hover:text-red transition-colors uppercase tracking-tight"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {moods.map((m) => {
                      const Icon = m.icon;
                      const isSelected = mood === m.id;
                      return (
                        <button
                          key={m.id}
                          onClick={() => handleMoodSelect(m.id)}
                          className={`group relative flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 transition-all duration-300 ${
                            isSelected 
                              ? `${m.color} border-current shadow-[0_4px_0_0_currentColor] -translate-y-1` 
                              : 'border-border bg-white text-gray-nav hover:border-blue/30 hover:bg-blue/5 hover:text-blue hover:-translate-y-0.5'
                          }`}
                        >
                          <Icon size={24} className={`transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`} />
                          <span className="mt-2 text-[10px] font-black uppercase tracking-tighter">{m.label}</span>
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 h-4 w-4 bg-current rounded-full flex items-center justify-center text-white ring-2 ring-white">
                              <Sparkles size={8} fill="currentColor" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <input
                    type="text"
                    placeholder="Title your entry..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border-none bg-transparent text-3xl sm:text-4xl font-display text-gray-text placeholder:text-border focus:outline-none focus:ring-0 p-0 mb-6 tracking-tight leading-tight lowercase"
                    autoFocus
                />
                
                <div className="relative min-h-[400px]">
                    <Editor 
                        value={content} 
                        onChange={setContent} 
                        placeholder="Start writing your thoughts..."
                        className="text-[17px] text-gray-text leading-relaxed min-h-[400px] font-medium"
                    />
                </div>

                {aiReflection && (
                  <div className="mt-12 relative group animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue/20 via-indigo-500/10 to-purple-500/20 rounded-[32px] blur-xl opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative p-8 rounded-[30px] bg-white border-2 border-blue/10 shadow-[0_10px_40px_-15px_rgba(59,130,246,0.1)] overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Sparkles size={80} className="text-blue" />
                      </div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue/10 text-blue shadow-inner">
                            <Brain size={20} />
                          </div>
                          <div>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue/40 leading-none mb-1">AI Insights</h4>
                            <p className="text-[13px] font-bold text-gray-text leading-none">A moment of reflection</p>
                          </div>
                        </div>
                        
                        <div className="pl-4 border-l-4 border-blue/20">
                          <p className="text-[17px] leading-relaxed text-gray-text font-medium italic">
                            "{aiReflection}"
                          </p>
                        </div>
                        
                        <div className="mt-6 flex items-center gap-4">
                          <div className="h-[1px] flex-1 bg-gradient-to-r from-blue/20 to-transparent"></div>
                          <span className="text-[10px] font-extrabold text-gray-nav uppercase tracking-widest">Thoughtfully generated for you</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {(newAttachments.length > 0 || existingAttachments.length > 0) && (
                  <div className="mt-12 border-t-2 border-border pt-8 animate-in fade-in duration-300">
                    <h3 className="text-[12px] font-extrabold text-gray-text uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Paperclip size={16} className="text-gray-nav" />
                      Attachments ({newAttachments.length + existingAttachments.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {existingAttachments.map((att) => (
                        <div key={att.path} className="group relative flex items-center gap-3 p-4 rounded-2xl border-2 border-border bg-white hover:bg-blue/5 hover:border-blue/30 transition-all duration-300 shadow-sm">
                          <div className="h-12 w-12 shrink-0 rounded-xl bg-white border-2 border-border flex items-center justify-center text-gray-nav shadow-inner overflow-hidden">
                             {att.type.startsWith('image/') ? (
                               <StorageImage 
                                 path={att.path} 
                                 alt={att.name} 
                                 className="h-full w-full object-cover" 
                               />
                             ) : (
                               getFileIcon(att.type)
                             )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-bold text-gray-text truncate">{att.name}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-nav font-bold uppercase">{formatFileSize(att.size)}</span>
                              <span className="h-1 w-1 rounded-full bg-border"></span>
                              <span className="text-[10px] text-emerald-500 font-black uppercase">Saved</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => removeExistingAttachment(att)}
                            className="h-9 w-9 rounded-xl bg-white text-gray-nav border-2 border-border shadow-[0_2px_0_0_#E5E5E5] flex items-center justify-center hover:text-red hover:border-red/30 active:shadow-none active:translate-y-[2px] transition-all duration-200"
                            title="Remove attachment"
                          >
                            <X size={16} strokeWidth={2.5} />
                          </button>
                        </div>
                      ))}
                      {newAttachments.map((file, index) => {
                        const isImage = file.type.startsWith('image/');
                        const previewUrl = isImage ? URL.createObjectURL(file) : null;
                        return (
                          <div key={`new-${index}`} className="group relative flex items-center gap-3 p-4 rounded-2xl border-2 border-blue/20 bg-blue/5 hover:bg-white hover:border-blue/40 transition-all duration-300 shadow-sm animate-in zoom-in-95 duration-200">
                            <div className="h-12 w-12 shrink-0 rounded-xl bg-white border-2 border-blue/20 flex items-center justify-center text-blue shadow-inner overflow-hidden">
                              {isImage && previewUrl ? (
                                <img 
                                  src={previewUrl} 
                                  alt="preview" 
                                  className="h-full w-full object-cover"
                                  onLoad={() => {
                                    if (previewUrl) URL.revokeObjectURL(previewUrl);
                                  }}
                                />
                              ) : (
                                getFileIcon(file.type)
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-bold text-gray-text truncate">{file.name}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-nav font-bold uppercase">{formatFileSize(file.size)}</span>
                                <span className="h-1 w-1 rounded-full bg-blue/20"></span>
                                <span className="text-[10px] text-blue font-black uppercase tracking-tight">Ready to Upload</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => removeNewAttachment(index)}
                              className="h-9 w-9 rounded-xl bg-white text-gray-nav border-2 border-border shadow-[0_2px_0_0_#E5E5E5] flex items-center justify-center hover:text-red hover:border-red/30 active:shadow-none active:translate-y-[2px] transition-all duration-200"
                              title="Remove attachment"
                            >
                              <X size={16} strokeWidth={2.5} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>

            <div className="border-t-2 border-border bg-white/50 px-8 py-4 text-center">
                <p className="text-[11px] font-extrabold text-gray-nav uppercase tracking-widest">
                   Your journal is a safe space for your thoughts.
                </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-[32px] border-2 border-border bg-white p-6 shadow-[0_4px_0_0_#E5E5E5]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[12px] font-extrabold text-gray-text uppercase tracking-widest flex items-center gap-2">
                <Brain size={16} className="text-blue" />
                Journaling Prompts
              </h3>
              {isGeneratingPrompts && <Loader2 size={14} className="animate-spin text-blue" />}
            </div>
            <div className="space-y-3">
              {(dynamicPrompts.length > 0 ? dynamicPrompts : prompts).map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setContent(prev => prev + `<p><i>${prompt}</i></p><p><br></p>`)}
                  className="w-full text-left p-4 rounded-2xl border-2 border-border bg-white text-[13px] text-gray-light font-bold hover:border-blue/30 hover:bg-blue/5 hover:text-blue transition-all duration-200 leading-relaxed shadow-[0_2px_0_0_#E5E5E5] active:shadow-none active:translate-y-[2px] animate-in fade-in slide-in-from-right-2 duration-300"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {prompt}
                </button>
              ))}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-4 text-[10px] font-extrabold text-blue hover:bg-blue/5"
              onClick={() => generateDynamicPrompts(mood)}
              disabled={isGeneratingPrompts}
            >
              REFRESH PROMPTS
            </Button>
          </div>

          <div className="rounded-[32px] border-2 border-blue/20 bg-gradient-to-br from-blue to-blue/80 p-8 text-white shadow-3d-blue">
            <Heart size={24} className="mb-4 opacity-80" />
            <h3 className="font-display text-[20px] mb-2 lowercase">self-care tip</h3>
            <p className="text-[15px] text-white/90 leading-relaxed font-medium">
              Take 5 deep breaths before you start writing. It helps clear your mind and focus on your feelings.
            </p>
            <div className="mt-6 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest opacity-60">
              <Coffee size={14} />
              <span>Mindfulness</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};