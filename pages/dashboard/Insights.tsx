import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  Heart,
  Book,
  CaretRight,
  CalendarCheck,
  Hash,
} from '@phosphor-icons/react';
import { DotLottieReact, type DotLottie } from '@lottiefiles/dotlottie-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { CompletionCardActions } from '../../components/ui/CompletionCardActions';
import { MetadataPill } from '../../components/ui/MetadataPill';
import { PageContainer } from '../../components/ui/PageContainer';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Surface } from '../../components/ui/Surface';
import { Accordion } from '../../components/ui/Accordion';
import { WeeklyRecapLoadingSkeleton } from '../../components/ui/skeletons/WeeklyRecapLoadingSkeleton';
import { LifeTheme, MoodCheckin, Note, RitualEvent, RoutePath, WellnessAccess } from '../../types';
import { noteService } from '../../services/noteService';
import { wikiService } from '../../services/wikiService';
import { profileService } from '../../services/profileService';
import { FREE_WIKI_MINIMUM_ENTRIES, getWikiInsightsGate } from '../../services/wellnessPolicy';
import { buildWeeklyRecap } from '../../services/weeklyRecapService';
import { moodCheckinService, ritualEventService } from '../../services/engagementServices';
import { buildCompletionCardPayload } from '../../services/completionCardPayload';
import { DEFAULT_MOOD_TONE, getMoodConfig } from './moodConfig';

const TAG_TONE_CLASSES = ['text-green', 'text-green/80', 'text-green/70', 'text-green/60'];
const SANCTUARY_ENTRANCE_LOTTIE = '/assets/lottie/Level%20Up%20Animation.json';
const SANCTUARY_ENTRANCE_FALLBACK_MS = 2200;

const getWeekSignalSince = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start.toISOString();
};

export const Insights: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [notes, setNotes] = useState<Note[]>([]);
  const [themes, setThemes] = useState<LifeTheme[]>([]);
  const [moodCheckins, setMoodCheckins] = useState<MoodCheckin[]>([]);
  const [ritualEvents, setRitualEvents] = useState<RitualEvent[]>([]);
  const [access, setAccess] = useState<WellnessAccess | null>(null);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [isMoodOpen, setIsMoodOpen] = useState(false);
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [isCompletionOpen, setIsCompletionOpen] = useState(false);
  const [cardTitle, setCardTitle] = useState('');
  const [isOpeningSanctuary, setIsOpeningSanctuary] = useState(false);
  const [loading, setLoading] = useState(true);
  const isOpeningSanctuaryRef = useRef(false);
  const openingTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allNotes, allThemes, accessData, checkins, events] = await Promise.all([
          noteService.getAll(),
          wikiService.getAllThemes(),
          profileService.getWellnessAccess(),
          moodCheckinService.list(),
          ritualEventService.listSince(getWeekSignalSince()),
        ]);

        setNotes(allNotes);
        setThemes(allThemes);
        setAccess(accessData);
        setMoodCheckins(checkins);
        setRitualEvents(events);
      } catch (error) {
        console.error('[Insights] Failed to load data:', error);
      } finally {
        setLoading(false);
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
    const noteMoodCounts: Record<string, number> = {};
    const checkinMoodCounts: Record<string, number> = {};
    let wordsWritten = 0;

    notes.forEach((note) => {
      const date = new Date(note.createdAt);
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        monthNotes += 1;
        daysSet.add(date.toDateString());
      }

      if (note.mood) {
        noteMoodCounts[note.mood] = (noteMoodCounts[note.mood] || 0) + 1;
      }

      const plainText = note.content.replace(/<[^>]*>/g, ' ').trim();
      wordsWritten += plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
    });

    moodCheckins.forEach((checkin) => {
      const date = new Date(checkin.createdAt);
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        checkinMoodCounts[checkin.mood] = (checkinMoodCounts[checkin.mood] || 0) + 1;
      }
    });

    const hasStandaloneMoodSignal = Object.keys(checkinMoodCounts).length > 0;
    const moodCounts = hasStandaloneMoodSignal ? checkinMoodCounts : noteMoodCounts;
    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    return {
      monthNotes,
      totalNotes: notes.length,
      daysCheckedIn: daysSet.size,
      topMood,
      wordsWritten,
    };
  }, [moodCheckins, notes]);

  const weeklyRecap = useMemo(() => buildWeeklyRecap({
    notes,
    moodCheckins,
    ritualEvents,
  }), [moodCheckins, notes, ritualEvents]);

  const weeklyCardPayload = useMemo(() => buildCompletionCardPayload({
    kind: 'weekly_recap',
    date: new Date(weeklyRecap.weekEnd),
    weekLabel: `${new Date(weeklyRecap.weekStart).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })} - ${new Date(weeklyRecap.weekEnd).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })}`,
    customTitle: cardTitle || undefined,
  }), [cardTitle, weeklyRecap.weekEnd, weeklyRecap.weekStart]);

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

      <PageContainer className="surface-scope-sky pb-24 pt-6 md:pt-10">
        <div className="space-y-10">
          <button 
            onClick={() => navigate(RoutePath.HOME)}
            className="flex items-center gap-2 text-[13px] font-bold text-gray-nav hover:text-green transition-colors w-fit"
            aria-label="Back to home"
          >
            <ArrowLeft size={16} weight="regular" />
            <span>Back</span>
          </button>

          <SectionHeader
            title="Patterns in your writing"
            description="Mood, rhythm, and recurring themes"
            className="insights-section-header"
          />

          {loading ? (
            <Surface variant="flat" tone="sky" className="p-8 md:p-10">
              <WeeklyRecapLoadingSkeleton />
            </Surface>
          ) : (<>
          <Surface variant="flat" tone="sky" className="p-8 md:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="space-y-5">
                <div className="flex items-center gap-3 text-green">
                  <CalendarCheck size={18} weight="duotone" />
                  <p className="text-[11px] font-black uppercase tracking-widest">This week</p>
                </div>
                <h2 className="text-3xl font-display font-extrabold text-gray-text md:text-5xl">
                  You returned {weeklyRecap.writingDays} {weeklyRecap.writingDays === 1 ? 'day' : 'days'}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  ['Reflections', weeklyRecap.reflectionsSaved],
                  ['Check-ins', weeklyRecap.moodCheckins],
                  ['Release moments', weeklyRecap.releaseMoments],
                  ['Letters scheduled', weeklyRecap.lettersScheduled],
                  ['Letters opened', weeklyRecap.lettersOpened],
                  ['Active days', weeklyRecap.activityDays.length],
                ].map(([label, value]) => (
                  <div key={label} className="tone-chip tone-chip-sky flex-col items-start p-4">
                    <p className="text-2xl font-display font-bold text-gray-text">{value}</p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-gray-nav">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 border-t border-border/60">
              <Accordion
                title="Mood frequency"
                icon={
                  <div className="tone-icon tone-icon-sky h-11 w-11">
                    <Heart size={16} weight="duotone" />
                  </div>
                }
                isOpen={isMoodOpen}
                onToggle={() => setIsMoodOpen((prev) => !prev)}
                triggerClassName="py-6"
              >
                {weeklyRecap.moodData.length === 0 ? (
                  <EmptyState
                    surface="none"
                    icon={<Heart size={22} weight="duotone" />}
                    title="Mood labels will start to form a pattern here."
                    description="Check in or add a mood to a reflection and this week will stay readable."
                  />
                ) : (
                  <div className="flex flex-col gap-4">
                    {weeklyRecap.moodData.map((entry) => {
                      const maxValue = weeklyRecap.moodData[0].value;
                      const percent = Math.round((entry.value / maxValue) * 100);
                      const moodConfig = getMoodConfig(entry.name);
                      const tone = moodConfig || DEFAULT_MOOD_TONE;

                      return (
                        <div key={entry.name} className="flex items-center gap-4">
                          <span className={`w-20 shrink-0 text-[11px] font-black tracking-widest ${tone.labelClass}`}>
                            {moodConfig?.label || entry.name}
                          </span>
                          <div className={`relative h-8 flex-1 overflow-hidden rounded-full ${tone.trackClass}`}>
                            <div
                              className={`absolute inset-y-0 left-0 rounded-full ${tone.fillClass}`}
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
              </Accordion>

              <Accordion
                title="Recurring tags"
                icon={
                  <div className="tone-icon tone-icon-honey h-11 w-11">
                    <Hash size={16} weight="duotone" />
                  </div>
                }
                isOpen={isTagsOpen}
                onToggle={() => setIsTagsOpen((prev) => !prev)}
                triggerClassName="py-6"
              >
                {weeklyRecap.recurringTags.length === 0 ? (
                  <EmptyState
                    surface="none"
                    icon={<Hash size={22} weight="duotone" />}
                    title="Tags will appear here."
                    description="Tag entries this week and the repeated subjects will collect here."
                  />
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    {weeklyRecap.recurringTags.map(({ tag, count }, index) => {
                      const scale = Math.min(1.45, Math.max(0.92, count / 2.4));
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
              </Accordion>
            </div>
          </Surface>


          <Surface variant="bezel" tone="sage">
            <button
              type="button"
              onClick={() => setIsOverviewOpen((current) => !current)}
              aria-expanded={isOverviewOpen}
              aria-controls="insights-overview-panel"
              className="flex w-full items-center justify-between gap-4 p-6 text-left md:p-8"
            >
              <div className="flex items-center gap-3">
                <div className="tone-icon tone-icon-sage h-12 w-12">
                  <Book size={17} weight="duotone" />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-green">Overview</p>
                  <h2 className="mt-1 text-[22px] font-display font-bold text-gray-text">
                    {stats.monthNotes} reflections this month
                  </h2>
                </div>
              </div>
              <CaretRight
                size={18}
                weight="regular"
                className={`shrink-0 text-gray-nav transition-transform duration-300 ease-out-expo ${isOverviewOpen ? 'rotate-90' : ''}`}
              />
            </button>

            <AnimatePresence initial={false}>
              {isOverviewOpen ? (
                <motion.div
                  id="insights-overview-panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="space-y-5 border-t border-border/60 p-6 md:p-8">
                    <div className="flex flex-wrap items-center gap-2">
                      <MetadataPill tone="sage" icon={<Book size={13} weight="regular" />}>
                        {stats.wordsWritten.toLocaleString()} words written
                      </MetadataPill>
                    </div>
                    <p className="max-w-2xl text-[18px] font-serif italic leading-relaxed text-gray-light md:text-[20px]">
                      This month, you checked in on {stats.daysCheckedIn} different days, and the current emotional tone leans{' '}
                      <span className="font-bold not-italic text-green">
                        {getMoodConfig(stats.topMood)?.label || stats.topMood || 'toward clarity'}
                      </span>
                      .
                    </p>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </Surface>

          <Surface variant="flat" tone="honey" className="overflow-hidden">
            <button
              type="button"
              onClick={() => setIsCompletionOpen((prev) => !prev)}
              aria-expanded={isCompletionOpen}
              aria-controls="insights-completion-panel"
              className="flex w-full items-center justify-between gap-4 p-6 text-left md:p-8"
            >
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-honey">Completion card</p>
                <h2 className="mt-2 text-[22px] font-display font-bold text-gray-text">This week's card</h2>
              </div>
              <CaretRight
                size={18}
                weight="regular"
                className={`shrink-0 text-gray-nav transition-transform duration-300 ease-out-expo ${isCompletionOpen ? 'rotate-90' : ''}`}
              />
            </button>

            <AnimatePresence initial={false}>
              {isCompletionOpen ? (
                <motion.div
                  id="insights-completion-panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="space-y-5 border-t border-border/60 p-6 md:p-8">
                    <div className="space-y-2">
                      <label htmlFor="completion-card-title" className="text-[11px] font-black uppercase tracking-widest text-gray-nav">
                        Card message
                      </label>
                      <input
                        id="completion-card-title"
                        type="text"
                        value={cardTitle}
                        onChange={(e) => setCardTitle(e.target.value)}
                        maxLength={80}
                        placeholder="I returned to myself this week."
                        className="input-surface h-12 w-full px-4 text-[15px] font-semibold text-gray-text"
                      />
                      <p className="text-[11px] font-medium text-gray-nav/60">
                        {cardTitle.length}/80 — leave blank for the default
                      </p>
                    </div>
                    <CompletionCardActions payload={weeklyCardPayload} />
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </Surface>

          <Surface
            variant="flat"
            tone="sage"
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
                  <div className="tone-icon tone-icon-sage h-14 w-14 rounded-[var(--radius-panel)]">
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
                <CaretRight size={16} weight="regular" className="ml-2 transition-transform duration-500 ease-out-expo group-hover:translate-x-1" />
              </div>
            </Link>
          </Surface>
          </>)}
        </div>
      </PageContainer>
    </>
  );
};
