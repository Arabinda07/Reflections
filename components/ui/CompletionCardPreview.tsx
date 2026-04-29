import React, { useEffect, useState } from 'react';
import type { CompletionCardPayload } from '../../services/completionCardPayload';

const loadRenderer = () => import('../../services/completionCardService');

interface CompletionCardPreviewProps {
  payload: CompletionCardPayload;
  className?: string;
}

/**
 * Renders a live preview of the completion card as an <img>.
 * Lazy-renders: only generates when the component mounts.
 */
export const CompletionCardPreview: React.FC<CompletionCardPreviewProps> = ({
  payload,
  className = '',
}) => {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let revoked = false;

    (async () => {
      try {
        const { renderCompletionCardPng } = await loadRenderer();
        const blob = await renderCompletionCardPng(payload);
        if (revoked) return;
        const url = URL.createObjectURL(blob);
        setSrc(url);
      } catch (error) {
        console.error('Could not render completion card preview:', error);
      }
    })();

    return () => {
      revoked = true;
      if (src) URL.revokeObjectURL(src);
    };
    // Re-render when payload changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload.kind, payload.title, payload.dateLabel]);

  if (!src) return null;

  return (
    <img
      src={src}
      alt={`${payload.badge} – ${payload.title}`}
      className={`w-full rounded-2xl border border-border/40 ${className}`}
      loading="lazy"
    />
  );
};
