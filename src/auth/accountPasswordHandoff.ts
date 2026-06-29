import {
  clearVolatileAuthSecret,
  consumeVolatileAuthSecret,
  hasVolatileAuthSecret,
  storeVolatileAuthSecret,
} from './volatileSecretHandoff';

export const storePendingAccountPassword = (password: string, userId: string) => {
  storeVolatileAuthSecret('account_password_setup', password, userId);
};

export const consumePendingAccountPassword = (userId: string) =>
  consumeVolatileAuthSecret('account_password_setup', userId);

export const hasPendingAccountPassword = (userId: string) =>
  hasVolatileAuthSecret('account_password_setup', userId);

export const clearPendingAccountPassword = () => {
  clearVolatileAuthSecret('account_password_setup');
};
