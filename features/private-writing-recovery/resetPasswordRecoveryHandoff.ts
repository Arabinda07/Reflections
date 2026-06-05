import {
  clearVolatileAuthSecret,
  consumeVolatileAuthSecret,
  hasVolatileAuthSecret,
  storeVolatileAuthSecret,
} from '../../src/auth/volatileSecretHandoff';

export const storePendingResetAccountPassword = (password: string, userId: string) => {
  storeVolatileAuthSecret('account_password_reset', password, userId);
};

export const consumePendingResetAccountPassword = (userId: string) =>
  consumeVolatileAuthSecret('account_password_reset', userId);

export const hasPendingResetAccountPassword = (userId: string) =>
  hasVolatileAuthSecret('account_password_reset', userId);

export const clearPendingResetAccountPassword = () => {
  clearVolatileAuthSecret('account_password_reset');
};
