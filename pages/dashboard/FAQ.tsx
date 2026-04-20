import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import { 
  Heart, 
  Sparkle, 
  Brain, 
  ShieldCheck, 
  CloudSun, 
  PenNib, 
  Tag, 
  Calendar, 
  Checks, 
  LockKey, 
  ArrowRight, 
  BookOpen, 
  Compass, 
  CheckCircle, 
  Paperclip, 
  Image as ImageIcon, 
  Headphones, 
  Target, 
  Microphone 
} from '@phosphor-icons/react';

import Spline from '@splinetool/react-spline';
import { RoutePath } from '../../types';
import { Button } from '../../components/ui/Button';

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.32, 0.72, 0, 1] } },
};

export const FAQ: React.FC = () => {
  const navigate = useNavigate();
  const journeyRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: journeyScroll } = useScroll({
    target: journeyRef,
    offset: ["start end", "end start"]
  });

  const splineScale = useTransform(journeyScroll, [0, 0.5, 1], [0.8, 1, 0.9]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative min-h-screen bg-body text-gray-text pb-32 transition-colors duration-300">
      
      {/* Editorial Hero */}
      <section className="relative z-10 w-full max-w-[1440px] mx-auto px-6 pt-32 pb-24 lg:pt-48">
        <div className="grid lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-8">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green/5 border border-green/10 text-green text-[11px] font-bold uppercase tracking-widest mb-8">
                <Heart size={14} weight="fill" className="animate-pulse" />
                <span>The Sanctuary Protocol</span>
              </div>
              
              <h1 className="font-display tracking-tighter leading-[0.9] text-gray-text mb-10" style={{ fontSize: 'clamp(48px, 8vw, 110px)' }}>
                Untangle your <br />
                <span className="font-serif italic text-green">thoughts.</span>
              </h1>
              
              <p className="text-[20px] sm:text-[24px] font-serif leading-relaxed text-gray-light max-w-2xl">
                Racing thoughts and mental clutter shouldn't be your default state. Journaling is the first step toward clarity.
              </p>
            </motion.div>
          </div>
          <div className="lg:col-span-4 hidden lg:block">
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 1 }}
              className="text-[14px] font-medium leading-relaxed text-gray-nav border-l border-border pl-6"
            >
              We live in a world designed to distract. Reflections is designed to ground you. A private space to breathe, reflect, and grow.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Cinematic Spline Moment */}
      <section className="relative z-10 w-full px-6 mb-40 overflow-hidden">
        <motion.div 
          style={{ scale: splineScale }}
          className="w-full h-[50vh] min-h-[400px] rounded-[48px] overflow-hidden bg-white/5 dark:bg-white/2 relative group"
        >
          <div className="absolute inset-0 z-0 flex items-center justify-center">
            <Spline scene="/assets/spline/r_4_x_bot.spline" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-body/40 via-transparent to-body/40 pointer-events-none" />
        </motion.div>
      </section>

      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6" ref={journeyRef}>

        {/* Asymmetrical Bento: The Journey */}
        <section className="mb-48">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-20">
            <div>
              <h2 className="text-[40px] md:text-[64px] font-display tracking-tight text-gray-text leading-none mb-4">The journey</h2>
              <p className="text-[16px] md:text-[18px] text-gray-light font-serif italic">A practice of healing, one reflection at a time.</p>
            </div>
            <div className="h-[1px] flex-grow bg-border hidden lg:block mb-6 mx-12 opacity-50" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: CloudSun,
                title: "Morning or night",
                desc: "Start your day with an intention or end it by clearing your head. Write whenever it fits your rhythm.",
                span: "col-span-1",
                color: "bg-green/5 text-green"
              },
              {
                icon: PenNib,
                title: "The daily spark",
                desc: "Facing a blank page? Tap the spark for a gentle, context-aware prompt to get the words moving.",
                span: "col-span-1 md:col-span-2 lg:col-span-1",
                color: "bg-blue/5 text-blue"
              },
              {
                icon: Tag,
                title: "Focus on the flow",
                desc: "Use Focus Mode to let the UI fade away. It’s just you and your thoughts, without the digital noise.",
                span: "col-span-1",
                color: "bg-green/5 text-green"
              },
              {
                icon: Heart,
                title: "Check your mood",
                desc: "Name how you feel. It's the first step to understanding your own emotional patterns.",
                span: "col-span-1",
                color: "bg-purple-500/5 text-purple-500"
              }
            ].map((item, i) => (
              <motion.div 
                key={i}
                variants={staggerItem}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-50px" }}
                className={`${item.span} bezel-outer group`}
              >
                <div className="bezel-inner p-8 flex flex-col h-full min-h-[280px]">
                  <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500`}>
                    <item.icon size={24} weight="bold" />
                  </div>
                  <h3 className="text-[24px] font-display text-gray-text mb-4 leading-tight">{item.title}</h3>
                  <p className="text-[15px] font-medium text-gray-light leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* The Toolkit: Bento Grid */}
        <section className="mb-48">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-[40px] md:text-[64px] font-display tracking-tight text-gray-text leading-none mb-6">The toolkit</h2>
            <p className="text-[18px] text-gray-light font-serif italic leading-relaxed">
              Essential tools designed to support your journey. High-fidelity utility without the noise.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Privacy Card - Large */}
            <div className="md:col-span-8 bezel-outer group">
              <div className="bezel-inner p-10 flex flex-col md:flex-row gap-10 items-center">
                <div className="w-20 h-20 rounded-[28px] bg-blue/5 text-blue flex items-center justify-center shrink-0">
                  <ShieldCheck size={40} weight="duotone" />
                </div>
                <div>
                  <h4 className="text-[28px] font-display text-gray-text mb-4">It's 100% private</h4>
                  <p className="text-[16px] text-gray-light font-medium leading-relaxed mb-6">
                    We can't read your notes. Your data is stored securely on Supabase and encrypted in your local sanctuary. You own your thoughts.
                  </p>
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-green">
                    <CheckCircle size={16} weight="fill" /> Secure & Offline-first
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Patterns - Small */}
            <div className="md:col-span-4 bezel-outer group">
              <div className="bezel-inner p-10 flex flex-col justify-between">
                <Heart size={32} weight="bold" className="text-green mb-10" />
                <div>
                  <h4 className="text-[22px] font-display text-gray-text mb-3">Visual patterns</h4>
                  <p className="text-[14px] text-gray-light font-medium leading-relaxed">
                    Spot emotional rhythms over time with intuitive mood mapping.
                  </p>
                </div>
              </div>
            </div>

            {/* Storage - Small */}
            <div className="md:col-span-4 bezel-outer group">
              <div className="bezel-inner p-10 flex flex-col justify-between">
                <Calendar size={32} weight="bold" className="text-purple-500 mb-10" />
                <div>
                  <h4 className="text-[22px] font-display text-gray-text mb-3">Store what matters</h4>
                  <p className="text-[14px] text-gray-light font-medium leading-relaxed">
                    Infinite attachments for images, tasks, and reflections.
                  </p>
                </div>
              </div>
            </div>

            {/* Sanctuary Intelligence - Large */}
            <div className="md:col-span-8 bezel-outer group">
              <div className="bezel-inner p-10 overflow-hidden relative">
                {/* Decorative light leak */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-green/10 rounded-full blur-[80px] pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row gap-10">
                  <div className="w-20 h-20 rounded-[28px] bg-green/5 text-green flex items-center justify-center shrink-0">
                    <Sparkle size={40} weight="fill" className="animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-[28px] font-display text-gray-text mb-4">Sanctuary intelligence</h4>
                    <p className="text-[16px] text-gray-light font-medium leading-relaxed mb-8">
                      We use Google Gemini to process reflections without ever storing your data for training. The "Life Wiki" identifies patterns so you can see your narrative evolve.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-white/5 border border-border">
                        <span className="text-[12px] font-bold text-gray-text">Private AI</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-border">
                        <span className="text-[12px] font-bold text-gray-text">Theme Mapping</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid: Detail List */}
        <section className="mb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
            {[
              { icon: Headphones, title: 'Ambient sound', body: 'Generative sounds to quiet the room. Cross-fade between moods.' },
              { icon: Microphone, title: 'Whisper mode', body: 'Speak your thoughts directly. Instant, private transcription.' },
              { icon: Target, title: 'Contextual sparks', body: 'Prompts that understand your history and guide your present.' },
              { icon: ImageIcon, title: 'Visual covers', body: 'Set the tone of your entries with atmospheric cinematic imagery.' },
              { icon: Checks, title: 'Embedded tasks', body: 'Track intentions and follow-ups directly inside your prose.' },
              { icon: Compass, title: 'Insights engine', body: 'Deep analytics on your resilience and growth patterns.' }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col gap-6"
              >
                <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-green">
                  <item.icon size={20} weight="bold" />
                </div>
                <div>
                  <h3 className="text-[18px] font-bold text-gray-text mb-2 uppercase tracking-widest">{item.title}</h3>
                  <p className="text-[14px] font-medium leading-relaxed text-gray-light">
                    {item.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

      </div>

      {/* Floating CTA Pill */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-8 right-8 z-[100]"
      >
        <button
          onClick={() => navigate(RoutePath.SIGNUP)}
          className="group flex items-center gap-4 pl-6 pr-2 py-2 rounded-full bg-white dark:bg-[#1E1E1E] border border-black/5 dark:border-white/5 text-[14px] font-bold text-gray-text shadow-xl backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]"
        >
          Begin writing
          <div className="w-10 h-10 rounded-full bg-green text-white flex items-center justify-center transition-transform duration-500 group-hover:rotate-12">
            <ArrowRight size={18} weight="bold" />
          </div>
        </button>
      </motion.div>

    </div>
  );
};
