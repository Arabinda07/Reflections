import type { CompletionCardPayload } from './completionCardPayload';

export { buildCompletionCardPayload } from './completionCardPayload';
export type { CompletionCardKind, CompletionCardPayload } from './completionCardPayload';

export type CompletionCardShareResult = 'shared' | 'unsupported';

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;

const roundRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
};

const wrapText = (
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth || !currentLine) {
      currentLine = candidate;
      return;
    }

    lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, 3);
};

const CARD_LAYOUT = {
  padding: 48,
  innerPaddingY: 44,
  innerRadius: 36,
  contentLeft: 104,
  logoCircleX: 126,
  logoCircleY: 120,
  logoCircleRadius: 22,
  wordmarkX: 162,
  wordmarkY: 130,
  titleY: 260,
  titleLineHeight: 76,
  titleMaxWidth: 820,
  subtitleOffsetY: 28,
  badgeBottomOffset: 132,
  badgePillHeight: 38,
  badgePillRadius: 19,
  badgePaddingX: 20,
  watermarkBottomOffset: 32,
} as const;

const BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  weekly_recap: { bg: '#e8f0e3', text: '#4f6f46', border: '#c4d8bb' },
  release_completed: { bg: '#f2ece5', text: '#8a6a4a', border: '#ddd0c0' },
  letter_scheduled: { bg: '#f4f0e2', text: '#8a7a40', border: '#e2d8b8' },
};

const drawCardBackground = (ctx: CanvasRenderingContext2D) => {
  const { width, height } = ctx.canvas;

  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, '#f0f4ec');
  bgGradient.addColorStop(0.5, '#f7f8f4');
  bgGradient.addColorStop(1, '#f4f6f0');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(200, 140, 60, 200, 140, 420);
  glow.addColorStop(0, 'rgba(79, 111, 70, 0.07)');
  glow.addColorStop(1, 'rgba(79, 111, 70, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(251, 252, 248, 0.85)';
  roundRect(ctx, CARD_LAYOUT.padding, CARD_LAYOUT.innerPaddingY, width - CARD_LAYOUT.padding * 2, height - CARD_LAYOUT.innerPaddingY * 2, CARD_LAYOUT.innerRadius);
  ctx.fill();
  ctx.strokeStyle = '#d8dfd1';
  ctx.lineWidth = 2;
  ctx.stroke();
};

const drawCardLogo = (ctx: CanvasRenderingContext2D) => {
  ctx.fillStyle = '#4f6f46';
  ctx.beginPath();
  ctx.arc(CARD_LAYOUT.logoCircleX, CARD_LAYOUT.logoCircleY, CARD_LAYOUT.logoCircleRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f7f8f4';
  const lx = CARD_LAYOUT.logoCircleX;
  const ly = CARD_LAYOUT.logoCircleY;
  const size = 10;
  
  ctx.beginPath();
  ctx.moveTo(lx, ly - size);
  ctx.quadraticCurveTo(lx + size * 1.2, ly, lx, ly + size);
  ctx.quadraticCurveTo(lx - size * 1.2, ly, lx, ly - size);
  ctx.fill();
  
  // Stem
  ctx.strokeStyle = '#f7f8f4';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(lx, ly + size);
  ctx.lineTo(lx, ly + size + 4);
  ctx.stroke();

  ctx.fillStyle = '#4f6f46';
  ctx.font = 'italic 600 26px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Reflections', CARD_LAYOUT.wordmarkX, CARD_LAYOUT.wordmarkY);
};

const drawCardTitle = (ctx: CanvasRenderingContext2D, payload: CompletionCardPayload): number => {
  ctx.fillStyle = '#293127';
  ctx.font = '700 64px Fraunces, Georgia, serif';
  const titleLines = wrapText(ctx, payload.title, CARD_LAYOUT.titleMaxWidth);
  titleLines.forEach((line, index) => {
    ctx.fillText(line, CARD_LAYOUT.contentLeft, CARD_LAYOUT.titleY + index * CARD_LAYOUT.titleLineHeight);
  });

  const subtitleY = CARD_LAYOUT.titleY + titleLines.length * CARD_LAYOUT.titleLineHeight + CARD_LAYOUT.subtitleOffsetY;
  ctx.fillStyle = '#65705e';
  ctx.font = '500 26px Manrope, Arial, sans-serif';
  ctx.fillText(payload.subtitle, CARD_LAYOUT.contentLeft, subtitleY);

  return subtitleY;
};

const drawCardBadge = (ctx: CanvasRenderingContext2D, payload: CompletionCardPayload) => {
  const { height } = ctx.canvas;
  const colors = BADGE_COLORS[payload.kind] || BADGE_COLORS.weekly_recap;

  ctx.font = '800 16px Manrope, Arial, sans-serif';
  const badgeText = payload.badge.toUpperCase();
  const badgeWidth = ctx.measureText(badgeText).width + CARD_LAYOUT.badgePaddingX * 2;
  const badgeX = CARD_LAYOUT.contentLeft;
  const badgeY = height - CARD_LAYOUT.badgeBottomOffset;

  ctx.fillStyle = colors.bg;
  roundRect(ctx, badgeX, badgeY, badgeWidth, CARD_LAYOUT.badgePillHeight, CARD_LAYOUT.badgePillRadius);
  ctx.fill();
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = colors.text;
  ctx.textAlign = 'left';
  ctx.fillText(badgeText, badgeX + CARD_LAYOUT.badgePaddingX, badgeY + 25);

  return badgeY;
};

const drawCardFooter = (ctx: CanvasRenderingContext2D, payload: CompletionCardPayload, badgeY: number) => {
  const { width } = ctx.canvas;

  ctx.fillStyle = '#819076';
  ctx.font = '700 20px Manrope, Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(payload.dateLabel, width - CARD_LAYOUT.contentLeft, badgeY + 25);
};

export function drawCompletionCard(
  context: CanvasRenderingContext2D,
  payload: CompletionCardPayload,
): void {
  drawCardBackground(context);
  drawCardLogo(context);
  drawCardTitle(context, payload);
  const badgeY = drawCardBadge(context, payload);
  drawCardFooter(context, payload, badgeY);
}

export async function renderCompletionCardPng(
  payload: CompletionCardPayload,
  createCanvas: () => HTMLCanvasElement = () => document.createElement('canvas'),
): Promise<Blob> {
  const canvas = createCanvas();
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('COMPLETION_CARD_CANVAS_UNAVAILABLE');
  }

  drawCompletionCard(context, payload);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('COMPLETION_CARD_RENDER_FAILED'));
        return;
      }

      resolve(blob);
    }, 'image/png');
  });
}

interface CompletionCardShareOptions {
  render?: (payload: CompletionCardPayload) => Promise<Blob>;
  navigator?: Navigator;
}

interface CompletionCardClipboardOptions {
  render?: (payload: CompletionCardPayload) => Promise<Blob>;
  clipboard?: Clipboard;
  clipboardItem?: typeof ClipboardItem;
}

export async function shareCompletionCard(
  payload: CompletionCardPayload,
  options: CompletionCardShareOptions = {},
): Promise<CompletionCardShareResult> {
  const browserNavigator = options.navigator ?? (typeof navigator !== 'undefined' ? navigator : undefined);
  if (!browserNavigator?.share) {
    return 'unsupported';
  }

  const render = options.render ?? renderCompletionCardPng;
  const blob = await render(payload);
  const file = new File([blob], 'reflections-card.png', { type: 'image/png' });
  const shareData: ShareData = {
    title: payload.brand,
    text: payload.title,
    files: [file],
  };

  if (browserNavigator.canShare && !browserNavigator.canShare(shareData)) {
    return 'unsupported';
  }

  await browserNavigator.share(shareData);
  return 'shared';
}

export async function downloadCompletionCard(
  payload: CompletionCardPayload,
  render: (payload: CompletionCardPayload) => Promise<Blob> = renderCompletionCardPng,
): Promise<void> {
  const blob = await render(payload);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `reflections-${payload.kind}.png`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function copyCompletionCardToClipboard(
  payload: CompletionCardPayload,
  options: CompletionCardClipboardOptions = {},
): Promise<boolean> {
  const clipboard = options.clipboard ?? (typeof navigator !== 'undefined' ? navigator.clipboard : undefined);
  const ClipboardItemCtor =
    options.clipboardItem ?? (typeof ClipboardItem !== 'undefined' ? ClipboardItem : undefined);

  if (!clipboard?.write || !ClipboardItemCtor) {
    return false;
  }

  const render = options.render ?? renderCompletionCardPng;
  const blob = await render(payload);
  await clipboard.write([new ClipboardItemCtor({ [blob.type]: blob })]);
  return true;
}
