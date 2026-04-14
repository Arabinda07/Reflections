import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Brain, Calendar, CheckSquare, Heart, Lock, TrendingUp, Loader2, MessageSquare, Crown } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { RoutePath, Note } from '../../types';
import { noteService } from '../../services/noteService';
import { GoogleGenAI } from "@google/genai";
import { supabase } from '../../src/supabaseClient';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';

// Soft pastel dictionary for recharts
const MOOD_COLORS: Record<string, string> = {
  happy: '#eab308',
  calm: '#10b981',
  anxious: '#3b82f6',
  sad: '#6366f1',
  angry: '#f43f5e',
  tired: '#64748b',
};

export const Insights: React.FC = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Freemium States
  const [isPro, setIsPro] = useState(false);
  const [reflectionsUsed, setReflectionsUsed] = useState(0);
  const [reflectionText, setReflectionText] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allNotes, userResponse] = await Promise.all([
          noteService.getAll(),
          supabase.auth.getUser()
        ]);
        
        setNotes(allNotes);
        
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
    setGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const notesContext = notes
        .slice(0, 15) // Context window
        .map(n => `Title: ${n.title}\nContent: ${n.content.replace(/<[^>]*>/g, '')}\nMood: ${n.mood || 'None'}`)
        .join('\n\n---\n\n');

      const prompt = `You are a grounding journaling assistant. Review the user's recent entries and provide 1-2 short paragraphs with concrete observations from their notes. Offer one gentle takeaway or question. Do not use process narration, meta-framing, or attempt to be profound. Just reflect what you see directly.

      Recent Notes:
      ${notesContext}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });
      
      if (response.text) {
        setReflectionText(response.text);
        
        // Monetization trigger
        if (!isPro) {
          const newUsed = reflectionsUsed + 1;
          setReflectionsUsed(newUsed);
          
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.auth.updateUser({
              data: { reflections_used: newUsed }
            });
          }
        }
      }
    } catch (error: any) {
      console.error("AI deep reflection failed:", error);
      alert(`Error generating reflection: ${error?.message || "Please check your GEMINI_API_KEY or connection."}`);
    } finally {
      setGenerating(false);
    }
  };

  const isFreeAvailable = !isPro && reflectionsUsed === 0;
  const isPremiumLocked = !isPro && reflectionsUsed > 0 && !reflectionText;
  const hasEnoughNotes = notes.length >= 3;

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1000px] animate-in fade-in duration-700 pb-32 px-4 md:px-10">
      <nav className="sticky top-4 z-50 mb-16 flex items-center justify-between rounded-2xl border-2 border-border bg-white/90 px-4 py-3 shadow-[0_4px_0_0_#E5E5E5] backdrop-blur-2xl transition-all">
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
        <div className="bg-white border-2 border-border rounded-[32px] p-6 shadow-[0_6px_0_0_#E5E5E5] flex flex-col justify-between liquid-glass grow transition-transform hover:-translate-y-1">
          <Calendar size={20} className="text-blue mb-6 opacity-70" />
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-nav mb-2">This Month</h4>
          <span className="text-4xl font-display text-gray-text block mb-1">{stats.monthNotes}</span>
          <p className="text-[12px] font-medium text-gray-light">notes in {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
        </div>

        <div className="bg-white border-2 border-border rounded-[32px] p-6 shadow-[0_6px_0_0_#E5E5E5] flex flex-col justify-between liquid-glass grow transition-transform hover:-translate-y-1">
          <TrendingUp size={20} className="text-green mb-6 opacity-70" />
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-nav mb-2">Writing Rhythm</h4>
          <span className="text-4xl font-display text-gray-text block mb-1">{stats.daysCheckedIn}</span>
          <p className="text-[12px] font-medium text-gray-light">unique days checked in</p>
        </div>

        <div className="bg-white border-2 border-border rounded-[32px] p-6 shadow-[0_6px_0_0_#E5E5E5] flex flex-col justify-between liquid-glass grow transition-transform hover:-translate-y-1">
          <Heart size={20} className="text-purple-500 mb-6 opacity-70" />
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-nav mb-2">Prevalent Mood</h4>
          <span className="text-4xl font-display text-gray-text block mb-1 capitalize truncate">{stats.topMood === 'undefined' ? '-' : stats.topMood}</span>
          <p className="text-[12px] font-medium text-gray-light">your most frequent feeling</p>
        </div>

        <div className="bg-white border-2 border-border rounded-[32px] p-6 shadow-[0_6px_0_0_#E5E5E5] flex flex-col justify-between liquid-glass grow transition-transform hover:-translate-y-1">
          <CheckSquare size={20} className="text-orange mb-6 opacity-70" />
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-nav mb-2">Action Momentum</h4>
          <span className="text-4xl font-display text-gray-text block mb-1">{stats.taskProgress}%</span>
          <p className="text-[12px] font-medium text-gray-light">{stats.completedTasks} of {stats.totalTasks} tasks finished</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {/* Soft Recharts Donut */}
        <div className="bg-white border-2 border-border rounded-[40px] p-8 shadow-[0_8px_0_0_#E5E5E5] liquid-glass flex flex-col items-center justify-center min-h-[300px] relative">
          <h3 className="absolute top-8 left-8 text-[14px] font-extrabold text-gray-text uppercase tracking-wider">The Mood Landscape</h3>
          {stats.moodData.length === 0 ? (
            <p className="text-[13px] text-gray-nav font-medium italic">Label some moods to see your landscape.</p>
          ) : (
            <div className="w-full h-[220px] mt-10">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.moodData}
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    cornerRadius={10}
                  >
                    {stats.moodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={MOOD_COLORS[entry.name] || '#94a3b8'} className="drop-shadow-sm" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {stats.topMood !== 'undefined' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-10">
                  <div className="text-center">
                    <span className="text-[28px] font-display text-gray-text block lowercase leading-none">{stats.topMood}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-nav">{stats.moodData[0].value} Entries</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mind Map / Tags Cloud */}
        <div className="bg-white border-2 border-border rounded-[40px] p-8 shadow-[0_8px_0_0_#E5E5E5] liquid-glass relative min-h-[300px] flex flex-col">
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

      {/* PREMIUM AI REFLECTION CONTAINER */}
      <div className="relative w-full overflow-hidden bg-white border-2 border-border rounded-[40px] shadow-[0_8px_0_0_#E5E5E5] liquid-glass p-8 md:p-12 mb-16 dark:bg-[#16181d] dark:border-white/10 dark:shadow-[0_8px_0_0_rgba(15,23,42,0.5)]">
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-blue/10 text-blue border-2 border-border/50 dark:bg-sky-400/10 dark:border-white/10 dark:text-sky-100">
              <Sparkles size={28} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-3xl font-display text-gray-text lowercase tracking-tight dark:text-slate-50">Deep Reflection</h2>
                {isPro ? (
                  <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
                    <Crown size={12} /> PRO
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-border bg-gray-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue dark:border-white/10 dark:bg-white/5 dark:text-sky-100">
                    <Sparkles size={12} /> 1 Free Reflection
                  </div>
                )}
              </div>
              <p className="mt-2 text-right text-[14px] font-medium leading-relaxed text-gray-light dark:text-slate-400">
                A calm, grounded reading of the patterns your notes are holding right now.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
          </div>
        </div>

        <div className="mb-0 p-0 rounded-[24px]">
          {reflectionText ? (
            <div className="mb-8 p-6 border-2 border-border bg-gray-50/50 dark:border-white/10 dark:bg-white/5 rounded-[24px]">
              <div
                className="prose prose-lg max-w-none text-gray-text leading-loose font-sans font-medium dark:prose-invert dark:text-slate-100"
                dangerouslySetInnerHTML={{ __html: reflectionText.replace(/\n\n/g, '<br/><br/>') }}
              />
            </div>
          ) : isPremiumLocked ? (
            <div className="mb-8 p-6 text-center py-10 border-2 border-border bg-gray-50/50 dark:border-white/10 dark:bg-white/5 rounded-[24px]">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-border bg-white text-gray-nav shadow-sm dark:border-white/10 dark:bg-white/6 dark:text-slate-300">
                <Lock size={18} />
              </div>
              <p className="text-[17px] font-display lowercase text-gray-text dark:text-slate-50">
                your first deep reflection has been used
              </p>
              <p className="mt-3 max-w-xl mx-auto text-[14px] font-medium leading-relaxed text-gray-light dark:text-slate-400">
                Upgrade to Pro to continuously map your emotional themes and patterns.
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex justify-center">
          {isPremiumLocked || (reflectionText && !isPro) ? (
            <Button
              variant={reflectionText && !isPro ? 'secondary' : 'primary'}
              size="lg"
              className="w-full sm:w-auto rounded-2xl border-2 border-border px-8 text-[14px] uppercase font-black"
              onClick={() => {/* Trigger Paywall */}}
            >
              <Crown size={18} className="mr-2" />
              {reflectionText && !isPro ? 'UNLOCK MORE REFLECTIONS' : 'UPGRADE TO PRO'}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto rounded-2xl border-2 border-border shadow-3d-gray px-8 text-[14px] uppercase font-black"
              onClick={handleGenerateReflection}
              isLoading={generating}
              disabled={!hasEnoughNotes}
            >
              {!hasEnoughNotes ? (
                <><MessageSquare size={18} className="mr-2" /> WRITE 3 NOTES TO UNLOCK</>
              ) : reflectionText && isPro ? (
                <><Sparkles size={18} className="mr-2" /> GENERATE REFLECTION</>
              ) : isFreeAvailable ? (
                <><Sparkles size={18} className="mr-2" /> GENERATE REFLECTION</>
              ) : (
                <><Sparkles size={18} className="mr-2" /> GENERATE REFLECTION</>
              )}
            </Button>
          )}
        </div>
      </div>

    </div>
  );
};
