import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Sparkles, FolderOpen, FileText, UserPlus, Smile, Tag, RefreshCw, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { RoutePath } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { noteService } from '../../services/noteService';
import { supabase } from '../../src/supabaseClient';
import { Landing } from './Landing';

const DAILY_PROMPTS = [
  "What is one thing that made you feel peaceful today, even if just for a second?",
  "How did you handle a challenge today with kindness toward yourself?",
  "What's a small victory you want to celebrate right now?",
  "If you could send a message to your future self, what would it say?",
  "What's one thing you're letting go of to make room for growth?",
  "Describe a moment today where you felt truly present.",
  "What's a quality you admire in yourself that you used today?"
];

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [noteCount, setNoteCount] = useState<number | null>(null);
  const [isCountLoading, setIsCountLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [dailyPrompt, setDailyPrompt] = useState(DAILY_PROMPTS[0]);

  useEffect(() => {
    // Randomize initial prompt
    setDailyPrompt(DAILY_PROMPTS[Math.floor(Math.random() * DAILY_PROMPTS.length)]);
  }, []);

  const refreshPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    let next;
    do {
      next = DAILY_PROMPTS[Math.floor(Math.random() * DAILY_PROMPTS.length)];
    } while (next === dailyPrompt);
    setDailyPrompt(next);
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
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
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
    <div className="animate-in fade-in duration-700">
      {/* Hero Section - Simplified for Auth Users */}
      <section className="flex flex-col items-center text-center py-[80px] px-10 bg-gradient-to-b from-green/5 to-white">
        <h1 className="font-display text-[64px] text-green lowercase mb-4 tracking-tighter">
          welcome back, {user?.name?.split(' ')[0] || 'learner'}
        </h1>
        <p className="text-[18px] text-gray-light max-w-[520px] leading-[1.5] mb-10 font-medium">
          Ready to capture your thoughts? Your sanctuary is waiting.
        </p>
        <Button 
          variant="primary" 
          size="lg"
          className="h-[64px] px-12 text-[18px] font-bold uppercase rounded-2xl shadow-3d-green active:shadow-none active:translate-y-[4px] transition-all liquid-glass group"
          onClick={() => handleCreateClick()}
        >
          <PlusCircle className="mr-3 group-hover:rotate-90 transition-transform duration-300" />
          New Entry
        </Button>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 border-t-2 border-border">
        
        {/* Panel 1: Stats & Overview - Now Clickable */}
        <div className="p-[36px_40px] border-b-2 border-border lg:border-r-2 border-border">
          <div className="panel-label">Emotional Overview</div>
          <div className="flex flex-col gap-6">
            <div 
              className="bg-white border-2 border-border rounded-[32px] p-8 shadow-[0_8px_0_0_#E5E5E5] hover:shadow-none hover:translate-y-[4px] transition-all liquid-glass cursor-pointer group"
              onClick={() => navigate(RoutePath.NOTES)}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="h-14 w-14 rounded-2xl bg-blue/10 flex items-center justify-center text-blue shadow-3d-gray group-hover:scale-110 transition-transform">
                  <FolderOpen size={28} />
                </div>
                <div className="flex items-center gap-2 text-[11px] font-black uppercase text-blue tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  View All <ArrowRight size={12} />
                </div>
              </div>
              <h3 className="text-[16px] font-bold text-gray-nav uppercase tracking-wider mb-2">Total Reflections</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-[40px] font-display text-gray-text">
                  {isCountLoading ? '...' : noteCount ?? '0'}
                </span>
                <span className="text-[12px] font-extrabold text-green uppercase">Synced with Cloud</span>
              </div>
            </div>

            <div 
              className="bg-white border-2 border-border rounded-[32px] p-8 shadow-[0_8px_0_0_#E5E5E5] hover:shadow-none hover:translate-y-[4px] transition-all liquid-glass cursor-pointer group"
              onClick={() => navigate(RoutePath.INSIGHTS)}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="h-14 w-14 rounded-2xl bg-green/10 flex items-center justify-center text-green shadow-3d-gray group-hover:scale-110 transition-transform">
                  <Sparkles size={28} />
                </div>
                <div className="flex items-center gap-2 text-[11px] font-black uppercase text-green tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  Get Insights <ArrowRight size={12} />
                </div>
              </div>
              <h3 className="text-[16px] font-bold text-gray-nav uppercase tracking-wider mb-2">Mental Health Insights</h3>
              <p className="text-[15px] text-gray-light font-medium leading-relaxed">AI is ready to analyze your patterns and provide compassionate feedback.</p>
            </div>
          </div>
        </div>

        {/* Panel 2: Daily Mindfulness */}
        <div className="p-[36px_40px] border-b-2 border-border flex flex-col justify-center">
          <div className="panel-label">Daily Mindfulness</div>
          <div className="bg-gradient-to-br from-blue to-blue/80 rounded-[32px] p-10 text-white shadow-3d-blue liquid-glass-strong relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform duration-700">
              <Sparkles size={120} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Sparkles size={24} />
                  </div>
                  <h4 className="text-[20px] font-display lowercase">today's focus</h4>
                </div>
                <button 
                  onClick={refreshPrompt}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                  title="Refresh Prompt"
                >
                  <RefreshCw size={18} />
                </button>
              </div>
              
              <p className="text-[20px] font-medium leading-relaxed mb-10">
                "{dailyPrompt}"
              </p>
              
              <Button 
                variant="secondary" 
                size="lg" 
                className="w-full sm:w-auto bg-white text-blue font-extrabold uppercase shadow-3d-gray liquid-glass"
                onClick={() => handleCreateClick(dailyPrompt)}
              >
                WRITE ABOUT IT
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-dark-blue/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg space-y-6 rounded-[32px] border-2 border-border bg-white p-8 shadow-[0_12px_0_0_#E5E5E5] overflow-hidden liquid-glass">
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

            <div className="relative z-10">
              <h2 className="text-[32px] font-display text-gray-text lowercase mb-2">welcome to ai notes</h2>
              <p className="text-[15px] text-gray-light font-medium leading-relaxed mb-8">
                Your intelligent companion for mental wellness and journaling. Here's what you can do:
              </p>

              <div className="space-y-6 mb-8">
                <div className="flex gap-4">
                  <div className="h-12 w-12 shrink-0 rounded-2xl bg-green/10 flex items-center justify-center text-green shadow-3d-gray border-2 border-border">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-gray-text mb-1">AI Reflection</h3>
                    <p className="text-[14px] text-gray-light font-medium leading-relaxed">
                      Get personalized insights, compassionate feedback, and dynamic prompts based on your entries.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-12 w-12 shrink-0 rounded-2xl bg-blue/10 flex items-center justify-center text-blue shadow-3d-gray border-2 border-border">
                    <Smile size={24} />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-gray-text mb-1">Mood Tracking</h3>
                    <p className="text-[14px] text-gray-light font-medium leading-relaxed">
                      Log your emotions with each entry and visualize your mood trends over time on your calendar.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-12 w-12 shrink-0 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 shadow-3d-gray border-2 border-border">
                    <Tag size={24} />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-gray-text mb-1">Smart Organization</h3>
                    <p className="text-[14px] text-gray-light font-medium leading-relaxed">
                      Add custom tags to your notes to easily filter and find your thoughts later.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                variant="primary" 
                className="w-full h-[56px] text-[16px] font-bold uppercase rounded-xl shadow-3d-green active:shadow-none active:translate-y-[4px] transition-all liquid-glass"
                onClick={handleCloseOnboarding}
              >
                Let's Get Started
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
