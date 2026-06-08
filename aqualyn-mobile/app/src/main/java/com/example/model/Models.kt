package com.example.model

import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateListOf

object GlobalState {
    var searchByNumberEnabled by mutableStateOf(true)
    var authToken by mutableStateOf<String?>(null)
    var lastSentOtp by mutableStateOf<String?>(null)
    
    // Custom drop-theme toast notification state
    var activeToastMessage by mutableStateOf<String?>(null)
    var activeToastIsGreen by mutableStateOf(true) // Green for success, Blue for Aqualyn alerts, Red for issues
    var activeToastIconRes by mutableStateOf<androidx.compose.ui.graphics.vector.ImageVector?>(null)

    var currentUserProfile by mutableStateOf<User?>(null)
    var currentUserId by mutableStateOf<String?>(null)
    var isEnteringPhoneExisting by mutableStateOf(false)

    // The main shared list of chats for interactive functionality
    val chats = mutableStateListOf<ChatItem>()

    // Synced contacts, followers and following lists
    val contacts = mutableStateListOf<User>()
    val followersList = mutableStateListOf<User>()
    val followingList = mutableStateListOf<User>()
    
    // Local phone numbers for background/foreground syncing
    val phoneNumbersToSync = mutableStateListOf<String>()

    // Dynamic folders list
    val folders = mutableStateListOf<String>()

    // Dynamic posts & stories list
    val posts = mutableStateListOf<PostItem>()
    
    val savedPostIds = mutableStateListOf<String>()

    val stories = mutableStateListOf<StoryItem>()

    // PIN lock for archives
    var archivePinRequired by mutableStateOf(false)
    var archivePinCode by mutableStateOf("") // Default empty (unset)
    var archiveLockedState by mutableStateOf(true)

    // Helper to show custom aquatic toast
    fun showToast(message: String, isGreen: Boolean = true) {
        activeToastMessage = message
        activeToastIsGreen = isGreen
    }

    // Tracks if a chat is archived, muted, or selected
    val archivedChats = mutableStateMapOf<String, Boolean>()
    val mutedChats = mutableStateMapOf<String, Boolean>()
    val chatMessagesStorage = mutableStateMapOf<String, List<Message>>()
    val folderChatMap = mutableStateMapOf<String, String>() // chatId to folderName

    // Track following status for users
    val followedUsers = mutableStateMapOf<String, Boolean>()
    
    // Track blocked status
    val blockedUsers = mutableStateMapOf<String, Boolean>()
    
    // Track reported status
    val reportedUsers = mutableStateMapOf<String, Boolean>()
}

data class PostItem(
    val id: String,
    val imageDescription: String,
    val caption: String,
    var likesCount: Int,
    val timeAgo: String,
    val isCommentsDisabled: Boolean = false,
    val location: String = "",
    val authorId: String? = null,
    val mediaUrl: String? = null,
    val authorName: String? = null,
    val avatarUrl: String? = null
)

data class StoryItem(
    val id: String,
    val title: String,
    val isViewed: Boolean = false,
    val isMe: Boolean = false,
    val userId: String? = null,
    val mediaUrl: String? = null,
    val authorName: String? = null,
    val avatarUrl: String? = null
)

data class User(
    val id: String,
    val name: String,
    val handle: String = "",
    val role: String = "",
    val description: String = "",
    val avatarUrl: String,
    val isOnline: Boolean = false,
    val followers: Int = 0,
    val following: Int = 0
)

data class Message(
    val id: String,
    val senderId: String,
    val content: String,
    val timeInfo: String,
    val isMine: Boolean,
    val imageUrl: String? = null,
    val videoUrl: String? = null,
    val audioUrl: String? = null,
    val documentName: String? = null,
    val location: String? = null,
    val paymentAmount: String? = null,
    val replyToMsg: Message? = null,
    val reactions: List<String> = emptyList(),
    val isPinned: Boolean = false,
    val isEdited: Boolean = false
)

data class ChatItem(
    val id: String,
    val user: User? = null,
    val isGroup: Boolean = false,
    val groupName: String? = null,
    val lastMessage: String,
    val timeInfo: String,
    val unreadCount: Int = 0,
    val isPinned: Boolean = false,
    val isVoiceMessage: Boolean = false
)

data class Story(
    val id: String,
    val title: String,
    val imageUrl: String,
    val isAdd: Boolean = false
)
