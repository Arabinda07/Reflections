import { describe, expect, it } from 'vitest';
import { PERFORMANCE_BUDGETS } from './performanceBudgets';

describe('Reflections performance budgets', () => {
  it('tracks app budgets without depending on landing or privacy rewrites', () => {
    expect(PERFORMANCE_BUDGETS.javascript.maxInitialKb).toBeLessThanOrEqual(260);
    expect(PERFORMANCE_BUDGETS.javascript.maxAsyncChunkKb).toBeLessThanOrEqual(520);
    expect(PERFORMANCE_BUDGETS.css.maxInitialKb).toBeLessThanOrEqual(150);
    expect(PERFORMANCE_BUDGETS.media.maxAuthenticatedHeroKb).toBeLessThanOrEqual(1800);
    expect(PERFORMANCE_BUDGETS.interaction.maxSlowDeviceInputDelayMs).toBeLessThanOrEqual(200);
  });
});
