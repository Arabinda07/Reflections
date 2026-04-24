import path from 'node:path';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('Android asset generator contract', () => {
  it('uses the public icon artwork as the Android source of truth', () => {
    const script = read('scripts/android/generate_android_assets.py');

    expect(script).toContain("ROOT / 'public' / 'icons' / 'icon-1024.png'");
    expect(script).toContain("ROOT / 'public' / 'icons' / 'icon-maskable-512.png'");
  });

  it('targets launcher and splash outputs across the required Android resource buckets', () => {
    const script = read('scripts/android/generate_android_assets.py');

    expect(script).toContain("'mipmap-mdpi'");
    expect(script).toContain("'mipmap-hdpi'");
    expect(script).toContain("'mipmap-xhdpi'");
    expect(script).toContain("'mipmap-xxhdpi'");
    expect(script).toContain("'mipmap-xxxhdpi'");
    expect(script).toContain("'drawable-port-mdpi'");
    expect(script).toContain("'drawable-port-hdpi'");
    expect(script).toContain("'drawable-port-xhdpi'");
    expect(script).toContain("'drawable-port-xxhdpi'");
    expect(script).toContain("'drawable-port-xxxhdpi'");
    expect(script).toContain("'drawable-land-mdpi'");
    expect(script).toContain("'drawable-land-hdpi'");
    expect(script).toContain("'drawable-land-xhdpi'");
    expect(script).toContain("'drawable-land-xxhdpi'");
    expect(script).toContain("'drawable-land-xxxhdpi'");
  });
});
