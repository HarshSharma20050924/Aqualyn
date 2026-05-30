package com.example.ui.screens.chat

import android.util.Log

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.combinedClickable
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Popup
import androidx.compose.ui.unit.IntOffset
import coil.compose.AsyncImage
import com.example.model.ChatItem
import com.example.ui.components.SwipeToRefreshBox
import com.example.ui.screens.chat.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatsScreen(
    onChatClick: (String) -> Unit,
    onNewChatClick: () -> Unit,
    onProfileClick: () -> Unit,
    onFriendProfileClick: (String) -> Unit
) {
    var isFetching by remember { mutableStateOf(true) }
    val coroutineScope = rememberCoroutineScope()
    var isRefreshing by remember { mutableStateOf(false) }
    var activeTab by remember { mutableStateOf("All") }
    var isSelectionMode by remember { mutableStateOf(false) }
    var showSearch by remember { mutableStateOf(false) }
    var searchQuery by remember { mutableStateOf("") }

    val context = androidx.compose.ui.platform.LocalContext.current
    val selectedChatIds = remember { mutableStateListOf<String>() }

    var isViewingArchivedChats by remember { mutableStateOf(false) }
    var showArchivePinUnlockDialog by remember { mutableStateOf(false) }
    var archivePinAttemptInput by remember { mutableStateOf("") }

    LaunchedEffect(isSelectionMode) {
        if (!isSelectionMode) {
            selectedChatIds.clear()
        }
    }

    var showCreateFolderDialog by remember { mutableStateOf(false) }
    var folderNameToCreate by remember { mutableStateOf("") }
    val chatsToIncludeInFolder = remember { mutableStateListOf<String>() }

    LaunchedEffect(Unit) {
        if (com.example.model.GlobalState.chats.isEmpty()) {
            isFetching = true
            com.example.network.AqualynRepository.fetchChats()
        }
        try {
            val backendFolders = com.example.network.AqualynRepository.getChatFolders()
            if (backendFolders.isNotEmpty()) {
                com.example.model.GlobalState.folders.clear()
                backendFolders.forEach { folderDto ->
                    com.example.model.GlobalState.folders.add(folderDto.name)
                    folderDto.chatIds.forEach { chatId ->
                        com.example.model.GlobalState.folderChatMap[chatId] = folderDto.name
                    }
                }
            }
        } catch (e: Exception) {
            Log.e("ChatsScreen", "Failed to load folders", e)
        }
        isFetching = false
        while (true) {
            kotlinx.coroutines.delay(3500)
            try {
                com.example.network.AqualynRepository.fetchChats(silent = true)
            } catch (e: Exception) {
                // Ignore errors silently for background sync
            }
        }
    }

    val visibleChats = com.example.model.GlobalState.chats.filter { chat ->
        val matchesSearch = (chat.groupName ?: chat.user?.name ?: "").contains(searchQuery, ignoreCase = true)
        val isArchived = com.example.model.GlobalState.archivedChats[chat.id] == true

        if (isViewingArchivedChats) {
            isArchived && matchesSearch
        } else {
            val matchesTab = when (activeTab) {
                "All" -> !isArchived
                "Personal" -> !isArchived && !chat.isGroup
                "Groups" -> !isArchived && chat.isGroup
                "Unread" -> !isArchived && (chat.unreadCount > 0)
                "Bots" -> !isArchived && (chat.groupName?.contains("Bot", ignoreCase = true) == true || chat.user?.name?.contains("Bot", ignoreCase = true) == true || chat.groupName?.contains("Secret", ignoreCase = true) == true)
                else -> {
                    if (com.example.model.GlobalState.folders.contains(activeTab)) {
                        !isArchived && com.example.model.GlobalState.folderChatMap[chat.id] == activeTab
                    } else {
                        !isArchived
                    }
                }
            }
            matchesSearch && matchesTab
        }
    }

    val filteredPinnedChats = visibleChats.filter { it.isPinned }
    val filteredRecentChats = visibleChats.filter { !it.isPinned }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF4F7F9))
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Top Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp)
                    .padding(top = 16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                if (showSearch) {
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        modifier = Modifier
                            .weight(1f)
                            .height(50.dp),
                        placeholder = { Text("Search chats, messages...", color = Color(0xFF90A4AE)) },
                        colors = OutlinedTextFieldDefaults.colors(
                            unfocusedContainerColor = Color.White,
                            focusedContainerColor = Color.White,
                            unfocusedBorderColor = Color(0xFFECEFF1),
                            focusedBorderColor = Color(0xFF0091EA)
                        ),
                        shape = RoundedCornerShape(25.dp),
                        leadingIcon = {
                            Icon(Icons.Filled.Search, contentDescription = null, tint = Color(0xFF90A4AE))
                        },
                        trailingIcon = {
                            if (searchQuery.isNotEmpty()) {
                                IconButton(onClick = { searchQuery = "" }) {
                                     Icon(Icons.Filled.Clear, contentDescription = "Clear", tint = Color(0xFF90A4AE))
                                }
                            }
                        }
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    TextButton(onClick = { showSearch = false; searchQuery = "" }) {
                        Text("Cancel", color = Color(0xFF0091EA), fontWeight = FontWeight.Bold)
                    }
                } else if (isSelectionMode) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(onClick = { isSelectionMode = false }) {
                            Icon(Icons.Filled.Close, contentDescription = "Close", tint = Color(0xFF546E7A))
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            "${selectedChatIds.size} Selected",
                            fontWeight = FontWeight.Bold,
                            fontSize = 20.sp,
                            color = Color(0xFF263238)
                        )
                    }
                    
                    Row {
                        IconButton(onClick = {
                            // Archive all selected
                            selectedChatIds.forEach { id ->
                                com.example.model.GlobalState.archivedChats[id] = true
                            }
                            isSelectionMode = false
                            android.widget.Toast.makeText(context, "Selected chats archived", android.widget.Toast.LENGTH_SHORT).show()
                        }) {
                            Icon(Icons.Outlined.Archive, contentDescription = "Archive Selected", tint = Color(0xFF0091EA))
                        }
                        IconButton(onClick = {
                            // Delete all selected
                            com.example.model.GlobalState.chats.removeAll { selectedChatIds.contains(it.id) }
                            isSelectionMode = false
                            android.widget.Toast.makeText(context, "Selected chats deleted", android.widget.Toast.LENGTH_SHORT).show()
                        }) {
                            Icon(Icons.Outlined.Delete, contentDescription = "Delete Selected", tint = Color(0xFFE53935))
                        }
                    }
                } else if (isViewingArchivedChats) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(onClick = { isViewingArchivedChats = false }) {
                            Icon(Icons.Filled.ArrowBack, contentDescription = "Back", tint = Color(0xFF0091EA))
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            "Archived Chats",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color(0xFF263238),
                            letterSpacing = (-0.5).sp
                        )
                    }
                } else {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(Color(0xFF0091EA))
                                .border(2.dp, Color(0xFFE1F5FE), CircleShape)
                                .clickable { onProfileClick() },
                            contentAlignment = Alignment.Center
                        ) {
                            Text("ME", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            "Aqualyn",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color(0xFF0091EA),
                            letterSpacing = (-0.5).sp
                        )
                    }
                    Row {
                        IconButton(onClick = { showSearch = true }) {
                            Icon(Icons.Filled.Search, contentDescription = "Search", tint = Color(0xFF0091EA))
                        }
                        var showMorePopup by remember { mutableStateOf(false) }
                        Box {
                            IconButton(onClick = { showMorePopup = true }) {
                                Icon(Icons.Filled.MoreVert, contentDescription = "More", tint = Color(0xFF0091EA))
                            }
                            DropdownMenu(
                                expanded = showMorePopup,
                                onDismissRequest = { showMorePopup = false }
                            ) {
                                DropdownMenuItem(
                                    text = { Text("Mark All Read") },
                                    leadingIcon = { Icon(Icons.Outlined.Check, contentDescription = null) },
                                    onClick = {
                                        showMorePopup = false
                                        com.example.model.GlobalState.chats.forEachIndexed { index, chatItem ->
                                            com.example.model.GlobalState.chats[index] = chatItem.copy(unreadCount = 0)
                                        }
                                        android.widget.Toast.makeText(context, "All chats marked read", android.widget.Toast.LENGTH_SHORT).show()
                                    }
                                )
                                DropdownMenuItem(
                                    text = { Text("Sync Server Data") },
                                    leadingIcon = { Icon(Icons.Outlined.Refresh, contentDescription = null) },
                                    onClick = {
                                        showMorePopup = false
                                        coroutineScope.launch {
                                            com.example.network.AqualynRepository.fetchChats()
                                            android.widget.Toast.makeText(context, "State synced with server successfully", android.widget.Toast.LENGTH_SHORT).show()
                                        }
                                    }
                                )
                            }
                        }
                    }
                }
            }

            // Tabs
            if (!isSelectionMode && !showSearch && !isViewingArchivedChats) {
                androidx.compose.foundation.lazy.LazyRow(
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val tabs = listOf("All", "Personal", "Groups", "Unread", "Bots") + com.example.model.GlobalState.folders.toList()
                    items(tabs) { tab ->
                        TabChip(tab, activeTab == tab) { activeTab = tab }
                    }
                    item {
                        Box(
                            modifier = Modifier
                                .height(32.dp)
                                .clip(RoundedCornerShape(16.dp))
                                .background(Color.White)
                                .border(1.dp, Color(0xFFE0E0E0), RoundedCornerShape(16.dp))
                                .padding(horizontal = 16.dp)
                                .clickable {
                                    folderNameToCreate = ""
                                    chatsToIncludeInFolder.clear()
                                    showCreateFolderDialog = true
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Filled.FolderOpen, contentDescription = null, tint = Color(0xFF546E7A), modifier = Modifier.size(16.dp))
                        }
                    }
                }
            }

            // Main Content area
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
            ) {
                if (isFetching) {
                    // Skeleton Loading
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp)
                    ) {
                        for (i in 0..4) {
                            Row(modifier = Modifier.padding(vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                                Box(modifier = Modifier.size(56.dp).clip(CircleShape).background(Color(0xFFE0E0E0)))
                                Spacer(modifier = Modifier.width(16.dp))
                                Column {
                                    Box(modifier = Modifier.height(16.dp).width(120.dp).background(Color(0xFFE0E0E0), RoundedCornerShape(4.dp)))
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Box(modifier = Modifier.height(14.dp).fillMaxWidth(0.6f).background(Color(0xFFE0E0E0), RoundedCornerShape(4.dp)))
                                }
                            }
                        }
                    }
                } else {
                    SwipeToRefreshBox(
                        isRefreshing = isRefreshing,
                        onRefresh = {
                            isRefreshing = true
                            coroutineScope.launch {
                                try {
                                    com.example.network.AqualynRepository.fetchChats()
                                    com.example.model.GlobalState.showToast("Chats updated!", isGreen = true)
                                } catch (e: Exception) {
                                    com.example.model.GlobalState.showToast("Failed to refresh chats", isGreen = false)
                                } finally {
                                    isRefreshing = false
                                }
                            }
                        },
                        modifier = Modifier.fillMaxSize()
                    ) {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(16.dp)
                        ) {
                        val archivedCount = com.example.model.GlobalState.chats.count { com.example.model.GlobalState.archivedChats[it.id] == true }
                        if (archivedCount > 0 && !isViewingArchivedChats) {
                            item {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(20.dp))
                                        .background(Color(0xFFE0F7FA).copy(0.6f))
                                        .clickable {
                                            if (com.example.model.GlobalState.archivePinRequired && com.example.model.GlobalState.archiveLockedState) {
                                                showArchivePinUnlockDialog = true
                                            } else {
                                                isViewingArchivedChats = true
                                            }
                                        }
                                        .padding(horizontal = 16.dp, vertical = 12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(Icons.Outlined.Archive, contentDescription = "Archived", tint = Color(0xFF0091EA), modifier = Modifier.size(24.dp))
                                    Spacer(modifier = Modifier.width(16.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text("Archived Chats", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color(0xFF263238))
                                        Text("$archivedCount chat conversation" + (if (archivedCount > 1) "s" else ""), fontSize = 12.sp, color = Color(0xFF78909C))
                                    }
                                    if (com.example.model.GlobalState.archivePinRequired) {
                                        Icon(
                                            imageVector = if (com.example.model.GlobalState.archiveLockedState) Icons.Filled.Lock else Icons.Filled.LockOpen,
                                            contentDescription = "Lock State",
                                            tint = if (com.example.model.GlobalState.archiveLockedState) Color(0xFFEF5350) else Color(0xFF4CAF50),
                                            modifier = Modifier.size(16.dp)
                                        )
                                    } else {
                                        Icon(Icons.Default.KeyboardArrowRight, contentDescription = null, tint = Color(0xFF90A4AE))
                                    }
                                }
                                Spacer(modifier = Modifier.height(12.dp))
                            }
                        }

                        if (filteredPinnedChats.isNotEmpty()) {
                            item {
                                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(bottom = 8.dp)) {
                                    Text("Pinned", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color(0xFF263238))
                                    Spacer(modifier = Modifier.weight(1f))
                                    Icon(Icons.Filled.PushPin, contentDescription = null, tint = Color(0xFF0091EA), modifier = Modifier.size(16.dp))
                                }
                            }
                            items(filteredPinnedChats) { chat ->
                                ChatListItemWrapper(
                                    chat = chat,
                                    isSelected = selectedChatIds.contains(chat.id),
                                    isSelectionMode = isSelectionMode,
                                    onToggleSelect = { id ->
                                        if (selectedChatIds.contains(id)) {
                                            selectedChatIds.remove(id)
                                        } else {
                                            selectedChatIds.add(id)
                                        }
                                        isSelectionMode = selectedChatIds.isNotEmpty()
                                    },
                                    onClick = {
                                        if (isSelectionMode) {
                                            if (selectedChatIds.contains(chat.id)) {
                                                selectedChatIds.remove(chat.id)
                                            } else {
                                                selectedChatIds.add(chat.id)
                                            }
                                            isSelectionMode = selectedChatIds.isNotEmpty()
                                        } else {
                                            onChatClick(chat.id)
                                        }
                                    },
                                    onFriendProfileClick = onFriendProfileClick
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                            }
                        }
                        
                        if (filteredRecentChats.isNotEmpty()) {
                            item {
                                Spacer(modifier = Modifier.height(16.dp))
                                Text("Recent", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color(0xFF263238), modifier = Modifier.padding(bottom = 8.dp))
                            }
                            items(filteredRecentChats) { chat ->
                                ChatListItemWrapper(
                                    chat = chat,
                                    isSelected = selectedChatIds.contains(chat.id),
                                    isSelectionMode = isSelectionMode,
                                    onToggleSelect = { id ->
                                        if (selectedChatIds.contains(id)) {
                                            selectedChatIds.remove(id)
                                        } else {
                                            selectedChatIds.add(id)
                                        }
                                        isSelectionMode = selectedChatIds.isNotEmpty()
                                    },
                                    onClick = {
                                        if (isSelectionMode) {
                                            if (selectedChatIds.contains(chat.id)) {
                                                selectedChatIds.remove(chat.id)
                                            } else {
                                                selectedChatIds.add(chat.id)
                                            }
                                            isSelectionMode = selectedChatIds.isNotEmpty()
                                        } else {
                                            onChatClick(chat.id)
                                        }
                                    },
                                    onFriendProfileClick = onFriendProfileClick
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                            }
                        }

                        if (filteredPinnedChats.isEmpty() && filteredRecentChats.isEmpty()) {
                            item {
                                Box(modifier = Modifier.fillMaxWidth().padding(top = 40.dp), contentAlignment = Alignment.Center) {
                                    Text("No chats found", color = Color(0xFF90A4AE))
                                }
                            }
                        }
                    }
                }
                }
            }
        }

        // FAB
        Box(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(end = 24.dp, bottom = 112.dp) // Offset for elevated bottom nav
                .size(56.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(Brush.linearGradient(listOf(Color(0xFF0091EA), Color(0xFF637BFE))))
                .clickable { onNewChatClick() },
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Filled.Edit, contentDescription = "New", tint = Color.White)
        }

        if (showCreateFolderDialog) {
            androidx.compose.ui.window.Dialog(onDismissRequest = { showCreateFolderDialog = false }) {
                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    modifier = Modifier.padding(16.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp)
                    ) {
                        Text(
                            text = "Create Custom Folder",
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 20.sp,
                            color = Color(0xFF263238)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Group chats beautifully to organize your Aqualyn dashboard tab streams.",
                            color = Color(0xFF78909C),
                            fontSize = 12.sp
                        )
                        Spacer(modifier = Modifier.height(16.dp))

                        OutlinedTextField(
                            value = folderNameToCreate,
                            onValueChange = { folderNameToCreate = it },
                            label = { Text("Folder Name") },
                            placeholder = { Text("e.g. Project-Alpha, Family") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        )
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("Select Chats to Include", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF546E7A))
                        Spacer(modifier = Modifier.height(8.dp))

                        Box(modifier = Modifier.heightIn(max = 200.dp).fillMaxWidth()) {
                            androidx.compose.foundation.lazy.LazyColumn {
                                items(com.example.model.GlobalState.chats) { chat ->
                                    val isSelectedObj = chatsToIncludeInFolder.contains(chat.id)
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickable {
                                                if (isSelectedObj) {
                                                    chatsToIncludeInFolder.remove(chat.id)
                                                } else {
                                                    chatsToIncludeInFolder.add(chat.id)
                                                }
                                            }
                                            .padding(vertical = 6.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Checkbox(
                                            checked = isSelectedObj,
                                            onCheckedChange = { checked ->
                                                if (checked == true) {
                                                    chatsToIncludeInFolder.add(chat.id)
                                                } else {
                                                    chatsToIncludeInFolder.remove(chat.id)
                                                }
                                            }
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(
                                            text = chat.groupName ?: chat.user?.name ?: "Chat #${chat.id}",
                                            fontSize = 14.sp,
                                            maxLines = 1,
                                            overflow = TextOverflow.Ellipsis,
                                            color = Color(0xFF37474F)
                                        )
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(24.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.End
                        ) {
                            TextButton(onClick = { showCreateFolderDialog = false }) {
                                Text("Cancel", color = Color.Gray)
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Button(
                                onClick = {
                                    if (folderNameToCreate.isNotBlank()) {
                                        coroutineScope.launch {
                                            val created = com.example.network.AqualynRepository.createChatFolder(
                                                folderNameToCreate,
                                                chatsToIncludeInFolder.toList()
                                            )
                                            if (created != null) {
                                                com.example.model.GlobalState.folders.add(created.name)
                                                created.chatIds.forEach { cid ->
                                                    com.example.model.GlobalState.folderChatMap[cid] = created.name
                                                }
                                                com.example.model.GlobalState.showToast("Folder '${created.name}' created successfully!", isGreen = true)
                                            } else {
                                                // Fallback
                                                com.example.model.GlobalState.folders.add(folderNameToCreate)
                                                chatsToIncludeInFolder.forEach { cid ->
                                                    com.example.model.GlobalState.folderChatMap[cid] = folderNameToCreate
                                                }
                                                com.example.model.GlobalState.showToast("Folder created successfully!", isGreen = true)
                                            }
                                            showCreateFolderDialog = false
                                        }
                                    } else {
                                        com.example.model.GlobalState.showToast("Please enter a folder name", isGreen = false)
                                    }
                                },
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("Create Folder")
                            }
                        }
                    }
                }
            }
        }

        if (showArchivePinUnlockDialog) {
            androidx.compose.ui.window.Dialog(onDismissRequest = { showArchivePinUnlockDialog = false }) {
                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    modifier = Modifier.padding(16.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("Unlock Archives", fontWeight = FontWeight.ExtraBold, fontSize = 20.sp, color = Color(0xFF263238))
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Enter your 4-digit security lock PIN:", color = Color(0xFF78909C), fontSize = 13.sp, textAlign = TextAlign.Center)
                        Spacer(modifier = Modifier.height(16.dp))

                        OutlinedTextField(
                            value = archivePinAttemptInput,
                            onValueChange = { if (it.length <= 4) archivePinAttemptInput = it },
                            placeholder = { Text("PIN Code") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(0.8f),
                            shape = RoundedCornerShape(12.dp),
                            keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                                keyboardType = androidx.compose.ui.text.input.KeyboardType.Number
                            )
                        )
                        Spacer(modifier = Modifier.height(24.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceEvenly
                        ) {
                            TextButton(onClick = { showArchivePinUnlockDialog = false; archivePinAttemptInput = "" }) {
                                Text("Cancel", color = Color(0xFF546E7A))
                            }
                            Button(
                                onClick = {
                                    if (archivePinAttemptInput == com.example.model.GlobalState.archivePinCode) {
                                        com.example.model.GlobalState.archiveLockedState = false
                                        isViewingArchivedChats = true
                                        showArchivePinUnlockDialog = false
                                        archivePinAttemptInput = ""
                                        com.example.model.GlobalState.showToast("Archive unlocked successfully!", isGreen = true)
                                    } else {
                                        com.example.model.GlobalState.showToast("Incorrect PIN. ACCESS DENIED!", isGreen = false)
                                        archivePinAttemptInput = ""
                                    }
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0091EA)),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("Verify PIN", color = Color.White)
                            }
                        }
                    }
                }
            }
        }
    }
}

