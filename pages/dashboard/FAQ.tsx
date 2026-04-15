import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { 
  Heart, Sparkles, Brain, Shield, Cloud, Sun, Moon, Zap, 
  PenTool, Tags, Calendar as CalendarIcon, CheckSquare,
  Lock, ArrowRight, BookOpen, Compass, CheckCircle2, Paperclip, Image as ImageIcon, Headphones, Target
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
    <div className="relative min-h-screen overflow-hidden bg-white dark:bg-[#121212] selection:bg-green/30 selection:text-green-hover pb-32 transition-colors duration-300">
      
      {/* Ambient Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-green/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
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
              
              <h1 className="text-5xl sm:text-6xl md:text-8xl font-display text-gray-text lowercase leading-tight md:leading-[0.9] mb-8 tracking-tighter drop-shadow-sm">
                untangle your <br />
                <span className="bg-gradient-to-r from-green via-blue to-green bg-clip-text text-transparent animate-gradient-x drop-shadow-md">thoughts.</span>
              </h1>
              
              <p className="text-[18px] sm:text-[22px] text-gray-light font-medium leading-relaxed max-w-3xl mx-auto mb-6">
                We live in an overwhelming, fast-paced world. Racing thoughts, anxiety, stress accumulate until our minds feel loud and cluttered. 
              </p>
              <p className="text-[18px] sm:text-[20px] text-gray-text font-semibold leading-relaxed max-w-2xl mx-auto">
                Get what's in your head out on the page. Journaling is about giving yourself room to breathe. Use this app to clear the mental clutter.
              </p>
            </motion.div>
          </div>
        </section>
      </div>

      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 md:px-6 mb-32">
        {/* =========================================
            PHASE 2: THE SPLINE BLOCK
            ========================================= */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="relative w-full h-[60vh] min-h-[500px] max-h-[700px] flex items-center justify-center group"
        >
          <div className="absolute inset-0 pointer-events-auto z-0 flex items-center justify-center origin-center transition-transform duration-1000 group-hover:scale-105">
            <Spline scene="https://prod.spline.design/Dpx2TF6lL963qEnt/scene.splinecode" />
          </div>
        </motion.section>
      </div>

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
                title: "Morning or Night",
                desc: "Start your day with an intention or end it by clearing your head. Write whenever it fits your schedule."
              },
              {
                step: "02",
                icon: PenTool,
                color: "blue",
                title: "Feeling Stuck?",
                desc: "If the page is blank, tap the Daily Spark in the editor. It's there to give you a quick nudge."
              },
              {
                step: "03",
                icon: Tags,
                color: "green",
                title: "Group your notes",
                desc: "Use tags to find recurring themes. It helps you see how different parts of your life connect over time."
              },
              {
                step: "04",
                icon: Heart,
                color: "purple-500",
                title: "Check your mood",
                desc: "Name how you feel. It sounds simple, but it's the first step to understanding your own patterns."
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
              <h4 className="text-[20px] font-display text-gray-text lowercase mb-3">It's 100% private</h4>
              <p className="text-[14px] text-gray-light font-medium leading-relaxed mb-6 flex-1">
                We can't read your notes. Your data is stored securely on Supabase and belongs only to you.
              </p>
              <div className="pt-4 border-t border-border flex items-center gap-2 text-[10px] font-black text-gray-nav uppercase">
                <CheckCircle2 size={14} className="text-green" /> Totally Secure
              </div>
            </div>

            <div className="col-span-1 p-8 rounded-[32px] border-2 border-border bg-white dark:bg-[#1E1E1E] shadow-3d-gray hover:shadow-lg transition-all flex flex-col group liquid-glass">
              <div className="h-12 w-12 rounded-xl bg-green/10 text-green flex items-center justify-center mb-6 group-hover:bg-green group-hover:text-white transition-colors duration-300">
                <Heart size={24} />
              </div>
              <h4 className="text-[20px] font-display text-gray-text lowercase mb-3">Visual patterns</h4>
              <p className="text-[14px] text-gray-light font-medium leading-relaxed mb-6 flex-1">
                See how your mood changes over the week or month. It's a simple way to spot rhythms you might miss.
              </p>
              <div className="pt-4 border-t border-border flex items-center gap-2 text-[10px] font-black text-gray-nav uppercase">
                <CheckCircle2 size={14} className="text-green" /> Built-in Tracking
              </div>
            </div>

            <div className="col-span-1 p-8 rounded-[32px] border-2 border-border bg-white dark:bg-[#1E1E1E] shadow-3d-gray hover:shadow-lg transition-all flex flex-col group liquid-glass">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-6 group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300">
                <CalendarIcon size={24} />
              </div>
              <h4 className="text-[20px] font-display text-gray-text lowercase mb-3">Store what matters</h4>
              <p className="text-[14px] text-gray-light font-medium leading-relaxed mb-6 flex-1">
                Attach images, files, or tasks directly to your notes to keep your reflections complete.
              </p>
              <div className="pt-4 border-t border-border flex items-center gap-2 text-[10px] font-black text-gray-nav uppercase">
                <CheckCircle2 size={14} className="text-green" /> No storage limits
              </div>
            </div>

            {/* Premium / Horizon - Soft Light Leak Aura */}
            <div className="md:col-span-2 lg:col-span-3 mt-6 relative rounded-[40px] p-0 group overflow-hidden border-2 border-white/20 dark:border-[#2a2a2a] bg-white/40 dark:bg-[#121212]/40 backdrop-blur-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] transition-all">
              
              {/* Soft Light Leak */}
              <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue/10 dark:bg-blue/5 rounded-full blur-[80px] pointer-events-none transition-opacity duration-1000 group-hover:opacity-80"></div>
              <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-green/10 dark:bg-green/5 rounded-full blur-[80px] pointer-events-none transition-opacity duration-1000 group-hover:opacity-80"></div>
              
              {/* Content Wrapper */}
              <div className="relative h-full w-full p-10 rounded-[40px] z-10">
                
                <div className="flex items-center gap-4 mb-8 relative z-10">
                  <div className="h-14 w-14 rounded-2xl bg-blue/5 dark:bg-blue/10 text-blue flex items-center justify-center shadow-sm border border-blue/10 dark:border-blue/20">
                    <Sparkles size={26} opacity={0.9} />
                  </div>
                  <div>
                    <h3 className="text-[28px] font-display text-gray-text lowercase">the future: deeper paths</h3>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 dark:bg-white/5 border border-white/50 dark:border-white/10 text-gray-text text-[10px] font-black uppercase tracking-widest mt-1 shadow-sm backdrop-blur-sm">
                      <Lock size={12} className="text-blue opacity-80" /> Coming Soon
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 w-full">
                  <div className="bg-white/40 dark:bg-white/5 p-6 rounded-3xl border border-white/20 dark:border-white/10 backdrop-blur-md">
                    <h4 className="text-[18px] font-bold text-gray-text mb-3 flex items-center gap-2">
                      <Brain size={20} className="text-blue" /> Smart Reflections
                    </h4>
                    <p className="text-[15px] text-gray-light font-medium leading-relaxed">
                      AI reflections that help you spot patterns in your writing. Secure, compassionate, and fully private.
                    </p>
                  </div>
                  <div className="bg-white/40 dark:bg-white/5 p-6 rounded-3xl border border-white/20 dark:border-white/10 backdrop-blur-md">
                    <h4 className="text-[18px] font-bold text-gray-text mb-3 flex items-center gap-2">
                      <Shield size={20} className="text-green" /> Advanced Security
                    </h4>
                    <p className="text-[15px] text-gray-light font-medium leading-relaxed">
                      Two-factor authentication and extra layers of protection for your most intimate thoughts.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        <section className="mb-24 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-display text-gray-text lowercase mb-6 tracking-tight">using the sanctuary</h2>
            <p className="text-[18px] text-gray-light font-medium max-w-3xl mx-auto leading-relaxed">
              The best rituals are gentle and repeatable. These small tools are here to make your notes easier to return to, easier to understand later, and softer to live inside while you write.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[
              {
                icon: ImageIcon,
                title: 'cover images',
                tone: 'text-blue bg-blue/10',
                body: 'Covers make your journal easier to scan and recognize later. Match the atmospheric tension or the literal view of your day.'
              },
              {
                icon: Paperclip,
                title: 'attachments',
                tone: 'text-green bg-green/10',
                body: 'Attach photos or documents that belong to the story you are processing. Keeps the context all in one place.'
              },
              {
                icon: Tags,
                title: 'tags',
                tone: 'text-purple-500 bg-purple-500/10',
                body: 'Use simple, recurring themes (Work, Home, Health) to see the bigger picture of your journey.'
              },
              {
                icon: CheckSquare,
                title: 'tasks',
                tone: 'text-orange bg-orange/10',
                body: 'Capture caring actions like \'Drink water\' or \'Call home\' directly inside your notes. Use them for follow-through, not pressure.'
              },
              {
                icon: Headphones,
                title: 'ambient sound',
                tone: 'text-blue bg-blue/10',
                body: 'Use the headphone icon in the editor to quiet the room. Tap once to choose a sound, and again to turn it off.'
              },
              {
                icon: Target,
                title: 'daily spark',
                tone: 'text-green bg-green/10',
                body: 'Facing a blank page? Tap the spark button in the editor for a quick mindfulness prompt.'
              },
              {
                icon: Brain,
                title: 'ai reflection',
                tone: 'text-blue bg-blue/10',
                body: 'Get a mirror of your growth. Use it after you have written a few paragraphs to help spot patterns you might miss.'
              },
              {
                icon: BookOpen,
                title: 'insights',
                tone: 'text-green bg-green/10',
                body: 'Visit the Insights page to see your long-term moods, themes, and resilience over time.'
              },
              {
                icon: Compass,
                title: 'release',
                tone: 'text-purple-500 bg-purple-500/10',
                body: 'For the heavy stuff. Write it all out, then use \'Release\' to let the feeling go and move on.'
              }
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                className="rounded-[32px] border-2 border-border bg-white p-8 shadow-3d-gray liquid-glass"
              >
                <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-2xl ${item.tone}`}>
                  <item.icon size={22} />
                </div>
                <h3 className="mb-3 text-[22px] font-display lowercase text-gray-text">{item.title}</h3>
                <p className="text-[15px] font-medium leading-relaxed text-gray-light">
                  {item.body}
                </p>
              </motion.div>
            ))}
          </div>
        </section>



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
