import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, ArrowUpRight, Calendar, Search, Smile, Meh, Frown, Sun, Cloud, Moon, Zap, Trash2, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Note, RoutePath } from '../../types';
import { noteService } from '../../services/noteService';
import { StorageImage } from '../../components/ui/StorageImage';
import { useAuth } from '../../context/AuthContext';

export const MyNotes: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchNotes = async () => {
    try {
      const data = await noteService.getAll();
      setNotes(data);
    } catch (error) {
      console.error("Failed to fetch notes", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    
    setDeletingId(id);
    try {
      await noteService.delete(id);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error("Failed to delete note", error);
      alert("Failed to delete note");
    } finally {
      setDeletingId(null);
    }
  };

  const getPreviewText = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const getMoodIcon = (mood?: string) => {
    switch (mood) {
      case 'happy': return <Smile size={14} className="text-yellow-500" />;
      case 'calm': return <Sun size={14} className="text-emerald-500" />;
      case 'anxious': return <Cloud size={14} className="text-blue-500" />;
      case 'sad': return <Frown size={14} className="text-indigo-500" />;
      case 'angry': return <Zap size={14} className="text-rose-500" />;
      case 'tired': return <Moon size={14} className="text-slate-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-12 px-4 md:px-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-border pb-8 gap-4">
        <div>
          <h1 className="font-display text-[40px] text-gray-text lowercase">my notes</h1>
          <p className="text-gray-light mt-2 text-[17px] font-medium">
            Manage your personal knowledge base.
          </p>
        </div>
        <Button 
          onClick={() => navigate(RoutePath.CREATE_NOTE)} 
          variant="primary"
          className="h-[48px] px-8 text-[15px] font-bold uppercase rounded-xl shadow-3d-green active:shadow-none active:translate-y-[4px] transition-all"
        >
          <Plus className="mr-2 h-5 w-5" />
          CREATE NOTE
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
             <div key={n} className="h-72 animate-pulse rounded-2xl bg-white border-2 border-border"></div>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
          {notes.map((note) => (
            <div 
              key={note.id} 
              onClick={() => navigate(RoutePath.NOTE_DETAIL.replace(':id', note.id))}
              className="group cursor-pointer flex flex-col overflow-hidden rounded-2xl bg-white border-2 border-border shadow-[0_4px_0_0_#E5E5E5] transition-all duration-200 hover:shadow-none hover:translate-y-[2px] liquid-glass"
            >
              {/* Image / Header */}
              <div className="relative h-44 w-full overflow-hidden bg-white border-b-2 border-border">
                {note.thumbnailUrl ? (
                   <>
                    <div className="absolute inset-0 bg-blue/0 transition-colors duration-500 group-hover:bg-blue/5 z-10" />
                    <StorageImage 
                        path={note.thumbnailUrl} 
                        alt={note.title} 
                        className="h-full w-full object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-110" 
                    />
                   </>
                ) : (
                   <div className="h-full w-full bg-white flex items-center justify-center">
                      <FileText className="text-border transition-colors group-hover:text-blue/30" size={48} strokeWidth={1} />
                   </div>
                )}
                
                {/* Delete Button */}
                <button 
                  onClick={(e) => handleDelete(e, note.id)}
                  disabled={deletingId === note.id}
                  className="absolute top-4 left-4 z-20 h-9 w-9 flex items-center justify-center rounded-xl bg-white border-2 border-border text-gray-nav hover:text-red hover:border-red/30 shadow-[0_2px_0_0_#E5E5E5] active:shadow-none active:translate-y-[2px] transition-all"
                >
                  {deletingId === note.id ? (
                    <Loader2 size={16} className="animate-spin text-red" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
                
                {/* Date & Mood Badge */}
                <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
                     <div className="flex items-center gap-2 rounded-xl bg-white border-2 border-border px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-gray-nav shadow-[0_2px_0_0_#E5E5E5]">
                        <div className="flex items-center gap-1.5 border-r-2 border-border pr-2 mr-0.5">
                          <Calendar size={12} className="text-gray-nav" />
                          <span>{new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </div>
                        {note.mood ? (
                          <div className="flex items-center gap-1">
                            {getMoodIcon(note.mood)}
                            <span className="capitalize text-gray-text">{note.mood}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] opacity-40 italic">No Mood</span>
                        )}
                     </div>
                </div>
              </div>
              
              <div className="flex flex-1 flex-col p-6">
                <h3 className="mb-2 text-[18px] font-bold tracking-tight text-gray-text leading-snug group-hover:text-blue transition-colors">
                  {note.title}
                </h3>
                
                <p className="text-gray-light line-clamp-3 leading-relaxed text-[14px] mb-5 font-medium">
                  {getPreviewText(note.content) || <span className="italic opacity-50">Empty note</span>}
                </p>

                <div className="mt-auto flex items-center justify-between border-t-2 border-border pt-4">
                   <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-blue flex items-center justify-center text-[10px] font-extrabold text-white shadow-3d-blue">
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                      <span className="text-[12px] font-bold text-gray-nav">Edited just now</span>
                   </div>
                   <div className="flex items-center text-[12px] font-extrabold uppercase tracking-wider text-blue group-hover:opacity-70 transition-all">
                      <span>OPEN</span>
                      <ArrowUpRight size={14} className="ml-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && notes.length === 0 && (
          <div className="flex h-80 flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-border bg-white text-center px-4">
             <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-3d-gray border-2 border-border mb-6">
                 <FileText size={28} className="text-gray-nav" />
             </div>
             <h3 className="font-display text-[24px] text-gray-text lowercase">no notes yet</h3>
             <p className="text-gray-light mb-8 max-w-sm font-medium">Create your first note to get started on your mental health journey.</p>
             <Button 
                onClick={() => navigate(RoutePath.CREATE_NOTE)} 
                variant="primary" 
                className="h-[48px] px-8 text-[15px] font-bold uppercase rounded-xl shadow-3d-green active:shadow-none active:translate-y-[4px] transition-all"
              >
                CREATE YOUR FIRST NOTE
              </Button>
          </div>
      )}
    </div>
  );
};