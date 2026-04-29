export type CompletionCardKind = 'weekly_recap' | 'release_completed' | 'letter_scheduled';

export interface CompletionCardPayload {
  brand: 'Reflections';
  title: string;
  subtitle: string;
  dateLabel: string;
  kind: CompletionCardKind;
}

export type CompletionCardShareResult = 'shared' | 'unsupported';

interface CompletionCardInput {
  kind: CompletionCardKind;
  date: Date;
  weekLabel?: string;
}

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);

const cardCopy: Record<CompletionCardKind, { title: string; subtitle: string }> = {
  weekly_recap: {
    title: 'I returned to myself this week.',
    subtitle: 'A quiet week in Reflections.',
  },
  release_completed: {
    title: 'I let something go.',
    subtitle: 'A quiet moment was completed.',
  },
  letter_scheduled: {
    title: 'I wrote something for a future day.',
    subtitle: 'A letter is waiting in Reflections.',
  },
};

export function buildCompletionCardPayload(input: CompletionCardInput): CompletionCardPayload {
  const dateLabel = formatDate(input.date);
  const copy = cardCopy[input.kind];

  return {
    brand: 'Reflections',
    title: copy.title,
    subtitle: input.kind === 'weekly_recap' && input.weekLabel ? input.weekLabel : copy.subtitle,
    dateLabel,
    kind: input.kind,
  };
}

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

  context.fillStyle = '#f7f8f4';
  context.fillRect(0, 0, width, height);

  context.fillStyle = '#fbfcf8';
  roundRect(context, 64, 58, width - 128, height - 116, 44);
  context.fill();

  context.strokeStyle = '#d8dfd1';
  context.lineWidth = 3;
  context.stroke();

  context.fillStyle = '#4f6f46';
  context.beginPath();
  context.arc(150, 142, 30, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = '#4f6f46';
  context.font = '700 28px Geist, Arial, sans-serif';
  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';
  context.fillText(payload.brand, 200, 154);

  context.fillStyle = '#293127';
  context.font = '700 78px Fraunces, Georgia, serif';
  wrapText(context, payload.title, 850).forEach((line, index) => {
    context.fillText(line, 128, 300 + index * 88);
  });

  context.fillStyle = '#65705e';
  context.font = '500 30px Geist, Arial, sans-serif';
  context.fillText(payload.subtitle, 128, 500);

  context.fillStyle = '#819076';
  context.font = '700 22px Geist, Arial, sans-serif';
  context.textAlign = 'right';
  context.fillText(payload.dateLabel, width - 128, 500);
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
