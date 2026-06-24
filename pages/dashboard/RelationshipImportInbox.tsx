import React, { useState } from 'react';
import { Check, GoogleLogo, X } from '@phosphor-icons/react';

import { Button } from '../../components/ui/Button';
import { Surface } from '../../components/ui/Surface';
import { useToast } from '../../components/ui/Toast';
import { relationshipService } from '../../services/relationshipService';
import type { RelationshipHook, RelationshipImportInboxItem, RelationshipRecord, RelationshipStage, RelationshipTag } from '../../types';
import { relationshipStageLabels } from './RelationshipProfile';

type TriageDraft = {
  stage: RelationshipStage;
  closeness: number;
  energy: number;
  opportunity: number;
  domain: string;
  roleTag: string;
  context: string;
  hook: string;
};

const defaultDraft = (): TriageDraft => ({
  stage: 'discover',
  closeness: 3,
  energy: 3,
  opportunity: 3,
  domain: '',
  roleTag: '',
  context: '',
  hook: '',
});

const stages = Object.keys(relationshipStageLabels) as RelationshipStage[];
const fieldClass = 'min-h-12 w-full rounded-xl border border-border bg-panel px-3 py-3 text-base font-bold text-gray-text outline-none focus-visible:ring-2 focus-visible:ring-sky/30';

const additionsFor = (draft: TriageDraft) => {
  const tags: RelationshipTag[] = [];
  if (draft.domain.trim()) tags.push({ id: crypto.randomUUID(), category: 'domain', label: draft.domain.trim() });
  if (draft.roleTag.trim()) tags.push({ id: crypto.randomUUID(), category: 'role', label: draft.roleTag.trim() });
  if (draft.context.trim()) tags.push({ id: crypto.randomUUID(), category: 'context', label: draft.context.trim() });
  const hooks: RelationshipHook[] = draft.hook.trim() ? [{
    id: crypto.randomUUID(),
    description: draft.hook.trim(),
    source: 'import triage',
    createdAt: new Date().toISOString(),
    used: false,
  }] : [];
  return { tags, hooks };
};

type Props = {
  relationships: RelationshipRecord[];
  pendingInbox: RelationshipImportInboxItem[];
  onRefresh: () => Promise<void>;
};

export const RelationshipImportInbox: React.FC<Props> = ({ relationships, pendingInbox, onRefresh }) => {
  const { showToast } = useToast();
  const [drafts, setDrafts] = useState<Record<string, TriageDraft>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const canImport = relationshipService.canImportGoogleContacts();

  const draftFor = (id: string) => drafts[id] || defaultDraft();
  const updateDraft = (id: string, updates: Partial<TriageDraft>) => {
    setDrafts((current) => ({ ...current, [id]: { ...(current[id] || defaultDraft()), ...updates } }));
  };

  const run = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action();
      await onRefresh();
      showToast(success);
    } catch {
      showToast('Could not complete that import action. Nothing was discarded.');
    }
  };

  const importGoogle = async () => {
    setIsImporting(true);
    setNeedsReconnect(false);
    try {
      const result = await relationshipService.importGoogleContacts();
      if (result.unavailableOnDevice) return;
      if (result.needsReconnect) {
        setNeedsReconnect(true);
        showToast('Reconnect Google Contacts to grant read-only contact access.');
        return;
      }
      await onRefresh();
      showToast(`${result.imported} Google contacts moved into the import inbox.`);
    } catch {
      showToast('Google Contacts import failed.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Surface variant="flat" tone="sky" className="p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="label-caps text-sky">Import inbox</p>
          <h2 className="mt-2 text-3xl font-display font-bold text-gray-text">Review one by one</h2>
          <p className="mt-2 max-w-xl text-sm font-medium leading-relaxed text-gray-light">Imports wait here until you decide who belongs in your relationship system.</p>
        </div>
        {canImport ? (
          <div className="flex flex-wrap gap-2">
            {needsReconnect && <Button variant="secondary" onClick={() => void relationshipService.startGoogleContactsOAuth()}>Reconnect Google<GoogleLogo size={16} weight="bold" className="ml-2" /></Button>}
            <Button variant="primary" onClick={importGoogle} isLoading={isImporting}>Google import<GoogleLogo size={16} weight="bold" className="ml-2" /></Button>
          </div>
        ) : (
          <p className="max-w-xs text-sm font-bold text-gray-nav">Google Contacts import is available in the Reflections web app.</p>
        )}
      </div>

      <div className="grid gap-4">
        {pendingInbox.map((item) => {
          const draft = draftFor(item.id);
          const mergeTarget = relationships.find((relationship) => relationship.id === item.suggestedMergeRelationshipId);
          return (
            <form key={item.id} onSubmit={(event) => {
              event.preventDefault();
              const additions = additionsFor(draft);
              void run(() => relationshipService.acceptImportItem(item.id, {
                name: item.name,
                stage: draft.stage,
                closeness: draft.closeness,
                energy: draft.energy,
                opportunity: draft.opportunity,
                ...additions,
              }), `${item.name} added to Relationships.`);
            }} className="rounded-2xl border border-sky/20 bg-sky/5 p-4">
              <fieldset className="space-y-4">
                <legend className="w-full text-base font-bold text-gray-text">{item.name}</legend>
                <p className="text-sm font-medium text-gray-light">{[item.email, item.phone, item.company, item.role].filter(Boolean).join(' - ') || 'Minimal identity imported'}</p>
                {mergeTarget && <p className="text-sm font-bold text-honey">Possible match: {mergeTarget.name}. You choose whether to merge.</p>}

                <div className="grid gap-3 md:grid-cols-4">
                  <label className="text-sm font-bold text-gray-nav">Stage
                    <select name="stage" value={draft.stage} onChange={(event) => updateDraft(item.id, { stage: event.target.value as RelationshipStage })} className={`mt-2 ${fieldClass}`}>
                      {stages.map((stage) => <option key={stage} value={stage}>{relationshipStageLabels[stage]}</option>)}
                    </select>
                  </label>
                  {(['closeness', 'energy', 'opportunity'] as const).map((field) => (
                    <label key={field} className="text-sm font-bold capitalize text-gray-nav">{field} {draft[field]}/5
                      <input name={field} type="range" min={1} max={5} value={draft[field]} onChange={(event) => updateDraft(item.id, { [field]: Number(event.target.value) })} className="mt-4 w-full accent-sky" />
                    </label>
                  ))}
                </div>
                <div className="grid gap-3 md:grid-cols-4">
                  {([
                    ['domain', 'Domain'],
                    ['roleTag', 'Role'],
                    ['context', 'Context'],
                    ['hook', 'Human reason to reconnect'],
                  ] as const).map(([field, label]) => (
                    <label key={field} className="text-sm font-bold text-gray-nav">{label}
                      <input name={field} value={draft[field]} onChange={(event) => updateDraft(item.id, { [field]: event.target.value })} className={`mt-2 ${fieldClass}`} />
                    </label>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {mergeTarget && <Button type="button" variant="secondary" onClick={() => void run(() => relationshipService.mergeImportItem(item.id, mergeTarget.id, additionsFor(draft)), `${item.name} merged into ${mergeTarget.name}.`)}>Merge into {mergeTarget.name}</Button>}
                  <Button type="submit" variant="primary"><Check size={16} weight="bold" className="mr-2" />{mergeTarget ? 'Keep separate' : 'Add relationship'}</Button>
                  <Button type="button" variant="ghost" onClick={() => void run(() => relationshipService.archiveImportItem(item.id), `${item.name} archived.`)}><X size={16} weight="bold" className="mr-2" />Archive</Button>
                </div>
              </fieldset>
            </form>
          );
        })}
        {!pendingInbox.length && <p className="rounded-2xl border border-dashed border-sky/30 p-6 text-center text-sm font-medium text-gray-light">Import inbox is clear.</p>}
      </div>
    </Surface>
  );
};
