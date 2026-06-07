const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const deletedUser = await prisma.user.delete({
    where: {
      // Replace this with the actual ID string of harsh@gmail.com from your table
      id: '4072e61b-62af-4b7f-905e-c457d1ac05b8', 
    },
  });
  console.log('Successfully deleted:', deletedUser);
}

main()
  .catch((e) => {
    console.error('DATABASE ERROR:', e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });