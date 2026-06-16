import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Chat, Message, Folder, Post, Story, Notification } from '../types';
import { ENDPOINTS, API_BASE_URL } from '../config/api';
import { apiFetch } from '../utils/fetcher';
import { Socket } from 'socket.io-client';
import { ToastType, Toast } from './AppContextType';

export const useAppActions = (
  currentUser: User | null,
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>,
  socket: Socket | null,
  chats: Chat[],
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>,
  messages: Record<string, Message[]>,
  setMessages: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>,
  contacts: User[],
  setContacts: React.Dispatch<React.SetStateAction<User[]>>,
  setStories: React.Dispatch<React.SetStateAction<Story[]>>,
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>,
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>,
  globalUsers: User[],
  setGlobalUsers: React.Dispatch<React.SetStateAction<User[]>>,
  folders: Folder[],
  setFolders: React.Dispatch<React.SetStateAction<Folder[]>>,
  addToast: (message: string, type: ToastType) => void,
  setActiveChatId: (id: string | null) => void,
  activeChatId: string | null
) => {
  const logout = async () => {
    try {
      await apiFetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST' });
    } catch (e) {
      console.error("Logout API failed", e);
    }
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.setItem('aqualyn_logged_out', 'true');
    setCurrentUser(null);
    setChats([]);
    setMessages({});
  };

  const archiveChat = (chatId: string) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, isArchived: !c.isArchived } : c));
    addToast('Chat archived', 'info');
  };

  const pinChat = (chatId: string) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, isPinned: !c.isPinned } : c));
  };

  const muteChat = async (chatId: string) => {
    try {
      const res = await apiFetch(ENDPOINTS.MUTE_CHAT(chatId), { method: 'POST' });
      if (!res.ok) throw new Error('Mute failed');
      const data = await res.json();
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, isMuted: data.muted } : c));
      addToast(data.muted ? 'Notifications muted' : 'Notifications unmuted', 'info');
    } catch (e) {
      addToast('Failed to update mute setting', 'error');
    }
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
  
  const blockContact = async (contactId: string) => {
    try {
      const res = await apiFetch(ENDPOINTS.BLOCK_USER, {
        method: 'POST',
        body: JSON.stringify({ targetUserId: contactId })
      });
      if (!res.ok) throw new Error('Block failed');
      const data = await res.json();
      setCurrentUser(prev => {
        if (!prev) return prev;
        const blocked = prev.blockedUsers || [];
        if (data.blocked) {
          return { ...prev, blockedUsers: [...blocked, contactId] };
        } else {
          return { ...prev, blockedUsers: blocked.filter(id => id !== contactId) };
        }
      });
      addToast(data.blocked ? 'Contact blocked' : 'Contact unblocked', 'info');
    } catch (e) {
      addToast('Failed to update block status', 'error');
    }
  };

  const reportContact = async (contactId: string, reason?: string) => {
    try {
      const res = await apiFetch(ENDPOINTS.REPORT_USER, {
        method: 'POST',
        body: JSON.stringify({ targetUserId: contactId, reason })
      });
      if (!res.ok) throw new Error('Report failed');
      addToast('Contact reported to Aqualyn safety team', 'success');
    } catch (e) {
      addToast('Failed to submit report', 'error');
    }
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

  const sendMessage = (chatId: string, text: string, options?: Partial<Message>) => {
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
        socket.emit('typing', { chatId, userId: currentUser?.id, userName: currentUser?.displayName || currentUser?.username, isTyping: false });

        if (!chat?.isGroup) {
          const mentionMatch = text.match(/@(\w+)/);
          if (mentionMatch) {
            const username = mentionMatch[1];
            const target = globalUsers.find(u => u.username === username);
            if (target) {
              const isMutual = currentUser?.following?.includes(target.id) && target.followers?.includes(currentUser.id);
              if (target.invitationSettings === 'no_one') {
                addToast(`${target.name} has disabled invitations`, 'error');
              } else if (target.invitationSettings === 'mutual' && !isMutual) {
                addToast(`You can only invite mutual followers`, 'error');
              } else {
                socket.emit('invite_to_chat', { chatId, targetUserId: target.id, inviterId: currentUser?.id });
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
      const res = await apiFetch(ENDPOINTS.CREATE_POST, {
        method: 'POST',
        body: JSON.stringify({
          content: post.caption || post.text,
          mediaUrl: post.mediaUrl || post.imageUrl,
          mediaType: post.mediaType || (post.mediaUrl || post.imageUrl ? 'image' : 'text')
        })
      });
      if (res.ok) {
        const data = await res.json();
        const newPost: Post = {
          ...data.post,
          userId: currentUser.id,
          userName: currentUser.displayName || currentUser.username,
          userAvatar: currentUser.avatar,
          likes: [],
          comments: [],
          timestamp: 'Just now',
          caption: data.post.content
        };
        setPosts(prev => [newPost, ...prev]);
        addToast('Post shared to feed', 'success');
      }
    } catch (e) {
      console.error(e);
      addToast('Failed to share post', 'error');
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const res = await apiFetch(ENDPOINTS.DELETE_POST(postId), {
        method: 'DELETE'
      });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        addToast('Post deleted', 'success');
      } else {
        throw new Error('Delete failed');
      }
    } catch (e) {
      console.error('Delete post error:', e);
      addToast('Failed to delete post', 'error');
      throw e;
    }
  };

  const likePost = async (postId: string) => {
    if (!currentUser) return;
    try {
      const res = await apiFetch(ENDPOINTS.LIKE_POST(postId), { method: 'POST' });
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
      const res = await apiFetch(ENDPOINTS.COMMENT_POST(postId), {
        method: 'POST',
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
    
    // Optimistically update UI immediately before API call
    const originalFollowing = [...(currentUser.following || [])];
    const isAlreadyFollowing = originalFollowing.includes(userId);
    
    // Immediate state update
    setCurrentUser({ 
      ...currentUser, 
      following: isAlreadyFollowing ? originalFollowing.filter((id: string) => id !== userId) : [...originalFollowing, userId],
      _count: {
        followers: currentUser._count?.followers || 0,
        following: isAlreadyFollowing ? (currentUser._count?.following || originalFollowing.length) - 1 : (currentUser._count?.following || originalFollowing.length) + 1,
        posts: currentUser._count?.posts
      }
    });

    try {
      const res = await apiFetch(ENDPOINTS.FOLLOW, {
        method: 'POST',
        body: JSON.stringify({ targetUserId: userId })
      });
      
      const data = await res.json();
      if (!res.ok || data.status === 'error') {
        // Rollback on error
        setCurrentUser({ ...currentUser, following: originalFollowing });
        addToast(data.error || 'Failed to follow user', 'error');
        return;
      }
      
      // For private accounts, update follower arrays
      if (data.followers !== undefined) {
        setGlobalUsers(prev => prev.map(u => {
          if (data.followers?.some((f: any) => f.followerId === u.id)) {
            const followerIds = data.followers.map((f: any) => f.followerId);
            return { ...u, followers: followerIds };
          }
          return u;
        }));
      }
      
      if (data.status === 'requested') {
        addToast('Follow request sent', 'success');
      } else {
        addToast(isAlreadyFollowing ? 'Unfollowed' : 'Started following', 'success');
      }
    } catch (e) {
      console.error(e);
      // Rollback
      setCurrentUser({ ...currentUser, following: originalFollowing });
      addToast('Failed to follow user', 'error');
    }
  };

  const unfollowUser = async (userId: string) => {
    if (!currentUser) return;

    const originalUser = { ...currentUser };
    const originalGlobalUsers = [...globalUsers];
    const originalContacts = [...contacts];

    // Optimistic UI update
    setCurrentUser({ 
      ...currentUser, 
      following: (currentUser.following || []).filter((id: string) => id !== userId),
      _count: {
        followers: currentUser._count?.followers || 0,
        following: Math.max(0, (currentUser._count?.following || (currentUser.following?.length || 0)) - 1),
        posts: currentUser._count?.posts
      }
    });
    const updateFollowers = (u: User): User => u.id === userId ? { 
      ...u, 
      followers: (u.followers || []).filter(id => id !== currentUser.id),
      _count: {
        following: u._count?.following || 0,
        followers: Math.max(0, (u._count?.followers || (u.followers?.length || 0)) - 1),
        posts: u._count?.posts
      }
    } : u;
    setGlobalUsers(prev => prev.map(updateFollowers));
    setContacts(prev => prev.map(updateFollowers));

    try {
      const res = await apiFetch(ENDPOINTS.UNFOLLOW, {
        method: 'POST',
        body: JSON.stringify({ targetUserId: userId })
      });
      if (res.ok) {
        addToast('Unfollowed', 'info');
      } else {
        throw new Error('Failed to unfollow');
      }
    } catch (e) {
      console.error(e);
      // Rollback
      setCurrentUser(originalUser);
      setGlobalUsers(originalGlobalUsers);
      setContacts(originalContacts);
      addToast('Failed to unfollow', 'error');
    }
  };

  const acceptFollowRequest = async (userId: string) => {
    if (!currentUser) return;
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/user/follow-request/handle`, {
        method: 'POST',
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
      const res = await apiFetch(`${API_BASE_URL}/api/user/follow-request/handle`, {
        method: 'POST',
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
    setCurrentUser({
      ...currentUser,
      collections: [...(currentUser.collections || []), { id: `c${Date.now()}`, name, postIds: [] }]
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

  const addStory = async (story: Partial<Story>) => {
    if (!currentUser) return;
    try {
      const res = await apiFetch(ENDPOINTS.CREATE_STORY, {
        method: 'POST',
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

  const deleteStory = async (storyId: string) => {
    if (!currentUser) return;
    try {
      const res = await apiFetch(ENDPOINTS.DELETE_STORY(storyId), {
        method: 'DELETE'
      });
      if (res.ok) {
        setStories(prev => prev.filter(s => s.id !== storyId));
        addToast('Story deleted', 'success');
      }
    } catch (e) {
      console.error(e);
      addToast('Failed to delete story', 'error');
    }
  };

  const addStoryComment = (storyId: string, text: string) => {
    addToast('Comment sent!', 'success');
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

  const addContact = (name: string, phone: string, id: string, avatar?: string) => {
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

  const createGroupChat = async (name: string, members: string[], options?: { description?: string; adminOnly?: boolean; disappearingMessages?: boolean }) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/groups/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          participantIds: members,
          description: options?.description
        })
      });
      if (!res.ok) throw new Error('Failed to create group on server');
      const data = await res.json();
      if (data.success && data.group) {
        const group = data.group;
        const newChat: Chat = {
          id: group.id,
          name: group.name,
          avatar: group.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${group.name}`,
          lastMessage: 'Group created',
          lastMessageTime: 'Just now',
          unreadCount: 0,
          isGroup: true,
          participantIds: group.participants.map((p: any) => p.userId),
          description: group.description,
          adminOnly: options?.adminOnly,
          disappearingMessages: options?.disappearingMessages,
          myStatus: 'JOINED',
          myRole: 'OWNER'
        };
        setChats(prev => [newChat, ...prev]);
        setMessages(prev => ({
          ...prev,
          [group.id]: [{
            id: `m${Date.now()}`,
            chatId: group.id,
            text: `You created group "${name}"`,
            senderId: 'system',
            timestamp: 'Just now',
            isRead: true,
          }]
        }));
        setActiveChatId(group.id);
        addToast('Group created successfully!', 'success');

        // Notify invited participants via sockets
        group.participants.forEach((p: any) => {
          if (p.userId !== currentUser?.id && p.status === 'INVITED') {
            socket?.emit('invite_to_chat', {
              chatId: group.id,
              targetUserId: p.userId,
              inviterId: currentUser?.id
            });
          }
        });
      }
    } catch (e: any) {
      console.error(e);
      addToast(e.message || 'Group creation failed', 'error');
    }
  };

  const requestSecretChat = async (targetUserId: string) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/chats/secret/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId })
      });
      if (!res.ok) throw new Error('Secret chat request failed');
      const data = await res.json();
      if (data.success && data.chat) {
        const secretChat = data.chat;
        setChats(prev => {
          if (prev.some(c => c.id === secretChat.id)) return prev;
          return [secretChat, ...prev];
        });
        if (data.alreadyExists) {
          setActiveChatId(secretChat.id);
          addToast('Resumed existing secret chat', 'success');
        } else {
          startChatWithContact(targetUserId);
          addToast('Secret chat request sent to normal chat!', 'success');
          socket?.emit('invite_to_chat', {
            chatId: secretChat.id,
            targetUserId: targetUserId,
            inviterId: currentUser?.id
          });
          // Also send a message in the normal chat
          const combinedId = [currentUser?.id, targetUserId].sort().join('_');
          const msg = {
            chatId: combinedId,
            text: `[System] 🔒 Secret Chat Request:::${secretChat.id}`,
            senderId: currentUser?.id
          };
          socket?.emit('send_message', msg);
        }
      }
    } catch (e: any) {
      console.error(e);
      addToast(e.message || 'Failed to start secret chat', 'error');
    }
  };

  const handleSecretChatInvitation = async (chatId: string, action: 'accept' | 'decline') => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/chats/secret/handle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, action })
      });
      if (!res.ok) throw new Error('Failed to handle secret chat request');
      const data = await res.json();
      if (data.success) {
        if (action === 'accept') {
          setChats(prev => prev.map(c => c.id === chatId ? { ...c, myStatus: 'JOINED' } : c));
          addToast('Secret chat opened in Incognito Mode!', 'success');
        } else {
          setChats(prev => prev.filter(c => c.id !== chatId));
          addToast('Secret chat request declined.', 'info');
        }
      }
    } catch (e: any) {
      console.error(e);
      addToast(e.message || 'Failed to update invitation', 'error');
    }
  };

  const handleGroupInvitation = async (chatId: string, action: 'accept' | 'decline') => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/groups/${chatId}/invitation/handle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (!res.ok) throw new Error('Failed to handle group invitation');
      const data = await res.json();
      if (data.success) {
        if (action === 'accept') {
          setChats(prev => prev.map(c => c.id === chatId ? { ...c, myStatus: 'JOINED' } : c));
          addToast('Joined the group chat!', 'success');
        } else {
          setChats(prev => prev.filter(c => c.id !== chatId));
          addToast('Group invitation declined.', 'info');
        }
      }
    } catch (e: any) {
      console.error(e);
      addToast(e.message || 'Failed to update invitation', 'error');
    }
  };

  const updateSettings = async (settings: any) => {
    try {
      const res = await apiFetch(ENDPOINTS.SETTINGS, {
        method: 'PATCH',
        body: JSON.stringify(settings)
      });
      if (!res.ok) throw new Error('Update failed');
      const data = await res.json();
      setCurrentUser(prev => prev ? { ...prev, settings: data.settings } : prev);
      return data.settings;
    } catch (e) {
      addToast('Failed to save settings', 'error');
      throw e;
    }
  };

  const updatePrivacy = async (privacy: any) => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/user/privacy`, {
        method: 'PATCH',
        body: JSON.stringify(privacy)
      });
      if (!res.ok) throw new Error('Update failed');
      const data = await res.json();
      setCurrentUser(prev => prev ? { ...prev, ...data } : prev);
      addToast('Privacy settings updated', 'success');
    } catch (e) {
      addToast('Failed to update privacy', 'error');
    }
  };

  const syncContacts = async () => {
    try {
      const Capacitor = (window as any).Capacitor;
      if (Capacitor?.isNativePlatform()) {
        const Contacts = Capacitor.Plugins.Contacts;
        if (!Contacts) {
           addToast('Contacts plugin not found', 'error');
           return;
        }

        const permission = await Contacts.requestPermissions();
        if (permission.contacts !== 'granted') {
          addToast('Contact mapping requires permission', 'info');
          return;
        }

        const result = await Contacts.getContacts({ projection: { name: true, phones: true } });
        const phones = new Set<string>();
        result.contacts.forEach((c: any) => {
          c.phones?.forEach((p: any) => {
            const clean = p.number.replace(/\D/g, '');
            if (clean.length >= 10) phones.add(clean);
          });
        });

        if (phones.size === 0) {
            addToast('No contacts found on device', 'info');
            return;
        }

        const res = await apiFetch(ENDPOINTS.CONTACT_SYNC, {
          method: 'POST',
          body: JSON.stringify({ phones: Array.from(phones) })
        });

        if (res.ok) {
          const matches = await res.json();
          setContacts(prev => {
            const existingIds = new Set(prev.map(c => c.id));
            const newOnes = matches.filter((m: any) => !existingIds.has(m.id));
            return [...prev, ...newOnes];
          });
          addToast(`Synced ${matches.length} matching friends!`, 'success');
        }
      } else {
        addToast('Contact Sync only available on native mobile apps', 'info');
      }
    } catch (e) {
      console.error('Contact sync failed', e);
      addToast('Sync failed', 'error');
    }
  };

  return {
    logout, archiveChat, pinChat, muteChat, deleteMessage, deleteChat, clearHistory, 
    blockContact, reportContact, markAsRead, createFolder, deleteFolder, addChatToFolder,
    sendMessage, setTyping, editMessage, addReaction, addPost, likePost, commentPost,
    followUser, unfollowUser, acceptFollowRequest, rejectFollowRequest, archivePost,
    pinPost, savePost, createCollection, addPostToCollection, deletePost, addStory, deleteStory, addStoryComment,
    updateStorySettings, toggleCloseFriend, addContact, startChatWithContact, createGroupChat,
    updateSettings, updatePrivacy, syncContacts, requestSecretChat, handleSecretChatInvitation, handleGroupInvitation
  };
};
