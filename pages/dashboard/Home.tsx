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
      <div className="relative min-h-full flex flex-col flex-1 bg-body" {...((showOnboarding ? { "aria-hidden": "true" } : {}) as any)}>
        
        {/* Cinematic Hero */}
        <section className="relative w-full h-[70dvh] min-h-[500px] overflow-hidden">
          <motion.video
            initial={{ scale: 1.1, filter: 'blur(10px) brightness(0.8)' }}
            animate={{ scale: 1.0, filter: 'blur(0px) brightness(1)' }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            src="/assets/videos/field.mp4"
            poster="/assets/videos/field.png"
            autoPlay loop muted playsInline preload="metadata"
            className="absolute inset-0 w-full h-full object-cover object-center z-0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-body via-body/20 to-transparent z-10" />
          
          <div className="relative z-20 h-full flex flex-col items-center justify-start pt-[15vh] text-center px-6">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: entranceDuration + 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-4xl"
            >
              <h1 className="h1-hero drop-shadow-[0_8px_32px_rgba(0,0,0,0.3)] mb-12" style={{ color: '#FFFFFF' }}>
                Welcome back, <br />
                <span className="font-serif italic text-green drop-shadow-none">{user?.name?.split(' ')[0] || 'Reflector'}</span>
              </h1>
            </motion.div>
          </div>
        </section>

        {/* Interlocking Bento Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 border-t border-border">
          
          {/* Panel 1: Stats & Overview (Asymmetrical 8/4 split base) */}
          <div className="lg:col-span-8 p-8 sm:p-16 border-b lg:border-b-0 lg:border-r border-border">
            <div className="label-caps mb-16 opacity-50">Sanctuary Overview</div>
            
            <div className="flex flex-col gap-16">
              <button 
                onClick={() => navigate(RoutePath.NOTES)}
                className="group w-full text-left transition-all duration-700 flex flex-col md:flex-row items-start md:items-end justify-between gap-8"
              >
                <div>
                  <span className="text-[14px] font-medium text-gray-nav flex items-center gap-3 mb-4">
                    <FolderOpen size={20} className="text-green" weight="light" />
                    Reflections written
                  </span>
                  <h2 className="text-7xl md:text-8xl font-display text-gray-text leading-none tracking-tight group-hover:text-green transition-colors duration-500">
                    {isCountLoading ? '...' : displayCount}
                  </h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green/10 text-green text-[10px] font-black uppercase tracking-widest">
                    <div className="w-1 h-1 rounded-full bg-green animate-pulse" />
                    Syncing
                  </div>
                  <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center group-hover:bg-green group-hover:text-white group-hover:border-green transition-all duration-500">
                    <CaretRight size={20} weight="light" />
                  </div>
                </div>
              </button>

              <div className="h-[1px] w-full bg-border opacity-50" />

              <button 
                onClick={() => navigate(RoutePath.INSIGHTS)}
                className="group w-full text-left transition-all duration-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-8"
              >
                <div>
                  <span className="text-[14px] font-medium text-gray-nav flex items-center gap-3 mb-4">
                    <Brain size={20} className="text-green" weight="light" />
                    Patterns discovered
                  </span>
                  <p className="text-2xl md:text-3xl font-serif italic text-gray-light max-w-sm leading-snug group-hover:text-gray-text transition-colors duration-500">
                    AI Librarian is analyzing your growth.
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center group-hover:bg-green group-hover:text-white group-hover:border-green transition-all duration-500 shrink-0">
                  <CaretRight size={20} weight="light" />
                </div>
              </button>
            </div>
          </div>

          {/* Panel 2: Daily Prompt (Narrower Span) */}
          <div className="lg:col-span-4 p-8 sm:p-16 flex flex-col justify-center bg-green/[0.02]">
            <div className="label-caps mb-16">Daily Mindfulness</div>
            
            <div className="h-full">
              <div className="flex flex-col gap-10 h-full">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-green/5 text-green flex items-center justify-center">
                      <Target size={28} weight="light" />
                    </div>
                    <span className="text-[12px] font-black uppercase tracking-[0.2em] text-gray-nav/50">Today's Focus</span>
                  </div>
                  <button 
                    onClick={refreshPrompt}
                    className={`w-12 h-12 rounded-2xl border border-border flex items-center justify-center text-gray-nav hover:text-green hover:border-green/30 transition-all duration-500 ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}
                  >
                    <ArrowsClockwise size={20} className={isRefreshing ? 'animate-spin' : ''} weight="light" />
                  </button>
                </div>

                <div className="flex-grow flex items-center">
                  <p 
                    className="text-[20px] sm:text-[24px] text-gray-text font-serif italic leading-relaxed"
                    style={{ opacity: isRefreshing ? 0 : 1, transition: 'opacity 0.5s ease' }}
                  >
                    "{dailyPrompt}"
                  </p>
                </div>

                <Button
                  variant="primary"
                  className="group w-full h-16 rounded-[24px] text-[18px] font-black flex items-center justify-center gap-4 pl-10 pr-2 shadow-xl shadow-green/20"
                  onClick={() => handleCreateClick(dailyPrompt)}
                >
                  Start writing
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center transition-transform duration-700 group-hover:translate-x-1 group-hover:bg-white/30">
                    <ArrowRight size={20} weight="light" />
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Onboarding Modal Refactor */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-body/80 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bezel-outer max-w-xl w-full">
            <div className="bezel-inner p-10 flex flex-col gap-10">
              <div className="flex justify-between items-start">
                <h2 className="h2-section">Your Sanctuary.</h2>
                <div className="w-12 h-12 rounded-full bg-green/10 text-green flex items-center justify-center">
                  <Sparkle size={28} weight="light" />
                </div>
              </div>

              <div className="space-y-8">
                {[
                  { icon: Brain, title: "AI Reflection", desc: "Compassionate mirrors for your thoughts.", color: "text-green" },
                  { icon: Smiley, title: "Mood Tracking", desc: "Understand your emotional rhythms.", color: "text-green" },
                  { icon: Tag, title: "Smart Organization", desc: "Find clarity in the chaos.", color: "text-green" }
                ].map((f, i) => (
                  <div key={i} className="flex gap-6">
                    <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-border flex items-center justify-center shrink-0 ${f.color}`}>
                      <f.icon size={24} weight="light" />
                    </div>
                    <div>
                      <h4 className="text-[16px] font-bold text-gray-text mb-1">{f.title}</h4>
                      <p className="body-standard text-gray-light">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                variant="primary"
                className="w-full h-16 rounded-2xl text-[18px] font-bold"
                onClick={handleCloseOnboarding}
              >
                Let's begin
              </Button>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: 'fixed', bottom: '24px', right: '20px', zIndex: 8000 }}>
        <AmbientMusicButton />
      </div>
    </>
  );
};
