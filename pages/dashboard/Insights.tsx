import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkle,
  Brain,
  Calendar,
  CheckSquare,
  Heart,
  TrendUp,
  Book,
  CaretRight,
  Hash,
  Warning,
} from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { EmptyState } from '../../components/ui/EmptyState';
import { MetadataPill } from '../../components/ui/MetadataPill';
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

const MOOD_COLORS: Record<string, string> = {
  happy: '#f97316',
  calm: '#10b981',
  anxious: '#3b82f6',
  sad: '#6366f1',
  angry: '#ef4444',
  tired: '#64748b',
};

const MOOD_BG: Record<string, string> = {
  happy: '#fff7ed',
  calm: '#f0fdf4',
  anxious: '#eff6ff',
  sad: '#eef2ff',
  angry: '#fef2f2',
  tired: '#f8fafc',
};

export const Insights: React.FC = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [themes, setThemes] = useState<LifeTheme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<LifeTheme | null>(null);
  const [access, setAccess] = useState<WellnessAccess | null>(null);
  const [isRefreshingWiki, setIsRefreshingWiki] = useState(false);

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

  const gate = useMemo(() => {
    if (!access) return null;
    return getWikiInsightsGate(access, notes.length);
  }, [access, notes.length]);

  const handleRefreshWiki = async () => {
    if (!gate?.canGenerate) return;

    setIsRefreshingWiki(true);
    try {
      let claimedFreeRefresh = false;

      if (access?.planTier !== 'pro') {
        claimedFreeRefresh = await profileService.incrementFreeWikiInsights();

        if (!claimedFreeRefresh) {
          const newAccess = await profileService.getWellnessAccess();
          setAccess(newAccess);
          return;
        }
      }

      await aiService.refreshWikiSummaries();
      const allThemes = await wikiService.getAllThemes();
      const newAccess = await profileService.getWellnessAccess();
      setThemes(allThemes);
      setAccess(newAccess);
    } catch (error) {
      console.error('[Insights] Failed to refresh wiki:', error);
    } finally {
      setIsRefreshingWiki(false);
    }
  };

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let monthNotes = 0;
    const daysSet = new Set<string>();
    const moodCounts: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};
    let totalTasks = 0;
    let completedTasks = 0;

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

      if (note.tasks) {
        note.tasks.forEach((task) => {
          totalTasks += 1;
          if (task.completed) completedTasks += 1;
        });
      }
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
      totalTasks,
      completedTasks,
      taskProgress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }, [notes]);

  return (
    <>
      <PageContainer className="pb-24 pt-4 md:pt-8">
        <div className="space-y-10">
          <div className="sticky-bar">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-gray-nav hover:text-gray-text font-bold text-[12px]"
              >
                <ArrowLeft className="mr-2 h-5 w-5 shrink-0" weight="bold" />
                Back
              </Button>
              <MetadataPill icon={<Calendar size={12} weight="bold" />} tone="green">
                {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
              </MetadataPill>
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

          <SectionHeader
            title="Patterns in your writing"
            description="Mood, rhythm, and recurring themes — refreshed only when you ask."
            icon={
              <div className="icon-block icon-block-lg">
                <Brain size={34} weight="duotone" />
              </div>
            }
          />

          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
            <Surface variant="bezel" innerClassName="p-8 md:p-10">
              <div className="flex flex-col gap-8">
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <div className="space-y-3">
                    <MetadataPill tone="green">Writing rhythm</MetadataPill>
                    <h2 className="text-3xl md:text-4xl font-display text-gray-text tracking-tight">
                      {stats.monthNotes} reflections this month
                    </h2>
                    <p className="max-w-xl text-[15px] font-medium leading-relaxed text-gray-light">
                      You checked in on {stats.daysCheckedIn} different days, and the current emotional tone leans{' '}
                      <span className="capitalize text-green font-bold">
                        {stats.topMood === 'undefined' ? 'toward clarity' : stats.topMood}
                      </span>
                      .
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <MetadataPill icon={<Calendar size={13} weight="bold" />} tone="green">
                      {stats.totalNotes} total notes
                    </MetadataPill>
                    <MetadataPill icon={<CheckSquare size={13} weight="bold" />} tone="green">
                      {stats.completedTasks}/{stats.totalTasks || 0} tasks
                    </MetadataPill>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-[var(--radius-panel)] border border-border bg-white/5 p-5">
                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-nav">This month</p>
                    <p className="mt-3 text-4xl font-display text-gray-text">{stats.monthNotes}</p>
                    <p className="mt-2 text-[12px] font-medium text-gray-light">entries written recently</p>
                  </div>
                  <div className="rounded-[var(--radius-panel)] border border-border bg-white/5 p-5">
                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-nav">Check-in days</p>
                    <p className="mt-3 text-4xl font-display text-gray-text">{stats.daysCheckedIn}</p>
                    <p className="mt-2 text-[12px] font-medium text-gray-light">days you made space to write</p>
                  </div>
                  <div className="rounded-[var(--radius-panel)] border border-border bg-white/5 p-5">
                    <p className="text-[11px] font-black uppercase tracking-widest text-gray-nav">Action follow-through</p>
                    <p className="mt-3 text-4xl font-display text-gray-text">{stats.taskProgress}%</p>
                    <p className="mt-2 text-[12px] font-medium text-gray-light">of logged tasks completed</p>
                  </div>
                </div>
              </div>
            </Surface>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              <Surface variant="flat" className="overflow-hidden">
                <div className="flex h-full flex-col gap-4 p-6">
                  <Heart size={24} weight="duotone" className="text-green opacity-80" />
                  <p className="text-[11px] font-black uppercase tracking-widest text-gray-nav">Prevalent mood</p>
                  <p className="text-3xl font-display text-gray-text capitalize">
                    {stats.topMood === 'undefined' ? 'Unlabeled' : stats.topMood}
                  </p>
                  <p className="text-[13px] font-medium text-gray-light">
                    The feeling showing up most often across your reflections.
                  </p>
                </div>
              </Surface>

              <Surface variant="flat" className="overflow-hidden">
                <div className="flex h-full flex-col gap-4 p-6">
                  <TrendUp size={24} weight="duotone" className="text-green opacity-80" />
                  <p className="text-[11px] font-black uppercase tracking-widest text-gray-nav">Library growth</p>
                  <p className="text-3xl font-display text-gray-text">{themes.length}</p>
                  <p className="text-[13px] font-medium text-gray-light">
                    themes currently captured in your personal life wiki.
                  </p>
                </div>
              </Surface>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Surface variant="bezel" innerClassName="p-8">
              <h3 className="text-[18px] font-display text-gray-text mb-6">Mood frequency</h3>
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
                    const color = MOOD_COLORS[entry.name] || '#94a3b8';
                    const background = MOOD_BG[entry.name] || '#f1f5f9';

                    return (
                      <div key={entry.name} className="flex items-center gap-4">
                        <span
                          className="w-16 shrink-0 text-[11px] font-black capitalize tracking-widest"
                          style={{ color }}
                        >
                          {entry.name}
                        </span>
                        <div className="relative h-8 flex-1 overflow-hidden rounded-full" style={{ background }}>
                          <div
                            className="absolute inset-y-0 left-0 rounded-full"
                            style={{ backgroundColor: color, width: `${percent}%` }}
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
              <h3 className="text-[18px] font-display text-gray-text mb-6">Recurring tags</h3>
              {stats.topTags.length === 0 ? (
                <EmptyState
                  surface="none"
                  icon={<Hash size={22} weight="duotone" />}
                  title="Tags will become a gentle map of what you keep returning to."
                  description="As you tag your entries, this view will help you spot recurring subjects."
                />
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  {stats.topTags.map(([tag, count], index) => {
                    const scale = Math.min(1.75, Math.max(0.92, count / 2.4));
                    const colors = ['var(--green)', 'var(--blue)', 'var(--orange)', 'var(--gray-text)'];
                    return (
                      <span
                        key={tag}
                        className="font-display lowercase"
                        style={{
                          fontSize: `${scale}rem`,
                          lineHeight: '1',
                          color: colors[index % colors.length],
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

          <Surface variant="flat" className="overflow-hidden">
            <div className="p-8 md:p-12 space-y-8">
              <SectionHeader
                title="Themes that keep resurfacing"
                titleAs="h2"
                description={`Built from ${notes.length} reflections. Nothing is generated until you ask.`}
                icon={
                  <div className="icon-block icon-block-md">
                    <Book size={26} weight="duotone" />
                  </div>
                }
              />

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

              {notes.length === 0 ? (
                <EmptyState
                  surface="none"
                  icon={<Sparkle size={18} weight="duotone" className="text-orange" />}
                  title="This space is ready when your first reflection arrives."
                  description="Write your first note and this space will stay quiet until you choose to build the Life Wiki."
                  action={
                    <Button variant="ghost" className="text-[11px] font-black uppercase tracking-widest text-green" onClick={() => navigate(RoutePath.CREATE_NOTE)}>
                      Begin your first entry
                    </Button>
                  }
                />
              ) : notes.length < FREE_WIKI_MINIMUM_ENTRIES ? (
                <div className="flex flex-col items-center gap-6">
                  {gate && !gate.requiresUpgrade && gate.canGenerate ? (
                    <Button
                      variant="primary"
                      onClick={handleRefreshWiki}
                      isLoading={isRefreshingWiki}
                      disabled={isRefreshingWiki}
                      className="px-8"
                    >
                      <Sparkle size={16} weight="fill" className="mr-2" />
                      {isRefreshingWiki ? 'Building...' : 'Get Insights'}
                    </Button>
                  ) : null}
                  <EmptyState
                    surface="none"
                    icon={<Sparkle size={18} weight="duotone" className="text-orange" />}
                    title="Still gathering enough signal."
                    description={`Write ${FREE_WIKI_MINIMUM_ENTRIES - notes.length} more ${FREE_WIKI_MINIMUM_ENTRIES - notes.length === 1 ? 'entry' : 'entries'} before the Life Wiki can say anything useful.`}
                  />
                </div>
              ) : themes.length === 0 ? (
                <EmptyState
                  surface="none"
                  icon={<Sparkle size={18} weight="duotone" className="text-orange" />}
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {themes.map((theme) => (
                    <Surface
                      key={theme.id}
                      variant="bezel"
                      className="group cursor-pointer transition-all duration-300 hover:shadow-none"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedTheme(theme)}
                        className="flex h-full w-full flex-col justify-between p-6 text-left"
                      >
                        <div>
                          <div className="mb-3 flex items-center justify-between">
                            <span className="text-[11px] font-black uppercase tracking-widest text-gray-nav">Life theme</span>
                            <Hash size={14} weight="bold" className="text-gray-light opacity-50" />
                          </div>
                          <h3 className="line-clamp-2 text-xl font-display leading-tight text-gray-text transition-colors group-hover:text-green">
                            {theme.title}
                          </h3>
                        </div>

                        <div className="mt-5 flex items-center justify-between">
                          <span className="text-[11px] font-medium text-gray-light">
                            Updated {new Date(theme.updatedAt).toLocaleDateString()}
                          </span>
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white/5 transition-all duration-300 group-hover:border-green group-hover:bg-green group-hover:text-white">
                            <CaretRight size={16} weight="bold" />
                          </div>
                        </div>
                      </button>
                    </Surface>
                  ))}
                </div>
              )}
            </div>
          </Surface>
        </div>
      </PageContainer>

      <ModalSheet
        isOpen={Boolean(selectedTheme)}
        onClose={() => setSelectedTheme(null)}
        title={selectedTheme?.title}
        description={
          selectedTheme
            ? `Personal wiki entry updated ${new Date(selectedTheme.updatedAt).toLocaleDateString()}.`
            : undefined
        }
        icon={<Book size={20} weight="duotone" />}
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
          <div
            className="prose prose-slate max-w-none text-gray-text leading-relaxed"
            dangerouslySetInnerHTML={{ __html: selectedTheme.content.replace(/\n\n/g, '<br/><br/>') }}
          />
        ) : null}
      </ModalSheet>
    </>
  );
};
