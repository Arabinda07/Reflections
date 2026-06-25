import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react/ArrowLeft';
import { Check } from '@phosphor-icons/react/Check';

import { Button } from '../../components/ui/Button';
import { MetadataPill } from '../../components/ui/MetadataPill';
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
  RelationshipTier,
  RelationshipValueEntry,
} from '../../types';
import { RoutePath } from '../../types';

export const relationshipStageLabels: Record<RelationshipStage, string> = {
  discover: 'Discover',
  acquaintance: 'Acquaintance',
  active: 'Active',
  trusted: 'Trusted',
  dormant: 'Dormant',
  archived: 'Archived',
};

const stages = Object.keys(relationshipStageLabels) as RelationshipStage[];
const tiers: RelationshipTier[] = ['none', 't1', 't2', 't3'];
// input-surface carries the themed background/border/focus ring; bg-panel was an
// unregistered utility that left fields with the native (dark-mode) control bg.
const fieldClass = 'input-surface mt-2 min-h-12 w-full px-3 py-3 text-base font-medium';

type Props = {
  relationship: RelationshipRecord;
  relationships: RelationshipRecord[];
  onBack: () => void;
  onChanged: (relationship: RelationshipRecord) => void;
};

export const RelationshipProfile: React.FC<Props> = ({ relationship, relationships, onBack, onChanged }) => {
  const { showToast } = useToast();
  const [context, setContext] = useState({
    name: relationship.name,
    stage: relationship.stage,
    tier: relationship.tier,
    closeness: relationship.closeness,
    energy: relationship.energy,
    opportunity: relationship.opportunity,
    howWeMet: relationship.howWeMet || '',
    caresAbout: relationship.caresAbout || '',
  });
  const [hook, setHook] = useState('');
  const [interaction, setInteraction] = useState({ channel: 'email', notes: '' });
  const [nextCare, setNextCare] = useState('');
  const [valueEntry, setValueEntry] = useState({ direction: 'given', category: 'support', description: '' });
  const [connection, setConnection] = useState({ relatedRelationshipId: '', label: '' });
  const [isSavingContext, setIsSavingContext] = useState(false);
  const [wikiMentions, setWikiMentions] = useState<string[]>([]);

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
      stage: relationship.stage,
      tier: relationship.tier,
      closeness: relationship.closeness,
      energy: relationship.energy,
      opportunity: relationship.opportunity,
      howWeMet: relationship.howWeMet || '',
      caresAbout: relationship.caresAbout || '',
    });
  }, [relationship.id]);

  const update = async (updates: Partial<RelationshipRecord>, success?: string) => {
    try {
      const updated = await relationshipService.update(relationship.id, updates);
      onChanged(updated);
      if (success) showToast(success);
      return updated;
    } catch {
      showToast('Could not save that change. Your existing relationship memory is unchanged.');
      return undefined;
    }
  };

  const saveContext = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!context.name.trim()) return;
    setIsSavingContext(true);
    await update({
      ...context,
      name: context.name.trim(),
      howWeMet: context.howWeMet.trim() || undefined,
      caresAbout: context.caresAbout.trim() || undefined,
    }, 'Relationship context saved.');
    setIsSavingContext(false);
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

  const addInteraction = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!interaction.notes.trim()) return;
    const interactions: RelationshipInteraction[] = [...relationship.interactions, {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      channel: interaction.channel as RelationshipInteraction['channel'],
      notes: interaction.notes.trim(),
      direction: 'mutual',
    }];
    if (await update({ interactions })) setInteraction({ channel: 'email', notes: '' });
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

  const addValueEntry = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!valueEntry.description.trim()) return;
    const valueLedger: RelationshipValueEntry[] = [...relationship.valueLedger, {
      id: crypto.randomUUID(),
      direction: valueEntry.direction as RelationshipValueEntry['direction'],
      category: valueEntry.category as RelationshipValueEntry['category'],
      description: valueEntry.description.trim(),
      createdAt: new Date().toISOString(),
    }];
    if (await update({ valueLedger })) setValueEntry({ direction: 'given', category: 'support', description: '' });
  };

  const addConnection = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!connection.relatedRelationshipId || !connection.label.trim()) return;
    const connections = [...relationship.connections, {
      id: crypto.randomUUID(),
      relatedRelationshipId: connection.relatedRelationshipId,
      label: connection.label.trim(),
    }];
    if (await update({ connections })) setConnection({ relatedRelationshipId: '', label: '' });
  };

  return (
    <PageContainer className="surface-scope-sage page-wash pb-24 pt-6 md:pt-10">
      <button type="button" onClick={onBack} className="mb-8 flex min-h-12 w-fit items-center gap-2 rounded-xl px-3 text-sm font-bold text-gray-nav focus-visible:ring-2 focus-visible:ring-green/30 hover:bg-green/5 hover:text-green">
        <ArrowLeft size={16} weight="bold" /> Back
      </button>

      <article className="space-y-7">
        <header className="flex max-w-4xl flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-4">
            <MetadataPill tone="green">{relationshipStageLabels[relationship.stage]}</MetadataPill>
            <h1 className="text-4xl font-display font-extrabold text-gray-text sm:text-5xl md:text-6xl">{relationship.name}</h1>
            <p className="text-lg leading-relaxed text-gray-light">
              {relationship.caresAbout || relationship.howWeMet || 'Relationship context will gather here.'}
            </p>
          </div>
          <Button variant="secondary" onClick={async () => {
            try {
              onChanged(await relationshipService.markTended(relationship.id));
              showToast('Marked as tended this week.');
            } catch {
              showToast('Could not mark this relationship as tended.');
            }
          }}>
            <Check size={16} weight="bold" className="mr-2" /> Mark tended
          </Button>
        </header>

        <form onSubmit={saveContext} className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <Surface variant="flat" tone="sage" className="p-6 md:p-8">
            <fieldset className="space-y-6">
              <legend className="label-caps text-green">Relationship context</legend>
              <label className="block text-sm font-bold text-gray-nav">Name
                <input name="name" value={context.name} required autoComplete="name" onChange={(event) => setContext((current) => ({ ...current, name: event.target.value }))} className={fieldClass} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-bold text-gray-nav">Stage
                  <select name="stage" value={context.stage} onChange={(event) => setContext((current) => ({ ...current, stage: event.target.value as RelationshipStage }))} className={fieldClass}>
                    {stages.map((stage) => <option key={stage} value={stage}>{relationshipStageLabels[stage]}</option>)}
                  </select>
                </label>
                <label className="text-sm font-bold text-gray-nav">Tier
                  <select name="tier" value={context.tier} onChange={(event) => setContext((current) => ({ ...current, tier: event.target.value as RelationshipTier }))} className={fieldClass}>
                    {tiers.map((tier) => <option key={tier} value={tier}>{tier.toUpperCase()}</option>)}
                  </select>
                </label>
              </div>
              <div className="grid gap-5 md:grid-cols-3">
                {(['closeness', 'energy', 'opportunity'] as const).map((field) => (
                  <label key={field} className="border-t border-border/60 pt-4 text-sm font-bold capitalize text-gray-nav">
                    {field} {context[field]}/5
                    <input name={field} type="range" min={1} max={5} value={context[field]} onChange={(event) => setContext((current) => ({ ...current, [field]: Number(event.target.value) }))} className="mt-3 w-full accent-green" />
                  </label>
                ))}
              </div>
              <label className="block text-sm font-bold text-gray-nav">How you met
                <textarea name="howWeMet" value={context.howWeMet} onChange={(event) => setContext((current) => ({ ...current, howWeMet: event.target.value }))} className={`${fieldClass} min-h-24 font-medium`} />
              </label>
              <label className="block text-sm font-bold text-gray-nav">What they care about
                <textarea name="caresAbout" value={context.caresAbout} onChange={(event) => setContext((current) => ({ ...current, caresAbout: event.target.value }))} className={`${fieldClass} min-h-24 font-medium`} />
              </label>
              <Button type="submit" variant="primary" isLoading={isSavingContext}>Save context</Button>
            </fieldset>
          </Surface>

          <Surface variant="flat" tone="paper" className="p-6 md:p-8">
            <h2 className="label-caps text-green">Details</h2>
            <dl className="mt-5 space-y-3 text-sm font-medium text-gray-light">
              <div><dt className="font-bold text-gray-nav">Email</dt><dd>{relationship.email || 'Not set'}</dd></div>
              <div><dt className="font-bold text-gray-nav">Phone</dt><dd>{relationship.phone || 'Not set'}</dd></div>
              <div><dt className="font-bold text-gray-nav">Role</dt><dd>{relationship.role || 'Not set'}</dd></div>
              <div><dt className="font-bold text-gray-nav">Company</dt><dd>{relationship.company || 'Not set'}</dd></div>
            </dl>
          </Surface>
        </form>

        <Surface variant="flat" tone="paper" className="p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="label-caps text-green">From your Life Wiki</h2>
            <Link to={RoutePath.SANCTUARY_ARTICLE.replace(':pageType', 'people')} className="text-sm font-bold text-green hover:underline">Open People room</Link>
          </div>
          {wikiMentions.length ? (
            <div className="mt-5 space-y-3">
              {wikiMentions.map((snippet, index) => (
                <div key={index} className="rounded-2xl border border-green/20 bg-green/5 p-4">
                  <p className="text-sm font-medium leading-relaxed text-gray-text">{snippet}</p>
                  <Button type="button" size="sm" variant="secondary" className="mt-3" onClick={() => void saveSnippetAsHook(snippet)}>Save as a reason to reconnect</Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm font-medium leading-relaxed text-gray-light">Nothing about {relationship.name} in your People room yet. As you write and refresh the Life Wiki, mentions show up here.</p>
          )}
        </Surface>

        <section className="grid gap-5 lg:grid-cols-3">
          <Surface variant="flat" tone="paper" className="p-6">
            <h2 className="label-caps text-green">Hooks</h2>
            <div className="mt-4 space-y-3">
              {relationship.hooks.map((item) => (
                <button key={item.id} type="button" disabled={item.used} onClick={() => void update({ hooks: relationship.hooks.map((candidate) => candidate.id === item.id ? { ...candidate, used: true } : candidate) })} className="min-h-12 w-full rounded-2xl border border-green/20 p-4 text-left focus-visible:ring-2 focus-visible:ring-green/40 disabled:opacity-50 hover:bg-green/5">
                  <span className="block text-sm font-bold text-gray-text">{item.description}</span>
                  <span className="mt-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-nav">{item.used ? 'Used' : 'Mark used'} - {item.source}</span>
                </button>
              ))}
              {!relationship.hooks.length && <p className="text-sm font-medium text-gray-light">No hooks yet.</p>}
              <form onSubmit={addHook} className="space-y-2">
                <label className="block text-sm font-bold text-gray-nav">New hook
                  <input name="hook" value={hook} onChange={(event) => setHook(event.target.value)} className={fieldClass} />
                </label>
                <Button type="submit" size="sm" variant="secondary">Add hook</Button>
              </form>
            </div>
          </Surface>

          <Surface variant="flat" tone="paper" className="p-6">
            <h2 className="label-caps text-green">Timeline</h2>
            <div className="mt-4 space-y-3">
              {relationship.interactions.map((item) => <div key={item.id} className="rounded-2xl border border-green/20 p-4"><p className="text-sm font-bold text-gray-text">{item.channel}</p><p className="mt-1 text-sm font-medium text-gray-light">{item.notes}</p></div>)}
              {!relationship.interactions.length && <p className="text-sm font-medium text-gray-light">No touchpoints yet.</p>}
              <form onSubmit={addInteraction} className="space-y-2">
                <label className="block text-sm font-bold text-gray-nav">Channel
                  <select name="channel" value={interaction.channel} onChange={(event) => setInteraction((current) => ({ ...current, channel: event.target.value }))} className={fieldClass}>
                    {['email', 'linkedin', 'coffee', 'phone', 'event', 'introduction', 'other'].map((channel) => <option key={channel}>{channel}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-bold text-gray-nav">Touchpoint notes
                  <textarea name="notes" value={interaction.notes} onChange={(event) => setInteraction((current) => ({ ...current, notes: event.target.value }))} className={`${fieldClass} min-h-20 font-medium`} />
                </label>
                <Button type="submit" size="sm" variant="secondary">Add touchpoint</Button>
              </form>
            </div>
          </Surface>

          <Surface variant="flat" tone="paper" className="p-6">
            <h2 className="label-caps text-green">Value ledger</h2>
            <div className="mt-4 space-y-3">
              {relationship.valueLedger.map((item) => <div key={item.id} className="rounded-2xl border border-border/60 p-4"><p className="text-sm font-bold text-gray-text">{item.direction === 'given' ? 'Given' : 'Received'} - {item.category}</p><p className="mt-1 text-sm font-medium text-gray-light">{item.description}</p></div>)}
              {!relationship.valueLedger.length && <p className="text-sm font-medium text-gray-light">No ledger entries yet.</p>}
              <form onSubmit={addValueEntry} className="space-y-2">
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="text-sm font-bold text-gray-nav">Direction<select name="direction" value={valueEntry.direction} onChange={(event) => setValueEntry((current) => ({ ...current, direction: event.target.value }))} className={fieldClass}><option value="given">Given</option><option value="received">Received</option></select></label>
                  <label className="text-sm font-bold text-gray-nav">Category<select name="category" value={valueEntry.category} onChange={(event) => setValueEntry((current) => ({ ...current, category: event.target.value }))} className={fieldClass}>{['introduction', 'opportunity', 'advice', 'knowledge', 'support', 'other'].map((category) => <option key={category}>{category}</option>)}</select></label>
                </div>
                <label className="block text-sm font-bold text-gray-nav">Description<input name="description" value={valueEntry.description} onChange={(event) => setValueEntry((current) => ({ ...current, description: event.target.value }))} className={fieldClass} /></label>
                <Button type="submit" size="sm" variant="secondary">Add entry</Button>
              </form>
            </div>
          </Surface>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <Surface variant="flat" tone="sage" className="p-6">
            <h2 className="label-caps text-green">Next care</h2>
            <div className="mt-4 space-y-3">
              {relationship.nextCare.map((item) => <button key={item.id} type="button" disabled={item.status === 'done'} onClick={() => void update({ nextCare: relationship.nextCare.map((candidate) => candidate.id === item.id ? { ...candidate, status: 'done' as const } : candidate) })} className="min-h-12 w-full rounded-2xl border border-green/20 p-4 text-left focus-visible:ring-2 focus-visible:ring-green/30 disabled:opacity-50 hover:bg-green/5"><span className="block text-sm font-bold text-gray-text">{item.label}</span><span className="mt-1 block text-xs font-black uppercase tracking-[0.14em] text-gray-nav">{item.status}</span></button>)}
              <form onSubmit={addNextCare} className="space-y-2"><label className="block text-sm font-bold text-gray-nav">New act of care<input name="nextCare" value={nextCare} onChange={(event) => setNextCare(event.target.value)} className={fieldClass} /></label><Button type="submit" size="sm" variant="secondary">Add care</Button></form>
            </div>
          </Surface>

          <Surface variant="flat" tone="paper" className="p-6">
            <h2 className="label-caps text-green">Connections</h2>
            <div className="mt-4 space-y-3">
              {relationship.connections.map((item) => <div key={item.id} className="rounded-2xl border border-green/20 p-4"><p className="text-sm font-bold text-gray-text">{relationships.find((candidate) => candidate.id === item.relatedRelationshipId)?.name || 'Unknown person'}</p><p className="mt-1 text-sm font-medium text-gray-light">{item.label}</p></div>)}
              {!relationship.connections.length && <p className="text-sm font-medium text-gray-light">No person-to-person connections yet.</p>}
              <form onSubmit={addConnection} className="space-y-2">
                <label className="block text-sm font-bold text-gray-nav">Person
                  <select name="relatedRelationshipId" required value={connection.relatedRelationshipId} onChange={(event) => setConnection((current) => ({ ...current, relatedRelationshipId: event.target.value }))} className={fieldClass}>
                    <option value="">Choose a person</option>
                    {relationships.filter((candidate) => candidate.id !== relationship.id).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-bold text-gray-nav">How they know each other<input name="connectionLabel" required value={connection.label} onChange={(event) => setConnection((current) => ({ ...current, label: event.target.value }))} className={fieldClass} /></label>
                <Button type="submit" size="sm" variant="secondary">Add connection</Button>
              </form>
            </div>
          </Surface>
        </section>
      </article>
    </PageContainer>
  );
};
