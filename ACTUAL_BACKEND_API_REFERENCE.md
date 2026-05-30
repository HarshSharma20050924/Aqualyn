# 🚨 ACTUAL BACKEND API REFERENCE - Render Deployed

**This is the TRUTH.** Your OpenAPI, Postman, and model files have discrepancies with actual backend responses.

---

## Auth Endpoints

### 1️⃣ POST `/api/auth/send-otp`

**📤 REQUEST:**
```json
{
  "identifier": "+919876543210"  // Phone or email
}
```

**📥 ACTUAL RESPONSE (200):**
```json
{
  "message": "OTP sent successfully",
  "otp": "123456",              // ✅ Returned in DEV (removed in PROD)
  "isExisting": true            // Are they existing user or new?
}
```

**Field Mapping for Frontend:**
| Field | Type | Notes |
|-------|------|-------|
| `message` | string | Status message |
| `otp` | string | DEV ONLY - don't show in UI |
| `isExisting` | boolean | If true, user already registered |

---

### 2️⃣ POST `/api/auth/verify-otp`

**📤 REQUEST:**
```json
{
  "identifier": "+919876543210",
  "otp": "123456"
}
```

**📥 ACTUAL RESPONSE (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**⚠️ ISSUE:** Backend returns ONLY token, no user object!

**Field Mapping:**
| Field | Type | Notes |
|-------|------|-------|
| `token` | string | JWT token - save to `SharedPreferences` as Bearer token |

**What the docs said:**
```json
// OpenAPI says:
{
  "token": "string",
  "user": { "id": "...", "name": "..." }  // ❌ NOT RETURNED!
}
```

**Fix:** After getting token, call `/api/auth/profile` to get user!

---

### 3️⃣ POST `/api/auth/sync` (Profile Create/Update)

**📤 REQUEST:**
```json
{
  "displayName": "Harsh Vardhan",
  "dob": "1995-05-15",           // ISO date format
  "avatar": "https://...",
  "username": "harsh_7742"       // Optional
}
```

**📥 ACTUAL RESPONSE (201 or 200):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user-123",
    "firebaseUid": "native-abc123",
    "email": "+919876543210",    // ⚠️ Actually stores phone here if phone was used for login
    "phone": "+919876543210",
    "username": "harsh_7742",
    "displayName": "Harsh Vardhan",
    "avatar": "https://api.dicebear.com/7.x/initials/svg?seed=Harsh",
    "largeAvatar": "https://api.dicebear.com/7.x/initials/svg?seed=Harsh",
    "bio": null,
    "dob": "1995-05-15T00:00:00.000Z",
    "isPrivate": false,
    "searchByPhone": true,
    "showPhoneTo": "everyone",
    "invitationSettings": "everyone",
    "lastLogin": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "followers": [],             // Array of follower IDs
    "following": []              // Array of following IDs
  },
  "token": "eyJhbGc..."
}
```

**Kotlin DTO Fix:**
```kotlin
data class UserDto(
    val id: String,
    val firebaseUid: String? = null,
    val email: String? = null,
    val phone: String? = null,
    val username: String? = null,
    val displayName: String? = null,
    val avatar: String? = null,
    val largeAvatar: String? = null,
    val bio: String? = null,
    val dob: String? = null,
    val isPrivate: Boolean = false,
    val searchByPhone: Boolean = true,
    val showPhoneTo: String = "everyone",
    val invitationSettings: String = "everyone",
    val lastLogin: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null,
    val followers: List<String>? = null,
    val following: List<String>? = null
)
```

---

### 4️⃣ GET `/api/auth/profile` (Get Current User)

**📥 ACTUAL RESPONSE (200):**
```json
{
  "id": "user-123",
  "username": "harsh_7742",
  "displayName": "Harsh Vardhan",
  "avatar": "https://...",
  "largeAvatar": "https://...",
  "bio": "Software Engineer",
  "email": "+919876543210",
  "phone": "+919876543210",
  "dob": "1995-05-15T00:00:00.000Z",
  "isPrivate": false,
  "searchByPhone": true,
  "showPhoneTo": "everyone",
  "lastLogin": "2024-01-15T10:30:00.000Z",
  "_count": {
    "followers": 45,
    "following": 23
  },
  "followers": [                 // Array of follower IDs
    "follower-id-1",
    "follower-id-2"
  ],
  "following": [                 // Array of following IDs
    "following-id-1"
  ]
}
```

**Kotlin DTO:**
```kotlin
data class UserProfileDto(
    val id: String,
    val username: String? = null,
    val displayName: String? = null,
    val avatar: String? = null,
    val largeAvatar: String? = null,
    val bio: String? = null,
    val email: String? = null,
    val phone: String? = null,
    val dob: String? = null,
    val isPrivate: Boolean = false,
    val searchByPhone: Boolean = true,
    val showPhoneTo: String = "everyone",
    val lastLogin: String? = null,
    val _count: CountDto? = null,
    val followers: List<String> = emptyList(),
    val following: List<String> = emptyList()
)

data class CountDto(
    val followers: Int = 0,
    val following: Int = 0
)
```

---

## Chat Endpoints

### 5️⃣ GET `/api/chats` (Get All Chats)

**📥 ACTUAL RESPONSE (200):**
```json
[
  {
    "id": "chat-123",
    "name": "Harsh Vardhan",          // User's display name for 1-on-1
    "avatar": "https://...",          // User's avatar for 1-on-1
    "lastMessage": "Hey, how are you?",
    "lastMessageTime": "2:30 PM",     // Formatted time like "2:30 PM"
    "isGroup": false,
    "isSecret": false,
    "unreadCount": 2,
    "selfDestructTimer": 0,
    "participantIds": ["user-123", "user-456"],
    "isMuted": false,
    "myStatus": "JOINED",
    "myRole": "MEMBER",
    "isArchived": false,
    "isPinned": false
  },
  {
    "id": "group-chat-1",
    "name": "Design Team",             // Group name
    "avatar": "https://group-avatar",
    "lastMessage": "Design system updated",
    "lastMessageTime": "1:15 PM",
    "isGroup": true,
    "isSecret": false,
    "unreadCount": 5,
    "selfDestructTimer": 0,
    "participantIds": ["user-1", "user-2", "user-3"],
    "isMuted": false,
    "myStatus": "JOINED",
    "myRole": "ADMIN",
    "isArchived": false,
    "isPinned": true
  }
]
```

**Kotlin DTO (CORRECTED):**
```kotlin
data class ChatDto(
    val id: String,
    val name: String? = null,           // Group name or other user's displayName
    val avatar: String? = null,
    val lastMessage: String = "",
    val lastMessageTime: String = "",   // "2:30 PM" format
    val isGroup: Boolean = false,
    val isSecret: Boolean = false,
    val unreadCount: Int = 0,
    val selfDestructTimer: Int = 0,
    val participantIds: List<String> = emptyList(),
    val isMuted: Boolean = false,
    val myStatus: String = "JOINED",    // "JOINED", "INVITED", "DECLINED"
    val myRole: String = "MEMBER",      // "OWNER", "ADMIN", "MEMBER"
    val isArchived: Boolean = false,
    val isPinned: Boolean = false
)
```

---

### 6️⃣ GET `/api/chats/{chatId}/messages`

**📥 ACTUAL RESPONSE (200):**
```json
[
  {
    "id": "msg-1",
    "chatId": "chat-123",
    "senderId": "user-123",
    "text": "Hello there!",               // ✅ Text field, NOT content
    "timestamp": "2:30 PM",            // Formatted time
    "isMine": false,
    "imageUrl": null,
    "videoUrl": null,
    "fileUrl": null,
    "audioUrl": null,
    "document": null,
    "location": null,
    "contact": null,
    "payment": null,
    "schedule": null,
    "wallet": null,
    "replyToId": null,
    "status": "READ",                  // "SENT", "DELIVERED", "READ"
    "isEdited": false,
    "isRead": true,
    "isPinned": false,
    "reactions": null,
    "createdAt": "2024-01-15T14:30:00.000Z",
    "deletedFor": []
  },
  {
    "id": "msg-2",
    "chatId": "chat-123",
    "senderId": "user-456",
    "text": "I'm doing great!",
    "timestamp": "2:31 PM",
    "isMine": true,
    "imageUrl": null,
    "videoUrl": null,
    "fileUrl": null,
    "audioUrl": null,
    "document": null,
    "location": null,
    "contact": null,
    "payment": null,
    "schedule": null,
    "wallet": null,
    "replyToId": "msg-1",              // ID of message being replied to
    "status": "DELIVERED",
    "isEdited": false,
    "isRead": true,
    "isPinned": false,
    "reactions": null,
    "createdAt": "2024-01-15T14:31:00.000Z",
    "deletedFor": []
  }
]
```

**Kotlin DTO (CORRECTED):**
```kotlin
data class MessageDto(
    val id: String,
    val chatId: String,
    val senderId: String,
    val text: String,                  // ✅ Not "content"
    val timestamp: String = "",        // Not "timeInfo"
    val isMine: Boolean = false,
    val imageUrl: String? = null,
    val videoUrl: String? = null,
    val fileUrl: String? = null,
    val audioUrl: String? = null,
    val document: Any? = null,
    val location: String? = null,
    val contact: Any? = null,
    val payment: Any? = null,
    val schedule: Any? = null,
    val wallet: Any? = null,
    val replyToId: String? = null,
    val status: String = "SENT",
    val isEdited: Boolean = false,
    val isRead: Boolean = false,
    val isPinned: Boolean = false,
    val reactions: Any? = null,
    val createdAt: String? = null,
    val deletedFor: List<String> = emptyList()
)
```

---

## User Profile Endpoints

### 7️⃣ GET `/api/user/profile/{userId}`

**📥 ACTUAL RESPONSE (200):**
```json
{
  "id": "user-456",
  "username": "raj_1034",
  "displayName": "Raj Sharma",
  "avatar": "https://...",
  "largeAvatar": "https://...",
  "bio": "Designer & Photographer",
  "isPrivate": false,
  "lastLogin": "2024-01-15T09:00:00.000Z",
  "invitationSettings": "everyone",
  "_count": {
    "followers": 120,
    "following": 89
  },
  "followers": ["user-1", "user-2"],   // Follower IDs
  "following": ["user-3"]               // Following IDs
}
```

⚠️ **Note:** This endpoint does NOT return email/phone for privacy.

---

### 8️⃣ Search Users

**GET `/api/users/search?q=harsh`**

**📥 ACTUAL RESPONSE (200):**
```json
[
  {
    "id": "user-123",
    "displayName": "Harsh Vardhan",
    "username": "harsh_7742",
    "phone": "+919876543210",          // Only if searchByPhone=true
    "avatar": "https://...",
    "bio": "Software Engineer",
    "isPrivate": false,
    "receivedFollowReqs": [            // Follow requests sent to this user
      { "senderId": "user-1" },
      { "senderId": "user-2" }
    ]
  }
]
```

---

## Social Endpoints

### 9️⃣ GET `/api/social/feed`

**📥 ACTUAL RESPONSE (200):**
```json
[
  {
    "id": "post-1",
    "authorId": "user-123",
    "content": "Just finished a new design system! 🎨",
    "mediaUrl": "https://...",
    "mediaType": "image",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
]
```

---

### 🔟 GET `/api/social/stories`

**📥 ACTUAL RESPONSE (200):**
```json
[
  {
    "id": "story-1",
    "userId": "user-123",
    "mediaUrl": "https://...",
    "mediaType": "image",
    "content": "Story caption here",
    "createdAt": "2024-01-15T14:00:00.000Z"
  }
]
```

---

## Field Name Mapping Cheat Sheet

### ❌ WRONG (from OpenAPI/Postman) → ✅ RIGHT (Actual Backend)

| What Docs Say | What Backend Sends | Kotlin Field Name |
|---------------|-------------------|------------------|
| `user: UserDto` | `name: String, avatar: String` | Individual fields |
| `content: String` | `text: String` | `text` |
| `timeInfo: String` | `lastMessageTime` or `timestamp` | Use exact backend name |
| `fullName` | `displayName` | `displayName` |
| `avatarUrl` | `avatar` or `largeAvatar` | Check response |
| Missing follower/following arrays | `followers: List<String>`, `following: List<String>` | Include them |

---

## Summary: What's Wrong with Your Docs?

### 1️⃣ OpenAPI (`openapi.yaml`)
- ✅ Endpoint paths are correct
- ❌ Does NOT specify that verify-otp returns ONLY token (no user)
- ❌ Doesn't document the actual response field names (text vs content, lastMessageTime vs timeInfo)

### 2️⃣ Postman Collection (`postman_collection.json`)
- ✅ Request structures are mostly correct
- ❌ Example responses have wrong field names
- ❌ Response structure doesn't match actual backend

### 3️⃣ Model Validation (`model_and_validation.md`)
- ✅ User model structure is documented
- ❌ Field names differ from actual responses (displayName vs fullName)
- ❌ Does NOT document Chat and Message response structures properly

---

## How to Use This Reference

**For Kotlin Mobile App:**

1. **Update all DTOs** in `ApiClient.kt` to match the field names shown above
2. **Test with Postman** on your Render server:
   ```bash
   # Get token
   curl -X POST https://aqualyn.onrender.com/api/auth/verify-otp \
     -d '{"identifier": "+919876543210", "otp": "123456"}'
   
   # Use token to fetch profile
   curl -H "Authorization: Bearer <token>" \
     https://aqualyn.onrender.com/api/auth/profile | jq
   ```
3. **Copy exact field names** from actual response
4. **Create DTOs** that match exactly

**For React/Web Frontend:**

1. Same process but use TypeScript interfaces
2. Ensure axios/fetch calls include `Authorization: Bearer` header
3. Map response objects correctly before storing in state

---

## Testing Checklist

- [ ] OTP send returns `{ message, otp, isExisting }`
- [ ] Verify OTP returns only `{ token }`
- [ ] Auth/sync returns full user with `followers` and `following` arrays
- [ ] Chat list returns `name` and `avatar` fields (not `user` object)
- [ ] Messages use `text` field (not `content`)
- [ ] Timestamps are formatted strings like "2:30 PM"
- [ ] User profiles don't leak email/phone except in search endpoint

---

## What to Fix First

1. **Update ChatDto and MessageDto** in mobile app ✅ (Already done)
2. **Update UserDto** to include all fields from actual `/api/auth/profile`
3. **Test OTP → Verify → Fetch Chats flow** end-to-end
4. **Regenerate Postman collection** from actual responses
5. **Update OpenAPI** with actual response schemas
