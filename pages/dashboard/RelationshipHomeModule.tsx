import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UsersThree } from '@phosphor-icons/react/UsersThree';
import { Plus } from '@phosphor-icons/react/Plus';
import { PencilSimple } from '@phosphor-icons/react/PencilSimple';

import { Surface } from '../../components/ui/Surface';
import { noteService } from '../../services/noteService';
import { relationshipService } from '../../services/relationshipService';
import { relationshipImportService } from '../../services/relationshipImportService';
import { writeAboutState } from '../../services/relationshipSuggestions';
import type { WeeklyRelationshipSuggestion } from '../../types';
import { RoutePath } from '../../types';

const relationshipPath = (id: string) =>
  RoutePath.RELATIONSHIP_DETAIL.replace(':id', encodeURIComponent(id));

export const RelationshipHomeModule: React.FC = () => {
  const [suggestions, setSuggestions] = useState<WeeklyRelationshipSuggestion[] | null>(null);
  const [pendingImports, setPendingImports] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [relationships, inbox, notes] = await Promise.all([
          relationshipService.getAll(),
          relationshipImportService.getImportInbox(),
          noteService.getAll().catch(() => []),
        ]);
        if (!isMounted) return;
        setSuggestions(relationshipService.buildWeeklySuggestions(relationships, notes).slice(0, 2));
        setPendingImports(inbox.filter((item) => item.status === 'pending').length);
      } catch {
        if (isMounted) {
          setSuggestions([]);
          setPendingImports(0);
        }
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  if (suggestions === null) return null;

  return (
    <Surface variant="flat" tone="sage" className="rounded-4xl p-6 sm:p-8">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-gray-nav">
          <UsersThree size={18} weight="duotone" className="text-green" />
          <h2 className="text-sm font-bold text-gray-nav">People on your mind</h2>
        </div>
        <Link to={RoutePath.RELATIONSHIPS} className="text-xs font-bold text-green hover:text-green-hover uppercase tracking-wider">
          All people
        </Link>
      </div>

      {suggestions.length > 0 ? (
        <ul className="divide-y divide-border/50">
          {suggestions.map((suggestion) => (
            <li key={suggestion.relationship.id} className="flex items-start gap-3 py-4">
              <Link to={relationshipPath(suggestion.relationship.id)} className="group min-w-0 flex-1">
                <span className="block text-base font-bold text-gray-text group-hover:text-green transition-colors">
                  {suggestion.relationship.name}
                </span>
                <span className="mt-1 block line-clamp-2 font-serif text-sm text-gray-light">
                  {suggestion.reason}
                </span>
              </Link>
              <Link
                to={RoutePath.CREATE_NOTE}
                state={writeAboutState(suggestion.relationship)}
                className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-green hover:bg-green/10"
                aria-label={`Write about ${suggestion.relationship.name}`}
              >
                <PencilSimple size={14} weight="bold" />
                Write
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="py-2 space-y-3">
          <p className="font-serif text-sm text-gray-light leading-relaxed">
            Add the people you write about. Reflections notices when they come up and brings them back gently.
          </p>
          <Link
            to={`${RoutePath.RELATIONSHIPS}?add=1`}
            className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-green hover:text-green/80 transition-colors"
          >
            <Plus size={14} weight="bold" className="shrink-0" />
            <span>Add someone</span>
          </Link>
        </div>
      )}

      {pendingImports > 0 ? (
        <Link to={RoutePath.RELATIONSHIPS} className="mt-2 block text-sm font-bold text-gray-nav hover:text-green">
          {pendingImports} imported {pendingImports === 1 ? 'person' : 'people'} waiting for review.
        </Link>
      ) : null}
    </Surface>
  );
};
