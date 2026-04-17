import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { User, Chat, Message, Folder, ThemeSettings, Post, Collection, Story, Notification } from '../types';
import { io, Socket } from 'socket.io-client';
import { auth } from '../config/firebase';
import { API_BASE_URL, ENDPOINTS } from '../config/api';

export type ToastType = 'success' | 'error' | 'info';
export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
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
  addStoryComment: (storyId: string, text: string) => void;
  addContact: (name: string, phone: string, id: string, avatar?: string) => void;
  startChatWithContact: (contactId: string) => void;
  createGroupChat: (name: string, members: string[], options?: { description?: string; adminOnly?: boolean; disappearingMessages?: boolean }) => void;
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  addPost: (post: Partial<Post>) => void;
  likePost: (postId: string) => void;
  commentPost: (postId: string, text: string) => void;
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
  getToken: () => Promise<string | null>;
}



const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultUser: User | null = null;

const initialChats: Chat[] = [];

const initialMessages: Record<string, Message[]> = {};

const initialContacts: User[] = [];

// globalUsers is now managed as state inside AppProvider

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(defaultUser);
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [messages, setMessages] = useState<Record<string, Message[]>>(initialMessages);
  const [contacts, setContacts] = useState<User[]>(initialContacts);
  const [globalUsers, setGlobalUsers] = useState<User[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const activeChatIdRef = useRef<string | null>(null);
  const currentUserRef = useRef<User | null>(null);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
    currentUserRef.current = currentUser;
  }, [activeChatId, currentUser]);

  // 🛡️ TOKEN MANAGEMENT: Centralized & Reliable
  const getToken = async (): Promise<string | null> => {
    try {
      const user = auth.currentUser;
      return user ? await user.getIdToken() : null;
    } catch (e) {
      console.error("[Auth] Token retrieval failed:", e);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: any) => {

        // 1. GUEST/OUT STATE
        if (!firebaseUser) {
            if (isMounted) {
                setCurrentUser(null);
                setIsLoading(false);
            }
            return;
        }

        // 2. AUTH SYNC LOOP
        try {
            const idToken = await firebaseUser.getIdToken();
            if (!idToken) {
                if (isMounted) setIsLoading(false);
                return;
            }

            const res = await fetch(ENDPOINTS.AUTH_SYNC, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({})
            });

            if (res.ok && isMounted) {
                const data = await res.json();
                const syncedUser = data.user;
                
                const mappedUser = {
                    ...syncedUser,
                    following: syncedUser.following?.map((f: any) => f.followingId) || [],
                    followers: syncedUser.followers?.map((f: any) => f.followerId) || [],
                };
                
                setCurrentUser(mappedUser);

                // Parallel Bootstrapping
                const headers = { 'Authorization': `Bearer ${idToken}` };
                const [notifRes, chatsRes, feedRes, storyRes] = await Promise.all([
                    fetch(ENDPOINTS.NOTIFICATIONS, { headers }),
                    fetch(ENDPOINTS.CHATS, { headers }),
                    fetch(ENDPOINTS.FEED, { headers }),
                    fetch(ENDPOINTS.STORIES, { headers })
                ]);

                const mapPost = (p: any): Post => ({
                    ...p,
                    userName: p.author?.displayName || p.author?.username || 'User',
                    userAvatar: p.author?.avatar,
                    caption: p.content,
                    likes: p.likes?.map((l: any) => l.userId) || [],
                    comments: p.comments?.map((c: any) => ({
                        id: c.id,
                        userId: c.userId,
                        userName: c.user?.displayName || c.user?.username || 'User',
                        userAvatar: c.user?.avatar,
                        text: c.content,
                        timestamp: new Date(c.createdAt).toLocaleString()
                    })) || [],
                    timestamp: new Date(p.createdAt).toLocaleString()
                });

                if (notifRes.ok) setNotifications(await notifRes.json());
                if (chatsRes.ok) setChats(await chatsRes.json());
                if (feedRes.ok) {
                    const feedData = await feedRes.json();
                    setPosts(feedData.map(mapPost));
                }
                if (storyRes.ok) {
                    const storyData = await storyRes.json();
                    setStories(storyData.map((s: any) => ({
                        ...s,
                        userName: s.user?.displayName || s.user?.username || 'User',
                        userAvatar: s.user?.avatar,
                        timestamp: new Date(s.createdAt).toLocaleString()
                    })));
                }
            } else if (isMounted) {
                // If sync fails, don't leave user in loading limbo
                if (res.status === 401) {
                    await auth.signOut();
                    setCurrentUser(null);
                }
            }
        } catch (e) {
            console.error("[Auth] Background sync failed:", e);
        } finally {
            if (isMounted) setIsLoading(false);
        }
    });

    return () => {
        isMounted = false;
        unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      const newSocket = io(API_BASE_URL);
      
      newSocket.on('connect', () => {
         console.log('Socket Connected');
         newSocket.emit('join', currentUser.id);
      });

      newSocket.on('receive_message', (msg: Message) => {
         // Update messages
         setMessages(prev => ({
            ...prev,
            [msg.chatId]: [...(prev[msg.chatId] || []), msg]
         }));

         // Update or add chat
         setChats(prev => {
            const chatIdx = prev.findIndex(c => c.id === msg.chatId);
            if (chatIdx !== -1) {
               const chat = { ...prev[chatIdx] };
               chat.lastMessage = msg.text;
               chat.lastMessageTime = msg.timestamp || 'Just now';
               chat.unreadCount = (chat.unreadCount || 0) + (activeChatIdRef.current === msg.chatId ? 0 : 1);
               
               const otherChats = prev.filter(c => c.id !== msg.chatId);
               return [chat, ...otherChats];
            } else {
               // Add new chat
               const newChat: Chat = {
                  id: msg.chatId,
                  name: (msg as any).sender?.displayName || (msg as any).sender?.username || 'User', 
                  avatar: (msg as any).sender?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${msg.senderId}`,
                  lastMessage: msg.text,
                  lastMessageTime: msg.timestamp || 'Just now',
                  unreadCount: 1,
                  isGroup: false,
                  participantIds: [currentUserRef.current?.id as string, msg.senderId].filter(Boolean)
               };
               
               // Also ensure the user is in globalUsers so we can view their profile
               setGlobalUsers(gu => {
                  if (gu.some(u => u.id === msg.senderId)) return gu;
                  const newUser: User = {
                     id: msg.senderId,
                     name: (msg as any).sender?.displayName || (msg as any).sender?.username || 'User',
                     displayName: (msg as any).sender?.displayName,
                     username: (msg as any).sender?.username,
                     avatar: (msg as any).sender?.avatar,
                     role: 'Aqualyn User',
                     email: '',
                     bio: 'Hey there! I am using Aqualyn.',
                     largeAvatar: (msg as any).sender?.avatar,
                  };
                  return [...gu, newUser];
               });

               return [newChat, ...prev];
            }
         });
      });
      newSocket.on('message_sent_ack', (msg: Message) => {
         // Replace temp message or just update chat
         setMessages(prev => {
            const list = prev[msg.chatId] || [];
            let idx = -1;
            for (let i = list.length - 1; i >= 0; i--) {
               if (list[i].id.startsWith('temp-')) {
                  idx = i;
                  break;
               }
            }
            if (idx !== -1) {
              const newList = [...list];
              newList[idx] = msg;
              return { ...prev, [msg.chatId]: newList };
            }
            return { ...prev, [msg.chatId]: [...list, msg] };
         });
         setChats(prev => prev.map(c => c.id === msg.chatId ? {
            ...c,
            lastMessage: msg.text,
            lastMessageTime: msg.timestamp
         } : c));
      });
      newSocket.on('user_typing', (data: { chatId: string, userId: string, userName: string, isTyping: boolean }) => {
         setTypingUsers(prev => {
            const current = prev[data.chatId] || [];
            if (data.isTyping) {
               if (!current.includes(data.userName)) return { ...prev, [data.chatId]: [...current, data.userName] };
            } else {
               return { ...prev, [data.chatId]: current.filter(u => u !== data.userName) };
            }
            return prev;
         });
      });
      newSocket.on('new_notification', (notif: Notification) => {
          setNotifications(prev => [notif, ...prev]);
          addToast(notif.text || 'New activity in your profile', 'info');
      });
      newSocket.on('message_edited', ({ chatId, messageId, newText }) => {
         setMessages(prev => {
            const list = prev[chatId] || [];
            return {
               ...prev,
               [chatId]: list.map(m => m.id === messageId ? { ...m, text: newText, isEdited: true } : m)
            };
         });
      });

      newSocket.on('message_reacted', ({ chatId, messageId, emoji, userId }) => {
         setMessages(prev => {
            const list = prev[chatId] || [];
            return {
               ...prev,
               [chatId]: list.map(m => {
                  if (m.id === messageId) {
                     const reactions = { ...(m.reactions || {}) };
                     const userReactions = reactions[emoji] || [];
                     if (userReactions.includes(userId)) {
                        // Toggle OFF
                        reactions[emoji] = userReactions.filter(id => id !== userId);
                        if (reactions[emoji].length === 0) delete reactions[emoji];
                     } else {
                        // Toggle ON
                        reactions[emoji] = [...userReactions, userId];
                     }
                     return { ...m, reactions };
                  }
                  return m;
               })
            };
         });
      });

      newSocket.on('message_deleted', ({ chatId, messageId }) => {
          setMessages(prev => ({
             ...prev,
             [chatId]: (prev[chatId] || []).filter(m => m.id !== messageId)
          }));
       });
       
       newSocket.on('chat_invitation', (data: { chatId: string, inviterName: string, inviterId: string }) => {
          addToast(`${data.inviterName} invited you to join a chat!`, 'info');
          setNotifications(prev => [{
            id: `inv-${Date.now()}`,
            userId: currentUser.id,
            actorId: data.inviterId,
            sourceUserId: data.inviterId,
            sourceUserName: data.inviterName,
            sourceUserAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=${data.inviterName}`,
            type: 'chat_invitation',
            targetId: data.chatId,
            text: `${data.inviterName} invited you to a chat. Join to create a temporary group.`,
            isRead: false,
            read: false,
            createdAt: new Date().toISOString()
          }, ...prev]);
       });

       newSocket.on('messages_seen', ({ chatId, userId }) => {
          setMessages(prev => {
             const list = prev[chatId] || [];
             return {
                ...prev,
                [chatId]: list.map(m => m.senderId !== userId ? { ...m, status: 'seen' } : m)
             };
          });
       });

       newSocket.on('chat_joined', (newGroupChat: Chat) => {
          setChats(prev => [newGroupChat, ...prev]);
          addToast('Joined temporary group chat', 'success');
       });

       newSocket.on('chat_deleted', ({ chatId }: { chatId: string }) => {
          setChats(prev => prev.filter(c => c.id !== chatId));
          if (activeChatIdRef.current === chatId) setActiveChatId(null);
       });

       newSocket.on('message_reacted', ({ chatId, messageId, emoji, userId }) => {
          setMessages(prev => {
             const list = prev[chatId] || [];
             return {
                ...prev,
                [chatId]: list.map(m => {
                   if (m.id === messageId) {
                      const reactions = { ...(m.reactions || {}) };
                      const userIds = reactions[emoji] || [];
                      if (userIds.includes(userId)) {
                         reactions[emoji] = userIds.filter(id => id !== userId);
                         if (reactions[emoji].length === 0) delete reactions[emoji];
                      } else {
                         reactions[emoji] = [...userIds, userId];
                      }
                      return { ...m, reactions };
                   }
                   return m;
                })
             };
          });
       });

       newSocket.on('message_edited', ({ chatId, messageId, newText }) => {
          setMessages(prev => {
             const list = prev[chatId] || [];
             return {
                ...prev,
                [chatId]: list.map(m => m.id === messageId ? { ...m, text: newText, isEdited: true } : m)
             };
          });
       });

       newSocket.on('message_deleted', ({ chatId, messageId }) => {
          setMessages(prev => ({
             ...prev,
             [chatId]: (prev[chatId] || []).filter(m => m.id !== messageId)
          }));
       });

       newSocket.on('receive_new_story', (data) => {
          // We could refetch stories or just add it if it's new
          // For now, let's just trigger a toast if it's someone we care about
          addToast('New story shared!', 'info');
       });

       setSocket(newSocket);
      return () => {
         newSocket.close();
         setSocket(null);
      };
    }
  }, [currentUser]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [theme, setTheme] = useState<ThemeSettings>({
    mode: 'light',
    accentColor: '#0891b2',
    bubbleStyle: 'rounded',
    fontSize: 16
  });
  const [aquaIntensity, setAquaIntensity] = useState(75);
  const [appLockPin, setAppLockPin] = useState<string | null>(null);
  const [archiveLockPin, setArchiveLockPin] = useState<string | null>(null);
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stories, setStories] = useState<Story[]>([]);

  const addStory = async (story: Partial<Story>) => {
    if (!currentUser) return;
    try {
      const idToken = await getToken();
      if (!idToken) return;

      const res = await fetch(ENDPOINTS.CREATE_STORY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          mediaUrl: story.mediaUrl,
          mediaType: story.mediaType || 'image',
          content: story.content
        })
      });
      if (res.ok) {
        const data = await res.json();
        setStories(prev => [data.story, ...prev]);
        addToast('Story posted!', 'success');
      }
    } catch (e) {
      console.error(e);
      addToast('Failed to post story', 'error');
    }
  };

  const addStoryComment = (storyId: string, text: string) => {
    addToast('Comment sent!', 'success');
    // In a real app, we'd add this to a separate state or backend
  };

  const addContact = (name: string, phone: string, id: string, avatar?: string) => {
    // Check if contact already exists
    if (contacts.find(c => c.id === id)) {
        addToast('Contact already added', 'error');
        return;
    }
    const newContact: User = {
      id,
      name,
      displayName: name,
      username: name.toLowerCase().replace(/\s+/g, '_'),
      role: 'Aqualyn User', 
      phone,
      email: '',
      bio: 'Hey there! I am using Aqualyn.',
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      largeAvatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
    };
    setContacts(prev => [...prev, newContact]);
    addToast('Added to contacts!', 'success');
  };

  const startChatWithContact = (contactId: string) => {
    if (!currentUser) return;
    
    const combinedId = [currentUser.id, contactId].sort().join('_');
    const existingChat = chats.find(c => c.id === combinedId);
    
    if (existingChat) {
      setActiveChatId(existingChat.id);
    } else {
      const contact = contacts.find(c => c.id === contactId) || globalUsers.find(c => c.id === contactId);
      if (!contact) return;
      
      const newChat: Chat = {
        id: combinedId,
        name: contact.displayName || contact.name || 'User',
        avatar: contact.avatar,
        lastMessage: '',
        lastMessageTime: 'Just now',
        unreadCount: 0,
        isGroup: false,
        participantIds: [currentUser.id, contact.id]
      };
      
      setChats(prev => [newChat, ...prev]);
      setMessages(prev => ({ ...prev, [newChat.id]: [] }));
      setActiveChatId(newChat.id);
    }
  };

  const createGroupChat = (name: string, members: string[], options?: { description?: string; adminOnly?: boolean; disappearingMessages?: boolean }) => {
    const newChatId = `g${Date.now()}`;
    const newChat: Chat = {
      id: newChatId,
      name,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`,
      lastMessage: 'Group created',
      lastMessageTime: 'Just now',
      unreadCount: 0,
      isGroup: true,
      participantIds: [currentUser?.id || 'me', ...members],
      description: options?.description,
      adminOnly: options?.adminOnly,
      disappearingMessages: options?.disappearingMessages,
    };

    setChats(prev => [newChat, ...prev]);
    setMessages(prev => ({
      ...prev,
      [newChatId]: [{
        id: `m${Date.now()}`,
        chatId: newChatId,
        text: `You created group "${name}"`,
        senderId: 'system',
        timestamp: 'Just now',
        isRead: true,
      }]
    }));
    setActiveChatId(newChatId);
    addToast('Group created successfully!', 'success');
  };

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const archiveChat = (chatId: string) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, isArchived: !c.isArchived } : c));
    addToast('Chat archived', 'info');
  };

  const pinChat = (chatId: string) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, isPinned: !c.isPinned } : c));
  };

  const muteChat = (chatId: string) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, isMuted: !c.isMuted } : c));
  };

  const deleteMessage = (chatId: string, messageId: string, scope: 'me' | 'everyone' = 'everyone') => {
    if (!socket) return;
    const chat = chats.find(c => c.id === chatId);
    const receiverId = chat?.participantIds?.find(id => id !== currentUser?.id) || chatId;

    if (scope === 'me') {
        socket.emit('delete_message_for_me', { messageId, userId: currentUser?.id });
        setMessages(prev => ({
            ...prev,
            [chatId]: (prev[chatId] || []).filter(m => m.id !== messageId)
        }));
    } else {
        socket.emit('delete_message_for_everyone', { chatId, messageId, receiverId });
        setMessages(prev => ({
            ...prev,
            [chatId]: (prev[chatId] || []).filter(m => m.id !== messageId)
        }));
    }
  };

  const deleteChat = (chatId: string, scope: 'me' | 'everyone' = 'me') => {
    if (!socket) return;
    if (scope === 'me') {
        socket.emit('delete_chat_for_me', { chatId, userId: currentUser?.id });
        addToast('Chat deleted for you', 'success');
    } else {
        const chat = chats.find(c => c.id === chatId);
        const receiverId = chat?.participantIds?.find(id => id !== currentUser?.id);
        socket.emit('delete_chat_for_everyone', { chatId, receiverId });
        addToast('Chat deleted for everyone', 'success');
    }
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (activeChatId === chatId) setActiveChatId(null);
  };

  const clearHistory = (chatId: string) => {
    setMessages(prev => ({ ...prev, [chatId]: [] }));
    addToast('History cleared', 'info');
  };
  
  const blockContact = (contactId: string) => {
    setCurrentUser(prev => {
      if (!prev) return prev;
      const blocked = prev.blockedUsers || [];
      if (blocked.includes(contactId)) {
        return { ...prev, blockedUsers: blocked.filter(id => id !== contactId) };
      }
      return { ...prev, blockedUsers: [...blocked, contactId] };
    });
    const isBlocked = currentUser?.blockedUsers?.includes(contactId);
    addToast(isBlocked ? 'Contact unblocked' : 'Contact blocked', 'info');
  };

  const reportContact = (contactId: string) => {
    addToast('Contact reported to Aqualyn safety team', 'success');
  };

  const markAsRead = (chatId: string) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, unreadCount: 0 } : c));
    if (socket) {
        socket.emit('mark_as_read', { chatId, userId: currentUser?.id });
    }
  };

  const createFolder = (name: string, chatIds: string[] = []) => {
    const folderExists = folders.some(f => f.name.toLowerCase() === name.trim().toLowerCase());
    if (folderExists) {
      addToast('A folder with this name already exists', 'error');
      return '';
    }
    const newFolderId = `f${Date.now()}`;
    const newFolder: Folder = {
      id: newFolderId,
      name: name.trim(),
      chatIds
    };
    setFolders(prev => [...prev, newFolder]);
    addToast(`Folder "${name.trim()}" created`, 'success');
    return newFolderId;
  };

  const deleteFolder = (folderId: string) => {
    setFolders(prev => prev.filter(f => f.id !== folderId));
    addToast('Folder deleted', 'info');
  };

  const addChatToFolder = (chatId: string, folderId: string) => {
    setFolders(prev => prev.map(f => {
      if (f.id === folderId) {
        if (f.chatIds.includes(chatId)) return f;
        return { ...f, chatIds: [...f.chatIds, chatId] };
      }
      return f;
    }));
    const folderName = folders.find(f => f.id === folderId)?.name;
    addToast(`Added to ${folderName}`, 'success');
  };

  const addToast = (message: string, type: ToastType) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const sendMessage = (chatId: string, text: string, options?: Partial<Message>) => {
    // Check if it's a 1-on-1 chat and if the target user is private
    const chat = chats.find(c => c.id === chatId);
    if (chat && !chat.isGroup) {
      const targetUserId = chat.participantIds?.find(id => id !== currentUser?.id);
      const targetUser = globalUsers.find(u => u.id === targetUserId);
      
      if (targetUser?.isPrivate && !currentUser?.following?.includes(targetUser.id)) {
        addToast(`You must be following ${targetUser.name} to send messages.`, 'error');
        return;
      }
    }

    const newMessage: Message = {
      id: `temp-${Date.now()}`,
      chatId,
      senderId: currentUser?.id as string,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
      ...options
    };
    
    setMessages(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), newMessage]
    }));

    // Optimistically update chat list too
    setChats(prev => prev.map(c => c.id === chatId ? {
       ...c, 
       lastMessage: text, 
       lastMessageTime: newMessage.timestamp 
    } : c));

    if (socket) {
       socket.emit('send_message', {
           chatId,
           senderId: currentUser?.id,
           receiverId: chat?.participantIds?.find(id => id !== currentUser?.id) || chatId,
           text,
            imageUrl: options?.imageUrl,
            videoUrl: options?.videoUrl,
            fileUrl: options?.fileUrl,
            audioUrl: options?.audioUrl,
            document: options?.document,
            location: options?.location,
            contact: options?.contact,
            payment: options?.payment,
            replyToId: options?.replyToId
        });
        // also stop typing on send
        socket.emit('typing', { chatId, userId: currentUser?.id, userName: currentUser?.displayName || currentUser?.username, isTyping: false });

        // Scan for @username invitations in 1-on-1 chats
        if (!chat?.isGroup) {
          const mentionMatch = text.match(/@(\w+)/);
          if (mentionMatch) {
            const username = mentionMatch[1];
            // Check if user exists (we'd ideally search globalUsers)
            const target = globalUsers.find(u => u.username === username);
            if (target) {
              // Mutual follow check for privacy (as requested)
              const isMutual = currentUser.following?.includes(target.id) && target.followers?.includes(currentUser.id);
              if (target.invitationSettings === 'no_one') {
                addToast(`${target.name} has disabled invitations`, 'error');
              } else if (target.invitationSettings === 'mutual' && !isMutual) {
                addToast(`You can only invite mutual followers`, 'error');
              } else {
                socket.emit('invite_to_chat', { chatId, targetUserId: target.id, inviterId: currentUser.id });
                addToast(`Invitation sent to @${username}`, 'success');
              }
            }
          }
        }
    } else {
       addToast('Connecting to socket...', 'info');
    }
  };

  const setTyping = (chatId: string, isTyping: boolean) => {
    if (!socket) return;
    const chat = chats.find(c => c.id === chatId);
    const receiverId = chat?.participantIds?.find(id => id !== currentUser?.id) || chatId;
    socket.emit('typing', { 
      chatId, 
      userId: currentUser?.id, 
      userName: currentUser?.displayName || currentUser?.username || 'User', 
      isTyping,
      receiverId
    });
  };

  const logout = async () => {
    // Set the flag BEFORE signing out to block onAuthStateChanged from re-logging in
    localStorage.setItem('aqualyn_logged_out', 'true');
    localStorage.removeItem('mock_auth_token');
    await auth.signOut();
    setCurrentUser(null);
    setChats([]);
    setMessages({});
  };

  const editMessage = (chatId: string, messageId: string, newText: string) => {
    setMessages(prev => ({
      ...prev,
      [chatId]: prev[chatId]?.map(m => m.id === messageId ? { ...m, text: newText, isEdited: true } : m) || []
    }));
    
    if (socket) {
      const chat = chats.find(c => c.id === chatId);
      const receiverId = chat?.participantIds?.find(id => id !== currentUser?.id) || chatId;
      socket.emit('edit_message', { chatId, messageId, newText, receiverId });
    }
  };



  const addReaction = (chatId: string, messageId: string, emoji: string) => {
    setMessages(prev => {
      const chatMsgs = prev[chatId] || [];
      const updatedMsgs = chatMsgs.map(msg => {
        if (msg.id === messageId) {
          const reactions = { ...(msg.reactions || {}) };
          const userReactions = reactions[emoji] || [];
          const userId = currentUser?.id as string;
          
          if (userReactions.includes(userId)) {
            reactions[emoji] = userReactions.filter(id => id !== userId);
            if (reactions[emoji].length === 0) delete reactions[emoji];
          } else {
            reactions[emoji] = [...userReactions, userId];
          }
          
          if (socket) {
            const chat = chats.find(c => c.id === chatId);
            const receiverId = chat?.participantIds?.find(id => id !== currentUser?.id) || chatId;
            socket.emit('react_message', { chatId, messageId, emoji, userId: currentUser?.id, receiverId });
          }
          
          return { ...msg, reactions };
        }
        return msg;
      });
      return { ...prev, [chatId]: updatedMsgs };
    });
  };

  const addPost = async (post: Partial<Post>) => {
    if (!currentUser) return;
    try {
      const idToken = await getToken();
      if (!idToken) return;

      const res = await fetch(ENDPOINTS.CREATE_POST, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          content: post.caption || post.text,
          mediaUrl: post.mediaUrl || post.imageUrl,
          mediaType: post.mediaType || (post.mediaUrl || post.imageUrl ? 'image' : 'text')
        })
      });
      if (res.ok) {
        const data = await res.json();
        // Enrich the post with current user details for the UI
        const newPost: Post = {
          ...data.post,
          userId: currentUser.id,
          userName: currentUser.displayName || currentUser.username,
          userAvatar: currentUser.avatar,
          likes: [],
          comments: [],
          timestamp: 'Just now',
          caption: data.post.content // Backend uses 'content', Frontend uses 'caption'
        };
        setPosts(prev => [newPost, ...prev]);
        addToast('Post shared to feed', 'success');
      }
    } catch (e) {
      console.error(e);
      addToast('Failed to share post', 'error');
    }
  };

  const likePost = async (postId: string) => {
    if (!currentUser) return;
    try {
      const idToken = await getToken();
      if (!idToken) return;

      const res = await fetch(ENDPOINTS.LIKE_POST(postId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            const likes = [...p.likes];
            const liked = data.liked;
            if (liked) {
              if (!likes.includes(currentUser.id)) likes.push(currentUser.id);
            } else {
              return { ...p, likes: likes.filter(id => id !== currentUser.id) };
            }
            return { ...p, likes };
          }
          return p;
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const commentPost = async (postId: string, text: string) => {
    if (!currentUser) return;
    try {
      const idToken = await getToken();
      if (!idToken) return;

      const res = await fetch(ENDPOINTS.COMMENT_POST(postId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ content: text })
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: [...post.comments, data.comment]
            };
          }
          return post;
        }));
        addToast('Comment added', 'success');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const followUser = async (userId: string) => {
    if (!currentUser) return;
    try {
      const idToken = await getToken();
      const res = await fetch(ENDPOINTS.FOLLOW, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ targetUserId: userId })
      });
      
      const data = await res.json();
      if (res.ok) {
        if (data.status === 'requested') {
           // Update local state for immediate feedback
           setGlobalUsers(prev => prev.map(u => 
             u.id === userId ? { ...u, receivedFollowReqs: [...(u.receivedFollowReqs || []), { id: 'temp', senderId: currentUser.id, status: 'pending' }] } : u
           ));
           addToast('Follow request sent', 'success');
        } else {
           // Direct follow - update currentUser follow list
           setCurrentUser({ ...currentUser, following: [...(currentUser.following || []), userId] });
           addToast('Started following', 'success');
        }
      }
    } catch (e) {
      console.error(e);
      addToast('Failed to follow user', 'error');
    }
  };

  const unfollowUser = async (userId: string) => {
    if (!currentUser) return;
    try {
      const idToken = await getToken();
      const res = await fetch(ENDPOINTS.UNFOLLOW, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ targetUserId: userId })
      });
      if (res.ok) {
        setCurrentUser({ 
          ...currentUser, 
          following: (currentUser.following || []).filter((id: string) => id !== userId) 
        });
        addToast('Unfollowed', 'info');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const acceptFollowRequest = async (userId: string) => {
    if (!currentUser) return;
    try {
      const idToken = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/user/follow-request/handle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ senderId: userId, action: 'accept' })
      });
      
      if (res.ok) {
        setCurrentUser({
            ...currentUser,
            followers: [...(currentUser.followers || []), userId]
        });
        setNotifications(n => n.filter(notif => notif.actorId !== userId));
        addToast('Follow request accepted', 'success');
      }
    } catch (e) { console.error(e); }
  };

  const rejectFollowRequest = async (userId: string) => {
    if (!currentUser) return;
    try {
      const idToken = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/user/follow-request/handle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ senderId: userId, action: 'reject' })
      });
      if (res.ok) {
        setNotifications(n => n.filter(notif => notif.actorId !== userId));
        addToast('Follow request rejected', 'info');
      }
    } catch (e) { console.error(e); }
  };

  const archivePost = (postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isArchived: !p.isArchived } : p));
    addToast('Post archived', 'info');
  };

  const pinPost = (postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isPinned: !p.isPinned } : p));
    addToast('Post pinned to profile', 'success');
  };

  const savePost = (postId: string) => {
    if (!currentUser) return;
    const isSaved = currentUser.savedPostIds?.includes(postId);
    const newSavedIds = isSaved 
      ? (currentUser.savedPostIds || []).filter(id => id !== postId)
      : [...(currentUser.savedPostIds || []), postId];
    
    setCurrentUser({ ...currentUser, savedPostIds: newSavedIds });
    addToast(isSaved ? 'Removed from saved' : 'Post saved', 'success');
  };

  const createCollection = (name: string) => {
    if (!currentUser) return;
    const newCollection: Collection = {
      id: `c${Date.now()}`,
      name,
      postIds: []
    };
    setCurrentUser({
      ...currentUser,
      collections: [...(currentUser.collections || []), newCollection]
    });
    addToast(`Collection "${name}" created`, 'success');
  };

  const addPostToCollection = (postId: string, collectionId: string) => {
    if (!currentUser) return;
    setCurrentUser({
      ...currentUser,
      collections: (currentUser.collections || []).map(c => 
        c.id === collectionId ? { ...c, postIds: [...c.postIds, postId] } : c
      )
    });
    addToast('Added to collection', 'success');
  };

  const updateStorySettings = (settings: Partial<User['storySettings']>) => {
    if (!currentUser) return;
    setCurrentUser({
      ...currentUser,
      storySettings: { ...(currentUser.storySettings || { hideStoryFrom: [], allowReplies: 'everyone' }), ...settings }
    });
  };

  const toggleCloseFriend = (userId: string) => {
    if (!currentUser) return;
    const isFriend = currentUser.closeFriends?.includes(userId);
    const newFriends = isFriend
      ? (currentUser.closeFriends || []).filter(id => id !== userId)
      : [...(currentUser.closeFriends || []), userId];
    
    setCurrentUser({ ...currentUser, closeFriends: newFriends });
  };

  return (
    <AppContext.Provider value={{ 
      currentUser, setCurrentUser, chats, setChats, messages, setMessages, contacts, sendMessage, editMessage, deleteMessage, addReaction,
      activeChatId, setActiveChatId, activeContactId, setActiveContactId,
      toasts, addToast, removeToast, isLoading, setIsLoading,
      folders, setFolders, createFolder, deleteFolder, addChatToFolder, theme, setTheme,
      aquaIntensity, setAquaIntensity,
      archiveChat, pinChat, muteChat, deleteChat, clearHistory, blockContact, reportContact, markAsRead,
      appLockPin, setAppLockPin, archiveLockPin, setArchiveLockPin, isAppLocked, setIsAppLocked,
      stories, setStories, addStory, addStoryComment, typingUsers, setTyping, logout, addContact, startChatWithContact, createGroupChat,
      posts, setPosts, addPost, likePost, commentPost, followUser, unfollowUser, acceptFollowRequest, rejectFollowRequest, notifications, setNotifications, globalUsers, setGlobalUsers,
      archivePost, pinPost, savePost, createCollection, addPostToCollection, updateStorySettings, toggleCloseFriend, getToken
    }}>
      {children}
    </AppContext.Provider>
  );
};

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}
