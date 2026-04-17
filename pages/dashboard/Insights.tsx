import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Brain, Calendar, CheckSquare, Heart, Lock, TrendingUp, Loader2, MessageSquare, Crown, Book, ChevronRight, Hash, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../../components/ui/Button';
import { RoutePath, Note, LifeTheme } from '../../types';
import { noteService } from '../../services/noteService';
import { GoogleGenAI } from "@google/genai";
import { supabase } from '../../src/supabaseClient';
import { LoadingState } from '../../components/ui/LoadingState';
import { AIThinkingState } from '../../components/ui/AIThinkingState';
import { wikiService } from '../../services/wikiService';

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
  const [loading, setLoading] = useState(true);
  
  // Freemium States
  const [isPro, setIsPro] = useState(false);
  const [reflectionsUsed, setReflectionsUsed] = useState(0);
  const [themes, setThemes] = useState<LifeTheme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<LifeTheme | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // Minimum display time for the initial sanctuary entry (7 seconds)
      const minTimePromise = new Promise(resolve => setTimeout(resolve, 7000));
      
      try {
        const [allNotes, userResponse, allThemes] = await Promise.all([
          noteService.getAll(),
          supabase.auth.getUser(),
          wikiService.getAllThemes(),
          minTimePromise
        ]);
        
        setNotes(allNotes);
        setThemes(allThemes);
        
        if (userResponse.data.user) {
          const meta = userResponse.data.user.user_metadata || {};
          setIsPro(meta.is_pro || false);
          setReflectionsUsed(meta.reflections_used || 0);
        }
      } catch (error) {
        console.error("Failed to fetch insights data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // We no longer early-return; the page content is always mounted.
  // AIThinkingState sits as a fixed overlay on top and exits smoothly into the page.

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

  const handleGenerateReflection = async () => {
    // Note: We are migrating towards incremental background ingestion.
    // For now, this button can act as a "Force Sync" or a trigger for a global audit
    // but the actual Wiki is populated primarily through Note Saves.
    navigate(RoutePath.CREATE_NOTE); // Encourage writing to grow the wiki
  };

  const isFreeAvailable = !isPro && reflectionsUsed === 0;
  const isPremiumLocked = !isPro && reflectionsUsed > 0 && !reflectionText;
  const hasEnoughNotes = notes.length >= 3;



  return (
    <>
      {/* Cinematic loading overlay — sits above the page, exits smoothly */}
      <AIThinkingState isVisible={loading} />

      <div className="mx-auto max-w-[1000px] animate-in fade-in duration-700 pb-32 px-4 md:px-10">
      <nav className="sticky top-4 z-50 mb-16 flex items-center justify-between rounded-2xl border-2 border-border bg-white/90 px-4 py-3 shadow-sm backdrop-blur-2xl transition-all duration-300 ease-out-quart">
        <div className="flex items-center gap-3">
           <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-gray-nav hover:text-gray-text font-bold uppercase text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green">
             <ArrowLeft className="mr-2 h-4 w-4" />
             BACK
           </Button>
           <div className="h-4 w-[2px] bg-border"></div>
           <span className="text-[12px] font-extrabold text-gray-nav uppercase tracking-wider">Stats & Insights</span>
        </div>
      </nav>

      {/* Hero Visual Header */}
      <header className="text-center mb-16 max-w-2xl mx-auto">
        <div className="inline-flex h-[72px] w-[72px] items-center justify-center rounded-[28px] bg-blue/5 text-blue mb-8 shadow-sm border border-blue/10 bg-white liquid-glass">
          <Brain size={36} className="opacity-80 drop-shadow-sm" />
        </div>
        <h1 className="text-4xl md:text-5xl font-display text-gray-text lowercase mb-4 tracking-tighter drop-shadow-sm">your monthly wellness journey</h1>
        <p className="text-[16px] md:text-[18px] text-gray-light font-medium leading-relaxed max-w-lg mx-auto">
          A gentle look at the patterns your journaling is quietly making, with space for deep reflection when you choose it.
        </p>
      </header>

      {/* 4 Soft Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16">
        <div className="bg-white border-2 border-border rounded-[32px] p-6 shadow-sm flex flex-col justify-between liquid-glass grow transition-transform hover:-translate-y-1">
          <Calendar size={20} className="text-blue mb-6 opacity-70" />
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-nav mb-2">This Month</h4>
          <span className="text-4xl font-display text-gray-text block mb-1">{stats.monthNotes}</span>
          <p className="text-[12px] font-medium text-gray-light">notes in {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
        </div>

        <div className="bg-white border-2 border-border rounded-[32px] p-6 shadow-sm flex flex-col justify-between liquid-glass grow transition-transform hover:-translate-y-1">
          <TrendingUp size={20} className="text-green mb-6 opacity-70" />
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-nav mb-2">Writing Rhythm</h4>
          <span className="text-4xl font-display text-gray-text block mb-1">{stats.daysCheckedIn}</span>
          <p className="text-[12px] font-medium text-gray-light">unique days checked in</p>
        </div>

        <div className="bg-white border-2 border-border rounded-[32px] p-6 shadow-sm flex flex-col justify-between liquid-glass grow transition-transform hover:-translate-y-1">
          <Heart size={20} className="text-purple-500 mb-6 opacity-70" />
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-nav mb-2">Prevalent Mood</h4>
          <span className="text-4xl font-display text-gray-text block mb-1 capitalize truncate">{stats.topMood === 'undefined' ? '-' : stats.topMood}</span>
          <p className="text-[12px] font-medium text-gray-light">your most frequent feeling</p>
        </div>

        <div className="bg-white border-2 border-border rounded-[32px] p-6 shadow-sm flex flex-col justify-between liquid-glass grow transition-transform hover:-translate-y-1">
          <CheckSquare size={20} className="text-orange mb-6 opacity-70" />
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-nav mb-2">Action Momentum</h4>
          <span className="text-4xl font-display text-gray-text block mb-1">{stats.taskProgress}%</span>
          <p className="text-[12px] font-medium text-gray-light">{stats.completedTasks} of {stats.totalTasks} tasks finished</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {/* Stacked Soft Mood Bars */}
        <div className="bg-white dark:bg-[#1E1E1E] border-2 border-border rounded-[40px] p-8 shadow-sm dark:shadow-sm liquid-glass flex flex-col min-h-[300px]">
          <h3 className="text-[14px] font-extrabold text-gray-text uppercase tracking-wider mb-6">Mood Frequency</h3>
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
                      className="text-[11px] font-black uppercase tracking-widest w-14 shrink-0 capitalize"
                      style={{ color }}
                    >
                      {entry.name}
                    </span>
                    <div className="relative flex-1 h-8 rounded-full overflow-hidden" style={{ background: bg }}>
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{ backgroundColor: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
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

        {/* Mind Map / Tags Cloud */}
        <div className="bg-white border-2 border-border rounded-[40px] p-8 shadow-sm liquid-glass relative min-h-[300px] flex flex-col">
          <h3 className="text-[14px] font-extrabold text-gray-text uppercase tracking-wider mb-6">Cognitive Mind Map</h3>
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

      {/* LLM WIKI / LIFE THEME LIBRARY */}
      <div className="relative w-full overflow-hidden bg-white border-2 border-border rounded-[32px] p-8 shadow-sm liquid-glass mb-16">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-green/5 text-green border-2 border-green/10 shadow-sm">
              <Book size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-display text-gray-text lowercase tracking-tight">Personal Life Wiki</h2>
              <p className="text-[14px] text-gray-light font-medium">Compiled from {notes.length} reflections</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-blue/5 border border-blue/10 rounded-full text-[10px] font-black uppercase text-blue">
               Compounding Insights
            </div>
          </div>
        </div>

        {themes.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-[24px] bg-gray-50/30">
             <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-gray-nav shadow-sm mb-4">
                <Sparkles size={18} />
             </div>
             <p className="font-display lowercase text-gray-text text-xl">your wiki is being built.</p>
             <p className="mt-2 text-gray-light text-[14px] max-w-sm mx-auto">As you journal, the AI librarian will automatically identify and update recurring themes in your life here.</p>
             <Button 
               variant="ghost" 
               className="mt-6 text-[11px] font-black uppercase tracking-widest"
               onClick={() => navigate(RoutePath.CREATE_NOTE)}
             >
                WRITE YOUR FIRST ENTRY
             </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {themes.map(theme => (
              <motion.div
                key={theme.id}
                whileHover={{ y: -4 }}
                onClick={() => setSelectedTheme(theme)}
                className="group cursor-pointer p-6 bg-white border-2 border-border rounded-[24px] shadow-sm hover:shadow-md hover:border-green/30 transition-all duration-300 ease-out-quart flex flex-col justify-between h-[180px]"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-nav">Life Theme</span>
                    <Hash size={14} className="text-gray-light opacity-50" />
                  </div>
                  <h3 className="text-xl font-display text-gray-text lowercase line-clamp-2 leading-tight group-hover:text-green transition-colors">
                    {theme.title}
                  </h3>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[11px] font-medium text-gray-light">
                    Updated {new Date(theme.updatedAt).toLocaleDateString()}
                  </span>
                  <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-green group-hover:text-white transition-all duration-300 ease-out-quart">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* THEME DETAIL MODAL / SLIDE OVER */}
      <AnimatePresence>
        {selectedTheme && (
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTheme(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden bg-white rounded-[32px] border-2 border-border shadow-2xl flex flex-col"
            >
              <div className="sticky top-0 z-10 p-6 border-b border-border bg-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-green/10 text-green flex items-center justify-center">
                    <Book size={20} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-display text-gray-text lowercase leading-none">{selectedTheme.title}</h3>
                    <p className="text-[11px] font-black tracking-widest uppercase text-gray-nav mt-1.5 flex items-center gap-2">
                       Personal Wiki Entry <span className="h-1 w-1 rounded-full bg-border" /> Updated {new Date(selectedTheme.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTheme(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-nav" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 font-sans">
                <div 
                  className="prose prose-slate max-w-none text-gray-text leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: selectedTheme.content.replace(/\n\n/g, '<br/><br/>') }}
                />
              </div>

              <div className="p-6 border-t border-border bg-gray-50 flex items-center justify-between">
                <p className="text-[12px] text-gray-light font-medium italic">
                  This page evolves as you write more reflections.
                </p>
                <Button size="sm" variant="ghost" className="text-[11px] font-black tracking-widest" onClick={() => setSelectedTheme(null)}>
                  CLOSE ENTRY
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AIThinkingState isVisible={generating} />
    </div>
    </>
  );
};
