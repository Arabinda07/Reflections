import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Play, Shield, Zap, Heart } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { RoutePath } from '../../types';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20 animate-in fade-in duration-1000">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green/10 border-2 border-green/20 text-green text-[12px] font-black uppercase tracking-[0.2em] mb-8 animate-in slide-in-from-bottom-4 duration-500">
          <Sparkles size={14} />
          <span>The Future of Journaling</span>
        </div>
        <h1 className="text-6xl md:text-8xl font-display text-gray-text lowercase leading-[0.9] mb-8 tracking-tighter animate-in slide-in-from-bottom-6 duration-700">
          your mind, <br />
          <span className="text-green">beautifully</span> organized.
        </h1>
        <p className="text-[18px] md:text-[22px] text-gray-light font-medium leading-relaxed max-w-xl mx-auto mb-12 animate-in slide-in-from-bottom-8 duration-900">
          A sanctuary for your thoughts. AI-powered reflections, mood tracking, and a clean space to breathe.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in slide-in-from-bottom-10 duration-1000">
          <Button 
            variant="primary" 
            size="lg" 
            className="h-16 px-10 text-[18px] font-bold uppercase rounded-2xl shadow-3d-green liquid-glass"
            onClick={() => navigate(RoutePath.SIGNUP)}
          >
            Enter Sanctuary
          </Button>
          <Button 
            variant="secondary" 
            size="lg" 
            className="h-16 px-10 text-[18px] font-bold uppercase rounded-2xl border-2 border-border text-blue shadow-3d-gray liquid-glass"
            onClick={() => navigate(RoutePath.LOGIN)}
          >
            Sign In
          </Button>
        </div>
      </div>

      {/* Video Placeholder */}
      <div className="relative w-full max-w-5xl aspect-video rounded-[40px] border-2 border-border bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] overflow-hidden liquid-glass group animate-in zoom-in-95 duration-1000">
        <div className="absolute inset-0 bg-gradient-to-br from-blue/5 via-transparent to-green/5" />
        
        {/* Mock Video Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-blue/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative h-20 w-20 rounded-full bg-white border-2 border-border flex items-center justify-center text-blue shadow-3d-gray group-hover:scale-110 transition-transform duration-500">
              <Play size={32} fill="currentColor" className="ml-1" />
            </div>
          </div>
        </div>

        {/* Floating UI Elements (Visual Interest) */}
        <div className="absolute top-10 left-10 p-4 rounded-2xl bg-white/80 backdrop-blur-md border-2 border-border shadow-lg animate-bounce duration-[3000ms]">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-green/10 text-green flex items-center justify-center">
              <Heart size={16} />
            </div>
            <div className="h-2 w-20 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full w-2/3 bg-green" />
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 right-10 p-4 rounded-2xl bg-white/80 backdrop-blur-md border-2 border-border shadow-lg animate-bounce duration-[4000ms]">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue/10 text-blue flex items-center justify-center">
              <Zap size={16} />
            </div>
            <div className="h-2 w-24 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full w-1/2 bg-blue" />
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/80 to-transparent backdrop-blur-sm flex items-center justify-center">
          <p className="text-[12px] font-black uppercase tracking-[0.3em] text-gray-nav">Watch the Experience</p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mt-32">
        <div className="p-8 rounded-[32px] border-2 border-border bg-white shadow-3d-gray liquid-glass">
          <div className="h-12 w-12 rounded-xl bg-blue/10 text-blue flex items-center justify-center mb-6">
            <Shield size={24} />
          </div>
          <h3 className="text-[18px] font-bold text-gray-text mb-2">Private & Secure</h3>
          <p className="text-[14px] text-gray-light font-medium leading-relaxed">Your thoughts are yours alone. End-to-end encryption for your peace of mind.</p>
        </div>
        <div className="p-8 rounded-[32px] border-2 border-border bg-white shadow-3d-gray liquid-glass">
          <div className="h-12 w-12 rounded-xl bg-green/10 text-green flex items-center justify-center mb-6">
            <Sparkles size={24} />
          </div>
          <h3 className="text-[18px] font-bold text-gray-text mb-2">AI Insights</h3>
          <p className="text-[14px] text-gray-light font-medium leading-relaxed">Gain deep understanding of your emotional patterns with compassionate AI analysis.</p>
        </div>
        <div className="p-8 rounded-[32px] border-2 border-border bg-white shadow-3d-gray liquid-glass">
          <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-6">
            <Zap size={24} />
          </div>
          <h3 className="text-[18px] font-bold text-gray-text mb-2">Frictionless</h3>
          <p className="text-[14px] text-gray-light font-medium leading-relaxed">A minimal, beautiful interface designed to help you focus on what matters: your thoughts.</p>
        </div>
      </div>
    </div>
  );
};
