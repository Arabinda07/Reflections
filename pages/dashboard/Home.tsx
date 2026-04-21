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

  const entranceDuration = isFromSave ? 0.3 : 0.8;

  useEffect(() => {
    setDailyPrompt(DEFAULT_WELLNESS_PROMPTS[Math.floor(Math.random() * DEFAULT_WELLNESS_PROMPTS.length)]);
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
        
        {/* Cinematic Hero */}
        <section className="relative w-full h-[65dvh] min-h-[480px] overflow-hidden">
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
          
          <div className="relative z-20 h-full flex flex-col items-center justify-start pt-[18vh] text-center px-6">
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

        {/* Premium Utilitarian Bento Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 border-t border-border bg-white dark:bg-transparent">
          
          {/* Overview Panel */}
          <div className="lg:col-span-8 p-10 sm:p-20 border-b lg:border-b-0 lg:border-r border-border flex flex-col justify-between min-h-[500px]">
            <div>
              <div className="flex items-center gap-3 mb-16">
                <span className="text-[11px] font-black tracking-[0.2em] uppercase text-gray-nav/60">Overview</span>
                <div className="h-px flex-1 bg-border/50" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24">
                <button 
                  onClick={() => navigate(RoutePath.NOTES)}
                  className="group flex flex-col items-start gap-8 transition-all"
                >
                  <div className="flex items-center gap-3 px-3 py-1 rounded-lg bg-green/5 border border-green/10 text-green">
                    <FolderOpen size={18} weight="bold" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Sanctuary Volume</span>
                  </div>
                  <div className="flex items-baseline gap-6">
                    <h2 className="text-7xl md:text-8xl font-display text-gray-text tracking-tighter transition-colors group-hover:text-green">
                      {isCountLoading ? '...' : displayCount}
                    </h2>
                    <div className="w-10 h-10 rounded-xl border border-border flex items-center justify-center group-hover:border-green group-hover:text-green transition-all duration-500">
                      <ArrowRight size={20} weight="bold" />
                    </div>
                  </div>
                  <p className="text-[13px] font-bold text-gray-nav uppercase tracking-tight opacity-40">Reflections written in total</p>
                </button>

                <button 
                  onClick={() => navigate(RoutePath.INSIGHTS)}
                  className="group flex flex-col items-start gap-8 transition-all"
                >
                  <div className="flex items-center gap-3 px-3 py-1 rounded-lg bg-blue/5 border border-blue/10 text-blue">
                    <Brain size={18} weight="bold" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Growth Patterns</span>
                  </div>
                  <p className="text-2xl md:text-3xl font-serif italic text-gray-light leading-snug group-hover:text-gray-text transition-colors">
                    The Librarian is currently observing your mental rhythms.
                  </p>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-gray-nav group-hover:text-blue transition-colors">
                    <span>View Analysis</span>
                    <CaretRight size={12} weight="bold" />
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Daily Reflection Panel */}
          <div className="lg:col-span-4 p-10 sm:p-20 bg-panel-bg flex flex-col justify-between min-h-[500px]">
            <div className="space-y-16">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black tracking-[0.2em] uppercase text-gray-nav/60">Mindfulness Focus</span>
                <button 
                  onClick={refreshPrompt}
                  className={`p-2 rounded-xl hover:bg-white/50 transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
                  title="New Focus"
                >
                  <ArrowsClockwise size={20} weight="bold" className="text-gray-nav" />
                </button>
              </div>

              <div className="space-y-8">
                <div className="w-14 h-14 rounded-2xl bg-white border border-border flex items-center justify-center shadow-sm text-green">
                  <Target size={28} weight="bold" />
                </div>
                <p 
                  className="text-2xl md:text-[28px] text-gray-text font-serif italic leading-relaxed"
                  style={{ opacity: isRefreshing ? 0 : 1, transition: 'opacity 0.4s cubic-bezier(0.32, 0.72, 0, 1)' }}
                >
                  "{dailyPrompt}"
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              className="mt-12 w-full h-16 rounded-2xl text-[16px] font-bold bg-gray-text text-white hover:bg-black transition-all shadow-none"
              onClick={() => handleCreateClick(dailyPrompt)}
            >
              Log Reflection
              <Plus size={18} weight="bold" className="ml-3" />
            </Button>
          </div>
        </section>

      </div>

      {/* Distilled Onboarding */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-body/80 backdrop-blur-xl animate-in fade-in duration-700">
          <div className="bezel-outer max-w-lg w-full border border-border bg-white shadow-2xl">
            <div className="bezel-inner p-12 flex flex-col gap-12">
              <div className="flex items-center justify-between border-b border-border pb-8">
                <h2 className="text-3xl font-display text-gray-text">Welcome.</h2>
                <Sparkle size={32} className="text-green" weight="fill" />
              </div>

              <div className="space-y-10">
                {[
                  { icon: Brain, title: "Reflective Synthesis", desc: "AI-driven analysis of your personal growth." },
                  { icon: Smiley, title: "Emotional Baseline", desc: "Track your moods over extended periods." },
                  { icon: Tag, title: "Semantic Links", desc: "Smart tagging for discovery of patterns." }
                ].map((f, i) => (
                  <div key={i} className="flex gap-6 items-start">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 border border-border flex items-center justify-center shrink-0">
                      <f.icon size={20} weight="bold" className="text-gray-nav" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[15px] font-bold text-gray-text">{f.title}</h4>
                      <p className="text-[13px] text-gray-light leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                variant="primary"
                className="w-full h-16 rounded-2xl text-[16px] font-bold bg-gray-text text-white hover:bg-black shadow-none"
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
