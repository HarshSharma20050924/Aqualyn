const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const followCount = await prisma.userFollows.count();
  const storyCount = await prisma.story.count();
  const userCount = await prisma.user.count();
  console.log({ userCount, followCount, storyCount });
  
  const follows = await prisma.userFollows.findMany();
  console.log('Follows:', follows);
}

main();
