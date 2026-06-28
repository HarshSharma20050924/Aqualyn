import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { User, Chat, Message, Folder, ThemeSettings, Post, Collection, Story, Notification } from '../types';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL, ENDPOINTS } from '../config/api';

export type ToastType = 'success' | 'error' | 'info';
export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  avatar?: string;
  title?: string;
}

export interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  socket: Socket | null;
  chats: Chat[];
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
  messages: Record<string, Message[]>;
  setMessages: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>;
  contacts: User[];
  sendMessage: (chatId: string, text: string, options?: Partial<Message>) => void;
  editMessage: (chatId: string, messageId: string, newText: string) => void;
  deleteMessage: (chatId: string, messageId: string, scope?: 'me' | 'everyone') => void;
  addReaction: (chatId: string, messageId: string, emoji: string) => void;
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  // ID of the chat that launched the contact profile, used for back navigation
  originChatId: string | null;
  setOriginChatId: (id: string | null) => void;
  activeContactId: string | null;
  setActiveContactId: (id: string | null) => void;
  typingUsers: Record<string, string[]>;
  setTyping: (chatId: string, isTyping: boolean) => void;
  logout: () => void;
  toasts: Toast[];
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isFetchingData: boolean;
  folders: Folder[];
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>;
  createFolder: (name: string, chatIds?: string[]) => string;
  deleteFolder: (folderId: string) => void;
  addChatToFolder: (chatId: string, folderId: string) => void;
  theme: ThemeSettings;
  setTheme: React.Dispatch<React.SetStateAction<ThemeSettings>>;
  aquaIntensity: number;
  setAquaIntensity: (val: number) => void;
  archiveChat: (chatId: string) => void;
  pinChat: (chatId: string) => void;
  muteChat: (chatId: string) => void;
  deleteChat: (chatId: string, scope?: 'me' | 'everyone') => void;
  clearHistory: (chatId: string) => void;
  blockContact: (contactId: string) => void;
  reportContact: (contactId: string) => void;
  markAsRead: (chatId: string) => void;
  appLockPin: string | null;
  setAppLockPin: (pin: string | null) => void;
  archiveLockPin: string | null;
  setArchiveLockPin: (pin: string | null) => void;
  isAppLocked: boolean;
  setIsAppLocked: (locked: boolean) => void;
  stories: Story[];
  setStories: React.Dispatch<React.SetStateAction<Story[]>>;
  addStory: (story: Partial<Story>) => void;
  deleteStory: (storyId: string) => Promise<void>;
  addStoryComment: (storyId: string, text: string) => void;
  addContact: (name: string, phone: string, id: string, avatar?: string) => void;
  startChatWithContact: (contactId: string) => void;
  createGroupChat: (name: string, members: string[], options?: { description?: string; adminOnly?: boolean; disappearingMessages?: boolean }) => void;
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  addPost: (post: Partial<Post>) => void;
  deletePost: (postId: string) => Promise<void>;
  likePost: (postId: string) => void;
  commentPost: (postId: string, text: string) => void;
  deleteComment: (postId: string, commentId: string) => Promise<void>;
  pinComment: (postId: string, commentId: string) => Promise<void>;
  followUser: (userId: string) => void;
  unfollowUser: (userId: string) => void;
  acceptFollowRequest: (userId: string) => void;
  rejectFollowRequest: (userId: string) => void;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  globalUsers: User[];
  setGlobalUsers: React.Dispatch<React.SetStateAction<User[]>>;
  archivePost: (postId: string) => void;
  pinPost: (postId: string) => void;
  savePost: (postId: string) => void;
  createCollection: (name: string) => void;
  addPostToCollection: (postId: string, collectionId: string) => void;
  updateStorySettings: (settings: Partial<User['storySettings']>) => void;
  toggleCloseFriend: (userId: string) => void;
  syncContacts: () => Promise<void>;
  updateSettings: (settings: any) => Promise<any>;
  updatePrivacy: (privacy: any) => Promise<void>;
  requestSecretChat: (targetUserId: string) => Promise<void>;
  handleSecretChatInvitation: (chatId: string, action: 'accept' | 'decline') => Promise<void>;
  handleGroupInvitation: (chatId: string, action: 'accept' | 'decline') => Promise<void>;
  fetchInitialData: () => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}
