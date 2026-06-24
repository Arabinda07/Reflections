import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AddressBook, CirclesThreePlus, ClockCounterClockwise, Plus, Tray } from '@phosphor-icons/react';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { MetadataPill } from '../../components/ui/MetadataPill';
import { ModalSheet } from '../../components/ui/ModalSheet';
import { PageContainer } from '../../components/ui/PageContainer';
import { Surface } from '../../components/ui/Surface';
import { useToast } from '../../components/ui/Toast';
import { relationshipService } from '../../services/relationshipService';
import type { RelationshipHook, RelationshipImportInboxItem, RelationshipRecord, RelationshipTag } from '../../types';
import { RoutePath } from '../../types';
import { RelationshipImportInbox } from './RelationshipImportInbox';
import { RelationshipProfile, relationshipStageLabels } from './RelationshipProfile';

const relationshipPath = (id: string) => RoutePath.RELATIONSHIP_DETAIL.replace(':id', encodeURIComponent(id));
const fieldClass = 'mt-2 min-h-12 w-full rounded-xl border border-border bg-panel px-4 py-3 text-base font-medium text-gray-text outline-none focus-visible:ring-2 focus-visible:ring-green/30';

const emptyDraft = { name: '', howWeMet: '', caresAbout: '', domain: '', roleTag: '', hook: '' };
type Draft = typeof emptyDraft;

const tagsForDraft = (draft: Draft): RelationshipTag[] => [
  ...(draft.domain.trim() ? [{ id: crypto.randomUUID(), category: 'domain' as const, label: draft.domain.trim() }] : []),
  ...(draft.roleTag.trim() ? [{ id: crypto.randomUUID(), category: 'role' as const, label: draft.roleTag.trim() }] : []),
];

const hooksForDraft = (draft: Draft): RelationshipHook[] => draft.hook.trim() ? [{
  id: crypto.randomUUID(),
  description: draft.hook.trim(),
  source: 'manual',
  createdAt: new Date().toISOString(),
  used: false,
}] : [];

const stageClass = (stage: RelationshipRecord['stage']) => {
  if (stage === 'trusted') return 'text-green';
  if (stage === 'active') return 'text-sky';
  if (stage === 'dormant') return 'text-clay';
  return 'text-gray-nav';
};

export const Relationships: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const [relationships, setRelationships] = useState<RelationshipRecord[]>([]);
  const [inbox, setInbox] = useState<RelationshipImportInboxItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [seed, setSeed] = useState({ topPeople: '', topDomains: '', lostTouch: '' });
  const [isSeeding, setIsSeeding] = useState(false);
  const [hasPendingSync, setHasPendingSync] = useState(false);

  const tab = searchParams.get('tab');
  const activeTab = tab === 'people' || tab === 'import' ? tab : 'weekly';
  const selectedRelationship = id ? relationships.find((relationship) => relationship.id === id) : undefined;
  const pendingInbox = useMemo(() => inbox.filter((item) => item.status === 'pending'), [inbox]);
  const suggestions = useMemo(() => relationshipService.buildWeeklySuggestions(relationships), [relationships]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [nextRelationships, nextInbox] = await Promise.all([
        relationshipService.getAll(),
        relationshipService.getImportInbox(),
      ]);
      setRelationships(nextRelationships);
      setInbox(nextInbox);
      setHasPendingSync(await relationshipService.hasPendingSync());
    } catch {
      showToast('Could not load relationships right now.');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void load(); }, [load]);

  const createRelationship = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim()) return;
    try {
      const relationship = await relationshipService.create({
        name: draft.name.trim(),
        howWeMet: draft.howWeMet.trim() || undefined,
        caresAbout: draft.caresAbout.trim() || undefined,
        tags: tagsForDraft(draft),
        hooks: hooksForDraft(draft),
      });
      setRelationships((current) => [relationship, ...current]);
      setHasPendingSync(await relationshipService.hasPendingSync());
      setDraft(emptyDraft);
      setIsCreateOpen(false);
      navigate(relationshipPath(relationship.id));
    } catch {
      showToast('Could not add that relationship.');
    }
  };

  const seedRelationships = async (event: React.FormEvent) => {
    event.preventDefault();
    const topPeople = seed.topPeople.split(/\r?\n/).map((name) => name.trim()).filter(Boolean).slice(0, 5);
    const lostTouch = seed.lostTouch.split(/\r?\n/).map((name) => name.trim()).filter(Boolean).slice(0, 5);
    if (!topPeople.length && !lostTouch.length) return;
    const domains = seed.topDomains.split(',').map((label) => label.trim()).filter(Boolean);
    setIsSeeding(true);
    try {
      const created = await Promise.all([
        ...topPeople.map((name) => relationshipService.create({
          name,
          stage: 'trusted',
          closeness: 5,
          tags: domains.map((label) => ({ id: crypto.randomUUID(), category: 'domain' as const, label })),
        })),
        ...lostTouch.map((name) => relationshipService.create({ name, stage: 'dormant' })),
      ]);
      setRelationships((current) => [...created, ...current]);
      setHasPendingSync(await relationshipService.hasPendingSync());
      setSeed({ topPeople: '', topDomains: '', lostTouch: '' });
      showToast(`${created.length} relationships seeded.`);
    } catch {
      showToast('Some relationships could not be seeded. Existing entries were kept.');
      await load();
    } finally {
      setIsSeeding(false);
    }
  };

  if (id) {
    if (isLoading) return <PageContainer className="surface-scope-sage page-wash min-h-[100dvh]"><div aria-hidden="true" /></PageContainer>;
    if (!selectedRelationship) return <PageContainer className="surface-scope-sage page-wash pb-24 pt-10"><Surface variant="bezel" tone="sage" innerClassName="p-8 text-center"><h1 className="text-3xl font-display font-bold text-gray-text">Relationship not found.</h1></Surface></PageContainer>;
    return (
      <RelationshipProfile
        relationship={selectedRelationship}
        relationships={relationships}
        onBack={() => navigate(RoutePath.RELATIONSHIPS)}
        onChanged={(updated) => {
          setRelationships((current) => current.map((item) => item.id === updated.id ? updated : item));
          void relationshipService.hasPendingSync().then(setHasPendingSync);
        }}
      />
    );
  }

  return (
    <>
      <PageContainer className="surface-scope-sage page-wash pb-24 pt-6 md:pt-10">
        <div className="core-page-stack">
          <header className="mx-auto max-w-4xl space-y-5 text-center">
            <p className="label-caps text-green">RelationshipOS</p>
            <h1 className="text-4xl font-display font-extrabold text-gray-text sm:text-5xl md:text-6xl">Relationships</h1>
            <p className="mx-auto max-w-[65ch] font-serif text-xl italic leading-relaxed text-gray-text/75">A quiet system for tending people, hooks, and acts of care over time.</p>
          </header>

          <nav aria-label="Relationship views" className="flex flex-wrap items-center justify-center gap-2">
            {([
              ['weekly', 'Weekly'],
              ['people', 'People'],
              ['import', `Import inbox${pendingInbox.length ? ` (${pendingInbox.length})` : ''}`],
            ] as const).map(([key, label]) => (
              <Link key={key} aria-current={activeTab === key ? 'page' : undefined} to={key === 'weekly' ? RoutePath.RELATIONSHIPS : `${RoutePath.RELATIONSHIPS}?tab=${key}`} className={`flex min-h-12 items-center rounded-xl px-4 text-sm font-black focus-visible:ring-2 focus-visible:ring-green/30 ${activeTab === key ? 'bg-green text-white' : 'border border-border bg-panel/40 text-gray-nav hover:text-green'}`}>{label}</Link>
            ))}
          </nav>
          {hasPendingSync && <p role="status" className="mx-auto max-w-xl rounded-xl border border-honey/25 bg-honey/5 px-4 py-3 text-center text-sm font-bold text-gray-nav">Saved securely on this device. Reflections will retry syncing.</p>}

          <section className="grid gap-5 lg:grid-cols-[1fr_20rem]">
            <div className="space-y-5">
              {activeTab === 'weekly' && (
                <Surface variant="bezel" tone="sage" innerClassName="p-6 md:p-8">
                  <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div><p className="label-caps text-green">This week</p><h2 className="mt-2 text-3xl font-display font-bold text-gray-text">People to tend</h2></div>
                    <Button variant="primary" onClick={() => setIsCreateOpen(true)}>Add relationship<Plus size={16} weight="bold" className="ml-2" /></Button>
                  </div>

                  {suggestions.length ? (
                    <div className="grid gap-4">
                      {suggestions.map((suggestion) => (
                        <article key={suggestion.relationship.id} className="rounded-[1.5rem] border border-green/15 bg-green/5 p-5">
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="min-w-0"><Link to={relationshipPath(suggestion.relationship.id)} className="text-xl font-display font-bold text-gray-text hover:text-green">{suggestion.relationship.name}</Link><p className="mt-2 text-sm font-semibold leading-relaxed text-gray-light">{suggestion.reason}</p></div>
                            <MetadataPill tone="green">{relationshipStageLabels[suggestion.relationship.stage]}</MetadataPill>
                          </div>
                          <div className="mt-5 grid gap-3 md:grid-cols-3">
                            <div><p className="label-caps text-gray-nav">Hook</p><p className="mt-1 text-sm font-bold text-gray-text">{suggestion.suggestedHook?.description || 'No hook yet'}</p></div>
                            <div><p className="label-caps text-gray-nav">Last touch</p><p className="mt-1 text-sm font-bold text-gray-text">{suggestion.lastInteraction ? new Date(suggestion.lastInteraction.date).toLocaleDateString() : 'No touchpoint yet'}</p></div>
                            <div><p className="label-caps text-gray-nav">Next care</p><p className="mt-1 text-sm font-bold text-gray-text">{suggestion.suggestedCare}</p></div>
                          </div>
                          <div className="mt-5 flex flex-wrap gap-2"><Button variant="secondary" size="sm" onClick={async () => {
                            try {
                              const updated = await relationshipService.markTended(suggestion.relationship.id);
                              setRelationships((current) => current.map((item) => item.id === updated.id ? updated : item));
                              setHasPendingSync(await relationshipService.hasPendingSync());
                              showToast(`${updated.name} marked as tended this week.`);
                            } catch {
                              showToast('Could not mark that relationship as tended.');
                            }
                          }}>Mark tended</Button><Button variant="ghost" size="sm" onClick={() => navigate(relationshipPath(suggestion.relationship.id))}>Open profile</Button></div>
                        </article>
                      ))}
                    </div>
                  ) : relationships.length ? (
                    <div className="rounded-[1.5rem] border-2 border-dashed border-green/20 p-8 text-center"><h3 className="text-2xl font-display font-bold text-gray-text">This week's care is complete.</h3><p className="mt-2 text-sm font-medium text-gray-light">New signals will surface here as relationships evolve.</p></div>
                  ) : (
                    <form onSubmit={seedRelationships} className="rounded-[1.5rem] border-2 border-dashed border-green/20 p-6 md:p-8">
                      <CirclesThreePlus size={32} weight="duotone" className="text-green" />
                      <h3 className="mt-4 text-2xl font-display font-bold text-gray-text">Seed the people who already matter.</h3>
                      <p className="mt-2 text-sm font-medium text-gray-light">One person per line. Start small; this is not an address book.</p>
                      <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <label className="text-sm font-bold text-gray-nav">Top people
                          <textarea name="topPeople" value={seed.topPeople} onChange={(event) => setSeed((current) => ({ ...current, topPeople: event.target.value }))} className={`${fieldClass} min-h-32`} placeholder="Up to five names" />
                        </label>
                        <label className="text-sm font-bold text-gray-nav">People you've lost touch with
                          <textarea name="lostTouch" value={seed.lostTouch} onChange={(event) => setSeed((current) => ({ ...current, lostTouch: event.target.value }))} className={`${fieldClass} min-h-32`} placeholder="Up to five names" />
                        </label>
                      </div>
                      <label className="mt-4 block text-sm font-bold text-gray-nav">Domains shared by your top people
                        <input name="topDomains" value={seed.topDomains} onChange={(event) => setSeed((current) => ({ ...current, topDomains: event.target.value }))} className={fieldClass} placeholder="AI, education, design" />
                      </label>
                      <Button type="submit" variant="primary" className="mt-5" isLoading={isSeeding}>Seed relationships</Button>
                    </form>
                  )}
                </Surface>
              )}

              {activeTab === 'people' && (
                <Surface variant="flat" tone="paper" className="p-6 md:p-8">
                  <div className="mb-6 flex items-center justify-between gap-4"><h2 className="text-3xl font-display font-bold text-gray-text">People library</h2><Button variant="primary" onClick={() => setIsCreateOpen(true)}>Add<Plus size={16} weight="bold" className="ml-2" /></Button></div>
                  <div className="grid gap-3">
                    {relationships.map((relationship) => <Link key={relationship.id} to={relationshipPath(relationship.id)} className="flex min-h-20 items-center justify-between gap-4 rounded-2xl border border-border/70 p-4 focus-visible:ring-2 focus-visible:ring-green/30 hover:border-green/25 hover:bg-green/5"><span className="min-w-0"><span className="block text-base font-bold text-gray-text">{relationship.name}</span><span className="mt-1 block truncate text-sm font-medium text-gray-light">{relationship.role || relationship.company || relationship.howWeMet || 'Context pending'}</span></span><span className={`shrink-0 text-xs font-black uppercase tracking-[0.14em] ${stageClass(relationship.stage)}`}>{relationshipStageLabels[relationship.stage]}</span></Link>)}
                    {!relationships.length && !isLoading && <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm font-medium text-gray-light">No relationships yet.</p>}
                  </div>
                </Surface>
              )}

              {activeTab === 'import' && <RelationshipImportInbox relationships={relationships} pendingInbox={pendingInbox} onRefresh={load} />}
            </div>

            <aside className="space-y-5">
              <Surface variant="flat" tone="honey" className="p-6"><div className="flex items-center gap-2"><ClockCounterClockwise size={18} weight="duotone" className="text-honey" /><p className="label-caps text-gray-nav">Ritual state</p></div><div className="mt-5 grid gap-4"><div><p className="text-3xl font-display font-bold text-gray-text">{suggestions.length}</p><p className="text-sm font-bold text-gray-nav">people suggested</p></div><div><p className="text-3xl font-display font-bold text-gray-text">{pendingInbox.length}</p><p className="text-sm font-bold text-gray-nav">imports waiting</p></div></div></Surface>
              <Surface variant="flat" tone="paper" className="p-6"><div className="flex items-center gap-2"><AddressBook size={18} weight="duotone" className="text-green" /><p className="label-caps text-gray-nav">Life Wiki link</p></div><p className="mt-4 text-sm font-medium leading-relaxed text-gray-light">The People room remains your reflective source layer. Relationships holds deliberate care.</p><Button variant="secondary" className="mt-5 w-full" onClick={() => navigate(RoutePath.SANCTUARY_ARTICLE.replace(':pageType', 'people'))}>Open People room</Button></Surface>
            </aside>
          </section>
        </div>
      </PageContainer>

      <ModalSheet isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add relationship" description="Start with context. Details can wait." icon={<Tray size={20} weight="duotone" />} tone="sage" size="md">
        <form onSubmit={createRelationship} className="space-y-4">
          <Input name="name" label="Name" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} autoComplete="name" required autoFocus />
          <label className="block text-sm font-bold text-gray-nav">How you met<textarea name="howWeMet" value={draft.howWeMet} onChange={(event) => setDraft((current) => ({ ...current, howWeMet: event.target.value }))} className={`${fieldClass} min-h-24`} /></label>
          <label className="block text-sm font-bold text-gray-nav">What they care about<textarea name="caresAbout" value={draft.caresAbout} onChange={(event) => setDraft((current) => ({ ...current, caresAbout: event.target.value }))} className={`${fieldClass} min-h-24`} /></label>
          <div className="grid gap-3 sm:grid-cols-2"><Input name="domain" label="Domain" value={draft.domain} onChange={(event) => setDraft((current) => ({ ...current, domain: event.target.value }))} /><Input name="roleTag" label="Role" value={draft.roleTag} onChange={(event) => setDraft((current) => ({ ...current, roleTag: event.target.value }))} /></div>
          <Input name="hook" label="Human reason to reconnect (optional)" value={draft.hook} onChange={(event) => setDraft((current) => ({ ...current, hook: event.target.value }))} />
          <Button type="submit" variant="primary" className="w-full">Save relationship</Button>
        </form>
      </ModalSheet>
    </>
  );
};
