import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Heart,
  TrendUp,
  Book,
  CaretRight,
  CircleNotch,
  Hash,
} from '@phosphor-icons/react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { MetadataPill } from '../../components/ui/MetadataPill';
import { PageContainer } from '../../components/ui/PageContainer';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Surface } from '../../components/ui/Surface';
import { LifeTheme, Note, RoutePath, WellnessAccess } from '../../types';
import { noteService } from '../../services/noteService';
import { wikiService } from '../../services/wikiService';
import { profileService } from '../../services/profileService';
import { ProUpgradeCTA } from '../../components/ui/ProUpgradeCTA';
import { FREE_WIKI_MINIMUM_ENTRIES, getWikiInsightsGate } from '../../services/wellnessPolicy';

const MOOD_TONE_CLASSES: Record<string, { label: string; track: string; fill: string }> = {
  happy: { label: 'text-orange', track: 'bg-orange/10', fill: 'bg-orange' },
  calm: { label: 'text-green', track: 'bg-green/10', fill: 'bg-green' },
  anxious: { label: 'text-blue', track: 'bg-blue/10', fill: 'bg-blue' },
  sad: { label: 'text-dark-blue', track: 'bg-dark-blue/10', fill: 'bg-dark-blue' },
  angry: { label: 'text-red', track: 'bg-red/10', fill: 'bg-red' },
  tired: { label: 'text-gray-light', track: 'bg-gray-light/20', fill: 'bg-gray-light' },
};

const DEFAULT_MOOD_TONE = {
  label: 'text-gray-light',
  track: 'bg-gray-light/20',
  fill: 'bg-gray-light',
};

const TAG_TONE_CLASSES = ['text-green', 'text-blue', 'text-orange', 'text-gray-text'];

export const Insights: React.FC = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [themes, setThemes] = useState<LifeTheme[]>([]);
  const [access, setAccess] = useState<WellnessAccess | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allNotes, allThemes, accessData] = await Promise.all([
          noteService.getAll(),
          wikiService.getAllThemes(),
          profileService.getWellnessAccess(),
        ]);

        setNotes(allNotes);
        setThemes(allThemes);
        setAccess(accessData);
      } catch (error) {
        console.error('[Insights] Failed to load data:', error);
      }
    };

    fetchData();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let monthNotes = 0;
    const daysSet = new Set<string>();
    const moodCounts: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};
    let wordsWritten = 0;

    notes.forEach((note) => {
      const date = new Date(note.createdAt);
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        monthNotes += 1;
        daysSet.add(date.toDateString());
      }

      if (note.mood) {
        moodCounts[note.mood] = (moodCounts[note.mood] || 0) + 1;
      }

      if (note.tags) {
        note.tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }

      const plainText = note.content.replace(/<[^>]*>/g, ' ').trim();
      wordsWritten += plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
    });

    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'undefined';
    const moodData = Object.entries(moodCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      monthNotes,
      totalNotes: notes.length,
      daysCheckedIn: daysSet.size,
      topMood,
      moodData,
      topTags,
      wordsWritten,
    };
  }, [notes]);

  const wikiGate = useMemo(() => {
    if (!access) return null;
    return getWikiInsightsGate(access, notes.length);
  }, [access, notes.length]);

  const isWikiReadyToBuild = Boolean(
    wikiGate?.canGenerate && notes.length >= FREE_WIKI_MINIMUM_ENTRIES && themes.length === 0,
  );

  const handleOpenSanctuary = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      navigate(RoutePath.SANCTUARY, { state: { fromInsights: true } });
    }, 3500);
  };

  return (
    <>
      <div className={`transition-opacity duration-1000 ${isTransitioning ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'}`}>
        <PageContainer className="pb-24 pt-4 md:pt-8">
        <div className="space-y-10">
          <div className="sticky-bar">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-gray-nav hover:text-gray-text font-bold text-[12px]"
              >
                <ArrowLeft className="mr-2 h-5 w-5 shrink-0" weight="bold" />
                Back
              </Button>
              <MetadataPill icon={<Calendar size={12} weight="bold" />} tone="green">
                {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
              </MetadataPill>
            </div>
          </div>

          <SectionHeader
            title="Patterns in your writing"
            description="Mood, rhythm, and recurring themes"
          />

          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
            <Surface variant="bezel" innerClassName="p-8 md:p-10">
              <div className="flex flex-col gap-8">
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div className="space-y-3">
                    <MetadataPill tone="green">Writing rhythm</MetadataPill>
                    <h2 className="text-3xl md:text-4xl font-display text-gray-text tracking-tight">
                      {stats.monthNotes} reflections this month
                    </h2>
                    <p className="max-w-xl text-[15px] font-medium leading-relaxed text-gray-light">
                      You checked in on {stats.daysCheckedIn} different days, and the current emotional tone leans{' '}
                      <span className="capitalize text-green font-bold">
                        {stats.topMood === 'undefined' ? 'toward clarity' : stats.topMood}
                      </span>
                      .
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <MetadataPill icon={<Calendar size={13} weight="bold" />} tone="green">
                      {stats.totalNotes} total notes
                    </MetadataPill>
                    <MetadataPill icon={<Book size={13} weight="bold" />} tone="green">
                      {stats.wordsWritten.toLocaleString()} words written
                    </MetadataPill>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-[var(--radius-panel)] border border-border bg-white/5 p-5">
                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-nav">This month</p>
                    <p className="mt-3 text-4xl font-display text-gray-text">{stats.monthNotes}</p>
                    <p className="mt-2 text-[12px] font-medium text-gray-light">entries written recently</p>
                  </div>
                  <div className="rounded-[var(--radius-panel)] border border-border bg-white/5 p-5">
                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-nav">Check-in days</p>
                    <p className="mt-3 text-4xl font-display text-gray-text">{stats.daysCheckedIn}</p>
                    <p className="mt-2 text-[12px] font-medium text-gray-light">days you made space to write</p>
                  </div>
                  <div className="rounded-[var(--radius-panel)] border border-border bg-white/5 p-5">
                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-nav">Words written</p>
                    <p className="mt-3 text-4xl font-display text-gray-text">{stats.wordsWritten.toLocaleString()}</p>
                    <p className="mt-2 text-[12px] font-medium text-gray-light">words saved across your notes</p>
                  </div>
                </div>
              </div>
            </Surface>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              <Surface variant="flat" className="overflow-hidden">
                <div className="flex h-full flex-col gap-4 p-6">
                  <Heart size={24} weight="duotone" className="text-green opacity-80" />
                  <p className="text-[11px] font-black uppercase tracking-widest text-gray-nav">Prevalent mood</p>
                  <p className="text-3xl font-display text-gray-text capitalize">
                    {stats.topMood === 'undefined' ? 'Unlabeled' : stats.topMood}
                  </p>
                  <p className="text-[13px] font-medium text-gray-light">
                    The feeling showing up most often across your reflections.
                  </p>
                </div>
              </Surface>

              <Surface variant="flat" className="overflow-hidden">
                <div className="flex h-full flex-col gap-4 p-6">
                  <TrendUp size={24} weight="duotone" className="text-green opacity-80" />
                  <p className="text-[11px] font-black uppercase tracking-widest text-gray-nav">Library growth</p>
                  <p className="text-3xl font-display text-gray-text">{themes.length}</p>
                  <p className="text-[13px] font-medium text-gray-light">
                    themes currently captured in your personal life wiki.
                  </p>
                </div>
              </Surface>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Surface variant="bezel" innerClassName="p-8">
              <h3 className="text-[18px] font-display text-gray-text mb-6">Mood frequency</h3>
              {stats.moodData.length === 0 ? (
                <EmptyState
                  surface="none"
                  icon={<Heart size={22} weight="duotone" />}
                  title="Mood labels will start to form a pattern here."
                  description="Add moods to your reflections and this panel will stay soft and readable."
                />
              ) : (
                <div className="flex flex-col gap-4">
                  {stats.moodData.map((entry) => {
                    const maxValue = stats.moodData[0].value;
                    const percent = Math.round((entry.value / maxValue) * 100);
                    const tone = MOOD_TONE_CLASSES[entry.name] || DEFAULT_MOOD_TONE;

                    return (
                      <div key={entry.name} className="flex items-center gap-4">
                        <span className={`w-16 shrink-0 text-[11px] font-black capitalize tracking-widest ${tone.label}`}>
                          {entry.name}
                        </span>
                        <div className={`relative h-8 flex-1 overflow-hidden rounded-full ${tone.track}`}>
                          <div
                            className={`absolute inset-y-0 left-0 rounded-full ${tone.fill}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-6 shrink-0 text-right text-[12px] font-extrabold text-gray-nav">
                          {entry.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Surface>

            <Surface variant="bezel" innerClassName="p-8">
              <h3 className="text-[18px] font-display text-gray-text mb-6">Recurring tags</h3>
              {stats.topTags.length === 0 ? (
                <EmptyState
                  surface="none"
                  icon={<Hash size={22} weight="duotone" />}
                  title="Tags will appear here."
                  description="As you tag your entries, this view will help you spot recurring subjects."
                />
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  {stats.topTags.map(([tag, count], index) => {
                    const scale = Math.min(1.75, Math.max(0.92, count / 2.4));
                    return (
                      <span
                        key={tag}
                        className={`font-display lowercase ${TAG_TONE_CLASSES[index % TAG_TONE_CLASSES.length]}`}
                        style={{
                          fontSize: `${scale}rem`,
                          lineHeight: '1',
                        }}
                      >
                        #{tag}
                      </span>
                    );
                  })}
                </div>
              )}
            </Surface>
          </div>

          <Surface
            variant="flat"
            className={`overflow-hidden border transition-all duration-500 ${isTransitioning ? 'border-green/40 bg-green/5' : 'border-transparent hover:border-green/20'}`}
          >
            <button
              onClick={handleOpenSanctuary}
              className="group flex w-full flex-col items-center justify-between gap-8 p-8 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-green/40 md:flex-row md:p-12"
              aria-label="Open your Life Wiki"
              disabled={isTransitioning}
            >
              <div className="space-y-4">
                {isWikiReadyToBuild ? (
                  <div className="h-24 w-24 overflow-hidden rounded-[var(--radius-panel)] bg-green/5">
                    <DotLottieReact src="/assets/lottie/Level%20Up%20Animation.json" autoplay loop />
                  </div>
                ) : (
                  <div className="icon-block icon-block-md">
                    <Book size={26} weight="duotone" />
                  </div>
                )}
                <h2 className="text-2xl font-display text-gray-text">
                  {isWikiReadyToBuild ? 'Your wiki is ready for insights' : 'Your Life Wiki'}
                </h2>
                <p className="text-gray-light max-w-lg leading-relaxed">
                  {isWikiReadyToBuild
                    ? 'You have enough writing to build your first Life Wiki refresh when you choose.'
                    : 'A private reading room where AI-generated wiki pages stay grounded in your saved notes.'}
                </p>
              </div>
              
              <div className="shrink-0 flex items-center justify-center h-12 px-6 rounded-[var(--radius-control)] bg-white/5 border border-border group-hover:bg-green/10 group-hover:border-green/30 group-hover:text-green transition-all duration-300 text-gray-text font-black text-[13px] uppercase tracking-widest relative overflow-hidden">
                <span 
                  className={`flex items-center transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${isTransitioning ? '-translate-y-12 opacity-0' : 'translate-y-0 opacity-100'}`}
                  style={{ willChange: 'transform, opacity' }}
                >
                  Open Sanctuary
                  <CaretRight size={16} weight="bold" className="ml-2" />
                </span>
                <span 
                  className={`absolute inset-0 flex items-center justify-center text-green transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${isTransitioning ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}
                  style={{ willChange: 'transform, opacity' }}
                >
                  <CircleNotch size={20} weight="bold" className="animate-spin" />
                </span>
              </div>
            </button>
          </Surface>

          {access?.planTier !== 'pro' && (
            <div className="pt-4">
              <ProUpgradeCTA />
            </div>
          )}
        </div>
      </PageContainer>
      </div>

      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-body"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center gap-8 px-6"
            >
              <div className="h-32 w-32 overflow-hidden rounded-[var(--radius-panel)] bg-green/5 border border-green/10 shadow-xl flex items-center justify-center">
                <DotLottieReact src="/assets/lottie/Level%20Up%20Animation.json" autoplay loop />
              </div>
              <div className="text-center space-y-3">
                <h2 className="text-3xl md:text-4xl font-serif italic text-gray-text">
                  Preparing your Sanctuary
                </h2>
                <p className="text-[16px] text-gray-light max-w-xs mx-auto leading-relaxed">
                  Synthesizing your reflections and finding the patterns...
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
