const bcrypt = require('bcryptjs');
const { PrismaClient } = require('/repo/node_modules/.prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin@cloudscreen.io';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Super admin already exists:', email);
    console.log('ID:', existing.id);
    return;
  }
  const hash = await bcrypt.hash('Admin@2026!', 12);
  const user = await prisma.user.create({
    data: {
      email,
      fullName: 'Super Admin',
      passwordHash: hash,
      emailVerified: true,
      isSuperAdmin: true,
      platformStaffRole: 'SUPER_ADMIN',
    },
  });
  console.log('Super admin created:', email);
  console.log('ID:', user.id);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
