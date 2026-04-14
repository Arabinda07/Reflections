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

      const prompt = `You are a deeply empathetic and intuitive journaling assistant. Provide a beautifully written, profound 2-3 paragraph reflection for this user based on their recent entries. Connect their themes, validate their emotions, and point out subtle areas of growth. Tone: Gentle, empowering, sanctuary-like. Do not summarize linearly; synthesize meaning.

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
    } catch (error) {
      console.error("AI deep reflection failed:", error);
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
      <div className={`relative w-full overflow-hidden rounded-[40px] border transition-all duration-700 ${
        isPro
          ? 'border-sky-200 bg-[linear-gradient(180deg,rgba(242,249,255,0.98),rgba(255,255,255,0.98))] shadow-[0_12px_40px_-28px_rgba(14,165,233,0.45)] dark:border-sky-400/20 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(8,12,20,0.98))] dark:shadow-[0_16px_48px_-30px_rgba(2,132,199,0.28)]'
          : 'border-sky-100 bg-[linear-gradient(180deg,rgba(247,251,255,0.98),rgba(255,255,255,0.98))] shadow-[0_12px_40px_-30px_rgba(14,165,233,0.35)] dark:border-sky-400/15 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(10,14,24,0.98))] dark:shadow-[0_16px_48px_-30px_rgba(2,132,199,0.22)]'
      }`}>
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.2),transparent_55%)] pointer-events-none dark:bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.2),transparent_60%)]" />
        <div className="absolute -bottom-12 left-0 h-32 w-32 rounded-full bg-emerald-100/40 blur-3xl pointer-events-none dark:bg-emerald-300/10" />

        <div className="relative z-10 p-6 sm:p-8 md:p-10 lg:p-12">
          <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] border border-sky-100 bg-white text-blue shadow-[0_3px_0_0_rgba(226,232,240,0.9)] dark:border-sky-400/20 dark:bg-white/8 dark:text-sky-100 dark:shadow-[0_3px_0_0_rgba(15,23,42,0.45)]">
                <Sparkles size={28} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-3xl font-display text-gray-text lowercase tracking-tight dark:text-slate-50">AI Deep Reflection</h2>
                  {isPro ? (
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-amber-600 shadow-sm dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">
                      <Crown size={12} /> PRO
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-sky-100 bg-white/80 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue shadow-sm dark:border-sky-400/20 dark:bg-white/6 dark:text-sky-100">
                      <Sparkles size={12} /> 1 Free Reflection
                    </div>
                  )}
                </div>
                <p className="mt-2 max-w-2xl text-[14px] font-medium leading-relaxed text-gray-light dark:text-slate-400">
                  A calm, compassionate reading of the patterns your notes are holding right now, designed to feel readable instead of overwhelming.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="rounded-full border border-border bg-white/75 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-gray-nav dark:border-white/10 dark:bg-white/6 dark:text-slate-300">
                {notes.length} notes in context
              </div>
              <div className="rounded-full border border-border bg-white/75 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-gray-nav dark:border-white/10 dark:bg-white/6 dark:text-slate-300">
                {reflectionText ? 'Latest reflection ready' : isPremiumLocked ? 'Upgrade for more' : 'Ready when you are'}
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_320px]">
            <div className="rounded-[30px] border border-white/70 bg-white/78 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl dark:border-white/10 dark:bg-white/6 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-7">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-nav dark:text-slate-300">Reading Panel</p>
                  <h3 className="mt-1 text-[18px] font-display lowercase text-gray-text dark:text-slate-50">
                    {reflectionText ? 'what your recent notes are saying' : isPremiumLocked ? 'your next reflection is waiting' : 'what this reflection will help you notice'}
                  </h3>
                </div>
                {reflectionText && (
                  <span className="rounded-full border border-sky-100 bg-sky-50/90 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/12 dark:text-sky-100">
                    Calm Scroll
                  </span>
                )}
              </div>

              {reflectionText ? (
                <div
                  className="wellness-scroll max-h-[360px] overflow-y-auto pr-2 prose prose-lg max-w-none text-gray-text leading-loose font-sans font-medium dark:prose-invert dark:text-slate-100"
                  dangerouslySetInnerHTML={{ __html: reflectionText.replace(/\n\n/g, '<br/><br/>') }}
                />
              ) : isPremiumLocked ? (
                <div className="flex min-h-[260px] flex-col justify-between rounded-[24px] border border-white/70 bg-white/65 p-5 dark:border-white/10 dark:bg-white/5">
                  <div>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-white text-gray-nav shadow-sm dark:border-white/10 dark:bg-white/6 dark:text-slate-300">
                      <Lock size={18} />
                    </div>
                    <p className="text-[17px] font-display lowercase text-gray-text dark:text-slate-50">
                      your first deep reflection has been used
                    </p>
                    <p className="mt-3 max-w-xl text-[14px] font-medium leading-relaxed text-gray-light dark:text-slate-400">
                      Pro keeps this space open for ongoing pattern reads, emotional themes, and gentler synthesis as your journal grows.
                    </p>
                  </div>
                  <div className="grid gap-3 pt-5 sm:grid-cols-2">
                    <div className="rounded-[20px] border border-sky-100 bg-sky-50/70 p-4 dark:border-sky-400/15 dark:bg-sky-400/10">
                      <p className="text-[11px] font-black uppercase tracking-widest text-sky-700 dark:text-sky-100">Continued synthesis</p>
                      <p className="mt-2 text-[13px] font-medium leading-relaxed text-gray-text dark:text-slate-200">Notice recurring moods and life themes without reading through every note again.</p>
                    </div>
                    <div className="rounded-[20px] border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-400/15 dark:bg-emerald-400/10">
                      <p className="text-[11px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-100">Quieter guidance</p>
                      <p className="mt-2 text-[13px] font-medium leading-relaxed text-gray-text dark:text-slate-200">Keep the reflection space available whenever you want a calmer read on what is shifting.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[260px] flex-col justify-between rounded-[24px] border border-white/70 bg-white/65 p-5 dark:border-white/10 dark:bg-white/5">
                  <div>
                    <p className="text-[17px] font-display lowercase text-gray-text dark:text-slate-50">
                      a gentler read, not a wall of text
                    </p>
                    <p className="mt-3 max-w-xl text-[14px] font-medium leading-relaxed text-gray-light dark:text-slate-400">
                      This reflection looks across your recent entries and surfaces the emotional patterns, themes, and tensions that deserve a calmer second look.
                    </p>
                  </div>
                  <div className="grid gap-3 pt-5">
                    <div className="rounded-[20px] border border-white/80 bg-white/82 p-4 dark:border-white/10 dark:bg-white/6">
                      <p className="text-[11px] font-black uppercase tracking-widest text-gray-nav dark:text-slate-300">It can highlight</p>
                      <p className="mt-2 text-[13px] font-medium leading-relaxed text-gray-text dark:text-slate-200">Repeated emotions, recurring situations, and the places where your writing is asking for more attention.</p>
                    </div>
                    <div className="rounded-[20px] border border-white/80 bg-white/82 p-4 dark:border-white/10 dark:bg-white/6">
                      <p className="text-[11px] font-black uppercase tracking-widest text-gray-nav dark:text-slate-300">It stays useful</p>
                      <p className="mt-2 text-[13px] font-medium leading-relaxed text-gray-text dark:text-slate-200">The layout keeps the reading area separate from actions, so the reflection stays readable even when it gets longer.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-[30px] border border-white/70 bg-white/78 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-xl dark:border-white/10 dark:bg-white/6 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-nav dark:text-slate-300">Action Area</p>
                <h3 className="mt-2 text-[20px] font-display lowercase text-gray-text dark:text-slate-50">
                  {isPremiumLocked ? 'keep this space open' : reflectionText ? 'refresh the perspective when you need it' : 'generate a deeper read'}
                </h3>
                <p className="mt-3 text-[14px] font-medium leading-relaxed text-gray-light dark:text-slate-400">
                  {isPremiumLocked
                    ? 'You can still use the monthly insights above, or unlock continuous deep reflections with Pro.'
                    : reflectionText
                      ? isPro
                        ? 'Generate another reflection anytime. The current one stays readable in the panel beside it.'
                        : 'Your free reflection is ready. You can keep reading it here, and Pro unlocks ongoing reflections later.'
                      : hasEnoughNotes
                        ? 'You have enough entries for a thoughtful reflection now.'
                        : 'Write at least three notes so the reflection has enough material to say something useful.'}
                </p>

                <div className="mt-5">
                  {isPremiumLocked || (reflectionText && !isPro) ? (
                    <Button
                      variant={reflectionText && !isPro ? 'secondary' : 'primary'}
                      size="lg"
                      className={`w-full rounded-2xl border px-6 text-[14px] ${
                        reflectionText && !isPro
                          ? 'border-sky-100 bg-white text-blue shadow-[0_4px_0_0_rgba(226,232,240,0.95)] dark:border-sky-400/20 dark:bg-white/8 dark:text-sky-100 dark:shadow-[0_4px_0_0_rgba(15,23,42,0.45)]'
                          : 'border-sky-100 shadow-[0_4px_0_0_rgba(226,232,240,0.95)] dark:border-sky-400/20 dark:shadow-[0_4px_0_0_rgba(15,23,42,0.45)]'
                      }`}
                      onClick={() => {/* Trigger Paywall */}}
                    >
                      <Crown size={18} className="mr-2" />
                      {reflectionText && !isPro ? 'UNLOCK MORE REFLECTIONS' : 'UPGRADE TO PRO'}
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full rounded-2xl border border-sky-100 px-6 text-[14px] shadow-[0_4px_0_0_rgba(226,232,240,0.95)] dark:border-sky-400/20 dark:shadow-[0_4px_0_0_rgba(15,23,42,0.45)]"
                      onClick={handleGenerateReflection}
                      isLoading={generating}
                      disabled={!hasEnoughNotes}
                    >
                      {!hasEnoughNotes ? (
                        <><MessageSquare size={18} className="mr-2" /> WRITE 3 NOTES TO UNLOCK</>
                      ) : reflectionText && isPro ? (
                        <><Sparkles size={18} className="mr-2" /> GENERATE NEW REFLECTION</>
                      ) : isFreeAvailable ? (
                        <><Sparkles size={18} className="mr-2" /> GENERATE REFLECTION (1 FREE)</>
                      ) : (
                        <><Sparkles size={18} className="mr-2" /> GENERATE NEW REFLECTION</>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/70 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-nav dark:text-slate-300">What Changes</p>
                <div className="mt-3 space-y-3 text-[13px] font-medium leading-relaxed text-gray-text dark:text-slate-200">
                  <p>The reading panel stays separate from the CTA so the text never gets obstructed.</p>
                  <p>Long reflections scroll inside the card instead of stretching the whole page.</p>
                  <p>Dark mode keeps contrast on the card shell, inner panel, and action area.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
