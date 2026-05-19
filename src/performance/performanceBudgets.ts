export const PERFORMANCE_BUDGETS = {
  javascript: {
    maxInitialKb: 260,
    maxAsyncChunkKb: 520,
  },
  css: {
    maxInitialKb: 150,
  },
  media: {
    maxAuthenticatedHeroKb: 1800,
  },
  interaction: {
    maxSlowDeviceInputDelayMs: 200,
  },
} as const;
