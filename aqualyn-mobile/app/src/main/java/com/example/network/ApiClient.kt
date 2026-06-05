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

data class ParticipantDto(
    val userId: String,
    val role: String? = null,
    val status: String? = null,
    val isArchived: Boolean = false,
    val isPinned: Boolean = false,
    val user: UserDto? = null
)

// ✅ CORRECTED: Matches actual /api/chats response including participants and nested user info
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
    val isPinned: Boolean = false,
    val user: UserDto? = null,                 // Support flat "user" key
    val participants: List<ParticipantDto> = emptyList() // Support "participants" array
) {
    fun toDomain(): ChatItem {
        var peerId = user?.id
        var peerName = user?.displayName ?: user?.username
        var peerHandle = user?.username
        var peerAvatar = user?.avatar ?: user?.largeAvatar
        var peerBio = user?.bio
        var followersSize = user?._count?.followers ?: user?.followers?.size ?: 0
        var followingSize = user?._count?.following ?: user?.following?.size ?: 0

        if (peerId == null && participants.isNotEmpty()) {
            val selfId = com.example.model.GlobalState.currentUserProfile?.id ?: com.example.model.GlobalState.currentUserId
            val peer = participants.find { it.userId != selfId }
                ?: participants.firstOrNull { it.userId != selfId && it.userId != "me" }
                ?: participants.firstOrNull()
            if (peer != null) {
                peerId = peer.user?.id ?: peer.userId
                peerName = peer.user?.displayName ?: peer.user?.username
                peerHandle = peer.user?.username
                peerAvatar = peer.user?.avatar ?: peer.user?.largeAvatar
                peerBio = peer.user?.bio
                followersSize = peer.user?._count?.followers ?: peer.user?.followers?.size ?: 0
                followingSize = peer.user?._count?.following ?: peer.user?.following?.size ?: 0
            }
        }

        val finalPeerId = peerId ?: id
        val finalName = peerName ?: name ?: "User"
        val finalHandle = peerHandle ?: finalName.lowercase().replace(" ", "_")
        val finalAvatar = peerAvatar ?: avatar ?: ""

        return ChatItem(
            id = id,
            user = User(
                id = finalPeerId,
                name = finalName,
                handle = finalHandle,
                role = "user",
                description = peerBio ?: "",
                avatarUrl = finalAvatar,
                isOnline = myStatus == "ONLINE",
                followers = followersSize,
                following = followingSize
            ),
            isGroup = isGroup,
            groupName = if (isGroup) (name ?: "Group") else null,
            lastMessage = lastMessage,
            timeInfo = lastMessageTime,            // ✅ Maps lastMessageTime to timeInfo
            unreadCount = unreadCount,
            isPinned = isPinned,
            isVoiceMessage = false
        )
    }
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

data class ContactSyncRequest(val phones: List<String>)

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

data class NotificationDto(
    val id: String,
    val userId: String,
    val actorId: String,
    val type: String,
    val targetId: String?,
    val text: String?,
    val isRead: Boolean,
    val createdAt: String,
    val user: UserDto?,
    val actor: UserDto?
)

data class HandleFollowRequestDto(
    val followerId: String,
    val action: String // "accept" or "reject"
)

data class CreateGroupRequest(
    val name: String,
    val participantIds: List<String> = emptyList(),
    val description: String? = null
)

data class CreateChatRequest(
    val isGroup: Boolean,
    val name: String,
    val memberIds: List<String>
)

data class SetPinRequest(val pin: String)
data class VerifyPinRequest(val pin: String)
data class UploadAvatarRequest(val avatar: String)
data class UploadAvatarResponse(val success: Boolean, val avatar: String)
data class SecretChatRequest(val targetUserId: String)
data class SecretChatResponse(val success: Boolean, val chat: ChatDto, val alreadyExists: Boolean? = null)
data class SecretChatHandle(val chatId: String, val action: String)
data class SecretChatHandleResponse(val success: Boolean, val status: String)
data class CreateFolderRequest(val name: String, val chatIds: List<String>)
data class ChatFolderDto(val id: String, val userId: String, val name: String, val chatIds: List<String>)

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

    @GET("api/users/search")
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

    @POST("api/user/export")
    suspend fun exportData(): Response<Unit>

    @POST("api/user/contacts/sync")
    suspend fun syncContacts(@Body request: ContactSyncRequest): Response<List<UserDto>>

    @GET("api/user/call-history")
    suspend fun getCallHistory(): Response<List<CallHistoryDto>>

    @GET("api/user/{userId}/followers")
    suspend fun getFollowers(@Path("userId") userId: String): Response<List<UserDto>>

    @GET("api/user/{userId}/following")
    suspend fun getFollowing(@Path("userId") userId: String): Response<List<UserDto>>

    @POST("api/user/pin/set")
    suspend fun setAppLockPin(@Body request: SetPinRequest): Response<Unit>

    @POST("api/user/pin/verify")
    suspend fun verifyAppLockPin(@Body request: VerifyPinRequest): Response<Unit>

    @PATCH("api/user/privacy")
    suspend fun updatePrivacy(@Body request: PrivacySettingsDto): Response<UserDto>

    @POST("api/user/upload-avatar")
    suspend fun uploadAvatar(@Body request: UploadAvatarRequest): Response<UploadAvatarResponse>

    // ── CHATS ──
    @GET("api/chats")
    suspend fun getChats(): Response<List<ChatDto>>

    @POST("api/chats")
    suspend fun createChat(@Body request: CreateChatRequest): Response<ChatDto>

    @GET("api/chats/{id}/messages")
    suspend fun getChatMessages(@Path("id") id: String): Response<List<MessageDto>>

    @POST("api/chats/{id}/messages")
    suspend fun sendChatMessage(@Path("id") id: String, @Body message: MessageSendInputDto): Response<MessageDto>

    @POST("api/chats/{id}/mute")
    suspend fun muteChat(@Path("id") id: String): Response<Unit>

    @DELETE("api/chats/{id}/messages/{messageId}")
    suspend fun deleteMessage(@Path("id") id: String, @Path("messageId") messageId: String): Response<Unit>

    @POST("api/chats/{id}/messages/{messageId}/reactions")
    suspend fun reactMessage(@Path("id") id: String, @Path("messageId") messageId: String, @Body request: Map<String, Any>): Response<Unit>

    @GET("api/chats/{id}/media")
    suspend fun getChatMedia(@Path("id") id: String): Response<List<String>>

    @POST("api/groups/create")
    suspend fun createGroup(@Body request: CreateGroupRequest): Response<ChatDto>

    @POST("api/chats/secret/request")
    suspend fun requestSecretChat(@Body request: SecretChatRequest): Response<SecretChatResponse>

    @POST("api/chats/secret/handle")
    suspend fun handleSecretChat(@Body request: SecretChatHandle): Response<SecretChatHandleResponse>

    @GET("api/chats/folders")
    suspend fun getChatFolders(): Response<List<ChatFolderDto>>

    @POST("api/chats/folders")
    suspend fun createChatFolder(@Body request: CreateFolderRequest): Response<ChatFolderDto>

    @PUT("api/chats/folders/{id}")
    suspend fun updateChatFolder(@Path("id") id: String, @Body request: CreateFolderRequest): Response<ChatFolderDto>

    @DELETE("api/chats/folders/{id}")
    suspend fun deleteChatFolder(@Path("id") id: String): Response<Unit>

    @POST("api/chats/{chatId}/pin")
    suspend fun pinChat(@Path("chatId") chatId: String): Response<Unit>

    @POST("api/chats/{chatId}/archive")
    suspend fun archiveChat(@Path("chatId") chatId: String): Response<Unit>

    @POST("api/chats/{chatId}/messages/{messageId}/pin")
    suspend fun pinChatMessage(@Path("chatId") chatId: String, @Path("messageId") messageId: String): Response<Unit>

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

    @PATCH("api/social/post/{id}")
    suspend fun editPost(@Path("id") id: String, @Body request: Map<String, Any>): Response<PostDto>

    @POST("api/social/post/{id}/like")
    suspend fun likePost(@Path("id") id: String): Response<Unit>

    @POST("api/social/post/{id}/comment")
    suspend fun commentPost(@Path("id") id: String, @Body request: CommentRequest): Response<Unit>

    @POST("api/social/post/{id}/save")
    suspend fun savePost(@Path("id") id: String): Response<Unit>

    @POST("api/social/story/{id}/view")
    suspend fun viewStory(@Path("id") id: String): Response<Unit>

    @GET("api/user/notifications")
    suspend fun getNotifications(): Response<List<NotificationDto>>

    @POST("api/user/notifications/read")
    suspend fun markNotificationsRead(): Response<Unit>

    @POST("api/user/follow-request/handle")
    suspend fun handleFollowRequest(@Body request: HandleFollowRequestDto): Response<Unit>

    @GET("api/social/user/{userId}/posts")
    suspend fun getUserPosts(@Path("userId") userId: String): Response<List<PostDto>>

    @GET("api/social/user/{userId}/stories")
    suspend fun getUserStories(@Path("userId") userId: String): Response<List<StoryDto>>

    // ── UPLOAD ──
    @Multipart
    @POST("api/upload")
    suspend fun uploadFile(@Part file: okhttp3.MultipartBody.Part): Response<UploadResponseDto>
}

// ========================================
// API ENGINE
// ========================================

object AqualynApi {
    // ✅ BACKEND: Render Production
    private var baseUrl = "https://aqualyn.onrender.com/"

    fun setBaseUrl(url: String) {
        baseUrl = if (url.endsWith("/")) url else "$url/"
        rebuildService()
    }

    fun getBaseUrl(): String = baseUrl

    private val moshi = com.squareup.moshi.Moshi.Builder()
        .add(com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory())
        .build()

    private val okHttpClient = okhttp3.OkHttpClient.Builder()
        .connectTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
        .readTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
        .addInterceptor { chain ->
            val original = chain.request()
            val token = com.example.model.GlobalState.authToken
            if (!token.isNullOrEmpty()) {
                val reqBuilder = original.newBuilder()
                    .header("Authorization", "Bearer $token")
                chain.proceed(reqBuilder.build())
            } else {
                chain.proceed(original)
            }
        }
        .addInterceptor(okhttp3.logging.HttpLoggingInterceptor().apply {
            level = okhttp3.logging.HttpLoggingInterceptor.Level.BODY
        })
        .build()

    private var retrofit = retrofit2.Retrofit.Builder()
        .baseUrl("https://aqualyn.onrender.com/")
        .client(okHttpClient)
        .addConverterFactory(retrofit2.converter.moshi.MoshiConverterFactory.create(moshi))
        .build()

    private var service: AqualynApiService = retrofit.create(AqualynApiService::class.java)

    fun getService(): AqualynApiService = service

    private fun rebuildService() {
        retrofit = retrofit2.Retrofit.Builder()
            .baseUrl(if (baseUrl.startsWith("http")) baseUrl else "https://aqualyn.onrender.com/")
            .client(okHttpClient)
            .addConverterFactory(retrofit2.converter.moshi.MoshiConverterFactory.create(moshi))
            .build()
        service = retrofit.create(AqualynApiService::class.java)
    }
}
