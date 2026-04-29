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

export function drawCompletionCard(
  context: CanvasRenderingContext2D,
  payload: CompletionCardPayload,
): void {
  const { width, height } = context.canvas;

  // ── Background: botanical gradient ──
  const bgGradient = context.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, '#f0f4ec');
  bgGradient.addColorStop(0.5, '#f7f8f4');
  bgGradient.addColorStop(1, '#f4f6f0');
  context.fillStyle = bgGradient;
  context.fillRect(0, 0, width, height);

  // Subtle radial glow (green tint, top-left)
  const glow = context.createRadialGradient(200, 140, 60, 200, 140, 420);
  glow.addColorStop(0, 'rgba(79, 111, 70, 0.07)');
  glow.addColorStop(1, 'rgba(79, 111, 70, 0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  // ── Inner card ──
  context.fillStyle = 'rgba(251, 252, 248, 0.85)';
  roundRect(context, 48, 44, width - 96, height - 88, 36);
  context.fill();
  context.strokeStyle = '#d8dfd1';
  context.lineWidth = 2;
  context.stroke();

  // ── Logo: green circle + wordmark ──
  context.fillStyle = '#4f6f46';
  context.beginPath();
  context.arc(126, 120, 22, 0, Math.PI * 2);
  context.fill();

  // Leaf icon in circle (simple leaf shape)
  context.fillStyle = '#f7f8f4';
  context.font = '700 18px serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('🍃', 126, 121);

  // Wordmark
  context.fillStyle = '#4f6f46';
  context.font = 'italic 600 26px Georgia, serif';
  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';
  context.fillText('Reflections', 162, 130);

  // ── Title (large serif) ──
  context.fillStyle = '#293127';
  context.font = '700 64px Fraunces, Georgia, serif';
  const titleLines = wrapText(context, payload.title, 820);
  titleLines.forEach((line, index) => {
    context.fillText(line, 104, 260 + index * 76);
  });

  // ── Subtitle ──
  const subtitleY = 260 + titleLines.length * 76 + 28;
  context.fillStyle = '#65705e';
  context.font = '500 26px Geist, Arial, sans-serif';
  context.fillText(payload.subtitle, 104, subtitleY);

  // ── Badge pill ──
  const badgeColors: Record<string, { bg: string; text: string; border: string }> = {
    weekly_recap: { bg: '#e8f0e3', text: '#4f6f46', border: '#c4d8bb' },
    release_completed: { bg: '#f2ece5', text: '#8a6a4a', border: '#ddd0c0' },
    letter_scheduled: { bg: '#f4f0e2', text: '#8a7a40', border: '#e2d8b8' },
  };
  const colors = badgeColors[payload.kind] || badgeColors.weekly_recap;

  context.font = '800 16px Geist, Arial, sans-serif';
  const badgeText = payload.badge.toUpperCase();
  const badgeWidth = context.measureText(badgeText).width + 40;
  const badgeX = 104;
  const badgeY = height - 132;

  // Badge background
  context.fillStyle = colors.bg;
  roundRect(context, badgeX, badgeY, badgeWidth, 38, 19);
  context.fill();
  context.strokeStyle = colors.border;
  context.lineWidth = 1.5;
  context.stroke();

  // Badge text
  context.fillStyle = colors.text;
  context.textAlign = 'left';
  context.fillText(badgeText, badgeX + 20, badgeY + 25);

  // ── Date label ──
  context.fillStyle = '#819076';
  context.font = '700 20px Geist, Arial, sans-serif';
  context.textAlign = 'right';
  context.fillText(payload.dateLabel, width - 104, badgeY + 25);

  // ── Watermark ──
  context.fillStyle = '#c4ccbe';
  context.font = '500 16px Geist, Arial, sans-serif';
  context.textAlign = 'center';
  context.fillText('reflections.app', width / 2, height - 32);
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
