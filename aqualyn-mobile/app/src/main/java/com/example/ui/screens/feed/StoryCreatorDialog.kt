package com.example.ui.screens.feed

import androidx.compose.animation.*
import androidx.compose.foundation.*
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
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import kotlinx.coroutines.launch
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.result.PickVisualMediaRequest
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.text.BasicTextField

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StoryCreatorDialog(
    storiesList: androidx.compose.runtime.snapshots.SnapshotStateList<LocalStory>,
    onDismissRequest: () -> Unit,
    triggerToast: (String) -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    var storyCreatorStep by remember { mutableStateOf("GALLERY") }
    var newStoryCaption by remember { mutableStateOf("") }
    var selectedStoryImgUrl by remember { mutableStateOf<String?>(null) }
    
    val storyImagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia(),
        onResult = { uri ->
            if (uri != null) {
                selectedStoryImgUrl = uri.toString()
                storyCreatorStep = "PREVIEW"
            }
        }
    )
    val grOptions = listOf(
        listOf(Color(0xFF006668), Color(0xFF6E9FFF)),
        listOf(Color(0xFF0BFBFF), Color(0xFF0057BD)),
        listOf(Color(0xFF7C4DFF), Color(0xFFE040FB)),
        listOf(Color(0xFFFF5252), Color(0xFFFF7A00))
    )
    var activeGrIdx by remember { mutableStateOf(0) }
    var isCloseFriendsOnly by remember { mutableStateOf(false) }

    // Sticker insertion state
    var activeStickerType by remember { mutableStateOf<String?>(null) } // "location", "hashtag", "mention", "emoji"
    var activeStickerValue by remember { mutableStateOf("") }

    Dialog(
        onDismissRequest = onDismissRequest,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        if (storyCreatorStep == "GALLERY") {
            Box(
                modifier = Modifier.fillMaxSize().background(Color.Black)
            ) {
                Column {
                    // Top bar
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 44.dp, bottom = 12.dp, start = 16.dp, end = 16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        IconButton(onClick = onDismissRequest) {
                            Icon(Icons.Filled.Close, contentDescription = "Close", tint = Color.White)
                        }
                        Text("Add to story", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 20.sp)
                        IconButton(onClick = {}) {
                            Icon(Icons.Filled.Settings, contentDescription = "Settings", tint = Color.White)
                        }
                    }
                    
                    // Action buttons row
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        val btnMod = Modifier.weight(1f).height(80.dp).background(Color(0xFF262626), RoundedCornerShape(12.dp)).clickable { storyCreatorStep = "PREVIEW" }
                        Column(modifier = btnMod, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                            Box(modifier = Modifier.background(Color.White, RoundedCornerShape(12.dp)).padding(4.dp)) {
                               Text("Aa", color = Color.Black, fontWeight = FontWeight.Black, fontSize = 16.sp)
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("Templates", color = Color.White, fontSize = 12.sp)
                        }
                        Column(modifier = btnMod, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                            Icon(Icons.Filled.MusicNote, contentDescription = null, tint = Color.Magenta)
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("Music", color = Color.White, fontSize = 12.sp)
                        }
                        Column(modifier = btnMod, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                            Icon(Icons.Filled.Dashboard, contentDescription = null, tint = Color(0xFFFFA500))
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("Collage", color = Color.White, fontSize = 12.sp)
                        }
                        Column(modifier = btnMod, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                            Icon(Icons.Filled.AutoAwesome, contentDescription = null, tint = Color.Cyan)
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("AI Images", color = Color.White, fontSize = 12.sp)
                        }
                    }

                    // Recents header
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("Recents", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            Icon(Icons.Filled.KeyboardArrowDown, contentDescription = null, tint = Color.White)
                        }
                        Row(
                            modifier = Modifier.background(Color(0xFF262626), RoundedCornerShape(8.dp)).padding(horizontal = 12.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Filled.FilterNone, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Select", color = Color.White, fontSize = 14.sp)
                        }
                    }

                    // Grid
                    val sampleImages = listOf(
                        "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&q=80&w=400",
                        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=400",
                        "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=400",
                        "https://images.unsplash.com/photo-1522204523234-8729aa6e3d5f?auto=format&fit=crop&q=80&w=400",
                        "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=400"
                    )
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(3),
                        modifier = Modifier.fillMaxWidth().weight(1f)
                    ) {
                        item {
                            Box(
                                modifier = Modifier
                                    .aspectRatio(9f/16f)
                                    .background(Color(0xFF262626))
                                    .border(1.dp, Color.Black)
                                    .clickable {
                                        storyImagePickerLauncher.launch(
                                            PickVisualMediaRequest(
                                                ActivityResultContracts.PickVisualMedia.ImageOnly
                                            )
                                        )
                                    },
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                                    Icon(Icons.Filled.PhotoLibrary, contentDescription = "Gallery", tint = Color.White)
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text("Gallery", color = Color.White, fontSize = 11.sp)
                                }
                            }
                        }
                        items(sampleImages.size) { i ->
                            AsyncImage(
                                model = sampleImages[i],
                                contentDescription = null,
                                modifier = Modifier.aspectRatio(9f/16f).border(1.dp, Color.Black).background(Color.DarkGray).clickable {
                                    selectedStoryImgUrl = sampleImages[i]
                                    storyCreatorStep = "PREVIEW"
                                },
                                contentScale = ContentScale.Crop
                            )
                        }
                    }
                }
            }
        } else {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(0xFF0A0F12))
            ) {
                // Background atmospheric fluid water glows
                Box(
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .offset(x = (-40).dp, y = (-40).dp)
                        .size(300.dp)
                        .background(Color(0xFF0057BD).copy(0.12f), CircleShape)
                )
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .offset(x = 60.dp, y = 120.dp)
                        .size(350.dp)
                        .background(Color(0xFF0BFBFF).copy(0.12f), CircleShape)
                )

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 16.dp)
                ) {
                    // Top App Bar Controls
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 44.dp, bottom = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        IconButton(
                            onClick = onDismissRequest,
                            modifier = Modifier
                                .size(40.dp)
                                .background(Color.White.copy(0.16f), CircleShape)
                        ) {
                            Icon(Icons.Filled.Close, contentDescription = "Close", tint = Color.White)
                        }
                        
                        Text(
                            "Aqualyn Story Highlight",
                            color = Color.White,
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 16.sp
                        )

                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            IconButton(
                                onClick = { activeGrIdx = (activeGrIdx + 1) % grOptions.size },
                                modifier = Modifier
                                    .size(40.dp)
                                    .background(Color.White.copy(0.16f), CircleShape)
                            ) {
                                Icon(Icons.Filled.ColorLens, contentDescription = "Cycle Colors", tint = Color.White)
                            }
                        }
                    }

                    // Main Story Editor Workspace
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(32.dp))
                            .background(Brush.linearGradient(grOptions[activeGrIdx]))
                            .border(1.dp, Color.White.copy(0.18f), RoundedCornerShape(32.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        if (!selectedStoryImgUrl.isNullOrBlank()) {
                            AsyncImage(
                                model = selectedStoryImgUrl,
                                contentDescription = null,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )
                        }
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(
                                    Brush.radialGradient(
                                        colors = listOf(Color.White.copy(0.15f), Color.Transparent),
                                        center = Offset(250f, 250f),
                                        radius = 600f
                                    )
                                )
                        )

                        // Editor Tools Overlay (Floating Right Sidebar)
                        Column(
                            modifier = Modifier
                                .align(Alignment.CenterEnd)
                                .padding(end = 16.dp)
                                .shadow(8.dp, RoundedCornerShape(20.dp))
                                .background(Color.White.copy(0.13f), RoundedCornerShape(20.dp))
                                .border(1.dp, Color.White.copy(0.1f), RoundedCornerShape(20.dp))
                                .padding(vertical = 12.dp, horizontal = 6.dp),
                            verticalArrangement = Arrangement.spacedBy(16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            listOf(
                                Icons.Filled.TextFields to "Text",
                                Icons.Filled.Face to "Reactions",
                                Icons.Filled.MusicNote to "Audio",
                                Icons.Filled.Brush to "Draw",
                                Icons.Filled.AutoAwesome to "Sparkles"
                            ).forEach { (icon, name) ->
                                IconButton(
                                    onClick = {
                                        if (name == "Reactions") {
                                            activeStickerType = "emoji"
                                            activeStickerValue = "✨"
                                        } else {
                                            triggerToast("$name editing tool activated!")
                                        }
                                    },
                                    modifier = Modifier
                                        .size(36.dp)
                                        .background(Color.White.copy(0.08f), CircleShape)
                                ) {
                                    Icon(icon, contentDescription = name, tint = Color.White, modifier = Modifier.size(18.dp))
                                }
                            }
                        }

                        // Centered Interactive Text overlay fields
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 48.dp)
                        ) {
                            BasicTextField(
                                value = newStoryCaption,
                                onValueChange = { newStoryCaption = it },
                                modifier = Modifier.fillMaxWidth(),
                                textStyle = androidx.compose.ui.text.TextStyle(
                                    color = Color.White,
                                    fontSize = 24.sp,
                                    fontWeight = FontWeight.Black,
                                    textAlign = TextAlign.Center
                                ),
                                decorationBox = { innerTextField ->
                                    if (newStoryCaption.isEmpty()) {
                                        Text(
                                            text = "Tap to add caption...",
                                            color = Color.White.copy(0.6f),
                                            fontSize = 24.sp,
                                            fontWeight = FontWeight.Bold,
                                            textAlign = TextAlign.Center,
                                            modifier = Modifier.fillMaxWidth()
                                        )
                                    }
                                    innerTextField()
                                }
                            )

                            // Render Selected Active Sticker
                            if (activeStickerValue.isNotBlank() && activeStickerType != null) {
                                Spacer(modifier = Modifier.height(24.dp))
                                when (activeStickerType) {
                                    "mention" -> {
                                        Row(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(12.dp))
                                                .background(Color.White)
                                                .padding(horizontal = 14.dp, vertical = 6.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Icon(Icons.Filled.AlternateEmail, contentDescription = null, tint = Color(0xFF006668), modifier = Modifier.size(16.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text(activeStickerValue, color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                        }
                                    }
                                    "hashtag" -> {
                                        Row(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(12.dp))
                                                .background(Brush.horizontalGradient(listOf(Color(0xFF006668), Color(0xFF0BFBFF))))
                                                .padding(horizontal = 14.dp, vertical = 6.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Icon(Icons.Filled.Tag, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text(activeStickerValue, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                        }
                                    }
                                    "location" -> {
                                        Row(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(12.dp))
                                                .background(Color(0xFF2196F3))
                                                .padding(horizontal = 14.dp, vertical = 6.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Icon(Icons.Filled.Place, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text(activeStickerValue, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                        }
                                    }
                                    "emoji" -> {
                                        Text(activeStickerValue, fontSize = 54.sp)
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Quick Sticker Bar Option Rows
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        listOf(
                            Triple("📍 Maldives", "location", Color(0xFF2196F3)),
                            Triple("#Aqualyn", "hashtag", Color(0xFF006668)),
                            Triple("@team_aqua", "mention", Color(0xFF6E9FFF))
                        ).forEach { (label, type, color) ->
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .shadow(elevation = 1.dp, shape = RoundedCornerShape(12.dp))
                                    .background(color.copy(0.15f), RoundedCornerShape(12.dp))
                                    .border(1.dp, color.copy(0.3f), RoundedCornerShape(12.dp))
                                    .clickable {
                                        activeStickerType = type
                                        activeStickerValue = label.replace(Regex("[^a-zA-Z0-9_]"), "")
                                    }
                                    .padding(vertical = 10.dp, horizontal = 4.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(label, color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    // Emoji quick-shelf selection
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 2.dp),
                        horizontalArrangement = Arrangement.SpaceAround
                    ) {
                        listOf("💧", "🌊", "👑", "🔥", "🙌", "✨").forEach { emoji ->
                            IconButton(onClick = {
                                activeStickerType = "emoji"
                                activeStickerValue = emoji
                            }) {
                                Text(emoji, fontSize = 26.sp)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Close Friends toggle row
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .shadow(2.dp, RoundedCornerShape(16.dp))
                            .background(Color.White.copy(0.06f), RoundedCornerShape(16.dp))
                            .border(1.dp, Color.White.copy(0.04f), RoundedCornerShape(16.dp))
                            .padding(horizontal = 16.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .background(Color(0xFF4CAF50).copy(0.15f), CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Filled.Star, contentDescription = null, tint = Color(0xFF4CAF50), modifier = Modifier.size(16.dp))
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text("Close Friends only", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                Text("Limit visibility to aquatic focus circles", color = Color.Gray, fontSize = 10.sp)
                            }
                        }
                        Switch(
                            checked = isCloseFriendsOnly,
                            onCheckedChange = { isCloseFriendsOnly = it },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = Color.White,
                                checkedTrackColor = Color(0xFF4CAF50)
                            )
                        )
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    // Flow footer button layout
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 32.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Button(
                            onClick = {
                                val textValue = if (newStoryCaption.isNotBlank()) newStoryCaption else "Exploring the Aquifer"
                                coroutineScope.launch {
                                    val newStory = com.example.network.AqualynRepository.createStory(textValue)
                                    storiesList.add(
                                        0,
                                        LocalStory(
                                            id = newStory?.id ?: System.currentTimeMillis().toString(),
                                            username = "you",
                                            gradient = grOptions[activeGrIdx],
                                            text = textValue,
                                            isMine = true,
                                            avatarUrl = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
                                            isCloseFriends = isCloseFriendsOnly,
                                            stickers = if (activeStickerType != null && activeStickerValue.isNotBlank()) {
                                                listOf(LocalSticker(System.currentTimeMillis().toString(), activeStickerType!!, activeStickerValue))
                                            } else emptyList()
                                        )
                                    )
                                    triggerToast("Story published!")
                                }
                                onDismissRequest()
                            },
                            modifier = Modifier
                                .weight(1f)
                                .height(50.dp)
                                .shadow(6.dp, CircleShape),
                            colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                            contentPadding = PaddingValues(),
                            shape = CircleShape
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(
                                        Brush.linearGradient(grOptions[activeGrIdx]),
                                        CircleShape
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Filled.HistoryToggleOff, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Your Story", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                }
                            }
                        }

                        Button(
                            onClick = {
                                val textValue = if (newStoryCaption.isNotBlank()) newStoryCaption else "Focused Flow"
                                isCloseFriendsOnly = true
                                coroutineScope.launch {
                                    val newStory = com.example.network.AqualynRepository.createStory(textValue)
                                    storiesList.add(
                                        0,
                                        LocalStory(
                                            id = newStory?.id ?: System.currentTimeMillis().toString(),
                                            username = "you",
                                            gradient = listOf(Color(0xFF006668), Color(0xFF0BFBFF)),
                                            text = textValue,
                                            isMine = true,
                                            avatarUrl = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
                                            isCloseFriends = true,
                                            stickers = if (activeStickerType != null && activeStickerValue.isNotBlank()) {
                                                listOf(LocalSticker(System.currentTimeMillis().toString(), activeStickerType!!, activeStickerValue))
                                            } else emptyList()
                                        )
                                    )
                                    triggerToast("Story published to Close Friends!")
                                }
                                onDismissRequest()
                            },
                            modifier = Modifier
                                .weight(1f)
                                .height(50.dp)
                                .shadow(6.dp, CircleShape),
                            colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                            contentPadding = PaddingValues(),
                            shape = CircleShape
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(
                                        Brush.linearGradient(listOf(Color(0xFF006668), Color(0xFF0BFBFF))),
                                        CircleShape
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Filled.Stars, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Close Friends", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                }
                            }
                        }

                        Box(
                            modifier = Modifier
                                .size(50.dp)
                                .clip(CircleShape)
                                .background(Color.White)
                                .clickable {
                                    val finalCaption = if (newStoryCaption.isBlank()) "Aqua Flow" else newStoryCaption
                                    storiesList.add(
                                        0,
                                        LocalStory(
                                            id = System.currentTimeMillis().toString(),
                                            username = "you",
                                            gradient = grOptions[activeGrIdx],
                                            text = finalCaption,
                                            isMine = true,
                                            avatarUrl = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
                                            storyImageUrl = selectedStoryImgUrl
                                        )
                                    )
                                    triggerToast("Story published automatically!")
                                    onDismissRequest()
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Filled.ArrowForward, contentDescription = "Next", tint = Color(0xFF0057BD), modifier = Modifier.size(20.dp))
                        }
                    }
                }
            }
        }
    }
}
