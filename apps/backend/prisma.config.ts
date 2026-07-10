import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from '@prisma/config';

/**
 * Prisma 7 executes this file with only the ambient environment; unlike Prisma 5
 * it does not read `.env` itself. Containers inject DATABASE_URL directly, but a
 * fresh local clone has it only in `.env`, so `npm run prisma:migrate` failed
 * with "The datasource.url property is required" — even though `scripts/sync-env.cjs`
 * had dutifully copied `.env` into `apps/backend/` for exactly this purpose.
 *
 * Parsed here rather than via `dotenv` so this file has no runtime dependency
 * beyond `@prisma/config`, which the production image already ships.
 */
function loadEnvFile(path: string): void {
  let contents: string;
  try {
    contents = readFileSync(path, 'utf-8');
  } catch {
    return; // absent is normal (CI, containers)
  }

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separator = line.indexOf('=');
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    if (!key || key in process.env) continue; // never override the real environment

    const value = line.slice(separator + 1).trim();
    const unquoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
        ? value.slice(1, -1)
        : value;

    process.env[key] = unquoted;
  }
}

if (!process.env.DATABASE_URL?.trim()) {
  loadEnvFile(join(__dirname, '.env')); // written by scripts/sync-env.cjs
  loadEnvFile(join(__dirname, '..', '..', '.env')); // repo root fallback
}

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    /**
     * Prisma 7 reads the seed command from here. The legacy `prisma.seed` key in
     * package.json is ignored, which silently turned `prisma db seed` into a
     * no-op: it printed setup instructions and exited 0, so `npm run prisma:seed`
     * looked like it worked while seeding nothing.
     */
    seed: 'npx ts-node --transpile-only prisma/seed.ts',
  },
});
