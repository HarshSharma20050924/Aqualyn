package com.example.ui.screens.chat

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
import kotlinx.coroutines.launch

@Composable
fun TabChip(text: String, isSelected: Boolean, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .height(32.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(if (isSelected) Color(0xFF0091EA) else Color.White.copy(alpha = 0.5f))
            .border(
                1.dp,
                if (isSelected) Color.Transparent else Color(0xFFCFD8DC),
                RoundedCornerShape(16.dp)
            )
            .clickable { onClick() }
            .padding(horizontal = 16.dp),
        contentAlignment = Alignment.Center
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = text,
                color = if (isSelected) Color.White else Color(0xFF546E7A),
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                fontSize = 13.sp
            )
            if (text == "Unread") {
                val unreadCount = com.example.model.GlobalState.chats.count { it.unreadCount > 0 }
                if (unreadCount > 0) {
                    Spacer(modifier = Modifier.width(6.dp))
                    Box(
                        modifier = Modifier.size(16.dp).clip(CircleShape).background(if (isSelected) Color.White else Color(0xFF0091EA)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(unreadCount.toString(), color = if (isSelected) Color(0xFF0091EA) else Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun ChatListItemWrapper(
    chat: com.example.model.ChatItem,
    isSelected: Boolean,
    isSelectionMode: Boolean,
    onToggleSelect: (String) -> Unit,
    onClick: () -> Unit,
    onFriendProfileClick: (String) -> Unit
) {
    var showOptions by remember { mutableStateOf(false) }
    var showFolderSelectorDialog by remember { mutableStateOf(false) }
    val context = androidx.compose.ui.platform.LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    Box {
        ChatListItem(
            chat = chat,
            isSelected = isSelected,
            isSelectionMode = isSelectionMode,
            onClick = onClick,
            onLongClick = { showOptions = true },
            onFriendProfileClick = onFriendProfileClick
        )

        if (showFolderSelectorDialog) {
            androidx.compose.ui.window.Dialog(onDismissRequest = { showFolderSelectorDialog = false }) {
                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    modifier = Modifier.fillMaxWidth().padding(16.dp)
                ) {
                    var newFolderNameInput by remember { mutableStateOf("") }
                    var isCreatingNewFolder by remember { mutableStateOf(false) }

                    Column(modifier = Modifier.padding(20.dp)) {
                        Row(
                            Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Organize into Folder", fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Color(0xFF263238))
                            IconButton(onClick = { showFolderSelectorDialog = false }) {
                                Icon(Icons.Default.Close, contentDescription = "Close")
                            }
                        }
                        
                        Divider(modifier = Modifier.padding(vertical = 12.dp))

                        val currentAssignedFolder = com.example.model.GlobalState.folderChatMap[chat.id]
                        if (currentAssignedFolder != null) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(bottom = 12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Currently in: $currentAssignedFolder", fontSize = 14.sp, fontWeight = FontWeight.Medium, color = Color(0xFF0091EA))
                                TextButton(onClick = {
                                    val currentFolder = currentAssignedFolder
                                    coroutineScope.launch {
                                        val otherChatIds = com.example.model.GlobalState.folderChatMap.filter { it.value == currentFolder && it.key != chat.id }.keys.toList()
                                        com.example.network.AqualynRepository.updateChatFolder(currentFolder, currentFolder, otherChatIds)
                                        com.example.model.GlobalState.folderChatMap.remove(chat.id)
                                        showFolderSelectorDialog = false
                                        com.example.model.GlobalState.showToast("Removed from folder", isGreen = false)
                                    }
                                }) {
                                    Text("Remove", color = Color.Red, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }

                        // Create new folders + icon
                        Row(
                            Modifier
                                .fillMaxWidth()
                                .clickable { isCreatingNewFolder = !isCreatingNewFolder }
                                .padding(vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.AddCircle, contentDescription = null, tint = Color(0xFF0091EA))
                            Spacer(modifier = Modifier.width(12.dp))
                            Text("Create New Folder", color = Color(0xFF0091EA), fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }

                        if (isCreatingNewFolder) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                OutlinedTextField(
                                    value = newFolderNameInput,
                                    onValueChange = { newFolderNameInput = it },
                                    placeholder = { Text("Folder Name...") },
                                    modifier = Modifier.weight(1f),
                                    singleLine = true,
                                    shape = RoundedCornerShape(12.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                IconButton(
                                    onClick = {
                                        if (newFolderNameInput.isNotBlank()) {
                                            val name = newFolderNameInput.trim()
                                            if (!com.example.model.GlobalState.folders.contains(name)) {
                                                coroutineScope.launch {
                                                    com.example.network.AqualynRepository.createChatFolder(name, listOf(chat.id))
                                                    com.example.model.GlobalState.folders.add(name)
                                                    com.example.model.GlobalState.folderChatMap[chat.id] = name
                                                    newFolderNameInput = ""
                                                    isCreatingNewFolder = false
                                                    showFolderSelectorDialog = false
                                                    com.example.model.GlobalState.showToast("Folder '$name' created and chat added!", isGreen = true)
                                                }
                                            } else {
                                                com.example.model.GlobalState.showToast("Folder already exists!", isGreen = false)
                                            }
                                        }
                                    }
                                ) {
                                    Icon(Icons.Default.Check, contentDescription = "Add", tint = Color(0xFF00C853))
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Add to Folder List:", color = Color(0xFF546E7A), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(8.dp))

                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            com.example.model.GlobalState.folders.forEach { folder ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(if (currentAssignedFolder == folder) Color(0xFFE0F7FA) else Color(0xFFF4F7F9))
                                        .clickable {
                                            coroutineScope.launch {
                                                val existingChatIds = com.example.model.GlobalState.folderChatMap.filter { it.value == folder }.keys.toMutableList()
                                                if (!existingChatIds.contains(chat.id)) {
                                                    existingChatIds.add(chat.id)
                                                }
                                                com.example.network.AqualynRepository.updateChatFolder(folder, folder, existingChatIds)
                                                com.example.model.GlobalState.folderChatMap[chat.id] = folder
                                                showFolderSelectorDialog = false
                                                com.example.model.GlobalState.showToast("Added chat to folder: $folder", isGreen = true)
                                            }
                                        }
                                        .padding(14.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(Icons.Filled.Folder, contentDescription = null, tint = if (currentAssignedFolder == folder) Color(0xFF0091EA) else Color(0xFF90A4AE))
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Text(folder, fontWeight = FontWeight.Bold, color = if (currentAssignedFolder == folder) Color(0xFF006064) else Color(0xFF37474F))
                                }
                            }
                        }
                    }
                }
            }
        }
        if (showOptions) {
            Popup(
                alignment = Alignment.CenterEnd,
                onDismissRequest = { showOptions = false },
                offset = IntOffset(-40, 20)
            ) {
                Column(
                    modifier = Modifier
                        .width(220.dp)
                        .clip(RoundedCornerShape(24.dp))
                        .background(Color.White.copy(alpha = 0.95f))
                        .border(1.dp, Color(0xFFECEFF1), RoundedCornerShape(24.dp))
                        .padding(vertical = 12.dp)
                ) {
                    ChatMenuItem(Icons.Outlined.CheckCircle, "Select") {
                        onToggleSelect(chat.id)
                        showOptions = false
                    }
                    val isArchived = com.example.model.GlobalState.archivedChats[chat.id] == true
                    ChatMenuItem(Icons.Outlined.Archive, if (isArchived) "Unarchive" else "Archive") {
                        com.example.model.GlobalState.archivedChats[chat.id] = !isArchived
                        showOptions = false
                        android.widget.Toast.makeText(context, if (isArchived) "Chat unarchived" else "Chat archived", android.widget.Toast.LENGTH_SHORT).show()
                    }
                    ChatMenuItem(Icons.Outlined.PushPin, if (chat.isPinned) "Unpin" else "Pin") {
                        val index = com.example.model.GlobalState.chats.indexOfFirst { it.id == chat.id }
                        if (index != -1) {
                            com.example.model.GlobalState.chats[index] = com.example.model.GlobalState.chats[index].copy(isPinned = !chat.isPinned)
                        }
                        showOptions = false
                        android.widget.Toast.makeText(context, if (chat.isPinned) "Chat unpinned" else "Chat pinned", android.widget.Toast.LENGTH_SHORT).show()
                    }
                    val isMuted = com.example.model.GlobalState.mutedChats[chat.id] == true
                    ChatMenuItem(Icons.Outlined.VolumeOff, if (isMuted) "Unmute" else "Mute") {
                        com.example.model.GlobalState.mutedChats[chat.id] = !isMuted
                        showOptions = false
                        android.widget.Toast.makeText(context, if (isMuted) "Chat unmuted" else "Chat muted", android.widget.Toast.LENGTH_SHORT).show()
                    }
                    val hasUnread = chat.unreadCount > 0
                    ChatMenuItem(Icons.Outlined.MarkChatUnread, if (hasUnread) "Mark as read" else "Mark as unread") {
                        val index = com.example.model.GlobalState.chats.indexOfFirst { it.id == chat.id }
                        if (index != -1) {
                            com.example.model.GlobalState.chats[index] = com.example.model.GlobalState.chats[index].copy(unreadCount = if (hasUnread) 0 else 1)
                        }
                        showOptions = false
                        android.widget.Toast.makeText(context, if (hasUnread) "Marked as read" else "Marked as unread", android.widget.Toast.LENGTH_SHORT).show()
                    }
                    val currentFolder = com.example.model.GlobalState.folderChatMap[chat.id]
                    ChatMenuItem(Icons.Outlined.CreateNewFolder, "Organize Folder") {
                        showOptions = false
                        showFolderSelectorDialog = true
                    }
                    ChatMenuItem(Icons.Outlined.ClearAll, "Clear history") {
                        val index = com.example.model.GlobalState.chats.indexOfFirst { it.id == chat.id }
                        if (index != -1) {
                            com.example.model.GlobalState.chats[index] = com.example.model.GlobalState.chats[index].copy(lastMessage = "", unreadCount = 0)
                        }
                        showOptions = false
                        android.widget.Toast.makeText(context, "History cleared", android.widget.Toast.LENGTH_SHORT).show()
                    }
                    ChatMenuItem(Icons.Outlined.Delete, "Delete chat", Color(0xFFE53935)) {
                        com.example.model.GlobalState.chats.removeAll { it.id == chat.id }
                        showOptions = false
                        android.widget.Toast.makeText(context, "Chat deleted", android.widget.Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }
    }
}

@Composable
fun ChatMenuItem(icon: androidx.compose.ui.graphics.vector.ImageVector, text: String, color: Color = Color(0xFF263238), onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(horizontal = 24.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(20.dp))
        Spacer(modifier = Modifier.width(16.dp))
        Text(text, fontSize = 16.sp, color = color)
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun ChatListItem(
    chat: com.example.model.ChatItem,
    isSelected: Boolean,
    isSelectionMode: Boolean,
    onClick: () -> Unit,
    onLongClick: () -> Unit,
    onFriendProfileClick: (String) -> Unit
) {
    val isMuted = com.example.model.GlobalState.mutedChats[chat.id] == true
    val containerColor = if (isSelected) Color(0xFF0091EA).copy(alpha = 0.08f) else Color.White

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(containerColor)
            .combinedClickable(onClick = onClick, onLongClick = onLongClick)
            .padding(16.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            if (isSelectionMode) {
                Checkbox(
                    checked = isSelected,
                    onCheckedChange = { onClick() },
                    colors = CheckboxDefaults.colors(checkedColor = Color(0xFF0091EA)),
                    modifier = Modifier.padding(end = 12.dp)
                )
            }

            if (chat.isGroup) {
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(Color(0xFFE1F5FE))
                        .clickable { onFriendProfileClick(chat.id) },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Filled.Groups, contentDescription = null, tint = Color(0xFF0091EA))
                }
            } else {
                Box(
                    modifier = Modifier.clickable { onFriendProfileClick(chat.id) }
                ) {
                    val avatarUrl = chat.user?.avatarUrl
                    if (!avatarUrl.isNullOrBlank()) {
                        coil.compose.AsyncImage(
                            model = avatarUrl,
                            contentDescription = null,
                            contentScale = androidx.compose.ui.layout.ContentScale.Crop,
                            modifier = Modifier
                                .size(56.dp)
                                .clip(CircleShape)
                        )
                    } else {
                        Box(
                            modifier = Modifier
                                .size(56.dp)
                                .clip(CircleShape)
                                .background(Color(0xFFB3E5FC)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(chat.groupName?.take(2)?.uppercase() ?: chat.user?.name?.take(2)?.uppercase() ?: "U", color = Color(0xFF0091EA), fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        }
                    }
                    if (!chat.isVoiceMessage) { // pseudo logic for indicator
                        Box(
                            modifier = Modifier
                                .align(Alignment.BottomEnd)
                                .offset(x = 2.dp, y = 2.dp)
                                .size(14.dp)
                                .clip(CircleShape)
                                .background(Color(0xFF00E676))
                                .border(2.dp, Color.White, CircleShape)
                        )
                    }
                }
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        if (chat.groupName == "Secret Project") {
                            Icon(Icons.Filled.Lock, contentDescription = null, tint = Color(0xFF4CAF50), modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                        }
                        Text(
                            text = chat.groupName ?: chat.user?.name ?: "",
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF263238),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            fontSize = 16.sp
                        )
                        if (isMuted) {
                            Spacer(modifier = Modifier.width(6.dp))
                            Icon(Icons.Outlined.VolumeOff, contentDescription = "Muted", tint = Color(0xFF90A4AE), modifier = Modifier.size(14.dp))
                        }
                    }
                    Text(
                        text = chat.timeInfo,
                        fontSize = 12.sp,
                        color = Color(0xFF78909C),
                        fontWeight = if (chat.unreadCount > 0) FontWeight.Bold else FontWeight.Normal
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (chat.isVoiceMessage) {
                        Icon(Icons.Filled.Mic, contentDescription = null, tint = Color(0xFF0091EA), modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                    }
                    Text(
                        text = if (chat.lastMessage.isEmpty()) "No messages" else chat.lastMessage,
                        fontSize = 14.sp,
                        color = if (chat.unreadCount > 0) Color(0xFF263238) else Color(0xFF78909C),
                        fontWeight = if (chat.unreadCount > 0) FontWeight.Bold else FontWeight.Normal,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f)
                    )
                    if (chat.unreadCount > 0) {
                        Spacer(modifier = Modifier.width(8.dp))
                        Box(
                            modifier = Modifier
                                .size(24.dp)
                                .clip(CircleShape)
                                .background(Brush.linearGradient(listOf(Color(0xFF0091EA), Color(0xFF637BFE)))),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(chat.unreadCount.toString(), color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                    } else if (chat.groupName == "Secret Project" || chat.isGroup) {
                        // show nothing or done status
                        Spacer(modifier = Modifier.width(8.dp))
                        Icon(Icons.Filled.DoneAll, contentDescription = null, tint = Color(0xFF0091EA), modifier = Modifier.size(16.dp))
                    }
                }
            }
        }
    }
}

@Composable
fun ChatCard(chat: ChatItem, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .background(Color.White.copy(alpha = 0.5f))
            .border(1.dp, MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.3f), RoundedCornerShape(24.dp))
            .clickable { onClick() }
            .padding(16.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            if (chat.isGroup) {
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Filled.Groups, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                }
            } else {
                Box {
                    AsyncImage(
                        model = chat.user?.avatarUrl,
                        contentDescription = null,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .size(56.dp)
                            .clip(RoundedCornerShape(16.dp))
                    )
                    if (chat.user?.isOnline == true) {
                        // Normally handle online indicator
                    }
                }
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Bottom
                ) {
                    Text(
                        text = chat.groupName ?: chat.user?.name ?: "",
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = chat.timeInfo,
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.secondary
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = chat.lastMessage,
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            if (chat.unreadCount > 0) {
                Spacer(modifier = Modifier.width(8.dp))
                Box(
                    modifier = Modifier
                        .size(24.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.linearGradient(
                                listOf(MaterialTheme.colorScheme.secondary, MaterialTheme.colorScheme.primaryContainer)
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(chat.unreadCount.toString(), color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
            } else if (chat.isGroup) {
                Spacer(modifier = Modifier.width(8.dp))
                Icon(Icons.Filled.DoneAll, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(16.dp))
            }
        }
    }
}

@Composable
fun ChatListRow(chat: ChatItem, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(vertical = 12.dp, horizontal = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (chat.user?.avatarUrl.isNullOrEmpty()) {
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.2f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Filled.PersonAdd, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            }
        } else {
            AsyncImage(
                model = chat.user?.avatarUrl,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .size(56.dp)
                    .clip(CircleShape)
            )
        }
        Spacer(modifier = Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom
            ) {
                Text(
                    text = chat.user?.name ?: "",
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = chat.timeInfo,
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = chat.lastMessage,
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
        if (chat.isVoiceMessage) {
            Spacer(modifier = Modifier.width(8.dp))
            Icon(Icons.Filled.Mic, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(16.dp))
        }
    }
}
