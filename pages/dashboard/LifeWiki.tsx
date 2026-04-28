import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft,
  Book,
  CaretRight,
  Hash,
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
import { trackLifeWikiRefreshed } from '../../src/analytics/events';
import {
  SANCTUARY_WIKI_PAGES,
  SUPPORTING_WIKI_PAGES,
  isUserVisibleWikiPage,
  type WikiPageType,
} from '../../services/wikiTypes';

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
  border: string;
  bg: string;
  wash: string;
  hover: string;
  iconBg: string;
  text: string;
}> = {
  blue: {
    accent: 'text-blue',
    border: 'border-blue/20',
    bg: 'bg-blue/5',
    wash: 'from-blue/10 via-white/40 to-body',
    hover: 'hover:border-blue/30 hover:bg-blue/10 hover:shadow-blue/10',
    iconBg: 'bg-blue/10',
    text: 'text-blue',
  },
  darkBlue: {
    accent: 'text-dark-blue',
    border: 'border-dark-blue/20',
    bg: 'bg-dark-blue/5',
    wash: 'from-dark-blue/10 via-white/40 to-body',
    hover: 'hover:border-dark-blue/30 hover:bg-dark-blue/10 hover:shadow-dark-blue/10',
    iconBg: 'bg-dark-blue/10',
    text: 'text-dark-blue',
  },
  golden: {
    accent: 'text-golden',
    border: 'border-golden/30',
    bg: 'bg-golden/10',
    wash: 'from-golden/15 via-white/40 to-body',
    hover: 'hover:border-golden/40 hover:bg-golden/20 hover:shadow-golden/10',
    iconBg: 'bg-golden/20',
    text: 'text-golden',
  },
  green: {
    accent: 'text-green',
    border: 'border-green/20',
    bg: 'bg-green/5',
    wash: 'from-green/10 via-white/40 to-body',
    hover: 'hover:border-green/30 hover:bg-green/10 hover:shadow-green/10',
    iconBg: 'bg-green/10',
    text: 'text-green',
  },
  orange: {
    accent: 'text-orange',
    border: 'border-orange/25',
    bg: 'bg-orange/10',
    wash: 'from-orange/15 via-white/40 to-body',
    hover: 'hover:border-orange/30 hover:bg-orange/20 hover:shadow-orange/10',
    iconBg: 'bg-orange/20',
    text: 'text-orange',
  },
};

const SOURCE_LINK_PREFIX = 'source-note:';
const SOURCE_MARKER_PATTERN = /\[source:([^\]]+)\]/gi;
const SANCTUARY_ENTRANCE_LOTTIE = '/assets/lottie/Level Up Animation.json';

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
  const [notes, setNotes] = useState<Note[]>([]);
  const [themes, setThemes] = useState<LifeTheme[]>([]);
  const [access, setAccess] = useState<WellnessAccess | null>(null);
  const [isRefreshingWiki, setIsRefreshingWiki] = useState(false);
  const [hasLoadedLibrary, setHasLoadedLibrary] = useState(false);
  const [refreshFeedback, setRefreshFeedback] = useState<RefreshFeedback | null>(null);
  const [showInsightsEntrance, setShowInsightsEntrance] = useState(
    () => Boolean((location.state as { fromInsights?: boolean } | null)?.fromInsights),
  );
  const shouldReduceMotion = useReducedMotion();

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
    if (!showInsightsEntrance) return;
    const timer = window.setTimeout(() => setShowInsightsEntrance(false), 1100);
    return () => window.clearTimeout(timer);
  }, [showInsightsEntrance]);

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
        trackLifeWikiRefreshed({
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
        <span className="inline-flex rounded-full border border-border/60 bg-white/5 px-2 py-0.5 text-[11px] font-black uppercase tracking-widest text-gray-light">
          {children}
        </span>
      );
    }

    return (
      <button
        type="button"
        onClick={() => navigate(notePath(noteId))}
        className="inline-flex rounded-full border border-green/20 bg-green/5 px-2 py-0.5 text-[11px] font-black uppercase tracking-widest text-green transition-colors hover:border-green/40 hover:bg-green/10"
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
    const roomIndex = SANCTUARY_META.findIndex((room) => room.pageType === meta.pageType) + 1;
    const roomNumber = roomIndex > 0 ? String(roomIndex).padStart(2, '0') : 'S';

    return (
      <div
        key={meta.pageType}
        className={`group relative h-full overflow-hidden rounded-[var(--radius-shell)] border ${isEmptyRoom ? tone.border : 'border-border/60'} bg-white/30 shadow-sm shadow-black/5 transition-all duration-[600ms] ease-out-expo hover:-translate-y-1 hover:shadow-xl ${tone.hover}`}
      >
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tone.wash} ${isEmptyRoom ? 'opacity-70' : 'opacity-40'}`} />
        <div className="pointer-events-none absolute -right-8 top-8 h-28 w-28 rounded-full border border-current opacity-[0.04]" />
        <Link
          to={articlePath(meta.pageType)}
          className="relative z-10 flex h-full min-h-[284px] flex-col justify-between p-7 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-green/40 md:p-8"
          aria-label={`Open ${meta.label} Sanctuary page`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <span className={`text-[11px] font-black uppercase tracking-widest ${tone.accent}`}>
                {isSupporting ? 'Supporting page' : isEmptyRoom ? 'Room awaiting signal' : 'Sanctuary page'}
              </span>
              <span className={`flex h-9 w-9 items-center justify-center rounded-[var(--radius-chip)] border ${tone.border} ${tone.bg}`}>
                <span className={`font-mono text-[11px] font-black ${tone.text}`}>
                  {roomNumber}
                </span>
              </span>
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-text">{meta.label}</h2>
              <p className="line-clamp-4 text-[16px] font-serif italic leading-relaxed text-gray-text/75">
                {isEmptyRoom ? meta.emptyLine || meta.description : previewText(page.content)}
              </p>
              {isEmptyRoom ? (
                <p className="max-w-[28ch] text-[12px] font-bold uppercase tracking-widest text-gray-nav">
                  This Sanctuary room is ready, but it has not been written yet.
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-5">
            <div className="flex flex-wrap gap-2">
              <MetadataPill tone={isEmptyRoom ? undefined : 'green'}>
                {isEmptyRoom ? 'No sources yet' : `${sources.length} source${sources.length === 1 ? '' : 's'}`}
              </MetadataPill>
              <MetadataPill>{isEmptyRoom ? 'Ready room' : new Date(page.updatedAt).toLocaleDateString()}</MetadataPill>
            </div>
            <span className={`mt-1 flex h-10 w-10 items-center justify-center rounded-[var(--radius-control)] border ${tone.border} ${tone.iconBg} ${tone.text} transition-all duration-500 ease-out-expo group-hover:translate-x-1`}>
              {isEmptyRoom ? <Hash size={16} weight="bold" /> : <CaretRight size={16} weight="bold" />}
            </span>
          </div>
        </Link>
      </div>
    );
  };

  const renderEntrance = () => (
    <AnimatePresence>
      {(isRefreshingWiki || showInsightsEntrance) && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-body px-6"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,oklch(0.70_0.05_135_/_0.18),transparent_54%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-green/10 via-body/95 to-body" />
          <motion.div
            aria-hidden="true"
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: shouldReduceMotion ? 0.14 : 0.2, scale: 1 }}
            transition={{ delay: shouldReduceMotion ? 0 : 0.08, duration: shouldReduceMotion ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center mix-blend-luminosity"
          >
            <div className="h-[min(66vmin,34rem)] w-[min(66vmin,34rem)]">
              <DotLottieReact src={SANCTUARY_ENTRANCE_LOTTIE} autoplay loop={isRefreshingWiki} />
            </div>
          </motion.div>
          <motion.div
            initial={shouldReduceMotion ? false : { y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: shouldReduceMotion ? 0 : 0.12, duration: shouldReduceMotion ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex max-w-[42rem] flex-col items-center text-center"
          >
            <p className="text-[11px] font-black uppercase tracking-widest text-green">
              {isRefreshingWiki ? 'Reading only your saved notes' : 'Private reading room'}
            </p>
            <h2 className="mt-4 text-4xl font-display font-bold leading-tight text-gray-text md:text-5xl">
              {isRefreshingWiki ? 'Refreshing your Life Wiki...' : 'Opening Sanctuary'}
            </h2>
            <p className="mt-4 max-w-[36ch] text-[15px] font-medium leading-relaxed text-gray-light">
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
          <div className="absolute inset-0 bg-gradient-to-b from-green/5 via-body to-body opacity-50" />
        </div>
        <PageContainer size="narrow" className="pb-24 pt-6 md:pt-10 relative z-10">
          <div className="space-y-8">
            <button
              onClick={() => navigate(RoutePath.SANCTUARY)}
              className="flex items-center gap-2 text-[13px] font-bold text-gray-nav hover:text-green transition-colors w-fit"
              aria-label="Back to Sanctuary"
            >
              <ArrowLeft size={16} weight="bold" />
              <span>Back</span>
            </button>

            {!articlePage ? (
              !hasLoadedLibrary ? (
                <Surface variant="flat" className="p-8 md:p-10">
                  <div className="mx-auto max-w-xl text-center">
                    <p className="text-[11px] font-black uppercase tracking-widest text-green">
                      Opening room
                    </p>
                    <h1 className="mt-3 text-4xl font-display font-bold text-gray-text">
                      Reading the shelf...
                    </h1>
                  </div>
                </Surface>
              ) : !canShowSanctuaryRooms ? (
                <Surface variant="bezel" innerClassName="p-8 md:p-10">
                  <div className="mx-auto max-w-2xl text-center">
                    <p className="text-[11px] font-black uppercase tracking-widest text-green">
                      Life Wiki unlocks after 3 entries
                    </p>
                    <h1 className="mt-3 text-4xl font-display font-bold text-gray-text">
                      Still gathering enough signal.
                    </h1>
                    <p className="mx-auto mt-4 max-w-[46ch] text-[15px] font-medium leading-relaxed text-gray-light">
                      Write {entriesNeededForWiki} more {entriesNeededForWiki === 1 ? 'entry' : 'entries'} before this Sanctuary room opens.
                    </p>
                    <Button
                      variant="primary"
                      className="mt-7 h-12 px-6 text-[12px] font-black uppercase tracking-widest"
                      onClick={() => navigate(RoutePath.CREATE_NOTE)}
                    >
                      {notes.length === 0 ? 'Begin your first entry' : 'Write another entry'}
                    </Button>
                  </div>
                </Surface>
              ) : (
                <article className="space-y-8">
                  <header className={`relative overflow-hidden rounded-[var(--radius-shell)] border ${articleTone.border} bg-gradient-to-br ${articleTone.wash} p-8 md:p-10`}>
                    <div className="relative z-10">
                      <div className="mb-5 flex flex-wrap items-center gap-2">
                        <span className={`metadata-pill ${articleTone.bg} ${articleTone.border} ${articleTone.text}`}>
                          {articleMeta?.label || 'Sanctuary page'}
                        </span>
                        <MetadataPill>Ready room</MetadataPill>
                      </div>
                      <p className={`text-[11px] font-black uppercase tracking-widest ${articleTone.text}`}>
                        Room awaiting signal
                      </p>
                      <h1 className="mt-4 max-w-3xl text-5xl font-display font-extrabold text-gray-text md:text-6xl">
                        {articleMeta?.label || 'This page'}
                      </h1>
                      <p className="mt-5 max-w-2xl font-serif text-[20px] italic leading-relaxed text-gray-text/75">
                        {articleMeta?.emptyLine || 'This room will collect the notes that belong together.'}
                      </p>
                    </div>
                  </header>

                  <Surface variant="flat" className="p-6 md:p-9">
                    <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
                      <div className="max-w-2xl space-y-3">
                        <p className="text-[11px] font-black uppercase tracking-widest text-gray-nav">
                          Not written yet
                        </p>
                        <h2 className="text-3xl font-display font-bold text-gray-text">
                          This Sanctuary room is ready, but it has not been written yet.
                        </h2>
                        <p className="text-[15px] font-medium leading-relaxed text-gray-light">
                          Refresh with AI from the library when you want this room drafted from your saved reflections.
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
                        <Button variant="primary" onClick={() => navigate(RoutePath.ACCOUNT)}>
                          See Pro options
                        </Button>
                      )}
                    </div>
                  </Surface>
                </article>
              )
            ) : (
              <article className="space-y-8">
                <header className="border-b border-border/50 pb-8">
                  <div className="mb-5 flex flex-wrap items-center gap-2">
                    <span className={`metadata-pill ${articleTone.bg} ${articleTone.border} ${articleTone.text}`}>
                      {articleMeta?.label || articlePage.title}
                    </span>
                    <MetadataPill tone="green">Updated {new Date(articlePage.updatedAt).toLocaleDateString()}</MetadataPill>
                    <MetadataPill tone="green">{sourceIds.length} source{sourceIds.length === 1 ? '' : 's'}</MetadataPill>
                  </div>
                  <h1 className="max-w-3xl text-5xl font-display font-extrabold text-gray-text md:text-6xl">
                    {articlePage.title}
                  </h1>
                  <p className="mt-4 max-w-2xl text-[16px] font-medium leading-relaxed text-gray-light">
                    This AI-generated wiki page is based on notes you saved here. Source badges point back to the entries that can support a claim.
                  </p>
                </header>

                <Surface variant="flat" className="p-6 md:p-10">
                  <div className="mx-auto max-w-[68ch] space-y-5 font-serif text-[18px] leading-loose text-gray-text">
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

                <Surface variant="flat" className="p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Book size={18} weight="duotone" className="text-green" />
                    <h2 className="text-[13px] font-black uppercase tracking-widest text-gray-nav">
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
                            className="rounded-full border border-green/20 bg-green/5 px-3 py-2 text-[12px] font-bold text-green transition-colors hover:border-green/40 hover:bg-green/10"
                          >
                            {note.title || 'Untitled reflection'}
                          </button>
                        ) : (
                          <span
                            key={sourceId}
                            className="rounded-full border border-border/60 bg-white/5 px-3 py-2 text-[12px] font-bold text-gray-light"
                          >
                            {sourceId}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[13px] font-medium text-gray-light">
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
        <div className="absolute inset-0 bg-gradient-to-b from-green/5 via-body to-body opacity-50" />
      </div>

      <PageContainer className="pb-24 pt-6 md:pt-10 relative z-10">
        <div className="space-y-10">
          <div className="flex items-center justify-between gap-4">
            <button 
              onClick={() => navigate(RoutePath.INSIGHTS)}
              className="flex items-center gap-2 text-[13px] font-bold text-gray-nav hover:text-green transition-colors w-fit"
              aria-label="Back to Insights"
            >
              <ArrowLeft size={16} weight="bold" />
              <span>Back</span>
            </button>

            {!gate?.requiresUpgrade ? (
              <button
                onClick={handleRefreshWiki}
                disabled={isRefreshingWiki || !gate?.canGenerate}
                className="flex items-center justify-center gap-2 rounded-full border border-green/20 bg-green/5 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-green transition-all hover:bg-green/10 hover:border-green/40 disabled:opacity-50"
              >
                <Sparkle size={16} weight="fill" />
                <span className="hidden sm:inline">Refresh with AI</span>
              </button>
            ) : null}
          </div>

          <header className="mx-auto max-w-4xl space-y-5 pb-3 text-center">
            <h1 className="text-5xl font-display font-extrabold text-gray-text md:text-6xl">
              Your Life Wiki
            </h1>
            <p className="mx-auto max-w-2xl text-[17px] font-medium leading-relaxed text-gray-light">
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
                <Button size="sm" variant="primary" className="font-black" onClick={() => navigate(RoutePath.ACCOUNT)}>
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

          <Surface variant="flat" className="p-5 md:p-6">
            <div className="mb-5 flex items-center gap-2">
              <Sparkle size={18} weight="duotone" className="text-green" />
              <h2 className="text-[13px] font-black uppercase tracking-widest text-gray-nav">
                Signals
              </h2>
            </div>
            <div className="grid gap-0 divide-y divide-border/60 md:grid-cols-4 md:divide-x md:divide-y-0">
              {[
                ['Entries', notes.length.toString()],
                ['Generated pages', wikiPages.length.toString()],
                ['Last refresh', getLastRefreshLabel(wikiPages)],
                ['Rooms ready', roomsReadyLabel],
              ].map(([label, value]) => (
                <div key={label} className="px-0 py-4 first:pt-0 last:pb-0 md:px-5 md:py-0 md:first:pl-0 md:last:pr-0">
                  <p className="text-[11px] font-black uppercase tracking-widest text-gray-nav">{label}</p>
                  <p className="mt-2 text-[15px] font-bold leading-relaxed text-gray-text">{value}</p>
                </div>
              ))}
            </div>
          </Surface>

          {!hasEnoughEntriesForWiki ? (
            <Surface variant="bezel" innerClassName="p-7 md:p-9">
              <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
                <div className="max-w-2xl space-y-5">
                  <p className="text-[11px] font-black uppercase tracking-widest text-green">
                    Life Wiki unlocks after 3 entries
                  </p>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-display font-bold leading-tight text-gray-text md:text-4xl">
                      Still gathering enough signal.
                    </h2>
                    <p className="text-[16px] font-medium leading-relaxed text-gray-light">
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
                  className="h-12 shrink-0 px-6 text-[12px] font-black uppercase tracking-widest"
                  onClick={() => navigate(RoutePath.CREATE_NOTE)}
                >
                  {notes.length === 0 ? 'Begin your first entry' : 'Write another entry'}
                </Button>
              </div>
            </Surface>
          ) : null}

          {hasEnoughEntriesForWiki && primaryPages.length === 0 ? (
            <Surface variant="bezel" innerClassName="p-7 md:p-9">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="max-w-2xl space-y-3">
                  <p className="text-[11px] font-black uppercase tracking-widest text-green">
                    Sanctuary ready
                  </p>
                  <h2 className="text-3xl font-display font-bold text-gray-text">
                    {gate?.requiresUpgrade ? 'Future Life Wiki refreshes are locked.' : 'Your first Life Wiki refresh is ready.'}
                  </h2>
                  <p className="text-[15px] font-medium leading-relaxed text-gray-light">
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
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-display font-bold text-gray-text">Sanctuary pages</h2>
                  <p className="mt-2 text-[14px] font-medium text-gray-light">
                    The five main rooms for this library, kept visible once your Life Wiki is unlocked.
                  </p>
                </div>
                {primaryPages.length > 0 && !gate?.requiresUpgrade ? (
                  <Button
                    variant="primary"
                    onClick={handleRefreshWiki}
                    isLoading={isRefreshingWiki}
                    disabled={isRefreshingWiki || !gate?.canGenerate}
                  >
                    <Sparkle size={16} weight="fill" className="mr-2" />
                    Refresh with AI
                  </Button>
                ) : null}
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
                <p className="mt-2 text-[14px] font-medium text-gray-light">
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
        </div>
      </PageContainer>
    </>
  );
};
