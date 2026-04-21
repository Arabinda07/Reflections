import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, FileText, ArrowUpRight, Calendar as CalendarIcon, MagnifyingGlass, Smiley, SmileyMeh, SmileySad, Sun, Cloud, Moon, Lightning, Trash, CircleNotch, SquaresFour, Tag, X } from '@phosphor-icons/react';
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
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';


export const MyNotes: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [noteIdToDelete, setNoteIdToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  

  const queryParams = new URLSearchParams(location.search);
  const tagFilter = queryParams.get('tag');

  const fetchNotes = async () => {
    try {
      const data = await noteService.getAll();
      setNotes(data);
    } catch (error) {
      console.error("Failed to fetch notes", error);
    } finally {
      setLoading(false);
      // Let animation play, or just set it to true immediately
      setIsContentVisible(true);
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

  const initiateDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNoteIdToDelete(id);
    setIsConfirmOpen(true);
  };

  const performDelete = async () => {
    if (!noteIdToDelete) return;

    setIsDeleting(true);
    try {
      await noteService.delete(noteIdToDelete);
      setNotes(prev => prev.filter(n => n.id !== noteIdToDelete));
      setIsConfirmOpen(false);
    } catch (error) {
      console.error("Failed to delete note:", error);
    } finally {
      setIsDeleting(false);
      setNoteIdToDelete(null);
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
      case 'happy': return <Smiley size={14} weight="fill" className="text-yellow-500" />;
      case 'calm': return <Sun size={14} weight="fill" className="text-emerald-500" />;
      case 'anxious': return <Cloud size={14} weight="fill" className="text-blue-500" />;
      case 'sad': return <SmileySad size={14} weight="fill" className="text-indigo-500" />;
      case 'angry': return <Lightning size={14} weight="fill" className="text-rose-500" />;
      case 'tired': return <Moon size={14} weight="fill" className="text-slate-500" />;
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
    <>
      <LoadingState isVisible={loading} message="gathering your thoughts..." />
      {isContentVisible && (
        <div className="space-y-10 animate-in fade-in duration-700 pb-12 px-4 md:px-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-border pb-8 gap-4">
            <div>
              <h1 className="font-display text-[40px] text-gray-text lowercase">my notes</h1>
              <p className="text-gray-light mt-2 text-[17px] font-medium">
                Manage your personal knowledge base.
              </p>
              {tagFilter && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-[13px] font-bold text-gray-nav">Filtering by tag:</span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue/5 border border-blue/10 text-blue text-[12px] font-bold">
                    <Tag size={12} weight="bold" />
                    {tagFilter}
                    <button 
                      onClick={() => navigate(RoutePath.NOTES)}
                      className="ml-1 hover:text-red transition-colors"
                    >
                      <X size={12} weight="bold" />
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
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-border text-[12px] font-bold text-gray-nav hover:text-blue hover:border-blue/30 transition-all duration-300 active:brightness-95 shadow-sm"
                    >
                      <Tag size={12} weight="bold" /> {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bezel-outer p-1 shadow-sm">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all duration-300 ease-out-quart ${viewMode === 'grid' ? 'bg-blue/10 text-blue' : 'text-gray-nav hover:bg-white/5'}`}
                  title="Grid View"
                >
                  <SquaresFour size={20} weight="bold" />
                </button>
                <button 
                  onClick={() => setViewMode('calendar')}
                  className={`p-2 rounded-lg transition-all duration-300 ease-out-quart ${viewMode === 'calendar' ? 'bg-blue/10 text-blue' : 'text-gray-nav hover:bg-white/5'}`}
                  title="Calendar View"
                >
                  <CalendarIcon size={20} weight="bold" />
                </button>
              </div>
              <Button 
                onClick={() => navigate(RoutePath.CREATE_NOTE)} 
                variant="primary"
                className="h-[48px] px-8 text-[15px] font-bold rounded-full shadow-sm active:scale-[0.98] transition-all duration-300 ease-out-quart"
              >
                <Plus className="mr-2 h-5 w-5" weight="bold" />
                Create note
              </Button>
            </div>
          </div>

          {viewMode === 'calendar' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="lg:col-span-7 xl:col-span-8">
                <div className="bezel-outer">
                  <div className="bezel-inner p-6 sm:p-8">
                    <ReactCalendar 
                      onChange={(val) => setSelectedDate(val as Date)} 
                      value={selectedDate}
                      tileContent={tileContent}
                      className="w-full border-none font-sans"
                    />
                  </div>
                </div>
              </div>
              <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[14px] font-black text-gray-text flex items-center gap-2">
                    <CalendarIcon size={18} weight="bold" className="text-blue" />
                    {format(selectedDate, 'MMMM do, yyyy')}
                  </h3>
                  <span className="text-[11px] font-bold text-gray-nav border border-border bg-white/5 px-2 py-1 rounded-lg">
                    {notesOnSelectedDate.length} {notesOnSelectedDate.length === 1 ? 'Note' : 'Notes'}
                  </span>
                </div>
                
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {notesOnSelectedDate.length > 0 ? (
                    notesOnSelectedDate.map(note => (
                      <div 
                        key={note.id}
                        onClick={() => navigate(RoutePath.NOTE_DETAIL.replace(':id', note.id))}
                        className="bezel-outer group cursor-pointer hover:shadow-none transition-all duration-300"
                      >
                        <div className="bezel-inner p-5">
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
                                <span key={tag} className="text-[10px] font-bold text-blue bg-blue/5 px-2 py-0.5 rounded-lg border border-blue/10">#{tag}</span>
                              ))}
                              {note.tags.length > 2 && <span className="text-[10px] font-bold text-gray-nav bg-white/5 px-2 py-0.5 rounded-lg border border-border">+{note.tags.length - 2}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bezel-outer">
                      <div className="bezel-inner flex flex-col items-center justify-center py-12 text-center border-dashed">
                        <div className="h-12 w-12 rounded-xl border border-border flex items-center justify-center text-gray-nav/30 mb-4 bg-white/5">
                          <FileText size={24} weight="duotone" />
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
                  className="bezel-outer group cursor-pointer flex flex-col overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-blue/30 hover:scale-[1.02]"
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                >
                  <div className="bezel-inner flex flex-col h-full !p-0">
                    <div className="relative h-44 w-full overflow-hidden border-b border-border">
                      {note.thumbnailUrl ? (
                         <>
                          <div className="absolute inset-0 bg-blue/0 transition-colors duration-500 group-hover:bg-blue/5 z-10" />
                          <StorageImage 
                              path={note.thumbnailUrl} 
                              alt={note.title} 
                              className="h-full w-full object-cover transition-transform duration-700 ease-out will-change-transform group-hover:scale-105" 
                          />
                         </>
                      ) : (
                         <div className="h-full w-full flex items-center justify-center bg-gray-50/5 dark:bg-white/5">
                            <FileText className="text-border transition-colors group-hover:text-blue/30" size={48} weight="duotone" />
                         </div>
                      )}
                      
                      <button 
                        onClick={(e) => initiateDelete(e, note.id)}
                        disabled={isDeleting && noteIdToDelete === note.id}
                        className="absolute top-4 left-4 z-20 h-9 w-9 flex items-center justify-center rounded-xl bg-white/90 dark:bg-black/50 backdrop-blur-md border border-border/50 text-gray-text hover:text-red hover:border-red/30 shadow-sm active:scale-95 transition-all duration-300"
                      >
                        {isDeleting && noteIdToDelete === note.id ? (
                          <CircleNotch size={16} weight="bold" className="animate-spin text-red" />
                        ) : (
                          <Trash size={16} weight="bold" />
                        )}
                      </button>
                      
                      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
                           <div className="flex items-center gap-2 rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-md border border-border/50 px-3 py-1 text-[11px] font-bold text-gray-text shadow-sm">
                              <div className="flex items-center gap-1.5 border-r border-border/30 pr-2 mr-0.5">
                                <CalendarIcon size={12} weight="bold" />
                                <span>{new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                              </div>
                              {note.mood ? (
                                <div className="flex items-center gap-1">
                                  {getMoodIcon(note.mood)}
                                  <span className="capitalize">{note.mood}</span>
                                </div>
                              ) : (
                                <span className="text-[10px] opacity-60 italic">No Mood</span>
                              )}
                           </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {note.tags?.map(tag => (
                          <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue/5 border border-blue/10 text-blue text-[10px] font-black">
                            <Tag size={8} weight="bold" />
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

                      <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
                         <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-blue flex items-center justify-center text-[10px] font-extrabold text-white shadow-sm">
                              {user?.name?.charAt(0) || 'U'}
                            </div>
                            <span className="text-[12px] font-bold text-gray-nav">Edited {format(new Date(note.updatedAt), 'MMM d')}</span>
                         </div>
                         <div className="flex items-center text-[12px] font-bold text-blue group-hover:opacity-70 transition-all duration-300">
                            <span>Open</span>
                            <ArrowUpRight size={14} weight="bold" className="ml-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!loading && filteredNotes.length === 0 && (
              <div className="bezel-outer">
                <div className="bezel-inner flex h-80 flex-col items-center justify-center text-center px-4 border-dashed">
                   <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center shadow-sm border border-border mb-6">
                       <FileText size={28} weight="duotone" className="text-gray-nav" />
                   </div>
                    <h3 className="font-display text-[24px] text-gray-text">Your personal sanctuary awaits.</h3>
                    <p className="text-gray-light mb-8 max-w-sm font-medium">
                      {tagFilter ? `We couldn't find any reflections with "${tagFilter}".` : "Begin your journey of reflection. Every entry is a step toward clarity."}
                    </p>
                   {tagFilter ? (
                     <Button 
                        onClick={() => navigate(RoutePath.NOTES)} 
                        variant="secondary" 
                        className="h-[48px] px-8 text-[15px] font-bold rounded-full border border-border text-gray-text shadow-sm active:scale-95 transition-all duration-300"
                      >
                        Clear filter
                      </Button>
                   ) : (
                      <Button 
                         onClick={() => navigate(RoutePath.CREATE_NOTE)} 
                         variant="primary" 
                         className="h-[48px] px-8 text-[15px] font-bold rounded-full shadow-sm active:scale-95 transition-all duration-300"
                      >
                         Log a reflection
                      </Button>
                   )}
                </div>
              </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={performDelete}

        confirmLabel={isDeleting ? 'Deleting...' : 'Delete note'}
        isConfirming={isDeleting}
        variant="danger"
      />
    </>
  );
};
