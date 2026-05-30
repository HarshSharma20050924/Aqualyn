package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.Message
import androidx.compose.material.icons.filled.Comment
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.network.AqualynRepository
import com.example.network.NotificationDto
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ActivityNotificationsScreen(
    onBack: () -> Unit,
    onUserClick: (String) -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    var notifications by remember { mutableStateOf<List<NotificationDto>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        notifications = AqualynRepository.getNotifications()
        isLoading = false
        AqualynRepository.markNotificationsRead()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Activity", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color.White,
                    titleContentColor = Color(0xFF0091EA)
                )
            )
        },
        containerColor = Color.White
    ) { padding ->
        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = Color(0xFF0091EA))
            }
        } else if (notifications.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Filled.Notifications, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(64.dp))
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("No new activity", color = Color.Gray, fontSize = 16.sp)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(notifications) { notif ->
                    NotificationItemRow(notif = notif, onUserClick = onUserClick, coroutineScope = coroutineScope)
                }
            }
        }
    }
}

@Composable
fun NotificationItemRow(
    notif: NotificationDto,
    onUserClick: (String) -> Unit,
    coroutineScope: kotlinx.coroutines.CoroutineScope
) {
    var handled by remember { mutableStateOf(false) }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .clickable { onUserClick(notif.actorId) }
            .padding(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(contentAlignment = Alignment.BottomEnd) {
            if (notif.actor?.avatar != null) {
                AsyncImage(
                    model = notif.actor.avatar,
                    contentDescription = null,
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(Color.LightGray)
                )
            } else {
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF00ACC1)),
                    contentAlignment = Alignment.Center
                ) {
                    val displayName = notif.actor?.displayName ?: notif.actor?.username ?: "?"
                    Text(
                        displayName.take(1).uppercase(),
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 20.sp
                    )
                }
            }

            val iconType: ImageVector
            val iconTint: Color
            when (notif.type) {
                "follow", "follow_request" -> {
                    iconType = Icons.Filled.PersonAdd
                    iconTint = Color(0xFF00C853)
                }
                "message" -> {
                    iconType = Icons.Filled.Message
                    iconTint = Color(0xFF0091EA)
                }
                "comment", "like" -> {
                    iconType = Icons.Filled.Comment
                    iconTint = Color(0xFFFF4081)
                }
                "story_view" -> {
                    iconType = Icons.Filled.Visibility
                    iconTint = Color(0xFFFFC107)
                }
                else -> {
                    iconType = Icons.Filled.Notifications
                    iconTint = Color.Gray
                }
            }

            Box(
                modifier = Modifier
                    .size(18.dp)
                    .clip(CircleShape)
                    .background(iconTint),
                contentAlignment = Alignment.Center
            ) {
                Icon(iconType, contentDescription = null, tint = Color.White, modifier = Modifier.size(10.dp))
            }
        }

        Spacer(modifier = Modifier.width(12.dp))

        Column(modifier = Modifier.weight(1f)) {
            val actorName = notif.actor?.displayName ?: notif.actor?.username ?: "Someone"
            val text = when (notif.type) {
                "follow_request" -> "$actorName requested to follow you."
                "follow" -> "$actorName started following you."
                "message" -> "$actorName sent you a message."
                "comment" -> "$actorName commented: ${notif.text}"
                "like" -> "$actorName liked your post."
                "story_view" -> "$actorName viewed your story."
                else -> "$actorName ${notif.text ?: "interacted with you."}"
            }

            Text(
                text = text,
                fontWeight = if (notif.isRead) FontWeight.Normal else FontWeight.Bold,
                fontSize = 14.sp,
                color = Color(0xFF263238),
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            
            Text(
                "Just now", // Placeholder for actual notif.createdAt parsed date
                fontSize = 12.sp,
                color = Color.Gray
            )
        }

        if (notif.type == "follow_request" && !handled) {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = {
                        coroutineScope.launch {
                            val success = AqualynRepository.handleFollowRequest(notif.actorId, "accept")
                            if (success) handled = true
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF00C853)),
                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text("Accept", fontSize = 12.sp)
                }
                OutlinedButton(
                    onClick = {
                        coroutineScope.launch {
                            val success = AqualynRepository.handleFollowRequest(notif.actorId, "reject")
                            if (success) handled = true
                        }
                    },
                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text("Ignore", fontSize = 12.sp, color = Color.Gray)
                }
            }
        }
    }
}
