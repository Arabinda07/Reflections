import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Repeat,
  Lightbulb,
  ClockCounterClockwise,
  Signpost,
  ArrowRight,
  CircleNotch,
  MagnifyingGlass,
  PaperPlaneTilt,
  BookOpenText,
  Lock,
  Sparkle,
} from '@phosphor-icons/react';
import { PageContainer } from '../../components/ui/PageContainer';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Surface } from '../../components/ui/Surface';
import { Button } from '../../components/ui/Button';
import { ModalSheet } from '../../components/ui/ModalSheet';
import { wikiService } from '../../services/wikiService';
import { aiService } from '../../services/aiService';
import { profileService } from '../../services/profileService';
import { type WikiPageType, SANCTUARY_CATEGORIES } from '../../services/wikiTypes';
import type { LifeTheme, WellnessAccess } from '../../types';
import { RoutePath } from '../../types';

const CATEGORY_META: Record<string, { label: string; description: string; icon: any; gradient: string }> = {
  people: {
    label: 'People',
    description: 'The roles and relationships that shape your emotional landscape.',
    icon: Users,
    gradient: 'from-blue/10 to-blue/5',
  },
  patterns: {
    label: 'Patterns',
    description: 'Triggers, loops, and the "why" behind your recurring behaviours.',
    icon: Repeat,
    gradient: 'from-golden/10 to-golden/5',
  },
  philosophies: {
    label: 'Philosophies',
    description: 'The rules you live by — often discovered in retrospect.',
    icon: Lightbulb,
    gradient: 'from-green/10 to-green/5',
  },
  eras: {
    label: 'Eras',
    description: 'The chapters of your life, defined by place, project, or person.',
    icon: ClockCounterClockwise,
    gradient: 'from-dark-blue/10 to-dark-blue/5',
  },
  decisions: {
    label: 'Decisions',
    description: 'Turning points — the logic at the time versus the outcome.',
    icon: Signpost,
    gradient: 'from-red/10 to-red/5',
  },
};

export const Sanctuary: React.FC = () => {
  const navigate = useNavigate();
  const [themes, setThemes] = useState<LifeTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [smartModeEnabled, setSmartModeEnabled] = useState(false);

  // Companion state
  const [companionOpen, setCompanionOpen] = useState(false);
  const [companionInput, setCompanionInput] = useState('');
  const [companionMessages, setCompanionMessages] = useState<{ role: 'user' | 'companion'; text: string }[]>([]);
  const [companionLoading, setCompanionLoading] = useState(false);

  // Article detail
  const [selectedArticle, setSelectedArticle] = useState<LifeTheme | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [allThemes, smartMode] = await Promise.all([
          wikiService.getAll(),
          profileService.getSmartModeEnabled(),
        ]);
        setThemes(allThemes.filter((t: LifeTheme) => t.state === 'active'));
        setSmartModeEnabled(smartMode);
      } catch (err) {
        console.error('[Sanctuary] Failed to load:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getArticlesForCategory = useCallback(
    (category: WikiPageType) => themes.filter((t) => t.pageType === category),
    [themes],
  );

  const handleCompanionSend = async () => {
    const question = companionInput.trim();
    if (!question || companionLoading) return;

    setCompanionMessages((prev) => [...prev, { role: 'user', text: question }]);
    setCompanionInput('');
    setCompanionLoading(true);

    try {
      const answer = await aiService.companionQuery(question);
      setCompanionMessages((prev) => [...prev, { role: 'companion', text: answer }]);
    } catch {
      setCompanionMessages((prev) => [
        ...prev,
        { role: 'companion', text: "Something went wrong. Try again in a moment." },
      ]);
    } finally {
      setCompanionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] w-full items-center justify-center bg-body">
        <CircleNotch size={32} className="animate-spin text-green" />
      </div>
    );
  }

  return (
    <>
      <PageContainer className="pb-24 pt-6 md:pt-10">
        <div className="space-y-10">

          <SectionHeader
            eyebrow="Sanctuary"
            title="Your life, synthesized"
            description={
              smartModeEnabled
                ? 'The Librarian is active. Every note you write is woven into the tapestry below.'
                : 'Enable Smart Mode on the Account page to activate the Librarian and begin building your living wiki.'
            }
            icon={
              <div className="icon-block icon-block-lg">
                <BookOpenText size={34} weight="duotone" />
              </div>
            }
          />

          {/* Category Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SANCTUARY_CATEGORIES.map((category) => {
              const meta = CATEGORY_META[category];
              const articles = getArticlesForCategory(category);
              const Icon = meta.icon;
              const hasArticles = articles.length > 0;

              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: SANCTUARY_CATEGORIES.indexOf(category) * 0.06 }}
                >
                  <Surface variant="bezel" className="overflow-hidden">
                    <div className={`bg-gradient-to-br ${meta.gradient} p-6`}>
                      <div className="mb-4 flex items-center justify-between">
                        <div className="icon-block icon-block-md">
                          <Icon size={24} weight="duotone" />
                        </div>
                        {!smartModeEnabled && (
                          <Lock size={16} className="text-gray-nav" />
                        )}
                      </div>
                      <h3 className="text-[20px] font-display text-gray-text">{meta.label}</h3>
                      <p className="mt-1 text-[13px] font-medium leading-relaxed text-gray-light">
                        {meta.description}
                      </p>

                      {hasArticles ? (
                        <div className="mt-4 space-y-2">
                          {articles.slice(0, 3).map((article) => (
                            <button
                              key={article.id}
                              onClick={() => setSelectedArticle(article)}
                              className="flex w-full items-center justify-between rounded-[var(--radius-control)] border border-border bg-white/60 px-3 py-2 text-left transition-all hover:border-green/20 hover:bg-green/5 dark:bg-white/5"
                            >
                              <span className="text-[13px] font-bold text-gray-text truncate">{article.title}</span>
                              <ArrowRight size={14} className="shrink-0 text-gray-nav" />
                            </button>
                          ))}
                          {articles.length > 3 && (
                            <p className="text-[11px] font-bold text-gray-nav text-center">
                              +{articles.length - 3} more
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="mt-4 text-[12px] font-bold text-gray-nav">
                          {smartModeEnabled ? 'No articles yet. Keep writing.' : 'Locked — enable Smart Mode'}
                        </p>
                      )}
                    </div>
                  </Surface>
                </motion.div>
              );
            })}
          </div>

          {/* Freeform Themes */}
          {themes.filter((t) => t.pageType === 'theme').length > 0 && (
            <div className="space-y-4">
              <h2 className="h2-section">Your Themes</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {themes
                  .filter((t) => t.pageType === 'theme')
                  .map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedArticle(theme)}
                      className="text-left rounded-[var(--radius-panel)] border border-border bg-white/60 p-4 transition-all hover:border-green/20 hover:bg-green/5 dark:bg-white/5"
                    >
                      <h3 className="text-[15px] font-bold text-gray-text">{theme.title}</h3>
                      <p className="mt-1 text-[13px] font-medium text-gray-light line-clamp-2">
                        {theme.content.replace(/<[^>]*>/g, '').slice(0, 120)}
                      </p>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Companion CTA */}
          {smartModeEnabled && (
            <Surface variant="flat" className="overflow-hidden">
              <button
                onClick={() => setCompanionOpen(true)}
                className="flex w-full items-center gap-4 p-6 text-left transition-all hover:bg-green/5"
              >
                <div className="icon-block icon-block-md">
                  <Sparkle size={24} weight="duotone" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[16px] font-display text-gray-text">Ask the Companion</h3>
                  <p className="mt-0.5 text-[13px] font-medium text-gray-light">
                    Ask questions about your life — grounded entirely in what you've written.
                  </p>
                </div>
                <ArrowRight size={18} className="text-gray-nav" />
              </button>
            </Surface>
          )}
        </div>
      </PageContainer>

      {/* Article Detail Sheet */}
      <ModalSheet
        isOpen={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
        title={selectedArticle?.title || ''}
        size="lg"
      >
        {selectedArticle && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-green/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-green">
                {selectedArticle.pageType}
              </span>
              {selectedArticle.updatedAt && (
                <span className="text-[11px] font-medium text-gray-nav">
                  Updated {new Date(selectedArticle.updatedAt).toLocaleDateString()}
                </span>
              )}
            </div>
            <div
              className="prose prose-sm max-w-none text-gray-text dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
            />
          </div>
        )}
      </ModalSheet>

      {/* Companion Chat Sheet */}
      <ModalSheet
        isOpen={companionOpen}
        onClose={() => setCompanionOpen(false)}
        title="The Companion"
        description="Ask anything about your life. I only know what you've written."
        icon={<Sparkle size={20} weight="duotone" />}
        size="lg"
      >
        <div className="flex flex-col" style={{ minHeight: '50vh' }}>
          <div className="flex-1 space-y-4 overflow-y-auto pb-4">
            {companionMessages.length === 0 && (
              <p className="text-center text-[14px] font-medium text-gray-light py-12">
                Ask me something like "What patterns keep showing up?" or "Who matters most to me?"
              </p>
            )}
            {companionMessages.map((msg, i) => (
              <div
                key={i}
                className={`rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'ml-auto max-w-[80%] bg-green/10 text-green'
                    : 'mr-auto max-w-[90%] bg-white/60 text-gray-text dark:bg-white/5'
                }`}
              >
                <p className="text-[14px] font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              </div>
            ))}
            {companionLoading && (
              <div className="mr-auto flex items-center gap-2 rounded-2xl bg-white/60 px-4 py-3 dark:bg-white/5">
                <CircleNotch size={16} className="animate-spin text-green" />
                <span className="text-[13px] font-medium text-gray-light">Thinking...</span>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 flex items-center gap-2 border-t border-border bg-body pt-4">
            <input
              type="text"
              value={companionInput}
              onChange={(e) => setCompanionInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCompanionSend()}
              placeholder="Ask your Sanctuary..."
              className="flex-1 rounded-[var(--radius-control)] border border-border bg-white px-4 py-3 text-[14px] font-medium text-gray-text outline-none transition-[border-color] focus:border-green dark:bg-[var(--panel-bg)]"
            />
            <Button
              type="button"
              onClick={handleCompanionSend}
              disabled={!companionInput.trim() || companionLoading}
              className="shrink-0 !rounded-[var(--radius-control)] !px-4"
            >
              <PaperPlaneTilt size={18} weight="bold" />
            </Button>
          </div>
        </div>
      </ModalSheet>
    </>
  );
};
