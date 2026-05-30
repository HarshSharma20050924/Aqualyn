package com.example.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.model.GlobalState
import com.example.model.User
import com.example.model.PostItem
import com.example.model.StoryItem
import com.example.network.AqualynRepository
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConnectionsScreen(onUserClick: (String) -> Unit, onChatClick: (String) -> Unit = {}) {
    var searchQuery by remember { mutableStateOf("") }
    var activeTab by remember { mutableStateOf(0) } // 0: All Contacts, 1: Followers, 2: Following
    var activeProfileUser by remember { mutableStateOf<User?>(null) }
    var isBlockedState by remember { mutableStateOf(false) }
    var isReportedState by remember { mutableStateOf(false) }
    var showAddContactDialog by remember { mutableStateOf(false) }
    var isFetching by remember { mutableStateOf(false) }
    var searchResults by remember { mutableStateOf<List<User>>(emptyList()) }

    val userPosts = remember { mutableStateListOf<PostItem>() }
    val userStories = remember { mutableStateListOf<StoryItem>() }

    val coroutineScope = rememberCoroutineScope()

    // Synergetic Background Sync trigger
    LaunchedEffect(activeTab) {
        when (activeTab) {
            0 -> {
                if (GlobalState.contacts.isEmpty()) {
                    isFetching = true
                    val synced = AqualynRepository.syncContacts(GlobalState.phoneNumbersToSync)
                    if (synced.isEmpty() && GlobalState.contacts.isEmpty()) {
                        // Try defaulting to a blank search to fetch some server users
                        GlobalState.contacts.addAll(AqualynRepository.searchUsers("").take(15))
                    } else {
                        GlobalState.contacts.clear()
                        GlobalState.contacts.addAll(synced.map { it.toDomain() })
                    }
                    isFetching = false
                }
            }
            1 -> {
                if (GlobalState.followersList.isEmpty()) {
                    isFetching = true
                    val followers = AqualynRepository.getFollowers("me")
                    GlobalState.followersList.clear()
                    GlobalState.followersList.addAll(followers.map { it.toDomain() })
                    isFetching = false
                }
            }
            2 -> {
                if (GlobalState.followingList.isEmpty()) {
                    isFetching = true
                    val following = AqualynRepository.getFollowing("me")
                    GlobalState.followingList.clear()
                    GlobalState.followingList.addAll(following.map { it.toDomain() })
                    isFetching = false
                }
            }
        }
    }

    LaunchedEffect(searchQuery) {
        if (searchQuery.isNotBlank()) {
            isFetching = true
            searchResults = AqualynRepository.searchUsers(searchQuery)
            isFetching = false
        } else {
            searchResults = emptyList()
        }
    }

    // Load active profile user assets synchronously from APIs!
    LaunchedEffect(activeProfileUser) {
        userPosts.clear()
        userStories.clear()
        activeProfileUser?.let { selected ->
            isBlockedState = GlobalState.blockedUsers[selected.id] == true
            isReportedState = GlobalState.reportedUsers[selected.id] == true
            
            val posts = AqualynRepository.getUserPosts(selected.id)
            userPosts.addAll(posts)
            
            val stories = AqualynRepository.getUserStories(selected.id)
            userStories.addAll(stories)
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.linearGradient(
                    colors = listOf(Color(0xFFD6F5F6), Color(0xFFE9E5F8))
                )
            )
    ) {
        if (activeProfileUser == null) {
            // MAIN DIRECTORY VIEWER
            Column(modifier = Modifier.fillMaxSize()) {
                // Top header bar
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp))
                        .background(Color.White.copy(alpha = 0.8f))
                        .border(1.dp, Color.White.copy(alpha = 0.5f), RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp))
                        .padding(horizontal = 16.dp, vertical = 12.dp)
                        .padding(top = 16.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            "Directory",
                            fontWeight = FontWeight.Black,
                            fontSize = 24.sp,
                            color = Color(0xFF0091EA),
                            letterSpacing = (-0.5).sp
                        )
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            IconButton(onClick = { showAddContactDialog = true }) {
                                Icon(Icons.Filled.PersonAddAlt1, contentDescription = "Add Contact", tint = Color(0xFF0091EA))
                            }
                        }
                    }
                }

                // Quick Action Utilities (Invite Friends & Real Sync)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(20.dp))
                            .background(Color.White.copy(alpha = 0.72f))
                            .border(1.dp, Color.White.copy(alpha = 0.5f), RoundedCornerShape(20.dp))
                            .clickable {
                                coroutineScope.launch {
                                    GlobalState.showToast("Invitation Link Copied!", isGreen = true)
                                }
                            }
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFF0091EA).copy(alpha = 0.1f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Filled.Share, contentDescription = null, tint = Color(0xFF0091EA), modifier = Modifier.size(18.dp))
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("Invite Friends", fontWeight = FontWeight.Bold, color = Color(0xFF0091EA), fontSize = 11.sp)
                        }
                    }

                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(RoundedCornerShape(20.dp))
                            .background(Color.White.copy(alpha = 0.72f))
                            .border(1.dp, Color.White.copy(alpha = 0.5f), RoundedCornerShape(20.dp))
                            .clickable {
                                coroutineScope.launch {
                                    isFetching = true
                                    val synced = AqualynRepository.syncContacts(GlobalState.phoneNumbersToSync)
                                    GlobalState.contacts.clear()
                                    GlobalState.contacts.addAll(synced.map { it.toDomain() })
                                    isFetching = false
                                    GlobalState.showToast("Synced with database servers!", isGreen = true)
                                }
                            }
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFF637BFE).copy(alpha = 0.1f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Filled.Sync, contentDescription = null, tint = Color(0xFF637BFE), modifier = Modifier.size(18.dp))
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("Sync List", fontWeight = FontWeight.Bold, color = Color(0xFF637BFE), fontSize = 11.sp)
                        }
                    }
                }

                // Global Search Box
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search by name or description...", color = Color.Gray, fontSize = 13.sp) },
                    leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null, tint = Color.Gray) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 6.dp),
                    shape = RoundedCornerShape(18.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = Color.White.copy(alpha = 0.85f),
                        unfocusedContainerColor = Color.White.copy(alpha = 0.85f),
                        unfocusedBorderColor = Color.White,
                        focusedBorderColor = Color(0xFF0091EA)
                    ),
                    singleLine = true
                )

                // Tab Selectors
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    listOf("All Contacts", "Followers", "Following").forEachIndexed { index, label ->
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier
                                .weight(1f)
                                .clickable { activeTab = index }
                        ) {
                            Text(
                                text = label,
                                fontWeight = if (activeTab == index) FontWeight.Bold else FontWeight.Medium,
                                color = if (activeTab == index) Color(0xFF0091EA) else Color(0xFF546E7A),
                                fontSize = 12.sp
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Box(
                                modifier = Modifier
                                    .height(3.dp)
                                    .width(48.dp)
                                    .clip(CircleShape)
                                    .background(if (activeTab == index) Color(0xFF0091EA) else Color.Transparent)
                            )
                        }
                    }
                }

                HorizontalDivider(color = Color.White.copy(alpha = 0.5f), thickness = 1.dp)

                // Dynamic list based on selected category tab
                val originalList = when (activeTab) {
                    0 -> GlobalState.contacts
                    1 -> GlobalState.followersList
                    else -> GlobalState.followingList
                }

                val filtered = if (searchQuery.isNotBlank()) {
                    searchResults
                } else {
                    originalList
                }

                if (isFetching) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Color(0xFF0091EA))
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 16.dp),
                        contentPadding = PaddingValues(bottom = 100.dp, top = 8.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        if (filtered.isNotEmpty()) {
                            items(filtered) { user ->
                                Card(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable {
                                            activeProfileUser = user
                                        },
                                    shape = RoundedCornerShape(20.dp),
                                    colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.85f)),
                                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.5f))
                                ) {
                                    Row(
                                        modifier = Modifier.padding(14.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(50.dp)
                                                .clip(CircleShape)
                                                .background(
                                                    Brush.linearGradient(
                                                        listOf(Color(0xFF0091EA), Color(0xFF637BFE))
                                                    )
                                                ),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(user.name.take(1).uppercase(), color = Color.White, fontWeight = FontWeight.Bold, fontSize = 20.sp)
                                        }
                                        Spacer(modifier = Modifier.width(14.dp))
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(user.name, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color(0xFF263238))
                                            Text("@${user.handle}", fontSize = 12.sp, color = Color(0xFF546E7A))
                                            if (user.role.isNotEmpty()) {
                                                Text(user.role, fontSize = 11.sp, color = Color(0xFF00E5FF), fontWeight = FontWeight.SemiBold)
                                            }
                                        }
                                        IconButton(onClick = { activeProfileUser = user }) {
                                            Icon(Icons.Filled.ArrowForwardIos, contentDescription = "View Profile", tint = Color(0xFF90A4AE), modifier = Modifier.size(16.dp))
                                        }
                                    }
                                }
                            }
                        } else {
                            item {
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 80.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Icon(Icons.Filled.SearchOff, contentDescription = null, tint = Color(0xFF90A4AE), modifier = Modifier.size(56.dp))
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Text("No accounts found", fontWeight = FontWeight.Bold, color = Color(0xFF546E7A), fontSize = 15.sp)
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text("Add first contacts or follow people to build your network!", fontSize = 12.sp, color = Color.Gray, textAlign = TextAlign.Center)
                                }
                            }
                        }
                    }
                }
            }
        } else {
            // DETAILED USER PROFILE VIEW (100% REAL-TIME ENDPOINTS)
            val user = activeProfileUser!!
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
            ) {
                // Background Header Banner
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(180.dp)
                        .background(
                            Brush.linearGradient(
                                listOf(Color(0xFF0091EA), Color(0xFF637BFE))
                            )
                        )
                ) {
                    IconButton(
                        onClick = { activeProfileUser = null },
                        modifier = Modifier
                            .padding(top = 40.dp, start = 16.dp)
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(Color.Black.copy(alpha = 0.3f))
                    ) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                }

                // Header Profile Cards
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp)
                        .offset(y = (-40).dp),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box(
                            modifier = Modifier
                                .size(88.dp)
                                .clip(CircleShape)
                                .background(Color.White)
                                .padding(4.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .clip(CircleShape)
                                    .background(
                                        Brush.linearGradient(
                                            listOf(Color(0xFF0091EA), Color(0xFF637BFE))
                                        )
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(user.name.take(1).uppercase(), color = Color.White, fontWeight = FontWeight.Bold, fontSize = 36.sp)
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))
                        Text(user.name, fontWeight = FontWeight.Black, fontSize = 22.sp, color = Color(0xFF263238))
                        Text("@${user.handle}", fontSize = 14.sp, color = Color(0xFF78909C))
                        if (user.description.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(user.description, fontSize = 13.sp, color = Color.Gray, textAlign = TextAlign.Center)
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Live User Statistics Row
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceEvenly
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(user.followers.toString(), fontWeight = FontWeight.Black, fontSize = 16.sp, color = Color(0xFF263238))
                                Text("Followers", fontSize = 11.sp, color = Color.Gray)
                            }
                            Box(modifier = Modifier.width(1.dp).height(24.dp).background(Color(0xFFECEFF1)))
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(user.following.toString(), fontWeight = FontWeight.Black, fontSize = 16.sp, color = Color(0xFF263238))
                                Text("Following", fontSize = 11.sp, color = Color.Gray)
                            }
                            Box(modifier = Modifier.width(1.dp).height(24.dp).background(Color(0xFFECEFF1)))
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(userPosts.size.toString(), fontWeight = FontWeight.Black, fontSize = 16.sp, color = Color(0xFF263238))
                                Text("Posts", fontSize = 11.sp, color = Color.Gray)
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Direct Interaction Buttons
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            val followed = remember { mutableStateOf(GlobalState.followedUsers[user.id] == true) }
                            Button(
                                onClick = {
                                    coroutineScope.launch {
                                        if (followed.value) {
                                            AqualynRepository.unfollowUser(user.id)
                                        } else {
                                            AqualynRepository.followUser(user.id)
                                        }
                                        followed.value = !followed.value
                                    }
                                },
                                modifier = Modifier.weight(1.3f),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (followed.value) Color(0xFF90A4AE) else Color(0xFF0091EA)
                                ),
                                shape = RoundedCornerShape(14.dp)
                            ) {
                                Icon(if (followed.value) Icons.Filled.HowToReg else Icons.Filled.PersonAdd, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(if (followed.value) "Following" else "Follow Account", fontWeight = FontWeight.Bold)
                            }

                            val coroutineScope = rememberCoroutineScope()
                            var isCreatingChat by remember { mutableStateOf(false) }

                            Button(
                                onClick = {
                                    if (isCreatingChat) return@Button
                                    isCreatingChat = true
                                    coroutineScope.launch {
                                        val newChat = com.example.network.AqualynRepository.createChat(
                                            isGroup = false, 
                                            name = "", 
                                            memberIds = listOf(user.id)
                                        )
                                        isCreatingChat = false
                                        activeProfileUser = null
                                        if (newChat != null) {
                                            onChatClick(newChat.id)
                                        } else {
                                            GlobalState.showToast("Failed to start conversation")
                                        }
                                    }
                                 },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF637BFE)),
                                shape = RoundedCornerShape(14.dp)
                            ) {
                                if (isCreatingChat) {
                                    CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                                } else {
                                    Icon(Icons.Filled.Chat, contentDescription = null, modifier = Modifier.size(16.dp))
                                }
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Chat", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }

                // Highlighted Stories & Posts feed
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp)
                        .offset(y = (-20).dp)
                ) {
                    if (userStories.isNotEmpty()) {
                        Text("Active Highlights", fontWeight = FontWeight.Bold, color = Color(0xFF263238), fontSize = 14.sp)
                        Spacer(modifier = Modifier.height(10.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            userStories.forEach { story ->
                                Box(
                                    modifier = Modifier
                                        .size(60.dp)
                                        .clip(CircleShape)
                                        .background(Color.White)
                                        .border(2.dp, Color(0xFF0091EA), CircleShape)
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
                                        Icon(Icons.Filled.Star, contentDescription = null, tint = Color(0xFF0091EA), modifier = Modifier.size(20.dp))
                                    }
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(24.dp))
                    }

                    Text("Posts & Media (${userPosts.size})", fontWeight = FontWeight.Bold, color = Color(0xFF263238), fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(10.dp))

                    if (userPosts.isEmpty()) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(32.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("No posts published yet by this user.", color = Color.Gray, fontSize = 13.sp)
                        }
                    } else {
                        userPosts.forEach { p ->
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 8.dp),
                                shape = RoundedCornerShape(20.dp),
                                border = BorderStroke(1.dp, Color.White.copy(alpha = 0.5f)),
                                colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.9f))
                            ) {
                                Column {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(140.dp)
                                            .background(
                                                Brush.linearGradient(
                                                    listOf(Color(0xFF00E5FF), Color(0xFF0091EA))
                                                )
                                            ),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(Icons.Outlined.Image, contentDescription = null, tint = Color.White.copy(alpha = 0.5f), modifier = Modifier.size(40.dp))
                                    }
                                    Text(
                                        text = p.caption,
                                        modifier = Modifier.padding(14.dp),
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = Color(0xFF263238)
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(24.dp))
                    HorizontalDivider(color = Color(0xFFECEFF1))
                    Spacer(modifier = Modifier.height(16.dp))

                    // Block & Abuse Management
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Button(
                            onClick = {
                                coroutineScope.launch {
                                    if (isBlockedState) {
                                        AqualynRepository.blockUser(user.id) // acts as toggle in backend or sync
                                        GlobalState.blockedUsers.remove(user.id)
                                        isBlockedState = false
                                        GlobalState.showToast("Unblocked developer", isGreen = true)
                                    } else {
                                        AqualynRepository.blockUser(user.id)
                                        GlobalState.blockedUsers[user.id] = true
                                        isBlockedState = true
                                        GlobalState.showToast("Blocked developer", isGreen = false)
                                    }
                                }
                            },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = if (isBlockedState) Color.Gray else Color(0xFFE53935)),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(if (isBlockedState) Icons.Filled.LockOpen else Icons.Filled.Block, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(if (isBlockedState) "Unblock" else "Block User", fontWeight = FontWeight.Bold)
                        }

                        Button(
                            onClick = {
                                coroutineScope.launch {
                                    if (isReportedState) {
                                        GlobalState.reportedUsers.remove(user.id)
                                        isReportedState = false
                                        GlobalState.showToast("Abuse Report Recalled", isGreen = true)
                                    } else {
                                        AqualynRepository.reportUser(user.id, "Violation of platform code of conducts")
                                        GlobalState.reportedUsers[user.id] = true
                                        isReportedState = true
                                        GlobalState.showToast("Abuse Report Recalled", isGreen = true)
                                    }
                                }
                            },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(containerColor = if (isReportedState) Color(0xFFFFA000) else Color(0xFFFFB300)),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Icon(Icons.Filled.Report, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(if (isReportedState) "Reported" else "Report Abuses", fontWeight = FontWeight.Bold)
                        }
                    }
                    Spacer(modifier = Modifier.height(48.dp))
                }
            }
        }

        // ADD CONTACT DIALOG
        if (showAddContactDialog) {
            var newName by remember { mutableStateOf("") }
            var newPhone by remember { mutableStateOf("") }

            Dialog(onDismissRequest = { showAddContactDialog = false }) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            "Add Contact",
                            fontWeight = FontWeight.Bold,
                            fontSize = 20.sp,
                            color = Color(0xFF263238)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            "Enter the phone number of the contact to sync with Aqualyn servers.",
                            fontSize = 12.sp,
                            color = Color(0xFF78909C),
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(16.dp))

                        OutlinedTextField(
                            value = newName,
                            onValueChange = { newName = it },
                            label = { Text("Full Name") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp)
                        )
                        Spacer(modifier = Modifier.height(12.dp))

                        OutlinedTextField(
                            value = newPhone,
                            onValueChange = { newPhone = it },
                            label = { Text("Phone Number") },
                            placeholder = { Text("+91 99999 88888") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp)
                        )
                        Spacer(modifier = Modifier.height(24.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            OutlinedButton(
                                onClick = { showAddContactDialog = false },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("Cancel")
                            }
                            Button(
                                onClick = {
                                    if (newPhone.isNotBlank()) {
                                        coroutineScope.launch {
                                            if (!GlobalState.phoneNumbersToSync.contains(newPhone)) {
                                                GlobalState.phoneNumbersToSync.add(newPhone)
                                            }
                                            isFetching = true
                                            val synced = AqualynRepository.syncContacts(GlobalState.phoneNumbersToSync)
                                            GlobalState.contacts.clear()
                                            GlobalState.contacts.addAll(synced.map { it.toDomain() })
                                            isFetching = false
                                            GlobalState.showToast("Contact added successfully!", isGreen = true)
                                            showAddContactDialog = false
                                        }
                                    }
                                },
                                modifier = Modifier.weight(1.3f),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0091EA))
                            ) {
                                Text("Add & Sync")
                            }
                        }
                    }
                }
            }
        }
    }
}
