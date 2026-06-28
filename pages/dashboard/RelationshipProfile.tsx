import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react/ArrowLeft';
import { Bell } from '@phosphor-icons/react/Bell';
import { ChatCircleText } from '@phosphor-icons/react/ChatCircleText';
import { Check } from '@phosphor-icons/react/Check';
import { ClockCounterClockwise } from '@phosphor-icons/react/ClockCounterClockwise';
import { DotsThreeVertical } from '@phosphor-icons/react/DotsThreeVertical';
import { Plus } from '@phosphor-icons/react/Plus';
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
        <DotsThreeVertical size={24} weight="fill" />
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
  onBack: () => void;
  onChanged: (relationship: RelationshipRecord) => void;
  onDeleted: (id: string) => void;
};

export const RelationshipProfile: React.FC<Props> = ({ relationship, onBack, onChanged, onDeleted }) => {
  const { showToast } = useToast();
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
  const [catchUpOpen, setCatchUpOpen] = useState(false);
  const [catchUpNote, setCatchUpNote] = useState('');
  const [isSavingFacts, setIsSavingFacts] = useState(false);
  const [editingFacts, setEditingFacts] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isLoggingCatchUp, setIsLoggingCatchUp] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [wikiMentions, setWikiMentions] = useState<string[]>([]);

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
            <p className="text-sm font-bold text-gray-nav">
              {lastCaughtUp ? `Last caught up ${formatDate(lastCaughtUp.toISOString())}` : 'No catch-ups yet'}
            </p>
            {!editingFacts && relationship.caresAbout && (
              <p className="text-[15px] leading-relaxed text-gray-light">
                <span className="font-bold text-gray-nav">Cares about</span> {relationship.caresAbout}
              </p>
            )}
            {isNewProfile && !editingFacts && (
              <p className="text-sm font-medium text-gray-light">Add a note, a reason to reconnect, or log a catch-up to get started.</p>
            )}
            {!editingFacts && (
              <button type="button" onClick={() => setEditingFacts(true)} className="inline-flex min-h-9 items-center text-sm font-bold text-green hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/30">
                Edit details
              </button>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="primary" onClick={() => setCatchUpOpen((open) => !open)}>
              <Check size={16} weight="bold" className="mr-2" /> Log a catch-up
            </Button>
            <OverflowMenu items={[
              { label: 'Archive', onClick: () => void archive() },
              { label: 'Delete…', onClick: () => setConfirmDeleteOpen(true), danger: true },
            ]} />
          </div>
        </header>

        {catchUpOpen && (
          <Surface variant="flat" tone="sage" className="p-5 md:p-6">
            <form onSubmit={logCatchUp} className="space-y-3">
              <label className="block text-sm font-bold text-gray-nav">What happened? (optional)
                <textarea autoFocus value={catchUpNote} onChange={(event) => setCatchUpNote(event.target.value)} placeholder="Coffee, a call, a quick message…" className={`${fieldClass} min-h-20 font-medium`} />
              </label>
              <div className="flex gap-2">
                <Button type="submit" variant="primary" size="sm" isLoading={isLoggingCatchUp}>Save catch-up</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => { setCatchUpOpen(false); setCatchUpNote(''); }}>Cancel</Button>
              </div>
            </form>
          </Surface>
        )}

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

        {/* Reasons to reconnect */}
        <Surface variant="flat" tone="paper" className="p-5 md:p-6">
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
        </Surface>

        {/* Reminders */}
        <Surface variant="flat" tone="paper" className="p-5 md:p-6">
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
        </Surface>

        {/* Catch-ups — the aha record, promoted into the calm column */}
        <Surface variant="flat" tone="paper" className="p-5 md:p-6">
          <CardHeader icon={ClockCounterClockwise} title="Catch-ups" />
          <div className="mt-4 space-y-3">
            {[...relationship.interactions].reverse().map((item) => (
              <div key={item.id} className="rounded-2xl border border-green/20 p-4">
                <p className="text-sm font-bold text-gray-text">{formatDate(item.date)}</p>
                <p className="mt-1 text-sm font-medium text-gray-light">{item.notes}</p>
              </div>
            ))}
            {!relationship.interactions.length && <p className="text-sm font-medium text-gray-nav">No catch-ups yet.</p>}
          </div>
        </Surface>

        {/* From your Life Wiki — surfaced in the default view when there's something to show */}
        {wikiMentions.length > 0 && (
          <Surface variant="flat" tone="paper" className="p-5 md:p-6">
            <CardHeader
              icon={Sparkle}
              title="From your People room"
              subtitle="Pulled from what you've written about them in Notes."
              action={<Link to={RoutePath.SANCTUARY_ARTICLE.replace(':pageType', 'people')} className="shrink-0 text-sm font-bold text-green hover:underline">Open People room</Link>}
            />
            <div className="mt-4 space-y-3">
              {wikiMentions.map((snippet, index) => (
                <div key={index} className="rounded-2xl border border-green/20 bg-green/5 p-4">
                  <p className="text-sm font-medium leading-relaxed text-gray-text">{snippet}</p>
                  <Button type="button" size="sm" variant="secondary" className="mt-3" onClick={() => void saveSnippetAsHook(snippet)}>Save as a reason to reconnect</Button>
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
              action={<Link to={RoutePath.SANCTUARY_ARTICLE.replace(':pageType', 'people')} className="shrink-0 text-sm font-bold text-green hover:underline">Open People room</Link>}
            />
            <p className="mt-4 text-sm font-medium leading-relaxed text-gray-nav">Nothing about {relationship.name} in your People room yet. As you write about them in Notes, mentions will gather here.</p>
          </Surface>
        )}

        {/* Contact details — a quiet, optional toggle; clearly secondary to the identity facts above */}
        <details className="group pt-2">
          <summary className="inline-flex min-h-11 w-fit cursor-pointer list-none items-center gap-2.5 rounded-xl px-1 text-sm font-bold text-gray-nav focus-visible:ring-2 focus-visible:ring-green/30 hover:text-green [&::-webkit-details-marker]:hidden">
            <span>Contact details <span className="font-medium text-gray-nav/70">(optional)</span></span>
            <span className="text-xs font-black uppercase tracking-[0.14em] text-gray-nav/60 group-open:hidden">Show</span>
            <span className="hidden text-xs font-black uppercase tracking-[0.14em] text-gray-nav/60 group-open:inline">Hide</span>
          </summary>
          <Surface variant="flat" tone="paper" className="mt-3 p-5 md:p-6">
            <form onSubmit={saveDetails} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-bold text-gray-nav">Email<input name="email" value={context.email} onChange={(event) => setContext((current) => ({ ...current, email: event.target.value }))} className={fieldClass} /></label>
                <label className="text-sm font-bold text-gray-nav">Phone<input name="phone" value={context.phone} onChange={(event) => setContext((current) => ({ ...current, phone: event.target.value }))} className={fieldClass} /></label>
                <label className="text-sm font-bold text-gray-nav">Role<input name="role" value={context.role} onChange={(event) => setContext((current) => ({ ...current, role: event.target.value }))} className={fieldClass} /></label>
                <label className="text-sm font-bold text-gray-nav">Company<input name="company" value={context.company} onChange={(event) => setContext((current) => ({ ...current, company: event.target.value }))} className={fieldClass} /></label>
              </div>
              <Button type="submit" variant="secondary" isLoading={isSavingDetails}>Save</Button>
            </form>
          </Surface>
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
