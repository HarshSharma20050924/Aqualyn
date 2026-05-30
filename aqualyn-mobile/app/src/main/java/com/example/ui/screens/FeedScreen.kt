package com.example.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import com.example.ui.components.SwipeToRefreshBox
import com.example.ui.screens.feed.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FeedScreen(
    onChatRedirect: () -> Unit = {},
    initiallyOpenPostCreator: Boolean = false,
    onPostCreatorDismissed: () -> Unit = {},
    onNotificationsClick: () -> Unit = {}
) {
    val coroutineScope = rememberCoroutineScope()

    // Interactive Toast feedback
    var toastMessage by remember { mutableStateOf<String?>(null) }
    var showToast by remember { mutableStateOf(false) }

    fun triggerToast(msg: String) {
        toastMessage = msg
        showToast = true
        coroutineScope.launch {
            delay(2000)
            showToast = false
        }
    }

    // Default high-quality real images mimicking photo uploads
    val defaultAvatarYourStr = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"

    // Initial Stories
    val storiesList = remember { FeedCache.storiesList }

    // Initial Posts
    val postsList = remember { FeedCache.postsList }

    // Modal view states
    var activeStoryIndex by remember { mutableStateOf<Int?>(null) }
    var activePostForDetail by remember { mutableStateOf<LocalPost?>(null) }
    var showStoryCreator by remember { mutableStateOf(false) }
    var showPostCreator by remember { mutableStateOf(false) }
    var postToEdit by remember { mutableStateOf<LocalPost?>(null) }
    var isRefreshing by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        if (postsList.isEmpty() && storiesList.isEmpty()) {
            val remotePosts = com.example.network.AqualynRepository.fetchFeed()
            if (remotePosts.isNotEmpty()) {
                postsList.clear()
                remotePosts.forEach { post ->
                    val authorName = if (!post.authorId.isNullOrBlank()) {
                        val p = com.example.network.AqualynRepository.fetchUserProfile(post.authorId)
                        p?.displayName ?: p?.username ?: "Aqualyn User"
                    } else {
                        "Aqualyn User"
                    }
                    postsList.add(
                        LocalPost(
                            id = post.id,
                            username = authorName,
                            caption = post.caption,
                            imageGradient = listOf(Color(0xFF0091EA), Color(0xFF637BFE)),
                            isLiked = false,
                            likeCount = post.likesCount,
                            timeInfo = post.timeAgo,
                            location = post.location,
                            authorId = post.authorId,
                            imageUrl = post.mediaUrl,
                            avatarUrl = if (!post.authorId.isNullOrBlank()) {
                                val p = com.example.network.AqualynRepository.fetchUserProfile(post.authorId)
                                p?.avatar ?: p?.largeAvatar
                            } else null
                        )
                    )
                }
            }

            val remoteStories = com.example.network.AqualynRepository.fetchStories()
            if (remoteStories.isNotEmpty()) {
                storiesList.clear()
                remoteStories.forEach { story ->
                    val authorName = if (!story.userId.isNullOrBlank()) {
                        val p = com.example.network.AqualynRepository.fetchUserProfile(story.userId)
                        p?.displayName ?: p?.username ?: (story.title ?: "Story")
                    } else {
                        story.title ?: "Story"
                    }
                    val authorAvatar = if (!story.userId.isNullOrBlank()) {
                        val p = com.example.network.AqualynRepository.fetchUserProfile(story.userId)
                        p?.avatar ?: p?.largeAvatar
                    } else {
                        null
                    }
                    storiesList.add(
                        LocalStory(
                            id = story.id,
                            username = authorName,
                            gradient = listOf(Color(0xFF0091EA), Color(0xFF00E5FF)),
                            text = story.title ?: "Aqualyn Story",
                            avatarUrl = authorAvatar,
                            storyImageUrl = story.mediaUrl
                        )
                    )
                }
            }
        }
    }

    LaunchedEffect(initiallyOpenPostCreator) {
        if (initiallyOpenPostCreator) {
            showPostCreator = true
            onPostCreatorDismissed()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.linearGradient(
                    colors = listOf(Color(0xFFD6F5F6), Color(0xFFE9E5F8)),
                    start = Offset.Zero,
                    end = Offset.Infinite
                )
            )
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Header corresponding perfectly to screen #2 screenshot
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp))
                    .background(Color.White.copy(alpha = 0.85f))
                    .border(
                        1.dp,
                        Color.White.copy(alpha = 0.6f),
                        RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp)
                    )
                    .padding(horizontal = 16.dp, vertical = 12.dp)
                    .padding(top = 16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        "Aqualyn",
                        fontWeight = FontWeight.Black,
                        fontSize = 24.sp,
                        color = Color(0xFF0091EA),
                        letterSpacing = (-0.5).sp
                    )
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(
                            onClick = onNotificationsClick,
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(Color(0xFF0091EA).copy(alpha = 0.1f))
                        ) {
                            Icon(Icons.Outlined.FavoriteBorder, contentDescription = "Activity", tint = Color(0xFF0091EA), modifier = Modifier.size(22.dp))
                        }
                        IconButton(
                            onClick = onChatRedirect,
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(Color(0xFF0091EA).copy(alpha = 0.1f))
                        ) {
                            Icon(Icons.Outlined.ChatBubbleOutline, contentDescription = "Chats", tint = Color(0xFF0091EA), modifier = Modifier.size(20.dp))
                        }
                    }
                }
            }

            SwipeToRefreshBox(
                isRefreshing = isRefreshing,
                onRefresh = {
                    isRefreshing = true
                    coroutineScope.launch {
                        try {
                            val remotePosts = com.example.network.AqualynRepository.fetchFeed()
                            if (remotePosts.isNotEmpty()) {
                                postsList.clear()
                                remotePosts.forEach { post ->
                                    val authorName = if (!post.authorId.isNullOrBlank()) {
                                        val p = com.example.network.AqualynRepository.fetchUserProfile(post.authorId)
                                        p?.displayName ?: p?.username ?: "Aqualyn User"
                                    } else {
                                        "Aqualyn User"
                                    }
                                    postsList.add(
                                        LocalPost(
                                            id = post.id,
                                            username = authorName,
                                            caption = post.caption,
                                            imageGradient = listOf(Color(0xFF0091EA), Color(0xFF637BFE)),
                                            isLiked = false,
                                            likeCount = post.likesCount,
                                            timeInfo = post.timeAgo,
                                            location = post.location,
                                            imageUrl = post.mediaUrl,
                                            avatarUrl = if (!post.authorId.isNullOrBlank()) {
                                                val p = com.example.network.AqualynRepository.fetchUserProfile(post.authorId)
                                                p?.avatar ?: p?.largeAvatar
                                            } else null
                                        )
                                    )
                                }
                            }
                            val remoteStories = com.example.network.AqualynRepository.fetchStories()
                            if (remoteStories.isNotEmpty()) {
                                storiesList.clear()
                                remoteStories.forEach { story ->
                                    val authorName = if (!story.userId.isNullOrBlank()) {
                                        val p = com.example.network.AqualynRepository.fetchUserProfile(story.userId)
                                        p?.displayName ?: p?.username ?: (story.title ?: "Story")
                                    } else {
                                        story.title ?: "Story"
                                    }
                                    val authorAvatar = if (!story.userId.isNullOrBlank()) {
                                        val p = com.example.network.AqualynRepository.fetchUserProfile(story.userId)
                                        p?.avatar ?: p?.largeAvatar
                                    } else {
                                        null
                                    }
                                    storiesList.add(
                                        LocalStory(
                                            id = story.id,
                                            username = authorName,
                                            gradient = listOf(Color(0xFF0091EA), Color(0xFF00E5FF)),
                                            text = story.title ?: "Aqualyn Story",
                                            avatarUrl = authorAvatar,
                                            storyImageUrl = story.mediaUrl
                                        )
                                    )
                                }
                            }
                            triggerToast("Feed updated")
                        } catch (e: Exception) {
                            triggerToast("Failed to refresh feed")
                        } finally {
                            isRefreshing = false
                        }
                    }
                },
                modifier = Modifier.weight(1f)
            ) {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(bottom = 96.dp, top = 8.dp)
                ) {
                    // Stories Horizontal Row Slider
                    item {
                        LazyRow(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 12.dp),
                            contentPadding = PaddingValues(horizontal = 16.dp),
                            horizontalArrangement = Arrangement.spacedBy(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // "Add Story" direct placeholder
                            item {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    modifier = Modifier
                                        .clickable { showStoryCreator = true }
                                        .padding(end = 4.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(76.dp)
                                            .clip(CircleShape)
                                            .background(Color.White.copy(alpha = 0.7f))
                                            .border(2.dp, Color.White.copy(alpha = 0.8f), CircleShape)
                                            .padding(4.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .fillMaxSize()
                                                .clip(CircleShape)
                                                .background(
                                                    Brush.linearGradient(
                                                        listOf(Color(0xFF637BFE), Color(0xFF0091EA))
                                                    )
                                                ),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Icon(
                                                Icons.Filled.Add,
                                                contentDescription = "Publish Story",
                                                tint = Color.White,
                                                modifier = Modifier.size(28.dp)
                                            )
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        "Add Story",
                                        fontSize = 11.sp,
                                        color = Color(0xFF546E7A),
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }

                            // Users Stories loop
                            itemsIndexed(storiesList) { index, story ->
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    modifier = Modifier.clickable { activeStoryIndex = index }
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(76.dp)
                                            .clip(CircleShape)
                                            .background(Color.White.copy(alpha = 0.7f))
                                            .border(
                                                width = 2.dp,
                                                brush = Brush.linearGradient(
                                                    if (story.isCloseFriends) {
                                                        listOf(Color(0xFF4CAF50), Color(0xFF8BC34A))
                                                    } else {
                                                        story.gradient
                                                    }
                                                ),
                                                shape = CircleShape
                                            )
                                            .padding(4.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        if (!story.avatarUrl.isNullOrEmpty()) {
                                            AsyncImage(
                                                model = story.avatarUrl,
                                                contentDescription = story.username,
                                                contentScale = ContentScale.Crop,
                                                modifier = Modifier
                                                    .fillMaxSize()
                                                    .clip(CircleShape)
                                            )
                                        } else {
                                            Box(
                                                modifier = Modifier
                                                    .fillMaxSize()
                                                    .clip(CircleShape)
                                                    .background(Brush.linearGradient(story.gradient)),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Text(
                                                    text = story.username.take(2).uppercase(),
                                                    fontWeight = FontWeight.Bold,
                                                    color = Color.White,
                                                    fontSize = 16.sp
                                                )
                                            }
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        text = story.username,
                                        fontSize = 11.sp,
                                        color = Color(0xFF263238),
                                        fontWeight = FontWeight.Medium,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                        modifier = Modifier.width(68.dp),
                                        textAlign = TextAlign.Center
                                    )
                                }
                            }
                        }
                    }

                    // Posts Cards View
                    if (postsList.isEmpty()) {
                        item {
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                shape = RoundedCornerShape(24.dp),
                                colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.8f)),
                                border = BorderStroke(1.dp, Color.White.copy(alpha = 0.5f))
                            ) {
                                Column(
                                    modifier = Modifier.padding(24.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Icon(Icons.Filled.PhotoLibrary, contentDescription = null, tint = Color(0xFF0091EA), modifier = Modifier.size(48.dp))
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Text(
                                        "Your Aqualyn Feed",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 18.sp,
                                        color = Color(0xFF263238)
                                    )
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Text(
                                        "No moments shared yet. Click 'Add Post' below to share your first memory!",
                                        textAlign = TextAlign.Center,
                                        fontSize = 13.sp,
                                        color = Color.Gray
                                    )
                                }
                            }
                        }
                    } else {
                        itemsIndexed(postsList) { index, post ->
                            LocalPostCard(
                                post = post,
                                onLikeChange = { updatedPost ->
                                    val oldLiked = post.isLiked
                                    val oldSaved = post.isSaved
                                    postsList[index] = updatedPost
                                    if (updatedPost.isLiked != oldLiked) {
                                        coroutineScope.launch {
                                            com.example.network.AqualynRepository.likePost(post.id)
                                        }
                                    }
                                    if (updatedPost.isSaved != oldSaved) {
                                        coroutineScope.launch {
                                            com.example.network.AqualynRepository.savePost(post.id)
                                        }
                                    }
                                },
                                onEditClick = {
                                    postToEdit = post
                                    showPostCreator = true
                                },
                                onDeleteClick = {
                                    coroutineScope.launch {
                                        val success = com.example.network.AqualynRepository.deletePost(post.id)
                                        if (success) {
                                            postsList.removeAt(index)
                                        }
                                    }
                                },
                                onPostClick = {
                                    activePostForDetail = post
                                }
                            )
                        }
                    }
                }
            }
        }

        // Custom animated feedback Toast
        AnimatedVisibility(
            visible = showToast,
            enter = fadeIn() + slideInVertically(initialOffsetY = { -40 }),
            exit = fadeOut() + slideOutVertically(targetOffsetY = { -40 }),
            modifier = Modifier
                .align(Alignment.TopCenter)
                .padding(top = 90.dp, start = 20.dp, end = 20.dp)
        ) {
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF263238)),
                shape = RoundedCornerShape(12.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Filled.Check, contentDescription = null, tint = Color(0xFF00FF88))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(toastMessage ?: "", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }
            }
        }
    }

    // --- DIALOGS FOR PHOTO CREATION and STORY CREATION/VIEWING ---

    // STORY VIEWER (Mimicking the React StoryViewer)
    activeStoryIndex?.let { index ->
        StoryViewerDialog(
            index = index,
            storiesList = storiesList,
            onDismissRequest = { activeStoryIndex = null },
            onActiveIndexChange = { activeStoryIndex = it },
            triggerToast = { triggerToast(it) }
        )
    }

    // STORY CREATOR DIALOG
    if (showStoryCreator) {
        StoryCreatorDialog(
            storiesList = storiesList,
            onDismissRequest = { showStoryCreator = false },
            triggerToast = { triggerToast(it) }
        )
    }

    // POST CREATOR DIALOG
    if (showPostCreator) {
        PostCreatorDialog(
            postsList = postsList,
            postToEdit = postToEdit,
            onDismissRequest = {
                showPostCreator = false
                postToEdit = null
            },
            triggerToast = { triggerToast(it) }
        )
    }

    // POST DETAIL VIEWER
    activePostForDetail?.let { post ->
        PostDetailDialog(
            post = post,
            postsList = postsList,
            onDismissRequest = { activePostForDetail = null },
            triggerToast = { triggerToast(it) }
        )
    }
}
