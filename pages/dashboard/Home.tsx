import { ArrowRight, Brain, FolderOpen, PlusCircle, RefreshCw, Smile, Sparkles, Tag, Target, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { isAuthenticated, user } = useAuth();
  const [noteCount, setNoteCount] = useState<number | null>(null);
  const [isCountLoading, setIsCountLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [dailyPrompt, setDailyPrompt] = useState(DEFAULT_WELLNESS_PROMPTS[0]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Randomize initial prompt
    setDailyPrompt(DEFAULT_WELLNESS_PROMPTS[Math.floor(Math.random() * DEFAULT_WELLNESS_PROMPTS.length)]);
  }, []);

  const refreshPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRefreshing) return;

    setIsRefreshing(true);
    let next;
    do {
      next = DEFAULT_WELLNESS_PROMPTS[Math.floor(Math.random() * DEFAULT_WELLNESS_PROMPTS.length)];
    } while (next === dailyPrompt);

    // Artificial delay to make it feel like it's "refreshing"
    setTimeout(() => {
      setDailyPrompt(next);
      setIsRefreshing(false);
    }, 600);
  };

  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeen) {
      setShowOnboarding(true);
    }
  }, []);

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
          console.error('Failed to fetch note count:', error);
          setNoteCount(0);
        } finally {
          setIsCountLoading(false);
        }
      }
    };

    fetchCount();

    // Real-time subscription to update count automatically
    const channel = supabase
      .channel('note-count-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
        },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCreateClick = (promptOrEvent?: string | React.MouseEvent) => {
    if (isAuthenticated) {
      if (typeof promptOrEvent === 'string') {
        navigate(RoutePath.CREATE_NOTE, { state: { initialPrompt: promptOrEvent } });
      } else {
        navigate(RoutePath.CREATE_NOTE);
      }
    } else {
      navigate(RoutePath.LOGIN);
    }
  };

  const handleViewAllClick = () => {
    if (isAuthenticated) {
      navigate(RoutePath.NOTES);
    } else {
      navigate(RoutePath.LOGIN);
    }
  };

  if (!isAuthenticated) {
    return <Landing />;
  }

  return (
    <>
      <div className="animate-in fade-in duration-700" {...((showOnboarding ? { inert: "" } : {}) as any)}>
      {/* Hero Section - Cinematic Hero with 3D Float */}
      <section className="relative flex flex-col items-center justify-start pt-0 pb-16 sm:pb-24 px-6 sm:px-10 overflow-hidden border-b-2 border-border min-h-[400px] sm:min-h-[500px]">
        {/* Hero Video Background */}
        <video
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_045634_e1c98c76-1265-4f5c-882a-4276f2080894.mp4"
          autoPlay
          loop
          muted
          playsInline
          crossOrigin="anonymous"
          className="absolute inset-0 w-full h-full object-cover object-bottom z-0"
        />

        {/* Cinematic Overlay for Visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/40 to-transparent z-0"></div>

        {/* Floating Text Container */}
        <motion.div
          animate={{ y: [-5, 5, -5] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="relative z-10 flex flex-col gap-32 sm:gap-48 items-center text-center max-w-2xl w-full pt-[110px] sm:pt-[160px]"
        >
          <h1
            className="font-display text-[36px] sm:text-[52px] lg:text-[64px] lowercase tracking-tighter leading-none px-2"
            style={{ color: '#ffffff', textShadow: '0 4px 12px rgba(0,0,0,0.8)' }}
          >
            welcome back, {user?.name?.split(' ')[0] || 'learner'}
          </h1>
          <Button
            variant="primary"
            size="lg"
            className="h-[56px] sm:h-[64px] px-8 sm:px-12 text-[16px] sm:text-[18px] font-bold uppercase rounded-2xl shadow-sm active:scale-[0.98] transition-all duration-300 ease-out-quart liquid-glass group"
            onClick={() => handleCreateClick()}
          >
            <PlusCircle className="mr-3 group-hover:rotate-90 transition-transform duration-300" />
            New Entry
          </Button>
        </motion.div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 border-t-2 border-border">

        {/* Panel 1: Stats & Overview - Now Clickable */}
        <div className="p-6 sm:p-10 border-b-2 border-border lg:border-r-2 border-border">
          <div className="panel-label">Emotional Overview</div>
          <div className="flex flex-col gap-6">
            <div
              className="flex flex-col gap-6 bg-white border-2 border-border rounded-[32px] p-8 shadow-sm hover:shadow-none hover:scale-[1.02] transition-all duration-300 ease-out-quart liquid-glass cursor-pointer group"
              onClick={() => navigate(RoutePath.NOTES)}
            >
              <div className="flex items-center justify-between">
                <div className="h-14 w-14 rounded-2xl bg-blue/10 flex items-center justify-center text-blue shadow-sm group-hover:scale-110 transition-transform">
                  <FolderOpen size={28} />
                </div>
                <div className="flex items-center gap-2 text-[11px] font-black uppercase text-blue tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  View All <ArrowRight size={12} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-[16px] font-bold text-gray-nav uppercase tracking-wider">Total Reflections</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-[40px] font-display text-gray-text">
                    {isCountLoading ? '...' : noteCount ?? '0'}
                  </span>
                  <span className="text-[12px] font-extrabold text-green uppercase">Synced with Cloud</span>
                </div>
              </div>
            </div>

            <div
              className="flex flex-col gap-6 bg-white border-2 border-border rounded-[32px] p-8 shadow-sm hover:shadow-none hover:scale-[1.02] transition-all duration-300 ease-out-quart liquid-glass cursor-pointer group"
              onClick={() => navigate(RoutePath.INSIGHTS)}
            >
              <div className="flex items-center justify-between">
                <div className="h-14 w-14 rounded-2xl bg-green/10 flex items-center justify-center text-green shadow-sm group-hover:scale-110 transition-transform">
                  <Brain size={28} />
                </div>
                <div className="flex items-center gap-2 text-[11px] font-black uppercase text-green tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  Get Insights <ArrowRight size={12} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-[16px] font-bold text-gray-nav uppercase tracking-wider">Mental Health Insights</h3>
                <p className="text-[15px] text-gray-light font-medium leading-relaxed">AI is ready to analyze your patterns and provide compassionate feedback.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Daily Mindfulness */}
        <div className="p-6 sm:p-10 lg:border-l-2 border-border flex flex-col justify-center">
          <div className="panel-label">Daily Mindfulness</div>
          <div className="group relative overflow-hidden bg-white border-2 border-border rounded-[32px] p-8 shadow-sm liquid-glass flex flex-col gap-8">
            <div className="relative z-10 flex flex-col gap-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-blue/10 text-blue shadow-sm border-2 border-border/50">
                    <Target size={22} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="text-[16px] font-bold text-gray-nav uppercase tracking-wider">Today's Focus</h4>
                    <p className="text-[14px] text-gray-light font-medium">A small nudge for today</p>
                  </div>
                </div>
                <button
                  onClick={refreshPrompt}
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-white border-2 border-border text-gray-nav shadow-sm hover:text-blue hover:border-blue/30 transition-all duration-300 ease-out-quart ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}
                  title="Refresh Prompt"
                  disabled={isRefreshing}
                >
                  <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                </button>
              </div>

              <div className="rounded-[24px] border-2 border-border bg-gray-50/50 p-6">
                <p className="text-[18px] font-medium leading-relaxed text-gray-text sm:text-[20px]">
                  "{dailyPrompt}"
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full border-2 border-border bg-white text-blue font-extrabold uppercase shadow-sm sm:w-auto"
                  onClick={() => handleCreateClick(dailyPrompt)}
                >
                  Start Writing
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      </div>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-dark-blue/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg space-y-6 rounded-[32px] border-2 border-border bg-white p-8 shadow-sm overflow-hidden liquid-glass">
            <div className="absolute top-[-20%] right-[-10%] w-[200px] h-[200px] bg-green/10 blur-[60px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[200px] h-[200px] bg-blue/10 blur-[60px] rounded-full pointer-events-none" />

            {/* Dark Mode Toggle for Onboarding */}
            <button
              onClick={() => {
                if (document.documentElement.classList.contains('dark')) {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              }}
              className="absolute top-6 right-6 p-2 rounded-xl text-gray-nav hover:text-green hover:bg-green/5 transition-colors z-20 border-2 border-border bg-white/50 backdrop-blur-md"
              title="Toggle Dark Mode"
            >
              <Sparkles size={18} />
            </button>

            <div className="relative z-10 flex flex-col gap-8">
              <h2 className="text-[32px] font-display text-gray-text lowercase">welcome to ai notes</h2>
              <p className="text-[15px] text-gray-light font-medium leading-relaxed">
                Your intelligent companion for mental wellness and journaling. Here's what you can do:
              </p>

              <div className="flex flex-col gap-6">
                <div className="flex gap-4">
                  <div className="h-12 w-12 shrink-0 rounded-2xl bg-green/10 flex items-center justify-center text-green shadow-sm border-2 border-border">
                    <Sparkles size={24} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-[16px] font-bold text-gray-text">AI Reflection</h3>
                    <p className="text-[14px] text-gray-light font-medium leading-relaxed">
                      Get personalized insights, compassionate feedback, and dynamic prompts based on your entries.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-12 w-12 shrink-0 rounded-2xl bg-blue/10 flex items-center justify-center text-blue shadow-sm border-2 border-border">
                    <Smile size={24} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-[16px] font-bold text-gray-text">Mood Tracking</h3>
                    <p className="text-[14px] text-gray-light font-medium leading-relaxed">
                      Log your emotions with each entry and visualize your mood trends over time on your calendar.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-12 w-12 shrink-0 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 shadow-sm border-2 border-border">
                    <Tag size={24} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-[16px] font-bold text-gray-text">Smart Organization</h3>
                    <p className="text-[14px] text-gray-light font-medium leading-relaxed">
                      Add custom tags to your notes to easily filter and find your thoughts later.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                className="w-full h-[56px] text-[16px] font-bold uppercase rounded-xl shadow-sm active:scale-[0.98] transition-all duration-300 ease-out-quart liquid-glass"
                onClick={handleCloseOnboarding}
              >
                Let's Get Started
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Ambient Music — scroll-locked floating button */}
      <div style={{ position: 'fixed', bottom: '24px', right: '20px', zIndex: 8000 }}>
        <AmbientMusicButton />
      </div>
    </>
  );
};
