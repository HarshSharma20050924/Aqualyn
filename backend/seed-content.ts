import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample dataset of global users
const SAMPLE_USERS = [
  {
    username: 'alex_dev',
    displayName: 'Alex Rivers',
    email: 'alex@example.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300&h=300',
    bio: '⚡ Tech enthusiast & UI designer building the future.',
  },
  {
    username: 'maya_lens',
    displayName: 'Maya Lin',
    email: 'maya@example.com',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300&h=300',
    bio: '📸 Traveling the world one photo at a time.',
  },
  {
    username: 'kenji_vibe',
    displayName: 'Kenji Sato',
    email: 'kenji@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300&h=300',
    bio: '🎵 Beatmaker & soundscape designer. Tokyo ➔ NYC.',
  },
  {
    username: 'priya_code',
    displayName: 'Priya Sharma',
    email: 'priya@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300&h=300',
    bio: '🚀 Full-stack developer & open-source contributor.',
  },
  {
    username: 'meme_lord',
    displayName: 'Meme Vault 🚀',
    email: 'memes@example.com',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300&h=300',
    bio: '🔥 Daily fresh memes and tech humor.',
  },
  {
    username: 'reel_motion',
    displayName: 'Motion Reels',
    email: 'reels@example.com',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300&h=300',
    bio: '🎬 Cinematic reels and short video highlights.',
  }
];

// Sample posts: Photos, Memes, and Video Reels
const SAMPLE_POSTS = [
  // ── High Quality Photos ──
  {
    content: 'Sunset over the Cyberpunk Skyline 🌆✨',
    mediaUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&q=80&w=1000',
    mediaType: 'image',
    location: 'Tokyo, Japan'
  },
  {
    content: 'Neon lights reflecting on rainy streets. Pure aesthetic vibes 🌧️💫',
    mediaUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&q=80&w=1000',
    mediaType: 'image',
    location: 'Seoul, South Korea'
  },
  {
    content: 'Coffee break & coding session at morning golden hour ☕💻',
    mediaUrl: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=1000',
    mediaType: 'image',
    location: 'San Francisco, CA'
  },
  {
    content: 'Exploring the serene mountain mist this weekend 🏔️🌲',
    mediaUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1000',
    mediaType: 'image',
    location: 'Swiss Alps'
  },

  // ── Memes & Humor ──
  {
    content: 'When the code works on the first try without any bugs... suspicious 🧐😂',
    mediaUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=1000',
    mediaType: 'image',
    location: 'Stack Overflow Headquarters'
  },
  {
    content: 'CSS Centering div meme incoming... why is flexbox like magic? 🪄✨',
    mediaUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000',
    mediaType: 'image',
    location: 'Web Dev World'
  },

  // ── Video Reels ──
  {
    content: 'Insane Skateboard Trick Reel! 🛹🔥 Watch till the end!',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-skater-performing-a-trick-41564-large.mp4',
    mediaType: 'video',
    location: 'Venice Beach Skatepark'
  },
  {
    content: 'Cinematic Golden Ocean Waves Sunset 🌊🌅 #Relaxation #Nature',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4',
    mediaType: 'video',
    location: 'Malibu Coast'
  },
  {
    content: 'Neon City Night Drive Visuals 🌃🚗 #NightVibes',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4',
    mediaType: 'video',
    location: 'Night City'
  },
  {
    content: 'Big Buck Bunny Test Reel Clip 🎬🐰',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    mediaType: 'video',
    location: 'Studio Production'
  }
];

async function seed() {
  console.log('🚀 Seeding global testing content (Users, Photos, Memes, Reels)...');

  const createdUsers = [];

  for (const userData of SAMPLE_USERS) {
    const user = await prisma.user.upsert({
      where: { username: userData.username },
      update: {
        displayName: userData.displayName,
        avatar: userData.avatar,
        bio: userData.bio,
      },
      create: {
        username: userData.username,
        email: userData.email,
        displayName: userData.displayName,
        avatar: userData.avatar,
        bio: userData.bio,
      },
    });
    createdUsers.push(user);
    console.log(`✅ Created/Updated user: @${user.username}`);
  }

  // Create Posts
  let postCount = 0;
  for (let i = 0; i < SAMPLE_POSTS.length; i++) {
    const postItem = SAMPLE_POSTS[i];
    const author = createdUsers[i % createdUsers.length];

    await prisma.post.create({
      data: {
        authorId: author.id,
        content: postItem.content,
        mediaUrl: postItem.mediaUrl,
        mediaType: postItem.mediaType,
        location: postItem.location,
      },
    });
    postCount++;
  }

  console.log(`🎉 Successfully seeded ${postCount} posts (Photos, Memes, Reels) and ${createdUsers.length} users!`);
}

seed()
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
