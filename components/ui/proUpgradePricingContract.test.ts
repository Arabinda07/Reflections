import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('Pro upgrade pricing contract', () => {
  it('shows weekly and monthly trial plans without annual pricing', () => {
    const proUpgrade = read('components/ui/ProUpgradeCTA.tsx');
    const pricingCatalog = read('src/config/pricingCatalog.ts');

    expect(proUpgrade).toContain("useState<BillingPeriod>(DEFAULT_PRO_PLAN)");
    expect(proUpgrade).toContain('More room when life gets loud');
    expect(proUpgrade).toContain('Start my free trial');
    expect(proUpgrade).toContain('No surprise charges. No guilt trip. Cancel anytime.');
    expect(proUpgrade).toContain('First charge');
    expect(pricingCatalog).toContain('₹49');
    expect(pricingCatalog).toContain('₹149');

    expect(`${proUpgrade}\n${pricingCatalog}`).not.toContain('yearly');
    expect(`${proUpgrade}\n${pricingCatalog}`).not.toContain('₹999');
    expect(`${proUpgrade}\n${pricingCatalog}`).not.toContain('Save 15%');
  });
});
