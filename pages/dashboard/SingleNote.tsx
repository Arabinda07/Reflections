import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit3, Trash2, ArrowLeft, Calendar, Clock, AlertCircle, Paperclip, FileText, Download, Smile, Sun, Cloud, Frown, Zap, Moon, Tag } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { noteService } from '../../services/noteService';
import { storageService } from '../../services/storageService';
import { Note, RoutePath } from '../../types';
import { StorageImage } from '../../components/ui/StorageImage';

export const SingleNote: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      }
    };
    fetchNote();
  }, [id, navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsConfirmOpen(false);
      }
    };
    
    if (isConfirmOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isConfirmOpen]);

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

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900"></div></div>;
  if (!note) return null;

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-6 animate-in fade-in duration-300 pb-20 relative px-4 md:px-0">
        {/* Sticky Header */}
        <div className="flex items-center justify-between sticky top-0 bg-[#FAFAFA]/90 backdrop-blur-sm py-4 z-10">
          <Button variant="ghost" size="sm" onClick={() => navigate(RoutePath.NOTES)} className="-ml-3 text-gray-nav hover:text-gray-text font-bold uppercase text-[12px]">
            <ArrowLeft className="mr-2 h-4 w-4" />
            BACK
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleEdit}
              disabled={isDeleting}
              className="border-2 border-border text-blue shadow-3d-gray active:shadow-none active:translate-y-[2px] transition-all liquid-glass"
            >
              <Edit3 className="mr-2 h-3.5 w-3.5" />
              EDIT
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={initiateDelete} 
              isLoading={isDeleting}
              disabled={isDeleting}
              className="border-2 border-border text-red shadow-3d-gray active:shadow-none active:translate-y-[2px] transition-all hover:bg-red/5 hover:border-red/30 liquid-glass"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              DELETE
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-2xl bg-red/5 border-2 border-red/10 p-4 flex items-center gap-3 text-red animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-[13px] font-bold uppercase">{error}</p>
          </div>
        )}

        {/* Note Content */}
        <article className="rounded-[32px] border-2 border-border bg-white shadow-[0_8px_0_0_#E5E5E5] overflow-hidden liquid-glass">
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
            <h1 className="mb-6 text-4xl font-display text-gray-text lowercase">{note.title}</h1>
            
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
            
            <div className="mb-8 flex flex-wrap items-center gap-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-nav border-b-2 border-border pb-6">
              <span className="flex items-center"><Calendar size={14} className="mr-1.5 opacity-70" /> {new Date(note.createdAt).toLocaleDateString()}</span>
              <span className="flex items-center"><Clock size={14} className="mr-1.5 opacity-70" /> {new Date(note.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              {note.mood && (
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border-2 border-border text-gray-text shadow-sm">
                  {getMoodIcon(note.mood)}
                  <span className="capitalize">{note.mood}</span>
                </span>
              )}
            </div>

            <div 
              className="prose prose-zinc prose-lg max-w-prose mx-auto text-gray-text leading-loose font-serif"
              dangerouslySetInnerHTML={{ __html: note.content }}
            />

            {/* Attachments Section */}
            {note.attachments && note.attachments.length > 0 && (
              <div className="mt-12 border-t-2 border-border pt-8">
                 <h3 className="text-[12px] font-extrabold text-gray-text uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Paperclip size={16} className="text-gray-nav" />
                    Attachments
                 </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {note.attachments.map((att, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border-2 border-border bg-white hover:bg-blue/5 hover:border-blue/30 transition-all group">
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

      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-blue/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md space-y-6 rounded-[32px] border-2 border-border bg-white px-8 py-8 shadow-[0_12px_0_0_#E5E5E5] overflow-hidden">
            <div className="space-y-2">
              <h3 className="text-[20px] font-display text-gray-text lowercase">delete this note?</h3>
              <p className="text-[15px] text-gray-light font-medium leading-relaxed">
                This action cannot be undone. Are you sure you want to permanently delete this note?
              </p>
            </div>
            
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button 
                onClick={() => setIsConfirmOpen(false)}
                className="rounded-2xl border-2 border-border bg-white px-6 py-3 text-[13px] font-extrabold text-gray-nav uppercase hover:bg-gray-100 transition-all shadow-[0_4px_0_0_#E5E5E5] active:shadow-none active:translate-y-[2px]"
              >
                CANCEL
              </button>
              <button
                onClick={performDelete}
                className="rounded-2xl bg-red px-6 py-3 text-[13px] font-extrabold text-white uppercase shadow-[0_4px_0_0_#B80000] transition-all hover:brightness-110 active:shadow-none active:translate-y-[2px]"
              >
                {isDeleting ? 'DELETING...' : 'DELETE NOTE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};