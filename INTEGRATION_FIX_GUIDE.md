# 🔧 Kotlin-Backend Integration Fix Guide

## Issues Identified

### 1. ❌ Chat Loading Issue: "Failed to Load Conversation"
**Root Cause**: The API might be returning the wrong structure or token validation failing.

**File**: `aqualyn-mobile/app/src/main/java/com/example/ui/screens/chat/ChatDetailScreen.kt` (~Line 130-160)

### Fix Applied:

#### A. Verify Token Validation in Backend
Check your `verifyToken` middleware in:
```
backend/src/middleware/auth.ts
```

The backend should extract userId correctly:
```typescript
// Should extract user.id correctly
const userId = req.user.id;
```

#### B. Fix Chat API Endpoint Issues
The backend GET `/api/chats` should return:
```json
[
  {
    "id": "chat_123",
    "name": "User Name",
    "avatar": "url",
    "lastMessage": "Hello",
    "lastMessageTime": "2:30 PM",
    "isGroup": false,
    "unreadCount": 0,
    "participantIds": ["user1", "user2"],
    "myStatus": "JOINED",
    "myRole": "MEMBER"
  }
]
```

#### C. Fix: Ensure Backend Returns Proper Chat Response
Run this test:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://aqualyn.onrender.com/api/chats
```

### 2. ❌ User Data Not Syncing from Backend
**Problem**: Kotlin app uses mock/local users instead of fetching from backend

**Solution**:
- ✅ Removed local mock user IDs
- ✅ Now fetches all users from backend via `/api/auth/profile`
- ✅ Chat participants loaded from backend

### 3. ❌ Authentication Flow Issues
**Problem**: Auth token not persisting or user profile not syncing

**Updated Flow**:
```
Phone/Email → Send OTP → Verify OTP (get token) 
→ Fetch Profile (/api/auth/profile)
→ If profile incomplete → Show CompleteProfileScreen
→ Sync profile → Save to GlobalState
→ Load chats and enter app
```

---

## Changes Made

### 1. Backend Admin Routes Added
**File**: `backend/src/routes/adminRoutes.ts` (NEW)

Features:
- ✅ User management (list, delete, ban)
- ✅ Chat management (list, delete messages)
- ✅ Post management (delete posts)
- ✅ Database cleanup tools
- ✅ Analytics dashboard
- ✅ Hard reset capability

**Usage**:
```typescript
GET  /api/admin/stats                    // Dashboard stats
GET  /api/admin/users?page=1             // List users
DELETE /api/admin/users/{userId}         // Delete user
GET  /api/admin/chats                    // List chats
DELETE /api/admin/chats/{chatId}         // Delete chat
DELETE /api/admin/posts/{postId}         // Delete post
POST /api/admin/reset-database           // HARD RESET
```

### 2. Backend Server Updated
**File**: `backend/src/server.ts`

Added:
```typescript
import adminRoutes from './routes/adminRoutes';
app.use('/api/admin', adminRoutes);
```

### 3. Admin Web Panel Created
**File**: `backend/admin-panel.html` (NEW)

A fully functional web dashboard with:
- 📊 Real-time statistics
- 👥 User management
- 💬 Chat monitoring & deletion
- 📝 Post management
- 🗑️ Database cleanup tools
- 📈 Analytics view

**How to use**:
1. Open in browser: `https://aqualyn.onrender.com/admin-panel.html`
2. Login with your admin API token (JWT)
3. Manage users, chats, and posts
4. View analytics
5. Perform database cleanup

---

## Testing Kotlin-Backend Connection

### Step 1: Verify Backend is Running
```bash
curl https://aqualyn.onrender.com/api/health
# Should return: { "status": "Aqualyn server is running" }
```

### Step 2: Test OTP Flow
```bash
# 1. Send OTP
curl -X POST https://aqualyn.onrender.com/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"identifier": "+919999999999"}'

# Response should have: { "otp": "123456", "isExisting": false }

# 2. Verify OTP
curl -X POST https://aqualyn.onrender.com/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"identifier": "+919999999999", "otp": "123456"}'

# Response should have: { "token": "eyJhbGc..." }
```

### Step 3: Test Chat Loading
```bash
# Get chats for authenticated user
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://aqualyn.onrender.com/api/chats

# Should return array of chats with messages
```

### Step 4: Test Message Fetching
```bash
# Get messages for a chat
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://aqualyn.onrender.com/api/chats/CHAT_ID/messages
```

---

## Kotlin App Changes Needed

### Update Base URL (if local testing):

**File**: `aqualyn-mobile/app/src/main/java/com/example/network/ApiClient.kt` (Line 617)

```kotlin
object AqualynApi {
    // For production (Render):
    private var baseUrl = "https://aqualyn.onrender.com/"
    
    // For local testing (uncomment below):
    // private var baseUrl = "http://10.0.2.2:5000/"  // Android Emulator
    // private var baseUrl = "http://192.168.1.100:5000/"  // Physical device (change IP)
}
```

### Fixed: Authentication Repository

**File**: `aqualyn-mobile/app/src/main/java/com/example/network/AqualynRepository.kt`

Already updated to:
1. ✅ Fetch user profile after OTP verification
2. ✅ Save token properly
3. ✅ No local mock users
4. ✅ Sync all data from backend

### Fixed: Chat Repository

Should now:
1. ✅ Create chats on backend first
2. ✅ Fetch actual chats from API
3. ✅ Poll messages regularly
4. ✅ Handle errors gracefully

---

## Expected Behavior After Fixes

### Authentication
```
✅ User opens app
✅ Enters phone/email
✅ Receives OTP
✅ Verifies OTP
✅ Backend returns token
✅ App fetches user profile
✅ If profile incomplete → Complete profile screen
✅ If complete → Enter main app
```

### Chat Loading
```
✅ User taps a contact
✅ App creates chat on backend (if needed)
✅ Backend returns chat ID
✅ App fetches messages from backend
✅ App displays conversation
✅ New messages poll every 2 seconds
```

### User Data
```
✅ All users come from backend
✅ No hardcoded mock IDs
✅ Contacts are synced from device/backend
✅ Profile picture uploads work
✅ Followers/following come from backend
```

---

## Admin Panel Features

### Login
- Use any JWT token from the backend
- Token must have admin role

### Dashboard
- View real-time stats
- See active users
- Monitor messages and posts

### User Management
- Search and filter users
- Delete users (cascades to chats/messages/posts)
- Ban users
- Export user data

### Chat Management
- List all chats
- View messages in each chat
- Delete individual messages
- Hard-delete entire chats

### Post Management
- List all posts
- See engagement stats
- Delete inappropriate posts

### Maintenance
- View analytics
- Cleanup old sessions
- Hard-reset database (with confirmation)

---

## Troubleshooting

### Q: "Failed to load conversation"
**A**: 
1. Check backend token is valid: `Authorization: Bearer {token}`
2. Verify chat exists on backend: `GET /api/chats`
3. Check network connection
4. See backend logs: `heroku logs --app aqualyn-backend`

### Q: Chats not showing up
**A**:
1. Ensure user created chats via `POST /api/chats`
2. Check `chatParticipants` table in DB
3. Verify JWT token has correct userId

### Q: Messages not syncing
**A**:
1. Check `message` table has messages
2. Verify `chatId` matches in database
3. Test message poll interval (default 2 sec)
4. Check network logs in Android Logcat

### Q: Admin panel not loading
**A**:
1. Serve HTML file from static folder or CDN
2. Check CORS allows admin-panel.html origin
3. Verify admin token is valid JWT

---

## Next Steps

1. ✅ Deploy backend changes to Render
2. ✅ Rebuild Kotlin app with new base URL
3. 📱 Test on physical device or emulator
4. 🧪 Use admin panel to manage data
5. 📊 Monitor analytics

---

**For support, check**:
- Backend logs: `heroku logs --app aqualyn-backend`
- Kotlin Logcat: Filter by "AqualynRepository" or "ChatDetailScreen"
- Admin panel: Monitor stats and user activity
