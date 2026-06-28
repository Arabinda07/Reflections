import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkle } from '@phosphor-icons/react/Sparkle';
import { UsersThree } from '@phosphor-icons/react/UsersThree';

import { Surface } from '../../components/ui/Surface';
import { relationshipService } from '../../services/relationshipService';
import { relationshipImportService } from '../../services/relationshipImportService';
import type { WeeklyRelationshipSuggestion } from '../../types';
import { RoutePath } from '../../types';

const relationshipPath = (id: string) =>
  RoutePath.RELATIONSHIP_DETAIL.replace(':id', encodeURIComponent(id));

export const RelationshipHomeModule: React.FC = () => {
  const [suggestions, setSuggestions] = useState<WeeklyRelationshipSuggestion[]>([]);
  const [pendingImports, setPendingImports] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const [relationships, inbox] = await Promise.all([
          relationshipService.getAll(),
          relationshipImportService.getImportInbox(),
        ]);
        if (!isMounted) return;
        setSuggestions(relationshipService.buildWeeklySuggestions(relationships).slice(0, 2));
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

  return (
    <Surface variant="flat" tone="sage" className="rounded-[2rem] p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-gray-nav">
          <UsersThree size={18} weight="duotone" className="text-green" />
          <p className="label-caps">Relationships</p>
        </div>
        <Link to={RoutePath.RELATIONSHIPS} className="label-caps text-green hover:text-green-hover">
          Open
        </Link>
      </div>

      {suggestions.length > 0 ? (
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <Link
              key={suggestion.relationship.id}
              to={relationshipPath(suggestion.relationship.id)}
              className="surface-inline-panel flex items-center justify-between gap-4 rounded-2xl p-4 text-left transition-colors hover:bg-green/10"
            >
              <span className="min-w-0">
                <span className="block text-base font-bold text-gray-text">{suggestion.relationship.name}</span>
                <span className="mt-1 block line-clamp-2 text-sm font-medium text-gray-light">
                  {suggestion.suggestedCare}
                </span>
              </span>
              <Sparkle size={18} weight="duotone" className="shrink-0 text-green" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-green/30 p-5">
          <p className="font-serif text-base italic text-gray-text">
            Add a few people, and you'll get a couple of gentle nudges each week to reach out.
          </p>
        </div>
      )}

      {pendingImports > 0 ? (
        <p className="mt-4 text-sm font-bold text-gray-nav">
          {pendingImports} imported {pendingImports === 1 ? 'person' : 'people'} waiting for review.
        </p>
      ) : null}
    </Surface>
  );
};
