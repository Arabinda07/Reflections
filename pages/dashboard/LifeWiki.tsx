import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft,
  Book,
  CaretRight,
  Sparkle,
  Warning,
} from '@phosphor-icons/react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { MetadataPill } from '../../components/ui/MetadataPill';
import { PageContainer } from '../../components/ui/PageContainer';
import { Surface } from '../../components/ui/Surface';
import { LifeTheme, Note, RoutePath, WellnessAccess } from '../../types';
import { noteService } from '../../services/noteService';
import { wikiService } from '../../services/wikiService';
import { aiService } from '../../services/aiService';
import { profileService } from '../../services/profileService';
import { FREE_WIKI_MINIMUM_ENTRIES, getWikiInsightsGate } from '../../services/wellnessPolicy';
import {
  SANCTUARY_WIKI_PAGES,
  SUPPORTING_WIKI_PAGES,
  isUserVisibleWikiPage,
  type WikiPageType,
} from '../../services/wikiTypes';
import { trackLifeWikiRefreshedDeferred } from '../../src/analytics/deferredEvents';
import { SANCTUARY_LEVEL_UP_ANIMATION_SRC } from '../../src/lottie/sanctuaryAnimation';

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

export const LifeWiki: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pageType } = useParams();
  const shouldReduceMotion = useReducedMotion();
  const cameFromInsights = Boolean(location.state?.fromInsights);
  const shouldPlayEntryAnimation =
    !shouldReduceMotion && (location.pathname === RoutePath.WIKI || location.pathname === RoutePath.SANCTUARY);
  const [notes, setNotes] = useState<Note[]>([]);
  const [themes, setThemes] = useState<LifeTheme[]>([]);
  const [access, setAccess] = useState<WellnessAccess | null>(null);
  const [isRefreshingWiki, setIsRefreshingWiki] = useState(false);
  const [isEnteringWiki, setIsEnteringWiki] = useState(shouldPlayEntryAnimation && !cameFromInsights);
  const [hasLoadedLibrary, setHasLoadedLibrary] = useState(false);
  const [refreshFeedback, setRefreshFeedback] = useState<RefreshFeedback | null>(null);

  const loadData = async () => {
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
      console.error('[LifeWiki] Failed to load data:', error);
    } finally {
      setHasLoadedLibrary(true);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

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
  const roomsReadyLabel =
    primaryPages.length > 0
      ? `${primaryPages.length} of ${SANCTUARY_META.length} generated`
      : hasEnoughEntriesForWiki
        ? 'Ready for first refresh'
        : `${entriesNeededForWiki} more ${entriesNeededForWiki === 1 ? 'entry' : 'entries'}`;

  const articlePageType =
    pageType !== 'theme' && pageType !== 'index' && isUserVisibleWikiPage(pageType)
      ? pageType
      : null;
  const articlePage = articlePageType ? pageMap.get(articlePageType) || null : null;
  const articleMeta = [...SANCTUARY_META, ...SUPPORTING_META].find(
    (meta) => meta.pageType === articlePageType,
  );
  const sourceIds = articlePage ? extractSourceIds(articlePage.content) : [];
  const sourceNoteMap = useMemo(() => new Map(notes.map((note) => [note.id, note])), [notes]);

  const handleRefreshWiki = async () => {
    if (!gate?.canGenerate) return;

    setIsRefreshingWiki(true);
    setRefreshFeedback(null);
    let claimedFreeRefresh = false;

    try {
      if (access?.planTier !== 'pro') {
        claimedFreeRefresh = await profileService.incrementFreeWikiInsights();

        if (!claimedFreeRefresh) {
          const newAccess = await profileService.getWellnessAccess();
          setAccess(newAccess);
          return;
        }
      }

      const refreshResult = await aiService.refreshWikiOnDemand(notes);

      if (claimedFreeRefresh && (refreshResult.source === 'none' || refreshResult.pageCount === 0)) {
        await profileService.releaseClaimedFreeWikiInsight();
        claimedFreeRefresh = false;
        setRefreshFeedback({
          variant: 'warning',
          title: 'Nothing could be built yet',
          description: 'The Life Wiki did not find enough usable signal this time. Add a little more detail to your reflections and try again.',
        });
      }

      if (refreshResult.pageCount > 0) {
        trackLifeWikiRefreshedDeferred({
          planTier: access?.planTier || 'free',
          entryCount: notes.length,
          pageCount: refreshResult.pageCount,
          source: refreshResult.source,
          usedFreeRefresh: claimedFreeRefresh,
        });
      }

      await loadData();
    } catch (error) {
      if (claimedFreeRefresh) {
        await profileService.releaseClaimedFreeWikiInsight().catch((refundError) => {
          console.error('[LifeWiki] Failed to refund wiki refresh claim:', refundError);
        });
      }

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

  const renderPageCard = (meta: PageMeta, page?: LifeTheme | null, isSupporting = false) => {
    if (!page && isSupporting) return null;

    const isEmptyRoom = !page;
    const sources = page ? extractSourceIds(page.content) : [];
    const tone = ROOM_TONE_CLASSES[meta.tone];

    return (
      <div
        key={meta.pageType}
        className={`group relative h-full overflow-hidden rounded-[2.5rem] surface-flat ${tone.surface} dashboard-tone-card transition-[box-shadow,transform] duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)]`}
      >
        <Link
          to={articlePath(meta.pageType)}
          className="relative z-10 flex h-full min-h-[260px] flex-col justify-between p-8 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-green/40 md:p-10"
          aria-label={`Open ${meta.label} Sanctuary page`}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <span className={`dashboard-caption ${tone.accent}`}>
                {isSupporting ? 'Supporting page' : isEmptyRoom ? 'Room awaiting signal' : 'Generated page'}
              </span>
              <CaretRight size={18} weight="bold" className={`${tone.text} transition-transform duration-500 ease-out-expo group-hover:translate-x-1`} />
            </div>
            <div className="space-y-4">
              <h2 className="dashboard-card-title-lg dashboard-hover-title">{meta.label}</h2>
              <p className="dashboard-editorial-preview line-clamp-4 transition-colors duration-300 group-hover:text-gray-text">
                {isEmptyRoom ? meta.emptyLine || meta.description : previewText(page.content)}
              </p>
              {isEmptyRoom && (
                <div className="dashboard-caption flex items-center gap-2 opacity-70">
                  <Sparkle size={12} weight="fill" className="text-green" />
                  <span>Awaiting signal</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <MetadataPill tone={isEmptyRoom ? undefined : 'green'} className="transition-transform group-hover:scale-105">
              {isEmptyRoom ? 'Empty room' : `${sources.length} source${sources.length === 1 ? '' : 's'}`}
            </MetadataPill>
            <MetadataPill className="transition-transform group-hover:scale-105">
              {isEmptyRoom ? 'Ready' : new Date(page.updatedAt).toLocaleDateString()}
            </MetadataPill>
          </div>
        </Link>
        <div className="dashboard-accent-glow pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </div>
    );
  };

  const renderEntrance = () => (
    <AnimatePresence>
      {(isRefreshingWiki || isEnteringWiki) && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-body px-6"
        >
          <div className="sanctuary-entrance-glow absolute inset-0" />
          <div className="sanctuary-entrance-scrim absolute inset-0" />
          <motion.div
            aria-hidden="true"
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: shouldReduceMotion ? 0.14 : 0.8, scale: 1 }}
            transition={{ delay: shouldReduceMotion ? 0 : 0.08, duration: shouldReduceMotion ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
          >
            <div className="h-[min(66vmin,34rem)] w-[min(66vmin,34rem)]">
              <DotLottieReact src={SANCTUARY_LEVEL_UP_ANIMATION_SRC} autoplay loop={isRefreshingWiki || isEnteringWiki} />
            </div>
          </motion.div>
          <motion.div
            initial={shouldReduceMotion ? false : { y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: shouldReduceMotion ? 0 : 0.12, duration: shouldReduceMotion ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex max-w-[42rem] flex-col items-center text-center"
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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (articlePageType) {
    const articleTone = articleMeta ? ROOM_TONE_CLASSES[articleMeta.tone] : ROOM_TONE_CLASSES.green;

    return (
      <>
        {renderEntrance()}
        <div className="fixed inset-0 pointer-events-none z-[-2] overflow-hidden bg-body">
          <div className="sanctuary-page-fade absolute inset-0 opacity-50" />
        </div>
        <PageContainer size="narrow" className="surface-scope-sage page-wash pb-24 pt-6 md:pt-10 relative z-10">
          <motion.div 
            className="core-page-stack"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
            animate={{ opacity: isEnteringWiki ? 0 : 1, y: isEnteringWiki ? 15 : 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
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
                  <div className="mx-auto max-w-xl text-center">
                    <p className="label-caps text-green">
                      Opening room
                    </p>
                    <h1 className="mt-3 text-4xl font-display font-bold text-gray-text">
                      Reading the shelf...
                    </h1>
                  </div>
                </Surface>
              ) : !canShowSanctuaryRooms ? (
                <Surface variant="bezel" tone="sage" innerClassName="p-8 md:p-10">
                  <div className="mx-auto max-w-2xl text-center">
                    <p className="label-caps text-green">
                      Life Wiki unlocks after 3 entries
                    </p>
                    <h1 className="mt-3 text-4xl font-display font-bold text-gray-text">
                      Still gathering enough signal.
                    </h1>
                    <p className="mx-auto mt-4 max-w-[65ch] text-base font-medium leading-relaxed text-gray-light">
                      Write {entriesNeededForWiki} more {entriesNeededForWiki === 1 ? 'entry' : 'entries'} before this Sanctuary room opens.
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

                  <Surface variant="flat" tone="sky" className="p-8 md:p-12 text-center">
                    <div className="flex flex-col items-center max-w-lg mx-auto">
                      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green/10 text-green">
                        <Sparkle size={32} weight="duotone" />
                      </div>
                      <h2 className="text-2xl font-display font-bold text-gray-text">
                        Awaiting your signal
                      </h2>
                      <p className="mt-4 mb-8 text-base font-medium leading-relaxed text-gray-light">
                        This Sanctuary room is ready to be drafted. The AI will read through your saved reflections and organize the patterns it finds here.
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
                    <span className={`metadata-pill ${articleTone.surface}`}>
                      {articleMeta?.label || articlePage.title}
                    </span>
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
            </motion.div>
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
        <motion.div 
          className="core-page-stack"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
          animate={{ opacity: isEnteringWiki ? 0 : 1, y: isEnteringWiki ? 15 : 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
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
                className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-green/20 bg-green/5 px-4 py-2 label-caps text-green transition-colors hover:border-green/40 hover:bg-green/10 disabled:opacity-50"
              >
                <Sparkle size={16} weight="fill" />
                <span className="hidden sm:inline">Refresh with AI</span>
              </button>
            ) : null}
          </div>

          <header className="mx-auto max-w-4xl space-y-5 pb-3 text-center">
            <h1 className="text-4xl font-display font-extrabold text-gray-text sm:text-5xl md:text-6xl">
              Your Life Wiki
            </h1>
            <p className="mx-auto max-w-[65ch] text-lg font-medium leading-relaxed text-gray-light">
              A dedicated Sanctuary library of AI-generated wiki pages, refreshed only when you ask.
            </p>
          </header>

          {gate?.requiresUpgrade ? (
            <Alert
              variant="warning"
              icon={<Warning size={20} weight="fill" />}
              title="You have used your free Life Wiki refresh."
              description="You can still read what is already here. Upgrade when you want to keep refreshing it with AI."
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

          <section className="border-y border-border/60 py-5">
            <div className="grid gap-0 divide-y divide-border/60 md:grid-cols-4 md:divide-x md:divide-y-0">
              {[
                ['Entries', notes.length.toString()],
                ['Generated pages', wikiPages.length.toString()],
                ['Last refresh', getLastRefreshLabel(wikiPages)],
                ['Rooms ready', roomsReadyLabel],
              ].map(([label, value]) => (
                <div key={label} className="px-0 py-4 first:pt-0 last:pb-0 md:px-5 md:py-0 md:first:pl-0 md:last:pr-0">
                  <p className="label-caps text-gray-nav">{label}</p>
                  <p className="dashboard-stat-value mt-2 !text-base">{value}</p>
                </div>
              ))}
            </div>
          </section>

          {!hasEnoughEntriesForWiki ? (
            <Surface variant="bezel" tone="sage" innerClassName="p-7 md:p-9">
              <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
                <div className="max-w-2xl space-y-5">
                  <p className="label-caps text-green">
                    Life Wiki unlocks after 3 entries
                  </p>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-display font-bold leading-tight text-gray-text md:text-4xl">
                      Still gathering enough signal.
                    </h2>
                    <p className="text-base font-medium leading-relaxed text-gray-light">
                      Write {entriesNeededForWiki} more {entriesNeededForWiki === 1 ? 'entry' : 'entries'} before the Sanctuary can build pages that are grounded in your notes.
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
            <Surface variant="bezel" tone="honey" innerClassName="p-7 md:p-9">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="max-w-2xl space-y-3">
                  <p className="label-caps text-green">
                    Sanctuary ready
                  </p>
                  <h2 className="text-3xl font-display font-bold text-gray-text">
                    {gate?.requiresUpgrade ? 'Future Life Wiki refreshes are locked.' : 'Your first Life Wiki refresh is ready.'}
                  </h2>
                  <p className="text-base font-medium leading-relaxed text-gray-light">
                    {gate?.requiresUpgrade
                      ? 'This account has used its free Life Wiki refresh. Existing generated pages stay readable; another refresh needs Pro.'
                      : 'Refresh with AI to create the five Sanctuary pages from the entries you have saved here.'}
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

          {canShowSanctuaryRooms ? (
            <section className="space-y-5">
              <div className="max-w-2xl">
                <div>
                  <h2 className="text-2xl font-display font-bold text-gray-text">Sanctuary pages</h2>
                  <p className="mt-2 text-sm font-medium text-gray-light">
                    The five main rooms for this library, kept visible once your Life Wiki is unlocked.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {SANCTUARY_META.map((meta) => renderPageCard(meta, pageMap.get(meta.pageType)))}
              </div>
            </section>
          ) : null}

          {supportingPages.length > 0 ? (
            <section className="space-y-5">
              <div>
                <h2 className="text-2xl font-display font-bold text-gray-text">Supporting shelf</h2>
                <p className="mt-2 text-sm font-medium text-gray-light">
                  Earlier generated summaries remain readable, but the five Sanctuary pages are the main surface.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {SUPPORTING_META.filter((meta) => pageMap.has(meta.pageType)).map((meta) =>
                  renderPageCard(meta, pageMap.get(meta.pageType), true),
                )}
              </div>
            </section>
          ) : null}
        </motion.div>
      </PageContainer>
    </>
  );
};
