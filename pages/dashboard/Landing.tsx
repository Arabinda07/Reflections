import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Play, Shield, Zap, Heart, Brain, Moon, Sun, ArrowRight, CheckCircle2, Cloud } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { RoutePath } from '../../types';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-white selection:bg-green/30 selection:text-green-hover">
      {/* Ambient Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-green/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-purple-500/5 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center px-6 py-20 md:py-32">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green/10 border-2 border-green/20 text-green text-[12px] font-black uppercase tracking-[0.2em] mb-8 animate-in slide-in-from-bottom-4 duration-500">
            <Sparkles size={14} />
            <span>The Future of Journaling</span>
          </div>
          
          <h1 className="text-6xl md:text-9xl font-display text-gray-text lowercase leading-[0.85] mb-10 tracking-tighter animate-in slide-in-from-bottom-6 duration-700">
            your mind, <br />
            <span className="bg-gradient-to-r from-green via-blue to-purple-500 bg-clip-text text-transparent animate-gradient-x">beautifully</span> organized.
          </h1>
          
          <p className="text-[18px] md:text-[24px] text-gray-light font-medium leading-relaxed max-w-2xl mx-auto mb-14 animate-in slide-in-from-bottom-8 duration-900">
            A sanctuary for your thoughts. AI-powered reflections, mood tracking, and a clean space to breathe.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in slide-in-from-bottom-10 duration-1000">
            <Button 
              variant="primary" 
              size="lg" 
              className="h-20 px-12 text-[20px] font-bold uppercase rounded-[24px] shadow-3d-green liquid-glass group"
              onClick={() => navigate(RoutePath.SIGNUP)}
            >
              <span>Enter Sanctuary</span>
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="secondary" 
              size="lg" 
              className="h-20 px-12 text-[20px] font-bold uppercase rounded-[24px] border-2 border-border text-blue shadow-3d-gray liquid-glass"
              onClick={() => navigate(RoutePath.LOGIN)}
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Video Placeholder Section */}
        <div className="relative w-full max-w-6xl mb-32 group">
          <div className="absolute -inset-4 bg-gradient-to-r from-green/20 via-blue/20 to-purple-500/20 rounded-[48px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="relative aspect-video rounded-[40px] border-2 border-border bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] overflow-hidden liquid-glass animate-in zoom-in-95 duration-1000">
            <div className="absolute inset-0 bg-gradient-to-br from-blue/5 via-transparent to-green/5" />
            
            {/* Mock Video Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="absolute -inset-8 bg-blue/20 rounded-full blur-3xl animate-pulse" />
                <div className="relative h-24 w-24 rounded-full bg-white border-2 border-border flex items-center justify-center text-blue shadow-3d-gray group-hover:scale-110 transition-transform duration-500 cursor-pointer">
                  <Play size={40} fill="currentColor" className="ml-1" />
                </div>
              </div>
            </div>

            {/* Floating UI Elements */}
            <div className="absolute top-10 left-10 p-5 rounded-2xl bg-white/80 backdrop-blur-md border-2 border-border shadow-xl animate-bounce duration-[3000ms] liquid-glass">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-green/10 text-green flex items-center justify-center">
                  <Heart size={20} />
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-green animate-progress" />
                  </div>
                  <div className="h-2 w-16 bg-gray-100 rounded-full" />
                </div>
              </div>
            </div>

            <div className="absolute bottom-10 right-10 p-5 rounded-2xl bg-white/80 backdrop-blur-md border-2 border-border shadow-xl animate-bounce duration-[4000ms] liquid-glass">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue/10 text-blue flex items-center justify-center">
                  <Zap size={20} />
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-32 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full w-1/2 bg-blue animate-progress" style={{ animationDelay: '1s' }} />
                  </div>
                  <div className="h-2 w-20 bg-gray-100 rounded-full" />
                </div>
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/90 to-transparent backdrop-blur-sm flex items-center justify-center">
              <p className="text-[14px] font-black uppercase tracking-[0.4em] text-gray-nav">Experience the Sanctuary</p>
            </div>
          </div>
        </div>

        {/* Bento Grid Features */}
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Large Card: AI Insights */}
          <div className="md:col-span-8 p-10 rounded-[40px] border-2 border-border bg-white shadow-3d-gray liquid-glass relative overflow-hidden group hover:translate-y-[-4px] transition-all duration-500">
            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
              <Brain size={200} />
            </div>
            <div className="relative z-10 max-w-md">
              <div className="h-14 w-14 rounded-2xl bg-blue/10 text-blue flex items-center justify-center mb-8 shadow-3d-gray">
                <Sparkles size={28} />
              </div>
              <h3 className="text-[32px] font-display text-gray-text lowercase mb-4">AI-Powered Reflections</h3>
              <p className="text-[18px] text-gray-light font-medium leading-relaxed mb-8">
                Gain deep understanding of your emotional patterns with compassionate AI analysis that evolves with your journey.
              </p>
              <ul className="space-y-3">
                {['Pattern Recognition', 'Compassionate Feedback', 'Dynamic Prompts'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-[14px] font-bold text-gray-nav">
                    <CheckCircle2 size={18} className="text-green" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Tall Card: Privacy */}
          <div className="md:col-span-4 p-10 rounded-[40px] border-2 border-border bg-green/5 shadow-3d-green liquid-glass relative overflow-hidden group hover:translate-y-[-4px] transition-all duration-500">
            <div className="h-14 w-14 rounded-2xl bg-green text-white flex items-center justify-center mb-8 shadow-3d-green">
              <Shield size={28} />
            </div>
            <h3 className="text-[28px] font-display text-gray-text lowercase mb-4">Your Private Sanctuary</h3>
            <p className="text-[16px] text-gray-light font-medium leading-relaxed">
              Your thoughts are yours alone. We prioritize end-to-end encryption and complete data ownership.
            </p>
            <div className="mt-12 p-6 rounded-3xl bg-white/50 border-2 border-border backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-3 w-3 rounded-full bg-green animate-pulse" />
                <span className="text-[12px] font-black uppercase tracking-widest text-green">Encrypted</span>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full bg-gray-100 rounded-full" />
                <div className="h-2 w-2/3 bg-gray-100 rounded-full" />
              </div>
            </div>
          </div>

          {/* Wide Card: Mood Tracking */}
          <div className="md:col-span-12 p-10 rounded-[40px] border-2 border-border bg-white shadow-3d-gray liquid-glass flex flex-col md:flex-row items-center gap-12 group hover:translate-y-[-4px] transition-all duration-500">
            <div className="flex-1">
              <div className="h-14 w-14 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-8 shadow-3d-gray">
                <Heart size={28} />
              </div>
              <h3 className="text-[32px] font-display text-gray-text lowercase mb-4">Visualize Your Emotions</h3>
              <p className="text-[18px] text-gray-light font-medium leading-relaxed">
                Track your mood over time and see how your environment and activities impact your mental well-being.
              </p>
            </div>
            <div className="flex-1 w-full grid grid-cols-4 gap-4">
              {[Sun, Cloud, Moon, Zap].map((Icon, i) => (
                <div key={i} className="aspect-square rounded-3xl border-2 border-border flex items-center justify-center text-gray-nav hover:bg-purple-500/5 hover:border-purple-500/20 hover:text-purple-500 transition-all cursor-pointer group/icon">
                  <Icon size={32} className="group-hover/icon:scale-110 transition-transform" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-32 text-center">
          <h2 className="text-[40px] md:text-[64px] font-display text-gray-text lowercase mb-8 tracking-tight">ready to start your journey?</h2>
          <Button 
            variant="primary" 
            size="lg" 
            className="h-20 px-16 text-[20px] font-bold uppercase rounded-[24px] shadow-3d-green liquid-glass"
            onClick={() => navigate(RoutePath.SIGNUP)}
          >
            Create Your Sanctuary
          </Button>
        </div>
      </div>
    </div>
  );
};

