package com.example.ui.screens.feed

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StoryViewerDialog(
    index: Int,
    storiesList: List<LocalStory>,
    onDismissRequest: () -> Unit,
    onActiveIndexChange: (Int?) -> Unit,
    triggerToast: (String) -> Unit
) {
    val currentStory = storiesList[index]
    LaunchedEffect(currentStory.id) {
        com.example.network.AqualynRepository.viewStory(currentStory.id)
    }
    
    Dialog(
        onDismissRequest = onDismissRequest,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        var progress by remember { mutableStateOf(0f) }
        var isPaused by remember { mutableStateOf(false) }
        var replyMsg by remember { mutableStateOf("") }

        LaunchedEffect(index, isPaused) {
            if (!isPaused) {
                val duration = 4000
                val interval = 50
                val totalSteps = duration / interval
                while (progress < 1.0f) {
                    delay(interval.toLong())
                    if (!isPaused) {
                        progress += 1.0f / totalSteps
                    }
                }
                // Auto-advance
                if (index < storiesList.size - 1) {
                    onActiveIndexChange(index + 1)
                    progress = 0f
                } else {
                    onActiveIndexChange(null)
                }
            }
        }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black)
        ) {
            // Background image or gradient fallback
            if (!currentStory.storyImageUrl.isNullOrEmpty()) {
                AsyncImage(
                    model = currentStory.storyImageUrl,
                    contentDescription = "Story Media",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Brush.linearGradient(currentStory.gradient))
                )
            }

            // Overlay scrim
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            listOf(Color.Black.copy(alpha = 0.5f), Color.Transparent, Color.Black.copy(alpha = 0.7f))
                        )
                    )
            )

            // Layout Contents
            Column(modifier = Modifier.fillMaxSize()) {
                // Progress Indicators at top
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 40.dp, start = 12.dp, end = 12.dp)
                        .height(4.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    for (i in storiesList.indices) {
                        val activeFill = when {
                            i < index -> 1.0f
                            i == index -> progress
                            else -> 0.0f
                        }
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .fillMaxHeight()
                                .clip(RoundedCornerShape(2.dp))
                                .background(Color.White.copy(alpha = 0.3f))
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxHeight()
                                    .fillMaxWidth(activeFill)
                                    .background(Color.White)
                            )
                        }
                    }
                }

                // Story owner details row
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 20.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (!currentStory.avatarUrl.isNullOrEmpty()) {
                        AsyncImage(
                            model = currentStory.avatarUrl,
                            contentDescription = "",
                            modifier = Modifier
                                .size(38.dp)
                                .clip(CircleShape)
                        )
                    } else {
                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .clip(CircleShape)
                                .background(Color.White.copy(alpha = 0.3f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(currentStory.username.take(1).uppercase(), color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(currentStory.username, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            if (currentStory.isCloseFriends) {
                                Spacer(modifier = Modifier.width(6.dp))
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(Color(0xFF4CAF50))
                                        .padding(horizontal = 4.dp, vertical = 1.dp)
                                ) {
                                    Text("CLOSE FRIENDS", color = Color.White, fontSize = 8.sp, fontWeight = FontWeight.Black)
                                }
                            }
                        }
                        Text("Just now", color = Color.White.copy(alpha = 0.6f), fontSize = 10.sp)
                    }
                    Spacer(modifier = Modifier.weight(1f))
                    
                    // Close item
                    IconButton(onClick = onDismissRequest) {
                        Icon(Icons.Filled.Close, contentDescription = "Close Story", tint = Color.White)
                    }
                }

                // Content details (with stickers & caption text)
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .pointerInput(Unit) {
                            detectTapGestures(
                                onPress = {
                                    isPaused = true
                                    tryAwaitRelease()
                                    isPaused = false
                                },
                                onTap = { offset ->
                                    val width = size.width
                                    if (offset.x < width * 0.3f) {
                                        // Tap Left: Go back
                                        if (index > 0) {
                                            onActiveIndexChange(index - 1)
                                            progress = 0f
                                        }
                                    } else {
                                        // Tap Right: Go next
                                        if (index < storiesList.size - 1) {
                                            onActiveIndexChange(index + 1)
                                            progress = 0f
                                        } else {
                                            onActiveIndexChange(null)
                                        }
                                    }
                                }
                            )
                        },
                    contentAlignment = Alignment.Center
                ) {
                    // Main Text Caption Overlay styled gracefully
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color.Black.copy(alpha = 0.5f))
                            .padding(horizontal = 20.dp, vertical = 12.dp)
                    ) {
                        Text(
                            text = currentStory.text,
                            color = Color.White,
                            fontWeight = FontWeight.Black,
                            fontSize = 21.sp,
                            textAlign = TextAlign.Center
                        )
                    }

                    // Sticker renders
                    currentStory.stickers.forEach { sticker ->
                        Box(
                            modifier = Modifier
                                .align(Alignment.Center)
                                .offset(y = (-40).dp)
                        ) {
                            when (sticker.type) {
                                "mention" -> {
                                    Row(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(12.dp))
                                            .background(Color.White)
                                            .padding(horizontal = 12.dp, vertical = 8.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(Icons.Filled.AlternateEmail, contentDescription = null, tint = Color(0xFFE91E63), modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(sticker.content, color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                    }
                                }
                                "hashtag" -> {
                                    Row(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(12.dp))
                                            .background(Brush.horizontalGradient(listOf(Color(0xFF9C27B0), Color(0xFFE91E63))))
                                            .padding(horizontal = 12.dp, vertical = 8.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(Icons.Filled.Tag, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(sticker.content, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                    }
                                }
                                "location" -> {
                                    Row(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(12.dp))
                                            .background(Color(0xFF2196F3))
                                            .padding(horizontal = 12.dp, vertical = 8.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(Icons.Filled.Place, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text(sticker.content, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                    }
                                }
                                "emoji" -> {
                                    Text(sticker.content, fontSize = 54.sp)
                                }
                            }
                        }
                    }
                }

                // Bottom reply and quick emojis (matching React StoryViewer bottom UI)
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    // Quick click-to-react emojis
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 12.dp),
                        horizontalArrangement = Arrangement.SpaceAround
                    ) {
                        val reactionEmojis = listOf("🔥", "😂", "😮", "😢", "😍", "👏")
                        reactionEmojis.forEach { emoji ->
                            Text(
                                text = emoji,
                                fontSize = 28.sp,
                                modifier = Modifier
                                    .clickable {
                                        triggerToast("Sent reaction: $emoji")
                                        onActiveIndexChange(null)
                                    }
                            )
                        }
                    }

                    // Text Field input
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = replyMsg,
                            onValueChange = { replyMsg = it },
                            placeholder = { Text("Send reply to ${currentStory.username}...", color = Color.White.copy(alpha = 0.6f)) },
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(28.dp)),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedContainerColor = Color.White.copy(alpha = 0.15f),
                                unfocusedContainerColor = Color.White.copy(alpha = 0.15f),
                                focusedBorderColor = Color.White.copy(alpha = 0.4f),
                                unfocusedBorderColor = Color.White.copy(alpha = 0.2f),
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White
                            )
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        IconButton(
                            onClick = {
                                if (replyMsg.isNotBlank()) {
                                    triggerToast("Reply sent successfully!")
                                    replyMsg = ""
                                    onActiveIndexChange(null)
                                }
                            },
                            modifier = Modifier
                                .size(48.dp)
                                .clip(CircleShape)
                                .background(Color(0xFF0091EA))
                        ) {
                            Icon(Icons.Filled.Send, contentDescription = "Send", tint = Color.White)
                        }
                    }
                }
            }
        }
    }
}
