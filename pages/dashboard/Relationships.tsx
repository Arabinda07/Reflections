import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AddressBook } from '@phosphor-icons/react/AddressBook';
import { CirclesThreePlus } from '@phosphor-icons/react/CirclesThreePlus';
import { ClockCounterClockwise } from '@phosphor-icons/react/ClockCounterClockwise';
import { ArrowLeft } from '@phosphor-icons/react/ArrowLeft';
import { ArrowUpRight } from '@phosphor-icons/react/ArrowUpRight';
import { Plus } from '@phosphor-icons/react/Plus';
import { Tray } from '@phosphor-icons/react/Tray';
import { User } from '@phosphor-icons/react/User';

import { Button } from '../../components/ui/Button';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { Input } from '../../components/ui/Input';
import { Check } from '@phosphor-icons/react/Check';
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

  useEffect(() => {
    if (searchParams.get('add') === '1' || searchParams.get('add') === 'true') {
      setIsCreateOpen(true);
      navigate(RoutePath.RELATIONSHIPS, { replace: true });
    }
  }, [searchParams, navigate]);

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
        autoOpenCatchUp={searchParams.get('catchup') === '1' || searchParams.get('catchup') === 'true'}
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
          <button
            onClick={() => navigate(RoutePath.DASHBOARD)}
            className="group flex items-center gap-2 text-sm font-bold text-gray-nav hover:text-green transition-[color,transform] duration-300 w-fit hover:-translate-x-1"
            aria-label="Back to home"
          >
            <ArrowLeft size={16} weight="bold" className="transition-transform group-hover:scale-110" />
            <span>Back</span>
          </button>
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
                      <div>
                        <h2 className="text-3xl font-display font-bold text-gray-text">Who to reach out to</h2>
                        <p className="mt-2 text-sm font-medium text-gray-light">A short list for this week. No pressure to clear it.</p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-gray-nav hover:text-green" onClick={() => setIsCreateOpen(true)}>
                        Add person<Plus size={16} weight="bold" className="ml-1.5" />
                      </Button>
                    </div>

                  {suggestions.length ? (
                    <div className="grid gap-4">
                      {suggestions.map((suggestion) => (
                        <article key={suggestion.relationship.id} className="rounded-[1.5rem] border border-green/12 bg-green/5 p-6 md:p-8 space-y-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <Link to={relationshipPath(suggestion.relationship.id)} className="text-2xl font-display font-bold text-gray-text hover:text-green transition-colors">
                                {suggestion.relationship.name}
                              </Link>
                              <p className="mt-1.5 text-base font-semibold leading-relaxed text-gray-light">
                                {suggestion.reason}
                              </p>
                            </div>
                          </div>

                          <div className="text-sm space-y-2 text-gray-light border-l border-green/20 pl-4 py-1">
                            {suggestion.suggestedHook?.description && (
                              <p>
                                <span className="font-semibold text-gray-text">Why: </span>
                                {suggestion.suggestedHook.description}
                              </p>
                            )}
                            <p>
                              <span className="font-semibold text-gray-text">Suggested step: </span>
                              {suggestion.suggestedCare}
                            </p>
                            <p className="text-xs text-gray-nav/80">
                              Last contact: {suggestion.lastInteraction ? new Date(suggestion.lastInteraction.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No contact yet'}
                            </p>
                          </div>

                          <div className="pt-2 flex flex-wrap items-center gap-3">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => navigate(`${relationshipPath(suggestion.relationship.id)}?catchup=1`)}
                            >
                              <Check size={16} weight="bold" className="mr-2" />
                              Log a catch-up
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-nav hover:text-green"
                              onClick={async () => {
                                try {
                                  const updated = await relationshipService.markTended(suggestion.relationship.id);
                                  setRelationships((current) => current.map((item) => item.id === updated.id ? updated : item));
                                  setHasPendingSync(await relationshipService.hasPendingSync());
                                  showToast(`Marked ${updated.name} as done for this week.`);
                                } catch {
                                  showToast("I couldn't save that. Nothing was lost — try again.");
                                }
                              }}
                            >
                              Mark done
                            </Button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : activePeople.length ? (
                    <div className="py-16 text-center max-w-md mx-auto space-y-2">
                      <h3 className="text-xl font-display font-bold text-gray-text">You're all caught up this week</h3>
                      <p className="text-sm font-medium text-gray-light leading-relaxed">Check back later — new nudges appear as time passes.</p>
                    </div>
                  ) : (
                    <div className="py-16 text-center max-w-md mx-auto space-y-5">
                      <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green/5 text-green">
                        <CirclesThreePlus size={24} weight="duotone" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-display font-bold text-gray-text">No people yet</h3>
                        <p className="text-sm font-medium text-gray-light leading-relaxed">Add the people who matter over in the People tab, and your weekly list will show up here.</p>
                      </div>
                      <Button variant="primary" className="mt-2" onClick={() => navigate(`${RoutePath.RELATIONSHIPS}?tab=people`)}>Go to People</Button>
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
                    <div className="space-y-1.5">
                      {activePeople.map((relationship) => (
                        <div key={relationship.id} className="flex min-h-20 items-center gap-2 px-2 py-4 rounded-xl transition-colors hover:bg-green/5">
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
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-2xl font-display font-bold text-gray-text">Never lose touch with someone who matters.</h3>
                        <p className="mt-2 max-w-prose text-sm font-medium text-gray-light">Add one name. Each week we&rsquo;ll point you toward someone worth a hello.</p>
                      </div>
                      <form onSubmit={addQuickName} className="space-y-3">
                        <input
                          value={quickName}
                          onChange={(event) => setQuickName(event.target.value)}
                          placeholder="Add a name…"
                          aria-label="Add a name"
                          className="input-surface w-full rounded-xl py-3 px-3.5 text-base font-medium"
                        />
                        <Button type="submit" variant="primary" size="sm" isLoading={isAddingName}>Add</Button>
                      </form>
                      <details className="group">
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
                    <div className="mt-6">
                      <button type="button" onClick={() => setShowArchived((value) => !value)} className="flex min-h-11 items-center gap-2 rounded-xl text-sm font-bold text-gray-nav focus-visible:ring-2 focus-visible:ring-green/30 hover:text-green">
                        {showArchived ? 'Hide' : 'Show'} archived ({archivedPeople.length})
                      </button>
                      {showArchived && (
                        <div className="mt-3 space-y-1.5">
                          {archivedPeople.map((relationship) => (
                            <div key={relationship.id} className="flex min-h-16 items-center gap-2 px-2 py-3 rounded-xl transition-colors hover:bg-green/5">
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
              <Surface variant="flat" tone="paper" className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green/10 text-green">
                    <ClockCounterClockwise size={15} weight="duotone" />
                  </span>
                  <h4 className="text-sm font-bold text-gray-text">This week</h4>
                </div>
                <div className="space-y-3 pt-1">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green/5 text-green">
                      <User size={16} weight="duotone" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-gray-text">
                        {suggestions.length === 1 ? '1 person suggested' : `${suggestions.length} people suggested`}
                      </p>
                      <p className="text-xs font-semibold text-gray-light">To keep in touch with</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${pendingInbox.length > 0 ? 'bg-sky/15 text-sky' : 'bg-green/5 text-gray-nav'}`}>
                      <Tray size={16} weight="duotone" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-gray-text">
                        {pendingInbox.length === 0 ? 'No imports waiting' : pendingInbox.length === 1 ? '1 import waiting' : `${pendingInbox.length} imports waiting`}
                      </p>
                      <p className="text-xs font-semibold text-gray-light">From contact books</p>
                    </div>
                  </div>
                </div>
              </Surface>
              <Surface variant="flat" tone="paper" className="p-6"><div className="flex items-center gap-2"><AddressBook size={18} weight="duotone" className="text-green" /><p className="label-caps text-gray-nav">Life Wiki</p></div><p className="mt-4 text-sm font-medium leading-relaxed text-gray-light">{wikiMentionCount > 0 ? `${wikiMentionCount} of your people ${wikiMentionCount === 1 ? 'appears' : 'appear'} in your People room. Open a profile to see what you've written and turn it into a reason to reach out.` : "Your People room holds what you've written about people. Names that match your relationships show up on their profiles."}</p><Link to={RoutePath.SANCTUARY_ARTICLE.replace(':pageType', 'people')} className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-green hover:text-green-hover transition-colors"><span>Open People room</span><ArrowUpRight size={14} weight="bold" /></Link></Surface>
            </aside>
          </section>
        </div>
      </PageContainer>

      <ModalSheet isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add someone" description="Just a name to start. You can add more on their profile." tone="sage" size="md">
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
