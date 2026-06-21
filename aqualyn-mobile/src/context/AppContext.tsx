import React, { useState, ReactNode, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { User, Chat, Message, Folder, ThemeSettings, Post, Story, Notification } from '../types';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL, ENDPOINTS } from '../config/api';
import { apiFetch } from '../utils/fetcher';
import { AppContext, Toast, ToastType } from './AppContextType';
import { useAppActions } from './useAppActions';

const defaultUser: User | null = null;
const initialChats: Chat[] = [];
const initialMessages: Record<string, Message[]> = {};
const initialContacts: User[] = [];

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(defaultUser);
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [messages, setMessages] = useState<Record<string, Message[]>>(initialMessages);
  const [contacts, setContacts] = useState<User[]>(initialContacts);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [appLockPin, setAppLockPin] = useState<string | null>(null);
  const [archiveLockPin, setArchiveLockPin] = useState<string | null>(null);
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [theme, setTheme] = useState<ThemeSettings>({ mode: 'light', accentColor: '#0891b2', bubbleStyle: 'rounded', fontSize: 16 });
  const [aquaIntensity, setAquaIntensity] = useState(50);
  const [stories, setStories] = useState<Story[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [globalUsers, setGlobalUsers] = useState<User[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);

  const activeChatIdRef = useRef<string | null>(null);
  const currentUserRef = useRef<User | null>(null);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
    currentUserRef.current = currentUser;
  }, [activeChatId, currentUser]);

  const addToast = (message: string, type: ToastType, options?: { avatar?: string; title?: string }) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type, ...options }]);
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const actions = useAppActions(
    currentUser, setCurrentUser, socket, chats, setChats, messages, setMessages,
    contacts, setContacts, setStories, setPosts, setNotifications,
    globalUsers, setGlobalUsers, folders, setFolders, addToast,
    setActiveChatId, activeChatId
  );

  const fetchInitialData = async () => {
    setIsFetchingData(true);
    try {
      console.log("[Data] Fetching initial dashboard data...");
      const [notifRes, activityRes, chatsRes, feedRes, storyRes] = await Promise.all([
        apiFetch(ENDPOINTS.NOTIFICATIONS).catch(() => ({ ok: false })),
        apiFetch(ENDPOINTS.ACTIVITY_FEED).catch(() => ({ ok: false })),
        apiFetch(ENDPOINTS.CHATS).catch(() => ({ ok: false })),
        apiFetch(ENDPOINTS.FEED).catch(() => ({ ok: false })),
        apiFetch(ENDPOINTS.STORIES).catch(() => ({ ok: false }))
      ]);

      if (currentUser?.id) {
        const [followersRes, followingRes] = await Promise.all([
          apiFetch(ENDPOINTS.GET_FOLLOWERS(currentUser.id)).catch(() => ({ ok: false })),
          apiFetch(ENDPOINTS.GET_FOLLOWING(currentUser.id)).catch(() => ({ ok: false }))
        ]);
        const followers = followersRes.ok ? await (followersRes as Response).json() : [];
        const following = followingRes.ok ? await (followingRes as Response).json() : [];
        const allConnections = [...followers, ...following];
        
        // Remove duplicates and add to globalUsers
        const uniqueConnections = Array.from(new Map(allConnections.map((u: any) => [u.id, u])).values());
        setGlobalUsers(prev => {
          const map = new Map(prev.map(u => [u.id, u]));
          uniqueConnections.forEach((u: any) => {
            if (!map.has(u.id)) map.set(u.id, {
              id: u.id, name: u.displayName || u.username || 'Aqualyn User',
              displayName: u.displayName, username: u.username,
              avatar: u.avatar || `https://ui-avatars.com/api/?background=random&name=${u.username || 'U'}`,
              role: 'Aqualyn User', email: '', bio: u.bio || 'Hey there! I am using Aqualyn.',
              largeAvatar: u.largeAvatar || u.avatar
            });
          });
          return Array.from(map.values());
        });
      }

      const mapPost = (p: any): Post => ({
        ...p,
        userName: p.author?.displayName || p.author?.username || 'User',
        userAvatar: p.author?.avatar,
        caption: p.content || '',
        likes: p.likes?.map((l: any) => l.userId).filter(Boolean) || [],
        comments: p.comments?.map((c: any) => ({
          id: c.id, userId: c.userId,
          userName: c.user?.displayName || c.user?.username || 'User',
          userAvatar: c.user?.avatar, text: c.content || '',
          timestamp: c.createdAt ? new Date(c.createdAt).toLocaleString() : 'Just now'
        })) || [],
        timestamp: p.createdAt ? new Date(p.createdAt).toLocaleString() : 'Just now'
      });

      let mergedNotifs: any[] = [];
      if (notifRes.ok) {
        const nData = await (notifRes as Response).json();
        if (Array.isArray(nData)) mergedNotifs = [...nData];
      }
      if (activityRes.ok) {
        const aData = await (activityRes as Response).json();
        if (Array.isArray(aData)) {
          // Normalize activity to look like notification for the screen
          const mappedActivities = aData.map(a => ({
            ...a,
            type: a.type.toLowerCase()
          }));
          mergedNotifs = [...mergedNotifs, ...mappedActivities];
        }
      }
      // Sort combined array by createdAt descending
      mergedNotifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(mergedNotifs);
      if (chatsRes.ok) {
        const cData = await (chatsRes as Response).json();
        if (Array.isArray(cData)) setChats(cData);
      }
      if (feedRes.ok) {
        const feedData = await (feedRes as Response).json();
        if (Array.isArray(feedData)) setPosts(feedData.map(mapPost));
      }
      if (storyRes.ok) {
        const storyData = await (storyRes as Response).json();
        if (Array.isArray(storyData)) {
          setStories(storyData.map((s: any) => ({
            ...s,
            userName: s.user?.displayName || s.user?.username || 'User',
            userAvatar: s.user?.avatar,
            createdAt: s.createdAt,
            timestamp: s.createdAt ? new Date(s.createdAt).toLocaleString() : 'Just now'
          })));
        }
      }
    } catch (e) {
      console.error("[Data] Initial fetch failed:", e);
    } finally {
      setIsFetchingData(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const bootstrap = async () => {
      try {
        // Check if user explicitly logged out — skip auto-login
        const explicitLogout = await AsyncStorage.getItem('explicit_logout').catch(() => null);
        if (explicitLogout === '1') {
          await AsyncStorage.removeItem('explicit_logout').catch(() => {});
          console.log('[Auth] Explicit logout detected — skipping bootstrap sync.');
          if (isMounted) setIsLoading(false);
          return;
        }

        console.log("[Auth] Starting bootstrap sync...");
        const res = await apiFetch(ENDPOINTS.AUTH_SYNC, {
          method: 'POST',
          body: JSON.stringify({})
        });

        if (res.ok && isMounted) {
          const data = await res.json();
          const syncedUser = data.user;
          if (!syncedUser || data.status === 'needs_profile') {
            setIsLoading(false);
            return;
          }

          console.log("[Auth] Sync successful for:", syncedUser.username);
          const mappedUser = {
            ...syncedUser,
            following: syncedUser.following?.map((f: any) => f.followingId || f.userId).filter(Boolean) || [],
            followers: syncedUser.followers?.map((f: any) => f.followerId || f.userId).filter(Boolean) || [],
          };
          setCurrentUser(mappedUser);
        } else if (isMounted && res.status === 401) {
          // Stale JWT — clear local token and cookie via logout
          console.log("[Auth] Session invalid (401) — clearing stale session...");
          await apiFetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST' }).catch(() => {});
          await AsyncStorage.removeItem('auth_token').catch(() => {});
          setCurrentUser(null);
        }
      } catch (e) {
        console.error("[Auth] Background bootstrap failed:", e);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    bootstrap();
    return () => { isMounted = false; };
  }, []);

  const dataFetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (currentUser && dataFetchedRef.current !== currentUser.id) {
      fetchInitialData();
      dataFetchedRef.current = currentUser.id;
    } else if (!currentUser) {
      dataFetchedRef.current = null;
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      const newSocket = io(API_BASE_URL, { withCredentials: true });
      newSocket.on('connect', () => {
        if (currentUser?.id) newSocket.emit('join', currentUser.id);
      });
      newSocket.on('receive_message', (msg: Message) => {
        setMessages(prev => ({ ...prev, [msg.chatId]: [...(prev[msg.chatId] || []), msg] }));
        setChats(prev => {
          const chatIdx = prev.findIndex(c => c.id === msg.chatId);
          if (chatIdx !== -1) {
            const chat = { ...prev[chatIdx], lastMessage: msg.text, lastMessageTime: msg.timestamp || 'Just now' };
            chat.unreadCount = (chat.unreadCount || 0) + (activeChatIdRef.current === msg.chatId ? 0 : 1);
            return [chat, ...prev.filter(c => c.id !== msg.chatId)];
          } else {
            const chatData = (msg as any).chat;
            const sender = (msg as any).sender;
            const newChat: Chat = {
              id: msg.chatId,
              name: chatData?.name || sender?.displayName || sender?.username || 'User',
              avatar: chatData?.avatar || sender?.avatar || `https://ui-avatars.com/api/?background=random&name=${msg.senderId}`,
              lastMessage: msg.text, lastMessageTime: msg.timestamp || 'Just now', unreadCount: 1,
              isGroup: chatData?.isGroup || false,
              isSecret: chatData?.isSecret || false,
              participantIds: [currentUserRef.current?.id as string, msg.senderId].filter(Boolean)
            };
            setGlobalUsers(gu => gu.some(u => u.id === msg.senderId) ? gu : [...gu, {
              id: msg.senderId, name: sender?.displayName || sender?.username || 'User',
              displayName: sender?.displayName, username: sender?.username,
              avatar: sender?.avatar, role: 'Aqualyn User', email: '', bio: 'Hey there! I am using Aqualyn.',
              largeAvatar: sender?.avatar,
            }]);
            return [newChat, ...prev];
          }
        });

        // Native Alert Management implementation mimicking logic
        if (activeChatIdRef.current !== msg.chatId) {
          const senderName = (msg as any).sender?.displayName || (msg as any).sender?.username || 'Someone';
          const msgText = msg.text || 'Sent an attachment';

          addToast(msgText, 'info', {
            title: senderName,
            avatar: (msg as any).sender?.avatar
          });
        }
      });
      newSocket.on('message_sent_ack', (msg: Message) => {
        setMessages(prev => {
          const list = prev[msg.chatId] || [];
          const idx = list.findLastIndex(m => m.id.startsWith('temp-'));
          if (idx !== -1) {
            const newList = [...list];
            newList[idx] = msg;
            return { ...prev, [msg.chatId]: newList };
          }
          return { ...prev, [msg.chatId]: [...list, msg] };
        });
        setChats(prev => prev.map(c => c.id === msg.chatId ? { ...c, lastMessage: msg.text, lastMessageTime: msg.timestamp } : c));
      });
      newSocket.on('message_delivered', ({ messageId, chatId }) => {
        setMessages(prev => ({
          ...prev,
          [chatId]: (prev[chatId] || []).map(m => m.id === messageId ? { ...m, status: 'delivered' } : m)
        }));
      });
      newSocket.on('user_typing', (data: { chatId: string, userId: string, userName: string, isTyping: boolean }) => {
        setTypingUsers(prev => {
          const current = prev[data.chatId] || [];
          if (data.isTyping && !current.includes(data.userName)) return { ...prev, [data.chatId]: [...current, data.userName] };
          if (!data.isTyping) return { ...prev, [data.chatId]: current.filter(u => u !== data.userName) };
          return prev;
        });
      });
      newSocket.on('new_notification', (notif: Notification) => {
        setNotifications(prev => [notif, ...prev]);
        addToast(notif.text || 'New activity in your profile', 'info');
      });
      newSocket.on('message_edited', ({ chatId, messageId, newText }) => {
        setMessages(prev => ({ ...prev, [chatId]: (prev[chatId] || []).map(m => m.id === messageId ? { ...m, text: newText, isEdited: true } : m) }));
      });
      newSocket.on('message_reacted', ({ chatId, messageId, emoji, userId }) => {
        setMessages(prev => ({
          ...prev, [chatId]: (prev[chatId] || []).map(m => {
            if (m.id === messageId) {
              const reactions = { ...(m.reactions || {}) };
              const userReactions = reactions[emoji] || [];
              reactions[emoji] = userReactions.includes(userId) ? userReactions.filter(id => id !== userId) : [...userReactions, userId];
              if (reactions[emoji].length === 0) delete reactions[emoji];
              return { ...m, reactions };
            }
            return m;
          })
        }));
      });
      newSocket.on('message_deleted', ({ chatId, messageId }) => {
        setMessages(prev => ({ ...prev, [chatId]: (prev[chatId] || []).filter(m => m.id !== messageId) }));
      });
      newSocket.on('chat_updated', (updatedChat: Chat) => {
        setChats(prev => prev.map(c => {
          if (c.id === updatedChat.id) {
            return {
              ...c,
              settings: (updatedChat as any).settings || c.settings,
              selfDestructTimer: updatedChat.selfDestructTimer ?? c.selfDestructTimer
            };
          }
          return c;
        }));
      });
      newSocket.on('chat_invitation', (data: { chatId: string, inviterName: string, inviterId: string }) => {
        addToast(`${data.inviterName} invited you to join a chat!`, 'info');
        setNotifications(prev => [{
          id: `inv-${Date.now()}`, userId: currentUser.id, actorId: data.inviterId, sourceUserId: data.inviterId,
          sourceUserName: data.inviterName, sourceUserAvatar: `https://ui-avatars.com/api/?background=random&name=${data.inviterName}`,
          type: 'chat_invitation', targetId: data.chatId, text: `${data.inviterName} invited you to a chat. Join to create a temporary group.`,
          isRead: false, read: false, createdAt: new Date().toISOString()
        }, ...prev]);
      });

      newSocket.on('receive_new_post', (data: { post: Post }) => {
        setPosts(prev => [data.post, ...prev]);
      });

      newSocket.on('receive_post_like', (data: { postId: string, userId: string, liked: boolean }) => {
        setPosts(prev => prev.map(p => {
          if (p.id === data.postId) {
            const likes = [...p.likes];
            const newLikes = data.liked
              ? (likes.includes(data.userId) ? likes : [...likes, data.userId])
              : likes.filter(id => id !== data.userId);
            return { ...p, likes: newLikes };
          }
          return p;
        }));
      });

      newSocket.on('receive_post_comment', (data: { postId: string, comment: any }) => {
        setPosts(prev => prev.map(p => {
          if (p.id === data.postId) {
            return {
              ...p, comments: [...(p.comments || []), data.comment]
            };
          }
          return p;
        }));
      });
      newSocket.on('messages_seen', ({ chatId, userId }) => {
        setMessages(prev => ({ ...prev, [chatId]: (prev[chatId] || []).map(m => m.senderId !== userId ? { ...m, status: 'seen' } : m) }));
      });

      newSocket.on('receive_new_story', (data: { story: any }) => {
        const mappedStory = {
          ...data.story,
          userName: data.story.user?.displayName || data.story.user?.username || 'User',
          userAvatar: data.story.user?.avatar,
          timestamp: new Date(data.story.createdAt).toLocaleString()
        };
        setStories(prev => [mappedStory, ...prev.filter(s => s.id !== mappedStory.id)]);
      });

      newSocket.on('receive_new_post', (data: { post: any }) => {
        setPosts(prev => [data.post, ...prev.filter(p => p.id !== data.post.id)]);
      });
      newSocket.on('chat_joined', (newGroupChat: Chat) => {
        setChats(prev => [newGroupChat, ...prev]);
        addToast('Joined temporary group chat', 'success');
      });
      newSocket.on('chat_deleted', ({ chatId }: { chatId: string }) => {
        setChats(prev => prev.filter(c => c.id !== chatId));
        if (activeChatIdRef.current === chatId) setActiveChatId(null);
      });
      newSocket.on('chat_invitation', (data: { chatId: string, inviterId: string, inviterName: string }) => {
        console.log("[Chat] Received real-time chat invitation:", data);
        fetchInitialData();
        addToast(`New invitation from ${data.inviterName}!`, 'info');
      });
      newSocket.on('receive_new_story', () => {
        console.log("[Social] Story update received");
        fetchInitialData();
        addToast('New story shared!', 'info');
      });
      newSocket.on('receive_new_post', () => {
        console.log("[Social] Post update received");
        fetchInitialData();
        addToast('New post in your feed!', 'info');
      });
      setSocket(newSocket);
      return () => { newSocket.close(); setSocket(null); };
    }
  }, [currentUser]);

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser, socket, chats, setChats, messages, setMessages, contacts, fetchInitialData, ...actions,
      activeChatId, setActiveChatId, activeContactId, setActiveContactId,
      toasts, addToast, removeToast, isLoading, setIsLoading, isFetchingData,
      folders, setFolders, theme, setTheme, aquaIntensity, setAquaIntensity,
      appLockPin, setAppLockPin, archiveLockPin, setArchiveLockPin, isAppLocked, setIsAppLocked,
      stories, setStories, typingUsers, logout: actions.logout,
      posts, setPosts, notifications, setNotifications, globalUsers, setGlobalUsers
    }}>
      {children}
    </AppContext.Provider>
  );
}

export { useAppContext } from './AppContextType';