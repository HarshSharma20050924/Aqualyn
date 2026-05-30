// CORRECTED ApiClient.kt DTOs - Based on ACTUAL Backend Responses
// Drop this into aqualyn-mobile/app/src/main/java/com/example/network/ApiClient.kt

package com.example.network

import com.example.model.ChatItem
import com.example.model.Message
import com.example.model.PostItem
import com.example.model.StoryItem
import com.example.model.User
import retrofit2.Response
import retrofit2.http.*

// ========================================
// 🔐 AUTH DTOs
// ========================================

data class SendOtpRequest(val identifier: String)

data class SendOtpResponseDto(
    val message: String? = null,
    val otp: String? = null,           // ✅ DEV only, shows in test - remove in production
    val isExisting: Boolean? = null    // ✅ true if user exists, false if new
)

data class VerifyOtpRequest(val identifier: String, val otp: String)

// ✅ CORRECTED: Backend returns ONLY token, no user - must call /api/auth/profile after
data class VerifyOtpResponse(
    val token: String
)

data class SyncAuthRequest(
    val displayName: String? = null,
    val username: String? = null,
    val dob: String? = null,
    val avatar: String? = null
)

// ✅ CORRECTED: /api/auth/sync returns full user with followers/following arrays
data class SyncAuthResponse(
    val success: Boolean? = null,
    val message: String? = null,
    val status: String? = null,        // "needs_profile" or success
    val user: UserDto? = null,
    val token: String? = null
)

// ========================================
// 👤 USER DTOs
// ========================================

// ✅ CORRECTED: All field names match actual backend response
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
    val appLockPin: String? = null,
    val lastLogin: String? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null,
    // ✅ Arrays of IDs, not nested User objects
    val followers: List<String> = emptyList(),
    val following: List<String> = emptyList(),
    // ✅ Count object from backend
    val _count: CountDto? = null,
    // For search endpoint only
    val receivedFollowReqs: List<FollowReqDto> = emptyList()
) {
    fun toDomain(): User = User(
        id = id,
        name = displayName ?: username ?: "User",
        handle = username ?: "",
        role = "user",
        description = bio ?: "",
        avatarUrl = avatar ?: largeAvatar ?: "",
        isOnline = false,
        followers = _count?.followers ?: followers.size,
        following = _count?.following ?: following.size
    )
}

data class CountDto(
    val followers: Int = 0,
    val following: Int = 0
)

data class FollowReqDto(
    val senderId: String
)

// ========================================
// 💬 CHAT DTOs
// ========================================

// ✅ CORRECTED: Matches actual /api/chats response
data class ChatDto(
    val id: String,
    val name: String? = null,                  // Group name OR other user's displayName
    val avatar: String? = null,
    val lastMessage: String = "",
    val lastMessageTime: String = "",          // ✅ NOT timeInfo - formatted like "2:30 PM"
    val isGroup: Boolean = false,
    val isSecret: Boolean = false,
    val unreadCount: Int = 0,
    val selfDestructTimer: Int = 0,
    val participantIds: List<String> = emptyList(),
    val isMuted: Boolean = false,
    val myStatus: String = "JOINED",           // "JOINED", "INVITED", "DECLINED"
    val myRole: String = "MEMBER",             // "OWNER", "ADMIN", "MEMBER"
    val isArchived: Boolean = false,
    val isPinned: Boolean = false
) {
    fun toDomain(): ChatItem = ChatItem(
        id = id,
        user = User(
            id = id,
            name = name ?: "User",
            handle = name?.lowercase()?.replace(" ", "_") ?: "",
            role = "user",
            description = "",
            avatarUrl = avatar ?: "",
            isOnline = myStatus == "ONLINE",
            followers = 0,
            following = 0
        ),
        isGroup = isGroup,
        groupName = if (isGroup) name else null,
        lastMessage = lastMessage,
        timeInfo = lastMessageTime,            // ✅ Maps lastMessageTime to timeInfo
        unreadCount = unreadCount,
        isPinned = isPinned,
        isVoiceMessage = false
    )
}

// ✅ CORRECTED: Matches actual /api/chats/{id}/messages response
data class MessageDto(
    val id: String,
    val chatId: String = "",
    val senderId: String,
    val text: String = "",                     // ✅ NOT content - backend sends text
    val timestamp: String = "",                // ✅ Formatted like "2:30 PM", NOT timeInfo
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
    val status: String = "SENT",               // "SENT", "DELIVERED", "READ"
    val isEdited: Boolean = false,
    val isRead: Boolean = false,
    val isPinned: Boolean = false,
    val reactions: Any? = null,
    val createdAt: String? = null,
    val deletedFor: List<String> = emptyList()
) {
    fun toDomain(): Message = Message(
        id = id,
        senderId = senderId,
        content = text,                        // ✅ Map text field to content domain model
        timeInfo = timestamp,                  // ✅ Map timestamp to timeInfo
        isMine = isMine,
        imageUrl = imageUrl,
        videoUrl = videoUrl,
        audioUrl = audioUrl,
        documentName = (document as? Map<*, *>)?.get("name")?.toString(),
        location = location,
        paymentAmount = (payment as? Map<*, *>)?.get("amount")?.toString(),
        replyToMsg = null,
        reactions = emptyList(),
        isPinned = isPinned,
        isEdited = isEdited
    )
}

data class MessageSendInputDto(
    val content: String,
    val replyToId: String? = null
)

// ========================================
// 📱 SOCIAL DTOs
// ========================================

data class PostDto(
    val id: String,
    val authorId: String? = null,
    val content: String? = null,
    val caption: String? = null,
    val mediaUrl: String? = null,
    val mediaType: String? = null,             // "image", "video"
    val likesCount: Int = 0,
    val timeAgo: String = "Just now",
    val location: String = "",
    val isCommentsDisabled: Boolean = false,
    val createdAt: String? = null,
    val updatedAt: String? = null
) {
    fun toDomain(): PostItem = PostItem(
        id = id,
        imageDescription = content ?: caption ?: "",
        caption = caption ?: content ?: "",
        likesCount = likesCount,
        timeAgo = timeAgo,
        isCommentsDisabled = isCommentsDisabled,
        location = location,
        authorId = authorId,
        mediaUrl = mediaUrl
    )
}

data class StoryDto(
    val id: String,
    val userId: String? = null,
    val mediaUrl: String? = null,
    val mediaType: String? = null,
    val content: String? = null,
    val title: String? = null,
    val isViewed: Boolean = false,
    val isMe: Boolean = false,
    val createdAt: String? = null
) {
    fun toDomain(): StoryItem = StoryItem(
        id = id,
        title = content ?: title ?: "Story",
        isViewed = isViewed,
        isMe = isMe,
        userId = userId,
        mediaUrl = mediaUrl
    )
}

// ========================================
// REQUEST DTOs
// ========================================

data class CreatePostRequest(
    val content: String? = null,
    val mediaUrl: String? = null,
    val mediaType: String? = null
)

data class CreateStoryRequest(
    val mediaUrl: String,
    val mediaType: String,
    val content: String? = null
)

data class CommentRequest(val content: String)

data class FollowRequest(val targetUserId: String)

data class UnfollowRequest(val targetUserId: String)

data class BlockRequest(val targetUserId: String)

data class ReportRequest(val targetUserId: String, val reason: String? = null)

data class PrivacySettingsDto(
    val invitationSettings: String? = null,
    val showPhoneTo: String? = null,
    val searchByPhone: Boolean? = null,
    val isPrivate: Boolean? = null
)

// ========================================
// OTHER DTOs  
// ========================================

data class SettingsDto(
    val archivePinRequired: Boolean = false,
    val archivePinCode: String = "",
    val notificationsEnabled: Boolean = true,
    val secureMute: Boolean = false
)

data class SessionDto(
    val id: String,
    val deviceName: String,
    val ipAddress: String,
    val lastActive: String
)

data class StorageUsageDto(
    val totalBytes: Long,
    val audioBytes: Long,
    val videoBytes: Long,
    val mediaBytes: Long,
    val docsBytes: Long
)

data class CallHistoryDto(
    val id: String,
    val callerName: String,
    val callerAvatar: String,
    val timestamp: String,
    val duration: String,
    val isVideo: Boolean,
    val isIncoming: Boolean
)

data class ContactSyncRequest(val contacts: List<String>)

data class UploadResponseDto(
    val success: Boolean,
    val url: String,
    val filename: String,
    val mimetype: String
)

data class SearchResponseDto(
    val users: List<UserDto>? = null,
    val posts: List<PostDto>? = null
)

data class CreateGroupRequest(
    val name: String,
    val participantIds: List<String> = emptyList(),
    val description: String? = null
)

// ========================================
// API SERVICE INTERFACE
// ========================================

interface AqualynApiService {
    // ── AUTH ──
    @POST("api/auth/send-otp")
    suspend fun sendOtp(@Body request: SendOtpRequest): Response<SendOtpResponseDto>

    @POST("api/auth/verify-otp")
    suspend fun verifyOtp(@Body request: VerifyOtpRequest): Response<VerifyOtpResponse>

    @POST("api/auth/sync")
    suspend fun syncAuth(@Body request: SyncAuthRequest? = null): Response<SyncAuthResponse>

    @POST("api/auth/sync-token")
    suspend fun syncToken(): Response<SyncAuthResponse>

    @GET("api/auth/profile")
    suspend fun getMyProfile(): Response<UserDto>

    @POST("api/auth/logout")
    suspend fun logout(): Response<Unit>

    // ── USER ──
    @GET("api/user/profile/{id}")
    suspend fun getUserProfile(@Path("id") id: String): Response<UserDto>

    @GET("/api/users/search")
    suspend fun searchUsers(@Query("q") query: String): Response<List<UserDto>>

    @POST("api/user/follow")
    suspend fun followUser(@Body request: FollowRequest): Response<Unit>

    @POST("api/user/unfollow")
    suspend fun unfollowUser(@Body request: UnfollowRequest): Response<Unit>

    @POST("api/user/block")
    suspend fun blockUser(@Body request: BlockRequest): Response<Unit>

    @POST("api/user/report")
    suspend fun reportUser(@Body request: ReportRequest): Response<Unit>

    @GET("api/user/blocked")
    suspend fun getBlockedUsers(): Response<List<String>>

    @GET("api/user/settings")
    suspend fun getSettings(): Response<SettingsDto>

    @PATCH("api/user/settings")
    suspend fun updateSettings(@Body settings: SettingsDto): Response<Unit>

    @GET("api/user/sessions")
    suspend fun getSessions(): Response<List<SessionDto>>

    @DELETE("api/user/sessions/{id}")
    suspend fun revokeSession(@Path("id") id: String): Response<Unit>

    @GET("api/user/storage-usage")
    suspend fun getStorageUsage(): Response<StorageUsageDto>

    @GET("api/user/export")
    suspend fun exportData(): Response<Unit>

    @POST("api/user/contacts/sync")
    suspend fun syncContacts(@Body request: ContactSyncRequest): Response<List<UserDto>>

    @GET("api/user/call-history")
    suspend fun getCallHistory(): Response<List<CallHistoryDto>>

    @GET("api/user/{userId}/followers")
    suspend fun getFollowers(@Path("userId") userId: String): Response<List<UserDto>>

    @GET("api/user/{userId}/following")
    suspend fun getFollowing(@Path("userId") userId: String): Response<List<UserDto>>

    // ── CHATS ──
    @GET("api/chats")
    suspend fun getChats(): Response<List<ChatDto>>

    @GET("api/chats/{id}/messages")
    suspend fun getChatMessages(@Path("id") id: String): Response<List<MessageDto>>

    @POST("api/chats/{id}/messages")
    suspend fun sendChatMessage(@Path("id") id: String, @Body message: MessageSendInputDto): Response<MessageDto>

    @POST("api/chats/{id}/mute")
    suspend fun muteChat(@Path("id") id: String): Response<Unit>

    @GET("api/chats/{id}/media")
    suspend fun getChatMedia(@Path("id") id: String): Response<List<String>>

    @POST("api/groups/create")
    suspend fun createGroup(@Body request: CreateGroupRequest): Response<ChatDto>

    // ── SOCIAL ──
    @GET("api/social/feed")
    suspend fun getFeed(): Response<List<PostDto>>

    @GET("api/social/stories")
    suspend fun getStories(): Response<List<StoryDto>>

    @GET("api/social/search")
    suspend fun globalSearch(@Query("q") query: String): Response<SearchResponseDto>

    @POST("api/social/post")
    suspend fun createPost(@Body request: CreatePostRequest): Response<PostDto>

    @POST("api/social/story")
    suspend fun createStory(@Body request: CreateStoryRequest): Response<StoryDto>

    @DELETE("api/social/post/{id}")
    suspend fun deletePost(@Path("id") id: String): Response<Unit>

    @POST("api/social/post/{id}/like")
    suspend fun likePost(@Path("id") id: String): Response<Unit>

    @POST("api/social/post/{id}/comment")
    suspend fun commentPost(@Path("id") id: String, @Body request: CommentRequest): Response<Unit>

    @GET("api/social/user/{userId}/posts")
    suspend fun getUserPosts(@Path("userId") userId: String): Response<List<PostDto>>

    @GET("api/social/user/{userId}/stories")
    suspend fun getUserStories(@Path("userId") userId: String): Response<List<StoryDto>>

    // ── UPLOAD ──
    @Multipart
    @POST("api/upload")
    suspend fun uploadFile(@Part file: okhttp3.MultipartBody.Part): Response<UploadResponseDto>
}

