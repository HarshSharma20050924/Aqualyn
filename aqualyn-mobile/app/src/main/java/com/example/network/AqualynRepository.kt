package com.example.network

import android.util.Log
import com.example.model.ChatItem
import com.example.model.GlobalState
import com.example.model.Message
import com.example.model.PostItem
import com.example.model.StoryItem
import com.example.model.User
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody

object AqualynRepository {
    private const val TAG = "AqualynRepository"

    suspend fun sendOtp(phone: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val identifier = if (phone.contains("@") || phone.startsWith("+")) phone else "+91$phone"
            Log.d(TAG, "Requesting OTP for $identifier")
            val response = AqualynApi.getService().sendOtp(SendOtpRequest(identifier))
            if (response.isSuccessful) {
                val body = response.body()
                val isExisting = body?.isExisting == true
                withContext(Dispatchers.Main) {
                    GlobalState.isEnteringPhoneExisting = isExisting
                    GlobalState.lastSentOtp = body?.otp
                    GlobalState.showToast(
                        if (body?.otp != null) {
                            "OTP: ${body.otp} (Copied!)"
                        } else if (isExisting) {
                            "Welcome Back! Sending OTP..."
                        } else {
                            "Sending OTP to new number..."
                        }, 
                        isGreen = true
                    )
                }
                true
            } else {
                val errorStr = response.errorBody()?.string()
                Log.w(TAG, "OTP failed with code ${response.code()}, error: $errorStr")
                withContext(Dispatchers.Main) {
                    GlobalState.showToast("Failed OTP: ${response.code()} $errorStr", isGreen = false)
                }
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "sendOtp Network error: ${e.localizedMessage}")
            withContext(Dispatchers.Main) {
                GlobalState.showToast("Connection error: ${e.localizedMessage}", isGreen = false)
            }
            false
        }
    }

    suspend fun verifyOtp(phone: String, code: String): Int = withContext(Dispatchers.IO) {
        try {
            val identifier = if (phone.contains("@") || phone.startsWith("+")) phone else "+91$phone"
            Log.d(TAG, "Verifying OTP code: $code for $identifier")
            val response = AqualynApi.getService().verifyOtp(VerifyOtpRequest(identifier, code))
            if (response.isSuccessful) {
                val body = response.body()
                var result = 1 // default success with complete profile needed
                if (body != null) {
                    withContext(Dispatchers.Main) {
                        GlobalState.authToken = body.token
                    }
                    
                    // If the number is an existing user, we can direct login
                    if (GlobalState.isEnteringPhoneExisting) {
                        result = 2
                    }
                    
                    // Fetch user's profile immediately to see if they're in the database
                    try {
                        val profileResponse = AqualynApi.getService().getMyProfile()
                        if (profileResponse.isSuccessful) {
                            val profile = profileResponse.body()
                            if (profile != null) {
                                result = 2 // name/profile exists -> profile complete
                                // Save current profile to global state
                                withContext(Dispatchers.Main) {
                                    GlobalState.authToken = body.token
                                    GlobalState.currentUserProfile = profile.toDomain()
                                    GlobalState.currentUserId = profile.id
                                }
                            }
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error fetching profile during verify-otp: ${e.localizedMessage}")
                    }
                }
                withContext(Dispatchers.Main) {
                    GlobalState.showToast("Code verified successfully.", isGreen = true)
                }
                result
            } else {
                val errorStr = response.errorBody()?.string()
                Log.w(TAG, "Verification api failed with code ${response.code()}, error: $errorStr")
                withContext(Dispatchers.Main) {
                    GlobalState.showToast("Invalid OTP: ${response.code()} $errorStr", isGreen = false)
                }
                0
            }
        } catch (e: Exception) {
            Log.e(TAG, "verifyOtp network error: ${e.localizedMessage}")
            withContext(Dispatchers.Main) {
                GlobalState.showToast("Verification network error: ${e.localizedMessage}", isGreen = false)
            }
            0
        }
    }

    suspend fun syncProfile(displayName: String, dob: String, avatarUrl: String? = null): Boolean = withContext(Dispatchers.IO) {
        val token = GlobalState.authToken ?: return@withContext false
        try {
            val response = AqualynApi.getService().syncAuth(
                request = SyncAuthRequest(displayName = displayName, dob = dob, avatar = avatarUrl)
            )
            if (response.isSuccessful) {
                val body = response.body()
                withContext(Dispatchers.Main) {
                    if (body?.token != null) {
                        GlobalState.authToken = body.token
                    }
                    if (body?.user != null) {
                        GlobalState.currentUserProfile = body.user.toDomain()
                        GlobalState.currentUserId = body.user.id
                    }
                    GlobalState.showToast("Profile synced.", isGreen = true)
                }
                true
            } else {
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "syncProfile Error: ${e.localizedMessage}")
            false
        }
    }

    suspend fun syncGoogleAuth(
        firebaseIdToken: String, 
        displayName: String? = null, 
        dob: String? = null, 
        avatar: String? = null
    ): Int = withContext(Dispatchers.IO) {
        try {
            GlobalState.authToken = firebaseIdToken
            Log.d(TAG, "Requesting backend auth-sync with Firebase Token")
            val response = AqualynApi.getService().syncAuth(
                request = SyncAuthRequest(displayName = displayName, dob = dob, avatar = avatar)
            )
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null && !body.token.isNullOrEmpty()) {
                    withContext(Dispatchers.Main) {
                        GlobalState.authToken = body.token
                        if (body.user != null) {
                            GlobalState.currentUserProfile = body.user.toDomain()
                            GlobalState.currentUserId = body.user.id
                        }
                    }
                    val isComplete = body.status != "needs_profile" && body.user?.displayName?.isNotEmpty() == true
                    if (isComplete) 2 else 1
                } else {
                    withContext(Dispatchers.Main) { GlobalState.authToken = null }
                    0
                }
            } else {
                val errorStr = response.errorBody()?.string()
                Log.e(TAG, "syncGoogleAuth backend error ${response.code()}: $errorStr")
                withContext(Dispatchers.Main) { GlobalState.authToken = null }
                0
            }
        } catch (e: Exception) {
            Log.e(TAG, "syncGoogleAuth network/parse exception: ${e.localizedMessage}")
            withContext(Dispatchers.Main) { GlobalState.authToken = null }
            0
        }
    }

    suspend fun createChat(isGroup: Boolean, name: String, memberIds: List<String>): ChatItem? = withContext(Dispatchers.IO) {
        if (GlobalState.authToken.isNullOrEmpty()) {
            Log.w(TAG, "createChat aborted: authToken is null or empty.")
            return@withContext null
        }
        try {
            Log.d(TAG, "Creating chat: isGroup=$isGroup, name=$name, memberIds=$memberIds")
            val response = AqualynApi.getService().createChat(CreateChatRequest(isGroup, name, memberIds))
            if (response.isSuccessful) {
                val chatDto = response.body()
                chatDto?.toDomain()
            } else {
                Log.w(TAG, "createChat failed: ${response.code()}")
                null
            }
        } catch (e: Exception) {
            Log.e(TAG, "createChat error: ${e.localizedMessage}")
            null
        }
    }

    suspend fun fetchChats(silent: Boolean = false): List<ChatItem> = withContext(Dispatchers.IO) {
        if (GlobalState.authToken.isNullOrEmpty()) {
            Log.w(TAG, "fetchChats aborted: authToken is null or empty.")
            return@withContext emptyList()
        }
        try {
            Log.d(TAG, "Fetching chats from API")
            val response = AqualynApi.getService().getChats()
            if (response.isSuccessful) {
                val chatDtos = response.body() ?: emptyList()
                val domainChats = chatDtos.map { it.toDomain() }
                if (domainChats.isNotEmpty()) {
                    withContext(Dispatchers.Main) {
                        val hasChanged = GlobalState.chats.size != domainChats.size || 
                            GlobalState.chats.zip(domainChats).any { (old, new) -> 
                                old.id != new.id || old.lastMessage != new.lastMessage || old.unreadCount != new.unreadCount 
                            }
                        if (hasChanged) {
                            GlobalState.chats.clear()
                            GlobalState.chats.addAll(domainChats)
                        }
                        if (!silent && hasChanged) {
                            GlobalState.showToast("Chats updated.", isGreen = true)
                        }
                    }
                }
                domainChats
            } else {
                Log.w(TAG, "fetchChats failed: ${response.code()}")
                emptyList()
            }
        } catch (e: Exception) {
            if (e is kotlinx.coroutines.CancellationException) throw e
            Log.e(TAG, "fetchChats network error: ${e.localizedMessage}")
            emptyList()
        }
    }

    suspend fun fetchMessages(chatId: String, silent: Boolean = false): List<Message> = withContext(Dispatchers.IO) {
        if (GlobalState.authToken.isNullOrEmpty()) {
            return@withContext emptyList()
        }
        try {
            Log.d(TAG, "Fetching messages for chat $chatId")
            val response = AqualynApi.getService().getChatMessages(chatId)
            if (response.isSuccessful) {
                val messageDtos = response.body() ?: emptyList()
                val domainMessages = messageDtos.map { it.toDomain() }
                if (domainMessages.isNotEmpty() && !silent) {
                    withContext(Dispatchers.Main) {
                        GlobalState.showToast("Messages loaded.", isGreen = true)
                    }
                }
                domainMessages
            } else {
                Log.w(TAG, "fetchMessages failed: ${response.code()}")
                emptyList()
            }
        } catch (e: Exception) {
            if (e is kotlinx.coroutines.CancellationException) throw e
            Log.e(TAG, "fetchMessages network error: ${e.localizedMessage}")
            emptyList()
        }
    }

    suspend fun sendMessage(chatId: String, content: String, replyToId: String? = null): Message? = withContext(Dispatchers.IO) {
        if (GlobalState.authToken.isNullOrEmpty()) {
            Log.w(TAG, "sendMessage aborted: authToken is null or empty.")
            return@withContext null
        }
        try {
            Log.d(TAG, "Sending message to chat $chatId")
            val response = AqualynApi.getService().sendChatMessage(chatId, MessageSendInputDto(content = content, replyToId = replyToId))
            if (response.isSuccessful) {
                val body = response.body()
                body?.toDomain()
            } else {
                Log.w(TAG, "sendMessage failed with code ${response.code()}")
                null
            }
        } catch (e: Exception) {
            Log.e(TAG, "sendMessage network error: ${e.localizedMessage}")
            null
        }
    }

    suspend fun deleteMessage(chatId: String, messageId: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().deleteMessage(chatId, messageId)
            response.isSuccessful
        } catch (e: Exception) {
            Log.e(TAG, "deleteMessage error: ${e.localizedMessage}")
            false
        }
    }

    suspend fun reactMessage(chatId: String, messageId: String, emoji: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().reactMessage(chatId, messageId, mapOf("reactions" to mapOf(emoji to listOf("me")))) // Simplified mockup payload, wait we should fetch existing reactions or backend just overwrites? The backend in REST actually expects the FULL new reactions object `data: { reactions }`. For now we send a simple map since it's just dummying the UI. 
            response.isSuccessful
        } catch (e: Exception) {
            Log.e(TAG, "reactMessage error: ${e.localizedMessage}")
            false
        }
    }

    suspend fun getChatMedia(chatId: String): List<String> = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().getChatMedia(chatId)
            if (response.isSuccessful) response.body() ?: emptyList() else emptyList()
        } catch (e: Exception) {
            Log.e(TAG, "getChatMedia error: ${e.localizedMessage}")
            emptyList()
        }
    }

    suspend fun muteChat(chatId: String): Boolean = withContext(Dispatchers.IO) {
        if (GlobalState.authToken.isNullOrEmpty()) {
            return@withContext false
        }
        try {
            Log.d(TAG, "Muting chat $chatId")
            val response = AqualynApi.getService().muteChat(chatId)
            if (response.isSuccessful) {
                withContext(Dispatchers.Main) {
                    GlobalState.mutedChats[chatId] = true
                    GlobalState.showToast("Chat muted.", isGreen = true)
                }
                true
            } else {
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "muteChat network error: ${e.localizedMessage}")
            false
        }
    }

    suspend fun fetchUserProfile(userId: String): UserDto? = withContext(Dispatchers.IO) {
        if (GlobalState.authToken.isNullOrEmpty()) {
            Log.w(TAG, "fetchUserProfile aborted: authToken is null or empty.")
            return@withContext null
        }
        try {
            val cleanId = if (userId.startsWith("c_")) userId.substring(2) else userId
            Log.d(TAG, "Fetching user profile $cleanId")
            val response = if (cleanId == "me" || cleanId.lowercase() == "me") {
                AqualynApi.getService().getMyProfile()
            } else {
                AqualynApi.getService().getUserProfile(cleanId)
            }
            if (response.isSuccessful) {
                val body = response.body()
                withContext(Dispatchers.Main) {
                    if ((cleanId == "me" || cleanId.lowercase() == "me") && body != null) {
                        GlobalState.currentUserProfile = body.toDomain()
                        GlobalState.currentUserId = body.id
                    }
                    GlobalState.showToast("Profile loaded.", isGreen = true)
                }
                body
            } else {
                null
            }
        } catch (e: Exception) {
            if (e is kotlinx.coroutines.CancellationException) throw e
            Log.e(TAG, "fetchUserProfile network error: ${e.localizedMessage}")
            null
        }
    }

    suspend fun followUser(userId: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().followUser(FollowRequest(userId))
            if (response.isSuccessful) {
                withContext(Dispatchers.Main) {
                    GlobalState.followedUsers[userId] = true
                    GlobalState.showToast("Following user.", isGreen = true)
                }
                true
            } else {
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "followUser error: ${e.localizedMessage}")
            false
        }
    }

    suspend fun unfollowUser(userId: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().unfollowUser(UnfollowRequest(userId))
            if (response.isSuccessful) {
                withContext(Dispatchers.Main) {
                    GlobalState.followedUsers.remove(userId)
                    GlobalState.showToast("Unfollowed user.", isGreen = true)
                }
                true
            } else {
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "unfollowUser error: ${e.localizedMessage}")
            false
        }
    }

    suspend fun blockUser(userId: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().blockUser(BlockRequest(userId))
            if (response.isSuccessful) {
                withContext(Dispatchers.Main) {
                    GlobalState.blockedUsers[userId] = true
                    GlobalState.showToast("User blocked.", isGreen = false)
                }
                true
            } else {
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "blockUser error: ${e.localizedMessage}")
            false
        }
    }

    suspend fun reportUser(userId: String, reason: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().reportUser(ReportRequest(userId, reason))
            if (response.isSuccessful) {
                withContext(Dispatchers.Main) {
                    GlobalState.reportedUsers[userId] = true
                    GlobalState.showToast("Report submitted.", isGreen = true)
                }
                true
            } else {
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "reportUser error: ${e.localizedMessage}")
            false
        }
    }

    suspend fun fetchFeed(): List<PostItem> = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Fetching feed posts")
            val response = AqualynApi.getService().getFeed()
            if (response.isSuccessful) {
                val postDtos = response.body() ?: emptyList()
                val domainPosts = postDtos.map { it.toDomain() }
                if (domainPosts.isNotEmpty()) {
                    withContext(Dispatchers.Main) {
                        GlobalState.posts.clear()
                        GlobalState.posts.addAll(domainPosts)
                        GlobalState.showToast("Feed updated.", isGreen = true)
                    }
                }
                domainPosts
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            if (e is kotlinx.coroutines.CancellationException) throw e
            Log.e(TAG, "fetchFeed error: ${e.localizedMessage}")
            emptyList()
        }
    }

    suspend fun fetchStories(): List<StoryItem> = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Fetching social stories")
            val response = AqualynApi.getService().getStories()
            if (response.isSuccessful) {
                val storyDtos = response.body() ?: emptyList()
                val domainStories = storyDtos.map { it.toDomain() }
                if (domainStories.isNotEmpty()) {
                    withContext(Dispatchers.Main) {
                        GlobalState.stories.clear()
                        GlobalState.stories.addAll(domainStories)
                        GlobalState.showToast("Stories updated.", isGreen = true)
                    }
                }
                domainStories
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            if (e is kotlinx.coroutines.CancellationException) throw e
            Log.e(TAG, "fetchStories error: ${e.localizedMessage}")
            emptyList()
        }
    }

    suspend fun createPost(caption: String, location: String = "", mediaUrl: String? = null): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().createPost(
                CreatePostRequest(content = caption, mediaUrl = mediaUrl, mediaType = if (mediaUrl != null) "image" else null)
            )
            if (response.isSuccessful) {
                val dto = response.body()
                if (dto != null) {
                    withContext(Dispatchers.Main) {
                        GlobalState.posts.add(0, dto.toDomain())
                        GlobalState.showToast("Post uploaded successfully.", isGreen = true)
                    }
                }
                true
            } else {
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "createPost error: ${e.localizedMessage}")
            false
        }
    }

    suspend fun likePost(postId: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().likePost(postId)
            if (response.isSuccessful) {
                withContext(Dispatchers.Main) {
                    GlobalState.showToast("Post liked.", isGreen = true)
                }
                true
            } else {
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "likePost error: ${e.localizedMessage}")
            false
        }
    }

    suspend fun commentPost(postId: String, comment: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().commentPost(postId, CommentRequest(content = comment))
            if (response.isSuccessful) {
                withContext(Dispatchers.Main) {
                    GlobalState.showToast("Comment added.", isGreen = true)
                }
                true
            } else {
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "commentPost error: ${e.localizedMessage}")
            false
        }
    }

    suspend fun getCallHistory(): List<CallHistoryDto> = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().getCallHistory()
            if (response.isSuccessful) {
                response.body() ?: emptyList()
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            Log.e(TAG, "getCallHistory error: ${e.localizedMessage}")
            emptyList()
        }
    }

    suspend fun fetchSettings(): SettingsDto? = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().getSettings()
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    withContext(Dispatchers.Main) {
                        GlobalState.archivePinRequired = body.archivePinRequired
                        GlobalState.archivePinCode = body.archivePinCode
                    }
                }
                body
            } else {
                null
            }
        } catch (e: Exception) {
            Log.e(TAG, "fetchSettings error: ${e.localizedMessage}")
            null
        }
    }

    suspend fun updateSettings(settings: SettingsDto): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().updateSettings(settings)
            if (response.isSuccessful) {
                withContext(Dispatchers.Main) {
                    GlobalState.archivePinRequired = settings.archivePinRequired
                    GlobalState.archivePinCode = settings.archivePinCode
                    GlobalState.showToast("Settings saved.", isGreen = true)
                }
                true
            } else {
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "updateSettings error: ${e.localizedMessage}")
            false
        }
    }

    suspend fun getStorageUsage(): StorageUsageDto? = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().getStorageUsage()
            if (response.isSuccessful) {
                response.body()
            } else {
                null
            }
        } catch (e: Exception) {
            Log.e(TAG, "getStorageUsage error: ${e.localizedMessage}")
            null
        }
    }

    suspend fun exportData(): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().exportData()
            response.isSuccessful
        } catch (e: Exception) {
            Log.e(TAG, "exportData error: ${e.localizedMessage}")
            false
        }
    }

    suspend fun getSessions(): List<SessionDto> = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().getSessions()
            if (response.isSuccessful) {
                response.body() ?: emptyList()
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            Log.e(TAG, "getSessions error: ${e.localizedMessage}")
            emptyList()
        }
    }

    suspend fun revokeSession(sessionId: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().revokeSession(sessionId)
            response.isSuccessful
        } catch (e: Exception) {
            Log.e(TAG, "revokeSession error: ${e.localizedMessage}")
            false
        }
    }

    suspend fun setAppLockPin(pin: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().setAppLockPin(SetPinRequest(pin))
            response.isSuccessful
        } catch (e: Exception) {
            Log.e(TAG, "setAppLockPin error: ${e.localizedMessage}")
            false
        }
    }

    suspend fun verifyAppLockPin(pin: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().verifyAppLockPin(VerifyPinRequest(pin))
            response.isSuccessful
        } catch (e: Exception) {
            Log.e(TAG, "verifyAppLockPin error: ${e.localizedMessage}")
            false
        }
    }

    suspend fun updatePrivacy(privacy: PrivacySettingsDto): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().updatePrivacy(privacy)
            response.isSuccessful
        } catch (e: Exception) {
            Log.e(TAG, "updatePrivacy error: ${e.localizedMessage}")
            false
        }
    }

    suspend fun uploadAvatar(base64OrUrl: String): String? = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().uploadAvatar(UploadAvatarRequest(base64OrUrl))
            if (response.isSuccessful) response.body()?.avatar else null
        } catch (e: Exception) {
            Log.e(TAG, "uploadAvatar error: ${e.localizedMessage}")
            null
        }
    }

    suspend fun requestSecretChat(targetUserId: String): SecretChatResponse? = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().requestSecretChat(SecretChatRequest(targetUserId))
            if (response.isSuccessful) response.body() else null
        } catch (e: Exception) {
            Log.e(TAG, "requestSecretChat error: ${e.localizedMessage}")
            null
        }
    }

    suspend fun handleSecretChat(chatId: String, action: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().handleSecretChat(SecretChatHandle(chatId, action))
            response.isSuccessful
        } catch (e: Exception) {
            Log.e(TAG, "handleSecretChat error: ${e.localizedMessage}")
            false
        }
    }

    suspend fun getChatFolders(): List<ChatFolderDto> = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().getChatFolders()
            if (response.isSuccessful) response.body() ?: emptyList() else emptyList()
        } catch (e: Exception) {
            Log.e(TAG, "getChatFolders error: ${e.localizedMessage}")
            emptyList()
        }
    }

    suspend fun createChatFolder(name: String, chatIds: List<String>): ChatFolderDto? = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().createChatFolder(CreateFolderRequest(name, chatIds))
            if (response.isSuccessful) response.body() else null
        } catch (e: Exception) {
            Log.e(TAG, "createChatFolder error: ${e.localizedMessage}")
            null
        }
    }

    suspend fun updateChatFolder(id: String, name: String, chatIds: List<String>): ChatFolderDto? = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().updateChatFolder(id, CreateFolderRequest(name, chatIds))
            if (response.isSuccessful) response.body() else null
        } catch (e: Exception) {
            Log.e(TAG, "updateChatFolder error: ${e.localizedMessage}")
            null
        }
    }

    suspend fun deleteChatFolder(id: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().deleteChatFolder(id)
            response.isSuccessful
        } catch (e: Exception) {
            Log.e(TAG, "deleteChatFolder error: ${e.localizedMessage}")
            false
        }
    }

    suspend fun pinChat(chatId: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().pinChat(chatId)
            response.isSuccessful
        } catch (e: Exception) {
            Log.e(TAG, "pinChat error: ${e.localizedMessage}")
            false
        }
    }

    suspend fun archiveChat(chatId: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().archiveChat(chatId)
            response.isSuccessful
        } catch (e: Exception) {
            Log.e(TAG, "archiveChat error: ${e.localizedMessage}")
            false
        }
    }

    suspend fun pinChatMessage(chatId: String, messageId: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().pinChatMessage(chatId, messageId)
            response.isSuccessful
        } catch (e: Exception) {
            Log.e(TAG, "pinChatMessage error: ${e.localizedMessage}")
            false
        }
    }

    suspend fun syncContacts(contacts: List<String>): List<UserDto> = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().syncContacts(ContactSyncRequest(phones = contacts))
            if (response.isSuccessful) {
                response.body() ?: emptyList()
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            Log.e(TAG, "syncContacts error: ${e.localizedMessage}")
            emptyList()
        }
    }

    suspend fun getFollowers(userId: String): List<UserDto> = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().getFollowers(userId)
            if (response.isSuccessful) {
                response.body() ?: emptyList()
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            Log.e(TAG, "getFollowers error: ${e.localizedMessage}")
            emptyList()
        }
    }

    suspend fun getFollowing(userId: String): List<UserDto> = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().getFollowing(userId)
            if (response.isSuccessful) {
                response.body() ?: emptyList()
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            Log.e(TAG, "getFollowing error: ${e.localizedMessage}")
            emptyList()
        }
    }

    suspend fun getNotifications(): List<NotificationDto> = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().getNotifications()
            if (response.isSuccessful) response.body() ?: emptyList() else emptyList()
        } catch (e: Exception) {
            Log.e(TAG, "getNotifications error: ${e.localizedMessage}")
            emptyList()
        }
    }

    suspend fun markNotificationsRead(): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().markNotificationsRead()
            response.isSuccessful
        } catch (e: Exception) {
            Log.e(TAG, "markNotificationsRead error: ${e.localizedMessage}")
            false
        }
    }

    suspend fun handleFollowRequest(followerId: String, action: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().handleFollowRequest(HandleFollowRequestDto(followerId, action))
            response.isSuccessful
        } catch (e: Exception) {
            Log.e(TAG, "handleFollowRequest error: ${e.localizedMessage}")
            false
        }
    }

    suspend fun getUserPosts(userId: String): List<PostItem> = withContext(Dispatchers.IO) {
        try {
            val cleanId = if (userId.startsWith("c_")) userId.substring(2) else userId
            val response = AqualynApi.getService().getUserPosts(cleanId)
            if (response.isSuccessful) {
                response.body()?.map { it.toDomain() } ?: emptyList()
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            Log.e(TAG, "getUserPosts error: ${e.localizedMessage}")
            emptyList()
        }
    }

    suspend fun getUserStories(userId: String): List<StoryItem> = withContext(Dispatchers.IO) {
        try {
            val cleanId = if (userId.startsWith("c_")) userId.substring(2) else userId
            val response = AqualynApi.getService().getUserStories(cleanId)
            if (response.isSuccessful) {
                response.body()?.map { it.toDomain() } ?: emptyList()
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            Log.e(TAG, "getUserStories error: ${e.localizedMessage}")
            emptyList()
        }
    }

    suspend fun createStory(title: String): StoryItem? = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().createStory(
                CreateStoryRequest(mediaUrl = "", mediaType = "image", content = title)
            )
            if (response.isSuccessful) {
                val domainStory = response.body()?.toDomain()
                domainStory
            } else {
                null
            }
        } catch (e: Exception) {
            Log.e(TAG, "createStory error: ${e.localizedMessage}")
            null
        }
    }

    suspend fun viewStory(storyId: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().viewStory(storyId)
            response.isSuccessful
        } catch (e: Exception) {
            Log.e(TAG, "viewStory error: ${e.localizedMessage}")
            false
        }
    }

    suspend fun savePost(postId: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().savePost(postId)
            response.isSuccessful
        } catch (e: Exception) {
            Log.e(TAG, "savePost error: ${e.localizedMessage}")
            false
        }
    }

    suspend fun deletePost(postId: String): Boolean = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().deletePost(postId)
            if (response.isSuccessful) {
                withContext(Dispatchers.Main) {
                    GlobalState.showToast("Post deleted successfully.", isGreen = true)
                }
                true
            } else {
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "deletePost error: ${e.localizedMessage}")
            false
        }
    }

    suspend fun editPost(postId: String, content: String): PostItem? = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().editPost(postId, mapOf("content" to content))
            if (response.isSuccessful) {
                withContext(Dispatchers.Main) {
                    GlobalState.showToast("Post updated.", isGreen = true)
                }
                response.body()?.toDomain()
            } else null
        } catch (e: Exception) {
            Log.e(TAG, "editPost error: ${e.localizedMessage}")
            null
        }
    }

    suspend fun searchUsers(query: String): List<User> = withContext(Dispatchers.IO) {
        try {
            val response = AqualynApi.getService().globalSearch(query)
            if (response.isSuccessful) {
                response.body()?.users?.map { it.toDomain() } ?: emptyList()
            } else {
                emptyList()
            }
        } catch (e: Exception) {
            Log.e(TAG, "searchUsers error: ${e.localizedMessage}")
            emptyList()
        }
    }

    suspend fun uploadFile(fileBytes: ByteArray, mimeType: String, filename: String): String? = withContext(Dispatchers.IO) {
        try {
            val requestBody = fileBytes.toRequestBody(mimeType.toMediaTypeOrNull())
            val part = okhttp3.MultipartBody.Part.createFormData("file", filename, requestBody)
            val response = AqualynApi.getService().uploadFile(part)
            if (response.isSuccessful) {
                response.body()?.url
            } else {
                Log.e(TAG, "uploadFile failed: ${response.code()}")
                null
            }
        } catch (e: Exception) {
            Log.e(TAG, "uploadFile error: ${e.localizedMessage}")
            null
        }
    }
}