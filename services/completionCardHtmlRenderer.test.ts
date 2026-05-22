import { describe, expect, it, vi } from 'vitest';
import {
  canRenderCompletionCardWithHtmlInCanvas,
  renderCompletionCardHtmlPng,
} from './completionCardHtmlRenderer';
import { renderCompletionCardPng } from './completionCardService';

const payload = {
  brand: 'Reflections',
  title: 'I let something go.',
  subtitle: 'A quiet moment was completed.',
  dateLabel: 'Apr 29, 2026',
  kind: 'release_completed' as const,
  badge: 'Released',
} as const;

describe('completionCardHtmlRenderer', () => {
  const createElement = (): HTMLElement => {
    const element = {
      dataset: {},
      style: {},
      innerHTML: '',
      isConnected: false,
      appendChild: vi.fn((child: unknown) => child),
      remove: vi.fn(),
      setAttribute: vi.fn(),
    };
    return element as unknown as HTMLElement;
  };

  const withDocument = async <T>(callback: () => Promise<T> | T): Promise<T> => {
    const globalWithDocument = globalThis as typeof globalThis & { document?: Document };
    const previousDocument = globalWithDocument.document;
    const body = createElement();
    globalWithDocument.document = {
      body,
      createElement,
    } as unknown as Document;

    try {
      return await callback();
    } finally {
      globalWithDocument.document = previousDocument;
    }
  };

  it('feature-detects HTML-in-Canvas support before rendering', () => {
    expect(canRenderCompletionCardWithHtmlInCanvas({} as CanvasRenderingContext2D)).toBe(false);
    expect(canRenderCompletionCardWithHtmlInCanvas({ drawElementImage: vi.fn() } as unknown as CanvasRenderingContext2D)).toBe(true);
  });

  it('renders a PNG through drawElementImage when the experimental API is present', async () => {
    await withDocument(async () => {
      const blob = new Blob(['png'], { type: 'image/png' });
      const context = {
        canvas: { width: 1200, height: 630 },
        drawElementImage: vi.fn(() => 'matrix(1, 0, 0, 1, 0, 0)'),
        getImageData: vi.fn(() => ({ data: new Uint8ClampedArray([12, 0, 0, 255]) })),
      } as unknown as CanvasRenderingContext2D;
      const canvas = {
        width: 0,
        height: 0,
        isConnected: false,
        appendChild: vi.fn((child: unknown) => child),
        getContext: vi.fn(() => context),
        setAttribute: vi.fn(),
        toBlob: vi.fn((callback: BlobCallback) => callback(blob)),
      } as unknown as HTMLCanvasElement;

      const rendered = await renderCompletionCardHtmlPng(payload, () => canvas);

      expect(rendered.type).toBe('image/png');
      expect(canvas.width).toBe(1200);
      expect(canvas.height).toBe(630);
      expect(canvas.setAttribute).toHaveBeenCalledWith('layoutsubtree', '');
      expect(canvas.appendChild).toHaveBeenCalledWith(
        expect.objectContaining({ dataset: expect.objectContaining({ completionCard: 'html' }) }),
      );
      expect((context as any).drawElementImage).toHaveBeenCalledWith(
        expect.objectContaining({ dataset: expect.objectContaining({ completionCard: 'html' }) }),
        0,
        0,
      );
    });
  });

  it('rejects blank experimental renders so the caller can fall back', async () => {
    await withDocument(async () => {
      const context = {
        canvas: { width: 1200, height: 630 },
        drawElementImage: vi.fn(() => 'matrix(1, 0, 0, 1, 0, 0)'),
        getImageData: vi.fn(() => ({ data: new Uint8ClampedArray([0, 0, 0, 0]) })),
      } as unknown as CanvasRenderingContext2D;
      const canvas = {
        width: 0,
        height: 0,
        isConnected: false,
        appendChild: vi.fn((child: unknown) => child),
        getContext: vi.fn(() => context),
        setAttribute: vi.fn(),
        toBlob: vi.fn((callback: BlobCallback) => callback(new Blob(['png'], { type: 'image/png' }))),
      } as unknown as HTMLCanvasElement;

      await expect(renderCompletionCardHtmlPng(payload, () => canvas)).rejects.toThrow(
        'COMPLETION_CARD_HTML_RENDER_BLANK',
      );
    });
  });

  it('falls back to the manual canvas renderer when the experimental output is blank', async () => {
    await withDocument(async () => {
      const blob = new Blob(['manual-png'], { type: 'image/png' });
      const gradient = { addColorStop: vi.fn() };
      const context = {
        canvas: { width: 1200, height: 630 },
        drawElementImage: vi.fn(() => 'matrix(1, 0, 0, 1, 0, 0)'),
        getImageData: vi.fn(() => ({ data: new Uint8ClampedArray([0, 0, 0, 0]) })),
        createLinearGradient: vi.fn(() => gradient),
        createRadialGradient: vi.fn(() => gradient),
        fillRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        quadraticCurveTo: vi.fn(),
        closePath: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        arc: vi.fn(),
        fillText: vi.fn(),
        measureText: vi.fn((text: string) => ({ width: text.length * 10 })),
      } as unknown as CanvasRenderingContext2D;
      const canvas = {
        width: 0,
        height: 0,
        isConnected: false,
        appendChild: vi.fn((child: unknown) => child),
        getContext: vi.fn(() => context),
        setAttribute: vi.fn(),
        toBlob: vi.fn((callback: BlobCallback) => callback(blob)),
      } as unknown as HTMLCanvasElement;

      const rendered = await renderCompletionCardPng(payload, () => canvas);

      expect(rendered).toBe(blob);
      expect((context as any).drawElementImage).toHaveBeenCalled();
      expect((context as any).fillRect).toHaveBeenCalled();
    });
  });
});
