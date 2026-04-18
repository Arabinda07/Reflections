import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit3, Trash2, ArrowLeft, Calendar, Clock, AlertCircle, Paperclip, FileText, Download, Smile, Sun, Cloud, Frown, Zap, Moon, Tag, ListTodo, Check, X, ChevronRight } from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../../components/ui/Button';
import { noteService } from '../../services/noteService';
import { storageService } from '../../services/storageService';
import { Note, RoutePath, Task } from '../../types';
import { StorageImage } from '../../components/ui/StorageImage';
import { LoadingState } from '../../components/ui/LoadingState';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';

export const SingleNote: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [isContentVisible, setIsContentVisible] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Sanctuary Portal States
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchNote = async () => {
      try {
        const data = await noteService.getById(id);
        if (data) {
          setNote(data);
        } else {
          navigate(RoutePath.NOTES);
        }
      } catch (err) {
        console.error("Failed to fetch note", err);
      } finally {
        setLoading(false);
        setIsContentVisible(true);
      }
    };
    fetchNote();
  }, [id, navigate]);


  const initiateDelete = () => {
    setIsConfirmOpen(true);
  };

  const performDelete = async () => {
    if (!id) return;

    setIsDeleting(true);
    setError(null);

    try {
      await noteService.delete(id);
      navigate(RoutePath.NOTES);
    } catch (err) {
      console.error("Failed to delete note:", err);
      setError("Something went wrong while deleting this note. Please try again.");
      setIsDeleting(false);
      setIsConfirmOpen(false); 
    }
  };

  const handleEdit = () => {
    if (id) {
      navigate(RoutePath.EDIT_NOTE.replace(':id', id));
    }
  };

  const toggleTask = async (taskId: string) => {
    if (!note || !id) return;
    
    const updatedTasks = note.tasks?.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ) || [];
    
    setNote({ ...note, tasks: updatedTasks });
    
    try {
      await noteService.update(id, { tasks: updatedTasks });
    } catch (err) {
      console.error("Failed to update task status:", err);
      // Revert on error
      setNote(note);
    }
  };

  const getMoodIcon = (mood?: string) => {
    switch (mood) {
      case 'happy': return <Smile size={16} className="text-yellow-500" />;
      case 'calm': return <Sun size={16} className="text-emerald-500" />;
      case 'anxious': return <Cloud size={16} className="text-blue-500" />;
      case 'sad': return <Frown size={16} className="text-indigo-500" />;
      case 'angry': return <Zap size={16} className="text-rose-500" />;
      case 'tired': return <Moon size={16} className="text-slate-500" />;
      default: return null;
    }
  };

  const downloadAttachment = async (path: string) => {
    const url = await storageService.getSignedUrl(path);
    if (url) {
      window.open(url, '_blank');
    }
  };

  if (!note) return null;

  return (
    <>
      {/* LoadingState removed for instant detail view */}
      {isContentVisible && note && (
        <div className="flex h-screen w-full bg-white dark:bg-panel-bg overflow-hidden relative selection:bg-blue/10">
          {/* Sidebar - Integrated Sanctuary Control */}
          <aside 
            className={`fixed left-0 top-0 bottom-0 w-[200px] lg:w-[180px] border-r-2 border-border z-50 transition-all duration-700 ease-out-expo px-4 py-8 flex flex-col gap-6 
              ${isMobile ? 'liquid-glass-strong rounded-r-[40px] shadow-2xl overflow-y-auto' : 'bg-white dark:bg-panel-bg'}
              ${isMobile ? (isSidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0 opacity-100'}
            `}
          >
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black text-blue tracking-widest uppercase opacity-70">Sanctuary View</span>
              <div className="flex items-center gap-2 text-[12px] font-extrabold text-gray-nav mt-2">
                <Calendar size={14} className="text-gray-nav" />
                <span>{new Date(note.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
               <span className="text-[10px] font-black text-gray-nav tracking-widest uppercase opacity-40">Personalize</span>
               
               {/* Mood Toggle (Portal Trigger) */}
               <div className="relative">
                  <button 
                    onClick={() => setIsMoodOpen(true)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all duration-300 active:scale-95 ${note.mood ? 'bg-blue/10 border-blue text-blue shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-white dark:bg-panel-bg border-border text-gray-nav hover:border-blue/30'}`}
                  >
                    <div className="flex items-center gap-3">
                      {note.mood ? (
                        <>
                          {getMoodIcon(note.mood)}
                          <span className="text-[12px] font-black">{note.mood}</span>
                        </>
                      ) : (
                        <>
                          <Smile size={18} />
                          <span className="text-[12px] font-black uppercase tracking-tight">Set Mood</span>
                        </>
                      )}
                    </div>
                    <ChevronRight size={14} className={isMoodOpen ? 'rotate-90' : ''} />
                  </button>
               </div>

               {/* Tags Display (Portal Trigger) */}
               <div className="relative">
                  <button 
                    onClick={() => setIsTagsOpen(true)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all duration-300 active:scale-95 ${note.tags && note.tags.length > 0 ? 'bg-green/5 border-green text-green' : 'bg-white dark:bg-panel-bg border-border text-gray-nav hover:border-blue/30'}`}
                  >
                    <div className="flex items-center gap-3">
                      <Tag size={18} />
                      <span className="text-[12px] font-black uppercase tracking-tight">{note.tags?.length || 0} Tags</span>
                    </div>
                    <ChevronRight size={14} className={isTagsOpen ? 'rotate-90' : ''} />
                  </button>
               </div>

               {/* Tasks Button (Consolidated Portal) */}
               <div className="relative">
                  <button 
                    onClick={() => setIsTasksOpen(true)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all duration-300 ease-out-expo active:scale-95 ${note.tasks?.some(t => !t.completed) ? 'bg-blue/5 border-blue/40 text-blue shadow-[0_0_15px_rgba(59,130,246,0.05)]' : 'bg-white dark:bg-panel-bg border-border text-gray-nav hover:border-blue/30'}`}
                  >
                    <div className="flex items-center gap-3">
                      <ListTodo size={18} />
                      <span className="text-[12px] font-black uppercase tracking-tight">
                        {note.tasks?.filter(t => !t.completed).length > 0 ? `${note.tasks.filter(t => !t.completed).length} Tasks` : 'Tasks'}
                      </span>
                    </div>
                    <ChevronRight size={14} className={isTasksOpen ? 'rotate-90' : ''} />
                  </button>
               </div>
            </div>

            <div className="mt-auto">
               <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-border">
                  <p className="text-[10px] font-bold text-gray-nav flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue" />
                    Locked for Reflection
                  </p>
               </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className={`flex-1 flex flex-col min-w-0 transition-all duration-700 ease-out-expo ${isMobile ? 'pl-0' : (isTasksOpen ? 'pl-[440px]' : 'pl-[180px]')}`}>
            <div className="overflow-y-auto h-full px-4 md:px-0 pt-4 custom-scrollbar">
              <div className="mx-auto max-w-3xl space-y-6 animate-in fade-in duration-500 pb-20 relative px-4">
        {/* Sticky Header */}
        <div className="flex items-center justify-between sticky top-4 bg-white/80 backdrop-blur-xl py-3 px-4 sm:px-6 rounded-[24px] border-2 border-border shadow-sm z-10 mb-8 liquid-glass">
          <Button variant="ghost" size="sm" onClick={() => navigate(RoutePath.NOTES)} className="-ml-2 text-gray-nav hover:text-gray-text font-bold text-[12px]">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex gap-2 items-center">
            {isMobile && (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setIsSidebarOpen(true)}
                className="border-2 border-border text-gray-text shadow-sm active:scale-[0.98] transition-all duration-300 ease-out-quart liquid-glass mr-1"
              >
                <ChevronRight className={`mr-2 h-3.5 w-3.5 transition-transform ${isSidebarOpen ? 'rotate-180' : ''}`} />
                Personalize
              </Button>
            )}
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleEdit}
              disabled={isDeleting}
              className="border-2 border-border text-blue shadow-sm active:scale-[0.98] transition-all duration-300 ease-out-quart liquid-glass"
            >
              <Edit3 className="mr-2 h-3.5 w-3.5" />
              Edit
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={initiateDelete} 
              isLoading={isDeleting}
              disabled={isDeleting}
              className="border-2 border-border text-red shadow-sm active:scale-[0.98] transition-all duration-300 ease-out-quart hover:bg-red/5 hover:border-red/30 liquid-glass"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-2xl bg-red/5 border-2 border-red/10 p-4 flex items-center gap-3 text-red animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-[13px] font-bold">{error}</p>
          </div>
        )}

        {/* Note Content */}
        <article className="rounded-[32px] border-2 border-border bg-white shadow-sm overflow-hidden liquid-glass">
          {note.thumbnailUrl && (
            <div className="h-64 w-full bg-white border-b-2 border-border">
              <StorageImage 
                path={note.thumbnailUrl} 
                alt={note.title} 
                className="h-full w-full object-cover" 
              />
            </div>
          )}
          
          <div className="p-8 md:p-12">
            <h1 className="mb-6 text-4xl font-display text-gray-text">{note.title}</h1>
            
            {note.tags && note.tags.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {note.tags.map(tag => (
                  <button 
                    key={tag} 
                    onClick={() => navigate(`${RoutePath.NOTES}?tag=${tag}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue/5 border-2 border-blue/10 text-blue text-[12px] font-bold hover:bg-blue/10 transition-colors liquid-glass"
                  >
                    <Tag size={12} />
                    {tag}
                  </button>
                ))}
              </div>
            )}
            
            <div className="mb-8 flex flex-wrap items-center gap-3 border-b-2 border-border pb-6">
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue/5 border-2 border-blue/10 text-blue text-[11px] font-extrabold shadow-sm">
                <Calendar size={14} /> 
                {new Date(note.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green/5 border-2 border-green/10 text-green text-[11px] font-extrabold shadow-sm">
                <Clock size={14} /> 
                {new Date(note.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
              {note.mood && (
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/5 border-2 border-purple-500/10 text-purple-600 text-[11px] font-extrabold shadow-sm">
                  {getMoodIcon(note.mood)}
                  <span>{note.mood}</span>
                </span>
              )}
            </div>

            <div 
              className="prose prose-zinc prose-lg max-w-prose mx-auto text-gray-text leading-loose font-sans"
              dangerouslySetInnerHTML={{ __html: note.content }}
            />


            {/* Attachments Section */}
            {note.attachments && note.attachments.length > 0 && (
              <div className="mt-12 border-t-2 border-border pt-8">
                 <h3 className="text-[13px] font-extrabold text-gray-text mb-4 flex items-center gap-2">
                    <Paperclip size={16} className="text-gray-nav" />
                    Attachments
                 </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {note.attachments.map((att, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border-2 border-border bg-white hover:bg-blue/5 hover:border-blue/30 transition-all duration-300 ease-out-quart group">
                         <div className="h-10 w-10 shrink-0 rounded-lg bg-white border-2 border-border flex items-center justify-center text-gray-nav shadow-sm">
                            <FileText size={20} />
                         </div>
                         <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-bold text-gray-text truncate">{att.name}</p>
                            <p className="text-[11px] text-gray-nav font-bold">{(att.size / 1024).toFixed(1)} KB</p>
                         </div>
                         <button 
                            onClick={() => downloadAttachment(att.path)}
                            className="p-2 text-gray-nav hover:text-blue hover:bg-blue/10 rounded-xl transition-colors border-2 border-transparent hover:border-blue/20"
                            title="Download"
                         >
                            <Download size={16} />
                         </button>
                      </div>
                    ))}
                 </div>
              </div>
            )}
          </div>
        </article>
            </div>
          </div>
        </main>

          {/* Mood Portal (View Only) */}
          {createPortal(
            <AnimatePresence>
              {isMoodOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setIsMoodOpen(false)} />
                  <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-[320px] bg-white/95 dark:bg-panel-bg/95 border-2 border-border/40 rounded-[40px] p-8 shadow-2xl">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-[18px] font-black text-gray-text tracking-tight">Reflection Mood</h3>
                        <p className="text-[11px] font-bold text-gray-nav">How you felt</p>
                      </div>
                      <button onClick={() => setIsMoodOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-nav hover:text-red transition-all">
                        <X size={20} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                       {note.mood ? (
                         <div className="w-full p-6 rounded-3xl bg-blue/5 border-2 border-blue/10 flex flex-col items-center gap-4">
                            <div className="scale-150">{getMoodIcon(note.mood)}</div>
                            <span className="text-[16px] font-black text-blue uppercase tracking-widest">{note.mood}</span>
                         </div>
                       ) : (
                         <p className="text-[12px] font-bold text-gray-nav italic">No mood was set for this reflection.</p>
                       )}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>,
            document.body
          )}

          {/* Tags Portal (View Only) */}
          {createPortal(
            <AnimatePresence>
              {isTagsOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setIsTagsOpen(false)} />
                  <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-[380px] bg-white/95 dark:bg-panel-bg/95 border-2 border-border/40 rounded-[40px] p-8 shadow-2xl">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-[18px] font-black text-gray-text tracking-tight">Sanctuary Tags</h3>
                        <p className="text-[11px] font-bold text-gray-nav">Note organization</p>
                      </div>
                      <button onClick={() => setIsTagsOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-nav hover:text-red transition-all">
                        <X size={20} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto">
                      {note.tags && note.tags.length > 0 ? (
                        note.tags.map(tag => (
                          <span key={tag} className="px-4 py-2 rounded-2xl bg-green/5 border-2 border-green/10 text-[12px] font-black text-green">
                            #{tag}
                          </span>
                        ))
                      ) : (
                        <p className="text-[12px] font-bold text-gray-nav italic">No tags for this note.</p>
                      )}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>,
            document.body
          )}

          {/* Sanctuary Side Drawer for Tasks */}
          <AnimatePresence>
            {isTasksOpen && (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className={`fixed top-0 bottom-0 z-[45] border-r-2 border-border transition-all duration-700 ease-out-expo flex flex-col
                  ${isMobile 
                    ? 'left-0 right-0 bg-white/95 dark:bg-panel-bg/95 backdrop-blur-xl z-[100] px-6 py-8' 
                    : 'left-[180px] w-[260px] bg-white dark:bg-panel-bg px-5 py-8 shadow-[10px_0_30px_rgba(0,0,0,0.02)]'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-[18px] font-black text-gray-text tracking-tight leading-tight">Actionable Tasks</h3>
                    <p className="text-[10px] font-bold text-gray-nav mt-1 opacity-60">Items from this reflection</p>
                  </div>
                  {isMobile && (
                    <button 
                      onClick={() => setIsTasksOpen(false)}
                      className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-nav"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar no-scrollbar scroll-smooth">
                  {!note.tasks || note.tasks.length === 0 ? (
                    <div className="text-center py-12 opacity-30 select-none">
                      <ListTodo size={32} className="mx-auto mb-3 opacity-40" />
                      <p className="text-[11px] font-bold italic">No tasks in this sanctuary.</p>
                    </div>
                  ) : (
                    note.tasks.map((task) => (
                      <div 
                        key={task.id} 
                        className={`flex items-center gap-3 p-3 rounded-[20px] border-2 transition-all duration-300 ${
                          task.completed 
                            ? 'border-emerald-100/50 bg-emerald-50/30 opacity-60' 
                            : 'border-border bg-white shadow-sm hover:border-blue/30'
                        }`}
                      >
                        <button 
                          onClick={() => !task.completed && toggleTask(task.id)}
                          disabled={task.completed}
                          className={`h-5 w-5 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                            task.completed 
                              ? 'bg-emerald-500 border-emerald-500 text-white cursor-default' 
                              : 'border-border text-transparent hover:border-blue/50'
                          }`}
                        >
                          <Check size={12} strokeWidth={4} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[12px] font-bold text-gray-text truncate transition-all duration-300 ${task.completed ? 'line-through opacity-50' : ''}`}>
                            {task.text}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-6 p-4 rounded-2xl bg-gray-50/50 dark:bg-white/5 border border-dashed border-border text-center">
                   <p className="text-[10px] font-black text-gray-nav uppercase tracking-tighter">Read Only in View Mode</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
