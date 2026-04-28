import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  Heart,
  Book,
  CaretRight,
  Hash,
} from '@phosphor-icons/react';
import { DotLottieReact, type DotLottie } from '@lottiefiles/dotlottie-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { MetadataPill } from '../../components/ui/MetadataPill';
import { PageContainer } from '../../components/ui/PageContainer';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Surface } from '../../components/ui/Surface';
import { LifeTheme, Note, RoutePath, WellnessAccess } from '../../types';
import { noteService } from '../../services/noteService';
import { wikiService } from '../../services/wikiService';
import { profileService } from '../../services/profileService';
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
const SANCTUARY_ENTRANCE_LOTTIE = '/assets/lottie/Level%20Up%20Animation.json';
const SANCTUARY_ENTRANCE_FALLBACK_MS = 2200;

export const Insights: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [notes, setNotes] = useState<Note[]>([]);
  const [themes, setThemes] = useState<LifeTheme[]>([]);
  const [access, setAccess] = useState<WellnessAccess | null>(null);
  const [isOpeningSanctuary, setIsOpeningSanctuary] = useState(false);
  const isOpeningSanctuaryRef = useRef(false);
  const openingTimerRef = useRef<number | null>(null);

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

  const completeOpenSanctuary = useCallback(() => {
    if (!isOpeningSanctuaryRef.current) return;

    isOpeningSanctuaryRef.current = false;
    if (openingTimerRef.current !== null) {
      window.clearTimeout(openingTimerRef.current);
      openingTimerRef.current = null;
    }

    navigate(RoutePath.SANCTUARY);
  }, [navigate]);

  const handleOpenSanctuary = useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (isOpeningSanctuaryRef.current) return;

    if (shouldReduceMotion) {
      navigate(RoutePath.SANCTUARY);
      return;
    }

    isOpeningSanctuaryRef.current = true;
    setIsOpeningSanctuary(true);
    openingTimerRef.current = window.setTimeout(completeOpenSanctuary, SANCTUARY_ENTRANCE_FALLBACK_MS);
  }, [completeOpenSanctuary, navigate, shouldReduceMotion]);

  const bindSanctuaryEntrancePlayer = useCallback((dotLottie: DotLottie | null) => {
    if (!dotLottie) return;
    dotLottie.addEventListener('complete', completeOpenSanctuary);
  }, [completeOpenSanctuary]);

  useEffect(() => {
    return () => {
      if (openingTimerRef.current !== null) {
        window.clearTimeout(openingTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {isOpeningSanctuary ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-body px-6"
            aria-live="polite"
            aria-label="Opening Sanctuary"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,oklch(0.70_0.05_135_/_0.16),transparent_54%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-green/10 via-body/95 to-body" />
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 0.2, scale: 1 }}
              transition={{ delay: 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center mix-blend-luminosity"
            >
              <div className="h-[min(66vmin,34rem)] w-[min(66vmin,34rem)]">
                <DotLottieReact
                  src={SANCTUARY_ENTRANCE_LOTTIE}
                  autoplay
                  loop={false}
                  dotLottieRefCallback={bindSanctuaryEntrancePlayer}
                />
              </div>
            </motion.div>
            <motion.div
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.12, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 flex max-w-[42rem] flex-col items-center text-center"
            >
              <p className="text-[11px] font-black uppercase tracking-widest text-green">
                Private reading room
              </p>
              <h2 className="mt-4 text-4xl font-display font-bold leading-tight text-gray-text md:text-5xl">
                Opening Sanctuary
              </h2>
              <p className="mt-4 max-w-[36ch] text-[15px] font-medium leading-relaxed text-gray-light">
                Crossing into the library without breaking the calm of the page.
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <PageContainer className="pb-24 pt-6 md:pt-10">
        <div className="space-y-10">
          <button 
            onClick={() => navigate(RoutePath.HOME)}
            className="flex items-center gap-2 text-[13px] font-bold text-gray-nav hover:text-green transition-colors w-fit"
            aria-label="Back to home"
          >
            <ArrowLeft size={16} weight="bold" />
            <span>Back</span>
          </button>

          <SectionHeader
            title="Patterns in your writing"
            description="Mood, rhythm, and recurring themes"
            className="insights-section-header"
          />

          <Surface variant="bezel" innerClassName="p-8 md:p-12">
            <div className="flex flex-col gap-6 md:gap-8">
              <div className="flex flex-wrap items-center gap-2">
                <MetadataPill icon={<Book size={13} weight="bold" />}>
                  {stats.wordsWritten.toLocaleString()} words written
                </MetadataPill>
              </div>
              
              <div className="space-y-4 max-w-2xl">
                <h2 className="whitespace-nowrap text-2xl sm:text-3xl md:text-5xl font-display font-extrabold text-gray-text tracking-normal leading-tight">
                  This month: {stats.monthNotes} reflections.
                </h2>
                <p className="text-[18px] md:text-[20px] font-serif italic text-gray-light leading-relaxed">
                  You checked in on {stats.daysCheckedIn} different days, and the current emotional tone leans{' '}
                  <span className="capitalize text-green font-bold not-italic">
                    {stats.topMood === 'undefined' ? 'toward clarity' : stats.topMood}
                  </span>
                  .
                </p>
              </div>
            </div>
          </Surface>

          <div className="grid gap-6 md:grid-cols-2">
            <Surface variant="bezel" innerClassName="p-8">
              <h3 className="text-[18px] font-display font-bold text-gray-text mb-6">Mood frequency</h3>
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
              <h3 className="text-[18px] font-display font-bold text-gray-text mb-6">Recurring tags</h3>
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
                        className={`font-display font-bold lowercase ${TAG_TONE_CLASSES[index % TAG_TONE_CLASSES.length]}`}
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
            className="overflow-hidden border border-transparent transition-all duration-500 hover:border-green/20"
          >
            <Link
              to={RoutePath.SANCTUARY}
              state={{ fromInsights: true }}
              onClick={handleOpenSanctuary}
              className="group flex w-full flex-col items-center justify-between gap-8 p-8 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-green/40 md:flex-row md:p-12"
              aria-label="Open your Life Wiki"
              aria-busy={isOpeningSanctuary}
            >
              <div className="space-y-4">
                {isWikiReadyToBuild ? (
                  <div className="h-24 w-24 overflow-hidden rounded-[var(--radius-panel)] bg-green/5">
                    <DotLottieReact src={SANCTUARY_ENTRANCE_LOTTIE} autoplay loop />
                  </div>
                ) : (
                  <div className="icon-block icon-block-md">
                    <Book size={26} weight="duotone" />
                  </div>
                )}
                <h2 className="text-2xl font-display font-bold text-gray-text">
                  {isWikiReadyToBuild ? 'Your wiki is ready for insights' : 'Your Life Wiki'}
                </h2>
                <p className="text-gray-light max-w-lg leading-relaxed">
                  {isWikiReadyToBuild
                    ? 'You have enough writing to build your first Life Wiki refresh when you choose.'
                    : 'A private reading room where AI-generated wiki pages stay grounded in your saved notes.'}
                </p>
              </div>
              
              <div className="relative flex h-12 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-control)] border border-green bg-green text-white px-6 text-[13px] font-black uppercase tracking-widest transition-all duration-300 group-hover:bg-green/90 group-hover:shadow-lg group-hover:shadow-green/20">
                Open Sanctuary
                <CaretRight size={16} weight="bold" className="ml-2 transition-transform duration-500 ease-out-expo group-hover:translate-x-1" />
              </div>
            </Link>
          </Surface>
        </div>
      </PageContainer>
    </>
  );
};
