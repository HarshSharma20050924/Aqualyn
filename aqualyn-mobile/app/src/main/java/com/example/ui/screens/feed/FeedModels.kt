package com.example.ui.screens.feed

import androidx.compose.runtime.mutableStateListOf
import androidx.compose.ui.graphics.Color

data class LocalPost(
    val id: String,
    val username: String,
    val caption: String,
    val imageGradient: List<Color>,
    var isLiked: Boolean = false,
    var likeCount: Int = 12,
    var isSaved: Boolean = false,
    val timeInfo: String = "Just now",
    val imageUrl: String? = null,
    val avatarUrl: String? = null,
    val comments: List<Pair<String, String>> = emptyList(), // (username, commentText)
    val isPinned: Boolean = false,
    val isArchived: Boolean = false,
    val location: String? = null,
    val authorId: String? = null
)

data class LocalStory(
    val id: String,
    val username: String,
    val gradient: List<Color>,
    val text: String = "Vibe check! ✨",
    val isMine: Boolean = false,
    val avatarUrl: String? = null,
    val storyImageUrl: String? = null,
    val stickers: List<LocalSticker> = emptyList(),
    val isCloseFriends: Boolean = false
)

data class LocalSticker(
    val id: String,
    val type: String, // "location", "hashtag", "mention", "emoji"
    val content: String,
    val x: Float = 0.5f,
    val y: Float = 0.4f
)

object FeedCache {
    val storiesList = mutableStateListOf<LocalStory>()
    val postsList = mutableStateListOf<LocalPost>()
}
