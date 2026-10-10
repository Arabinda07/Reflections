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
import { LifeTheme, MoodCheckin, Note, RelationshipRecord, RitualEvent, RoutePath, WellnessAccess } from '../../types';
import { noteService } from '../../services/noteService';
import { relationshipService } from '../../services/relationshipService';
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
import { getMoodConfig, getMoodFamilyForMood, getMoodGroupConfig } from './moodConfig';
import {
  buildMonthSummary,
  buildMoodSentence,
  buildTagsSentence,
  buildWeekSummary,
} from './insightsNarrative';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useViewTransitionNavigation } from '../../hooks/useViewTransitionNavigation';
import { useUserMode } from '../../context/UserModeContext';
import { computeMindsetDrift, type MindsetDriftReport } from '../../services/mindsetDrift';

const SANCTUARY_ENTRANCE_FALLBACK_MS = 2200;

const getWeekSignalSince = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start.toISOString();
};

export const Insights: React.FC = () => {
  const navigate = useViewTransitionNavigation();
  const { userMode } = useUserMode();

  const [notes, setNotes] = useState<Note[]>([]);
  const [themes, setThemes] = useState<LifeTheme[]>([]);
  const [moodCheckins, setMoodCheckins] = useState<MoodCheckin[]>([]);
  const [ritualEvents, setRitualEvents] = useState<RitualEvent[]>([]);
  const [relationships, setRelationships] = useState<RelationshipRecord[]>([]);
  const [access, setAccess] = useState<WellnessAccess | null>(null);
  const [isOpeningSanctuary, setIsOpeningSanctuary] = useState(false);
  const [loading, setLoading] = useState(true);
  const isOpeningSanctuaryRef = useRef(false);
  const openingTimerRef = useRef<number | null>(null);
  const shouldReduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allNotes, allThemes, accessData, checkins, events, allRelationships] = await Promise.all([
          noteService.getAll(),
          wikiService.getAllThemes(),
          profileService.getWellnessAccess(),
          moodCheckinService.list(),
          ritualEventService.listSince(getWeekSignalSince()),
          relationshipService.getAll(),
        ]);

        setNotes(allNotes);
        setThemes(allThemes);
        setAccess(accessData);
        setMoodCheckins(checkins);
        setRitualEvents(events);
        setRelationships(allRelationships);
      } catch (error) {
        console.error('[Insights] Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const [driftReport, setDriftReport] = useState<MindsetDriftReport | null>(null);

  useEffect(() => {
    if (notes.length === 0) return;
    let cancelled = false;

    void computeMindsetDrift(notes).then((report) => {
      if (!cancelled) {
        setDriftReport(report);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [notes]);

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

      const plainText = (note.content || '').replace(/<[^>]*>/g, ' ').trim();
      wordsWritten += plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
    });

    moodCheckins.forEach((checkin) => {
      const date = new Date(checkin.createdAt);
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear && checkin.mood) {
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
    if (!access || userMode !== 'reflective') return null;
    return getWikiInsightsGate(access, notes.length);
  }, [access, notes.length, userMode]);

  const isWikiReadyToBuild = Boolean(
    userMode === 'reflective' && wikiGate?.canGenerate && notes.length >= FREE_WIKI_MINIMUM_ENTRIES && themes.length === 0,
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

  const relationalOrbit = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthNotesWithPeople = notes.filter((note) => {
      const d = new Date(note.createdAt);
      return (
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear &&
        note.relationshipIds &&
        note.relationshipIds.length > 0
      );
    });

    if (monthNotesWithPeople.length === 0 || relationships.length === 0) return [];

    const relMap = new Map(relationships.map((r) => [r.id, r]));
    const personStats = new Map<string, { person: RelationshipRecord; count: number; familyCounts: Record<string, number> }>();

    for (const note of monthNotesWithPeople) {
      for (const relId of note.relationshipIds || []) {
        const person = relMap.get(relId);
        if (!person) continue;

        if (!personStats.has(relId)) {
          personStats.set(relId, { person, count: 0, familyCounts: {} });
        }
        const currentStats = personStats.get(relId)!;
        currentStats.count += 1;
        if (note.mood) {
          const family = getMoodFamilyForMood(note.mood)?.id || 'steady';
          currentStats.familyCounts[family] = (currentStats.familyCounts[family] || 0) + 1;
        }
      }
    }

    return Array.from(personStats.values())
      .map(({ person, count, familyCounts }) => {
        const dominantFamily = Object.entries(familyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'steady';
        return { person, count, dominantFamily };
      })
      .sort((a, b) => b.count - a.count);
  }, [notes, relationships]);

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
              className="relative z-10 flex max-w-2xl flex-col items-center text-center animate-fade-in-up"
            >
              <h2 className="mt-4 text-4xl font-display font-bold leading-tight text-gray-text md:text-5xl">
                Opening Sanctuary
              </h2>
              <p className="mt-4 max-w-prose text-base font-medium leading-relaxed text-gray-light">
                Crossing into the library without breaking the calm of the page.
              </p>
            </div>
          </div>
        ) : null}

      <PageContainer scope="sage" className="pb-24 pt-6 md:pt-10">
        <div className="core-page-stack">
          <button
            onClick={() => navigate(RoutePath.DASHBOARD)}
            className="group flex min-h-11 w-fit items-center gap-2 rounded-control px-2 text-sm font-bold text-gray-nav transition-colors duration-300 hover:-translate-x-1 hover:bg-green/5 hover:text-green"
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
            <Surface variant="flat" tone="sage" className="rounded-4xl p-8 md:p-12">
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
          <Surface variant="flat" tone="sage" className="rounded-4xl p-8 md:p-12">
            <div className="space-y-10">
              <section className="space-y-5">
                <h2 className="text-2xl font-display font-bold text-gray-text md:text-3xl">This week</h2>
                {isQuietWeek ? (
                  <div className="space-y-5">
                    <p className="dashboard-supporting-text">
                      A quiet week — that&rsquo;s allowed. Nothing to count here; your reflections are still in My notes whenever you want them.
                    </p>
                    <Button variant="ghost" tone="green" onClick={() => navigate(RoutePath.CREATE_NOTE)}>
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

              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-display font-bold text-gray-text md:text-3xl">This month</h2>
                  {driftReport?.hasSufficientData && driftReport.previousFamilyProportions ? (
                    <span className="text-ui-xs font-bold text-gray-nav">
                      {driftReport.driftAngleDegrees}° movement
                    </span>
                  ) : null}
                </div>

                <div className="dashboard-supporting-text space-y-3 text-pretty">
                  <p>{monthSummary}</p>
                  {driftReport?.trajectorySummary ? (
                    <p>{driftReport.trajectorySummary}</p>
                  ) : null}
                </div>

                {driftReport?.hasSufficientData ? (
                  <div className="space-y-3 pt-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted flex">
                      {driftReport.currentFamilyProportions.light > 0 ? (
                        <div
                          style={{ width: `${driftReport.currentFamilyProportions.light}%` }}
                          className="bg-mood-happy"
                          title={`Light / Uplifting: ${driftReport.currentFamilyProportions.light}%`}
                        />
                      ) : null}
                      {driftReport.currentFamilyProportions.steady > 0 ? (
                        <div
                          style={{ width: `${driftReport.currentFamilyProportions.steady}%` }}
                          className="bg-mood-calm"
                          title={`Steady / Calm: ${driftReport.currentFamilyProportions.steady}%`}
                        />
                      ) : null}
                      {driftReport.currentFamilyProportions.charged > 0 ? (
                        <div
                          style={{ width: `${driftReport.currentFamilyProportions.charged}%` }}
                          className="bg-mood-anxious"
                          title={`Charged / Active: ${driftReport.currentFamilyProportions.charged}%`}
                        />
                      ) : null}
                      {driftReport.currentFamilyProportions.heavy > 0 ? (
                        <div
                          style={{ width: `${driftReport.currentFamilyProportions.heavy}%` }}
                          className="bg-mood-sad"
                          title={`Heavy / Tender: ${driftReport.currentFamilyProportions.heavy}%`}
                        />
                      ) : null}
                      {driftReport.currentFamilyProportions.mixed > 0 ? (
                        <div
                          style={{ width: `${driftReport.currentFamilyProportions.mixed}%` }}
                          className="bg-mood-mixed"
                          title={`Mixed / Complex: ${driftReport.currentFamilyProportions.mixed}%`}
                        />
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-y-2 text-ui-xs font-semibold text-gray-nav">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-mood-happy inline-block" />
                        Light {driftReport.currentFamilyProportions.light}%
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-mood-calm inline-block" />
                        Steady {driftReport.currentFamilyProportions.steady}%
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-mood-anxious inline-block" />
                        Charged {driftReport.currentFamilyProportions.charged}%
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-mood-sad inline-block" />
                        Heavy {driftReport.currentFamilyProportions.heavy}%
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-mood-mixed inline-block" />
                        Mixed {driftReport.currentFamilyProportions.mixed}%
                      </span>
                    </div>
                  </div>
                ) : null}

                {relationalOrbit.length > 0 ? (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-nav">
                      People in your reflections this month
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {relationalOrbit.map(({ person, count, dominantFamily }) => (
                        <Link
                          key={person.id}
                          to={RoutePath.RELATIONSHIP_DETAIL.replace(':id', encodeURIComponent(person.id))}
                          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-bold text-gray-text hover:border-green/30 hover:text-green transition-colors"
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              dominantFamily === 'light'
                                ? 'bg-mood-happy'
                                : dominantFamily === 'steady'
                                ? 'bg-mood-calm'
                                : dominantFamily === 'charged'
                                ? 'bg-mood-anxious'
                                : dominantFamily === 'heavy'
                                ? 'bg-mood-sad'
                                : 'bg-mood-mixed'
                            }`}
                          />
                          <span>{person.name}</span>
                          <span className="text-gray-nav font-medium">
                            ({count} {count === 1 ? 'reflection' : 'reflections'})
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            </div>
          </Surface>

          <Surface
            variant="flat"
            tone="sage"
            className="group relative overflow-hidden rounded-4xl"
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
                  <div className="h-24 w-24 overflow-hidden rounded-4xl bg-accent-soft">
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

              <div className="relative flex h-12 shrink-0 items-center justify-center overflow-hidden rounded-control border border-green bg-green text-white px-6 label-caps transition-colors duration-300 group-hover:bg-green/90">
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
