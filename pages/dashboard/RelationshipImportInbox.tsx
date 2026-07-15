import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AddressBook } from '@phosphor-icons/react/AddressBook';
import { Check } from '@phosphor-icons/react/Check';
import { GoogleLogo } from '@phosphor-icons/react/GoogleLogo';
import { Tray } from '@phosphor-icons/react/Tray';
import { X } from '@phosphor-icons/react/X';

import { Button } from '../../components/ui/Button';
import { Surface } from '../../components/ui/Surface';
import { useToast } from '../../components/ui/Toast';
import { relationshipImportService } from '../../services/relationshipImportService';
import { googleContactsImportService } from '../../services/googleContactsImportService';
import type { RelationshipHook, RelationshipImportInboxItem, RelationshipRecord, RelationshipStage, RelationshipTag } from '../../types';
import { RoutePath } from '../../types';
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
// input-surface carries the themed background/border/focus ring; bg-panel was an
// unregistered utility that left fields with the native (dark-mode) control bg.
const fieldClass = 'input-surface min-h-12 w-full px-3 py-3 text-base font-medium';

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
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [drafts, setDrafts] = useState<Record<string, TriageDraft>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const canImport = googleContactsImportService.canImportGoogleContacts();

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
      showToast("I couldn't finish that. Nothing was deleted — try again.");
    }
  };

  const importGoogle = async () => {
    setIsImporting(true);
    setNeedsReconnect(false);
    try {
      const result = await googleContactsImportService.importGoogleContacts();
      if (result.unavailableOnDevice) return;
      if (result.needsReconnect) {
        setNeedsReconnect(true);
        showToast('Reconnect Google Contacts to grant read-only contact access.');
        return;
      }
      await onRefresh();
      showToast(`${result.imported} Google contacts moved into the import inbox.`);
    } catch {
      showToast("I couldn't import from Google Contacts. Try again in a moment.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Surface variant="flat" tone="sage" className="p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-gray-text">Bulk Import</h2>
          <p className="mt-2 max-w-xl text-sm font-medium leading-relaxed text-gray-light">Import your contacts from Google to avoid typing them manually. They will appear here for you to organize and add to your circle.</p>
        </div>
        {canImport ? (
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button variant="secondary" onClick={() => navigate(`${RoutePath.RELATIONSHIPS}?tab=people`)}>
              Library
              <AddressBook size={16} weight="bold" className="ml-2" />
            </Button>
            {needsReconnect && <Button variant="secondary" onClick={() => void googleContactsImportService.startGoogleContactsOAuth()}>Reconnect<GoogleLogo size={16} weight="bold" className="ml-2" /></Button>}
            <Button variant="primary" onClick={importGoogle} isLoading={isImporting}>Import<GoogleLogo size={16} weight="bold" className="ml-2" /></Button>
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
              void run(() => relationshipImportService.acceptImportItem(item.id, {
                name: item.name,
                stage: draft.stage,
                closeness: draft.closeness,
                energy: draft.energy,
                opportunity: draft.opportunity,
                ...additions,
              }), `Added ${item.name}.`);
            }} className="rounded-2xl border border-green/20 bg-green/5 p-4">
              <fieldset className="space-y-4">
                <legend className="w-full text-base font-bold text-gray-text">{item.name}</legend>
                <p className="text-sm font-medium text-gray-light">{[item.email, item.phone, item.company, item.role].filter(Boolean).join(' - ') || 'Minimal identity imported'}</p>
                {mergeTarget && <p className="text-sm font-bold text-honey">Possible match: {mergeTarget.name}. You choose whether to combine them.</p>}

                <div className="grid gap-3 md:grid-cols-4">
                  <label className="text-sm font-bold text-gray-nav">Stage
                    <select name="stage" value={draft.stage} onChange={(event) => updateDraft(item.id, { stage: event.target.value as RelationshipStage })} className={`mt-2 ${fieldClass}`}>
                      {stages.map((stage) => <option key={stage} value={stage}>{relationshipStageLabels[stage]}</option>)}
                    </select>
                  </label>
                  {(['closeness', 'energy', 'opportunity'] as const).map((field) => (
                    <label key={field} className="text-sm font-bold capitalize text-gray-nav">{field} {draft[field]}/5
                      <input name={field} type="range" min={1} max={5} value={draft[field]} onChange={(event) => updateDraft(item.id, { [field]: Number(event.target.value) })} className="mt-4 w-full accent-green" />
                    </label>
                  ))}
                </div>
                <div className="grid gap-3 md:grid-cols-4">
                  {([
                    ['domain', 'Domain'],
                    ['roleTag', 'Role'],
                    ['context', 'Context'],
                    ['hook', 'Reason to reconnect'],
                  ] as const).map(([field, label]) => (
                    <label key={field} className="text-sm font-bold text-gray-nav">{label}
                      <input name={field} value={draft[field]} onChange={(event) => updateDraft(item.id, { [field]: event.target.value })} className={`mt-2 ${fieldClass}`} />
                    </label>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {mergeTarget && <Button type="button" variant="secondary" onClick={() => void run(() => relationshipImportService.mergeImportItem(item.id, mergeTarget.id, additionsFor(draft)), `Combined ${item.name} with ${mergeTarget.name}.`)}>Combine with {mergeTarget.name}</Button>}
                  <Button type="submit" variant="primary"><Check size={16} weight="bold" className="mr-2" />{mergeTarget ? 'Add as new' : 'Add person'}</Button>
                  <Button type="button" variant="ghost" onClick={() => void run(() => relationshipImportService.archiveImportItem(item.id), `${item.name} archived.`)}><X size={16} weight="bold" className="mr-2" />Archive</Button>
                </div>
              </fieldset>
            </form>
          );
        })}
        {!pendingInbox.length && (
          <div className="py-12 text-center max-w-md mx-auto space-y-4">
            <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green/5 text-green">
              <Tray size={24} weight="duotone" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-display font-bold text-gray-text">Your import inbox is clear</h3>
              <p className="text-sm font-medium text-gray-light leading-relaxed">Use the Google import button above to bring in your contacts without manual typing.</p>
            </div>
          </div>
        )}
      </div>
    </Surface>
  );
};
