import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AddressBook } from '@phosphor-icons/react/AddressBook';
import { CirclesThreePlus } from '@phosphor-icons/react/CirclesThreePlus';
import { ClockCounterClockwise } from '@phosphor-icons/react/ClockCounterClockwise';
import { Plus } from '@phosphor-icons/react/Plus';
import { Tray } from '@phosphor-icons/react/Tray';
import { UserPlus } from '@phosphor-icons/react/UserPlus';

import { Button } from '../../components/ui/Button';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { Input } from '../../components/ui/Input';
import { MetadataPill } from '../../components/ui/MetadataPill';
import { ModalSheet } from '../../components/ui/ModalSheet';
import { PageContainer } from '../../components/ui/PageContainer';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Surface } from '../../components/ui/Surface';
import { useToast } from '../../components/ui/Toast';
import { relationshipService } from '../../services/relationshipService';
import { relationshipImportService } from '../../services/relationshipImportService';
import { countMentionedNames } from '../../services/relationshipWikiLink';
import { wikiService } from '../../services/wikiService';
import type { RelationshipImportInboxItem, RelationshipRecord } from '../../types';
import { RoutePath } from '../../types';
import { RelationshipImportInbox } from './RelationshipImportInbox';
import { RelationshipProfile, relationshipStageLabels, OverflowMenu } from './RelationshipProfile';

const relationshipPath = (id: string) => RoutePath.RELATIONSHIP_DETAIL.replace(':id', encodeURIComponent(id));
// input-surface carries the themed background/border/focus ring; bg-panel was an
// unregistered utility that left fields with the native (dark-mode) control bg.
const fieldClass = 'input-surface mt-2 min-h-12 w-full px-4 py-3 text-base font-medium';

const emptyDraft = { name: '', howWeMet: '' };
type Draft = typeof emptyDraft;

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
  const [seedNames, setSeedNames] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [isAddingName, setIsAddingName] = useState(false);
  const [hasPendingSync, setHasPendingSync] = useState(false);
  const [peopleWiki, setPeopleWiki] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<RelationshipRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const tab = searchParams.get('tab');
  const activeTab = tab === 'people' || tab === 'import' ? tab : 'weekly';
  const selectedRelationship = id ? relationships.find((relationship) => relationship.id === id) : undefined;
  const pendingInbox = useMemo(() => inbox.filter((item) => item.status === 'pending'), [inbox]);
  const activePeople = useMemo(() => relationships.filter((item) => item.stage !== 'archived'), [relationships]);
  const archivedPeople = useMemo(() => relationships.filter((item) => item.stage === 'archived'), [relationships]);
  const suggestions = useMemo(() => relationshipService.buildWeeklySuggestions(relationships), [relationships]);
  const wikiMentionCount = useMemo(
    () => countMentionedNames(peopleWiki, relationships.map((relationship) => relationship.name)),
    [peopleWiki, relationships],
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [nextRelationships, nextInbox] = await Promise.all([
        relationshipService.getAll(),
        relationshipImportService.getImportInbox(),
      ]);
      setRelationships(nextRelationships);
      setInbox(nextInbox);
      setHasPendingSync(await relationshipService.hasPendingSync());
    } catch {
      showToast("I couldn't load your people right now. Try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    let active = true;
    void wikiService.getWikiPage('people')
      .then((page) => { if (active) setPeopleWiki(page?.content || ''); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const createRelationship = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim()) return;
    try {
      const relationship = await relationshipService.create({
        name: draft.name.trim(),
        howWeMet: draft.howWeMet.trim() || undefined,
      });
      setRelationships((current) => [relationship, ...current]);
      setHasPendingSync(await relationshipService.hasPendingSync());
      setDraft(emptyDraft);
      setIsCreateOpen(false);
      navigate(relationshipPath(relationship.id));
    } catch {
      showToast("I couldn't add them. Nothing was lost — try again.");
    }
  };

  const addQuickName = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = quickName.trim();
    if (!name) return;
    setIsAddingName(true);
    try {
      const created = await relationshipService.create({ name });
      setRelationships((current) => [created, ...current]);
      setHasPendingSync(await relationshipService.hasPendingSync());
      setQuickName('');
      // First name added — land on the Weekly nudge (the value), not a second empty state.
      navigate(RoutePath.RELATIONSHIPS);
    } catch {
      showToast("I couldn't add them. Nothing was lost — try again.");
    } finally {
      setIsAddingName(false);
    }
  };

  const seedRelationships = async (event: React.FormEvent) => {
    event.preventDefault();
    const names = seedNames.split(/\r?\n/).map((name) => name.trim()).filter(Boolean).slice(0, 10);
    if (!names.length) return;
    setIsSeeding(true);
    try {
      const created = await Promise.all(names.map((name) => relationshipService.create({ name, stage: 'active' })));
      setRelationships((current) => [...created, ...current]);
      setHasPendingSync(await relationshipService.hasPendingSync());
      setSeedNames('');
      showToast(`Added ${created.length} ${created.length === 1 ? 'person' : 'people'}.`);
    } catch {
      showToast('Some people could not be added. Existing entries were kept.');
      await load();
    } finally {
      setIsSeeding(false);
    }
  };

  const archivePerson = async (person: RelationshipRecord) => {
    try {
      const updated = await relationshipService.archive(person.id);
      setRelationships((current) => current.map((item) => item.id === updated.id ? updated : item));
      setHasPendingSync(await relationshipService.hasPendingSync());
      showToast(`${person.name} archived.`);
    } catch {
      showToast("I couldn't archive them. Try again in a moment.");
    }
  };

  const unarchivePerson = async (person: RelationshipRecord) => {
    try {
      const updated = await relationshipService.unarchive(person.id);
      setRelationships((current) => current.map((item) => item.id === updated.id ? updated : item));
      setHasPendingSync(await relationshipService.hasPendingSync());
      showToast(`${person.name} restored.`);
    } catch {
      showToast("I couldn't restore them. Try again in a moment.");
    }
  };

  const deletePerson = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await relationshipService.remove(pendingDelete.id);
      setRelationships((current) => current.filter((item) => item.id !== pendingDelete.id));
      setHasPendingSync(await relationshipService.hasPendingSync());
      setPendingDelete(null);
    } catch {
      showToast("I couldn't delete them. Try again in a moment.");
    } finally {
      setIsDeleting(false);
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
        onDeleted={(deletedId) => {
          setRelationships((current) => current.filter((item) => item.id !== deletedId));
          void relationshipService.hasPendingSync().then(setHasPendingSync);
          navigate(RoutePath.RELATIONSHIPS);
        }}
      />
    );
  }

  return (
    <>
      <PageContainer className="surface-scope-sage page-wash pb-24 pt-6 md:pt-10">
        <div className="core-page-stack">
          <SectionHeader
            title="Relationships"
            description="A calm place to keep track of the people who matter, with a few reminders each week to reach out."
            actions={
              <nav aria-label="Relationship views" className="flex flex-wrap items-center gap-2">
                {([
                  ['weekly', 'Weekly'],
                  ['people', 'People'],
                ] as const).map(([key, label]) => (
                  <Link key={key} aria-current={activeTab === key ? 'page' : undefined} to={key === 'weekly' ? RoutePath.RELATIONSHIPS : `${RoutePath.RELATIONSHIPS}?tab=${key}`} className={`flex min-h-11 items-center rounded-xl px-4 text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:ring-green/30 ${activeTab === key ? 'bg-green text-on-accent' : 'border border-border bg-surface text-gray-nav hover:border-green/30 hover:text-green'}`}>{label}</Link>
                ))}
              </nav>
            }
          />
          {hasPendingSync && <p role="status" className="rounded-xl border border-honey/25 bg-honey/5 px-4 py-3 text-sm font-bold text-gray-nav">Saved securely on this device. Reflections will retry syncing.</p>}

          <section className="grid gap-5 lg:grid-cols-[1fr_20rem]">
            <div className="space-y-5">
              {activeTab === 'weekly' && (
                <Surface variant="bezel" tone="sage" innerClassName="p-6 md:p-8">
                  <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div><h2 className="text-3xl font-display font-bold text-gray-text">Who to reach out to</h2><p className="mt-2 text-sm font-medium text-gray-light">A short list for this week. No pressure to clear it.</p></div>
                    <Button variant="primary" onClick={() => setIsCreateOpen(true)}>Add person<Plus size={16} weight="bold" className="ml-2" /></Button>
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
                            <div><p className="label-caps text-gray-nav">Why reach out</p><p className="mt-1 text-sm font-bold text-gray-text">{suggestion.suggestedHook?.description || 'Nothing saved yet'}</p></div>
                            <div><p className="label-caps text-gray-nav">Last contact</p><p className="mt-1 text-sm font-bold text-gray-text">{suggestion.lastInteraction ? new Date(suggestion.lastInteraction.date).toLocaleDateString() : 'No contact yet'}</p></div>
                            <div><p className="label-caps text-gray-nav">Suggested step</p><p className="mt-1 text-sm font-bold text-gray-text">{suggestion.suggestedCare}</p></div>
                          </div>
                          <div className="mt-5 flex flex-wrap gap-2"><Button variant="secondary" size="sm" onClick={async () => {
                            try {
                              const updated = await relationshipService.markTended(suggestion.relationship.id);
                              setRelationships((current) => current.map((item) => item.id === updated.id ? updated : item));
                              setHasPendingSync(await relationshipService.hasPendingSync());
                              showToast(`Marked ${updated.name} as done for this week.`);
                            } catch {
                              showToast("I couldn't save that. Nothing was lost — try again.");
                            }
                          }}>Mark done</Button><Button variant="ghost" size="sm" onClick={() => navigate(relationshipPath(suggestion.relationship.id))}>Open profile</Button></div>
                        </article>
                      ))}
                    </div>
                  ) : activePeople.length ? (
                    <div className="rounded-[1.5rem] border-2 border-dashed border-green/20 p-8 text-center"><h3 className="text-2xl font-display font-bold text-gray-text">You're all caught up this week.</h3><p className="mt-2 text-sm font-medium text-gray-light">Check back later — new nudges appear as time passes.</p></div>
                  ) : (
                    <div className="rounded-[1.5rem] border-2 border-dashed border-green/20 p-8 text-center">
                      <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-green/10 text-green"><CirclesThreePlus size={28} weight="duotone" /></div>
                      <h3 className="mt-4 text-2xl font-display font-bold text-gray-text">No people yet.</h3>
                      <p className="mt-2 text-sm font-medium text-gray-light">Add the people who matter over in the People tab, and your weekly list will show up here.</p>
                      <Button variant="secondary" className="mt-5" onClick={() => navigate(`${RoutePath.RELATIONSHIPS}?tab=people`)}>Go to People</Button>
                    </div>
                  )}
                </Surface>
              )}

              {activeTab === 'people' && (
                <Surface variant="flat" tone="paper" className="p-6 md:p-8">
                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-3xl font-display font-bold text-gray-text">People library</h2>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={() => navigate(`${RoutePath.RELATIONSHIPS}?tab=import`)}>Import<Tray size={16} weight="bold" className="ml-2" /></Button>
                      <Button variant="primary" onClick={() => setIsCreateOpen(true)}>Add<Plus size={16} weight="bold" className="ml-2" /></Button>
                    </div>
                  </div>
                  {pendingInbox.length > 0 && (
                    <Link to={`${RoutePath.RELATIONSHIPS}?tab=import`} className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-sky/25 bg-sky/5 px-4 py-3 text-sm font-bold text-gray-nav focus-visible:ring-2 focus-visible:ring-sky/30 hover:border-sky/40">
                      <span>{pendingInbox.length} {pendingInbox.length === 1 ? 'import' : 'imports'} waiting to review</span>
                      <span className="text-sky">Review</span>
                    </Link>
                  )}
                  {activePeople.length ? (
                    <div className="grid gap-3">
                      {activePeople.map((relationship) => (
                        <div key={relationship.id} className="flex min-h-20 items-center gap-2 rounded-2xl border border-border/70 p-4 hover:border-green/25 hover:bg-green/5">
                          <Link to={relationshipPath(relationship.id)} className="min-w-0 flex-1 rounded-xl focus-visible:ring-2 focus-visible:ring-green/30">
                            <span className="block text-base font-bold text-gray-text">{relationship.name}</span>
                            <span className="mt-1 block truncate text-sm font-medium text-gray-light">{relationship.role || relationship.company || relationship.howWeMet || 'No details yet'}</span>
                          </Link>
                          <OverflowMenu items={[
                            { label: 'Archive', onClick: () => void archivePerson(relationship) },
                            { label: 'Delete…', onClick: () => setPendingDelete(relationship), danger: true },
                          ]} />
                        </div>
                      ))}
                    </div>
                  ) : !isLoading ? (
                    <div className="rounded-[1.5rem] border-2 border-dashed border-green/20 p-6 md:p-8">
                      <h3 className="text-2xl font-display font-bold text-gray-text">Never lose touch with someone who matters.</h3>
                      <p className="mt-2 max-w-prose text-sm font-medium text-gray-light">Add one name. Each week we&rsquo;ll point you toward someone worth a hello — no scores, no streaks.</p>
                      <form onSubmit={addQuickName} className="relative mt-6">
                        <input
                          autoFocus
                          value={quickName}
                          onChange={(event) => setQuickName(event.target.value)}
                          placeholder="Add a name…"
                          aria-label="Add a name"
                          className="input-surface w-full rounded-xl py-3 pl-3.5 pr-24 text-base font-medium"
                        />
                        <Button type="submit" variant="primary" size="sm" isLoading={isAddingName} className="absolute right-1.5 top-1/2 -translate-y-1/2">Add</Button>
                      </form>
                      <details className="group mt-4">
                        <summary className="inline-flex min-h-9 cursor-pointer list-none items-center text-sm font-bold text-gray-nav focus-visible:ring-2 focus-visible:ring-green/30 hover:text-green [&::-webkit-details-marker]:hidden">or paste a few names</summary>
                        <form onSubmit={seedRelationships} className="mt-3">
                          <label className="block text-sm font-bold text-gray-nav">One name per line.
                            <textarea name="seedNames" value={seedNames} onChange={(event) => setSeedNames(event.target.value)} className={`${fieldClass} min-h-32`} placeholder={'Priya Nair\nArjun Mehta\nMeera Iyer'} />
                          </label>
                          <Button type="submit" variant="secondary" className="mt-4" isLoading={isSeeding}>Add people</Button>
                        </form>
                      </details>
                    </div>
                  ) : null}

                  {archivedPeople.length > 0 && (
                    <div className="mt-6 border-t border-border/60 pt-5">
                      <button type="button" onClick={() => setShowArchived((value) => !value)} className="flex min-h-11 items-center gap-2 rounded-xl text-sm font-bold text-gray-nav focus-visible:ring-2 focus-visible:ring-green/30 hover:text-green">
                        {showArchived ? 'Hide' : 'Show'} archived ({archivedPeople.length})
                      </button>
                      {showArchived && (
                        <div className="mt-3 grid gap-3">
                          {archivedPeople.map((relationship) => (
                            <div key={relationship.id} className="flex min-h-16 items-center gap-2 rounded-2xl border border-border/60 bg-surface-muted/40 p-4">
                              <Link to={relationshipPath(relationship.id)} className="min-w-0 flex-1 truncate text-sm font-bold text-gray-text hover:text-green">{relationship.name}</Link>
                              <Button variant="secondary" size="sm" onClick={() => void unarchivePerson(relationship)}>Restore</Button>
                              <OverflowMenu items={[{ label: 'Delete…', onClick: () => setPendingDelete(relationship), danger: true }]} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Surface>
              )}

              {activeTab === 'import' && <RelationshipImportInbox relationships={relationships} pendingInbox={pendingInbox} onRefresh={load} />}
            </div>

            <aside className="space-y-5">
              <Surface variant="flat" tone="paper" className="p-6"><div className="flex items-center gap-2"><ClockCounterClockwise size={18} weight="duotone" className="text-green" /><p className="label-caps text-gray-nav">This week</p></div><div className="mt-5 grid gap-4"><div><p className="text-3xl font-display font-bold text-gray-text">{suggestions.length}</p><p className="text-sm font-bold text-gray-nav">people suggested</p></div><div><p className="text-3xl font-display font-bold text-gray-text">{pendingInbox.length}</p><p className="text-sm font-bold text-gray-nav">imports waiting</p></div></div></Surface>
              <Surface variant="flat" tone="paper" className="p-6"><div className="flex items-center gap-2"><AddressBook size={18} weight="duotone" className="text-green" /><p className="label-caps text-gray-nav">Life Wiki</p></div><p className="mt-4 text-sm font-medium leading-relaxed text-gray-light">{wikiMentionCount > 0 ? `${wikiMentionCount} of your people ${wikiMentionCount === 1 ? 'appears' : 'appear'} in your People room. Open a profile to see what you've written and turn it into a reason to reach out.` : "Your People room holds what you've written about people. Names that match your relationships show up on their profiles."}</p><Button variant="secondary" className="mt-5 w-full" onClick={() => navigate(RoutePath.SANCTUARY_ARTICLE.replace(':pageType', 'people'))}>Open People room</Button></Surface>
            </aside>
          </section>
        </div>
      </PageContainer>

      <ModalSheet isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add someone" description="Just a name to start. You can add more on their profile." icon={<UserPlus size={20} weight="duotone" />} tone="sage" size="md">
        <form onSubmit={createRelationship} className="space-y-4">
          <Input name="name" label="Name" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} autoComplete="name" required autoFocus />
          <label className="block text-sm font-bold text-gray-nav">How you know them (optional)<textarea name="howWeMet" value={draft.howWeMet} onChange={(event) => setDraft((current) => ({ ...current, howWeMet: event.target.value }))} className={`${fieldClass} min-h-24`} /></label>
          <Button type="submit" variant="primary" className="w-full">Add</Button>
        </form>
      </ModalSheet>

      <ConfirmationDialog
        isOpen={Boolean(pendingDelete)}
        onClose={() => { if (!isDeleting) setPendingDelete(null); }}
        onConfirm={() => void deletePerson()}
        variant="danger"
        title={pendingDelete ? `Delete ${pendingDelete.name}?` : 'Delete this person?'}
        description="This removes their notes, catch-ups, reasons to reconnect and reminders. This can't be undone."
        confirmLabel="Delete"
        isConfirming={isDeleting}
      />
    </>
  );
};
