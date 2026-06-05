export type VolatileAuthSecretSlot =
  | 'account_password_setup'
  | 'account_password_reset';

type HandoffEntry = {
  secret: string | null;
  userId: string | null;
  timer: ReturnType<typeof setTimeout> | null;
};

export const VOLATILE_AUTH_SECRET_TTL_MS = 5 * 60 * 1000;

const entries: Record<VolatileAuthSecretSlot, HandoffEntry> = {
  account_password_setup: { secret: null, userId: null, timer: null },
  account_password_reset: { secret: null, userId: null, timer: null },
};

const clearTimer = (slot: VolatileAuthSecretSlot) => {
  const entry = entries[slot];
  if (!entry.timer) return;

  clearTimeout(entry.timer);
  entry.timer = null;
};

export const storeVolatileAuthSecret = (
  slot: VolatileAuthSecretSlot,
  secret: string,
  userId: string,
  ttlMs = VOLATILE_AUTH_SECRET_TTL_MS,
) => {
  clearTimer(slot);
  entries[slot].secret = secret;
  entries[slot].userId = userId;

  if (ttlMs > 0) {
    entries[slot].timer = setTimeout(() => {
      entries[slot].secret = null;
      entries[slot].userId = null;
      entries[slot].timer = null;
    }, ttlMs);
  }
};

export const consumeVolatileAuthSecret = (slot: VolatileAuthSecretSlot, userId: string) => {
  const entry = entries[slot];
  const secret = entry.userId === userId ? entry.secret : null;
  entries[slot].secret = null;
  entries[slot].userId = null;
  clearTimer(slot);
  return secret;
};

export const hasVolatileAuthSecret = (slot: VolatileAuthSecretSlot, userId: string) =>
  entries[slot].userId === userId && Boolean(entries[slot].secret);

export const clearVolatileAuthSecret = (slot: VolatileAuthSecretSlot) => {
  entries[slot].secret = null;
  entries[slot].userId = null;
  clearTimer(slot);
};

export const clearAllVolatileAuthSecrets = () => {
  (Object.keys(entries) as VolatileAuthSecretSlot[]).forEach(clearVolatileAuthSecret);
};
