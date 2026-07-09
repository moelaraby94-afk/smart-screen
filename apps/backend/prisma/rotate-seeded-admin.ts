import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

/**
 * Emergency remediation script — NOT gated by NODE_ENV on purpose.
 *
 * Rotates the password (and invalidates any active refresh session) for the
 * two accounts historically created by `prisma/seed.ts` with weak,
 * hardcoded passwords ("admin" / "123"). Safe to run against ANY
 * environment, including production: it only touches these two specific
 * emails, is a no-op for emails that don't exist, and never creates users.
 *
 * Usage: npm run rotate-seeded-admin -w apps/backend
 */

const TARGET_EMAILS = ['admin@cloudsignage.local', 'admin2@client.local'];

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for rotate-seeded-admin');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

function generateStrongPassword(): string {
  return randomBytes(16).toString('base64url');
}

async function main(): Promise<void> {
  let rotated = 0;

  for (const email of TARGET_EMAILS) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user) {
      console.log(`[skip] ${email} — no such user in this database.`);
      continue;
    }

    const rawPassword = generateStrongPassword();
    const passwordHash = await bcrypt.hash(rawPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        // Invalidate any currently active refresh token/session immediately.
        refreshTokenHash: null,
      },
    });

    console.log(
      `[rotated] ${email} (id ${user.id}) — new password: ${rawPassword}`,
    );
    rotated += 1;
  }

  console.log(
    `Done. ${rotated}/${TARGET_EMAILS.length} account(s) rotated. Passwords ` +
      'above are shown ONCE and are not recoverable — save them now, or ' +
      'reset again if lost.',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
