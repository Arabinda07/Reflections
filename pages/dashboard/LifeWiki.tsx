import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkle,
  Book,
  CaretRight,
  Hash,
  Warning,
} from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { EmptyState } from '../../components/ui/EmptyState';
import { ModalSheet } from '../../components/ui/ModalSheet';
import { PageContainer } from '../../components/ui/PageContainer';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Surface } from '../../components/ui/Surface';
import { LifeTheme, Note, RoutePath, WellnessAccess } from '../../types';
import { noteService } from '../../services/noteService';
import { wikiService } from '../../services/wikiService';
import { aiService } from '../../services/aiService';
import { profileService } from '../../services/profileService';
import { FREE_WIKI_MINIMUM_ENTRIES, getWikiInsightsGate } from '../../services/wellnessPolicy';
import { trackLifeWikiRefreshed } from '../../src/analytics/events';

type RefreshFeedback = {
  variant: 'warning' | 'error';
  title: string;
  description: string;
};

export const LifeWiki: React.FC = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [themes, setThemes] = useState<LifeTheme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<LifeTheme | null>(null);
  const [access, setAccess] = useState<WellnessAccess | null>(null);
  const [isRefreshingWiki, setIsRefreshingWiki] = useState(false);
  const [refreshFeedback, setRefreshFeedback] = useState<RefreshFeedback | null>(null);

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
        console.error('[LifeWiki] Failed to load data:', error);
      }
    };

    fetchData();
  }, []);

  const gate = useMemo(() => {
    if (!access) return null;
    return getWikiInsightsGate(access, notes.length);
  }, [access, notes.length]);

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

      const [allThemes, newAccess] = await Promise.all([
        wikiService.getAllThemes(),
        profileService.getWellnessAccess(),
      ]);
      setThemes(allThemes);
      setAccess(newAccess);
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

  const selectedThemeParagraphs = useMemo(() => {
    if (!selectedTheme) return [];

    return selectedTheme.content
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }, [selectedTheme]);

  return (
    <>
      {/* Cinematic Background Scrim for Editorial Feel */}
      <div className="fixed inset-0 pointer-events-none z-[-1] bg-surface/50 backdrop-blur-[60px]" />
      <div className="fixed inset-0 pointer-events-none z-[-2] bg-gradient-to-b from-green/5 to-transparent" />

      <PageContainer className="pb-24 pt-4 md:pt-8 relative z-10">
        <div className="space-y-10">
          <div className="sticky-bar">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(RoutePath.INSIGHTS)}
                className="text-gray-nav hover:text-gray-text font-bold text-[12px]"
              >
                <ArrowLeft className="mr-2 h-5 w-5 shrink-0" weight="bold" />
                Back to Insights
              </Button>
            </div>

            {themes.length > 0 && !gate?.requiresUpgrade ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-[11px] font-black text-green hover:text-green-hover uppercase tracking-widest"
                onClick={handleRefreshWiki}
                isLoading={isRefreshingWiki}
                disabled={isRefreshingWiki || !gate?.canGenerate}
              >
                <Sparkle size={14} weight="fill" className="mr-2" />
                {isRefreshingWiki ? 'Refreshing...' : 'Refresh with AI'}
              </Button>
            ) : null}
          </div>

          <div className="max-w-4xl mx-auto space-y-12">
            <header className="text-center space-y-6 pt-8 pb-12 border-b border-border/40">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/40 shadow-sm border border-white backdrop-blur-xl mb-4">
                <Book size={32} weight="duotone" className="text-green" />
              </div>
              <h1 className="text-5xl md:text-6xl font-display text-gray-text tracking-tight leading-tight font-serif italic text-balance">
                Your Life Wiki
              </h1>
              <p className="text-lg md:text-xl font-medium text-gray-light max-w-2xl mx-auto leading-relaxed">
                A quiet, editorial sanctuary where your scattered reflections are woven into clear, recurring themes.
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

            {notes.length === 0 ? (
              <EmptyState
                surface="flat"
                icon={<Sparkle size={24} weight="duotone" className="text-orange" />}
                title="This space is ready when your first reflection arrives."
                description="Write your first note and this space will stay quiet until you choose to build the Life Wiki."
                action={
                  <Button variant="ghost" className="text-[12px] font-black uppercase tracking-widest text-green" onClick={() => navigate(RoutePath.CREATE_NOTE)}>
                    Begin your first entry
                  </Button>
                }
              />
            ) : notes.length < FREE_WIKI_MINIMUM_ENTRIES ? (
              <div className="flex flex-col items-center gap-6 py-12">
                {gate && !gate.requiresUpgrade && gate.canGenerate ? (
                  <Button
                    variant="primary"
                    onClick={handleRefreshWiki}
                    isLoading={isRefreshingWiki}
                    disabled={isRefreshingWiki}
                    className="px-8"
                  >
                    <Sparkle size={16} weight="fill" className="mr-2" />
                    {isRefreshingWiki ? 'Building...' : 'Refresh with AI'}
                  </Button>
                ) : null}
                <EmptyState
                  surface="flat"
                  icon={<Sparkle size={24} weight="duotone" className="text-orange" />}
                  title="Still gathering enough signal."
                  description={`Write ${FREE_WIKI_MINIMUM_ENTRIES - notes.length} more ${FREE_WIKI_MINIMUM_ENTRIES - notes.length === 1 ? 'entry' : 'entries'} before the Life Wiki can say anything useful.`}
                />
              </div>
            ) : themes.length === 0 ? (
              <EmptyState
                surface="flat"
                icon={<Sparkle size={24} weight="duotone" className="text-orange" />}
                title="Build your Life Wiki when you’re ready."
                description="This stays on demand. Nothing is generated until you ask for it."
                action={
                  gate?.requiresUpgrade ? (
                    <Button variant="primary" onClick={() => navigate(RoutePath.ACCOUNT)}>
                      See Pro options
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={handleRefreshWiki}
                      isLoading={isRefreshingWiki}
                      disabled={isRefreshingWiki || !gate?.canGenerate}
                    >
                      {isRefreshingWiki ? 'Refreshing...' : 'Refresh with AI'}
                    </Button>
                  )
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {themes.map((theme) => (
                  <Surface
                    key={theme.id}
                    variant="floating"
                    className="group cursor-pointer transition-all duration-500 hover:shadow-xl hover:shadow-green/5 border border-border/60 hover:border-green/30"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedTheme(theme)}
                      className="flex h-full w-full flex-col justify-between p-8 text-left"
                    >
                      <div>
                        <div className="mb-4 flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase tracking-widest text-green/80">Life theme</span>
                          <Hash size={14} weight="bold" className="text-green/40 group-hover:text-green/80 transition-colors" />
                        </div>
                        <h3 className="line-clamp-2 text-2xl font-serif italic leading-snug text-gray-text transition-colors group-hover:text-green">
                          {theme.title}
                        </h3>
                      </div>

                      <div className="mt-8 flex items-center justify-between border-t border-border/40 pt-4">
                        <span className="text-[11px] font-medium text-gray-light uppercase tracking-wider">
                          Updated {new Date(theme.updatedAt).toLocaleDateString()}
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green/5 text-green transition-all duration-500 group-hover:bg-green group-hover:text-white">
                          <CaretRight size={14} weight="bold" />
                        </div>
                      </div>
                    </button>
                  </Surface>
                ))}
              </div>
            )}
          </div>
        </div>
      </PageContainer>

      <ModalSheet
        isOpen={Boolean(selectedTheme)}
        onClose={() => setSelectedTheme(null)}
        title={selectedTheme?.title}
        description={
          selectedTheme
            ? `Compiled ${new Date(selectedTheme.updatedAt).toLocaleDateString()}.`
            : undefined
        }
        icon={<Book size={24} weight="duotone" className="text-green" />}
        size="xl"
        footer={
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12px] font-medium italic text-gray-light">
              This page evolves as you keep writing.
            </p>
            <Button size="sm" variant="ghost" className="text-[11px] font-black" onClick={() => setSelectedTheme(null)}>
              Close entry
            </Button>
          </div>
        }
      >
        {selectedTheme ? (
          <div className="prose prose-slate max-w-none text-gray-text leading-loose font-serif text-[17px]">
            {selectedThemeParagraphs.map((paragraph, index) => (
              <p key={`${selectedTheme.id}-${index}`} className="whitespace-pre-line mb-6 last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        ) : null}
      </ModalSheet>
    </>
  );
};
