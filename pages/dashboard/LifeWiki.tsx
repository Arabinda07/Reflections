import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
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
import { EmptyState } from '../../components/ui/EmptyState';
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
};

const SANCTUARY_META: PageMeta[] = [
  {
    pageType: 'people',
    label: 'People',
    description: 'Relationships, roles, and recurring names that appear in your notes.',
  },
  {
    pageType: 'patterns',
    label: 'Patterns',
    description: 'Repeated situations, moods, rhythms, and attention loops.',
  },
  {
    pageType: 'philosophies',
    label: 'Philosophies',
    description: 'Values, beliefs, principles, and ways of seeing life.',
  },
  {
    pageType: 'eras',
    label: 'Eras',
    description: 'Seasons, transitions, and phases that seem to be forming.',
  },
  {
    pageType: 'decisions',
    label: 'Decisions',
    description: 'Choices, open questions, commitments, and tradeoffs.',
  },
];

const SUPPORTING_META: PageMeta[] = [
  {
    pageType: 'mood_patterns',
    label: 'Mood Patterns',
    description: 'The older generated mood summary, kept as supporting context.',
  },
  {
    pageType: 'recurring_themes',
    label: 'Recurring Themes',
    description: 'The older generated theme summary, kept as supporting context.',
  },
  {
    pageType: 'self_model',
    label: 'Self Model',
    description: 'The older generated self-model page, kept as supporting context.',
  },
  {
    pageType: 'timeline',
    label: 'Timeline',
    description: 'The older generated timeline page, kept as supporting context.',
  },
];

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
  const [notes, setNotes] = useState<Note[]>([]);
  const [themes, setThemes] = useState<LifeTheme[]>([]);
  const [access, setAccess] = useState<WellnessAccess | null>(null);
  const [isRefreshingWiki, setIsRefreshingWiki] = useState(false);
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
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

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
  const missingPrimaryPages = SANCTUARY_META.filter((meta) => !pageMap.has(meta.pageType));

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
    const sources = page ? extractSourceIds(page.content) : [];

    return (
      <div
        key={meta.pageType}
        className={`group relative h-full overflow-hidden rounded-[32px] transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          page
            ? 'border-[1.5px] border-white/20 bg-white/40 hover:-translate-y-2 hover:bg-white/60 hover:shadow-[0_20px_40px_-15px_rgba(22,163,74,0.15)] hover:border-green/30 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'
            : 'quiet placeholder border-[1.5px] border-dashed border-border/70 bg-transparent opacity-80'
        } backdrop-blur-[20px]`}
      >
        {page ? (
          <Link
            to={articlePath(meta.pageType)}
            className="flex h-full min-h-[260px] flex-col justify-between p-8 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-green/40 relative z-10"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[11px] font-black uppercase tracking-widest text-green/80">
                  {isSupporting ? 'Supporting page' : 'Sanctuary page'}
                </span>
                <Hash size={14} weight="bold" className="text-green/40 transition-colors group-hover:text-green/80" />
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-display text-gray-text">{meta.label}</h2>
                <p className="text-[16px] font-serif italic leading-relaxed text-gray-text/70 line-clamp-3">
                  {previewText(page.content)}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/40">
              <div className="flex flex-wrap gap-2 pt-4">
                <MetadataPill tone="green">{sources.length} source{sources.length === 1 ? '' : 's'}</MetadataPill>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/50 text-green transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:bg-green group-hover:text-white group-hover:scale-110 shadow-sm mt-4">
                <CaretRight size={16} weight="bold" />
              </span>
            </div>
          </Link>
        ) : (
          <div className="flex h-full min-h-[260px] flex-col justify-between p-8 relative z-10">
            <div className="space-y-4">
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-nav">
                Waiting for signal
              </span>
              <div className="space-y-3">
                <h2 className="text-3xl md:text-4xl font-display text-gray-text opacity-50">{meta.label}</h2>
                <p className="text-[15px] font-medium leading-relaxed text-gray-light">
                  {meta.description}
                </p>
              </div>
            </div>
            <p className="mt-8 border-t border-border/40 pt-4 text-[12px] font-medium text-gray-light">
              Not enough here yet. This page will stay quiet until your notes can support it.
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderEntrance = () => (
    <AnimatePresence>
      {isRefreshingWiki && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-body"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-green/10 via-body to-body" />
          <motion.div
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="relative z-10 flex max-w-sm flex-col items-center px-6 text-center"
          >
            <div className="h-32 w-32 overflow-hidden rounded-[var(--radius-panel)] bg-green/5">
              <DotLottieReact src="/assets/lottie/Level%20Up%20Animation.json" autoplay loop />
            </div>
            <h2 className="mt-6 text-4xl font-serif italic text-gray-text">
              {isRefreshingWiki ? 'Refreshing your Life Wiki...' : 'Opening Sanctuary'}
            </h2>
            <p className="mt-3 text-[12px] font-black uppercase tracking-widest text-gray-nav">
              {isRefreshingWiki ? 'Reading only your saved notes' : 'A quiet threshold into the library'}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (articlePageType) {
    return (
      <>
        {renderEntrance()}
        <div className="fixed inset-0 pointer-events-none z-[-1] bg-surface/60 backdrop-blur-[60px]" style={{ willChange: 'backdrop-filter' }} />
        <div className="fixed inset-0 pointer-events-none z-[-2] overflow-hidden bg-body transform-gpu">
          <video
            src="/assets/videos/cycling.mp4"
            autoPlay
            loop
            muted
            playsInline
            style={{ willChange: 'transform' }}
            className="absolute inset-0 h-full w-full object-cover opacity-[0.25]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-green/10 via-body/80 to-body" />
        </div>
        <PageContainer size="narrow" className="pb-24 pt-4 md:pt-8 relative z-10">
          <div className="space-y-8">
            <div className="sticky-bar">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(RoutePath.SANCTUARY)}
                className="text-gray-nav hover:text-gray-text font-bold text-[12px]"
              >
                <ArrowLeft className="mr-2 h-5 w-5 shrink-0" weight="bold" />
                Back to Sanctuary
              </Button>
            </div>

            {!articlePage ? (
              <EmptyState
                surface="flat"
                icon={<Book size={24} weight="duotone" className="text-green" />}
                title={`${articleMeta?.label || 'This page'} is quiet for now.`}
                description="The library knows this room exists, but your notes have not given it enough to say yet."
                action={
                  <Button variant="ghost" onClick={() => navigate(RoutePath.SANCTUARY)}>
                    Return to the library
                  </Button>
                }
              />
            ) : (
              <article className="space-y-8">
                <header className="border-b border-border/50 pb-8">
                  <div className="mb-5 flex flex-wrap items-center gap-2">
                    <MetadataPill tone="green">{articleMeta?.label || articlePage.title}</MetadataPill>
                    <MetadataPill tone="green">Updated {new Date(articlePage.updatedAt).toLocaleDateString()}</MetadataPill>
                    <MetadataPill tone="green">{sourceIds.length} source{sourceIds.length === 1 ? '' : 's'}</MetadataPill>
                  </div>
                  <h1 className="text-5xl font-display text-gray-text md:text-6xl">
                    {articlePage.title}
                  </h1>
                  <p className="mt-4 max-w-2xl text-[16px] font-medium leading-relaxed text-gray-light">
                    This AI-generated wiki page is based on notes you saved here. Source badges point back to the entries that can support a claim.
                  </p>
                </header>

                <Surface variant="flat" className="p-6 md:p-8">
                  <div className="space-y-5 font-serif text-[18px] leading-loose text-gray-text">
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
                          <h2 className="mt-12 text-4xl font-display text-gray-text tracking-tight first:mt-0">{children}</h2>
                        ),
                        h2: ({ children }) => (
                          <h2 className="mt-10 text-3xl font-display text-gray-text tracking-tight first:mt-0">{children}</h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="mt-8 text-2xl font-display text-gray-text tracking-tight">{children}</h3>
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
      <div className="fixed inset-0 pointer-events-none z-[-1] bg-surface/60 backdrop-blur-[60px]" style={{ willChange: 'backdrop-filter' }} />
      <div className="fixed inset-0 pointer-events-none z-[-2] overflow-hidden bg-body transform-gpu">
        <video
          src="/assets/videos/cycling.mp4"
          autoPlay
          loop
          muted
          playsInline
          style={{ willChange: 'transform' }}
          className="absolute inset-0 h-full w-full object-cover opacity-[0.25]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-green/10 via-body/80 to-body" />
      </div>

      <PageContainer className="pb-24 pt-4 md:pt-8 relative z-10">
        <div className="space-y-10">
          <div className="sticky-bar">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(RoutePath.INSIGHTS)}
              className="text-gray-nav hover:text-gray-text font-bold text-[12px]"
            >
              <ArrowLeft className="mr-2 h-5 w-5 shrink-0" weight="bold" />
              Back to Insights
            </Button>

            {!gate?.requiresUpgrade ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-[11px] font-black text-green hover:text-green-hover uppercase tracking-widest"
                onClick={handleRefreshWiki}
                isLoading={isRefreshingWiki}
                disabled={isRefreshingWiki || !gate?.canGenerate}
              >
                <Sparkle size={14} weight="fill" className="mr-2" />
                Refresh with AI
              </Button>
            ) : null}
          </div>

          <header className="mx-auto max-w-4xl space-y-5 border-b border-border/40 pb-8 text-center">
            <h1 className="text-5xl font-display text-gray-text md:text-6xl">
              Your Life Wiki
            </h1>
            <p className="mx-auto max-w-2xl text-[17px] font-medium leading-relaxed text-gray-light">
              A dedicated Sanctuary library of AI-generated wiki pages, refreshed only when you ask and grounded in your saved notes.
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

          <Surface variant="flat" className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkle size={18} weight="duotone" className="text-green" />
              <h2 className="text-[13px] font-black uppercase tracking-widest text-gray-nav">
                Signals
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-[var(--radius-panel)] border border-border/50 bg-white/5 p-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-gray-nav">Entries</p>
                <p className="mt-2 text-3xl font-display text-gray-text">{notes.length}</p>
              </div>
              <div className="rounded-[var(--radius-panel)] border border-border/50 bg-white/5 p-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-gray-nav">Generated pages</p>
                <p className="mt-2 text-3xl font-display text-gray-text">{wikiPages.length}</p>
              </div>
              <div className="rounded-[var(--radius-panel)] border border-border/50 bg-white/5 p-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-gray-nav">Last refresh</p>
                <p className="mt-3 text-[14px] font-bold text-gray-text">{getLastRefreshLabel(wikiPages)}</p>
              </div>
              <div className="rounded-[var(--radius-panel)] border border-border/50 bg-white/5 p-4">
                <p className="text-[11px] font-black uppercase tracking-widest text-gray-nav">Still quiet</p>
                <p className="mt-3 text-[14px] font-bold text-gray-text">
                  {missingPrimaryPages.length === 0
                    ? 'All five rooms have pages.'
                    : missingPrimaryPages.map((meta) => meta.label).join(', ')}
                </p>
              </div>
            </div>
          </Surface>

          {notes.length === 0 ? (
            <EmptyState
              surface="flat"
              icon={<Sparkle size={24} weight="duotone" className="text-orange" />}
              title="The Life Wiki is quiet for now."
              description="Write your first note and this space will stay quiet until you choose to refresh it with AI."
              action={
                <Button variant="ghost" className="text-[12px] font-black uppercase tracking-widest text-green" onClick={() => navigate(RoutePath.CREATE_NOTE)}>
                  Begin your first entry
                </Button>
              }
            />
          ) : notes.length < FREE_WIKI_MINIMUM_ENTRIES ? (
            <EmptyState
              surface="flat"
              icon={<Sparkle size={24} weight="duotone" className="text-orange" />}
              title="Still gathering enough signal."
              description={`Write ${FREE_WIKI_MINIMUM_ENTRIES - notes.length} more ${FREE_WIKI_MINIMUM_ENTRIES - notes.length === 1 ? 'entry' : 'entries'} before the Life Wiki can say anything useful.`}
            />
          ) : null}

          <section className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-display text-gray-text">Sanctuary pages</h2>
                <p className="mt-2 text-[14px] font-medium text-gray-light">
                  The five main AI-generated wiki pages for this library.
                </p>
              </div>
              {primaryPages.length === 0 && notes.length >= FREE_WIKI_MINIMUM_ENTRIES && !gate?.requiresUpgrade ? (
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

          {supportingPages.length > 0 ? (
            <section className="space-y-5">
              <div>
                <h2 className="text-2xl font-display text-gray-text">Supporting shelf</h2>
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
