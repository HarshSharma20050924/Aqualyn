package com.example.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.LazyRow
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.GlobalState
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FriendProfileScreen(
    friendId: String,
    onBack: () -> Unit,
    onStartSecretChat: (String) -> Unit
) {
    val cleanFriendId = remember(friendId) {
        if (friendId.startsWith("c_")) friendId.substring(2) else friendId
    }

    val coroutineScope = rememberCoroutineScope()
    var userProfileDto by remember { mutableStateOf<com.example.network.UserDto?>(null) }
    val friendPosts = remember { mutableStateListOf<com.example.model.PostItem>() }
    val friendStories = remember { mutableStateListOf<com.example.model.StoryItem>() }

    LaunchedEffect(cleanFriendId) {
        val dto = com.example.network.AqualynRepository.fetchUserProfile(cleanFriendId)
        if (dto != null) {
            userProfileDto = dto
        }
        try {
            val postsList = com.example.network.AqualynRepository.getUserPosts(cleanFriendId)
            friendPosts.clear()
            friendPosts.addAll(postsList)
            
            val storiesList = com.example.network.AqualynRepository.getUserStories(cleanFriendId)
            friendStories.clear()
            friendStories.addAll(storiesList)
        } catch (e: Exception) {
            android.util.Log.e("FriendProfile", "Error loading friend data: ${e.localizedMessage}")
        }
    }

    val finalName = userProfileDto?.displayName ?: userProfileDto?.username ?: "User"
    val finalHandle = userProfileDto?.username ?: cleanFriendId
    val finalPhone = userProfileDto?.phone ?: ""

    // Follower list & counts
    var followCountState by remember { mutableStateOf(0) }
    var followingCountState by remember { mutableStateOf(0) }

    LaunchedEffect(userProfileDto) {
        userProfileDto?.let {
            followCountState = it._count?.followers ?: it.followers.size
            followingCountState = it._count?.following ?: it.following.size
        }
    }

    // Call and Simulation state triggers
    var isMutedState by remember { mutableStateOf(GlobalState.mutedChats[cleanFriendId] == true) }
    var isBlockedState by remember { mutableStateOf(GlobalState.blockedUsers[finalHandle] == true) }
    var isReportedState by remember { mutableStateOf(GlobalState.reportedUsers[finalHandle] == true) }
    var showActiveStoryViewer by remember { mutableStateOf<String?>(null) }
    var showReportReasonsDialog by remember { mutableStateOf(false) }

    // Media Links Docs Active Tab
    var mediaTabSelection by remember { mutableStateOf("Media") } // Media, Links, Docs

    // Under-avatar tab selector (Posts, Saved, Collections)
    var activeSubTab by remember { mutableStateOf("Posts") }

    // Floating simulators
    var showVoiceCallSim by remember { mutableStateOf(false) }
    var showVideoCallSim by remember { mutableStateOf(false) }

    // Secret Chat Dialog
    var showSecretChatRequestDialog by remember { mutableStateOf(false) }

    // Main layout
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF4F7F9))
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
        ) {
            // Header Hero Banner
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .background(
                        Brush.linearGradient(
                            listOf(Color(0xFF0091EA), Color(0xFF637BFE))
                        )
                    )
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 40.dp, start = 16.dp, end = 16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = onBack,
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(Color.Black.copy(alpha = 0.25f))
                    ) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }

                    Text(
                        text = "Contact Info",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )

                    IconButton(
                        onClick = { showSecretChatRequestDialog = true },
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(Color.Black.copy(alpha = 0.25f))
                    ) {
                        Icon(Icons.Filled.VpnKey, contentDescription = "Secret Handshake", tint = Color(0xFF00E5FF))
                    }
                }
            }

            // Profile Overlay Card
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .offset(y = (-48).dp),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Profile Avatar with dynamic outline border
                    Box(
                        modifier = Modifier
                            .size(96.dp)
                            .clip(CircleShape)
                            .background(Color.White)
                            .padding(4.dp)
                    ) {
                        val userAvatar = userProfileDto?.avatar ?: userProfileDto?.largeAvatar
                        if (!userAvatar.isNullOrBlank()) {
                            coil.compose.AsyncImage(
                                model = userAvatar,
                                contentDescription = null,
                                contentScale = androidx.compose.ui.layout.ContentScale.Crop,
                                modifier = Modifier.fillMaxSize().clip(CircleShape)
                            )
                        } else {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .clip(CircleShape)
                                    .background(Brush.linearGradient(listOf(Color(0xFF00B0FF), Color(0xFF00E5FF)))),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    finalName.take(1).uppercase(),
                                    color = Color.White,
                                    fontWeight = FontWeight.Black,
                                    fontSize = 38.sp
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                    Text(finalName, fontWeight = FontWeight.Black, fontSize = 22.sp, color = Color(0xFF263238))
                    Text("@$finalHandle", fontSize = 14.sp, color = Color(0xFF78909C))
                    Text(finalPhone, fontSize = 12.sp, color = Color.Gray, modifier = Modifier.padding(top = 2.dp))

                    Spacer(modifier = Modifier.height(16.dp))

                    // Social Stats Row (Followers, Following, Posts)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(followCountState.toString(), fontWeight = FontWeight.Black, fontSize = 16.sp, color = Color(0xFF263238))
                            Text("Followers", fontSize = 11.sp, color = Color.Gray)
                        }
                        Box(modifier = Modifier.width(1.dp).height(24.dp).background(Color(0xFFECEFF1)))
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(followingCountState.toString(), fontWeight = FontWeight.Black, fontSize = 16.sp, color = Color(0xFF263238))
                            Text("Following", fontSize = 11.sp, color = Color.Gray)
                        }
                        Box(modifier = Modifier.width(1.dp).height(24.dp).background(Color(0xFFECEFF1)))
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            val postsCountVal = if (friendPosts.isNotEmpty()) friendPosts.size.toString() else "24"
                            Text(postsCountVal, fontWeight = FontWeight.Black, fontSize = 16.sp, color = Color(0xFF263238))
                            Text("Posts", fontSize = 11.sp, color = Color.Gray)
                        }
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    // Follow and Call Action Buttons
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        var followed by remember { mutableStateOf(GlobalState.followedUsers[finalHandle] == true) }
                        
                        Button(
                            onClick = {
                                followed = !followed
                                coroutineScope.launch {
                                    if (followed) {
                                        val success = com.example.network.AqualynRepository.followUser(friendId)
                                        if (success) {
                                            GlobalState.followedUsers[finalHandle] = true
                                            followCountState += 1
                                        } else {
                                            followed = false
                                        }
                                    } else {
                                        val success = com.example.network.AqualynRepository.unfollowUser(friendId)
                                        if (success) {
                                            GlobalState.followedUsers.remove(finalHandle)
                                            followCountState -= 1
                                        } else {
                                            followed = true
                                        }
                                    }
                                }
                            },
                            modifier = Modifier.weight(1.3f),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (followed) Color(0xFFECEFF1) else Color(0xFF0091EA),
                                contentColor = if (followed) Color(0xFF546E7A) else Color.White
                            )
                        ) {
                            Icon(
                                imageVector = if (followed) Icons.Filled.HowToReg else Icons.Filled.PersonAdd,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(if (followed) "Following" else "Follow", fontWeight = FontWeight.Bold)
                        }

                        // Audio Call button
                        IconButton(
                            onClick = { showVoiceCallSim = true },
                            modifier = Modifier
                                .size(40.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color(0xFFE0F7FA))
                        ) {
                            Icon(Icons.Filled.Call, contentDescription = "Audio Call", tint = Color(0xFF0091EA))
                        }

                        // Video Call button
                        IconButton(
                            onClick = { showVideoCallSim = true },
                            modifier = Modifier
                                .size(40.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color(0xFFE8EAF6))
                        ) {
                            Icon(Icons.Filled.Videocam, contentDescription = "Video Call", tint = Color(0xFF5C6BC0))
                        }
                    }
                }
            }

            // Highlights and Stories Feed Segment
            if (friendStories.isNotEmpty()) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp)
                        .offset(y = (-32).dp)
                ) {
                    Text(
                        text = "ACTIVE STORIES & HIGHLIGHTS",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF546E7A),
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.height(10.dp))

                    LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        items(friendStories.size) { index ->
                            val story = friendStories[index]
                            StoryThumbnail(
                                title = story.title ?: "Story",
                                gradient = listOf(Color(0xFF0091EA), Color(0xFF637BFE))
                            ) {
                                showActiveStoryViewer = story.title ?: "Aqualyn Story"
                            }
                        }
                    }
                }
            }

            // Interactive Sub-Tabs (Posts, Saved, Collections)
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .offset(y = (-16).dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.SpaceAround
                ) {
                    listOf("Posts", "Saved", "Collections").forEach { tab ->
                        val isSel = activeSubTab == tab
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier
                                .clickable { activeSubTab = tab }
                                .padding(vertical = 8.dp)
                        ) {
                            Text(
                                text = tab,
                                fontWeight = if (isSel) FontWeight.Bold else FontWeight.Medium,
                                color = if (isSel) Color(0xFF0091EA) else Color(0xFF78909C),
                                fontSize = 14.sp
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Box(
                                modifier = Modifier
                                    .height(3.dp)
                                    .width(48.dp)
                                    .clip(CircleShape)
                                    .background(if (isSel) Color(0xFF0091EA) else Color.Transparent)
                            )
                        }
                    }
                }

                HorizontalDivider(color = Color(0xFFECEFF1).copy(alpha = 0.5f))

                // Posts Cards / Collections display
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    if (activeSubTab == "Posts") {
                        if (friendPosts.isNotEmpty()) {
                            friendPosts.forEach { post ->
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(16.dp),
                                    colors = CardDefaults.cardColors(containerColor = Color.White),
                                    border = BorderStroke(1.dp, Color(0xFFECEFF1))
                                ) {
                                    Column(modifier = Modifier.padding(16.dp)) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Box(
                                                modifier = Modifier.size(36.dp).clip(CircleShape).background(Color(0xFF0091EA)),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Text(finalName.take(1).uppercase(), fontWeight = FontWeight.Bold, color = Color.White)
                                            }
                                            Spacer(modifier = Modifier.width(10.dp))
                                            Column {
                                                Text(finalName, fontWeight = FontWeight.Bold)
                                                Text(post.timeAgo, fontSize = 11.sp, color = Color.Gray)
                                            }
                                        }
                                        Spacer(modifier = Modifier.height(12.dp))
                                        if (post.imageDescription.isNotEmpty()) {
                                            Box(
                                                modifier = Modifier.fillMaxWidth().height(180.dp).clip(RoundedCornerShape(12.dp)).background(
                                                    Brush.linearGradient(listOf(Color(0xFF80DEEA), Color(0xFF00838F)))
                                                ),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Text(post.imageDescription, color = Color.White, fontWeight = FontWeight.Bold, modifier = Modifier.padding(16.dp), textAlign = TextAlign.Center)
                                            }
                                            Spacer(modifier = Modifier.height(12.dp))
                                        }
                                        Text(post.caption, fontSize = 13.sp, color = Color(0xFF37474F))
                                    }
                                }
                            }
                        } else {
                            Text("No posts available", fontSize = 14.sp, color = Color.Gray, modifier = Modifier.padding(16.dp))
                        }
                    } else if (activeSubTab == "Saved") {
                        Text("No saved items", fontSize = 14.sp, color = Color.Gray, modifier = Modifier.padding(16.dp))
                    } else {
                        Text("No collections", fontSize = 14.sp, color = Color.Gray, modifier = Modifier.padding(16.dp))
                    }
                }
            }

            // Media, Links, and Docs Segment
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .padding(bottom = 16.dp),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        "MEDIA, LINKS, AND DOCS",
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF263238),
                        fontSize = 12.sp,
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    // Segmented Button Tab
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xFFF4F7F9))
                            .padding(4.dp)
                    ) {
                        listOf("Media", "Links", "Docs").forEach { tab ->
                            val isSel = mediaTabSelection == tab
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (isSel) Color.White else Color.Transparent)
                                    .clickable { mediaTabSelection = tab }
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    tab,
                                    fontSize = 13.sp,
                                    fontWeight = if (isSel) FontWeight.Bold else FontWeight.Medium,
                                    color = if (isSel) Color(0xFF0091EA) else Color(0xFF78909C)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Dynamic Sub-panels
                    when (mediaTabSelection) {
                        "Media" -> {
                            Text("No media shared yet", fontSize = 14.sp, color = Color.Gray, modifier = Modifier.padding(8.dp))
                        }
                        "Links" -> {
                            Text("No links shared yet", fontSize = 14.sp, color = Color.Gray, modifier = Modifier.padding(8.dp))
                        }
                        "Docs" -> {
                            Text("No documents shared yet", fontSize = 14.sp, color = Color.Gray, modifier = Modifier.padding(8.dp))
                        }
                    }
                }
            }

            // Settings & Security Preferences Segment
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .padding(bottom = 16.dp),
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        "PREFERENCES & SECURITY",
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF263238),
                        fontSize = 12.sp,
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.height(14.dp))

                    // Mute Notifications
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                coroutineScope.launch {
                                    val success = com.example.network.AqualynRepository.muteChat(friendId)
                                    if (success) {
                                        isMutedState = !isMutedState
                                        GlobalState.mutedChats[friendId] = isMutedState
                                    }
                                }
                            }
                            .padding(vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(Color(0xFFFFF3E0)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = if (isMutedState) Icons.Filled.VolumeOff else Icons.Filled.VolumeUp,
                                contentDescription = null,
                                tint = Color(0xFFFF9800),
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(16.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Mute Notifications", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text("Silence instant sound alerts", fontSize = 12.sp, color = Color.Gray)
                        }
                        Switch(
                            checked = isMutedState,
                            onCheckedChange = { checked ->
                                coroutineScope.launch {
                                    val success = com.example.network.AqualynRepository.muteChat(friendId)
                                    if (success) {
                                        isMutedState = checked
                                        GlobalState.mutedChats[friendId] = checked
                                    }
                                }
                            },
                            colors = SwitchDefaults.colors(checkedThumbColor = Color(0xFF0091EA))
                        )
                    }

                    HorizontalDivider(color = Color(0xFFECEFF1).copy(alpha = 0.5f))

                    // Interactive Block Row
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                coroutineScope.launch {
                                    val success = com.example.network.AqualynRepository.blockUser(friendId)
                                    if (success) {
                                        isBlockedState = !isBlockedState
                                        GlobalState.blockedUsers[finalHandle] = isBlockedState
                                    }
                                }
                            }
                            .padding(vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(Color(0xFFFFEBEE)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Filled.Block, contentDescription = null, tint = Color(0xFFE53935), modifier = Modifier.size(18.dp))
                        }
                        Spacer(modifier = Modifier.width(16.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Block Profile", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFFE53935))
                            Text(if (isBlockedState) "Currently Blocked" else "Alters secure delivery rules", fontSize = 12.sp, color = Color.Gray)
                        }
                        Icon(Icons.Default.KeyboardArrowRight, contentDescription = null, tint = Color.Gray)
                    }

                    HorizontalDivider(color = Color(0xFFECEFF1).copy(alpha = 0.5f))

                    // Interactive Report Row
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                showReportReasonsDialog = true
                            }
                            .padding(vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(Color(0xFFE8F5E9)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Filled.Report, contentDescription = null, tint = Color(0xFF4CAF50), modifier = Modifier.size(18.dp))
                        }
                        Spacer(modifier = Modifier.width(16.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Report User Abuse", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF4CAF50))
                            Text(if (isReportedState) "Report Pending Review" else "Flag suspicious spam activities", fontSize = 12.sp, color = Color.Gray)
                        }
                        Icon(Icons.Default.KeyboardArrowRight, contentDescription = null, tint = Color.Gray)
                    }
                }
            }

            Spacer(modifier = Modifier.height(64.dp))
        }

        // --- STORY VIEWER FULL SCREEN POPUP ---
        if (showActiveStoryViewer != null) {
            var storyProgress by remember { mutableStateOf(0f) }
            LaunchedEffect(showActiveStoryViewer) {
                storyProgress = 0f
                while (storyProgress < 1f) {
                    delay(30)
                    storyProgress += 0.01f
                }
                showActiveStoryViewer = null
            }

            androidx.compose.ui.window.Dialog(
                properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false),
                onDismissRequest = { showActiveStoryViewer = null }
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.Black)
                ) {
                    // Immersive background visual simulator
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(
                                Brush.verticalGradient(
                                    listOf(Color(0xFF102027), Color(0xFF37474F))
                                )
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = showActiveStoryViewer!!,
                            color = Color.White,
                            textAlign = TextAlign.Center,
                            fontWeight = FontWeight.Medium,
                            fontSize = 18.sp,
                            modifier = Modifier.padding(32.dp)
                        )
                    }

                    // Content details
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp)
                            .align(Alignment.TopCenter)
                    ) {
                        // Linear story timer bar
                        LinearProgressIndicator(
                            progress = storyProgress,
                            color = Color(0xFF00E5FF),
                            trackColor = Color.White.copy(0.3f),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(4.dp)
                                .clip(CircleShape)
                        )
                        Spacer(modifier = Modifier.height(16.dp))

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFF0091EA)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(finalName.take(1).uppercase(), fontWeight = FontWeight.Bold, color = Color.White)
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Text(finalName, color = Color.White, fontWeight = FontWeight.Bold)
                            }

                            IconButton(onClick = { showActiveStoryViewer = null }) {
                                Icon(Icons.Filled.Close, contentDescription = "Close story", tint = Color.White)
                            }
                        }
                    }
                }
            }
        }

        // --- REPORT REASONS DIALOG ---
        if (showReportReasonsDialog) {
            androidx.compose.ui.window.Dialog(onDismissRequest = { showReportReasonsDialog = false }) {
                Card(
                    modifier = Modifier.padding(16.dp),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White)
                ) {
                    Column(modifier = Modifier.padding(24.dp)) {
                        Text("Report Profile Verification", fontWeight = FontWeight.ExtraBold, fontSize = 18.sp, color = Color(0xFF263238))
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Select a violation category for reviewing:", fontSize = 13.sp, color = Color.Gray)
                        Spacer(modifier = Modifier.height(16.dp))

                        val reportCategories = listOf("Spam / Deceptive Advertising", "Harassment or Hostility", "Inappropriate Multimedia Content", "Suspicious/Impersonator Identity")
                        reportCategories.forEach { category ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .clickable {
                                        coroutineScope.launch {
                                            val success = com.example.network.AqualynRepository.reportUser(friendId, category)
                                            if (success) {
                                                isReportedState = true
                                                GlobalState.reportedUsers[finalHandle] = true
                                            }
                                        }
                                        showReportReasonsDialog = false
                                    }
                                    .padding(vertical = 12.dp, horizontal = 8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Outlined.Flag, contentDescription = null, tint = Color(0xFFEF5350), modifier = Modifier.size(20.dp))
                                Spacer(modifier = Modifier.width(12.dp))
                                Text(category, fontSize = 14.sp, fontWeight = FontWeight.Medium, color = Color(0xFF37474F))
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))
                        TextButton(
                            onClick = { showReportReasonsDialog = false },
                            modifier = Modifier.align(Alignment.End)
                        ) {
                            Text("Dismiss", color = Color.Gray)
                        }
                    }
                }
            }
        }

        // --- SECRET CHAT HANDSHAKE REQUEST DIALOG ---
        if (showSecretChatRequestDialog) {
            androidx.compose.ui.window.Dialog(onDismissRequest = { showSecretChatRequestDialog = false }) {
                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    modifier = Modifier.padding(16.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Lock,
                            contentDescription = null,
                            tint = Color(0xFF4CAF50),
                            modifier = Modifier.size(56.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Establish Secret Session?",
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 18.sp,
                            color = Color(0xFF263238)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Initializes peer-to-peer end-to-end encryption key exchange with $finalName. Key hashes are matched dynamically.",
                            fontSize = 13.sp,
                            color = Color(0xFF78909C),
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(24.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceEvenly
                        ) {
                            TextButton(onClick = { showSecretChatRequestDialog = false }) {
                                Text("Decline", color = Color.Gray)
                            }
                            Button(
                                onClick = {
                                    showSecretChatRequestDialog = false
                                    coroutineScope.launch {
                                        val response = com.example.network.AqualynRepository.requestSecretChat(cleanFriendId)
                                        if (response != null && response.success) {
                                            GlobalState.showToast("🔒 Secret exchange complete with $finalName!", isGreen = true)
                                            val domainChat = response.chat.toDomain()
                                            if (GlobalState.chats.none { it.id == domainChat.id }) {
                                                GlobalState.chats.add(0, domainChat)
                                            }
                                            onStartSecretChat(domainChat.id)
                                        } else {
                                            GlobalState.showToast("🔒 Secret handshake failed. Try again.", isGreen = false)
                                        }
                                    }
                                },
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4CAF50))
                            ) {
                                Text("Accept Handshake", color = Color.White)
                            }
                        }
                    }
                }
            }
        }

        // --- SIMULATED VOICE CALL OVERLAY ---
        if (showVoiceCallSim) {
            var isVoiceMutedState by remember { mutableStateOf(false) }
            var isVoiceSpeakerState by remember { mutableStateOf(false) }
            var VoiceTimeState by remember { mutableStateOf(0) }
            LaunchedEffect(Unit) {
                while (true) {
                    delay(1000)
                    VoiceTimeState += 1
                }
            }

            androidx.compose.ui.window.Dialog(
                properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false),
                onDismissRequest = { }
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Brush.verticalGradient(listOf(Color(0xFF00365C), Color(0xFF000E1C))))
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.padding(top = 48.dp)
                        ) {
                            Text("AQUALYN SECURE VOICE LINK", color = Color(0xFF00E5FF), fontSize = 12.sp, fontWeight = FontWeight.Bold, letterSpacing = 2.sp)
                            Spacer(modifier = Modifier.height(32.dp))
                            Box(
                                modifier = Modifier
                                    .size(120.dp)
                                    .clip(CircleShape)
                                    .background(Color.White.copy(0.1f))
                                    .border(2.dp, Color(0xFF00E5FF), CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(100.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFF0091EA)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(finalName.take(1).uppercase(), fontWeight = FontWeight.Bold, fontSize = 32.sp, color = Color.White)
                                }
                            }
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(finalName, fontWeight = FontWeight.Bold, fontSize = 28.sp, color = Color.White)
                            Spacer(modifier = Modifier.height(8.dp))
                            val minStr = (VoiceTimeState / 60).toString().padStart(2, '0')
                            val secStr = (VoiceTimeState % 60).toString().padStart(2, '0')
                            Text("Connected • $minStr:$secStr", fontSize = 15.sp, color = Color.White.copy(0.7f))
                        }

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 48.dp),
                            horizontalArrangement = Arrangement.SpaceEvenly,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            IconButton(
                                onClick = { isVoiceMutedState = !isVoiceMutedState },
                                modifier = Modifier
                                    .size(56.dp)
                                    .clip(CircleShape)
                                    .background(if (isVoiceMutedState) Color.White else Color.White.copy(0.15f))
                            ) {
                                Icon(
                                    imageVector = if (isVoiceMutedState) Icons.Default.MicOff else Icons.Default.Mic,
                                    contentDescription = "Mute",
                                    tint = if (isVoiceMutedState) Color(0xFF00365C) else Color.White
                                )
                            }

                            IconButton(
                                onClick = {
                                    showVoiceCallSim = false
                                    GlobalState.showToast("Voice simulator ended.", isGreen = true)
                                },
                                modifier = Modifier
                                    .size(72.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFEF5350))
                            ) {
                                Icon(Icons.Default.CallEnd, contentDescription = "Decline", tint = Color.White, modifier = Modifier.size(36.dp))
                            }

                            IconButton(
                                onClick = { isVoiceSpeakerState = !isVoiceSpeakerState },
                                modifier = Modifier
                                    .size(56.dp)
                                    .clip(CircleShape)
                                    .background(if (isVoiceSpeakerState) Color.White else Color.White.copy(0.15f))
                            ) {
                                Icon(
                                    imageVector = if (isVoiceSpeakerState) Icons.Default.VolumeUp else Icons.Default.VolumeOff,
                                    contentDescription = "Speaker",
                                    tint = if (isVoiceSpeakerState) Color(0xFF00365C) else Color.White
                                )
                            }
                        }
                    }
                }
            }
        }

        // --- SIMULATED VIDEO CALL OVERLAY ---
        if (showVideoCallSim) {
            var isVideoCamOnState by remember { mutableStateOf(true) }
            var isVideoMuteState by remember { mutableStateOf(false) }
            var VideoTimeState by remember { mutableStateOf(0) }
            LaunchedEffect(Unit) {
                while (true) {
                    delay(1000)
                    VideoTimeState += 1
                }
            }

            androidx.compose.ui.window.Dialog(
                properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false),
                onDismissRequest = { }
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color(0xFF001122))
                ) {
                    if (isVideoCamOnState) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(
                                    Brush.verticalGradient(
                                        colors = listOf(Color(0xFF00E5FF).copy(0.4f), Color(0xFF006064).copy(0.8f))
                                    )
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(Icons.Filled.Person, contentDescription = null, tint = Color.White.copy(0.3f), modifier = Modifier.size(100.dp))
                                Spacer(modifier = Modifier.height(8.dp))
                                Text("$finalName Camera Feed Simulator", color = Color.White.copy(0.6f), fontSize = 12.sp)
                            }
                        }
                    } else {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(Color.Black),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("$finalName Video Paused", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }

                    Card(
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(top = 80.dp, end = 24.dp)
                            .size(100.dp, 150.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.DarkGray),
                        border = BorderStroke(1.5.dp, Color.White)
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(Brush.linearGradient(listOf(Color(0xFF0091EA), Color(0xFF637BFE)))),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(Icons.Outlined.PhotoCamera, contentDescription = "Camera Feed", tint = Color.White.copy(0.8f), modifier = Modifier.size(20.dp))
                                Spacer(modifier = Modifier.height(4.dp))
                                Text("Your Video", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        verticalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(top = 40.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text("$finalName Video Call Session", color = Color.White, fontWeight = FontWeight.Black, fontSize = 20.sp)
                                val minStr = (VideoTimeState / 60).toString().padStart(2, '0')
                                val secStr = (VideoTimeState % 60).toString().padStart(2, '0')
                                Text("Aqualyn Link HD • Connected $minStr:$secStr", color = Color(0xFF00E5FF), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 40.dp),
                            horizontalArrangement = Arrangement.SpaceEvenly,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            IconButton(
                                onClick = { isVideoCamOnState = !isVideoCamOnState },
                                modifier = Modifier
                                    .size(56.dp)
                                    .clip(CircleShape)
                                    .background(if (isVideoCamOnState) Color.White.copy(0.2f) else Color.White)
                            ) {
                                Icon(
                                    imageVector = if (isVideoCamOnState) Icons.Filled.VideocamOff else Icons.Filled.Videocam,
                                    tint = if (isVideoCamOnState) Color.White else Color(0xFF001122),
                                    contentDescription = "Toggle Video"
                                )
                            }

                            IconButton(
                                onClick = {
                                    showVideoCallSim = false
                                    GlobalState.showToast("Video simulator session ended safely.", isGreen = true)
                                },
                                modifier = Modifier
                                    .size(72.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFEF5350))
                            ) {
                                Icon(Icons.Default.CallEnd, contentDescription = "Decline call", tint = Color.White, modifier = Modifier.size(36.dp))
                            }

                            IconButton(
                                onClick = { isVideoMuteState = !isVideoMuteState },
                                modifier = Modifier
                                    .size(56.dp)
                                    .clip(CircleShape)
                                    .background(if (isVideoMuteState) Color.White else Color.White.copy(0.2f))
                            ) {
                                Icon(
                                    imageVector = if (isVideoMuteState) Icons.Filled.MicOff else Icons.Filled.Mic,
                                    tint = if (isVideoMuteState) Color(0xFF001122) else Color.White,
                                    contentDescription = "Mute Voice"
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun StoryThumbnail(
    title: String,
    gradient: List<Color>,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.clickable { onClick() }
    ) {
        Box(
            modifier = Modifier
                .size(64.dp)
                .clip(CircleShape)
                .background(Color.White)
                .border(2.5.dp, Brush.linearGradient(gradient), CircleShape)
                .padding(4.dp),
            contentAlignment = Alignment.Center
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .clip(CircleShape)
                    .background(Color(0xFFE0F7FA)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Filled.PhotoLibrary, contentDescription = null, tint = Color(0xFF0091EA), modifier = Modifier.size(24.dp))
            }
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = title,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF37474F),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.width(64.dp),
            textAlign = TextAlign.Center
        )
    }
}

@Composable
fun PostCardSim(
    author: String,
    time: String,
    caption: String,
    gradient: List<Color>
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = BorderStroke(1.dp, Color(0xFFECEFF1))
    ) {
        Column {
            // Gradient header representing physical post content elegantly
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(130.dp)
                    .background(Brush.linearGradient(gradient)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Outlined.Image, contentDescription = null, tint = Color.White.copy(alpha = 0.4f), modifier = Modifier.size(36.dp))
            }

            Column(modifier = Modifier.padding(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(author, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF263238))
                    Text(time, fontSize = 11.sp, color = Color.Gray)
                }
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = caption,
                    fontSize = 13.sp,
                    color = Color(0xFF455A64),
                    lineHeight = 18.sp
                )
            }
        }
    }
}

@Composable
fun LinkRowSim(url: String, text: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xFFF4F7F9))
            .clickable { }
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(CircleShape)
                .background(Color(0xFFE1F5FE)),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Outlined.Link, contentDescription = null, tint = Color(0xFF0091EA), modifier = Modifier.size(18.dp))
        }
        Spacer(modifier = Modifier.width(12.dp))
        Column {
            Text(text, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Color(0xFF37474F))
            Text(url, fontSize = 11.sp, color = Color(0xFF0091EA), maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }
}

@Composable
fun DocRowSim(filename: String, size: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xFFF4F7F9))
            .clickable { }
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(CircleShape)
                .background(Color(0xFFEDE7F6)),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Outlined.InsertDriveFile, contentDescription = null, tint = Color(0xFF5E35B1), modifier = Modifier.size(18.dp))
        }
        Spacer(modifier = Modifier.width(12.dp))
        Column {
            Text(filename, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Color(0xFF37474F))
            Text(size, fontSize = 11.sp, color = Color.Gray)
        }
    }
}
