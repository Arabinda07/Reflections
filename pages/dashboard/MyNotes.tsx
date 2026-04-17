import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, FileText, ArrowUpRight, Calendar as CalendarIcon, Search, Smile, Meh, Frown, Sun, Cloud, Moon, Zap, Trash2, Loader2, LayoutGrid, Calendar, Tag, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Note, RoutePath } from '../../types';
import { noteService } from '../../services/noteService';
import { StorageImage } from '../../components/ui/StorageImage';
import { useAuth } from '../../context/AuthContext';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Calendar.css';
import { format, isSameDay } from 'date-fns';
import { LoadingState } from '../../components/ui/LoadingState';

export const MyNotes: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const queryParams = new URLSearchParams(location.search);
  const tagFilter = queryParams.get('tag');

  const fetchNotes = async () => {
    // Minimum cinematic display time for the sanctuary loader
    const minTimePromise = new Promise(resolve => setTimeout(resolve, 2500));
    try {
      const [data] = await Promise.all([
        noteService.getAll(),
        minTimePromise
      ]);
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

  const filteredNotes = tagFilter 
    ? notes.filter(note => note.tags?.includes(tagFilter))
    : notes;

  const allTags = Array.from(new Set(notes.flatMap(n => n.tags || [])));

  const notesOnSelectedDate = filteredNotes.filter(note => 
    isSameDay(new Date(note.updatedAt), selectedDate)
  );

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
    if (!html || html === '<p><br></p>') return "No content available";
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    const text = tmp.textContent || tmp.innerText || "";
    if (text.length > 100) {
      return text.substring(0, 100) + "...";
    }
    return text || "No content available";
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

  const tileContent = ({ date, view }: { date: Date, view: string }) => {
    if (view === 'month') {
      const dayNotes = filteredNotes.filter(note => isSameDay(new Date(note.updatedAt), date));
      if (dayNotes.length > 0) {
        return (
          <div className="flex justify-center mt-1">
            <div className="flex -space-x-1">
              {dayNotes.slice(0, 3).map((note, idx) => (
                <div key={note.id} className="flex items-center justify-center">
                  {note.mood ? (
                    <div className="scale-75 origin-center">{getMoodIcon(note.mood)}</div>
                  ) : (
                    <div className={`h-1.5 w-1.5 rounded-full ${idx === 0 ? 'bg-blue' : idx === 1 ? 'bg-green' : 'bg-purple-500'}`} />
                  )}
                </div>
              ))}
              {dayNotes.length > 3 && <div className="h-1.5 w-1.5 rounded-full bg-gray-300 ml-1" />}
            </div>
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-12 px-4 md:px-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-border pb-8 gap-4">
        <div>
          <h1 className="font-display text-[40px] text-gray-text lowercase">my notes</h1>
          <p className="text-gray-light mt-2 text-[17px] font-medium">
            Manage your personal knowledge base.
          </p>
          {tagFilter && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[13px] font-bold text-gray-nav">Filtering by tag:</span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue/5 border-2 border-blue/10 text-blue text-[12px] font-bold">
                <Tag size={12} />
                {tagFilter}
                <button 
                  onClick={() => navigate(RoutePath.NOTES)}
                  className="ml-1 hover:text-red transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            </div>
          )}
          {!tagFilter && allTags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button 
                  key={tag}
                  onClick={() => navigate(`${RoutePath.NOTES}?tag=${encodeURIComponent(tag as string)}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-border text-[12px] font-bold text-gray-nav hover:text-blue hover:border-blue/30 transition-all duration-300 ease-out-quart shadow-sm active:scale-[0.98]"
                >
                  <Tag size={12} /> {tag}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border-2 border-border rounded-xl p-1 shadow-sm">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all duration-300 ease-out-quart ${viewMode === 'grid' ? 'bg-blue/10 text-blue' : 'text-gray-nav hover:bg-gray-50'}`}
              title="Grid View"
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-lg transition-all duration-300 ease-out-quart ${viewMode === 'calendar' ? 'bg-blue/10 text-blue' : 'text-gray-nav hover:bg-gray-50'}`}
              title="Calendar View"
            >
              <CalendarIcon size={20} />
            </button>
          </div>
          <Button 
            onClick={() => navigate(RoutePath.CREATE_NOTE)} 
            variant="primary"
            className="h-[48px] px-8 text-[15px] font-bold uppercase rounded-xl shadow-sm active:scale-[0.98] transition-all duration-300 ease-out-quart"
          >
            <Plus className="mr-2 h-5 w-5" />
            CREATE NOTE
          </Button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="bg-white border-2 border-border rounded-[32px] p-6 sm:p-8 shadow-sm liquid-glass">
              <ReactCalendar 
                onChange={(val) => setSelectedDate(val as Date)} 
                value={selectedDate}
                tileContent={tileContent}
                className="w-full border-none font-sans"
              />
            </div>
          </div>
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-black uppercase tracking-widest text-gray-text flex items-center gap-2">
                <CalendarIcon size={18} className="text-blue" />
                {format(selectedDate, 'MMMM do, yyyy')}
              </h3>
              <span className="text-[11px] font-bold text-gray-nav bg-gray-100 px-2 py-1 rounded-lg">
                {notesOnSelectedDate.length} {notesOnSelectedDate.length === 1 ? 'Note' : 'Notes'}
              </span>
            </div>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {notesOnSelectedDate.length > 0 ? (
                notesOnSelectedDate.map(note => (
                  <div 
                    key={note.id}
                    onClick={() => navigate(RoutePath.NOTE_DETAIL.replace(':id', note.id))}
                    className="group cursor-pointer p-5 rounded-2xl bg-white border-2 border-border shadow-sm hover:shadow-none hover:translate-y-[2px] transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-gray-text group-hover:text-blue transition-colors truncate pr-4">{note.title}</h4>
                      {getMoodIcon(note.mood)}
                    </div>
                    <p className="text-[13px] text-gray-light line-clamp-2 font-medium mb-3">
                      {getPreviewText(note.content)}
                    </p>
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {note.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-[10px] font-bold text-blue bg-blue/5 px-2 py-0.5 rounded-lg border border-blue/10 liquid-glass">#{tag}</span>
                        ))}
                        {note.tags.length > 2 && <span className="text-[10px] font-bold text-gray-nav liquid-glass px-2 py-0.5 rounded-lg border border-border">+{note.tags.length - 2}</span>}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50/50 rounded-[32px] border-2 border-dashed border-border">
                  <div className="h-12 w-12 rounded-xl bg-white border-2 border-border flex items-center justify-center text-gray-nav/30 mb-4">
                    <FileText size={24} />
                  </div>
                  <p className="text-[14px] font-bold text-gray-nav">No entries for this day</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2 text-blue text-[11px]"
                    onClick={() => navigate(RoutePath.CREATE_NOTE)}
                  >
                    Create one now
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
          {filteredNotes.map((note, index) => (
            <div 
              key={note.id} 
              onClick={() => navigate(RoutePath.NOTE_DETAIL.replace(':id', note.id))}
              className="group cursor-pointer flex flex-col overflow-hidden rounded-2xl bg-white border-2 border-border shadow-sm transition-all duration-300 hover:shadow-xl hover:translate-y-[-4px] hover:scale-[1.01] liquid-glass animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
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
                  className="absolute top-4 left-4 z-20 h-9 w-9 flex items-center justify-center rounded-xl bg-white border-2 border-border text-gray-nav hover:text-red hover:border-red/30 shadow-sm active:scale-[0.98] transition-all duration-300 ease-out-quart"
                >
                  {deletingId === note.id ? (
                    <Loader2 size={16} className="animate-spin text-red" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
                
                {/* Date & Mood Badge */}
                <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
                     <div className="flex items-center gap-2 rounded-xl bg-white border-2 border-border px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-gray-nav shadow-sm">
                        <div className="flex items-center gap-1.5 border-r-2 border-border pr-2 mr-0.5">
                          <CalendarIcon size={12} className="text-gray-nav" />
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
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {note.tags?.map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue/5 border border-blue/10 text-blue text-[10px] font-black uppercase tracking-tight">
                      <Tag size={8} />
                      {tag}
                    </span>
                  ))}
                </div>

                <h3 className="mb-2 text-[18px] font-bold tracking-tight text-gray-text leading-snug group-hover:text-blue transition-colors">
                  {note.title}
                </h3>
                
                <p className="text-gray-light line-clamp-3 leading-relaxed text-[14px] mb-5 font-medium">
                  {getPreviewText(note.content) || <span className="italic opacity-50">Empty note</span>}
                </p>

                <div className="mt-auto flex items-center justify-between border-t-2 border-border pt-4">
                   <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-blue flex items-center justify-center text-[10px] font-extrabold text-white shadow-sm">
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                      <span className="text-[12px] font-bold text-gray-nav">Edited {format(new Date(note.updatedAt), 'MMM d')}</span>
                   </div>
                   <div className="flex items-center text-[12px] font-extrabold uppercase tracking-wider text-blue group-hover:opacity-70 transition-all duration-300 ease-out-quart">
                      <span>OPEN</span>
                      <ArrowUpRight size={14} className="ml-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && filteredNotes.length === 0 && (
          <div className="flex h-80 flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-border bg-white text-center px-4">
             <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border-2 border-border mb-6">
                 <FileText size={28} className="text-gray-nav" />
             </div>
             <h3 className="font-display text-[24px] text-gray-text lowercase">The space is quiet</h3>
             <p className="text-gray-light mb-8 max-w-sm font-medium">
               {tagFilter ? `No notes found with the tag "${tagFilter}".` : "Take a breath, and when you are ready, leave a thought here."}
             </p>
             {tagFilter ? (
               <Button 
                  onClick={() => navigate(RoutePath.NOTES)} 
                  variant="secondary" 
                  className="h-[48px] px-8 text-[15px] font-bold uppercase rounded-xl border-2 border-border text-gray-text shadow-sm active:scale-[0.98] transition-all duration-300 ease-out-quart"
                >
                  CLEAR FILTER
                </Button>
             ) : (
               <Button 
                  onClick={() => navigate(RoutePath.CREATE_NOTE)} 
                  variant="primary" 
                  className="h-[48px] px-8 text-[15px] font-bold uppercase rounded-xl shadow-sm active:scale-[0.98] transition-all duration-300 ease-out-quart"
                >
                  CREATE YOUR FIRST NOTE
                </Button>
             )}
          </div>
      )}
      <LoadingState isVisible={loading} message="gathering your thoughts..." />
    </div>
  );
};
