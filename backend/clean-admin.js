const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const admins = await prisma.user.findMany({ where: { role: 'admin' } });
    console.log(`Found ${admins.length} admin(s):`);
    admins.forEach(a => console.log(`  - ${a.id} | ${a.email} | password: ${a.password ? 'SET' : 'EMPTY'}`));

    const totalUsers = await prisma.user.count();
    console.log(`Total users in DB: ${totalUsers}`);

    await prisma.$disconnect();
}

check().catch(console.error);
