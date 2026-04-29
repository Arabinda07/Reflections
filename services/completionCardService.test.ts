import { describe, expect, it, vi } from 'vitest';
import {
  buildCompletionCardPayload,
  copyCompletionCardToClipboard,
  drawCompletionCard,
  renderCompletionCardPng,
  shareCompletionCard,
} from './completionCardService';

describe('buildCompletionCardPayload', () => {
  it('returns only private-safe fields for release completion cards', () => {
    const payload = buildCompletionCardPayload({
      kind: 'release_completed',
      date: new Date('2026-04-29T12:00:00.000Z'),
      privateText: 'This should never be shared',
      mood: 'heavy',
      tags: ['family', 'money'],
      aiSummary: 'Private summary',
    } as any);

    expect(payload).toEqual({
      brand: 'Reflections',
      title: 'I let something go.',
      subtitle: 'A quiet moment was completed.',
      dateLabel: 'Apr 29, 2026',
      kind: 'release_completed',
    });
    expect(JSON.stringify(payload)).not.toMatch(/This should never|heavy|family|money|Private summary/);
  });

  it('keeps weekly recap cards generic and free of recap internals', () => {
    const payload = buildCompletionCardPayload({
      kind: 'weekly_recap',
      date: new Date('2026-04-29T12:00:00.000Z'),
      weekLabel: 'Apr 27 - May 3',
      recurringTags: ['work'],
      commonMood: 'anxious',
    } as any);

    expect(payload.title).toBe('I returned to myself this week.');
    expect(payload.subtitle).toBe('Apr 27 - May 3');
    expect(JSON.stringify(payload)).not.toMatch(/work|anxious/);
  });
});

describe('drawCompletionCard', () => {
  it('draws only the safe card payload fields', () => {
    const calls: string[] = [];
    const context = {
      canvas: { width: 1200, height: 630 },
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      font: '',
      textAlign: 'left' as CanvasTextAlign,
      textBaseline: 'alphabetic' as CanvasTextBaseline,
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillRect: vi.fn(),
      arc: vi.fn(),
      measureText: vi.fn((text: string) => ({ width: text.length * 16 })),
      fillText: vi.fn((text: string) => calls.push(text)),
    } as unknown as CanvasRenderingContext2D;

    drawCompletionCard(context, {
      brand: 'Reflections',
      title: 'I let something go.',
      subtitle: 'A quiet moment was completed.',
      dateLabel: 'Apr 29, 2026',
      kind: 'release_completed',
    });

    expect(calls.join(' ')).toContain('I let something go.');
    expect(calls.join(' ')).toContain('Reflections');
    expect(calls.join(' ')).not.toMatch(/private|mood|tag|summary/i);
  });
});

describe('renderCompletionCardPng', () => {
  it('renders a PNG blob from a canvas without reading private note fields', async () => {
    const blob = new Blob(['png'], { type: 'image/png' });
    const context = {
      canvas: { width: 1200, height: 630 },
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      font: '',
      textAlign: 'left',
      textBaseline: 'alphabetic',
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillRect: vi.fn(),
      arc: vi.fn(),
      measureText: vi.fn((text: string) => ({ width: text.length * 16 })),
      fillText: vi.fn(),
    };
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => context),
      toBlob: vi.fn((callback: BlobCallback) => callback(blob)),
    } as unknown as HTMLCanvasElement;

    const rendered = await renderCompletionCardPng(
      buildCompletionCardPayload({
        kind: 'letter_scheduled',
        date: new Date('2026-04-29T12:00:00.000Z'),
        content: 'Do not include this',
      } as any),
      () => canvas,
    );

    expect(rendered.type).toBe('image/png');
    expect(canvas.width).toBe(1200);
    expect(canvas.height).toBe(630);
    expect(JSON.stringify(context.fillText.mock.calls)).not.toContain('Do not include this');
  });
});

describe('shareCompletionCard', () => {
  it('uses Web Share with a PNG file when available', async () => {
    const payload = buildCompletionCardPayload({
      kind: 'release_completed',
      date: new Date('2026-04-29T12:00:00.000Z'),
    });
    const blob = new Blob(['png'], { type: 'image/png' });
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(true);

    const result = await shareCompletionCard(payload, {
      render: vi.fn().mockResolvedValue(blob),
      navigator: { share, canShare } as unknown as Navigator,
    });

    expect(result).toBe('shared');
    expect(share).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Reflections',
      text: payload.title,
    }));
    expect(canShare).toHaveBeenCalledWith(expect.objectContaining({
      files: expect.any(Array),
    }));
  });
});

describe('copyCompletionCardToClipboard', () => {
  it('copies the rendered PNG to the clipboard when image clipboard support exists', async () => {
    const payload = buildCompletionCardPayload({
      kind: 'release_completed',
      date: new Date('2026-04-29T12:00:00.000Z'),
    });
    const blob = new Blob(['png'], { type: 'image/png' });
    const write = vi.fn().mockResolvedValue(undefined);
    const ClipboardItemMock = vi.fn(function ClipboardItemMock(this: { items: Record<string, Blob> }, items: Record<string, Blob>) {
      this.items = items;
    });

    const result = await copyCompletionCardToClipboard(payload, {
      render: vi.fn().mockResolvedValue(blob),
      clipboard: { write } as unknown as Clipboard,
      clipboardItem: ClipboardItemMock as unknown as typeof ClipboardItem,
    });

    expect(result).toBe(true);
    expect(ClipboardItemMock).toHaveBeenCalledWith({ 'image/png': blob });
    expect(write).toHaveBeenCalledWith([expect.objectContaining({
      items: { 'image/png': blob },
    })]);
  });
});
