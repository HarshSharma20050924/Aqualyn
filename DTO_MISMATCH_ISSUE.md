# ⚠️ CRITICAL: Backend-Mobile DTO Mismatch

## The Problem

Your backend is deployed and working (OTP verification works!), but chat screens show **no names, no history, no profiles** because of a **field name mismatch** between backend response and mobile app DTO.

---

## Backend Response Format (Actual)

**Endpoint:** `GET /api/chats`

```json
{
  "id": "chat-123",
  "name": "Harsh Vardhan",           // ← Backend sends this
  "avatar": "https://...",           // ← Backend sends this
  "lastMessage": "Hey!",             // ✅ Matches
  "lastMessageTime": "2:30 PM",      // ← Backend sends `lastMessageTime`
  "isGroup": false,
  "isSecret": false,
  "unreadCount": 5,                  // ✅ Matches
  "participantIds": ["user1", "user2"],
  "isMuted": false,
  "myStatus": "JOINED",
  "myRole": "MEMBER",
  "isArchived": false,
  "isPinned": false
}
```

## Mobile DTO (Expected - WRONG!)

**File:** `ApiClient.kt:115-130`

```kotlin
data class ChatDto(
    val id: String,
    val user: UserDto?,              // ❌ Backend doesn't have `user` field!
    val isGroup: Boolean = false,
    val groupName: String? = null,   // ❌ Backend doesn't have `groupName`!
    val lastMessage: String = "",    // ✅ Matches
    val timeInfo: String = "",       // ❌ Backend sends `lastMessageTime` NOT `timeInfo`!
    val unreadCount: Int = 0,        // ✅ Matches
    val isPinned: Boolean = false,
    val isVoiceMessage: Boolean = false
) {
    fun toDomain(): ChatItem = ChatItem(
        id = id,
        user = user?.toDomain(),      // ← Dies here because `user` is null!
        isGroup = isGroup,
        groupName = groupName,
        lastMessage = lastMessage,
        timeInfo = timeInfo,          // ← Gets empty string because field doesn't exist
        unreadCount = unreadCount,
        isPinned = isPinned,
        isVoiceMessage = isVoiceMessage
    )
}
```

---

## Why This Breaks Everything

When the mobile app calls `GET /api/chats`:

1. **JSON Deserialization Fails Partially**
   - Moshi tries to map response JSON to `ChatDto`
   - Fields that exist map fine: `id`, `lastMessage`, `unreadCount`, etc.
   - Fields with wrong names get `null` or default values: `user` = null, `timeInfo` = "", `groupName` = null

2. **Chats Display Broken**
   - `user?.toDomain()` tries to call methods on null → returns null
   - `timeInfo` is empty string → no time shown
   - Chat names fall back to mock hardcoded values like "Design Team"

3. **Chat History Missing**
   - Similar issue with `MessageDto`: Backend sends `text`, mobile expects `content`
   - Message history deserialization fails

---

## Root Cause

Backend was likely refactored or designed differently than mobile DTOs. The mobile app was scaffolded with incorrect DTO definitions that don't match your actual Render backend API response format.

---

## Solution

Align the mobile **ChatDto** with what backend actually returns:

### Option 1: Update Mobile DTO (Recommended)
Change `ChatDto` to match backend response:

```kotlin
data class ChatDto(
    val id: String,
    val name: String,                 // ← Changed from `user`
    val avatar: String? = null,       // ← New field
    val lastMessage: String = "",
    val lastMessageTime: String = "", // ← Changed from `timeInfo`
    val isGroup: Boolean = false,
    val isSecret: Boolean = false,
    val unreadCount: Int = 0,
    val participantIds: List<String> = emptyList(),
    val isMuted: Boolean = false,
    val myStatus: String = "JOINED",
    val myRole: String = "MEMBER",
    val isArchived: Boolean = false,
    val isPinned: Boolean = false
) {
    fun toDomain(): ChatItem = ChatItem(
        id = id,
        user = User(
            id = "",
            name = name,              // ← Use the name field
            handle = "",
            role = "user",
            description = "",
            avatarUrl = avatar ?: "",
            isOnline = false,
            followers = 0,
            following = 0
        ),
        isGroup = isGroup,
        groupName = if (isGroup) name else null,
        lastMessage = lastMessage,
        timeInfo = lastMessageTime,   // ← Map to timeInfo
        unreadCount = unreadCount,
        isPinned = isPinned,
        isVoiceMessage = false
    )
}
```

### Option 2: Update Backend Response
Modify backend `/api/chats` to return DTOs matching mobile expectations:

```typescript
// In chatRoutes.ts, change response mapping:
const mappedChats = activeChats.map((c: any) => {
    const otherParticipant = c.participants.find((p: any) => p.userId !== userId);
    return {
        id: c.id,
        // Return nested user object instead of flat name/avatar
        user: otherParticipant ? {
            id: otherParticipant.userId,
            displayName: otherParticipant.user.displayName,
            username: otherParticipant.user.username,
            avatar: otherParticipant.user.avatar
        } : null,
        groupName: c.isGroup ? c.name : null,
        lastMessage: c.messages[0]?.text || '',
        timeInfo: c.messages[0]?.createdAt  // ← Renamed from lastMessageTime
            ? new Date(c.messages[0].createdAt).toLocaleTimeString(...)
            : 'Recent',
        // ... rest of fields
    };
});
```

---

## Message DTO Issue (Same Problem)

**Backend returns messages as:**
```json
{
  "id": "msg-1",
  "chatId": "chat-1",
  "senderId": "user-1",
  "text": "Hello!",           // ← Backend field
  "imageUrl": null,
  "videoUrl": null,
  // ... more fields
  "timestamp": "2:30 PM",   // ← From backend mapping
  "createdAt": "2024-01-15T14:30:00Z"
}
```

**Mobile DTO expects:**
```kotlin
data class MessageDto(
    val id: String,
    val senderId: String,
    val content: String,  // ❌ Backend sends `text` NOT `content`!
    val timeInfo: String, // ❌ Backend might not send this
    // ...
)
```

**Fix:**
```kotlin
data class MessageDto(
    val id: String,
    val senderId: String,
    val text: String,             // ← Changed to match backend
    val timeInfo: String = "",
    val isMine: Boolean = false,
    // ... rest (mostly match)
) {
    fun toDomain(): Message = Message(
        id = id,
        senderId = senderId,
        content = text,            // ← Map text to content for domain
        timeInfo = timeInfo,
        isMine = isMine,
        // ...
    )
}
```

---

## Same Issue with User Profile

Backend `/api/auth/profile` likely returns different field names than `UserDto`:

- Backend: `displayName`, `username`, `avatar`, `bio`
- DTO might expect: `fullName`, `name`, `avatarUrl`

---

## Checklist to Fix

- [ ] Compare backend response with mobile DTOs (use Postman to inspect)
- [ ] Update `ChatDto` to match actual backend response
- [ ] Update `MessageDto` to use `text` instead of `content`
- [ ] Update `UserDto` field mappings
- [ ] Test: OTP → Verify → Fetch Chats → Check names appear
- [ ] Test: Click chat → Fetch messages → Check history appears
- [ ] Test: View user profile → Check profile data appears

---

## Debug Steps

### 1. Inspect Actual Backend Response
```bash
# After authenticate with token
curl -H "Authorization: Bearer <token>" \
  https://aqualyn.onrender.com/api/chats | jq
```

### 2. Check Logcat for Deserialization Errors
Run app and search logcat for:
- "JsonDataException"
- "MoshiException"
- "cannot deserialize"

### 3. Add Logging in Repository
```kotlin
suspend fun fetchChats(): List<ChatItem> = withContext(Dispatchers.IO) {
    val response = AqualynApi.getService().getChats()
    Log.d(TAG, "Raw response: ${response.body()}")  // ← Add this
    if (response.isSuccessful) {
        val chatDtos = response.body() ?: emptyList()
        Log.d(TAG, "Parsed DTOs: $chatDtos")  // ← Add this
        // ...
    }
}
```

---

## Summary

| Item | Status | Fix |
|------|--------|-----|
| Backend deployed | ✅ Working | N/A |
| OTP flow | ✅ Works | N/A |
| Chat fetch API | ✅ Exists | Response format mismatch |
| Mobile DTO | ❌ Wrong | Update field names |
| Chat display | ❌ Empty | Will show names once DTO fixed |
| Message history | ❌ Empty | Will show messages once DTO fixed |
| User profiles | ❌ Empty | Will show profiles once DTO fixed |

**The fix is simple:** Make the mobile app DTOs match what your Render backend actually returns!
