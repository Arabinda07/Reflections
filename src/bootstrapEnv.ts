const REQUIRED_CLIENT_ENV_KEYS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
] as const;

type ClientEnvKey = (typeof REQUIRED_CLIENT_ENV_KEYS)[number];
type ClientEnvShape = Partial<Record<ClientEnvKey, string | undefined>>;

const hasValue = (value?: string) => Boolean(value?.trim());

export const getMissingClientEnvNames = (env: ClientEnvShape): ClientEnvKey[] =>
  REQUIRED_CLIENT_ENV_KEYS.filter((key) => !hasValue(env[key]));

export const hasRequiredClientEnv = (env: ClientEnvShape): boolean =>
  getMissingClientEnvNames(env).length === 0;
