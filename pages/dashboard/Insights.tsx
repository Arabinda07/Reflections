import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Brain, TrendingUp, Heart } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { RoutePath } from '../../types';

export const Insights: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-4xl animate-in fade-in duration-700 pb-20 px-4 md:px-10">
      <nav className="sticky top-4 z-50 mb-12 flex items-center justify-between rounded-2xl border-2 border-border bg-white/90 px-4 py-3 shadow-[0_4px_0_0_#E5E5E5] backdrop-blur-2xl transition-all">
        <div className="flex items-center gap-3">
           <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-gray-nav hover:text-gray-text font-bold uppercase text-[12px]">
             <ArrowLeft className="mr-2 h-4 w-4" />
             BACK
           </Button>
           <div className="h-4 w-[2px] bg-border"></div>
           <span className="text-[12px] font-extrabold text-gray-nav uppercase tracking-wider">AI Insights</span>
        </div>
      </nav>

      <div className="space-y-8">
        <header className="text-center mb-12">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-[24px] bg-blue/10 text-blue mb-6 shadow-3d-gray border-2 border-border">
            <Brain size={32} />
          </div>
          <h1 className="text-4xl font-display text-gray-text lowercase mb-4">Your Emotional Landscape</h1>
          <p className="text-gray-light max-w-lg mx-auto font-medium">
            AI-powered analysis of your journaling patterns to help you understand your journey better.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border-2 border-border rounded-[32px] p-8 shadow-[0_8px_0_0_#E5E5E5] liquid-glass">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-green/10 text-green flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <h3 className="text-[16px] font-bold text-gray-text uppercase tracking-wider">Mood Trends</h3>
            </div>
            <div className="h-40 flex items-center justify-center border-2 border-dashed border-border rounded-2xl bg-gray-50/50">
              <p className="text-[13px] font-bold text-gray-nav uppercase tracking-widest opacity-40">Visualization Coming Soon</p>
            </div>
            <p className="mt-6 text-[14px] text-gray-light font-medium leading-relaxed">
              We're analyzing your entries to identify recurring emotional cycles and triggers.
            </p>
          </div>

          <div className="bg-white border-2 border-border rounded-[32px] p-8 shadow-[0_8px_0_0_#E5E5E5] liquid-glass">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Heart size={20} />
              </div>
              <h3 className="text-[16px] font-bold text-gray-text uppercase tracking-wider">Self-Care Focus</h3>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-500/5 border-2 border-purple-500/10">
                <p className="text-[14px] text-gray-text font-medium italic">"You've mentioned 'peace' more often this week. Consider what activities brought that feeling."</p>
              </div>
              <div className="p-4 rounded-2xl bg-blue/5 border-2 border-blue/10">
                <p className="text-[14px] text-gray-text font-medium italic">"Your late-night entries tend to be more anxious. Try a 5-minute wind-down routine."</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue to-blue/80 rounded-[32px] p-10 text-white shadow-3d-blue liquid-glass-strong">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Sparkles size={24} />
            </div>
            <h4 className="text-[24px] font-display lowercase">AI Reflection</h4>
          </div>
          <p className="text-[18px] font-medium leading-relaxed opacity-90 mb-8">
            "Based on your recent 12 entries, there's a strong theme of growth through challenge. You're showing remarkable resilience in how you process work-related stress."
          </p>
          <Button 
            variant="secondary" 
            className="bg-white text-blue font-extrabold uppercase shadow-3d-gray"
            onClick={() => navigate(RoutePath.CREATE_NOTE)}
          >
            CONTINUE YOUR JOURNEY
          </Button>
        </div>
      </div>
    </div>
  );
};
