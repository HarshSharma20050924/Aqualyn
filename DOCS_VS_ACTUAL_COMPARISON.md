# ⚠️ OpenAPI & Postman vs ACTUAL Backend - Side by Side Comparison

Your documentation files have **discrepancies** with what the actual backend returns. This caused the mobile app DTO mismatch.

---

## 📋 PROBLEM #1: OpenAPI Doesn't Document Full Responses

### Endpoint: POST `/api/auth/verify-otp`

#### What OpenAPI Says:
```yaml
responses:
  '200':
    description: JWT token
    content:
      application/json:
        schema:
          type: object
          properties:
            token: { type: string }
```

#### What Backend ACTUALLY Returns:
```json
{
  "token": "eyJhbGc..." 
  // ⚠️ NO user object! Must call /api/auth/profile separately
}
```

#### What Your Kotlin App Expected (OLD):
```kotlin
data class VerifyOtpResponse(
    val token: String,
    val user: UserDto?  // ❌ Doesn't exist!
)
```

**Impact:** After OTP verification, app couldn't load user data because it expected it in the response.

---

## 📋 PROBLEM #2: Chat Response Structure Not Documented

### Endpoint: GET `/api/chats`

#### What Your OpenAPI Might Say:
```yaml
# Probably not documented at all or incorrect schema
```

#### What Backend ACTUALLY Returns:
```json
{
  "id": "chat-123",
  "name": "Harsh Vardhan",        // ← User's display name
  "avatar": "https://...",        // ← User's avatar
  "lastMessage": "Hey!",
  "lastMessageTime": "2:30 PM",   // ← Not "timeInfo"!
  "isGroup": false,
  "isSecret": false,
  "unreadCount": 5,
  "participantIds": ["user1", "user2"],
  "isMuted": false,
  "myStatus": "JOINED",
  "myRole": "MEMBER",
  "isArchived": false,
  "isPinned": false,
  "selfDestructTimer": 0
}
```

#### What Your Kotlin App Expected (OLD):
```kotlin
data class ChatDto(
    val user: UserDto?,           // ❌ Backend sends 'name' + 'avatar' fields, not nested user object
    val groupName: String?,       // ❌ Backend sends 'name'
    val timeInfo: String = "",    // ❌ Backend sends 'lastMessageTime'
    val unreadCount: Int = 0      // ✅ This matches
)
```

**Impact:** Chats couldn't deserialize → names wouldn't show → app fell back to hardcoded mock names.

---

## 📋 PROBLEM #3: Message Field Names Wrong in Documentation

### Endpoint: GET `/api/chats/{id}/messages`

#### What Model File Might Say:
```typescript
interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content?: string;              // ❌ Actual backend sends 'text'
  ...
}
```

#### What Backend ACTUALLY Returns:
```json
{
  "id": "msg-1",
  "chatId": "chat-123",
  "senderId": "user-123",
  "text": "Hello there!",           // ✅ 'text' NOT 'content'
  "timestamp": "2:30 PM",         // ✅ formatted time, NOT 'timeInfo'
  "status": "READ",
  "isEdited": false,
  "isRead": true,
  "isPinned": false,
  "reactions": null,
  "createdAt": "2024-01-15T14:30:00.000Z"
}
```

#### What Your Kotlin App Expected (OLD):
```kotlin
data class MessageDto(
    val content: String,          // ❌ Should be 'text'
    val timeInfo: String,         // ❌ Should be 'timestamp'
)
```

**Impact:** Message history wouldn't load → chat detail screen stayed empty.

---

## 📋 PROBLEM #4: User DTO Field Names Don't Match

### Endpoint: GET `/api/auth/profile`

#### What Model File Says:
```typescript
interface User {
  fullName?: string;             // ❌ Backend uses 'displayName'
  avatarUrl?: string;            // ❌ Backend uses 'avatar' + 'largeAvatar'
  ...
}
```

#### What Backend ACTUALLY Returns:
```json
{
  "id": "user-123",
  "username": "harsh_7742",
  "displayName": "Harsh Vardhan",  // ✅ Not 'fullName'
  "avatar": "https://...",         // ✅ Not 'avatarUrl'
  "largeAvatar": "https://...",
  "bio": "Software Engineer",
  "email": "+919876543210",
  "phone": "+919876543210",
  "dob": "1995-05-15T00:00:00.000Z",
  "isPrivate": false,
  "followers": ["user-1", "user-2"],      // ✅ Array of IDs
  "following": ["user-3"],                // ✅ Array of IDs
  "_count": {
    "followers": 45,
    "following": 23
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### What Your Kotlin App Probably Expected:
```kotlin
data class UserDto(
    val fullName: String?         // ❌ Backend sends 'displayName'
    val avatarUrl: String?        // ❌ Backend sends 'avatar' / 'largeAvatar'
    // Missing followers/following arrays!
)
```

**Impact:** User profiles wouldn't display correctly → names, avatars missing.

---

## 📊 Field Name Mapping Table

This table shows the EXACT discrepancies:

| Entity | Documentation Says | ACTUAL Backend Sends | Kotlin DTO Should Use |
|--------|-------------------|----------------------|----------------------|
| **User** | `fullName` | `displayName` | `displayName` |
| **User** | `avatarUrl` | `avatar`, `largeAvatar` | `avatar` |
| **User** | (not documented) | `followers: List<String>` | `followers: List<String>` |
| **User** | (not documented) | `following: List<String>` | `following: List<String>` |
| **Chat** | `user: UserDto` | `name: String, avatar: String` | Separate fields |
| **Chat** | `groupName` | `name` | `name` |
| **Chat** | `timeInfo` | `lastMessageTime` | `lastMessageTime` |
| **Message** | `content` | `text` | `text` |
| **Message** | `timeInfo` | `timestamp` | `timestamp` |
| **Message** | (missing fields) | `fileUrl`, `document`, `location`, `contact`, etc. | Include all fields |

---

## 🔧 Why This Happened

1. **OpenAPI written hastily** - Generic schema, doesn't reflect actual response structure
2. **Postman collection created from examples** - Not from actual API
3. **Model file written early** - Before backend was finalized
4. **Mobile app scaffolded before refinement** - Used incorrect definitions from old docs
5. **Backend evolved** - New fields added to responses, but docs not updated

---

## ✅ Files That Need Updating

### 1. `/home/harsh/Aqualyn/backend/openapi.yaml`
- [ ] Update `/api/auth/verify-otp` response (only returns token)
- [ ] Add complete `/api/chats` response schema
- [ ] Update `/api/chats/{id}/messages` to use correct field names
- [ ] Fix all User response schemas
- [ ] Document _count and array fields

### 2. `/home/harsh/Aqualyn/aqualyn-mobile/openapi.yaml`
- [ ] Sync with backend openapi.yaml
- [ ] Make sure response schemas match exactly

### 3. `/home/harsh/Aqualyn/aqualyn-mobile/model_and_validation.md`
- [ ] Update field names throughout
- [ ] Add example responses for each endpoint
- [ ] Document the actual JSON structures

### 4. `/home/harsh/Aqualyn/aqualyn-mobile/postman_collection.json`
- [ ] Update example responses to match actual backend
- [ ] Export fresh collection from Postman after testing with Render server
- [ ] Document all request/response bodies

### 5. `/home/harsh/Aqualyn/backend/postman_collection.json`
- [ ] Same as above for backend

---

## 📝 Example: How to Fix OpenAPI

**BEFORE (Wrong):**
```yaml
/api/chats:
  get:
    responses:
      '200':
        description: List of chats
        # Missing complete schema definition!
```

**AFTER (Correct):**
```yaml
/api/chats:
  get:
    security: [{ bearer: [] }]
    responses:
      '200':
        description: List of chats
        content:
          application/json:
            schema:
              type: array
              items:
                type: object
                properties:
                  id: { type: string }
                  name: { type: string, nullable: true }
                  avatar: { type: string, nullable: true }
                  lastMessage: { type: string }
                  lastMessageTime: { type: string }    # ← Correct field name!
                  isGroup: { type: boolean }
                  isSecret: { type: boolean }
                  unreadCount: { type: integer }
                  participantIds: { type: array, items: { type: string } }
                  isMuted: { type: boolean }
                  myStatus: { type: string, enum: [JOINED, INVITED, DECLINED] }
                  myRole: { type: string, enum: [OWNER, ADMIN, MEMBER] }
                  isArchived: { type: boolean }
                  isPinned: { type: boolean }
                  selfDestructTimer: { type: integer }
```

---

## 🎯 How to Generate CORRECT Documentation

### Method 1: Manual Testing (Fastest)
```bash
# 1. Get token
TOKEN=$(curl -s -X POST https://aqualyn.onrender.com/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"identifier": "+919876543210", "otp": "123456"}' | jq -r .token)

# 2. Test endpoints and copy responses
curl -H "Authorization: Bearer $TOKEN" \
  https://aqualyn.onrender.com/api/chats | jq > chats-response.json

# 3. Use jq to auto-generate schema
jq -r 'to_entries[] | "\(.key): \(.value | type)"' chats-response.json[0]
```

### Method 2: Postman Auto-Documentation
1. Create requests in Postman and test against live Render server
2. Auto-generate OpenAPI from Postman collection
3. Export as OpenAPI 3.0 YAML

### Method 3: Backend-Driven (Best)
1. Add JSDoc comments to backend endpoints
2. Use `tsoa` or `swagger-jsdoc` to auto-generate OpenAPI from code
3. Keep docs and code in sync automatically

---

## Summary

| Item | Status | Priority |
|------|--------|----------|
| OpenAPI has wrong field names | 🔴 Broken | HIGH |
| Postman collection outdated | 🔴 Broken | HIGH |
| Model validation misleading | 🟡 Partial | MEDIUM |
| Kotlin DTOs fixed | ✅ Done | - |
| Backend API working | ✅ Done | - |

**Your OpenAPI and Postman files were created before the backend was finalized, and nobody synchronized them afterward.** This is the root cause of all frontend integration issues.

---

## Next Steps

1. **Generate fresh OpenAPI from actual responses** (use ACTUAL_BACKEND_API_REFERENCE.md as source)
2. **Update Postman collection** with real response examples
3. **Update model_and_validation.md** with actual field names
4. **Test end-to-end:** OTP → Verify → Fetch Chats → Show names → Load messages

👉 Use `/home/harsh/Aqualyn/ACTUAL_BACKEND_API_REFERENCE.md` as the source of truth!
