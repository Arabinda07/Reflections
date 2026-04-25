import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('android signing contract', () => {
  it('keeps release signing secrets out of tracked gradle properties', () => {
    const gradleProperties = read('android/gradle.properties');

    expect(gradleProperties).not.toContain('REFLECTIONS_STORE_FILE=');
    expect(gradleProperties).not.toContain('REFLECTIONS_STORE_PASSWORD=');
    expect(gradleProperties).not.toContain('REFLECTIONS_KEY_ALIAS=');
    expect(gradleProperties).not.toContain('REFLECTIONS_KEY_PASSWORD=');
  });

  it('loads release signing from local-only properties or environment variables', () => {
    const buildGradle = read('android/app/build.gradle');

    expect(buildGradle).toContain('keystore.properties');
    expect(buildGradle).toContain('System.getenv(key)');
    expect(buildGradle).toContain('resolveSigningValue("REFLECTIONS_STORE_FILE")');
    expect(buildGradle).toContain('resolveSigningValue("REFLECTIONS_STORE_PASSWORD")');
    expect(buildGradle).toContain('resolveSigningValue("REFLECTIONS_KEY_ALIAS")');
    expect(buildGradle).toContain('resolveSigningValue("REFLECTIONS_KEY_PASSWORD")');
    expect(buildGradle).not.toContain('findProperty("REFLECTIONS_STORE_FILE")');
  });

  it('ignores the local Android signing file', () => {
    const androidGitignore = read('android/.gitignore');

    expect(androidGitignore).toContain('keystore.properties');
  });
});
