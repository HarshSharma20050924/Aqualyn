const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function seedFromDbJson() {
  console.log('🚀 Seeding meme content from db.json...');

  // Read db.json (one level up from backend/)
  const dbJsonPath = path.resolve(__dirname, '../db.json');
  const raw = fs.readFileSync(dbJsonPath, 'utf-8');
  const parsed = JSON.parse(raw);

  // db.json structure: { "_default": { "1": {...}, "2": {...}, ... } }
  const entries = Object.values(parsed._default || parsed);

  // Upsert a dedicated meme author account
  const memeUser = await prisma.user.upsert({
    where: { username: 'meme_vault' },
    update: {
      displayName: 'Meme Vault 🔥',
      bio: '🤣 Top viral memes from around the internet. Daily drops!',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300&h=300',
    },
    create: {
      username: 'meme_vault',
      email: 'memevault@aqualyn.app',
      displayName: 'Meme Vault 🔥',
      bio: '🤣 Top viral memes from around the internet. Daily drops!',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300&h=300',
    },
  });

  console.log(`✅ Meme author ready: @${memeUser.username}`);

  // Also get/create a few more varied authors so the global feed looks diverse
  const communityUsers = [
    { username: 'alex_dev',    email: 'alex@example.com',   displayName: 'Alex Rivers',     avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300&h=300' },
    { username: 'maya_lens',   email: 'maya@example.com',   displayName: 'Maya Lin',         avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300&h=300' },
    { username: 'kenji_vibe',  email: 'kenji@example.com',  displayName: 'Kenji Sato',       avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300&h=300' },
    { username: 'priya_code',  email: 'priya@example.com',  displayName: 'Priya Sharma',     avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300&h=300' },
    { username: 'reel_motion', email: 'reels@example.com',  displayName: 'Motion Reels',     avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300&h=300' },
  ];

  const authors = [memeUser];
  for (const u of communityUsers) {
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: { displayName: u.displayName, avatar: u.avatar },
      create: { ...u, bio: '👋 Community creator on Aqualyn.' },
    });
    authors.push(user);
  }

  // Filter valid entries with a real image URL
  const validEntries = entries.filter(e => {
    const m = e.media || '';
    return m.startsWith('http') && !m.includes('video') && (
      m.endsWith('.jpg') || m.endsWith('.jpeg') || m.endsWith('.png') || m.endsWith('.gif') || m.includes('imgur') || m.includes('redd.it')
    );
  });

  console.log(`📦 Found ${validEntries.length} valid meme posts to seed...`);

  let count = 0;
  for (let i = 0; i < validEntries.length; i++) {
    const entry = validEntries[i];
    const author = authors[i % authors.length];

    // Parse the created_utc timestamp
    const createdAt = entry.created_utc
      ? new Date(entry.created_utc * 1000)
      : new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);

    try {
      await prisma.post.create({
        data: {
          authorId: author.id,
          content: entry.title || 'Check this out! 🔥',
          mediaUrl: entry.media,
          mediaType: 'image',
          location: null,
          createdAt,
        },
      });
      count++;
      if (count % 25 === 0) console.log(`  ⏳ Seeded ${count} posts...`);
    } catch (err) {
      // Skip duplicates or broken entries silently
    }
  }

  console.log(`🎉 Done! Seeded ${count} meme posts from db.json into the global feed.`);
}

seedFromDbJson()
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
