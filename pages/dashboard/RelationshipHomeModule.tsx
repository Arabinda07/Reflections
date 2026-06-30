import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkle } from '@phosphor-icons/react/Sparkle';
import { UsersThree } from '@phosphor-icons/react/UsersThree';
import { Plus } from '@phosphor-icons/react/Plus';

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
          <p className="text-sm font-bold text-gray-nav">Relationships</p>
        </div>
        <Link to={RoutePath.RELATIONSHIPS} className="text-xs font-bold text-green hover:text-green-hover uppercase tracking-wider">
          Open
        </Link>
      </div>

      {suggestions.length > 0 ? (
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <Link
              key={suggestion.relationship.id}
              to={relationshipPath(suggestion.relationship.id)}
              className="flex items-center justify-between gap-4 p-4 px-2 text-left rounded-xl transition-colors hover:bg-green/5 group"
            >
              <span className="min-w-0">
                <span className="block text-base font-bold text-gray-text group-hover:text-green transition-colors">{suggestion.relationship.name}</span>
                <span className="mt-1 block line-clamp-2 text-sm font-medium text-gray-light">
                  {suggestion.suggestedCare}
                </span>
              </span>
              <Sparkle size={18} weight="duotone" className="shrink-0 text-green" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-4 text-center space-y-4">
          <p className="font-serif text-sm text-gray-light leading-relaxed">
            Add a few people, and you'll get a couple of gentle nudges each week to reach out.
          </p>
          <div className="pt-1">
            <Link
              to={`${RoutePath.RELATIONSHIPS}?add=1`}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm font-bold text-green hover:text-green/80 transition-colors"
            >
              <Plus size={14} weight="bold" className="shrink-0" />
              <span>Add person</span>
            </Link>
          </div>
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
