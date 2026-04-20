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
import { motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { noteService } from '../../services/noteService';
import { DEFAULT_WELLNESS_PROMPTS } from '../../services/wellnessPrompts';
import { supabase } from '../../src/supabaseClient';
import { RoutePath } from '../../types';
import { Landing } from './Landing';
import { AmbientMusicButton } from '../../components/ui/AmbientMusicButton';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isFromSave = location.state?.fromSave;
  const { isAuthenticated, user } = useAuth();
  const [noteCount, setNoteCount] = useState<number | null>(null);
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

  const refreshPrompt = (e: React.MouseEvent) => {
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
  };

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
      <div className="relative min-h-screen bg-body" {...((showOnboarding ? { "aria-hidden": "true" } : {}) as any)}>
        
        {/* Cinematic Hero */}
        <section className="relative w-full h-[60vh] min-h-[500px] overflow-hidden">
          <video
            src="/assets/videos/user_hero.mp4"
            autoPlay loop muted playsInline
            className="absolute inset-0 w-full h-full object-cover object-center z-0 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-body via-body/40 to-transparent z-10" />
          
          <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: entranceDuration, ease: [0.32, 0.72, 0, 1] }}
              className="max-w-4xl"
            >
              <h1 className="font-display tracking-tighter leading-none drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] mb-12" style={{ color: '#ffffff', fontSize: 'clamp(40px, 7vw, 92px)' }}>
                Welcome back, <br />
                <span className="font-serif italic drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)]" style={{ color: '#16a34a' }}>{user?.name?.split(' ')[0] || 'Reflector'}</span>
              </h1>
            </motion.div>
          </div>
        </section>

        {/* Interlocking Bento Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 border-t-2 border-border">
          
          {/* Panel 1: Stats & Overview */}
          <div className="lg:col-span-7 p-6 sm:p-12 border-b-2 lg:border-b-0 lg:border-r-2 border-border">
            <div className="panel-label mb-10">Sanctuary Overview</div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                onClick={() => navigate(RoutePath.NOTES)}
                className="bezel-outer group cursor-pointer"
              >
                <div className="bezel-inner p-8 flex flex-col justify-between min-h-[240px]">
                  <div className="flex justify-between items-start">
                    <div className="w-14 h-14 rounded-2xl bg-blue/5 text-blue flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                      <FolderOpen size={32} weight="duotone" />
                    </div>
                    <CaretRight size={20} weight="bold" className="text-gray-nav opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-black uppercase tracking-widest text-gray-nav mb-2">Total reflections</h3>
                    <div className="flex items-baseline gap-3">
                      <span className="text-[48px] font-display text-gray-text leading-none">
                        {isCountLoading ? '...' : noteCount ?? '0'}
                      </span>
                      <span className="text-[12px] font-bold text-green">Cloud Active</span>
                    </div>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => navigate(RoutePath.INSIGHTS)}
                className="bezel-outer group cursor-pointer"
              >
                <div className="bezel-inner p-8 flex flex-col justify-between min-h-[240px]">
                  <div className="flex justify-between items-start">
                    <div className="w-14 h-14 rounded-2xl bg-green/5 text-green flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                      <Brain size={32} weight="duotone" />
                    </div>
                    <CaretRight size={20} weight="bold" className="text-gray-nav opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-black uppercase tracking-widest text-gray-nav mb-2">Patterns</h3>
                    <p className="text-[15px] font-medium text-gray-light leading-snug">AI Librarian is analyzing your growth.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 2: Daily Prompt */}
          <div className="lg:col-span-5 p-6 sm:p-12 flex flex-col justify-center">
            <div className="panel-label mb-10">Daily Mindfulness</div>
            
            <div className="bezel-outer group h-full">
              <div className="bezel-inner p-10 flex flex-col gap-8 h-full">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue/5 text-blue flex items-center justify-center">
                      <Target size={24} weight="bold" />
                    </div>
                    <span className="text-[13px] font-black uppercase tracking-widest text-gray-nav">Today's Focus</span>
                  </div>
                  <button 
                    onClick={refreshPrompt}
                    className={`w-10 h-10 rounded-xl border border-border flex items-center justify-center text-gray-nav hover:text-blue hover:border-blue/30 transition-all ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}
                  >
                    <ArrowsClockwise size={20} className={isRefreshing ? 'animate-spin' : ''} />
                  </button>
                </div>

                <div className="flex-grow flex items-center">
                  <p 
                    className="text-[22px] sm:text-[26px] text-gray-text font-serif italic leading-relaxed"
                    style={{ opacity: isRefreshing ? 0 : 1, transition: 'opacity 0.3s ease' }}
                  >
                    "{dailyPrompt}"
                  </p>
                </div>

                <Button
                  variant="primary"
                  className="w-full h-14 rounded-2xl text-[16px] font-bold liquid-glass"
                  onClick={() => handleCreateClick(dailyPrompt)}
                >
                  Start writing
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
                <h2 className="text-[36px] font-display tracking-tight text-gray-text leading-none">Your Sanctuary.</h2>
                <div className="w-12 h-12 rounded-full bg-green/10 text-green flex items-center justify-center">
                  <Sparkle size={28} weight="fill" />
                </div>
              </div>

              <div className="space-y-8">
                {[
                  { icon: Brain, title: "AI Reflection", desc: "Compassionate mirrors for your thoughts.", color: "text-green" },
                  { icon: Smiley, title: "Mood Tracking", desc: "Understand your emotional rhythms.", color: "text-blue" },
                  { icon: Tag, title: "Smart Organization", desc: "Find clarity in the chaos.", color: "text-purple-500" }
                ].map((f, i) => (
                  <div key={i} className="flex gap-6">
                    <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-border flex items-center justify-center shrink-0 ${f.color}`}>
                      <f.icon size={24} weight="bold" />
                    </div>
                    <div>
                      <h4 className="text-[16px] font-bold text-gray-text mb-1">{f.title}</h4>
                      <p className="text-[14px] font-medium text-gray-light leading-relaxed">{f.desc}</p>
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
