import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { ArrowLeft } from '@phosphor-icons/react/ArrowLeft';
import { Book } from '@phosphor-icons/react/Book';
import { CaretRight } from '@phosphor-icons/react/CaretRight';

import { LottieAnimation } from '../../components/ui/LottieAnimation';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
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
import {
  SANCTUARY_LEVEL_UP_ANIMATION_ID,
  SANCTUARY_LEVEL_UP_ANIMATION_SRC,
} from '../../src/lottie/sanctuaryAnimation';
import { getMoodConfig, getMoodGroupConfig } from './moodConfig';
import {
  buildMonthSummary,
  buildMoodSentence,
  buildTagsSentence,
  buildWeekSummary,
} from './insightsNarrative';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useViewTransitionNavigation } from '../../hooks/useViewTransitionNavigation';

const SANCTUARY_ENTRANCE_FALLBACK_MS = 2200;

const getWeekSignalSince = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start.toISOString();
};

export const Insights: React.FC = () => {
  const navigate = useViewTransitionNavigation();

  const [notes, setNotes] = useState<Note[]>([]);
  const [themes, setThemes] = useState<LifeTheme[]>([]);
  const [moodCheckins, setMoodCheckins] = useState<MoodCheckin[]>([]);
  const [ritualEvents, setRitualEvents] = useState<RitualEvent[]>([]);
  const [access, setAccess] = useState<WellnessAccess | null>(null);
  const [isOpeningSanctuary, setIsOpeningSanctuary] = useState(false);
  const [loading, setLoading] = useState(true);
  const isOpeningSanctuaryRef = useRef(false);
  const openingTimerRef = useRef<number | null>(null);
  const shouldReduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

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

  const wikiGate = useMemo(() => {
    if (!access) return null;
    return getWikiInsightsGate(access, notes.length);
  }, [access, notes.length]);

  const isWikiReadyToBuild = Boolean(
    wikiGate?.canGenerate && notes.length >= FREE_WIKI_MINIMUM_ENTRIES && themes.length === 0,
  );

  // Weave the weekly/monthly signal into prose rather than a stat grid.
  const moodLabels = weeklyRecap.moodFamilyData
    .slice(0, 2)
    .map((entry) => (getMoodGroupConfig(entry.name)?.label || getMoodConfig(entry.name)?.label || entry.name).toLowerCase());
  const weekSummary = buildWeekSummary(weeklyRecap);
  const moodSentence = buildMoodSentence(moodLabels);
  const tagsSentence = buildTagsSentence(weeklyRecap.recurringTags.slice(0, 4).map((entry) => entry.tag));
  const monthTone = getMoodConfig(stats.topMood)?.label || stats.topMood || null;
  const monthSummary = buildMonthSummary({
    monthNotes: stats.monthNotes,
    daysCheckedIn: stats.daysCheckedIn,
    wordsWritten: stats.wordsWritten,
    tone: monthTone,
  });

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

  useEffect(() => {
    return () => {
      if (openingTimerRef.current !== null) {
        window.clearTimeout(openingTimerRef.current);
      }
    };
  }, []);

  const isEmpty = notes.length === 0 && weeklyRecap.writingDays === 0;
  const isQuietWeek = weeklyRecap.writingDays === 0;

  return (
    <>
      {isOpeningSanctuary ? (
          <div
            className="fixed inset-0 z-overlay flex items-center justify-center overflow-hidden bg-body px-6 animate-fade-in"
            aria-live="polite"
            aria-label="Opening Sanctuary"
          >
            <div className="sanctuary-entrance-glow absolute inset-0" />
            <div className="sanctuary-entrance-scrim absolute inset-0" />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center animate-scale-in"
            >
              <div className="h-[min(66vmin,34rem)] w-[min(66vmin,34rem)]">
                <LottieAnimation
                  src={SANCTUARY_LEVEL_UP_ANIMATION_SRC}
                  animationId={SANCTUARY_LEVEL_UP_ANIMATION_ID}
                  autoplay
                  loop={false}
                  onComplete={completeOpenSanctuary}
                />
              </div>
            </div>
            <div
              className="relative z-10 flex max-w-[42rem] flex-col items-center text-center animate-fade-in-up"
            >
              <h2 className="mt-4 text-4xl font-display font-bold leading-tight text-gray-text md:text-5xl">
                Opening Sanctuary
              </h2>
              <p className="mt-4 max-w-[65ch] text-base font-medium leading-relaxed text-gray-light">
                Crossing into the library without breaking the calm of the page.
              </p>
            </div>
          </div>
        ) : null}

      <PageContainer className="surface-scope-sage page-wash pb-24 pt-6 md:pt-10">
        <div className="core-page-stack">
          <button
            onClick={() => navigate(RoutePath.DASHBOARD)}
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

          <div aria-live="polite" aria-busy={loading} className="w-full core-section-stack">
            {loading ? (
            <Surface variant="flat" tone="sage" className="rounded-[2rem] p-8 md:p-12">
              <WeeklyRecapLoadingSkeleton />
            </Surface>
          ) : isEmpty ? (
            <EmptyState
              surface="bezel"
              illustration={<LottieAnimation src="/assets/lottie/empty-notes.json" className="h-full w-full" autoplay loop />}
              title="Your story is being written."
              description="Patterns and insights will gather here as you continue to write and check in."
              action={
                <Button onClick={() => navigate(RoutePath.CREATE_NOTE)} variant="primary">
                  Start reflecting
                </Button>
              }
            />
          ) : (<>
          <Surface variant="flat" tone="sage" className="rounded-[2rem] p-8 md:p-12">
            <div className="space-y-10">
              <section className="space-y-5">
                <h2 className="text-2xl font-display font-bold text-gray-text md:text-3xl">This week</h2>
                {isQuietWeek ? (
                  <div className="space-y-5">
                    <p className="dashboard-supporting-text">
                      A quiet week — that&rsquo;s allowed. Nothing to count here; your reflections are still in My notes whenever you want them.
                    </p>
                    <Button variant="ghost" onClick={() => navigate(RoutePath.CREATE_NOTE)} className="text-green">
                      Write something
                    </Button>
                  </div>
                ) : (
                  <div className="dashboard-supporting-text space-y-2 text-pretty">
                    <p>{weekSummary}</p>
                    {moodSentence ? <p>{moodSentence}</p> : null}
                    {tagsSentence ? <p>{tagsSentence}</p> : null}
                  </div>
                )}
              </section>

              <section className="space-y-5">
                <h2 className="text-2xl font-display font-bold text-gray-text md:text-3xl">This month</h2>
                <p className="dashboard-supporting-text text-pretty">{monthSummary}</p>
              </section>
            </div>
          </Surface>

          <Surface
            variant="flat"
            tone="sage"
            className="group relative overflow-hidden rounded-[2rem] border border-transparent transition-[border-color] duration-500 ease-out-expo hover:border-green/20"
          >
            <Link
              to={RoutePath.SANCTUARY}
              state={{ fromInsights: true }}
              onClick={handleOpenSanctuary}
              className="relative z-10 flex w-full flex-col items-center justify-between gap-8 p-8 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-green/40 md:flex-row md:p-12"
              aria-label="Open your Life Wiki"
            >
              <div className="space-y-5">
                {isWikiReadyToBuild && (
                  <div className="h-24 w-24 overflow-hidden rounded-[2rem] bg-[oklch(from_var(--color-accent)_l_c_h_/_0.16)]">
                    <LottieAnimation src={SANCTUARY_LEVEL_UP_ANIMATION_SRC} animationId={SANCTUARY_LEVEL_UP_ANIMATION_ID} autoplay loop />
                  </div>
                )}
                <div className="space-y-3">
                  <h2 className="flex items-center gap-2.5 text-3xl font-display font-bold text-gray-text">
                    {!isWikiReadyToBuild && <Book size={24} weight="duotone" className="flex-none text-green" />}
                    {isWikiReadyToBuild ? 'Your wiki is ready for insights' : 'Your Life Wiki'}
                  </h2>
                  <p className="text-gray-light max-w-lg text-lg leading-relaxed font-serif italic">
                    {isWikiReadyToBuild
                      ? 'You have enough writing to build your first Life Wiki refresh when you choose.'
                      : 'A private reading room where AI-generated wiki pages stay grounded in your saved notes.'}
                  </p>
                </div>
              </div>

              <div className="relative flex h-12 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-control)] border border-green bg-green text-white px-6 label-caps transition-colors duration-300 group-hover:bg-green/90">
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
