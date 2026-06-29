import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react/ArrowLeft';
import { AddressBook } from '@phosphor-icons/react/AddressBook';
import { Bell } from '@phosphor-icons/react/Bell';
import { CaretDown } from '@phosphor-icons/react/CaretDown';
import { ChatCircleText } from '@phosphor-icons/react/ChatCircleText';
import { Check } from '@phosphor-icons/react/Check';
import { ClockCounterClockwise } from '@phosphor-icons/react/ClockCounterClockwise';
import { PencilSimple } from '@phosphor-icons/react/PencilSimple';
import { SquaresFour } from '@phosphor-icons/react/SquaresFour';
import { Plus } from '@phosphor-icons/react/Plus';
import { ArrowUpRight } from '@phosphor-icons/react/ArrowUpRight';
import { Sparkle } from '@phosphor-icons/react/Sparkle';

import { Button } from '../../components/ui/Button';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { PageContainer } from '../../components/ui/PageContainer';
import { Surface } from '../../components/ui/Surface';
import { useToast } from '../../components/ui/Toast';
import { relationshipService } from '../../services/relationshipService';
import { findWikiMentions } from '../../services/relationshipWikiLink';
import { wikiService } from '../../services/wikiService';
import type {
  RelationshipHook,
  RelationshipInteraction,
  RelationshipNextCare,
  RelationshipRecord,
  RelationshipStage,
} from '../../types';
import { RoutePath } from '../../types';

// Kept for RelationshipImportInbox, which still labels the legacy stage field.
export const relationshipStageLabels: Record<RelationshipStage, string> = {
  discover: 'Discover',
  acquaintance: 'Acquaintance',
  active: 'Active',
  trusted: 'Trusted',
  dormant: 'Dormant',
  archived: 'Archived',
};

// input-surface carries the themed background/border/focus ring; bg-panel was an
// unregistered utility that left fields with the native (dark-mode) control bg.
const fieldClass = 'input-surface mt-2 min-h-12 w-full px-3 py-3 text-base font-medium';

const formatDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

// Lightweight overflow menu (native <details>, no extra deps / click-outside JS).
export type OverflowMenuItem = { label: string; onClick: () => void; danger?: boolean };

export const OverflowMenu: React.FC<{ items: OverflowMenuItem[] }> = ({ items }) => {
  const ref = useRef<HTMLDetailsElement>(null);
  const close = () => { if (ref.current) ref.current.open = false; };
  return (
    <details ref={ref} className="relative">
      <summary aria-label="More actions" className="flex min-h-12 w-12 cursor-pointer list-none items-center justify-center rounded-xl text-gray-nav focus-visible:ring-2 focus-visible:ring-green/30 hover:bg-green/5 hover:text-green [&::-webkit-details-marker]:hidden">
        <SquaresFour size={24} weight="fill" />
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-card">
        {items.map((item) => (
          <button key={item.label} type="button" onClick={() => { close(); item.onClick(); }} className={`block w-full px-4 py-3 text-left text-sm font-bold hover:bg-green/5 ${item.danger ? 'text-clay hover:bg-clay/5' : 'text-gray-text'}`}>{item.label}</button>
        ))}
      </div>
    </details>
  );
};

// Shared section header: tinted icon + title + one muted subline, with an optional right-side action.
const CardHeader: React.FC<{
  icon: React.ComponentType<{ size?: number; weight?: 'duotone' | 'fill' | 'bold' }>;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ icon: Icon, title, subtitle, action }) => (
  <div className="flex items-start justify-between gap-3">
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green/10 text-green">
        <Icon size={18} weight="duotone" />
      </span>
      <div>
        <h2 className="text-base font-bold text-gray-text">{title}</h2>
        {subtitle && <p className="text-xs font-medium text-gray-nav">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

// Single-field quick-add: one rounded field with the submit button inside it (Enter or click).
const QuickAdd: React.FC<{
  placeholder: string;
  value: string;
  ariaLabel: string;
  onChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}> = ({ placeholder, value, ariaLabel, onChange, onSubmit }) => (
  <form onSubmit={onSubmit} className="relative">
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className="input-surface w-full rounded-xl py-3 pl-3.5 pr-14 text-base font-medium"
    />
    <button
      type="submit"
      aria-label={ariaLabel}
      disabled={!value.trim()}
      className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg bg-green text-on-accent transition duration-200 ease-out hover:bg-green-hover disabled:opacity-40 disabled:hover:bg-green"
    >
      <Plus size={18} weight="bold" />
    </button>
  </form>
);

type Props = {
  relationship: RelationshipRecord;
  relationships: RelationshipRecord[];
  autoOpenCatchUp?: boolean;
  onBack: () => void;
  onChanged: (relationship: RelationshipRecord) => void;
  onDeleted: (id: string) => void;
};

export const RelationshipProfile: React.FC<Props> = ({ relationship, autoOpenCatchUp, onBack, onChanged, onDeleted }) => {
  const { showToast } = useToast();
  const catchUpSectionRef = useRef<HTMLDivElement>(null);
  const [context, setContext] = useState({
    name: relationship.name,
    howWeMet: relationship.howWeMet || '',
    caresAbout: relationship.caresAbout || '',
    email: relationship.email || '',
    phone: relationship.phone || '',
    role: relationship.role || '',
    company: relationship.company || '',
  });
  const [hook, setHook] = useState('');
  const [nextCare, setNextCare] = useState('');
  const [catchUpOpen, setCatchUpOpen] = useState(!!autoOpenCatchUp);
  const [catchUpNote, setCatchUpNote] = useState('');
  const [isSavingFacts, setIsSavingFacts] = useState(false);
  const [editingFacts, setEditingFacts] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isLoggingCatchUp, setIsLoggingCatchUp] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [wikiMentions, setWikiMentions] = useState<string[]>([]);

  const handleHeaderLogCatchUp = () => {
    setCatchUpOpen(true);
    setTimeout(() => {
      catchUpSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const textarea = catchUpSectionRef.current?.querySelector('textarea');
      if (textarea instanceof HTMLTextAreaElement) {
        textarea.focus();
      }
    }, 100);
  };

  useEffect(() => {
    if (autoOpenCatchUp) {
      setCatchUpOpen(true);
    }
  }, [autoOpenCatchUp, relationship.id]);

  const subtitle = relationship.howWeMet || [relationship.role, relationship.company].filter(Boolean).join(' · ') || '';
  const lastCaughtUp = useMemo(() => {
    const dates = [relationship.lastTendedAt, ...relationship.interactions.map((item) => item.date)].filter(Boolean) as string[];
    if (!dates.length) return null;
    return new Date(Math.max(...dates.map((value) => Date.parse(value))));
  }, [relationship.lastTendedAt, relationship.interactions]);
  const openHooks = relationship.hooks.filter((item) => !item.used);
  const isNewProfile = !relationship.howWeMet && !relationship.caresAbout
    && !relationship.hooks.length && !relationship.interactions.length && !relationship.nextCare.length;

  useEffect(() => {
    let active = true;
    void wikiService.getWikiPage('people')
      .then((page) => { if (active) setWikiMentions(findWikiMentions(page?.content || '', relationship.name)); })
      .catch(() => { if (active) setWikiMentions([]); });
    return () => { active = false; };
  }, [relationship.id, relationship.name]);

  useEffect(() => {
    setContext({
      name: relationship.name,
      howWeMet: relationship.howWeMet || '',
      caresAbout: relationship.caresAbout || '',
      email: relationship.email || '',
      phone: relationship.phone || '',
      role: relationship.role || '',
      company: relationship.company || '',
    });
    setEditingFacts(isNewProfile);
  }, [relationship.id]);

  const update = async (updates: Partial<RelationshipRecord>, success?: string) => {
    try {
      const updated = await relationshipService.update(relationship.id, updates);
      onChanged(updated);
      if (success) showToast(success);
      return updated;
    } catch {
      showToast("I couldn't save that. Your notes are unchanged — try again.");
      return undefined;
    }
  };

  const saveFacts = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!context.name.trim()) return;
    setIsSavingFacts(true);
    const saved = await update({
      name: context.name.trim(),
      howWeMet: context.howWeMet.trim() || undefined,
      caresAbout: context.caresAbout.trim() || undefined,
    }, 'Saved.');
    setIsSavingFacts(false);
    if (saved) setEditingFacts(false);
  };

  const saveDetails = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSavingDetails(true);
    await update({
      email: context.email.trim() || undefined,
      phone: context.phone.trim() || undefined,
      role: context.role.trim() || undefined,
      company: context.company.trim() || undefined,
    }, 'Saved.');
    setIsSavingDetails(false);
  };

  const logCatchUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoggingCatchUp(true);
    const note = catchUpNote.trim();
    const interactions: RelationshipInteraction[] = note
      ? [...relationship.interactions, {
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          channel: 'other',
          notes: note,
          direction: 'mutual',
        }]
      : relationship.interactions;
    const updated = await update({ interactions, lastTendedAt: new Date().toISOString() }, 'Catch-up logged.');
    setIsLoggingCatchUp(false);
    if (updated) { setCatchUpNote(''); setCatchUpOpen(false); }
  };

  const addHook = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hook.trim()) return;
    const hooks: RelationshipHook[] = [...relationship.hooks, {
      id: crypto.randomUUID(),
      description: hook.trim(),
      source: 'manual',
      createdAt: new Date().toISOString(),
      used: false,
    }];
    if (await update({ hooks })) setHook('');
  };

  const saveSnippetAsHook = async (snippet: string) => {
    const hooks: RelationshipHook[] = [...relationship.hooks, {
      id: crypto.randomUUID(),
      description: snippet,
      source: 'life wiki',
      createdAt: new Date().toISOString(),
      used: false,
    }];
    await update({ hooks }, 'Saved as a reason to reconnect.');
  };

  const addNextCare = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!nextCare.trim()) return;
    const items: RelationshipNextCare[] = [...relationship.nextCare, {
      id: crypto.randomUUID(),
      label: nextCare.trim(),
      priority: 'medium',
      status: 'open',
      createdAt: new Date().toISOString(),
    }];
    if (await update({ nextCare: items })) setNextCare('');
  };

  const archive = async () => {
    try {
      const updated = await relationshipService.archive(relationship.id);
      onChanged(updated);
      showToast(`${relationship.name} archived.`);
      onBack();
    } catch {
      showToast("I couldn't archive them. Try again in a moment.");
    }
  };

  const remove = async () => {
    setIsDeleting(true);
    try {
      await relationshipService.remove(relationship.id);
      onDeleted(relationship.id);
    } catch {
      showToast("I couldn't delete them. Try again in a moment.");
      setIsDeleting(false);
      setConfirmDeleteOpen(false);
    }
  };

  return (
    <PageContainer className="surface-scope-sage page-wash pb-24 pt-6 md:pt-10">
      <button type="button" onClick={onBack} className="mb-8 flex min-h-12 w-fit items-center gap-2 rounded-xl px-3 text-sm font-bold text-gray-nav focus-visible:ring-2 focus-visible:ring-green/30 hover:bg-green/5 hover:text-green">
        <ArrowLeft size={16} weight="bold" /> Back
      </button>

      <article className="mx-auto max-w-3xl space-y-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-3">
            <h1 className="text-4xl font-display font-extrabold text-gray-text sm:text-5xl">{relationship.name}</h1>
            {subtitle && <p className="text-lg leading-relaxed text-gray-light">{subtitle}</p>}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold text-gray-nav">
              <span>{lastCaughtUp ? `Last caught up ${formatDate(lastCaughtUp.toISOString())}` : 'No catch-ups yet'}</span>
              {!editingFacts && (
                <>
                  <span className="text-gray-nav/40" aria-hidden="true">•</span>
                  <button
                    type="button"
                    onClick={() => setEditingFacts(true)}
                    className="inline-flex items-center gap-1.5 text-green hover:text-green-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/30"
                  >
                    <PencilSimple size={14} weight="bold" className="shrink-0" />
                    <span>Edit details</span>
                  </button>
                </>
              )}
            </div>
            {!editingFacts && relationship.caresAbout && (
              <p className="text-ui-base leading-relaxed text-gray-light">
                <span className="font-bold text-gray-nav">Cares about</span> {relationship.caresAbout}
              </p>
            )}
            {isNewProfile && !editingFacts && (
              <p className="text-sm font-medium text-gray-light">Add a note, a reason to reconnect, or log a catch-up to get started.</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleHeaderLogCatchUp}
              className="inline-flex items-center gap-1.5"
            >
              <ClockCounterClockwise size={14} weight="bold" />
              <span>Log catch-up</span>
            </Button>
            <OverflowMenu items={[
              { label: 'Archive', onClick: () => void archive() },
              { label: 'Delete…', onClick: () => setConfirmDeleteOpen(true), danger: true },
            ]} />
          </div>
        </header>


        {/* Identity facts — edit on demand; read-only by default lives in the header */}
        {editingFacts && (
          <Surface variant="flat" tone="paper" className="p-6 md:p-8">
            <form onSubmit={saveFacts} className="space-y-5">
              <label className="block text-sm font-bold text-gray-nav">Name
                <input name="name" value={context.name} required autoComplete="name" onChange={(event) => setContext((current) => ({ ...current, name: event.target.value }))} className={fieldClass} />
              </label>
              <label className="block text-sm font-bold text-gray-nav">How you know them
                <textarea name="howWeMet" value={context.howWeMet} onChange={(event) => setContext((current) => ({ ...current, howWeMet: event.target.value }))} placeholder="Add a note about how you know them." className={`${fieldClass} min-h-20 font-medium`} />
              </label>
              <label className="block text-sm font-bold text-gray-nav">What they care about
                <textarea name="caresAbout" value={context.caresAbout} onChange={(event) => setContext((current) => ({ ...current, caresAbout: event.target.value }))} placeholder="Add what matters to them." className={`${fieldClass} min-h-20 font-medium`} />
              </label>
              <div className="flex gap-2">
                <Button type="submit" variant="secondary" isLoading={isSavingFacts}>Save</Button>
                {!isNewProfile && (
                  <Button type="button" variant="ghost" onClick={() => { setContext((current) => ({ ...current, name: relationship.name, howWeMet: relationship.howWeMet || '', caresAbout: relationship.caresAbout || '' })); setEditingFacts(false); }}>Cancel</Button>
                )}
              </div>
            </form>
          </Surface>
        )}

        {/* Consolidated Relationship details (Reasons, Reminders, and Catch-ups) */}
        <Surface variant="flat" tone="paper" className="p-6 md:p-8 space-y-12">
          {/* Reasons to reconnect */}
          <div>
            <CardHeader icon={ChatCircleText} title="Reasons to reconnect" />
            <div className="mt-4 space-y-1.5">
              {openHooks.map((item) => (
                <button key={item.id} type="button" onClick={() => void update({ hooks: relationship.hooks.map((candidate) => candidate.id === item.id ? { ...candidate, used: true } : candidate) })} className="group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition duration-200 ease-out hover:bg-green/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green/60" />
                  <span className="flex-1 text-sm font-medium text-gray-text">{item.description}</span>
                  <span className="text-xs font-bold text-gray-nav opacity-0 transition group-hover:opacity-100">Done</span>
                </button>
              ))}
              {!openHooks.length && <p className="px-3 pb-1 text-sm font-medium text-gray-nav">No reasons yet.</p>}
            </div>
            <div className="mt-3">
              <QuickAdd ariaLabel="Add a reason" placeholder="Add a reason… e.g. ask about their new role" value={hook} onChange={setHook} onSubmit={addHook} />
            </div>
          </div>

          {/* Reminders */}
          <div>
            <CardHeader icon={Bell} title="Reminders" />
            <div className="mt-4 space-y-1.5">
              {relationship.nextCare.map((item) => {
                const done = item.status === 'done';
                return (
                  <button key={item.id} type="button" disabled={done} onClick={() => void update({ nextCare: relationship.nextCare.map((candidate) => candidate.id === item.id ? { ...candidate, status: 'done' as const } : candidate) })} className="group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition duration-200 ease-out hover:bg-green/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/30 disabled:hover:bg-transparent">
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${done ? 'border-green bg-green text-on-accent' : 'border-gray-nav/40 text-transparent group-hover:border-green'}`}>
                      <Check size={12} weight="bold" />
                    </span>
                    <span className={`flex-1 text-sm font-medium ${done ? 'text-gray-nav line-through' : 'text-gray-text'}`}>{item.label}</span>
                  </button>
                );
              })}
              {!relationship.nextCare.length && <p className="px-3 pb-1 text-sm font-medium text-gray-nav">No reminders yet.</p>}
            </div>
            <div className="mt-3">
              <QuickAdd ariaLabel="Add a reminder" placeholder="Add a reminder… e.g. send the article" value={nextCare} onChange={setNextCare} onSubmit={addNextCare} />
            </div>
          </div>

          {/* Catch-ups */}
          <div ref={catchUpSectionRef}>
            <CardHeader
              icon={ClockCounterClockwise}
              title="Catch-ups"
              action={
                <button
                  type="button"
                  onClick={() => setCatchUpOpen((open) => !open)}
                  className="inline-flex items-center gap-1 text-sm font-bold text-green hover:text-green-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/30"
                >
                  <Plus size={14} weight="bold" />
                  <span>Log catch-up</span>
                </button>
              }
            />
            
            {catchUpOpen && (
              <div className="mt-4 pb-4">
                <form onSubmit={logCatchUp} className="space-y-4">
                  <label className="block text-sm font-bold text-gray-nav">
                    What happened? <span className="font-normal text-gray-nav/75">(optional)</span>
                    <textarea
                      autoFocus
                      value={catchUpNote}
                      onChange={(event) => setCatchUpNote(event.target.value)}
                      placeholder="Coffee, a call, a quick message…"
                      className={`${fieldClass} min-h-20 font-medium`}
                    />
                  </label>
                  <div className="flex gap-2">
                    <Button type="submit" variant="primary" size="sm" isLoading={isLoggingCatchUp}>Save catch-up</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => { setCatchUpOpen(false); setCatchUpNote(''); }}>Cancel</Button>
                  </div>
                </form>
              </div>
            )}

            <div className="mt-4 space-y-4">
              {[...relationship.interactions].reverse().map((item) => (
                <div key={item.id} className="py-2 first:pt-0 last:pb-0 border-l-2 border-green/15 pl-4 space-y-1">
                  <p className="text-sm font-bold text-gray-text">{formatDate(item.date)}</p>
                  <p className="text-sm font-medium text-gray-light leading-relaxed">{item.notes}</p>
                </div>
              ))}
              {!relationship.interactions.length && <p className="px-3 pb-1 text-sm font-medium text-gray-nav">No catch-ups yet.</p>}
            </div>
          </div>
        </Surface>

        {/* From your Life Wiki — surfaced in the default view when there's something to show */}
        {wikiMentions.length > 0 && (
          <Surface variant="flat" tone="paper" className="p-5 md:p-6">
            <CardHeader
              icon={Sparkle}
              title="From your People room"
              subtitle="Pulled from what you've written about them in Notes."
              action={
                <Link
                  to={RoutePath.SANCTUARY_ARTICLE.replace(':pageType', 'people')}
                  className="shrink-0 text-sm font-bold text-green hover:text-green-hover transition-colors inline-flex items-center gap-1"
                >
                  <span>Open People room</span>
                  <ArrowUpRight size={14} weight="bold" />
                </Link>
              }
            />
            <div className="mt-4 space-y-3">
              {wikiMentions.map((snippet, index) => (
                <div key={index} className="rounded-2xl bg-green/5 p-5 space-y-3">
                  <p className="text-sm font-medium leading-relaxed text-gray-text">{snippet}</p>
                  <Button type="button" size="sm" variant="secondary" className="mt-1" onClick={() => void saveSnippetAsHook(snippet)}>Save as a reason to reconnect</Button>
                </div>
              ))}
            </div>
          </Surface>
        )}

        {/* From your Life Wiki — empty hint keeps the People room link reachable */}
        {!wikiMentions.length && (
          <Surface variant="flat" tone="paper" className="p-5 md:p-6">
            <CardHeader
              icon={Sparkle}
              title="From your People room"
              action={
                <Link
                  to={RoutePath.SANCTUARY_ARTICLE.replace(':pageType', 'people')}
                  className="shrink-0 text-sm font-bold text-green hover:text-green-hover transition-colors inline-flex items-center gap-1"
                >
                  <span>Open People room</span>
                  <ArrowUpRight size={14} weight="bold" />
                </Link>
              }
            />
            <p className="mt-4 text-sm font-medium leading-relaxed text-gray-nav">Nothing about {relationship.name} in your People room yet. As you write about them in Notes, mentions will gather here.</p>
          </Surface>
        )}

        {/* Contact details — a quiet, optional toggle; clearly secondary to the identity facts above */}
        <details className="group pt-2">
          <summary className="flex min-h-11 w-full cursor-pointer list-none items-center justify-between rounded-xl px-1 text-sm font-bold text-gray-text hover:bg-green/5 hover:text-green transition-colors focus-visible:ring-2 focus-visible:ring-green/30 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2">
              <AddressBook size={18} weight="duotone" className="text-green" />
              <span>Contact details</span>
              <span className="text-xs font-normal text-gray-light">(optional)</span>
            </span>
            <span className="transition-transform duration-300 group-open:rotate-180 px-2">
              <CaretDown size={16} weight="bold" className="text-gray-nav" />
            </span>
          </summary>
          <div className="mt-3 p-5 md:p-6 rounded-2xl bg-surface">
            <form onSubmit={saveDetails} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-bold text-gray-nav">Email<input name="email" value={context.email} onChange={(event) => setContext((current) => ({ ...current, email: event.target.value }))} className={fieldClass} /></label>
                <label className="text-sm font-bold text-gray-nav">Phone<input name="phone" value={context.phone} onChange={(event) => setContext((current) => ({ ...current, phone: event.target.value }))} className={fieldClass} /></label>
                <label className="text-sm font-bold text-gray-nav">Role<input name="role" value={context.role} onChange={(event) => setContext((current) => ({ ...current, role: event.target.value }))} className={fieldClass} /></label>
                <label className="text-sm font-bold text-gray-nav">Company<input name="company" value={context.company} onChange={(event) => setContext((current) => ({ ...current, company: event.target.value }))} className={fieldClass} /></label>
              </div>
              <Button type="submit" variant="secondary" isLoading={isSavingDetails}>Save</Button>
            </form>
          </div>
        </details>
      </article>

      <ConfirmationDialog
        isOpen={confirmDeleteOpen}
        onClose={() => { if (!isDeleting) setConfirmDeleteOpen(false); }}
        onConfirm={() => void remove()}
        variant="danger"
        title={`Delete ${relationship.name}?`}
        description={`This removes everything saved about ${relationship.name}: catch-ups, reasons to reconnect, and reminders. It can't be undone.`}
        confirmLabel="Delete"
        isConfirming={isDeleting}
      />
    </PageContainer>
  );
};
