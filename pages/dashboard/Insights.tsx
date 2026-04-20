import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkle, Brain, Calendar, CheckSquare, Heart, TrendUp, Book, CaretRight, Hash, X } from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { RoutePath, Note, LifeTheme } from '../../types';
import { noteService } from '../../services/noteService';
import { wikiService } from '../../services/wikiService';
import { FREE_AI_MINIMUM_NOTES } from '../../services/wellnessPolicy';

// Flat soft colors — no gradients
const MOOD_COLORS: Record<string, string> = {
  happy:   '#f59e0b',
  calm:    '#10b981',
  anxious: '#60a5fa',
  sad:     '#818cf8',
  angry:   '#fb7185',
  tired:   '#94a3b8',
};

const MOOD_BG: Record<string, string> = {
  happy:   '#fef3c7',
  calm:    '#d1fae5',
  anxious: '#dbeafe',
  sad:     '#e0e7ff',
  angry:   '#ffe4e6',
  tired:   '#f1f5f9',
};

export const Insights: React.FC = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [themes, setThemes] = useState<LifeTheme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<LifeTheme | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      
      try {
        const [allNotes, allThemes] = await Promise.all([
          noteService.getAll(),
          wikiService.getAllThemes()
        ]);

        setNotes(allNotes);
        setThemes(allThemes);
      } catch (error) {
        console.error('[Insights] Failed to load data:', error);
      }
    };
    fetchData();
    console.info("[Reflections] Insights Page v2 - No Animations");
  }, []);

  // Soft Aggregation Engine
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let monthNotes = 0;
    const daysSet = new Set<string>();
    const moodCounts: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};
    let totalTasks = 0;
    let completedTasks = 0;

    notes.forEach(note => {
      const date = new Date(note.createdAt);
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        monthNotes++;
        daysSet.add(date.toDateString());
      }
      
      if (note.mood) {
        moodCounts[note.mood] = (moodCounts[note.mood] || 0) + 1;
      }
      
      if (note.tags) {
        note.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
      
      if (note.tasks) {
        note.tasks.forEach(t => {
          totalTasks++;
          if (t.completed) completedTasks++;
        });
      }
    });

    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'undefined';
    
    // Format for Recharts
    const moodData = Object.entries(moodCounts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    
    // Sort Tags
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      monthNotes,
      totalNotes: notes.length,
      daysCheckedIn: daysSet.size,
      topMood,
      moodData,
      topTags,
      totalTasks,
      completedTasks,
      taskProgress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };
  }, [notes]);

  return (
      <div className="mx-auto max-w-[1000px] pb-32 px-4 md:px-10">
      <nav className="sticky top-4 z-50 mb-16 flex items-center justify-between rounded-full border border-border bg-white/90 px-4 py-3 shadow-sm backdrop-blur-2xl transition-all duration-300 ease-out-quart">
        <div className="flex items-center gap-3">
           <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-gray-nav hover:text-gray-text font-bold text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green">
             <ArrowLeft className="mr-2 h-4 w-4" weight="bold" />
             Back
           </Button>
           <div className="h-4 w-[1px] bg-border"></div>
           <span className="text-[11px] uppercase tracking-widest font-black text-gray-nav">Stats & insights</span>
        </div>
      </nav>

      {/* Hero Visual Header */}
      <header className="text-center mb-16 max-w-2xl mx-auto">
        <div className="inline-flex h-[72px] w-[72px] items-center justify-center rounded-[28px] bg-blue/5 text-blue mb-8 shadow-sm border border-blue/10 bg-white">
          <Brain size={36} weight="duotone" className="opacity-80 drop-shadow-sm" />
        </div>
        <h1 className="text-4xl md:text-5xl font-display text-gray-text mb-4 tracking-tighter drop-shadow-sm">Your monthly wellness journey</h1>
        <p className="text-[16px] md:text-[18px] text-gray-light font-medium leading-relaxed max-w-lg mx-auto">
          A gentle look at the patterns your journaling is quietly making, with space for deep reflection when you choose it.
        </p>
      </header>

      {/* 4 Soft Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16">
        <div className="bezel-outer transition-transform hover:scale-[1.02]">
          <div className="bezel-inner p-6 flex flex-col justify-between h-full">
            <Calendar size={24} weight="duotone" className="text-blue mb-6 opacity-70" />
            <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-nav mb-2">This month</h4>
            <span className="text-4xl font-display text-gray-text block mb-1">{stats.monthNotes}</span>
            <p className="text-[12px] font-medium text-gray-light">notes in {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        <div className="bezel-outer transition-transform hover:scale-[1.02]">
          <div className="bezel-inner p-6 flex flex-col justify-between h-full">
            <TrendUp size={24} weight="duotone" className="text-green mb-6 opacity-70" />
            <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-nav mb-2">Writing rhythm</h4>
            <span className="text-4xl font-display text-gray-text block mb-1">{stats.daysCheckedIn}</span>
            <p className="text-[12px] font-medium text-gray-light">unique days checked in</p>
          </div>
        </div>

        <div className="bezel-outer transition-transform hover:scale-[1.02]">
          <div className="bezel-inner p-6 flex flex-col justify-between h-full">
            <Heart size={24} weight="duotone" className="text-purple-500 mb-6 opacity-70" />
            <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-nav mb-2">Prevalent mood</h4>
            <span className="text-4xl font-display text-gray-text block mb-1 capitalize truncate">{stats.topMood === 'undefined' ? '-' : stats.topMood}</span>
            <p className="text-[12px] font-medium text-gray-light">your most frequent feeling</p>
          </div>
        </div>

        <div className="bezel-outer transition-transform hover:scale-[1.02]">
          <div className="bezel-inner p-6 flex flex-col justify-between h-full">
            <CheckSquare size={24} weight="duotone" className="text-orange mb-6 opacity-70" />
            <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-nav mb-2">Action momentum</h4>
            <span className="text-4xl font-display text-gray-text block mb-1">{stats.taskProgress}%</span>
            <p className="text-[12px] font-medium text-gray-light">{stats.completedTasks} of {stats.totalTasks} tasks finished</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {/* Stacked Soft Mood Bars */}
        <div className="bezel-outer min-h-[300px]">
          <div className="bezel-inner p-8 flex flex-col h-full">
            <h3 className="text-[18px] font-display text-gray-text mb-6">Mood frequency</h3>
            {stats.moodData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-[13px] text-gray-nav font-medium italic">Label some moods to see your pattern.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 flex-1 justify-center">
                {stats.moodData.map((entry) => {
                  const maxVal = stats.moodData[0].value;
                  const pct = Math.round((entry.value / maxVal) * 100);
                  const color = MOOD_COLORS[entry.name] || '#94a3b8';
                  const bg = MOOD_BG[entry.name] || '#f1f5f9';
                  return (
                    <div key={entry.name} className="flex items-center gap-4">
                      <span
                        className="text-[11px] font-black w-14 shrink-0 capitalize tracking-widest"
                        style={{ color }}
                      >
                        {entry.name}
                      </span>
                      <div className="relative flex-1 h-8 rounded-full overflow-hidden" style={{ background: bg }}>
                      <div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{ backgroundColor: color, width: `${pct}%` }}
                      />
                      </div>
                      <span className="text-[12px] font-extrabold text-gray-nav w-6 text-right shrink-0">
                        {entry.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Mind Map / Tags Cloud */}
        <div className="bezel-outer min-h-[300px]">
          <div className="bezel-inner p-8 flex flex-col h-full relative">
            <h3 className="text-[18px] font-display text-gray-text mb-6">Cognitive mind map</h3>
            {stats.topTags.length === 0 ? (
               <div className="flex-1 flex items-center justify-center">
                 <p className="text-[13px] text-gray-nav font-medium italic">Tag your entries to build a mind map.</p>
               </div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-4 flex-1 content-center px-4">
                {stats.topTags.map(([tag, count], i) => {
                  const scale = Math.min(2.5, Math.max(0.8, count / 2));
                  const colors = ['text-blue', 'text-green', 'text-purple-500', 'text-orange'];
                  const color = colors[i % colors.length];
                  return (
                    <span 
                      key={tag} 
                      className={`font-display lowercase ${color} opacity-${Math.min(90, Math.max(40, count * 15))}`}
                      style={{ fontSize: `${scale}rem`, lineHeight: '1', filter: `drop-shadow(0px 2px 4px rgba(0,0,0,0.05))` }}
                    >
                      #{tag}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LLM WIKI / LIFE THEME LIBRARY */}
      <div className="bezel-outer mb-16">
        <div className="bezel-inner p-8 overflow-hidden relative">
          <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-green/5 text-green border border-green/10 shadow-sm">
                <Book size={28} weight="duotone" />
              </div>
              <div>
                <h2 className="text-3xl font-display text-gray-text tracking-tight">Personal life wiki</h2>
                <p className="text-[14px] text-gray-light font-medium">Compiled from {notes.length} reflections</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-blue/5 border border-blue/10 rounded-full text-[10px] font-black text-blue tracking-widest uppercase">
                 Compounding insights
              </div>
            </div>
          </div>

          {notes.length < FREE_AI_MINIMUM_NOTES ? (
            <div className="text-center py-20 border border-dashed border-border rounded-[24px] bg-gray-50/5">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-border text-gray-nav shadow-sm mb-4">
                <Sparkle size={18} weight="duotone" />
              </div>
              <p className="font-display text-gray-text text-xl">Your wiki builds as you journal.</p>
              <p className="mt-2 text-gray-light text-[14px] max-w-sm mx-auto">
                Write {FREE_AI_MINIMUM_NOTES - notes.length} more {FREE_AI_MINIMUM_NOTES - notes.length === 1 ? 'entry' : 'entries'} to unlock your personal Life Wiki and 1 free deep AI reflection.
              </p>
              <Button
                variant="ghost"
                className="mt-6 text-[11px] font-black"
                onClick={() => navigate(RoutePath.CREATE_NOTE)}
              >
                Start writing
              </Button>
            </div>
          ) : themes.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border rounded-[24px] bg-gray-50/5">
               <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-border text-gray-nav shadow-sm mb-4">
                  <Sparkle size={18} weight="duotone" />
               </div>
               <p className="font-display text-gray-text text-xl">Your wiki is being built.</p>
               <p className="mt-2 text-gray-light text-[14px] max-w-sm mx-auto">You've unlocked your Life Wiki and 1 free AI reflection. The AI librarian will automatically identify and update recurring themes here as you write.</p>
               <Button
                 variant="ghost"
                 className="mt-6 text-[11px] font-black"
                 onClick={() => navigate(RoutePath.CREATE_NOTE)}
               >
                  Continue journaling
               </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {themes.map(theme => (
                <div
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme)}
                  className="group cursor-pointer bezel-outer hover:shadow-none transition-all duration-300 ease-out-quart flex flex-col justify-between h-[180px]"
                >
                  <div className="bezel-inner p-6 h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-black uppercase tracking-widest text-gray-nav">Life theme</span>
                        <Hash size={14} weight="bold" className="text-gray-light opacity-50" />
                      </div>
                      <h3 className="text-xl font-display text-gray-text line-clamp-2 leading-tight group-hover:text-green transition-colors">
                        {theme.title}
                      </h3>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-[11px] font-medium text-gray-light">
                        Updated {new Date(theme.updatedAt).toLocaleDateString()}
                      </span>
                      <div className="h-8 w-8 rounded-full bg-white/5 border border-border flex items-center justify-center group-hover:bg-green group-hover:text-white group-hover:border-green transition-all duration-300 ease-out-quart">
                        <CaretRight size={16} weight="bold" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* THEME DETAIL MODAL / SLIDE OVER */}
        {selectedTheme && createPortal(
          <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div
              onClick={() => setSelectedTheme(null)}
              className="absolute inset-0 bg-body/60 backdrop-blur-xl"
            />
            <div
              className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden bezel-outer shadow-2xl flex flex-col"
            >
              <div className="bezel-inner flex flex-col h-full !p-0">
                <div className="sticky top-0 z-10 p-6 border-b border-border bg-white dark:bg-panel-bg flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-green/10 text-green flex items-center justify-center">
                      <Book size={20} weight="duotone" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-display text-gray-text leading-none">{selectedTheme.title}</h3>
                      <p className="text-[11px] font-black text-gray-nav mt-1.5 flex items-center gap-2">
                         Personal wiki entry <span className="h-1 w-1 rounded-full bg-border" /> Updated {new Date(selectedTheme.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedTheme(null)}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors border border-transparent hover:border-border"
                  >
                    <X size={20} weight="bold" className="text-gray-nav" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 font-sans bg-white dark:bg-panel-bg">
                  <div 
                    className="prose prose-slate max-w-none text-gray-text leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: selectedTheme.content.replace(/\n\n/g, '<br/><br/>') }}
                  />
                </div>

                <div className="p-6 border-t border-border bg-gray-50/50 dark:bg-black/20 flex items-center justify-between">
                  <p className="text-[12px] text-gray-light font-medium italic">
                    This page evolves as you write more reflections.
                  </p>
                  <Button size="sm" variant="ghost" className="text-[11px] font-black" onClick={() => setSelectedTheme(null)}>
                    Close entry
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
  );
};
