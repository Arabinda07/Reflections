import type { CompletionCardPayload } from './completionCardPayload';

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;

type HtmlInCanvasContext = CanvasRenderingContext2D & {
  drawElementImage?: (element: Element, x: number, y: number) => unknown;
};

export const canRenderCompletionCardWithHtmlInCanvas = (
  context: CanvasRenderingContext2D,
): boolean => typeof (context as HtmlInCanvasContext).drawElementImage === 'function';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const buildCompletionCardElement = (payload: CompletionCardPayload) => {
  const card = typeof document !== 'undefined'
    ? document.createElement('section')
    : ({
      dataset: {},
      style: {},
      setAttribute: () => undefined,
      remove: () => undefined,
    } as unknown as HTMLElement);
  card.dataset.completionCard = 'html';
  card.setAttribute('aria-label', `${payload.brand} completion card`);
  card.style.cssText = [
    `width:${CARD_WIDTH}px`,
    `height:${CARD_HEIGHT}px`,
    'box-sizing:border-box',
    'padding:48px',
    'font-family:Manrope,system-ui,sans-serif',
    'color:#293127',
    'background:linear-gradient(135deg,#f0f4ec,#f7f8f4 52%,#f4f6f0)',
  ].join(';');
  card.innerHTML = `
    <div style="box-sizing:border-box;width:100%;height:100%;border:2px solid #d8dfd1;border-radius:36px;background:rgba(251,252,248,.88);padding:56px;display:flex;flex-direction:column;justify-content:space-between;">
      <header style="display:flex;align-items:center;gap:16px;">
        <span style="width:44px;height:44px;border-radius:50%;background:#4f6f46;display:inline-flex;align-items:center;justify-content:center;color:#f7f8f4;font-weight:800;">R</span>
        <strong style="font-family:Spectral,serif;font-style:italic;font-size:30px;color:#4f6f46;">${escapeHtml(payload.brand)}</strong>
      </header>
      <main>
        <h1 style="max-width:820px;margin:0 0 28px;font-size:64px;line-height:1.14;letter-spacing:0;font-weight:800;">${escapeHtml(payload.title)}</h1>
        <p style="margin:0;font-size:26px;line-height:1.45;color:#65705e;font-weight:600;">${escapeHtml(payload.subtitle)}</p>
      </main>
      <footer style="display:flex;align-items:center;justify-content:space-between;gap:24px;">
        <span style="display:inline-flex;align-items:center;height:38px;border-radius:999px;border:1.5px solid #ddd0c0;background:#f2ece5;padding:0 20px;color:#8a6a4a;font-size:16px;font-weight:800;text-transform:uppercase;">${escapeHtml(payload.badge)}</span>
        <span style="color:#819076;font-size:20px;font-weight:800;">${escapeHtml(payload.dateLabel)}</span>
      </footer>
    </div>
  `;

  return card;
};

const createDetachedCanvasHost = (canvas: HTMLCanvasElement) => {
  if (typeof document === 'undefined' || canvas.isConnected) {
    return () => undefined;
  }

  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = [
    'position:fixed',
    'left:-10000px',
    'top:0',
    `width:${CARD_WIDTH}px`,
    `height:${CARD_HEIGHT}px`,
    'overflow:hidden',
    'pointer-events:none',
    'opacity:0',
  ].join(';');
  document.body.appendChild(host);
  host.appendChild(canvas);

  return () => {
    host.remove();
  };
};

const isCanvasBlank = (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
  const samplePoints = [
    [1, 1],
    [Math.floor(canvas.width / 2), Math.floor(canvas.height / 2)],
    [Math.max(1, canvas.width - 2), Math.max(1, canvas.height - 2)],
    [120, 120],
    [Math.max(1, canvas.width - 120), Math.max(1, canvas.height - 120)],
  ];

  try {
    return samplePoints.every(([x, y]) => {
      const data = context.getImageData(x, y, 1, 1).data;
      return data[0] === 0 && data[1] === 0 && data[2] === 0 && data[3] === 0;
    });
  } catch {
    return true;
  }
};

const canvasToPngBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('COMPLETION_CARD_RENDER_FAILED'));
        return;
      }

      resolve(blob);
    }, 'image/png');
  });

export async function renderCompletionCardHtmlPng(
  payload: CompletionCardPayload,
  createCanvas: () => HTMLCanvasElement = () => document.createElement('canvas'),
): Promise<Blob> {
  const canvas = createCanvas();
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  if (typeof canvas.setAttribute === 'function') {
    canvas.setAttribute('layoutsubtree', '');
  }

  const context = canvas.getContext('2d');
  if (!context || !canRenderCompletionCardWithHtmlInCanvas(context)) {
    throw new Error('COMPLETION_CARD_HTML_RENDER_UNAVAILABLE');
  }

  const cleanupHost = createDetachedCanvasHost(canvas);
  const element = buildCompletionCardElement(payload);
  if (typeof canvas.appendChild === 'function') {
    canvas.appendChild(element);
  }

  try {
    const transform = (context as HtmlInCanvasContext).drawElementImage?.(element, 0, 0);
    if (transform) {
      element.style.transform = String(transform);
    }
    if (isCanvasBlank(context, canvas)) {
      throw new Error('COMPLETION_CARD_HTML_RENDER_BLANK');
    }
    return await canvasToPngBlob(canvas);
  } finally {
    element.remove();
    cleanupHost();
  }
}
