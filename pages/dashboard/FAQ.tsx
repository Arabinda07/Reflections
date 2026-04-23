import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import { 
  Heart, 
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
  Microphone,
  Feather
} from '@phosphor-icons/react';

import { RoutePath } from '../../types';
import { Button } from '../../components/ui/Button';
import { Magnetic } from '../../components/ui/Magnetic';

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

export const FAQ: React.FC = () => {
  const navigate = useNavigate();
  const journeyRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: journeyRef,
    offset: ["start end", "end start"]
  });
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -30]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -60]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative min-h-full bg-body text-gray-text pb-32 transition-colors duration-300">
      
      {/* Editorial Hero */}
      <section className="relative z-10 w-full max-w-[1440px] mx-auto px-6 py-24 lg:py-32">
        <div className="grid lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-8">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="text-mk-display font-display tracking-tight text-gray-text mb-10">
                Untangle your <br />
                <span className="font-serif italic text-green">thoughts.</span>
              </h1>
              
              <p className="text-mk-body font-serif text-gray-light max-w-2xl">
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



      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6" ref={journeyRef}>

        {/* Asymmetrical Bento: The Journey */}
        <section className="mb-48">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-20">
            <div>
              <h2 className="text-mk-h2 font-display text-gray-text mb-4">The practice</h2>
              <p className="text-mk-body font-serif italic text-gray-light">A space to heal, one reflection at a time.</p>
            </div>
            <div className="h-[1px] flex-grow bg-border hidden lg:block mb-6 mx-12 opacity-50" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {[
              {
                icon: CloudSun,
                title: "Morning or night",
                desc: "Set an intention for the day or clear your head before sleep. Write whenever you find your rhythm.",
                gridSpan: "md:col-span-8 lg:col-span-7",
                color: "bg-green/5 text-green"
              },
              {
                icon: PenNib,
                title: "The daily spark",
                desc: "If you're staring at a blank page, tap the spark. It's a gentle nudge to help you get started.",
                gridSpan: "md:col-span-4 lg:col-span-5",
                color: "bg-green/5 text-green"
              },
              {
                icon: Tag,
                title: "Just you and the page",
                desc: "Focus Mode lets the interface fade away. No distractions, just your thoughts.",
                gridSpan: "md:col-span-5 lg:col-span-5",
                color: "bg-green/5 text-green"
              },
              {
                icon: Heart,
                title: "Naming the feeling",
                desc: "Check in with your mood. It's how you start noticing the patterns in your emotional life.",
                gridSpan: "md:col-span-7 lg:col-span-7",
                color: "bg-green/5 text-green"
              }
            ].map((item, i) => (
              <motion.div 
                key={i}
                variants={staggerItem}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-50px" }}
                className={`${item.gridSpan} group border-t border-border pt-10`}
              >
                <div className="flex flex-col h-full min-h-[280px] transition-colors duration-500">
                  <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center mb-10 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 ease-out-expo`}>
                    <item.icon size={24} weight="light" />
                  </div>
                  <h3 className="text-[24px] font-display text-gray-text mb-4 leading-tight">{item.title}</h3>
                  <p className="text-mk-body font-serif text-gray-light max-w-sm">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mb-48">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-20">
            <div className="max-w-3xl">
              <h2 className="text-mk-h2 font-display text-gray-text mb-6">The details</h2>
              <p className="text-mk-body font-serif italic text-gray-light">
                Tools built to support you without getting in the way.
              </p>
            </div>
            <div className="h-[1px] flex-grow bg-border hidden lg:block mb-6 mx-12 opacity-50" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Privacy Card - Large */}
            <div className="md:col-span-8 bezel-outer group">
              <div className="bezel-inner p-10 flex flex-col md:flex-row gap-10 items-center transition-colors duration-500 hover:bg-green/[0.02]">
                <div className="w-20 h-20 rounded-[32px] bg-green/5 text-green flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 ease-out-expo">
                  <ShieldCheck size={40} weight="light" />
                </div>
                <div>
                  <h4 className="text-[28px] font-display text-gray-text mb-4">It's 100% private</h4>
                  <p className="text-mk-body font-serif text-gray-light mb-6">
                    We can't read your notes. They are stored securely and encrypted in your private space. You own your thoughts, period.
                  </p>
                  <div className="label-caps !text-green flex items-center gap-2">
                    <CheckCircle size={16} weight="fill" /> Secure & Offline-first
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Patterns - Small */}
            <div className="md:col-span-4 bezel-outer group">
              <div className="bezel-inner p-10 flex flex-col justify-between transition-colors duration-500 hover:bg-green/[0.02]">
                <Heart size={32} weight="light" className="text-green mb-10 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 origin-bottom-left ease-out-expo" />
                <div>
                  <h4 className="text-[22px] font-display text-gray-text mb-3">Notice the rhythm</h4>
                  <p className="text-mk-body font-serif text-gray-light">
                    See how your feelings shift over time with simple mood mapping.
                  </p>
                </div>
              </div>
            </div>

            {/* Storage - Small */}
            <div className="md:col-span-4 bezel-outer group">
              <div className="bezel-inner p-10 flex flex-col justify-between transition-colors duration-500 hover:bg-green/[0.02]">
                <Calendar size={32} weight="light" className="text-green mb-10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 origin-bottom-left ease-out-expo" />
                <div>
                  <h4 className="text-[22px] font-display text-gray-text mb-3">Keep what matters</h4>
                  <p className="text-mk-body font-serif text-gray-light">
                    Attach images, tasks, and notes as you need them.
                  </p>
                </div>
              </div>
            </div>

            {/* Guided Support - Large */}
            <div className="md:col-span-8 bezel-outer group">
              <div className="bezel-inner p-10 overflow-hidden relative transition-colors duration-500 hover:bg-green/[0.02]">
                {/* Decorative light leak */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-green/10 rounded-full blur-[80px] pointer-events-none transition-transform duration-1000 group-hover:scale-150" />
                
                <div className="relative z-10 flex flex-col md:flex-row gap-10">
                  <div className="w-20 h-20 rounded-[32px] bg-green/5 text-green flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500 ease-out-expo">
                    <Brain size={40} weight="light" />
                  </div>
                  <div>
                    <h4 className="text-[28px] font-display text-gray-text mb-4">Optional AI support</h4>
                    <p className="text-mk-body font-serif text-gray-light mb-8">
                      If you want it, Reflections can help summarize patterns or refresh your Life Wiki. It never runs in the background, and we don't use your data to train models.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-white/5 border border-border">
                        <span className="label-caps">On demand only</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-border">
                        <span className="label-caps">Private by design</span>
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
              { icon: Headphones, title: 'Ambient sound', body: 'Soundscapes to help you focus. Quiet the room as you write.' },
              { icon: Microphone, title: 'Whisper mode', body: 'Speak your thoughts. Fast, private transcription when you need it.' },
              { icon: Target, title: 'Writing sparks', body: 'Gentle prompts for those days when you aren\'t sure where to start.' },
              { icon: ImageIcon, title: 'Visual covers', body: 'Add atmospheric imagery to set the mood of your entries.' },
              { icon: Checks, title: 'Embedded tasks', body: 'Keep track of follow-ups and intentions right inside your prose.' },
              { icon: Compass, title: 'Life Wiki', body: 'A high-level summary of your world, updated only when you ask.' }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-6 group cursor-default"
              >
                <div className="w-12 h-12 rounded-2xl bg-green/5 border border-green/10 flex items-center justify-center text-green group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 ease-out-expo">
                  <item.icon size={24} weight="light" />
                </div>
                <div>
                  <h3 className="label-caps mb-3">{item.title}</h3>
                  <p className="text-mk-body font-serif text-gray-light">
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
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed z-[100]"
        style={{ bottom: 'calc(2rem + env(safe-area-inset-bottom))', right: '2rem' }}
      >
        <Magnetic strength={30}>
          <button
            onClick={() => navigate(RoutePath.SIGNUP)}
            className="group flex items-center justify-center w-14 h-14 rounded-full bg-green text-white shadow-[0_16px_32px_-8px_rgba(22,163,74,0.5)] transition-transform duration-300 hover:scale-110 active:scale-95"
            aria-label="Begin writing"
          >
            <PenNib size={24} weight="fill" className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </Magnetic>
      </motion.div>

    </div>
  );
};
