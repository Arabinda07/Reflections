import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import { 
  Heart, Sparkles, Brain, Shield, Cloud, Sun, Moon, Zap, 
  PenTool, Tags, Calendar as CalendarIcon, CheckSquare,
  Lock, ArrowRight, BookOpen, Compass, CheckCircle2
} from 'lucide-react';

// Use a type-safe way to reference the custom web component without shadowing global JSX types
const SplineViewer = 'spline-viewer' as any;

import { RoutePath } from '../../types';

export const FAQ: React.FC = () => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const yBase = useTransform(scrollYProgress, [0, 1], [0, -150]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-white selection:bg-green/30 selection:text-green-hover pt-10 pb-32">
      {/* Ambient Emotional Atmosphere Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          style={{ y: yBase }}
          className="absolute top-[0%] right-[-10%] w-[600px] h-[600px] bg-green/5 blur-[120px] rounded-full" 
        />
        <div className="absolute top-[40%] left-[-15%] w-[800px] h-[800px] bg-blue/5 blur-[150px] rounded-full animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDuration: '12s' }} />
      </div>

      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 md:px-6">
        
        {/* =========================================
            PHASE 1: THE WHY (The Philosophy & Emotion)
            ========================================= */}
        <section className="min-h-screen flex flex-col pt-12 md:pt-20 mb-32">
          
          {/* Overarching Text (Above Spline) */}
          <div className="w-full text-center max-w-4xl mx-auto mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green/10 border-2 border-green/20 text-green text-[12px] font-black uppercase tracking-[0.2em] mb-8 shadow-sm">
                <Heart size={14} className="animate-pulse" />
                <span>Your Mental Health Sanctuary</span>
              </div>
              
              <h1 className="text-5xl sm:text-6xl md:text-8xl font-display text-gray-text lowercase leading-[0.9] mb-8 tracking-tighter drop-shadow-sm">
                untangle <br />
                <span className="bg-gradient-to-r from-green via-blue to-green bg-clip-text text-transparent animate-gradient-x drop-shadow-md">your thoughts.</span>
              </h1>
              
              <p className="text-[18px] sm:text-[22px] text-gray-light font-medium leading-relaxed max-w-3xl mx-auto mb-6">
                We live in an overwhelming, fast-paced world. Racing thoughts, anxiety, and stress accumulate until our minds feel loud and cluttered. 
              </p>
              <p className="text-[18px] sm:text-[20px] text-gray-text font-semibold leading-relaxed max-w-2xl mx-auto">
                Journaling isn't just about recording what happened today—it involves actively unloading your cognitive burden to create space to breathe.
              </p>
            </motion.div>
          </div>
          
          {/* Full Width Spline Container */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="w-full h-[50vh] min-h-[400px] lg:h-[700px] rounded-[48px] border-2 border-border/50 bg-white/30 backdrop-blur-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] relative overflow-hidden flex items-center justify-center p-2 group"
          >
            <div className="w-full h-full rounded-[40px] overflow-hidden relative pointer-events-auto bg-[#F9F9F9]">
              <SplineViewer url="https://prod.spline.design/Dpx2TF6lL963qEnt/scene.splinecode" />
            </div>
          </motion.div>
          
        </section>


        {/* =========================================
            PHASE 2: THE HOW (The User Journey)
            ========================================= */}
        <section className="mb-40 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-display text-gray-text lowercase mb-6 tracking-tight">the journey</h2>
            <p className="text-[18px] text-gray-light font-medium max-w-2xl mx-auto">
              Healing doesn't happen overnight. It's a practice. Here is how you seamlessly embed this sanctuary into your daily life.
            </p>
          </div>

          {/* Horizontal Journey Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            
            {/* Visual connecting line for desktop */}
            <div className="hidden lg:block absolute top-[44px] left-[10%] right-[10%] h-[2px] bg-border z-0"></div>

            {[
              {
                step: "01",
                icon: Cloud,
                color: "blue",
                title: "The Routine",
                desc: "Set morning intentions before the noise begins, or write at night to perform a 'brain dump'."
              },
              {
                step: "02",
                icon: PenTool,
                color: "green",
                title: "Overcome Blanks",
                desc: "Don't force inspiration. If chaotic, rely on dynamic prompts like 'What is one small win today?'."
              },
              {
                step: "03",
                icon: Tags,
                color: "purple-500",
                title: "Categorize Chaos",
                desc: "Attach tags as you write. Over time, organizing fragments connects dots in your journey."
              },
              {
                step: "04",
                icon: Heart,
                color: "red",
                title: "Acknowledge Mood",
                desc: "Validate emotions without judgment. Are you anxious? Calm? Just naming it reduces its power."
              }
            ].map((item, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                key={i} 
                className="relative z-10 flex flex-col items-center group"
              >
                {/* Step Connector Node */}
                <div className="bg-white p-2 rounded-full mb-6">
                  <div className={`h-20 w-20 rounded-full border-4 border-white bg-${item.color}/10 text-${item.color} flex items-center justify-center font-black shadow-lg shadow-${item.color}/20 ring-1 ring-border liquid-glass group-hover:-translate-y-2 group-hover:scale-110 transition-all duration-300`}>
                    <item.icon size={28} />
                  </div>
                </div>

                {/* Card */}
                <div className="w-full p-8 rounded-[32px] border-2 border-border bg-white shadow-3d-gray flex-1 flex flex-col text-center hover:border-border/80 transition-colors">
                  <span className={`text-[12px] font-black uppercase tracking-widest text-${item.color} mb-3`}>Step {item.step}</span>
                  <h3 className="text-[22px] font-display text-gray-text lowercase mb-4 leading-tight">{item.title}</h3>
                  <p className="text-[15px] font-medium text-gray-light leading-relaxed flex-1">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>


        {/* =========================================
            PHASE 3: THE WHAT (The Toolkit & Premium)
            ========================================= */}
        <section className="mb-20 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-display text-gray-text lowercase mb-6 tracking-tight">the toolkit</h2>
            <p className="text-[18px] text-gray-light font-medium max-w-2xl mx-auto">
              A breakdown of the features designed to support your journey. Essential free tools today, and powerful premium horizon upgrades coming soon.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Free Tiers */}
            <div className="col-span-1 p-8 rounded-[32px] border-2 border-border bg-white shadow-3d-gray liquid-glass hover:shadow-lg transition-all flex flex-col group">
              <div className="h-12 w-12 rounded-xl bg-blue/10 text-blue flex items-center justify-center mb-6 group-hover:bg-blue group-hover:text-white transition-colors duration-300">
                <Shield size={24} />
              </div>
              <h4 className="text-[20px] font-display text-gray-text lowercase mb-3">Absolute Privacy</h4>
              <p className="text-[14px] text-gray-light font-medium leading-relaxed mb-6 flex-1">
                Your thoughts are yours. We utilize end-to-end encryption. Your data is isolated securely, so you can write freely and truthfully.
              </p>
              <div className="pt-4 border-t border-border flex items-center gap-2 text-[10px] font-black text-gray-nav uppercase">
                <CheckCircle2 size={14} className="text-green" /> Free Forever
              </div>
            </div>

            <div className="col-span-1 p-8 rounded-[32px] border-2 border-border bg-white shadow-3d-gray liquid-glass hover:shadow-lg transition-all flex flex-col group">
              <div className="h-12 w-12 rounded-xl bg-green/10 text-green flex items-center justify-center mb-6 group-hover:bg-green group-hover:text-white transition-colors duration-300">
                <Heart size={24} />
              </div>
              <h4 className="text-[20px] font-display text-gray-text lowercase mb-3">Mood Visualization</h4>
              <p className="text-[14px] text-gray-light font-medium leading-relaxed mb-6 flex-1">
                Track how often you feel calm, anxious, or happy. Recognizing emotional rhythms is the first step to regulating them.
              </p>
              <div className="pt-4 border-t border-border flex items-center gap-2 text-[10px] font-black text-gray-nav uppercase">
                <CheckCircle2 size={14} className="text-green" /> Free Forever
              </div>
            </div>

            <div className="col-span-1 p-8 rounded-[32px] border-2 border-border bg-white shadow-3d-gray liquid-glass hover:shadow-lg transition-all flex flex-col group">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-6 group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300">
                <CalendarIcon size={24} />
              </div>
              <h4 className="text-[20px] font-display text-gray-text lowercase mb-3">Rich Context Notes</h4>
              <p className="text-[14px] text-gray-light font-medium leading-relaxed mb-6 flex-1">
                Ground your thoughts by adding cover images, attaching files, or embedding tasks directly inside calendar-linked notes.
              </p>
              <div className="pt-4 border-t border-border flex items-center gap-2 text-[10px] font-black text-gray-nav uppercase">
                <CheckCircle2 size={14} className="text-green" /> Free Forever
              </div>
            </div>

            {/* Premium / Horizon - Redesigned to Golden Palette */}
            <div className="md:col-span-2 lg:col-span-3 p-10 mt-6 rounded-[40px] border-2 border-amber-400/30 bg-gradient-to-br from-amber-50/50 to-amber-100/30 shadow-[0_20px_50px_-12px_rgba(245,158,11,0.15)] relative overflow-hidden liquid-glass group">
              <div className="absolute -right-10 -top-10 opacity-[0.04] pointer-events-none group-hover:rotate-12 transition-transform duration-700">
                <Brain size={400} />
              </div>
              
              <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="h-14 w-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-3d-gray border-b-4 border-amber-600">
                  <Sparkles size={28} />
                </div>
                <div>
                  <h3 className="text-[28px] font-display text-amber-950 lowercase">the premium horizon</h3>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 text-[10px] font-black uppercase tracking-widest mt-1 shadow-sm">
                    <Lock size={12} /> Coming Soon
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div className="bg-white/40 p-6 rounded-3xl border border-amber-500/10 backdrop-blur-sm">
                  <h4 className="text-[18px] font-bold text-amber-950 mb-3 flex items-center gap-2">
                    <Brain size={20} className="text-amber-500" /> AI-Powered Reflections
                  </h4>
                  <p className="text-[15px] text-amber-900/80 font-medium leading-relaxed">
                    Gain deep understanding of your emotional patterns. Secure server-side AI analyzes your entries to provide compassionate, non-judgmental feedback that evolves with your journey.
                  </p>
                </div>
                <div className="bg-white/40 p-6 rounded-3xl border border-amber-500/10 backdrop-blur-sm">
                  <h4 className="text-[18px] font-bold text-amber-950 mb-3 flex items-center gap-2">
                    <Shield size={20} className="text-amber-500" /> 2FA & Advanced Security
                  </h4>
                  <p className="text-[15px] text-amber-900/80 font-medium leading-relaxed">
                    Protect your mental health sanctuary with robust Two-Factor Authentication, ensuring complete peace of mind for your most intimate thoughts.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Final CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-32 text-center"
        >
          <h2 className="text-[32px] md:text-[48px] font-display text-gray-text lowercase mb-8 tracking-tight">ready to clear your mind?</h2>
          <button 
            onClick={() => navigate(RoutePath.SIGNUP)}
            className="h-20 px-16 text-[18px] font-black uppercase tracking-wider rounded-[24px] bg-green text-white shadow-3d-green hover:-translate-y-1 hover:shadow-[0_12px_0_0_#2E8B57] active:-translate-y-0 active:shadow-none transition-all duration-200"
          >
            Create Your Sanctuary
          </button>
        </motion.div>

      </div>
    </div>
  );
};
