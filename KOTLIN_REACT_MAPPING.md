# Kotlin App ↔ React App Complete Mapping Guide

## Overview
This document shows how to make your Kotlin Android app fully functional like your React app by mapping all API endpoints, screens, and features.

---

## 1. Authentication Flow (COMPLETE)

### React Flow (`LoginScreen.tsx`)
```
Intro → Phone/Email Selection → OTP Input → Profile Completion → Main App
```

### Kotlin Implementation Status
- ✅ `WelcomeScreen` - Intro (Phone/Email selection)
- ✅ `VerificationScreen` - OTP input & verify
- ⚠️ `CompleteProfileScreen` - Profile sync needed
- ✅ `MainActivity` - Navigation logic in place

### Missing: Complete Profile with Photo Upload
**React Pattern:**
```tsx
const handleProfileUpdate = async () => {
  const payload = {
    displayName,
    dob,
    avatar: avatarUrl  // Upload to server first
  };
  await fetch(ENDPOINTS.AUTH_SYNC, { method: 'POST', body: JSON.stringify(payload) });
};
```

**Kotlin TODO:**
- Add `uploadAvatar()` to `AqualynRepository`
- Wire `CompleteProfileScreen` to call `syncProfile()` with avatar

---

## 2. Chat Features (PARTIAL)

### React Features (`ChatDetailScreen.tsx`, `ChatsScreen.tsx`)
- ✅ Get chats list - `fetchChats()`
- ✅ Send message - `sendMessage()`
- ✅ List messages - `fetchMessages()`
- ✅ Mute/pin chat - `muteChat()`
- ⚠️ Message reactions, replies
- ⚠️ Media upload (images, videos, docs)
- ⚠️ Location, Contact, Payment messages

### Kotlin Status
- ✅ `ChatsScreen` basic UI
- ✅ `ChatDetailScreen` basic messaging
- ❌ Media upload UI
- ❌ Message reactions UI
- ❌ Reply/forward UI

### Missing Repository Methods
```kotlin
// Add to AqualynRepository:
suspend fun uploadMedia(file: File, mimeType: String): String?
suspend fun sendReplyMessage(chatId: String, text: String, replyToId: String): Message?
suspend fun addMessageReaction(chatId: String, messageId: String, emoji: String): Boolean
suspend fun deleteMessage(chatId: String, messageId: String): Boolean
suspend fun editMessage(chatId: String, messageId: String, newText: String): Message?
suspend fun getChatMedia(chatId: String): List<String>
```

---

## 3. Social Features (PARTIAL)

### React Features (`FeedScreen.tsx`, `ProfileScreen.tsx`)
- ✅ Get feed posts - `fetchFeed()`
- ✅ Get stories - `fetchStories()`
- ✅ Create post - `createPost()`
- ✅ Like post - `likePost()`
- ✅ Comment on post - `commentPost()`
- ✅ Delete post - `deletePost()`
- ⚠️ Save post, Create story

### Kotlin Status
- ✅ `FeedScreen` UI exists (2286 lines)
- ✅ `ProfileScreen` UI exists
- ✅ Basic API methods exist
- ❌ Story creation UI incomplete
- ❌ Post editing UI

### Missing Repository Methods
```kotlin
// Add to AqualynRepository:
suspend fun savePost(postId: String): Boolean
suspend fun unsavePost(postId: String): Boolean
suspend fun createStory(mediaUrl: String, caption: String): StoryItem?
suspend fun deleteStory(storyId: String): Boolean
suspend fun viewStory(storyId: String): Boolean
```

---

## 4. User Profile & Social Graph (PARTIAL)

### React Features
- ✅ Get user profile - `/api/user/profile/{id}`
- ✅ Get followers - `/api/user/{userId}/followers`
- ✅ Get following - `/api/user/{userId}/following`
- ✅ Follow user - `/api/user/follow`
- ✅ Unfollow user - `/api/user/unfollow`
- ✅ Block user - `/api/user/block`
- ✅ Report user - `/api/user/report`
- ✅ Search users - `/api/users/search`

### Kotlin Status
- ✅ All repository methods exist
- ✅ `ProfileScreen` UI exists
- ✅ `FriendProfileScreen` exists
- ⚠️ Missing: Link UI to actual API calls in screens

### Issues to Fix
1. Screens UI calls local mock data instead of `AqualynRepository` methods
2. No real-time updates when follow/unfollow
3. No pagination for followers/following lists

---

## 5. Settings & User Data (PARTIAL)

### React Features (`SettingsScreen.tsx`)
- ✅ Get settings
- ✅ Update settings
- ✅ Get sessions
- ✅ Revoke session
- ✅ Get storage usage
- ✅ Export data

### Kotlin Status
- ✅ Repository methods exist
- ⚠️ `SettingsScreen` UI incomplete
- ❌ Session management UI
- ❌ Storage usage display

---

## 6. Contact Sync (PARTIAL)

### React Features
- Post to `/api/user/contacts/sync` with phone numbers

### Kotlin Status
- ✅ `AqualynRepository.syncContacts()` exists
- ✅ `MainActivity.kt` requests `READ_CONTACTS`
- ❌ UI doesn't show synced contacts
- ❌ Auto-sync on app start

---

## 7. Notifications (NOT IMPLEMENTED)

### React Features (`NotificationsScreen.tsx`)
- Follow requests
- Message notifications
- Comment notifications
- Story views

### Kotlin Status
- ❌ No notifications UI
- ❌ No notification handling

### Backend Reference
Get notifications from `/api/user/notifications` endpoint

---

---

## Implementation Checklist

### Phase 1: Wire Existing Screens (CRITICAL)
- [ ] `ChatsScreen` - Call `fetchChats()` on load
- [ ] `ChatDetailScreen` - Call `fetchMessages()` + `sendMessage()`
- [ ] `FeedScreen` - Call `fetchFeed()` + `fetchStories()`
- [ ] `ProfileScreen` - Call `fetchUserProfile()` + `getFollowers()`
- [ ] `FriendProfileScreen` - Call `followUser()`, `unfollowUser()`, `blockUser()`

### Phase 2: Add Missing UI
- [ ] Media upload dialog + upload in `ChatDetailScreen`
- [ ] Story creation screen
- [ ] Post editor
- [ ] Settings screen improvements
- [ ] Notifications screen

### Phase 3: Backend Sync
- [ ] Implement Socket.io for real-time messages
- [ ] Paginate lists (chats, messages, followers)
- [ ] Error handling + retry logic
- [ ] Offline caching

---

## Code Patterns

### Pattern 1: Screen with API Call
```kotlin
@Composable
fun MyScreen() {
    var items by remember { mutableStateOf<List<Item>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    
    LaunchedEffect(Unit) {
        isLoading = true
        items = AqualynRepository.fetchItems()  // Call repo
        isLoading = false
    }
    
    // Render items...
}
```

### Pattern 2: Button with Action
```kotlin
Button(onClick = {
    coroutineScope.launch {
        val success = AqualynRepository.likePost(postId)
        if (success) {
            GlobalState.showToast("Liked!", isGreen = true)
        }
    }
})
```

### Pattern 3: List with Pagination
```kotlin
var page by remember { mutableStateOf(0) }
var hasMore by remember { mutableStateOf(true) }

LazyColumn {
    items(myItems) { item -> ItemCard(item) }
    if (hasMore) {
        item {
            Button(onClick = {
                coroutineScope.launch {
                    page++
                    val newItems = AqualynRepository.fetchItems(page)
                    if (newItems.isEmpty()) hasMore = false
                    else myItems.addAll(newItems)
                }
            }) { Text("Load More") }
        }
    }
}
```

---

## Field Mapping Reference

### Message Fields
| React | Kotlin DTO | Notes |
|-------|-----------|-------|
| `content` | `text` | ✅ Backend sends `text` |
| `timeInfo` | `timestamp` | ✅ Backend sends formatted "2:30 PM" |
| `isMine` | `isMine` | ✅ Correct |
| `replyToMsg` | `replyToId` | ✅ Stores ID only |

### Chat Fields
| React | Kotlin DTO | Notes |
|-------|-----------|-------|
| `lastMessage` | `lastMessage` | ✅ Correct |
| `timeInfo` | `lastMessageTime` | ✅ Backend sends formatted time |
| `avatar` | `avatar` | ✅ Correct |
| `name` (1-on-1) | `user.displayName` | ✅ From nested user object |

### User Fields
| React | Kotlin DTO | Notes |
|-------|-----------|-------|
| `displayName` | `displayName` | ✅ Correct |
| `avatar` | `avatar` or `largeAvatar` | ✅ Try both |
| `followers` count | `_count.followers` | ✅ Backend sends count object |
| `followers` array | `followers: List<String>` | ✅ Array of IDs |

---

## Testing Checklist

- [ ] Login flow works end-to-end
- [ ] Can send and receive messages
- [ ] Chat list shows correctly
- [ ] Can create post in feed
- [ ] Can follow/unfollow users
- [ ] Profile shows follower counts
- [ ] Settings save correctly
- [ ] Can upload media
- [ ] Error messages show
- [ ] Token persists after app restart

---

## Next Steps

1. **Now** - Wire screens to call `AqualynRepository` methods (Phase 1)
2. **Then** - Add UI for missing features (Phase 2)
3. **Finally** - Implement real-time updates (Phase 3)

