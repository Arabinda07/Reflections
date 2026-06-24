import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from '@phosphor-icons/react/Heart';
import { Sparkle } from '@phosphor-icons/react/Sparkle';

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
    <Surface variant="flat" tone="honey" className="rounded-[2.5rem] p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-gray-nav">
          <Heart size={18} weight="duotone" className="text-honey" />
          <p className="label-caps">Relationships</p>
        </div>
        <Link to={RoutePath.RELATIONSHIPS} className="label-caps text-honey hover:text-green">
          Open
        </Link>
      </div>

      {suggestions.length > 0 ? (
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <Link
              key={suggestion.relationship.id}
              to={relationshipPath(suggestion.relationship.id)}
              className="surface-inline-panel flex items-center justify-between gap-4 rounded-2xl p-4 text-left transition-colors hover:bg-honey/10"
            >
              <span className="min-w-0">
                <span className="block text-base font-bold text-gray-text">{suggestion.relationship.name}</span>
                <span className="mt-1 block line-clamp-2 text-sm font-medium text-gray-light">
                  {suggestion.suggestedCare}
                </span>
              </span>
              <Sparkle size={18} weight="duotone" className="shrink-0 text-honey" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-honey/30 p-5">
          <p className="font-serif text-base italic text-gray-text">
            Seed a few relationships to begin the weekly care ritual.
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
