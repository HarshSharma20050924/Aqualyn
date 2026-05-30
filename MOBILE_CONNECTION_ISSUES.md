# 🔴 Aqualyn Kotlin Mobile App - Backend Connection Issues

## Executive Summary
Your mobile app has **API references and models but is NOT actually connected to your backend**. It shows mock data because:
1. ❌ Base URL hardcoded to wrong server (Render instead of your backend)
2. ❌ Real-time typing indicator is a local animation, not from server
3. ❌ Mock user IDs baked into screens as fallbacks
4. ❌ Socket.io not properly wired for real-time events

---

## 🔴 PROBLEM #1: WRONG API BASE URL (CRITICAL)

### Location
`aqualyn-mobile/app/src/main/java/com/example/network/ApiClient.kt` - Line 375

### Current Code
```kotlin
object AqualynApi {
    private var baseUrl = "https://aqualyn.onrender.com/"  // ❌ WRONG SERVER!
```

### Impact
- **ALL API calls go to aqualyn.onrender.com instead of your backend server**
- That's why stories/friends show mock data - the remote server doesn't have your data
- Postman collection and OpenAPI schema don't matter if requests hit the wrong server

### Solution
Change it to point to your actual backend:

```kotlin
object AqualynApi {
    // For development:
    private var baseUrl = "http://10.0.2.2:5000/"  // Android emulator localhost
    // OR for staging/production:
    // private var baseUrl = "https://your-backend-domain.com/"
```

**Key Mappings:**
- **Android Emulator → Local Machine:** `http://10.0.2.2:5000/` (not localhost!)
- **Physical Device → Local Network:** `http://192.168.x.x:5000/`  
- **Production:** `https://your-production-backend.com/`

---

## 🔴 PROBLEM #2: MOCK TYPING INDICATOR

### Location
`aqualyn-mobile/app/src/main/java/com/example/ui/screens/ChatDetailScreen.kt` - Lines 116, 373-379

### Current Code
```kotlin
var isTyping by remember { mutableStateOf(false) }  // ❌ Local state, never updated by server!

// Line 373-379: Just animates dots, doesn't receive from Socket.io
if (isTyping) {
    item {
        Row(...) {
            Text("$resolvedName is typing...", fontSize = 12.sp, ...)
            // Animating dots... but this is ALWAYS false in practice
        }
    }
}
```

### Impact
- Typing indicator animates but **never shows you when the other person is actually typing**
- No Socket.io listener for typing events
- The `isTyping` boolean is never set to `true` by server events

### Real Implementation Needed
```kotlin
// In ChatDetailScreen or ViewModel:
var typingUsers by remember { mutableStateOf<List<String>>(emptyList()) }

LaunchedEffect(Unit) {
    // Listen for typing events from Socket.io
    socket?.on("typing") { data ->
        val userId = (data as? Map<*, *>)?.get("userId") as? String
        if (userId != null) {
            typingUsers = typingUsers + userId
        }
    }
    
    socket?.on("stop_typing") { data ->
        val userId = (data as? Map<*, *>)?.get("userId") as? String
        typingUsers = typingUsers.filter { it != userId }
    }
}

// Then use:
val typingInThisChat = typingUsers.filter { id -> 
    conversations[chatId]?.participantIds?.contains(id) == true
}
if (typingInThisChat.isNotEmpty()) {
    ShowTypingIndicator(typingInThisChat.map { users.find { u -> u.id == it }?.name })
}
```

---

## 🔴 PROBLEM #3: MOCK FALLBACK USER IDS

### Location
`aqualyn-mobile/app/src/main/java/com/example/ui/screens/ChatDetailScreen.kt` - Lines 67-80

### Current Code
```kotlin
val resolvedName = remember(userId, chatFromState, dynamicUserDetail) {
    if (chatFromState?.isGroup == true) {
        chatFromState.groupName ?: "Group Room"
    } else {
        dynamicUserDetail?.name ?: chatFromState?.user?.name ?: when (userId) {
            "c1" -> "Design Team"        // ❌ MOCK
            "c2" -> "Secret Project"     // ❌ MOCK
            "c3" -> "Harsh Vardhan"      // ❌ MOCK
            "c4" -> "Raj Sharma"         // ❌ MOCK
            "c5" -> "Mini Militia Devs"  // ❌ MOCK
            "raj_1034" -> "Raj Sharma"
            "harsh_7742" -> "Harsh Vardhan"
            "bhavya_xx" -> "Bhavya Goel"
            "sam_99" -> "Samar Joy"
            else -> "Ansh"
        }
    }
}
```

### Impact
- When real user data fails to load, these hardcoded names appear
- Chat list shows "Design Team" and "Secret Project" which don't exist on your backend
- User IDs like "c1", "c2" are test data

### Problem Chain
1. API request to fetch chats from backend fails (wrong base URL)
2. Chat list shows empty or cached data with "c1", "c2" IDs
3. You click a chat with ID "c1"
4. App tries to fetch user profile for "c1"
5. Backend doesn't know "c1" (it's not a real user)
6. Fallback to "Design Team" mock name

---

## 🔴 PROBLEM #4: MOCK STORIES & FRIENDS IN FEED

### Location
`aqualyn-mobile/app/src/main/java/com/example/ui/screens/FeedScreen.kt` - Lines 130-160

### Current Code
```kotlin
LaunchedEffect(Unit) {
    if (postsList.isEmpty() && storiesList.isEmpty()) {
        val remotePosts = com.example.network.AqualynRepository.fetchFeed()
        if (remotePosts.isNotEmpty()) {
            // Fetch from real API
            postsList.clear()
            remotePosts.forEach { post -> ... }
        }
        // ❌ If API returns nothing, lists stay empty
        // But there are hardcoded default avatars as fallback:
        val defaultAvatarYourStr = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?..."  
        val defaultAvatarRaj = "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?..."
        // These are just placeholder URLs
    }
}
```

### Impact
- Feed shows empty because API returns nothing (wrong base URL)
- You have hardcoded default avatars as "backup" but no real data shown

---

## ✅ ROOT CAUSE ANALYSIS

### Why Even With Postman/OpenAPI You Can't Connect:

| Resource | Status | Problem |
|----------|--------|---------|
| OpenAPI Schema | ✅ Created | But points to docs, not API config |
| Postman Collection | ✅ Created | Manual testing tool, doesn't affect app |
| API Models.kt | ✅ Created | Request/response DTOs are correct |
| AqualynRepository | ✅ Created | Logic is correct |
| **Base URL in ApiClient** | ❌ **WRONG** | Points to aqualyn.onrender.com, not your backend |
| Socket.io Connection | ❌ **Not Using** | No real-time typing sync implemented |
| Auth Token Flow | ⚠️ Partial | Token saved but auth interceptor may not work with wrong URL |

---

## 🔧 IMMEDIATE FIXES REQUIRED

### Fix 1: Update Base URL
```kotlin
// In ApiClient.kt line 375
private var baseUrl = "http://10.0.2.2:5000/"  // Change this!
```

### Fix 2: Implement Real Typing Events
- Add Socket.io listener for `typing` and `stop_typing` events
- Update UI state when events arrive
- Remove hardcoded `isTyping` boolean

### Fix 3: Remove/Comment Out Mock Fallbacks
```kotlin
// Either remove mock IDs entirely
// Or add a debug flag to show only when needed:
companion object {
    const val DEBUG_MODE = false
    val MOCK_USER_IDS = mapOf(
        "c1" to "Design Team",
        "c2" to "Secret Project",
        // ...
    )
}

if (DEBUG_MODE) {
    resolvedName = MOCK_USER_IDS[userId] ?: "Unknown"
}
```

### Fix 4: Verify Socket.io Configuration
Search for `io(API_BASE_URL` in codebase and ensure it matches the new base URL.

---

## 📋 Checklist to Fully Connect

- [ ] Change base URL in ApiClient.kt to your backend
- [ ] Test OTP send/verify works with real backend
- [ ] Verify chats list loads from your database (not mocks)
- [ ] Implement Socket.io typing events
- [ ] Remove hardcoded mock user IDs or gate them behind DEBUG flag
- [ ] Test feed loads real posts/stories
- [ ] Test contacts/friends sync from real data
- [ ] Verify real-time message delivery works
- [ ] Test typing indicator updates in real-time

---

## 🔍 How to Debug

### 1. Add Logging
```kotlin
// In AqualynRepository.kt
Log.d(TAG, "API Base URL: ${AqualynApi.getBaseUrl()}")
Log.d(TAG, "Fetching chats from: ${ENDPOINTS.CHATS}")
```

### 2. Intercept Network Calls
The HttpLoggingInterceptor is already enabled (ApiClient.kt line 400):
```kotlin
.addInterceptor(okhttp3.logging.HttpLoggingInterceptor().apply {
    level = okhttp3.logging.HttpLoggingInterceptor.Level.BODY  // ✅ Good for debugging
})
```
Check Android Logcat for `OkHttp` logs showing actual URLs being called.

### 3. Verify Backend is Running
```bash
curl http://localhost:5000/api/chats
# Should return real data, not 404 or connection refused
```

### 4. Test with Postman First
Before running mobile app, test your backend with Postman collection to ensure API works.

---

## 🎯 Why This Happened

The mobile app was scaffolded with:
- ✅ Correct model definitions (Models.kt matches your Prisma schema)
- ✅ Proper API interface (AqualynApiService has all endpoints)
- ✅ Working repository pattern (AqualynRepository.kt has all methods)
- ❌ **Default placeholder base URL** (aqualyn.onrender.com - probably a demo/example)
- ❌ **No real-time event listeners** (Socket.io not wired)
- ❌ **Mock data as fallback** (test user IDs and names)

It's like you have a perfectly configured car (Models, Repository, API interface) but pointed in the wrong direction (wrong server) without any navigation (Socket.io not listening).

---

## Summary

| Item | Status | Action |
|------|--------|--------|
| You have API specs | ✅ | But app points to wrong server |
| You have Postman collection | ✅ | But not used by app |
| You have model validation | ✅ | But entities don't match because wrong server |
| Real-time typing | ❌ | Needs Socket.io listener implementation |
| Mock friends/stories | ✅ Present | Remove or gate behind DEBUG flag |

**Next Step:** Update the base URL and test. You should immediately see your real data instead of mocks.
