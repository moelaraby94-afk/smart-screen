import { defineConfig } from '@prisma/config';

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
