package com.example.ui.screens.feed

import androidx.compose.animation.*
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun LocalPostCard(
    post: LocalPost,
    onLikeChange: (LocalPost) -> Unit,
    onEditClick: () -> Unit,
    onDeleteClick: () -> Unit,
    onPostClick: () -> Unit
) {
    var showHeartPopup by remember { mutableStateOf(false) }
    val coroutine = rememberCoroutineScope()

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp)
            .border(
                1.dp,
                Color.White.copy(alpha = 0.5f),
                RoundedCornerShape(24.dp)
            ),
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.85f)),
        shape = RoundedCornerShape(24.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column {
            // Post Header detail
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (!post.avatarUrl.isNullOrEmpty()) {
                    AsyncImage(
                        model = post.avatarUrl,
                        contentDescription = "User Avatar",
                        modifier = Modifier
                            .size(38.dp)
                            .clip(CircleShape),
                        contentScale = ContentScale.Crop
                    )
                } else {
                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .clip(CircleShape)
                            .background(Brush.linearGradient(post.imageGradient)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(post.username.take(1).uppercase(), color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(post.username, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF263238))
                    if (!post.location.isNullOrEmpty()) {
                        Text(post.location, fontSize = 10.sp, color = Color.Gray)
                    }
                }
                Box {
                    var expanded by remember { mutableStateOf(false) }
                    IconButton(onClick = { expanded = true }) {
                        Icon(Icons.Default.MoreVert, contentDescription = "More options", tint = Color(0xFF546E7A))
                    }
                    DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                        val isMine = post.authorId == com.example.model.GlobalState.currentUserProfile?.id || post.authorId == null
                        if (isMine) {
                            DropdownMenuItem(
                                text = { Text("Edit Post") },
                                onClick = { expanded = false; onEditClick() }
                            )
                            DropdownMenuItem(
                                text = { Text("Delete Post") },
                                onClick = { expanded = false; onDeleteClick() }
                            )
                        } else {
                            DropdownMenuItem(
                                text = { Text("Report Post") },
                                onClick = {
                                    expanded = false
                                    com.example.model.GlobalState.showToast("Post reported to moderation team.", isGreen = true)
                                }
                            )
                        }
                    }
                }
            }

            // Post Imagery block with Double-tap support!
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(1.2f)
                    .pointerInput(post.id) {
                        detectTapGestures(
                            onDoubleTap = {
                                if (!post.isLiked) {
                                    onLikeChange(post.copy(isLiked = true, likeCount = post.likeCount + 1))
                                }
                                showHeartPopup = true
                                coroutine.launch {
                                    delay(900)
                                    showHeartPopup = false
                                }
                            },
                            onTap = {
                                onPostClick()
                            }
                        )
                    },
                contentAlignment = Alignment.Center
            ) {
                if (!post.imageUrl.isNullOrEmpty()) {
                    AsyncImage(
                        model = post.imageUrl,
                        contentDescription = "Post Context",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Brush.linearGradient(post.imageGradient)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Outlined.Image, contentDescription = null, tint = Color.White.copy(alpha = 0.4f), modifier = Modifier.size(64.dp))
                    }
                }

                // Smooth double tap heart overlay popup
                androidx.compose.animation.AnimatedVisibility(
                    visible = showHeartPopup,
                    enter = scaleIn(animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessLow)) + fadeIn(),
                    exit = scaleOut() + fadeOut()
                ) {
                    Icon(
                        Icons.Filled.Favorite,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(80.dp)
                    )
                }
            }

            // Post action items row layout
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = {
                        if (post.isLiked) {
                            onLikeChange(post.copy(isLiked = false, likeCount = post.likeCount - 1))
                        } else {
                            onLikeChange(post.copy(isLiked = true, likeCount = post.likeCount + 1))
                        }
                    }
                ) {
                    Icon(
                        imageVector = if (post.isLiked) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
                        contentDescription = "Like Post",
                        tint = if (post.isLiked) Color.Red else Color(0xFF263238),
                        modifier = Modifier.size(26.dp)
                    )
                }
                IconButton(onClick = onPostClick) {
                    Icon(Icons.Outlined.ChatBubbleOutline, contentDescription = "Comment/View", tint = Color(0xFF263238), modifier = Modifier.size(24.dp))
                }
                IconButton(onClick = { /* Share */ }) {
                    Icon(Icons.Filled.Share, contentDescription = "Share", tint = Color(0xFF263238), modifier = Modifier.size(24.dp))
                }
                Spacer(modifier = Modifier.weight(1f))
                IconButton(
                    onClick = {
                        onLikeChange(post.copy(isSaved = !post.isSaved))
                    }
                ) {
                    Icon(
                        imageVector = if (post.isSaved) Icons.Filled.Bookmark else Icons.Outlined.BookmarkBorder,
                        contentDescription = "Save Post",
                        tint = if (post.isSaved) Color(0xFF0091EA) else Color(0xFF263238),
                        modifier = Modifier.size(26.dp)
                    )
                }
            }

            // Likers info, Captions and Comments
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .padding(bottom = 16.dp)
            ) {
                Text("${post.likeCount} likes", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Color(0xFF263238))
                Spacer(modifier = Modifier.height(4.dp))
                Row {
                    Text(post.username, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Color(0xFF263238))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(post.caption, fontSize = 13.sp, color = Color(0xFF263238), maxLines = 3, overflow = TextOverflow.Ellipsis)
                }
                
                if (post.comments.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "View all ${post.comments.size} comments",
                        fontSize = 12.sp,
                        color = Color(0xFF78909C),
                        modifier = Modifier.clickable { onPostClick() }
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(post.timeInfo, fontSize = 10.sp, color = Color(0xFF90A4AE))
            }
        }
    }
}
