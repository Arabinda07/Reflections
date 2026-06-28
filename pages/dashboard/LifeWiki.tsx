import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import ReactMarkdown from 'react-markdown';
import { ArrowLeft } from '@phosphor-icons/react/ArrowLeft';
import { Book } from '@phosphor-icons/react/Book';
import { CaretRight } from '@phosphor-icons/react/CaretRight';
import { Lock } from '@phosphor-icons/react/Lock';
import { Sparkle } from '@phosphor-icons/react/Sparkle';
import { Warning } from '@phosphor-icons/react/Warning';
import { LottieAnimation } from '../../components/ui/LottieAnimation';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { MetadataPill } from '../../components/ui/MetadataPill';
import { PageContainer } from '../../components/ui/PageContainer';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Surface } from '../../components/ui/Surface';
import { LifeTheme, Note, RoutePath, WellnessAccess } from '../../types';
import { noteService } from '../../services/noteService';
import { wikiService } from '../../services/wikiService';
import { aiRunClient, type LifeWikiRunDetail, type LifeWikiRunRecord } from '../../services/aiRunClient';
import { profileService } from '../../services/profileService';
import { FREE_WIKI_MINIMUM_ENTRIES, getWikiInsightsGate } from '../../services/wellnessPolicy';
import {
  SANCTUARY_WIKI_PAGES,
  SUPPORTING_WIKI_PAGES,
  isUserVisibleWikiPage,
  type WikiPageType,
} from '../../services/wikiTypes';
import {
  SANCTUARY_LEVEL_UP_ANIMATION_ID,
  SANCTUARY_LEVEL_UP_ANIMATION_SRC,
} from '../../src/lottie/sanctuaryAnimation';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { runScopedTransition } from '../../hooks/viewTransitionUtils';
import { getLifeWikiReviewSummary } from './lifeWikiReviewSummary';

type RefreshFeedback = {
  variant: 'warning' | 'error';
  title: string;
  description: string;
};

type PageMeta = {
  pageType: WikiPageType;
  label: string;
  description: string;
  emptyLine?: string;
  tone: 'green' | 'blue' | 'golden' | 'orange' | 'darkBlue';
};

const SANCTUARY_META: PageMeta[] = [
  {
    pageType: 'people',
    label: 'People',
    description: 'Relationships, roles, and recurring names that appear in your notes.',
    emptyLine: 'The names, roles, and relational weather in your writing will gather here.',
    tone: 'blue',
  },
  {
    pageType: 'patterns',
    label: 'Patterns',
    description: 'Repeated situations, moods, rhythms, and attention loops.',
    emptyLine: 'Repeated moods, loops, and attention paths will become easier to notice here.',
    tone: 'green',
  },
  {
    pageType: 'philosophies',
    label: 'Philosophies',
    description: 'Values, beliefs, principles, and ways of seeing life.',
    emptyLine: 'The private rules and values you keep returning to will be held here.',
    tone: 'golden',
  },
  {
    pageType: 'eras',
    label: 'Eras',
    description: 'Seasons, transitions, and phases that seem to be forming.',
    emptyLine: 'The larger chapters and thresholds in your notes will be named here.',
    tone: 'darkBlue',
  },
  {
    pageType: 'decisions',
    label: 'Decisions',
    description: 'Choices, open questions, commitments, and tradeoffs.',
    emptyLine: 'Open questions, tradeoffs, and commitments will settle into view here.',
    tone: 'orange',
  },
];

const SUPPORTING_META: PageMeta[] = [
  {
    pageType: 'mood_patterns',
    label: 'Mood Patterns',
    description: 'The older generated mood summary, kept as supporting context.',
    tone: 'green',
  },
  {
    pageType: 'recurring_themes',
    label: 'Recurring Themes',
    description: 'The older generated theme summary, kept as supporting context.',
    tone: 'blue',
  },
  {
    pageType: 'self_model',
    label: 'Self Model',
    description: 'The older generated self-model page, kept as supporting context.',
    tone: 'golden',
  },
  {
    pageType: 'timeline',
    label: 'Timeline',
    description: 'The older generated timeline page, kept as supporting context.',
    tone: 'darkBlue',
  },
];

const ROOM_TONE_CLASSES: Record<PageMeta['tone'], {
  accent: string;
  hover: string;
  surface: string;
  text: string;
}> = {
  blue: {
    accent: 'text-sky',
    hover: 'hover:brightness-[1.02]',
    surface: 'surface-tone-sky',
    text: 'text-sky',
  },
  darkBlue: {
    accent: 'text-sky',
    hover: 'hover:brightness-[1.02]',
    surface: 'surface-tone-sky',
    text: 'text-sky',
  },
  golden: {
    accent: 'text-honey',
    hover: 'hover:brightness-[1.02]',
    surface: 'surface-tone-honey',
    text: 'text-honey',
  },
  green: {
    accent: 'text-green',
    hover: 'hover:brightness-[1.02]',
    surface: 'surface-tone-sage',
    text: 'text-green',
  },
  orange: {
    accent: 'text-clay',
    hover: 'hover:brightness-[1.02]',
    surface: 'surface-tone-clay',
    text: 'text-clay',
  },
};

const SOURCE_LINK_PREFIX = 'source-note:';
const SOURCE_MARKER_PATTERN = /\[source:([^\]]+)\]/gi;

const articlePath = (pageType: WikiPageType) =>
  RoutePath.SANCTUARY_ARTICLE.replace(':pageType', pageType);

const notePath = (noteId: string) =>
  RoutePath.NOTE_DETAIL.replace(':id', encodeURIComponent(noteId));

const splitSourceIds = (rawIds: string) =>
  rawIds
    .split(/[,\s]+/)
    .map((id) => id.trim())
    .filter(Boolean);

const extractSourceIds = (content: string) => {
  const ids = new Set<string>();

  content.replace(SOURCE_MARKER_PATTERN, (_match, rawIds: string) => {
    splitSourceIds(rawIds).forEach((id) => ids.add(id));
    return '';
  });

  return Array.from(ids);
};

const renderSourceMarkersAsLinks = (content: string) =>
  content.replace(SOURCE_MARKER_PATTERN, (_match, rawIds: string) =>
    splitSourceIds(rawIds)
      .map((id) => `[source:${id}](${SOURCE_LINK_PREFIX}${encodeURIComponent(id)})`)
      .join(' '),
  );

const stripSourceMarkers = (content: string) =>
  content.replace(SOURCE_MARKER_PATTERN, '').replace(/\s+/g, ' ').trim();

const previewText = (content: string) => {
  const plainText = stripSourceMarkers(content)
    .replace(/[#*_>`~[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!plainText) return 'This page is quiet for now.';
  return plainText.length > 160 ? `${plainText.slice(0, 157).trim()}...` : plainText;
};

const getLastRefreshLabel = (pages: LifeTheme[]) => {
  const newest = pages
    .map((page) => new Date(page.updatedAt).getTime())
    .filter((time) => Number.isFinite(time))
    .sort((left, right) => right - left)[0];

  if (!newest) return 'Not refreshed yet';
  return new Date(newest).toLocaleDateString();
};

const getPageMap = (pages: LifeTheme[]) =>
  new Map(
    pages
      .filter((page) => isUserVisibleWikiPage(page.pageType))
      .map((page) => [page.pageType, page]),
  );

const ACTIVE_RUN_STATUSES = new Set(['running']);

const formatRunStatus = (status: string) => {
  switch (status) {
    case 'succeeded':
      return 'Completed';
    case 'partial':
      return 'Partly updated';
    case 'failed':
      return 'Failed';
    case 'skipped':
      return 'Skipped';
    default:
      return 'Running';
  }
};

const formatRunTrigger = (trigger: string) => {
  switch (trigger) {
    case 'smart_mode':
      return 'Smart Mode';
    case 'account_enable':
      return 'Account setup';
    default:
      return 'Manual';
  }
};

export const LifeWiki: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pageType } = useParams();
  const shouldReduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const cameFromInsights = Boolean(location.state?.fromInsights);
  const shouldPlayEntryAnimation =
    !shouldReduceMotion && (location.pathname === RoutePath.WIKI || location.pathname === RoutePath.SANCTUARY);
  const lifeWikiScopeRef = useRef<HTMLDivElement | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [themes, setThemes] = useState<LifeTheme[]>([]);
  const [access, setAccess] = useState<WellnessAccess | null>(null);
  const [isRefreshingWiki, setIsRefreshingWiki] = useState(false);
  const [isEnteringWiki, setIsEnteringWiki] = useState(shouldPlayEntryAnimation && !cameFromInsights);
  const [hasLoadedLibrary, setHasLoadedLibrary] = useState(false);
  const [refreshFeedback, setRefreshFeedback] = useState<RefreshFeedback | null>(null);
  const [recentRuns, setRecentRuns] = useState<LifeWikiRunRecord[]>([]);
  const [runDetail, setRunDetail] = useState<LifeWikiRunDetail | null>(null);

  const loadRunActivity = async (preferredRunId?: string) => {
    try {
      const list = await aiRunClient.listLifeWikiRuns(8);
      setRecentRuns(list.runs);
      const runId = preferredRunId || runDetail?.run.id || list.runs[0]?.id;
      if (runId) {
        const detail = await aiRunClient.getLifeWikiRun(runId);
        setRunDetail(detail);
      }
    } catch (error) {
      console.error('[LifeWiki] Failed to load AI run activity:', error);
    }
  };

  const loadData = async () => {
    try {
      const [allNotes, allThemes, accessData] = await Promise.all([
        noteService.getAll(),
        wikiService.getAllThemes(),
        profileService.getWellnessAccess(),
      ]);

      runScopedTransition(lifeWikiScopeRef.current, () => {
        setNotes(allNotes);
        setThemes(allThemes);
        setAccess(accessData);
      });
    } catch (error) {
      console.error('[LifeWiki] Failed to load data:', error);
    } finally {
      setHasLoadedLibrary(true);
    }
  };

  useEffect(() => {
    void loadData();
    void loadRunActivity();
  }, []);

  useEffect(() => {
    if (!runDetail || !ACTIVE_RUN_STATUSES.has(runDetail.run.status)) return;

    const timer = window.setInterval(() => {
      void loadRunActivity(runDetail.run.id);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [runDetail?.run.id, runDetail?.run.status]);

  useEffect(() => {
    // If we came from Insights, the transition animation already played there.
    // Skip the local entrance animation to prevent redundancy.
    if (!shouldPlayEntryAnimation || cameFromInsights) {
      setIsEnteringWiki(false);
      return;
    }

    setIsEnteringWiki(true);
    const timeoutId = window.setTimeout(() => setIsEnteringWiki(false), 2400);

    return () => window.clearTimeout(timeoutId);
  }, [cameFromInsights, location.key, shouldPlayEntryAnimation]);

  const gate = useMemo(() => {
    if (!access) return null;
    return getWikiInsightsGate(access, notes.length);
  }, [access, notes.length]);

  const wikiPages = useMemo(
    () => themes.filter((theme) => isUserVisibleWikiPage(theme.pageType)),
    [themes],
  );
  const pageMap = useMemo(() => getPageMap(wikiPages), [wikiPages]);
  const primaryPages = useMemo(
    () => wikiPages.filter((theme) => SANCTUARY_WIKI_PAGES.includes(theme.pageType as (typeof SANCTUARY_WIKI_PAGES)[number])),
    [wikiPages],
  );
  const supportingPages = useMemo(
    () => wikiPages.filter((theme) => SUPPORTING_WIKI_PAGES.includes(theme.pageType as (typeof SUPPORTING_WIKI_PAGES)[number])),
    [wikiPages],
  );
  const hasEnoughEntriesForWiki = notes.length >= FREE_WIKI_MINIMUM_ENTRIES;
  const entriesNeededForWiki = Math.max(FREE_WIKI_MINIMUM_ENTRIES - notes.length, 0);
  const canShowSanctuaryRooms = hasEnoughEntriesForWiki || primaryPages.length > 0;
  const lastRefreshLabel = getLastRefreshLabel(wikiPages);
  const refreshClause = lastRefreshLabel === 'Not refreshed yet' ? 'not refreshed yet' : `last refreshed ${lastRefreshLabel}`;
  const librarySummary = `${notes.length} ${notes.length === 1 ? 'entry' : 'entries'} · ${wikiPages.length} generated ${wikiPages.length === 1 ? 'page' : 'pages'} · ${refreshClause}`;

  const articlePageType =
    pageType !== 'theme' && pageType !== 'index' && isUserVisibleWikiPage(pageType)
      ? pageType
      : null;
  const articlePage = articlePageType ? pageMap.get(articlePageType) || null : null;
  const articleMeta = [...SANCTUARY_META, ...SUPPORTING_META].find(
    (meta) => meta.pageType === articlePageType,
  );
  const sourceIds = articlePage ? extractSourceIds(articlePage.content) : [];
  const reviewSummary = articlePageType
    ? getLifeWikiReviewSummary(runDetail?.events || [], articlePageType, sourceIds.length)
    : null;
  const sourceNoteMap = useMemo(() => new Map(notes.map((note) => [note.id, note])), [notes]);

  const handleRefreshWiki = async () => {
    if (!gate?.canGenerate) return;

    setIsRefreshingWiki(true);
    setRefreshFeedback(null);

    try {
      const refreshResult = await aiRunClient.startLifeWikiRefresh({ trigger: 'manual' });

      if (refreshResult.source === 'none' || refreshResult.pageCount === 0) {
        setRefreshFeedback({
          variant: 'warning',
          title: 'Nothing could be built yet',
          description: 'The Life Wiki did not find enough usable signal this time. Add a little more detail to your reflections and try again.',
        });
      }

      await loadData();
      await loadRunActivity(refreshResult.runId);
    } catch (error) {
      const newAccess = await profileService.getWellnessAccess().catch(() => access);
      setAccess(newAccess || null);
      setRefreshFeedback({
        variant: 'error',
        title: 'Refresh failed',
        description: "I couldn't refresh the Life Wiki just now. Please try again in a moment.",
      });
      console.error('[LifeWiki] Failed to refresh wiki:', error);
    } finally {
      setIsRefreshingWiki(false);
    }
  };

  const sourceLink = (noteId: string, children: React.ReactNode) => {
    const note = sourceNoteMap.get(noteId);

    if (!note) {
      return (
        <span className="metadata-pill">
          {children}
        </span>
      );
    }

    return (
      <button
        type="button"
        onClick={() => navigate(notePath(noteId))}
        className="inline-flex rounded-full border border-green/20 bg-green/5 px-2 py-0.5 label-caps text-green transition-colors hover:border-green/40 hover:bg-green/10"
      >
        {children}
      </button>
    );
  };

  // A single chapter row in the library's table of contents — no card grid.
  const renderRoomRow = (
    meta: PageMeta,
    page?: LifeTheme | null,
    isSupporting = false,
    locked = false,
  ) => {
    if (!page && isSupporting) return null;

    const isEmptyRoom = !page;
    const sources = page ? extractSourceIds(page.content) : [];
    const tone = ROOM_TONE_CLASSES[meta.tone];
    const metaLine = locked
      ? 'Opens after 3 entries'
      : isSupporting
        ? 'Supporting page'
        : isEmptyRoom
          ? 'Awaiting signal'
          : `${sources.length} source${sources.length === 1 ? '' : 's'} · updated ${new Date(page!.updatedAt).toLocaleDateString()}`;

    const innerContent = (
      <div className="flex items-start justify-between gap-6 py-6">
        <div className="min-w-0 space-y-2">
          <h3 className="text-xl font-display font-bold text-gray-text md:text-2xl">{meta.label}</h3>
          <p className="dashboard-editorial-preview line-clamp-2">
            {isEmptyRoom ? meta.emptyLine || meta.description : previewText(page!.content)}
          </p>
          <p className="dashboard-caption text-gray-nav/70">{metaLine}</p>
        </div>
        <div className="shrink-0 pt-1.5">
          {locked ? (
            <Lock size={18} weight="duotone" className="text-gray-nav/50" />
          ) : (
            <CaretRight size={18} weight="bold" className={`${tone.text} transition-transform duration-500 ease-out-expo group-hover:translate-x-1`} />
          )}
        </div>
      </div>
    );

    if (locked) {
      return (
        <div key={meta.pageType} className="opacity-70">
          {innerContent}
        </div>
      );
    }

    return (
      <Link
        key={meta.pageType}
        to={articlePath(meta.pageType)}
        className="group block rounded-[var(--radius-control)] px-2 transition-colors duration-300 hover:bg-green/[0.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-green/40"
        aria-label={`Open ${meta.label} Sanctuary page`}
      >
        {innerContent}
      </Link>
    );
  };

  const renderRunActivity = () => {
    const lastRun = recentRuns[0];
    if (!lastRun) return null;
    const summary = `Last refreshed ${new Date(lastRun.started_at || lastRun.created_at).toLocaleDateString()} · ${lastRun.page_count || 0} room${lastRun.page_count === 1 ? '' : 's'} touched.`;

    return (
      <section>
        <p className="dashboard-supporting-text">{summary}</p>

        <details className="group mt-2">
            <summary className="inline-flex w-fit cursor-pointer list-none items-center gap-1.5 label-caps text-green transition-colors hover:text-green/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40">
              View refresh history
              <CaretRight size={14} weight="bold" className="transition-transform duration-300 group-open:rotate-90" />
            </summary>

            <div className="mt-4 space-y-1">
              {recentRuns.slice(0, 6).map((run) => (
                <button
                  key={run.id}
                  type="button"
                  onClick={() => {
                    void loadRunActivity(run.id);
                  }}
                  className={`flex w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:text-green ${
                    runDetail?.run.id === run.id ? 'text-green' : 'text-gray-text'
                  }`}
                >
                  <span className="flex items-baseline gap-2">
                    <span className="text-sm font-bold">{formatRunTrigger(run.trigger)}</span>
                    <span className="dashboard-caption text-gray-nav/70">
                      {new Date(run.started_at || run.created_at).toLocaleDateString()}
                    </span>
                  </span>
                  <span className="dashboard-caption text-green">
                    {formatRunStatus(run.status)} · {run.page_count || 0} room{run.page_count === 1 ? '' : 's'}
                  </span>
                </button>
              ))}
            </div>

            {runDetail && runDetail.events.length > 0 ? (
              <div className="mt-4">
                <p className="dashboard-caption text-gray-nav/70">Timeline</p>
                <ul className="mt-2 space-y-1.5">
                  {runDetail.events.map((event) => (
                    <li key={event.id} className="text-sm font-medium text-gray-light">
                      {event.event_type.replace(/_/g, ' ')}
                      {event.page_type ? <span className="text-gray-nav"> · {event.page_type}</span> : null}
                      <span className="text-gray-nav/60"> · {new Date(event.created_at).toLocaleTimeString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </details>
      </section>
    );
  };

  const renderEntrance = () => (
      (isRefreshingWiki || isEnteringWiki) ? (
        <div
          className="fixed inset-0 z-overlay flex items-center justify-center overflow-hidden bg-body px-6 animate-fade-in"
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
                loop={isRefreshingWiki || isEnteringWiki}
              />
            </div>
          </div>
          <div
            className="relative z-10 flex max-w-[42rem] flex-col items-center text-center animate-fade-in-up"
          >
            <p className="label-caps text-green">
              {isRefreshingWiki ? 'Reading only your saved notes' : 'Private reading room'}
            </p>
            <h2 className="mt-4 text-4xl font-display font-bold leading-tight text-gray-text md:text-5xl">
              {isRefreshingWiki ? 'Refreshing your Life Wiki...' : 'Opening Sanctuary'}
            </h2>
            <p className="mt-4 max-w-[65ch] text-base font-medium leading-relaxed text-gray-light">
              {isRefreshingWiki
                ? 'The library is rebuilding from the writing you saved here.'
                : 'Crossing into the library without leaving the calm of the page.'}
            </p>
          </div>
        </div>
      ) : null
  );

  if (articlePageType) {
    const articleTone = articleMeta ? ROOM_TONE_CLASSES[articleMeta.tone] : ROOM_TONE_CLASSES.green;

    return (
      <>
        {renderEntrance()}
        <div className="fixed inset-0 pointer-events-none z-deep overflow-hidden bg-body">
          <div className="sanctuary-page-fade absolute inset-0 opacity-50" />
        </div>
        <PageContainer size="narrow" className="surface-scope-sage page-wash pb-24 pt-6 md:pt-10 relative z-10">
          <div
            ref={lifeWikiScopeRef}
            className={`core-page-stack transition-[opacity,transform] duration-500 ease-out-expo ${isEnteringWiki ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
          >
            <button
              onClick={() => navigate(RoutePath.SANCTUARY)}
              className="group flex items-center gap-2 text-sm font-bold text-gray-nav hover:text-green transition-[color,transform] duration-300 w-fit hover:-translate-x-1"
              aria-label="Back to Sanctuary"
            >
              <ArrowLeft size={16} weight="bold" className="transition-transform group-hover:scale-110" />
              <span>Back</span>
            </button>

            {!articlePage ? (
              !hasLoadedLibrary ? (
                <Surface variant="flat" tone="sky" className="p-8 md:p-10">
                  <div className="max-w-xl">
                    <p className="label-caps text-green">
                      Opening room
                    </p>
                    <h2 className="mt-3 text-4xl font-display font-bold text-gray-text">
                      Reading the shelf...
                    </h2>
                  </div>
                </Surface>
              ) : !canShowSanctuaryRooms ? (
                <Surface variant="bezel" tone="sage" innerClassName="p-8 md:p-10">
                  <div className="max-w-2xl">
                    <p className="label-caps text-green">
                      Life Wiki opens after 3 entries
                    </p>
                    <h2 className="mt-3 text-4xl font-display font-bold text-gray-text">
                      Still gathering enough signal.
                    </h2>
                    <p className="mt-4 max-w-[65ch] text-base font-medium leading-relaxed text-gray-light">
                      Write {entriesNeededForWiki} more {entriesNeededForWiki === 1 ? 'entry' : 'entries'} before this Life Wiki room opens.
                    </p>
                    <Button
                      variant="primary"
                      className="mt-7 h-12 px-6 label-caps"
                      onClick={() => navigate(RoutePath.CREATE_NOTE)}
                    >
                      {notes.length === 0 ? 'Begin your first entry' : 'Write another entry'}
                    </Button>
                  </div>
                </Surface>
              ) : (
                <article className="space-y-8">
                  <header className="space-y-4 pb-2">
                    <p className={`label-caps ${articleTone.text}`}>
                      Room awaiting signal
                    </p>
                    <h1 className="max-w-3xl text-4xl font-display font-extrabold text-gray-text sm:text-5xl md:text-6xl">
                      {articleMeta?.label || 'This page'}
                    </h1>
                    <p className="max-w-[65ch] font-serif text-xl italic leading-relaxed text-gray-text/75">
                      {articleMeta?.emptyLine || 'This room will collect the notes that belong together.'}
                    </p>
                  </header>

                  <Surface variant="flat" tone="sky" className="p-8 md:p-12">
                    <div className="flex max-w-lg flex-col">
                      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green/10 text-green">
                        <Sparkle size={32} weight="duotone" />
                      </div>
                      <h2 className="text-2xl font-display font-bold text-gray-text">
                        Awaiting your signal
                      </h2>
                      <p className="mt-4 mb-8 max-w-[65ch] text-base font-medium leading-relaxed text-gray-light">
                        This Life Wiki room is ready, but it has not been written yet. The AI will read through your saved reflections and organize the patterns it finds here.
                      </p>
                      {!gate?.requiresUpgrade ? (
                        <Button
                          variant="primary"
                          onClick={handleRefreshWiki}
                          isLoading={isRefreshingWiki}
                          disabled={isRefreshingWiki || !gate?.canGenerate}
                          className="px-8"
                        >
                          <Sparkle size={16} weight="fill" className="mr-2" />
                          Draft this room
                        </Button>
                      ) : (
                        <Button variant="primary" className="px-8" onClick={() => navigate(RoutePath.ACCOUNT)}>
                          See Pro options
                        </Button>
                      )}
                    </div>
                  </Surface>
                </article>
              )
            ) : (
              <article className="space-y-8">
                <header className="space-y-4 pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <MetadataPill tone={articleMeta?.tone === 'green' ? 'green' : 'blue'}>
                      {articleMeta?.label || articlePage.title}
                    </MetadataPill>
                    <MetadataPill tone="green">Updated {new Date(articlePage.updatedAt).toLocaleDateString()}</MetadataPill>
                    <MetadataPill tone="green">{sourceIds.length} source{sourceIds.length === 1 ? '' : 's'}</MetadataPill>
                  </div>
                  <h1 className="max-w-3xl text-4xl font-display font-extrabold text-gray-text sm:text-5xl md:text-6xl">
                    {articlePage.title}
                  </h1>
                  <p className="max-w-[65ch] text-base font-medium leading-relaxed text-gray-light">
                    This AI-generated wiki page is based on notes you saved here. Source badges point back to the entries that can support a claim.
                  </p>
                </header>

                <Surface variant="flat" tone="sage" className="p-6 md:p-10">
                  <div className="dashboard-prose dashboard-prose-wide mx-auto space-y-5">
                    <ReactMarkdown
                      skipHtml
                      components={{
                        a: ({ href, children }) => {
                          if (href?.startsWith(SOURCE_LINK_PREFIX)) {
                            const noteId = decodeURIComponent(href.slice(SOURCE_LINK_PREFIX.length));
                            return sourceLink(noteId, children);
                          }

                          return (
                            <a href={href} className="text-green underline decoration-green/30 underline-offset-4">
                              {children}
                            </a>
                          );
                        },
                        h1: ({ children }) => (
                          <h2 className="mt-12 text-4xl font-display font-bold text-gray-text first:mt-0">{children}</h2>
                        ),
                        h2: ({ children }) => (
                          <h2 className="mt-10 text-3xl font-display font-bold text-gray-text first:mt-0">{children}</h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="mt-8 text-2xl font-display font-bold text-gray-text">{children}</h3>
                        ),
                        p: ({ children }) => <p className="mb-5 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="mb-5 list-disc space-y-2 pl-6">{children}</ul>,
                        ol: ({ children }) => <ol className="mb-5 list-decimal space-y-2 pl-6">{children}</ol>,
                      }}
                    >
                      {renderSourceMarkersAsLinks(articlePage.content)}
                    </ReactMarkdown>
                  </div>
                </Surface>

                <Surface variant="flat" tone="paper" className="p-5 md:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="label-caps text-green">Review summary</p>
                      <p className="mt-2 text-sm font-semibold leading-relaxed text-gray-light">
                        {reviewSummary?.reviewedAtLabel
                          ? `${reviewSummary.label} ${reviewSummary.reviewedAtLabel}. ${reviewSummary.sourceLabel}.`
                          : `${reviewSummary?.label || 'No review event loaded'}. ${reviewSummary?.sourceLabel || '0 sources visible'}.`}
                      </p>
                    </div>
                    <MetadataPill tone={reviewSummary?.tone || 'neutral'}>
                      {reviewSummary?.label || 'No review event loaded'}
                    </MetadataPill>
                  </div>
                </Surface>

                <Surface variant="flat" tone="sky" className="p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Book size={18} weight="duotone" className="text-green" />
                    <h2 className="label-caps text-gray-nav">
                      Source notes
                    </h2>
                  </div>
                  {sourceIds.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {sourceIds.map((sourceId) => {
                        const note = sourceNoteMap.get(sourceId);

                        return note ? (
                          <button
                            key={sourceId}
                            type="button"
                            onClick={() => navigate(notePath(sourceId))}
                            className="rounded-full border border-green/20 bg-green/5 px-3 py-2 text-xs font-bold text-green transition-colors hover:border-green/40 hover:bg-green/10"
                          >
                            {note.title || 'Untitled reflection'}
                          </button>
                        ) : (
                          <span
                            key={sourceId}
                            className="metadata-pill"
                          >
                            {sourceId}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-gray-light">
                      This older page does not include inline source badges yet.
                    </p>
                  )}
                </Surface>
              </article>
            )}
            </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      {renderEntrance()}
      <div className="fixed inset-0 pointer-events-none z-[-2] overflow-hidden bg-body">
        <div className="sanctuary-page-fade absolute inset-0 opacity-50" />
      </div>

      <PageContainer className="surface-scope-sage page-wash pb-24 pt-6 md:pt-10 relative z-10">
        <div
          ref={lifeWikiScopeRef}
          className={`core-page-stack transition-[opacity,transform] duration-500 ease-out-expo ${isEnteringWiki ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
        >
          <div className="flex items-center justify-between gap-4">
            <button 
              onClick={() => navigate(RoutePath.INSIGHTS)}
              className="flex min-h-11 w-fit items-center gap-2 rounded-[var(--radius-control)] px-2 text-sm font-bold text-gray-nav transition-colors hover:bg-green/5 hover:text-green"
              aria-label="Back to Insights"
            >
              <ArrowLeft size={16} weight="bold" />
              <span>Back</span>
            </button>

            {!gate?.requiresUpgrade ? (
              <button
                type="button"
                onClick={handleRefreshWiki}
                disabled={isRefreshingWiki || !gate?.canGenerate}
                className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-green/20 bg-green/5 px-3 py-2 label-caps text-green transition-colors hover:border-green/40 hover:bg-green/10 disabled:opacity-50 sm:px-4"
                aria-label="Refresh Life Wiki with AI"
              >
                <Sparkle size={16} weight="fill" />
                <span className="hidden sm:inline">Refresh with AI</span>
              </button>
            ) : null}
          </div>

          <SectionHeader
            title="Your Life Wiki"
            description="A dedicated Life Wiki library of AI-generated pages, refreshed when you ask or when Smart Mode is on."
          />

          {gate?.requiresUpgrade ? (
            <Alert
              variant="warning"
              icon={<Warning size={20} weight="fill" />}
              title="You have used your free Life Wiki refresh."
              description="You can still read what is already here. Pro adds more refreshes for the weeks when life is a lot."
              actions={
                <Button size="sm" variant="primary" className="font-bold" onClick={() => navigate(RoutePath.ACCOUNT)}>
                  See Pro options
                </Button>
              }
            />
          ) : null}

          {refreshFeedback ? (
            <Alert
              variant={refreshFeedback.variant}
              icon={<Warning size={20} weight="fill" />}
              title={refreshFeedback.title}
              description={refreshFeedback.description}
            />
          ) : null}

          {!hasEnoughEntriesForWiki ? (
            <Surface variant="bezel" tone="sage" innerClassName="p-7 md:p-9">
              <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
                <div className="max-w-2xl space-y-5">
                  <p className="label-caps text-green">
                    Life Wiki opens after 3 entries
                  </p>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-display font-bold leading-tight text-gray-text md:text-4xl">
                      Still gathering enough signal.
                    </h2>
                    <p className="text-base font-medium leading-relaxed text-gray-light">
                      Write {entriesNeededForWiki} more {entriesNeededForWiki === 1 ? 'entry' : 'entries'} before the Life Wiki can build pages that are grounded in your notes.
                    </p>
                  </div>
                  <div className="grid max-w-sm grid-cols-3 gap-2" aria-hidden="true">
                    {Array.from({ length: FREE_WIKI_MINIMUM_ENTRIES }).map((_, index) => (
                      <span
                        key={index}
                        className={`h-1.5 rounded-full transition-opacity duration-300 ease-out-expo ${
                          index < notes.length ? 'bg-green opacity-100' : 'bg-border opacity-80'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <Button
                  variant="primary"
                  className="h-12 shrink-0 px-6 label-caps"
                  onClick={() => navigate(RoutePath.CREATE_NOTE)}
                >
                  {notes.length === 0 ? 'Begin your first entry' : 'Write another entry'}
                </Button>
              </div>
            </Surface>
          ) : null}

          {hasEnoughEntriesForWiki && primaryPages.length === 0 ? (
            <Surface variant="bezel" tone="sage" innerClassName="p-7 md:p-9">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="max-w-2xl space-y-3">
                  <p className="label-caps text-green">
                    Life Wiki ready
                  </p>
                  <h2 className="text-3xl font-display font-bold text-gray-text">
                    {gate?.requiresUpgrade ? 'Future Life Wiki refreshes are locked.' : 'Your first Life Wiki refresh is ready.'}
                  </h2>
                  <p className="text-base font-medium leading-relaxed text-gray-light">
                    {gate?.requiresUpgrade
                      ? 'This account has used its free Life Wiki refresh. Existing generated pages stay readable; another refresh needs Pro.'
                      : 'Refresh with AI to create the five Life Wiki pages from the entries you have saved here.'}
                  </p>
                </div>
                {!gate?.requiresUpgrade ? (
                  <Button
                    variant="primary"
                    onClick={handleRefreshWiki}
                    isLoading={isRefreshingWiki}
                    disabled={isRefreshingWiki || !gate?.canGenerate}
                  >
                    <Sparkle size={16} weight="fill" className="mr-2" />
                    Refresh with AI
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => navigate(RoutePath.ACCOUNT)}
                  >
                    See Pro options
                  </Button>
                )}
              </div>
            </Surface>
          ) : null}

          <p className="dashboard-supporting-text">{librarySummary}</p>

          <section className="space-y-2">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-display font-bold text-gray-text">Life Wiki pages</h2>
              <p className="mt-2 text-sm font-medium text-gray-light">
                The five main rooms for this library
                {hasEnoughEntriesForWiki
                  ? ', kept visible once your Life Wiki is ready.'
                  : ' — they open once you have 3 entries.'}
              </p>
            </div>

            <div>
              {SANCTUARY_META.map((meta) =>
                renderRoomRow(
                  meta,
                  pageMap.get(meta.pageType),
                  false,
                  !hasEnoughEntriesForWiki && !pageMap.get(meta.pageType),
                ),
              )}
            </div>
          </section>

          {supportingPages.length > 0 ? (
            <section className="space-y-2">
              <div>
                <h2 className="text-2xl font-display font-bold text-gray-text">Supporting shelf</h2>
                <p className="mt-2 text-sm font-medium text-gray-light">
                  Earlier generated summaries remain readable, but the five Life Wiki pages are the main surface.
                </p>
              </div>
              <div>
                {SUPPORTING_META.filter((meta) => pageMap.has(meta.pageType)).map((meta) =>
                  renderRoomRow(meta, pageMap.get(meta.pageType), true),
                )}
              </div>
            </section>
          ) : null}

          {renderRunActivity()}
        </div>
      </PageContainer>
    </>
  );
};
