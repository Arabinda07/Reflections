const STRICT_PRIVATE_MODE_DISABLED_MESSAGE =
  'AI and Smart Mode are disabled in zero-knowledge mode because the backend cannot read private writing.';

export const isPrivateAiDisabled = () => true;

export const getStrictPrivateModeDisabledMessage = () => STRICT_PRIVATE_MODE_DISABLED_MESSAGE;
