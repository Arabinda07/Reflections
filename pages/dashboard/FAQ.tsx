import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { 
  Heart, Sparkles, Brain, Shield, Cloud, Sun, Moon, Zap, 
  PenTool, Tags, Calendar as CalendarIcon, CheckSquare,
  Lock, ArrowRight, BookOpen, Compass, CheckCircle2
} from 'lucide-react';

import Spline from '@splinetool/react-spline';
import { RoutePath } from '../../types';
import { Button } from '../../components/ui/Button';

export const FAQ: React.FC = () => {
  const navigate = useNavigate();
  const journeyRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: mainScroll } = useScroll();
  const { scrollYProgress: journeyScroll } = useScroll({
    target: journeyRef,
    offset: ["start center", "end center"]
  });

  const scrollFillWidth = useTransform(journeyScroll, [0, 1], ["0%", "100%"]);
  // Show floating pill after scrolling down 30% of the page
  const showPill = useTransform(mainScroll, [0, 0.3], [0, 1]);
  // Use state to conditionally render pill avoiding AnimatePresence unmount issues if preferred, 
  // but useTransform is cleaner for opacity.

  const yBase = useTransform(mainScroll, [0, 1], [0, -150]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-body selection:bg-green/30 selection:text-green-hover pb-32">
      
      {/* Ambient Emotional Atmosphere Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          style={{ y: yBase }}
          className="absolute top-[0%] right-[-10%] w-[600px] h-[600px] bg-green/5 blur-[120px] rounded-full" 
        />
        <div className="absolute top-[40%] left-[-15%] w-[800px] h-[800px] bg-blue/5 blur-[150px] rounded-full animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-purple-500/5 blur-[120px] rounded-full animate-pulse" style={{ animationDuration: '12s' }} />
      </div>

      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 md:px-6 pt-24 pb-16">
        {/* =========================================
            PHASE 1: THE HERO TEXT
            ========================================= */}
        <section className="flex flex-col">
          <div className="w-full text-center max-w-4xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
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
        </section>
      </div>

      {/* =========================================
          PHASE 2: THE SPLINE BLOCK
          ========================================= */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="relative z-10 w-full h-[60vh] min-h-[500px] max-h-[800px] bg-[#F9F9F9] border-y-2 border-border/50 overflow-hidden flex items-center justify-center mb-20"
      >
        <div className="absolute inset-0 pointer-events-auto z-0 flex items-center justify-center origin-center transition-transform scale-105">
          <Spline scene="https://prod.spline.design/WJogBwjycMbazviG/scene.splinecode" />
        </div>
      </motion.section>

      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 md:px-6">


        {/* =========================================
            PHASE 2: THE HOW (The User Journey)
            ========================================= */}
        <section className="mb-40 max-w-7xl mx-auto" ref={journeyRef}>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-display text-gray-text lowercase mb-6 tracking-tight">the journey</h2>
            <p className="text-[18px] text-gray-light font-medium max-w-2xl mx-auto">
              Healing doesn't happen overnight. It's a practice. Here is how you seamlessly embed this sanctuary into your daily life.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative pt-4">
            
            {/* Visual connecting lines for desktop */}
            <div className="hidden lg:block absolute top-[44px] left-[10%] right-[10%] h-[4px] bg-border rounded-full z-0 overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-green via-blue to-purple-500 rounded-full"
                style={{ width: scrollFillWidth }}
              />
            </div>

            {[
              {
                step: "01",
                icon: Cloud,
                color: "green",
                title: "The Routine",
                desc: "Set morning intentions before the noise begins, or write at night to perform a 'brain dump'."
              },
              {
                step: "02",
                icon: PenTool,
                color: "blue",
                title: "Overcome Blanks",
                desc: "Don't force inspiration. If chaotic, rely on dynamic prompts like 'What is one small win today?'."
              },
              {
                step: "03",
                icon: Tags,
                color: "green",
                title: "Categorize Chaos",
                desc: "Attach tags as you write. Over time, organizing fragments connects dots in your journey."
              },
              {
                step: "04",
                icon: Heart,
                color: "purple-500",
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
                <div className="bg-body p-2 rounded-full mb-6">
                  <div className={`h-20 w-20 rounded-full border-4 border-white dark:border-[#1E1E1E] bg-${item.color}/10 text-${item.color} flex items-center justify-center font-black shadow-lg shadow-${item.color}/20 ring-1 ring-border group-hover:-translate-y-2 group-hover:scale-110 transition-all duration-300 liquid-glass`}>
                    <item.icon size={28} />
                  </div>
                </div>

                {/* Card */}
                <div className="w-full p-8 rounded-[32px] border-2 border-border bg-white dark:bg-[#1E1E1E] shadow-3d-gray flex-1 flex flex-col text-center hover:border-border/80 transition-colors">
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
            <div className="col-span-1 p-8 rounded-[32px] border-2 border-border bg-white dark:bg-[#1E1E1E] shadow-3d-gray hover:shadow-lg transition-all flex flex-col group liquid-glass">
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

            <div className="col-span-1 p-8 rounded-[32px] border-2 border-border bg-white dark:bg-[#1E1E1E] shadow-3d-gray hover:shadow-lg transition-all flex flex-col group liquid-glass">
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

            <div className="col-span-1 p-8 rounded-[32px] border-2 border-border bg-white dark:bg-[#1E1E1E] shadow-3d-gray hover:shadow-lg transition-all flex flex-col group liquid-glass">
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

            {/* Premium / Horizon - Adaptive Kinetic Glassmorphism */}
            <div className="md:col-span-2 lg:col-span-3 mt-6 relative rounded-[40px] p-0 group">
              {/* Animated Aurora Breathing Background */}
              <div className="absolute -inset-1 rounded-[40px] bg-gradient-to-r from-blue via-green to-purple-500 opacity-20 blur-xl animate-gradient-x pointer-events-none transition-opacity duration-1000 group-hover:opacity-40"></div>
              <div className="absolute -inset-1 rounded-[40px] bg-gradient-to-r from-blue via-green to-purple-500 opacity-20 blur-sm animate-gradient-x pointer-events-none transition-opacity duration-1000 group-hover:opacity-40"></div>
              
              {/* Actual Content Wrapper (Adaptive Glass) */}
              <div className="relative h-full w-full p-10 rounded-[40px] border-2 border-white/20 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] overflow-hidden transition-all">
                
                <div className="flex items-center gap-4 mb-8 relative z-10">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-green to-blue text-white flex items-center justify-center shadow-lg border-b-4 border-blue/50">
                    <Sparkles size={28} />
                  </div>
                  <div>
                    <h3 className="text-[28px] font-display text-gray-text lowercase">the premium horizon</h3>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/50 dark:bg-black/50 border border-border text-gray-text text-[10px] font-black uppercase tracking-widest mt-1 shadow-sm backdrop-blur-sm">
                      <Lock size={12} className="text-blue" /> Coming Soon
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 w-full">
                  <div className="bg-white/40 dark:bg-white/5 p-6 rounded-3xl border border-white/20 dark:border-white/10 backdrop-blur-md">
                    <h4 className="text-[18px] font-bold text-gray-text mb-3 flex items-center gap-2">
                      <Brain size={20} className="text-blue" /> AI-Powered Reflections
                    </h4>
                    <p className="text-[15px] text-gray-light font-medium leading-relaxed">
                      Gain deep understanding of your emotional patterns. Secure server-side AI analyzes your entries to provide compassionate, non-judgmental feedback that evolves with your journey.
                    </p>
                  </div>
                  <div className="bg-white/40 dark:bg-white/5 p-6 rounded-3xl border border-white/20 dark:border-white/10 backdrop-blur-md">
                    <h4 className="text-[18px] font-bold text-gray-text mb-3 flex items-center gap-2">
                      <Shield size={20} className="text-green" /> 2FA & Advanced Security
                    </h4>
                    <p className="text-[15px] text-gray-light font-medium leading-relaxed">
                      Protect your mental health sanctuary with robust Two-Factor Authentication, ensuring complete peace of mind for your most intimate thoughts.
                    </p>
                  </div>
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
          className="mt-20 mb-32 text-center"
        >
          <h2 className="text-[32px] md:text-[48px] font-display text-gray-text lowercase mb-8 tracking-tight">ready to clear your mind?</h2>
          <Button 
            variant="primary"
            size="lg"
            onClick={() => navigate(RoutePath.SIGNUP)}
            className="w-full sm:w-auto h-16 sm:h-20 px-8 sm:px-12 text-[16px] sm:text-[20px] font-bold uppercase rounded-[20px] sm:rounded-[24px] shadow-3d-green liquid-glass group mx-auto"
          >
            <span>Create Your Sanctuary</span>
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>

      </div>

      {/* Floating Action Pill */}
      <motion.div
        style={{ opacity: showPill }}
        className="fixed bottom-6 right-6 z-[100]"
      >
        <Button 
          variant="primary"
          onClick={() => navigate(RoutePath.SIGNUP)}
          className="h-10 px-5 text-[11px] sm:text-[12px] font-black uppercase tracking-widest rounded-full shadow-lg liquid-glass opacity-90 hover:opacity-100 transition-opacity hover:-translate-y-1 hover:shadow-xl flex items-center gap-2 group"
        >
          <Sparkles size={14} className="group-hover:rotate-12 transition-transform" />
          <span>Start Journaling</span>
        </Button>
      </motion.div>

    </div>
  );
};
