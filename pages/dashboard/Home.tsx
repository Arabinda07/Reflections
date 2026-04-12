import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Sparkles, FolderOpen, FileText, UserPlus, Smile, Tag } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { RoutePath } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { noteService } from '../../services/noteService';
import { supabase } from '../../src/supabaseClient';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [noteCount, setNoteCount] = useState<number | null>(null);
  const [isCountLoading, setIsCountLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

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

  return (
    <div className="animate-in fade-in duration-700">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center py-[56px] px-10 bg-gradient-to-b from-green/5 to-white">
        <h1 className="font-display text-[52px] text-green lowercase mb-4">
          {isAuthenticated ? `welcome back, ${user?.name?.split(' ')[0] || 'learner'}` : 'ai notes dashboard'}
        </h1>
        <p className="text-[17px] text-gray-light max-w-[520px] leading-[1.5] mb-8">
          {isAuthenticated 
            ? 'Your AI-Powered workspace for mental health journaling — clean, fast, and beautifully organized.' 
            : 'The smartest way to journal. Capture your thoughts, track your mood, and gain insights with AI.'
          }
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            variant="primary" 
            className="h-[48px] px-8 text-[15px] font-bold uppercase rounded-xl shadow-3d-green active:shadow-none active:translate-y-[4px] transition-all"
            onClick={handleCreateClick}
          >
            CREATE NEW NOTE
          </Button>
          {!isAuthenticated && (
            <Button 
              variant="secondary" 
              className="h-[48px] px-8 text-[15px] font-bold uppercase rounded-xl border-2 border-border text-blue shadow-3d-gray active:shadow-none active:translate-y-[4px] transition-all"
              onClick={() => navigate(RoutePath.LOGIN)}
            >
              GET STARTED
            </Button>
          )}
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 border-t-2 border-border">
        
        {/* Panel 1: Stats & Overview */}
        <div className="p-[36px_40px] border-b-2 border-border lg:border-r-2 border-border">
          <div className="panel-label">Emotional Overview</div>
          <div className="flex flex-col gap-6">
            <div className="bg-white border-2 border-border rounded-[32px] p-8 shadow-[0_8px_0_0_#E5E5E5] hover:shadow-none hover:translate-y-[4px] transition-all liquid-glass">
              <div className="flex items-center justify-between mb-6">
                <div className="h-14 w-14 rounded-2xl bg-blue/10 flex items-center justify-center text-blue shadow-3d-gray">
                  <FolderOpen size={28} />
                </div>
                <span className="text-[11px] font-extrabold uppercase text-gray-nav tracking-widest">JOURNAL ENTRIES</span>
              </div>
              <h3 className="text-[16px] font-bold text-gray-nav uppercase tracking-wider mb-2">Total Reflections</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-[40px] font-display text-gray-text">
                  {!isAuthenticated ? '—' : isCountLoading ? '...' : noteCount ?? '0'}
                </span>
                {isAuthenticated && <span className="text-[12px] font-extrabold text-green uppercase">Synced with Cloud</span>}
              </div>
            </div>

            <div className="bg-white border-2 border-border rounded-[32px] p-8 shadow-[0_8px_0_0_#E5E5E5] hover:shadow-none hover:translate-y-[4px] transition-all liquid-glass">
              <div className="flex items-center justify-between mb-6">
                <div className="h-14 w-14 rounded-2xl bg-green/10 flex items-center justify-center text-green shadow-3d-gray">
                  <Sparkles size={28} />
                </div>
                <span className="text-[11px] font-extrabold uppercase text-gray-nav tracking-widest">AI THERAPY ASSISTANT</span>
              </div>
              <h3 className="text-[16px] font-bold text-gray-nav uppercase tracking-wider mb-2">Mental Health Insights</h3>
              <p className="text-[15px] text-gray-light font-medium leading-relaxed">AI is ready to analyze your next entry for emotional patterns and provide compassionate feedback.</p>
            </div>
          </div>
        </div>

        {/* Panel 2: Quick Actions & Mindfulness */}
        <div className="p-[36px_40px] border-b-2 border-border">
          <div className="panel-label">Mindfulness Actions</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div 
              className="bg-white border-2 border-border rounded-[32px] p-6 hover:border-blue hover:bg-blue/5 cursor-pointer transition-all group shadow-[0_4px_0_0_#E5E5E5] active:shadow-none active:translate-y-[2px] liquid-glass"
              onClick={handleViewAllClick}
            >
              <div className="h-12 w-12 rounded-xl bg-blue text-white flex items-center justify-center mb-4 shadow-3d-blue group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <h4 className="text-[18px] font-bold text-gray-text">Reflect on Past</h4>
              <p className="text-[13px] text-gray-light font-medium mt-1">Browse your journey and see how far you've come.</p>
            </div>

            <div 
              className="bg-white border-2 border-border rounded-[32px] p-6 hover:border-green hover:bg-green/5 cursor-pointer transition-all group shadow-[0_4px_0_0_#E5E5E5] active:shadow-none active:translate-y-[2px] liquid-glass"
              onClick={handleCreateClick}
            >
              <div className="h-12 w-12 rounded-xl bg-green text-white flex items-center justify-center mb-4 shadow-3d-green group-hover:scale-110 transition-transform">
                <PlusCircle size={24} />
              </div>
              <h4 className="text-[18px] font-bold text-gray-text">New Entry</h4>
              <p className="text-[13px] text-gray-light font-medium mt-1">Release your thoughts and clear your mind today.</p>
            </div>
          </div>

          <div className="mt-10 pt-10 border-t-2 border-border">
            <div className="panel-label">Daily Mindfulness</div>
            <div className="bg-gradient-to-br from-blue to-blue/80 rounded-[32px] p-8 text-white shadow-3d-blue liquid-glass-strong">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Sparkles size={24} />
                </div>
                <h4 className="text-[20px] font-display lowercase">today's focus</h4>
              </div>
              <p className="text-[16px] font-medium leading-relaxed opacity-90">
                "What is one thing that made you feel peaceful today, even if just for a second?"
              </p>
              <Button 
                variant="secondary" 
                size="sm" 
                className="mt-6 w-full sm:w-auto bg-white text-blue font-extrabold uppercase shadow-3d-gray"
                onClick={() => handleCreateClick("What is one thing that made you feel peaceful today, even if just for a second?")}
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
                className="w-full h-[56px] text-[16px] font-bold uppercase rounded-xl shadow-3d-green active:shadow-none active:translate-y-[4px] transition-all"
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
