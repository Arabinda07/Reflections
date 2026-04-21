import { 
  ArrowRight, 
  Brain, 
  FolderOpen, 
  Plus, 
  ArrowsClockwise, 
  Smiley, 
  Sparkle, 
  Tag, 
  Target, 
  UserPlus, 
  CaretRight 
} from '@phosphor-icons/react';
import { motion, animate } from 'motion/react';
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { noteService } from '../../services/noteService';
import { DEFAULT_WELLNESS_PROMPTS } from '../../services/wellnessPrompts';
import { supabase } from '../../src/supabaseClient';
import { RoutePath } from '../../types';
import { Landing } from './Landing';
import { AmbientMusicButton } from '../../components/ui/AmbientMusicButton';
import { Magnetic } from '../../components/ui/Magnetic';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isFromSave = location.state?.fromSave;
  const { isAuthenticated, user } = useAuth();
  const [noteCount, setNoteCount] = useState<number | null>(null);
  const [displayCount, setDisplayCount] = useState<number | string>('...');
  const [isCountLoading, setIsCountLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [dailyPrompt, setDailyPrompt] = useState(DEFAULT_WELLNESS_PROMPTS[0]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [quote, setQuote] = useState({ text: "", author: "" });

  const entranceDuration = isFromSave ? 0.3 : 0.8;

  const WISDOM_QUOTES = [
    { text: "The soul usually knows what to do to heal itself. The challenge is to silence the mind.", author: "Caroline Myss" },
    { text: "Within you, there is a stillness and a sanctuary to which you can retreat at any time.", author: "Hermann Hesse" },
    { text: "Your vision will become clear only when you can look into your own heart.", author: "Carl Jung" },
    { text: "The wound is the place where the Light enters you.", author: "Rumi" },
    { text: "Quiet the mind, and the soul will speak.", author: "Ma Jaya Sati Bhagavati" },
    { text: "Everything in the universe is within you. Ask all from yourself.", author: "Rumi" }
  ];

  useEffect(() => {
    setDailyPrompt(DEFAULT_WELLNESS_PROMPTS[Math.floor(Math.random() * DEFAULT_WELLNESS_PROMPTS.length)]);
    setQuote(WISDOM_QUOTES[Math.floor(Math.random() * WISDOM_QUOTES.length)]);
    const hasSeen = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeen) setShowOnboarding(true);
  }, []);

  const refreshPrompt = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRefreshing) return;
    setIsRefreshing(true);
    let next;
    do {
      next = DEFAULT_WELLNESS_PROMPTS[Math.floor(Math.random() * DEFAULT_WELLNESS_PROMPTS.length)];
    } while (next === dailyPrompt);
    setTimeout(() => {
      setDailyPrompt(next);
      setIsRefreshing(false);
    }, 600);
  }, [dailyPrompt, isRefreshing]);

  useEffect(() => {
    if (noteCount !== null && typeof noteCount === 'number') {
      const controls = animate(0, noteCount, {
        duration: 2,
        ease: [0.16, 1, 0.3, 1],
        onUpdate(value) {
          setDisplayCount(Math.round(value));
        }
      });
      return () => controls.stop();
    }
  }, [noteCount]);

  const handleCloseOnboarding = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
  };

  useEffect(() => {
    const fetchCount = async () => {
      if (user) {
        setIsCountLoading(true);
        try {
          const count = await noteService.getCount();
          setNoteCount(count);
        } catch (error) {
          setNoteCount(0);
        } finally {
          setIsCountLoading(false);
        }
      }
    };
    fetchCount();
    const channel = supabase.channel('note-count-updates').on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => fetchCount()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleCreateClick = (promptOrEvent?: string | React.MouseEvent) => {
    if (!isAuthenticated) return navigate(RoutePath.LOGIN);
    if (typeof promptOrEvent === 'string') {
      navigate(RoutePath.CREATE_NOTE, { state: { initialPrompt: promptOrEvent } });
    } else {
      navigate(RoutePath.CREATE_NOTE);
    }
  };

  if (!isAuthenticated) return <Landing />;

  return (
    <>
      <div className="relative min-h-full flex flex-col flex-1 bg-body selection:bg-green/10" {...((showOnboarding ? { "aria-hidden": "true" } : {}) as any)}>
        
        {/* Hero Section - Preserved */}
        <section className="relative w-full h-[60dvh] min-h-[450px] overflow-hidden">
          <motion.video
            initial={{ scale: 1.05, filter: 'blur(10px) brightness(0.8)' }}
            animate={{ scale: 1, filter: 'blur(0px) brightness(1)' }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            src="/assets/videos/field.mp4"
            poster="/assets/videos/field.png"
            autoPlay loop muted playsInline preload="metadata"
            className="absolute inset-0 w-full h-full object-cover object-center z-0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-body via-transparent to-transparent z-10" />
          
          <div className="relative z-20 h-full flex flex-col items-center justify-start pt-[15vh] text-center px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: entranceDuration, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-4xl"
            >
              <h1 className="h1-hero drop-shadow-[0_8px_32px_rgba(0,0,0,0.3)] mb-12" style={{ color: '#FFFFFF' }}>
                Welcome back, <br />
                <span className="font-serif italic text-green drop-shadow-none">{user?.name?.split(' ')[0] || 'Reflector'}</span>
              </h1>
            </motion.div>
          </div>
        </section>

        {/* Balanced 3-Panel Bento Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 border-t border-border bg-white dark:bg-transparent min-h-[500px]">
          
          {/* Panel 1: Overview */}
          <div className="p-10 sm:p-16 border-b lg:border-b-0 lg:border-r border-border flex flex-col justify-between h-full bg-white/50">
            <div>
              <div className="flex items-center gap-2 text-gray-nav mb-12">
                <FolderOpen size={18} weight="bold" className="text-green" />
                <span className="text-[11px] font-black uppercase tracking-widest opacity-60">Sanctuary Overview</span>
              </div>
              
              <button 
                onClick={() => navigate(RoutePath.NOTES)}
                className="group flex flex-col items-start gap-4 mb-16 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
                aria-label="View all reflections"
              >
                <h2 className="text-5xl md:text-7xl font-display text-gray-text group-hover:text-green transition-colors tracking-tighter">
                  {isCountLoading ? '...' : displayCount}
                </h2>
                <p className="text-[13px] font-bold text-gray-nav uppercase tracking-tight">Reflections Archived</p>
              </button>
            </div>

            <button 
              onClick={() => navigate(RoutePath.INSIGHTS)}
              className="group flex flex-col items-start gap-5 p-8 rounded-3xl bg-panel-bg border border-border hover:border-green/30 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 text-left"
              aria-label="View AI insights"
            >
              <div className="flex items-center gap-2 text-gray-nav mb-2">
                <Brain size={16} weight="bold" className="text-green" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Librarian's Note</span>
              </div>
              <p className="text-xl md:text-2xl font-serif italic text-gray-light group-hover:text-gray-text transition-colors leading-relaxed">
                Analysis is ongoing as your narrative evolves.
              </p>
            </button>
          </div>

          {/* Panel 2: Daily Wisdom (Quote) */}
          <div className="p-10 sm:p-16 border-b lg:border-b-0 lg:border-r border-border flex flex-col justify-between bg-white h-full">
            <div className="flex-grow">
              <div className="flex items-center gap-2 text-gray-nav mb-12">
                <Sparkle size={18} weight="bold" className="text-orange" />
                <span className="text-[11px] font-black uppercase tracking-widest opacity-60">Daily Wisdom</span>
              </div>

              <div className="space-y-8 pr-4">
                <p className="text-2xl md:text-3xl font-serif italic text-gray-text leading-relaxed relative">
                  <span className="absolute -left-8 -top-6 text-7xl text-orange/10 font-serif pointer-events-none">"</span>
                  {quote.text}
                </p>
                <div className="flex items-center gap-4">
                  <div className="h-px w-8 bg-orange/20" />
                  <p className="text-[13px] font-bold text-gray-nav uppercase tracking-widest">{quote.author}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 3: Daily Focus (Action) */}
          <div className="p-10 sm:p-16 flex flex-col justify-between bg-panel-bg h-full">
            <div>
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-2 text-gray-nav">
                  <Target size={18} weight="bold" className="text-green" />
                  <span className="text-[11px] font-black uppercase tracking-widest opacity-60">Daily Focus</span>
                </div>
                <button 
                  onClick={refreshPrompt}
                  className={`p-2 text-gray-nav hover:text-green transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
                  aria-label="Refresh daily focus prompt"
                >
                  <ArrowsClockwise size={20} weight="bold" />
                </button>
              </div>

              <div className="space-y-6">
                <p 
                  className="text-2xl md:text-3xl text-gray-text font-serif italic leading-relaxed"
                  style={{ opacity: isRefreshing ? 0 : 1, transition: 'opacity 0.4s ease' }}
                >
                  "{dailyPrompt}"
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              className="mt-16 h-14 rounded-xl text-[15px] font-bold bg-green text-white hover:bg-green/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-green/20"
              onClick={() => handleCreateClick(dailyPrompt)}
              aria-label="Start a new reflection with this prompt"
            >
              Start Reflection
              <Plus size={18} weight="bold" className="ml-2" />
            </Button>
          </div>
        </section>

      </div>

      {/* Simplified Onboarding */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-body/80 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bezel-outer max-w-lg w-full bg-white shadow-2xl">
            <div className="bezel-inner p-10 flex flex-col gap-10">
              <div className="flex justify-between items-center border-b border-border pb-6">
                <h2 className="text-2xl font-display text-gray-text">Welcome to Sanctuary.</h2>
                <Sparkle size={24} className="text-green" weight="fill" />
              </div>

              <div className="space-y-6">
                {[
                  { icon: Brain, title: "AI Reflection", desc: "Compassionate mirrors for your thoughts." },
                  { icon: Smiley, title: "Mood Tracking", desc: "Understand your emotional rhythms." },
                  { icon: Tag, title: "Smart Organization", desc: "Find clarity in the chaos." }
                ].map((f, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 border border-border flex items-center justify-center shrink-0">
                      <f.icon size={18} weight="bold" className="text-gray-nav" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-gray-text">{f.title}</h4>
                      <p className="text-[13px] text-gray-light leading-normal">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                variant="primary"
                className="w-full h-14 rounded-xl text-[15px] font-bold bg-gray-text text-white"
                onClick={handleCloseOnboarding}
              >
                Enter Sanctuary
              </Button>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: 'fixed', bottom: 'calc(24px + env(safe-area-inset-bottom))', right: '20px', zIndex: 8000 }}>
        <AmbientMusicButton />
      </div>
    </>
  );
};
