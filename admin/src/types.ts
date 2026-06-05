export interface User {
  id: string;
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  role?: string;
  avatar?: string;
  largeAvatar?: string;
  bio?: string;
  isBanned?: boolean;
}

export interface Chat {
  id: string;
  name: string;
  participants: any[];
  isSecret?: boolean;
  isGroup?: boolean;
  disappearingMessages?: boolean;
  selfDestructTimer?: number;
  lastMessage?: string;
  avatar?: string;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  imageUrl?: string;
  caption?: string;
  likes: string[];
  comments: any[];
  isPinned?: boolean;
  timestamp?: string;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  chatId: string;
}
