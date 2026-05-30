package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.model.ChatItem
import com.example.model.GlobalState
import com.example.model.User
import kotlinx.coroutines.launch

enum class NewChatState { SELECT_TYPE, SELECT_MEMBERS, CREATE_GROUP }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NewChatScreen(onBack: () -> Unit, onChatCreated: (String) -> Unit) {
    var state by remember { mutableStateOf(NewChatState.SELECT_TYPE) }
    var selectedMembers by remember { mutableStateOf(setOf<String>()) }
    var showAddContactDialog by remember { mutableStateOf(false) }

    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        if (GlobalState.contacts.isEmpty()) {
            val synced = com.example.network.AqualynRepository.syncContacts(GlobalState.phoneNumbersToSync)
            GlobalState.contacts.clear()
            GlobalState.contacts.addAll(synced.map { it.toDomain() })
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        when (state) {
            NewChatState.SELECT_TYPE -> {
                SelectTypeScreen(
                    onBack = onBack,
                    onNewGroup = { state = NewChatState.SELECT_MEMBERS },
                    onAddNewContactClick = { showAddContactDialog = true },
                    onChatCreated = onChatCreated
                )
            }
            NewChatState.SELECT_MEMBERS -> {
                SelectMembersScreen(
                    onBack = { state = NewChatState.SELECT_TYPE },
                    selectedMembers = selectedMembers,
                    onToggleMember = { id ->
                        val mutableSet = selectedMembers.toMutableSet()
                        if (mutableSet.contains(id)) mutableSet.remove(id)
                        else mutableSet.add(id)
                        selectedMembers = mutableSet
                    },
                    onNext = { state = NewChatState.CREATE_GROUP }
                )
            }
            NewChatState.CREATE_GROUP -> {
                CreateGroupScreen(
                    onBack = { state = NewChatState.SELECT_MEMBERS },
                    onCreate = { groupChatId ->
                        onChatCreated(groupChatId)
                    }
                )
            }
        }

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
                                            val synced = com.example.network.AqualynRepository.syncContacts(GlobalState.phoneNumbersToSync)
                                            GlobalState.contacts.clear()
                                            GlobalState.contacts.addAll(synced.map { it.toDomain() })
                                            GlobalState.showToast("Contact added successfully!", isGreen = true)
                                            showAddContactDialog = false
                                        }
                                    }
                                },
                                modifier = Modifier.weight(1.3f),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0097A7))
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SelectTypeScreen(
    onBack: () -> Unit,
    onNewGroup: () -> Unit,
    onAddNewContactClick: () -> Unit,
    onChatCreated: (String) -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF4F7F9))
    ) {
        // Top Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp)
                .padding(top = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("New Chat", fontWeight = FontWeight.Bold, fontSize = 20.sp, color = Color(0xFF263238))
            Icon(
                Icons.Default.Close,
                contentDescription = "Close",
                tint = Color(0xFF546E7A),
                modifier = Modifier.clickable { onBack() }
            )
        }

        val filteredContacts = GlobalState.contacts.filter {
            it.name.contains(searchQuery, ignoreCase = true) || it.handle.contains(searchQuery, ignoreCase = true)
        }

        LazyColumn(modifier = Modifier.fillMaxSize()) {
            item {
                // Search bar
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = { Text("Search contacts...", color = Color(0xFFB0BEC5), fontSize = 15.sp) },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(24.dp),
                        leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null, tint = Color(0xFF90A4AE)) },
                        colors = OutlinedTextFieldDefaults.colors(
                            unfocusedBorderColor = Color.Transparent,
                            focusedBorderColor = Color.Transparent,
                            unfocusedContainerColor = Color(0xFFECEFF1).copy(alpha = 0.5f),
                            focusedContainerColor = Color(0xFFECEFF1).copy(alpha = 0.5f)
                        )
                    )
                }
            }

            item {
                Spacer(modifier = Modifier.height(16.dp))
                ActionListItem(icon = Icons.Filled.Group, title = "New Group", onClick = onNewGroup)
                ActionListItem(icon = Icons.Outlined.PersonAdd, title = "New Contact", onClick = onAddNewContactClick)
                Spacer(modifier = Modifier.height(24.dp))
            }

            item {
                Text(
                    "CONTACTS ON AQUALYN",
                    fontWeight = FontWeight.Bold,
                    fontSize = 11.sp,
                    color = Color(0xFF78909C),
                    letterSpacing = 1.sp,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                )
            }

            if (filteredContacts.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(32.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            "No contacts synced. Sync now or add a contact above!",
                            textAlign = TextAlign.Center,
                            color = Color(0xFF78909C),
                            fontSize = 14.sp
                        )
                    }
                }
            } else {
                items(filteredContacts) { contact ->
                    val coroutineScope = rememberCoroutineScope()
                    ContactListItem(
                        name = contact.name,
                        subtitle = if (contact.isOnline) "Online" else "Offline",
                        avatarText = contact.name.take(1).uppercase(),
                        onClick = {
                            coroutineScope.launch {
                                val newChat = com.example.network.AqualynRepository.createChat(
                                    isGroup = false, 
                                    name = "", 
                                    memberIds = listOf(contact.id)
                                )
                                if (newChat != null) {
                                    onChatCreated(newChat.id)
                                } else {
                                    GlobalState.showToast("Failed to start conversation")
                                }
                            }
                        }
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SelectMembersScreen(
    onBack: () -> Unit,
    selectedMembers: Set<String>,
    onToggleMember: (String) -> Unit,
    onNext: () -> Unit
) {
    var searchQuery by remember { mutableStateOf("") }

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
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back",
                    tint = Color(0xFF546E7A),
                    modifier = Modifier.clickable { onBack() }
                )
                Spacer(modifier = Modifier.width(16.dp))
                Column {
                    Text("New Group", fontWeight = FontWeight.Bold, fontSize = 20.sp, color = Color(0xFF263238))
                    Text("Add members", fontSize = 12.sp, color = Color(0xFF78909C))
                }
            }

            // Selected Members Horizontal List (if any)
            if (selectedMembers.isNotEmpty()) {
                LazyRow(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    items(selectedMembers.toList()) { id ->
                        val plainId = id.removePrefix("user_")
                        val contact = GlobalState.contacts.find { it.id == plainId } ?: User(plainId, "User", "", "", "", "", false, 0, 0)
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Box {
                                Box(
                                    modifier = Modifier
                                        .size(56.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFFC0CA33)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        contact.name.take(1).uppercase(),
                                        color = Color.White,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 20.sp
                                    )
                                }
                                Box(
                                    modifier = Modifier
                                        .align(Alignment.TopEnd)
                                        .offset(x = 4.dp, y = (-4).dp)
                                        .size(16.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFFCFD8DC))
                                        .border(1.dp, Color.White, CircleShape)
                                        .clickable { onToggleMember(id) },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.Close, contentDescription = null, tint = Color.White, modifier = Modifier.size(10.dp))
                                }
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(contact.name.take(6), fontSize = 12.sp, color = Color(0xFF546E7A))
                        }
                    }
                }
                HorizontalDivider(color = Color(0xFFE0E0E0), thickness = 1.dp)
            }

            val filteredContacts = GlobalState.contacts.filter {
                it.name.contains(searchQuery, ignoreCase = true) || it.handle.contains(searchQuery, ignoreCase = true)
            }

            LazyColumn(modifier = Modifier.fillMaxSize()) {
                item {
                    // Search bar
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 16.dp)
                    ) {
                        OutlinedTextField(
                            value = searchQuery,
                            onValueChange = { searchQuery = it },
                            placeholder = { Text("Search contacts...", color = Color(0xFFB0BEC5), fontSize = 15.sp) },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(24.dp),
                            leadingIcon = { Icon(Icons.Filled.Search, contentDescription = null, tint = Color(0xFF90A4AE)) },
                            colors = OutlinedTextFieldDefaults.colors(
                                unfocusedBorderColor = Color.Transparent,
                                focusedBorderColor = Color.Transparent,
                                unfocusedContainerColor = Color(0xFFECEFF1).copy(alpha = 0.5f),
                                focusedContainerColor = Color(0xFFECEFF1).copy(alpha = 0.5f)
                            )
                        )
                    }
                }

                item {
                    Text(
                        "CONTACTS ON AQUALYN",
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        color = Color(0xFF78909C),
                        letterSpacing = 1.sp,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                    )
                }

                if (filteredContacts.isEmpty()) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(32.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                "No contacts synced.",
                                color = Color(0xFF78909C),
                                fontSize = 14.sp
                            )
                        }
                    }
                } else {
                    items(filteredContacts) { contact ->
                        val id = "user_${contact.id}"
                        val isSelected = selectedMembers.contains(id)
                        ContactListItem(
                            name = contact.name,
                            subtitle = "@${contact.handle}",
                            avatarText = contact.name.take(1).uppercase(),
                            isSelected = isSelected,
                            onClick = { onToggleMember(id) }
                        )
                    }
                }
            }
        }

        if (selectedMembers.isNotEmpty()) {
            Box(
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(24.dp)
                    .size(56.dp)
                    .clip(CircleShape)
                    .background(Color(0xFF0097A7))
                    .clickable { onNext() },
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = "Next", tint = Color.White)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateGroupScreen(onBack: () -> Unit, onCreate: (String) -> Unit) {
    var groupName by remember { mutableStateOf("") }
    var groupDesc by remember { mutableStateOf("") }
    var disappearing by remember { mutableStateOf(false) }
    var adminOnly by remember { mutableStateOf(false) }

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
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Back",
                    tint = Color(0xFF546E7A),
                    modifier = Modifier.clickable { onBack() }
                )
                Spacer(modifier = Modifier.width(16.dp))
                Column {
                    Text("New Group", fontWeight = FontWeight.Bold, fontSize = 20.sp, color = Color(0xFF263238))
                    Text("Add subject", fontSize = 12.sp, color = Color(0xFF78909C))
                }
            }

            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(64.dp)
                            .clip(CircleShape)
                            .background(Color(0xFFB2EBF2)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Outlined.CameraAlt, contentDescription = null, tint = Color(0xFF0097A7), modifier = Modifier.size(28.dp))
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                    TextField(
                        value = groupName,
                        onValueChange = { groupName = it },
                        placeholder = { Text("Group Name", color = Color(0xFF90A4AE)) },
                        colors = TextFieldDefaults.colors(
                            unfocusedContainerColor = Color.Transparent,
                            focusedContainerColor = Color.Transparent,
                            unfocusedIndicatorColor = Color(0xFF4DD0E1),
                            focusedIndicatorColor = Color(0xFF0097A7)
                        ),
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))
                TextField(
                    value = groupDesc,
                    onValueChange = { groupDesc = it },
                    placeholder = { Text("Group Description (optional)", color = Color(0xFF90A4AE), fontSize = 14.sp) },
                    colors = TextFieldDefaults.colors(
                        unfocusedContainerColor = Color.Transparent,
                        focusedContainerColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent,
                        focusedIndicatorColor = Color.Transparent
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(24.dp))
                Text("SETTINGS", fontWeight = FontWeight.Bold, color = Color(0xFF0097A7), fontSize = 12.sp)
                Spacer(modifier = Modifier.height(8.dp))

                SettingToggleItem(
                    icon = Icons.Outlined.AccessTime,
                    title = "Disappearing Messages",
                    subtitle = if (disappearing) "On" else "Off",
                    checked = disappearing,
                    onCheckedChange = { disappearing = it }
                )
                SettingToggleItem(
                    icon = Icons.Outlined.Shield,
                    title = "Only Admins can send messages",
                    checked = adminOnly,
                    onCheckedChange = { adminOnly = it }
                )

                Spacer(modifier = Modifier.height(32.dp))
                Text("MEMBERS", fontWeight = FontWeight.Bold, color = Color(0xFF0097A7), fontSize = 12.sp)
                Spacer(modifier = Modifier.height(16.dp))

                ContactListItem(name = "You", subtitle = "Group Admin", avatarText = "ME", avatarColor = Color(0xFF512DA8), subtitleColor = Color(0xFF0097A7))
            }
        }

        if (groupName.isNotBlank()) {
            val coroutineScope = rememberCoroutineScope()
            var isCreatingGroup by remember { mutableStateOf(false) }
            
            Box(
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(24.dp)
                    .size(56.dp)
                    .clip(CircleShape)
                    .background(if (isCreatingGroup) Color(0xFFB0BEC5) else Color(0xFF0097A7))
                    .clickable {
                        if (isCreatingGroup) return@clickable
                        isCreatingGroup = true
                        coroutineScope.launch {
                            val newChat = com.example.network.AqualynRepository.createChat(
                                isGroup = true,
                                name = groupName,
                                memberIds = listOf()
                            )
                            isCreatingGroup = false
                            if (newChat != null) {
                                onCreate(newChat.id)
                            } else {
                                GlobalState.showToast("Failed to create group")
                            }
                        }
                    },
                contentAlignment = Alignment.Center
            ) {
                if (isCreatingGroup) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp), color = Color.White, strokeWidth = 2.dp)
                } else {
                    Icon(Icons.Default.Check, contentDescription = "Create", tint = Color.White)
                }
            }
        }
    }
}

@Composable
fun ActionListItem(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(CircleShape)
                .background(Color(0xFF0097A7)),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, contentDescription = null, tint = Color.White)
        }
        Spacer(modifier = Modifier.width(16.dp))
        Text(title, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color(0xFF263238))
    }
}

@Composable
fun ContactListItem(
    name: String,
    subtitle: String,
    avatarText: String,
    avatarColor: Color = Color(0xFFC0CA33),
    subtitleColor: Color = Color(0xFF78909C),
    isSelected: Boolean = false,
    onClick: (() -> Unit)? = null
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .then(if (onClick != null) Modifier.clickable { onClick() } else Modifier)
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(contentAlignment = Alignment.BottomEnd) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(avatarColor),
                contentAlignment = Alignment.Center
            ) {
                Text(avatarText, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            }
            if (isSelected) {
                Box(
                    modifier = Modifier
                        .size(18.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF0097A7))
                        .border(1.dp, Color.White, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.Check, contentDescription = null, tint = Color.White, modifier = Modifier.size(12.dp))
                }
            }
        }
        Spacer(modifier = Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(name, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Color(0xFF263238))
            Text(subtitle, fontSize = 14.sp, color = subtitleColor)
        }
    }
}

@Composable
fun SettingToggleItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String? = null,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onCheckedChange(!checked) }
            .padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, contentDescription = null, tint = Color(0xFF546E7A), modifier = Modifier.size(20.dp))
        Spacer(modifier = Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(title, fontWeight = FontWeight.Medium, fontSize = 15.sp, color = Color(0xFF263238))
            if (subtitle != null) {
                Text(subtitle, fontSize = 12.sp, color = Color(0xFF78909C))
            }
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                uncheckedThumbColor = Color.White,
                uncheckedTrackColor = Color(0xFFCFD8DC),
                uncheckedBorderColor = Color.Transparent,
                checkedThumbColor = Color.White,
                checkedTrackColor = Color(0xFF0097A7)
            )
        )
    }
}
