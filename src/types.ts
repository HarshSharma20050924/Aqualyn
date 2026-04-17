export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  imageUrl?: string;
  videoUrl?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  caption: string;
  text?: string;
  likes: string[];
  comments: { id: string; userId: string; userName: string; userAvatar: string; text: string; timestamp: string }[];
  timestamp: string;
  isArchived?: boolean;
  isPinned?: boolean;
}

export interface Collection {
  id: string;
  name: string;
  postIds: string[];
  coverImageUrl?: string;
}

export interface User {
  id: string;
  name?: string;
  displayName?: string;
  username: string;
  role: string;
  email: string;
  bio: string;
  avatar: string;
  largeAvatar: string;
  isPrivate?: boolean;
  followers?: string[];
  following?: string[];
  sentFollowReqs?: any[];
  receivedFollowReqs?: any[];
  followRequests?: any[]; // Keep for legacy screens
  blockedUsers?: string[];
  reportedUsers?: string[];
  phone?: string;
  showPhoneTo?: 'everyone' | 'followers' | 'close_friends' | 'no_one';
  searchByPhone?: boolean;
  savedPostIds?: string[];
  collections?: Collection[];
  closeFriends?: string[];
  storySettings?: {
    hideStoryFrom?: string[];
    allowReplies?: 'everyone' | 'following' | 'off';
  };
  invitationSettings?: 'everyone' | 'mutual' | 'no_one';
}

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  timestamp: string;
  expiresAt: string;
  views: number;
  reactions: Record<string, number>;
  isCloseFriends?: boolean;
  stickers?: any[];
  viewers?: string[];
  content?: string;
}

export interface Notification {
  id: string;
  userId: string;
  actorId: string;
  type: string;
  targetId?: string;
  text?: string;
  isRead: boolean;
  createdAt: string;
  actor?: Partial<User>;
  // Support for older frontend code
  sourceUserId?: string;
  sourceUserName?: string;
  sourceUserAvatar?: string;
  read?: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  fileUrl?: string;
  document?: { url: string; name: string; size: string };
  location?: { lat: number; lng: number; address: string };
  contact?: { name: string; phone: string; avatar?: string };
  payment?: { amount: number; currency: string; status: string };
  schedule?: { title: string; time: string; location?: string };
  wallet?: { asset: string; amount: number; address: string; type: 'send' | 'request' };
  replyToId?: string;
  reactions?: Record<string, string[]>;
  timestamp: string;
  isRead: boolean;
  isEdited?: boolean;
  status?: 'sent' | 'delivered' | 'seen';
  deletedFor?: string[];
}

export interface Chat {
  id: string;
  name: string;
  isGroup?: boolean;
  isSecret?: boolean;
  selfDestructTimer?: number;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
  isSystem?: boolean;
  isVoice?: boolean;
  participantIds?: string[];
  description?: string;
  adminOnly?: boolean;
  disappearingMessages?: boolean;
  isTempGroup?: boolean;
  originalChatId?: string;
}

export interface Folder {
  id: string;
  name: string;
  chatIds: string[];
  icon?: string;
}

export interface ThemeSettings {
  mode: 'light' | 'dark';
  accentColor: string;
  wallpaper?: string;
  bubbleStyle: 'rounded' | 'sharp' | 'glass';
  fontSize: number;
}
