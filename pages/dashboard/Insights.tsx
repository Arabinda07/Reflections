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
  Leaf,
} from '@phosphor-icons/react';
import { type DotLottie } from '@lottiefiles/dotlottie-react';
import { LottieAnimation } from '../../components/ui/LottieAnimation';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { CompletionCardActions } from '../../components/ui/CompletionCardActions';
import { MetadataPill } from '../../components/ui/MetadataPill';
import { PageContainer } from '../../components/ui/PageContainer';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Surface } from '../../components/ui/Surface';
import { WeeklyRecapLoadingSkeleton } from '../../components/ui/skeletons/WeeklyRecapLoadingSkeleton';
import { LifeTheme, MoodCheckin, Note, RitualEvent, RoutePath, WellnessAccess } from '../../types';
import { noteService } from '../../services/noteService';
import { wikiService } from '../../services/wikiService';
import { profileService } from '../../services/profileService';
import { FREE_WIKI_MINIMUM_ENTRIES, getWikiInsightsGate } from '../../services/wellnessPolicy';
import { buildWeeklyRecap } from '../../services/weeklyRecapService';
import { moodCheckinService } from '../../services/moodService';
import { ritualEventService } from '../../services/ritualService';
import { buildCompletionCardPayload } from '../../services/completionCardPayload';
import { SANCTUARY_LEVEL_UP_ANIMATION_SRC } from '../../src/lottie/sanctuaryAnimation';
import { DEFAULT_MOOD_TONE, getMoodConfig } from './moodConfig';

const TAG_TONE_CLASSES = ['text-green', 'text-green/80', 'text-green/70', 'text-green/60'];

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
  const [isOpeningSanctuary, setIsOpeningSanctuary] = useState(false);
  const [cardTitle, setCardTitle] = useState('');
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

    navigate(RoutePath.SANCTUARY, { state: { fromInsights: true } });
  }, [navigate]);

  const handleOpenSanctuary = useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (isOpeningSanctuaryRef.current) return;

    if (shouldReduceMotion) {
      navigate(RoutePath.SANCTUARY, { state: { fromInsights: true } });
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
            className="fixed inset-0 z-overlay flex items-center justify-center overflow-hidden bg-body px-6"
            aria-live="polite"
            aria-label="Opening Sanctuary"
          >
            <div className="sanctuary-entrance-glow absolute inset-0" />
            <div className="sanctuary-entrance-scrim absolute inset-0" />
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 0.8, scale: 1 }}
              transition={{ delay: 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
            >
              <div className="h-[min(66vmin,34rem)] w-[min(66vmin,34rem)]">
                <LottieAnimation
                  src={SANCTUARY_LEVEL_UP_ANIMATION_SRC}
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
              <p className="label-caps text-green">
                Private reading room
              </p>
              <h2 className="mt-4 text-4xl font-display font-bold leading-tight text-gray-text md:text-5xl">
                Opening Sanctuary
              </h2>
              <p className="mt-4 max-w-[65ch] text-base font-medium leading-relaxed text-gray-light">
                Crossing into the library without breaking the calm of the page.
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <PageContainer className="surface-scope-sky page-wash pb-24 pt-6 md:pt-10">
        <div className="core-page-stack">
          <button 
            onClick={() => navigate(RoutePath.HOME)}
            className="group flex min-h-11 w-fit items-center gap-2 rounded-[var(--radius-control)] px-2 text-sm font-bold text-gray-nav transition-[color,transform,background-color] duration-300 hover:-translate-x-1 hover:bg-green/5 hover:text-green"
            aria-label="Back to home"
          >
            <ArrowLeft size={16} weight="bold" className="transition-transform group-hover:scale-110" />
            <span>Back</span>
          </button>

          <SectionHeader
            title="Patterns in your writing"
            description="Mood, rhythm, and recurring themes"
            className="insights-section-header"
          />

          <div aria-live="polite" aria-busy={loading} className="w-full">
            {loading ? (
            <Surface variant="flat" tone="sky" className="p-8 md:p-10">
              <WeeklyRecapLoadingSkeleton />
            </Surface>
          ) : notes.length === 0 && weeklyRecap.writingDays === 0 ? (
            <EmptyState
              surface="bezel"
              illustration={<LottieAnimation src="/assets/lottie/empty notes.json" className="h-full w-full" autoplay loop />}
              title="Your story is being written."
              description="Patterns and insights will gather here as you continue to write and check in."
              action={
                <Button onClick={() => navigate(RoutePath.CREATE_NOTE)} variant="primary">
                  Start reflecting
                </Button>
              }
            />
          ) : (<>
          <Surface variant="flat" tone="sky" className="group relative overflow-hidden rounded-[2.5rem] p-8 md:p-10 transition-shadow duration-500 ease-out-expo hover:shadow-[0_20px_50px_rgba(14,165,233,0.05)]">
            <div className="relative z-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="space-y-5">
                <div className="flex items-center gap-3 text-green">
                  <CalendarCheck size={18} weight="duotone" />
                  <p className="label-caps">This week</p>
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
                    <p className="dashboard-stat-value">{value}</p>
                    <p className="dashboard-caption mt-1 text-gray-nav">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 border-t border-border/60 pt-0">
              {/* Mood Frequency Accordion */}
                <button
                  type="button"
                  onClick={() => setIsMoodOpen((prev) => !prev)}
                  aria-expanded={isMoodOpen}
                  aria-controls="insights-mood-panel"
                  className="group/acc flex w-full items-center justify-between gap-4 py-6 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="tone-icon tone-icon-sky h-12 w-12 rounded-2xl transition-transform duration-500 ease-out-expo group-hover/acc:scale-110 group-hover/acc:rotate-6">
                      <Heart size={18} weight="duotone" />
                    </div>
                    <h3 className="text-lg font-display font-bold text-gray-text transition-colors group-hover/acc:text-sky">Mood frequency</h3>
                  </div>
                  <CaretRight
                    size={18}
                    weight="bold"
                    className={`shrink-0 text-gray-nav/40 transition-[color,transform] duration-500 ease-out-expo ${isMoodOpen ? 'rotate-90 text-sky' : 'group-hover/acc:translate-x-1'}`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isMoodOpen ? (
                    <motion.div
                      id="insights-mood-panel"
                      initial={{ gridTemplateRows: '0fr', opacity: 0 }}
                      animate={{ gridTemplateRows: '1fr', opacity: 1 }}
                      exit={{ gridTemplateRows: '0fr', opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="grid overflow-hidden"
                    >
                      <div className="min-h-0 pb-8">
                        {weeklyRecap.moodData.length === 0 ? (
                          <EmptyState
                            surface="none"
                            icon={<Heart size={22} weight="duotone" />}
                            title="Mood labels will start to form a pattern here."
                            description="Check in or add a mood to a reflection and this week will stay readable."
                          />
                        ) : (
                          <div className="flex flex-col gap-5">
                            {weeklyRecap.moodData.map((entry) => {
                              const maxValue = weeklyRecap.moodData[0].value;
                              const percent = Math.round((entry.value / maxValue) * 100);
                              const moodConfig = getMoodConfig(entry.name);
                              const tone = moodConfig || DEFAULT_MOOD_TONE;

                              return (
                                <div key={entry.name} className="flex items-center gap-4 group/bar">
                                  <span className={`w-20 shrink-0 label-caps transition-colors group-hover/bar:text-gray-text ${tone.labelClass}`}>
                                    {moodConfig?.label || entry.name}
                                  </span>
                                  <div className={`relative h-10 flex-1 overflow-hidden rounded-2xl ${tone.trackClass}`}>
                                    <motion.div
                                      initial={{ scaleX: 0 }}
                                      animate={{ scaleX: percent / 100 }}
                                      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                                      className={`absolute inset-y-0 left-0 w-full origin-left rounded-2xl ${tone.fillClass}`}
                                    />
                                    <div className="absolute inset-0 bg-white/5 opacity-0 transition-opacity group-hover/bar:opacity-100" />
                                  </div>
                                  <span className="w-8 shrink-0 text-right text-sm font-bold tabular-nums text-gray-nav">
                                    {entry.value}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              {/* Recurring Tags Accordion */}
              <div>
                <button
                  type="button"
                  onClick={() => setIsTagsOpen((prev) => !prev)}
                  aria-expanded={isTagsOpen}
                  aria-controls="insights-tags-panel"
                  className="group/acc flex w-full items-center justify-between gap-4 py-6 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="tone-icon tone-icon-honey h-12 w-12 rounded-2xl transition-transform duration-500 ease-out-expo group-hover/acc:scale-110 group-hover/acc:-rotate-6">
                      <Hash size={18} weight="duotone" />
                    </div>
                    <h3 className="text-lg font-display font-bold text-gray-text transition-colors group-hover/acc:text-honey">Recurring tags</h3>
                  </div>
                  <CaretRight
                    size={18}
                    weight="bold"
                    className={`shrink-0 text-gray-nav/40 transition-[color,transform] duration-500 ease-out-expo ${isTagsOpen ? 'rotate-90 text-honey' : 'group-hover/acc:translate-x-1'}`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isTagsOpen ? (
                    <motion.div
                      id="insights-tags-panel"
                      initial={{ gridTemplateRows: '0fr', opacity: 0 }}
                      animate={{ gridTemplateRows: '1fr', opacity: 1 }}
                      exit={{ gridTemplateRows: '0fr', opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="grid overflow-hidden"
                    >
                      <div className="min-h-0 pb-8">
                        {weeklyRecap.recurringTags.length === 0 ? (
                          <EmptyState
                            surface="none"
                            icon={<Hash size={22} weight="duotone" />}
                            title="Tags will appear here."
                            description="Tag entries this week and the repeated subjects will collect here."
                          />
                        ) : (
                          <div className="flex flex-wrap items-center gap-4">
                            {weeklyRecap.recurringTags.map(({ tag, count }, index) => {
                              const scale = Math.min(1.45, Math.max(0.92, count / 2.4));
                              return (
                                <motion.span
                                  key={tag}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: index * 0.05 }}
                                  className={`font-display font-bold lowercase transition-transform hover:scale-110 cursor-default ${TAG_TONE_CLASSES[index % TAG_TONE_CLASSES.length]}`}
                                  style={{
                                    fontSize: `${scale}rem`,
                                    lineHeight: '1',
                                  }}
                                >
                                  #{tag}
                                </motion.span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
            {/* Subtle background glow effect on hover */}
            <div className="dashboard-accent-glow pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </Surface>

          <Surface variant="bezel" tone="sage" className="group relative overflow-hidden rounded-[2.5rem] transition-shadow duration-500 ease-out-expo hover:shadow-[0_20px_50px_rgba(34,197,94,0.05)]">
            <button
              type="button"
              onClick={() => setIsOverviewOpen((current) => !current)}
              aria-expanded={isOverviewOpen}
              aria-controls="insights-overview-panel"
              className="flex w-full items-center justify-between gap-4 p-6 text-left md:p-8"
            >
              <div className="flex items-center gap-3">
                <div className="tone-icon tone-icon-sage h-12 w-12 rounded-2xl transition-transform duration-500 ease-out-expo group-hover:scale-110 group-hover:rotate-6">
                  <Book size={18} weight="duotone" />
                </div>
                <div>
                  <p className="label-caps text-green">Overview</p>
                  <h2 className="mt-1 text-2xl font-display font-bold text-gray-text group-hover:text-green transition-colors duration-300">
                    {stats.monthNotes} reflections this month
                  </h2>
                </div>
              </div>
              <CaretRight
                size={18}
                weight="bold"
                className={`shrink-0 text-gray-nav/40 transition-[color,transform] duration-500 ease-out-expo ${isOverviewOpen ? 'rotate-90 text-green' : 'group-hover:translate-x-1'}`}
              />
            </button>

            <AnimatePresence initial={false}>
              {isOverviewOpen ? (
                <motion.div
                  id="insights-overview-panel"
                  initial={{ gridTemplateRows: '0fr', opacity: 0 }}
                  animate={{ gridTemplateRows: '1fr', opacity: 1 }}
                  exit={{ gridTemplateRows: '0fr', opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="grid overflow-hidden"
                >
                  <div className="min-h-0 space-y-5 border-t border-border/60 p-6 md:p-8">
                    <div className="flex flex-wrap items-center gap-2">
                      <MetadataPill tone="sage" icon={<Book size={13} weight="regular" />}>
                        {stats.wordsWritten.toLocaleString()} words written
                      </MetadataPill>
                    </div>
                    <p className="max-w-[65ch] text-lg font-serif italic leading-relaxed text-gray-light md:text-xl">
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

          <Surface variant="flat" tone="honey" className="group relative overflow-hidden rounded-[2.5rem] transition-shadow duration-500 ease-out-expo hover:shadow-[0_20px_50px_rgba(245,158,11,0.05)]">
            <button
              type="button"
              onClick={() => setIsCompletionOpen((prev) => !prev)}
              aria-expanded={isCompletionOpen}
              aria-controls="insights-completion-panel"
              className="flex w-full items-center justify-between gap-4 p-6 text-left md:p-8"
            >
              <div className="flex items-center gap-3">
                <div className="tone-icon tone-icon-honey h-12 w-12 rounded-2xl transition-transform duration-500 ease-out-expo group-hover:scale-110 group-hover:-rotate-12">
                  <Leaf size={18} weight="fill" />
                </div>
                <div>
                  <p className="label-caps text-honey">Completion card</p>
                  <h2 className="mt-1 text-2xl font-display font-bold text-gray-text group-hover:text-honey transition-colors duration-300">This week's card</h2>
                </div>
              </div>
              <CaretRight
                size={18}
                weight="bold"
                className={`shrink-0 text-gray-nav/40 transition-[color,transform] duration-500 ease-out-expo ${isCompletionOpen ? 'rotate-90 text-honey' : 'group-hover:translate-x-1'}`}
              />
            </button>

            <AnimatePresence initial={false}>
              {isCompletionOpen ? (
                <motion.div
                  id="insights-completion-panel"
                  initial={{ gridTemplateRows: '0fr', opacity: 0 }}
                  animate={{ gridTemplateRows: '1fr', opacity: 1 }}
                  exit={{ gridTemplateRows: '0fr', opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="grid overflow-hidden"
                >
                  <div className="min-h-0 space-y-5 border-t border-border/60 p-6 md:p-8">
                    <div className="space-y-2">
                      <label htmlFor="completion-card-title" className="label-caps text-gray-nav">
                        Card message
                      </label>
                      <input
                        id="completion-card-title"
                        type="text"
                        value={cardTitle}
                        onChange={(e) => setCardTitle(e.target.value)}
                        maxLength={80}
                        placeholder="Write a message for your card..."
                        className="input-surface h-12 w-full px-4 text-base font-semibold text-gray-text"
                      />
                      <p className="text-xs font-medium text-gray-nav/60">
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
            className="group relative overflow-hidden rounded-[2.5rem] border border-transparent transition-[border-color,box-shadow] duration-500 ease-out-expo hover:border-green/20 hover:shadow-[0_20px_50px_rgba(34,197,94,0.05)]"
          >
            <Link
              to={RoutePath.SANCTUARY}
              state={{ fromInsights: true }}
              onClick={handleOpenSanctuary}
              className="relative z-10 flex w-full flex-col items-center justify-between gap-8 p-8 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-green/40 md:flex-row md:p-12"
              aria-label="Open your Life Wiki"
            >
              <div className="space-y-5">
                {isWikiReadyToBuild ? (
                  <div className="h-28 w-28 overflow-hidden rounded-[2rem] bg-[oklch(from_var(--color-accent)_l_c_h_/_0.16)] transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3">
                    <LottieAnimation src={SANCTUARY_LEVEL_UP_ANIMATION_SRC} autoplay loop />
                  </div>
                ) : (
                  <div className="tone-icon tone-icon-sage h-14 w-14 rounded-2xl transition-transform duration-500 ease-out-expo group-hover:scale-110 group-hover:rotate-6">
                    <Book size={26} weight="duotone" />
                  </div>
                )}
                <div className="space-y-3">
                  <h2 className="text-3xl font-display font-bold text-gray-text group-hover:text-green transition-colors duration-300">
                    {isWikiReadyToBuild ? 'Your wiki is ready for insights' : 'Your Life Wiki'}
                  </h2>
                  <p className="text-gray-light max-w-lg text-lg leading-relaxed font-serif italic">
                    {isWikiReadyToBuild
                      ? 'You have enough writing to build your first Life Wiki refresh when you choose.'
                      : 'A private reading room where AI-generated wiki pages stay grounded in your saved notes.'}
                  </p>
                </div>
              </div>
              
              <div className="relative flex h-12 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-control)] border border-green bg-green text-white px-6 label-caps transition-colors duration-300 group-hover:bg-green/90 group-hover:shadow-lg group-hover:shadow-green/20">
                Open Sanctuary
                <CaretRight size={16} weight="regular" className="ml-2 transition-transform duration-500 ease-out-expo group-hover:translate-x-1" />
              </div>
            </Link>
          </Surface>
          </>)}
          </div>
        </div>
      </PageContainer>
    </>
  );
};
