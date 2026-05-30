package com.example.ui.screens.chat

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.*
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.window.Popup
import com.example.model.Message
import com.example.ui.screens.chat.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.result.PickVisualMediaRequest
import androidx.compose.ui.platform.LocalContext

@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun ChatDetailScreen(userId: String, onBack: () -> Unit, onProfileClick: (String) -> Unit) {
    val coroutineScope = rememberCoroutineScope()

    val chatFromState = remember(userId, com.example.model.GlobalState.chats.size) {
        com.example.model.GlobalState.chats.find { it.id == userId }
    }
    
    var dynamicUserDetail by remember { mutableStateOf<com.example.model.User?>(chatFromState?.user) }

    val cleanRecipientId = remember(userId, dynamicUserDetail) {
        dynamicUserDetail?.id ?: if (userId.startsWith("c_")) userId.substring(2) else userId
    }
    
    LaunchedEffect(userId) {
        if (chatFromState != null && chatFromState.user != null) {
            dynamicUserDetail = chatFromState.user
        } else {
            val matchesGroup = userId.startsWith("c1") || userId.startsWith("c2") || userId.startsWith("c5") || (chatFromState?.isGroup == true)
            if (!matchesGroup) {
                val profileDto = com.example.network.AqualynRepository.fetchUserProfile(cleanRecipientId)
                if (profileDto != null) {
                    dynamicUserDetail = profileDto.toDomain()
                }
            }
        }
    }

    val resolvedName = remember(userId, chatFromState, dynamicUserDetail) {
        if (chatFromState?.isGroup == true) {
            chatFromState.groupName ?: "Group Room"
        } else {
            dynamicUserDetail?.name ?: chatFromState?.user?.name ?: "User"
        }
    }

    val resolvedHandle = remember(userId, chatFromState, dynamicUserDetail) {
        if (chatFromState?.isGroup == true) {
            chatFromState.groupName?.lowercase()?.replace(" ", "_") ?: "group_room"
        } else {
            dynamicUserDetail?.handle ?: chatFromState?.user?.handle ?: "unknown_handle"
        }
    }

    val resolvedAvatarUrl = remember(dynamicUserDetail, chatFromState) {
        dynamicUserDetail?.avatarUrl ?: chatFromState?.user?.avatarUrl ?: ""
    }

    var activeChatId by remember(userId) { mutableStateOf(userId) }

    var messages by remember(activeChatId) {
        mutableStateOf(com.example.model.GlobalState.chatMessagesStorage[activeChatId] ?: emptyList<Message>())
    }
    
    var inputText by remember { mutableStateOf("") }
    val listState = rememberLazyListState()
    var showAttachmentPicker by remember { mutableStateOf(false) }
    
    var replyingToMsg by remember { mutableStateOf<Message?>(null) }
    var editingMsg by remember { mutableStateOf<Message?>(null) }
    var selectedActionMsg by remember { mutableStateOf<Message?>(null) }
    var showDeleteConfirmDialog by remember { mutableStateOf(false) }
    var showReactionsForMsg by remember { mutableStateOf<Message?>(null) }
    var isTyping by remember { mutableStateOf(false) }
    var showProfileDetails by remember { mutableStateOf(false) }

    // Calling and search features configurations
    var isSearchActive by remember { mutableStateOf(false) }
    var searchMessageQuery by remember { mutableStateOf("") }
    var showVoiceCallScreen by remember { mutableStateOf(false) }
    var showVideoCallScreen by remember { mutableStateOf(false) }
    var showMoreMenuOptions by remember { mutableStateOf(false) }
    var isExportingChatProgress by remember { mutableStateOf(false) }
    var exportPercent by remember { mutableStateOf(0) }

    LaunchedEffect(activeChatId) {
        val cached = com.example.model.GlobalState.chatMessagesStorage[activeChatId]
        if (!cached.isNullOrEmpty()) {
            messages = cached
        }
        
        try {
            if (activeChatId.startsWith("c_")) {
                val recipientId = activeChatId.substring(2)
                val chat = com.example.network.AqualynRepository.createChat(isGroup = false, name = "", memberIds = listOf(recipientId))
                if (chat != null) {
                    activeChatId = chat.id
                    com.example.network.AqualynRepository.fetchChats(silent = true)
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("ChatDetailScreen", "Error pre-creating backend chat: ${e.localizedMessage}")
        }
        
        try {
            val fetched = com.example.network.AqualynRepository.fetchMessages(activeChatId, silent = true)
            if (fetched.isNotEmpty()) {
                messages = fetched
                com.example.model.GlobalState.chatMessagesStorage[activeChatId] = fetched
            }
        } catch (e: Exception) {
            android.util.Log.e("ChatDetailScreen", "Error loading initial messages: ${e.localizedMessage}")
        }

        while (true) {
            delay(2000)
            try {
                val fetched = com.example.network.AqualynRepository.fetchMessages(activeChatId, silent = true)
                if (fetched.isNotEmpty() && fetched != messages) {
                    messages = fetched
                    com.example.model.GlobalState.chatMessagesStorage[activeChatId] = fetched
                }
            } catch (e: Exception) {
                android.util.Log.e("ChatDetailScreen", "Error polling messages: ${e.localizedMessage}")
            }
        }
    }

    fun sendMessage(
        content: String = "",
        imageUrl: String? = null,
        videoUrl: String? = null,
        audioUrl: String? = null,
        documentName: String? = null,
        location: String? = null,
        paymentAmount: String? = null
    ) {
        val sdf = SimpleDateFormat("h:mm a", Locale.getDefault())
        val time = sdf.format(Date())
        
        if (editingMsg != null && content.isNotBlank()) {
            val edited = messages.map { if (it.id == editingMsg!!.id) it.copy(content = content, isEdited = true) else it }
            messages = edited
            com.example.model.GlobalState.chatMessagesStorage[activeChatId] = edited
            editingMsg = null
            return
        }

        val newMsg = Message(
            id = UUID.randomUUID().toString(),
            senderId = "me",
            content = content,
            timeInfo = time,
            isMine = true,
            imageUrl = imageUrl,
            videoUrl = videoUrl,
            audioUrl = audioUrl,
            documentName = documentName,
            location = location,
            paymentAmount = paymentAmount,
            replyToMsg = replyingToMsg
        )
        val currentReplyToId = replyingToMsg?.id
        val updatedMsgs = messages + newMsg
        messages = updatedMsgs
        com.example.model.GlobalState.chatMessagesStorage[activeChatId] = updatedMsgs
        replyingToMsg = null
        coroutineScope.launch {
            if (content.isNotBlank() || imageUrl != null || videoUrl != null || audioUrl != null || documentName != null) {
                // If it's pure media, send the media URL in the content for API since Backend accepts `content`. 
                // Actual production app should pass the dedicated fields to API if the backend supported it in REST, 
                // but our backend REST allows `content` and `replyToId` here.
                val textToSend = if (content.isNotBlank()) content else "[Media]"
                val sentMsg = com.example.network.AqualynRepository.sendMessage(activeChatId, textToSend, currentReplyToId)
                if (sentMsg != null) {
                    messages = messages.map { if (it.id == newMsg.id) sentMsg else it }
                    com.example.model.GlobalState.chatMessagesStorage[activeChatId] = messages
                }
            }
            if (messages.isNotEmpty()) {
                listState.animateScrollToItem(messages.size - 1)
            }
        }
    }

    val context = LocalContext.current

    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia(),
        onResult = { uri ->
            if (uri != null) {
                coroutineScope.launch {
                    try {
                        val inputStream = context.contentResolver.openInputStream(uri)
                        val bytes = inputStream?.readBytes()
                        inputStream?.close()
                        if (bytes != null) {
                            com.example.model.GlobalState.showToast("Uploading attachment...", isGreen = true)
                            val uploadedUrl = com.example.network.AqualynRepository.uploadFile(bytes, "image/jpeg", "chat_image.jpg")
                            if (uploadedUrl != null) {
                                sendMessage(content = "[Image] $uploadedUrl", imageUrl = uploadedUrl)
                            } else {
                                com.example.model.GlobalState.showToast("Attachment upload failed", isGreen = false)
                            }
                        }
                    } catch (e: Exception) {
                        android.util.Log.e("ChatDetailScreen", "Media Picker error: ${e.localizedMessage}")
                    }
                }
            }
        }
    )

    val documentLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument(),
        onResult = { uri ->
            if (uri != null) {
                coroutineScope.launch {
                    try {
                        val inputStream = context.contentResolver.openInputStream(uri)
                        val bytes = inputStream?.readBytes()
                        inputStream?.close()
                        if (bytes != null) {
                            com.example.model.GlobalState.showToast("Uploading document...", isGreen = true)
                            val uploadedUrl = com.example.network.AqualynRepository.uploadFile(bytes, "application/pdf", "document.pdf")
                            if (uploadedUrl != null) {
                                sendMessage(content = "[Document] $uploadedUrl", documentName = "document.pdf")
                            } else {
                                com.example.model.GlobalState.showToast("Document upload failed", isGreen = false)
                            }
                        }
                    } catch (e: Exception) {
                        android.util.Log.e("ChatDetailScreen", "Document Picker error: ${e.localizedMessage}")
                    }
                }
            }
        }
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    if (isSearchActive) {
                        OutlinedTextField(
                            value = searchMessageQuery,
                            onValueChange = { searchMessageQuery = it },
                            placeholder = { Text("Search messages...", color = Color(0xFF90A4AE)) },
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                unfocusedContainerColor = Color.Transparent,
                                focusedContainerColor = Color.Transparent,
                                unfocusedBorderColor = Color.Transparent,
                                focusedBorderColor = Color.Transparent
                            ),
                            modifier = Modifier.fillMaxWidth(),
                            trailingIcon = {
                                IconButton(onClick = { 
                                    isSearchActive = false
                                    searchMessageQuery = ""
                                }) {
                                    Icon(Icons.Default.Close, contentDescription = "Close search", tint = Color(0xFF546E7A))
                                }
                            }
                        )
                    } else {
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.clickable { onProfileClick(cleanRecipientId) }) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(CircleShape)
                            ) {
                                if (resolvedAvatarUrl.isNotBlank()) {
                                    coil.compose.AsyncImage(
                                        model = resolvedAvatarUrl,
                                        contentDescription = null,
                                        contentScale = androidx.compose.ui.layout.ContentScale.Crop,
                                        modifier = Modifier.fillMaxSize()
                                    )
                                } else {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxSize()
                                            .background(Color(0xFF0091EA)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(resolvedName.take(1).uppercase(), color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                                    }
                                }
                                Box(
                                    modifier = Modifier
                                        .align(Alignment.BottomEnd)
                                        .size(10.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFF00B0FF))
                                        .border(1.5.dp, Color.White, CircleShape)
                                )
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(resolvedName, fontWeight = FontWeight.Bold, fontSize = 18.sp, color = Color(0xFF263238))
                                Text("ONLINE NOW", color = Color(0xFF0091EA), fontSize = 10.sp, letterSpacing = 1.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = Color(0xFF546E7A))
                    }
                },
                actions = {
                    if (!isSearchActive) {
                        IconButton(onClick = { showVideoCallScreen = true }) { Icon(Icons.Outlined.Videocam, tint = Color(0xFF0091EA), contentDescription = "Video Call") }
                        IconButton(onClick = { showVoiceCallScreen = true }) { Icon(Icons.Outlined.Call, tint = Color(0xFF0091EA), contentDescription = "Audio Call") }
                        
                        Box {
                            IconButton(onClick = { showMoreMenuOptions = true }) { Icon(Icons.Default.MoreVert, tint = Color(0xFF0091EA), contentDescription = "More") }
                            DropdownMenu(
                                expanded = showMoreMenuOptions,
                                onDismissRequest = { showMoreMenuOptions = false }
                            ) {
                                DropdownMenuItem(
                                    text = { Text("Search Chat") },
                                    leadingIcon = { Icon(Icons.Outlined.Search, contentDescription = null, tint = Color(0xFF0091EA)) },
                                    onClick = {
                                        showMoreMenuOptions = false
                                        isSearchActive = true
                                    }
                                )
                                DropdownMenuItem(
                                    text = { Text("Clear Chat") },
                                    leadingIcon = { Icon(Icons.Outlined.ClearAll, contentDescription = null, tint = Color(0xFFEF5350)) },
                                    onClick = {
                                        showMoreMenuOptions = false
                                        messages = emptyList()
                                        com.example.model.GlobalState.showToast("Chat feed cleared!", isGreen = true)
                                    }
                                )
                                DropdownMenuItem(
                                    text = { Text("Export Chat as Zip") },
                                    leadingIcon = { Icon(Icons.Outlined.FolderZip, contentDescription = null, tint = Color(0xFF00C853)) },
                                    onClick = {
                                        showMoreMenuOptions = false
                                        isExportingChatProgress = true
                                        exportPercent = 0
                                    }
                                )
                            }
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White.copy(alpha = 0.9f))
            )
        },
        bottomBar = {
            Column {
                AnimatedVisibility(visible = replyingToMsg != null || editingMsg != null) {
                    val msg = replyingToMsg ?: editingMsg
                    val isEditing = editingMsg != null
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color.White)
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(modifier = Modifier.width(4.dp).height(30.dp).background(if (isEditing) Color(0xFF0091EA) else Color(0xFF0091EA), RoundedCornerShape(2.dp)))
                        Spacer(modifier = Modifier.width(8.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(if (isEditing) "Editing Message" else "Replying to ${if (msg?.isMine == true) "yourself" else resolvedName}", color = if (isEditing) Color(0xFF0091EA) else Color(0xFF0091EA), fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            Text(msg?.content.takeIf { !it.isNullOrBlank() } ?: "Attachment", color = Color(0xFF546E7A), fontSize = 13.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                        IconButton(onClick = { replyingToMsg = null; editingMsg = null; inputText = "" }) {
                            Icon(Icons.Default.Close, contentDescription = "Cancel", tint = Color(0xFF90A4AE))
                        }
                    }
                }
                ChatInputBar(
                    text = inputText,
                    onTextChange = { inputText = it },
                    onSend = {
                        if (inputText.isNotBlank()) {
                            sendMessage(content = inputText.trim())
                            inputText = ""
                        }
                    },
                    onAttachClick = { showAttachmentPicker = true },
                    onMicClick = {
                        sendMessage(audioUrl = "voice_note.mp3")
                    }
                )
            }
        },
        containerColor = Color.Transparent
    ) { padding ->
        Box(modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.linearGradient(
                    colors = listOf(Color(0xFFD6F5F6), Color(0xFFE9E5F8))
                )
            )
        ) {
            val filteredMessages = remember(messages, searchMessageQuery) {
                if (searchMessageQuery.isBlank()) messages else messages.filter { it.content.contains(searchMessageQuery, ignoreCase = true) }
            }

            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                state = listState,
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(filteredMessages) { msg ->
                    MessageBubbleView(
                        msg = msg,
                        onClick = { selectedActionMsg = msg },
                        onLongClick = { showReactionsForMsg = msg }
                    )
                }
                if (isTyping) {
                    item {
                        Row(
                            modifier = Modifier.padding(top = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("$resolvedName is typing...", fontSize = 12.sp, color = Color(0xFF0091EA), fontStyle = androidx.compose.ui.text.font.FontStyle.Italic, fontWeight = FontWeight.Medium)
                            Spacer(modifier = Modifier.width(4.dp))
                            val infiniteTransition = rememberInfiniteTransition()
                            val alpha by infiniteTransition.animateFloat(
                                initialValue = 0.2f, targetValue = 1f,
                                animationSpec = infiniteRepeatable(animation = tween(800, easing = LinearEasing), repeatMode = RepeatMode.Reverse)
                            )
                            Row {
                                Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(Color(0xFF0091EA).copy(alpha = alpha)))
                                Spacer(modifier = Modifier.width(3.dp))
                                Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(Color(0xFF0091EA).copy(alpha = (alpha + 0.3f).coerceAtMost(1f))))
                                Spacer(modifier = Modifier.width(3.dp))
                                Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(Color(0xFF0091EA).copy(alpha = (alpha + 0.6f).coerceAtMost(1f))))
                            }
                        }
                    }
                }
            }
        }
        
        if (selectedActionMsg != null && !showDeleteConfirmDialog) {
            val msg = selectedActionMsg!!
            val itemsList = remember(msg) {
                val base = mutableListOf(
                    com.example.ui.components.GlassyDropdownItem(Icons.Outlined.Reply, "Reply") {
                        replyingToMsg = msg
                        selectedActionMsg = null
                    },
                    com.example.ui.components.GlassyDropdownItem(Icons.Outlined.ContentCopy, "Copy") {
                        selectedActionMsg = null
                    },
                    com.example.ui.components.GlassyDropdownItem(Icons.Outlined.Forward, "Forward") {
                        selectedActionMsg = null
                    },
                    com.example.ui.components.GlassyDropdownItem(
                        if (msg.isPinned) Icons.Filled.PushPin else Icons.Outlined.PushPin,
                        if (msg.isPinned) "Unpin Message" else "Pin Message"
                    ) {
                        messages = messages.map { if (it.id == msg.id) it.copy(isPinned = !it.isPinned) else it }
                        selectedActionMsg = null
                    }
                )
                if (msg.isMine && msg.content.isNotBlank()) {
                    base.add(
                        com.example.ui.components.GlassyDropdownItem(Icons.Outlined.Edit, "Edit") {
                            editingMsg = msg
                            inputText = msg.content
                            selectedActionMsg = null
                        }
                    )
                }
                base.add(
                    com.example.ui.components.GlassyDropdownItem(Icons.Outlined.Delete, "Delete", Color(0xFFE53935)) {
                        showDeleteConfirmDialog = true
                    }
                )
                base
            }

            com.example.ui.components.GlassyIphoneDropdown(
                onDismissRequest = { selectedActionMsg = null },
                alignment = Alignment.Center,
                items = itemsList
            )
        }

        if (showDeleteConfirmDialog && selectedActionMsg != null) {
            AlertDialog(
                onDismissRequest = { showDeleteConfirmDialog = false; selectedActionMsg = null },
                title = { Text("Delete This Message?", fontWeight = FontWeight.Bold) },
                text = { Text("Delete this message from your device, or delete it from both sides so your friend Raj also cannot see it in our chat.") },
                containerColor = Color.White,
                confirmButton = {
                    Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(
                            onClick = {
                                coroutineScope.launch {
                                    val success = com.example.network.AqualynRepository.deleteMessage(activeChatId, selectedActionMsg!!.id)
                                    if (success) {
                                        messages = messages.filter { it.id != selectedActionMsg!!.id }
                                        com.example.model.GlobalState.chatMessagesStorage[activeChatId] = messages
                                        com.example.model.GlobalState.showToast("Message deleted", isGreen = true)
                                    } else {
                                        messages = messages.filter { it.id != selectedActionMsg!!.id }
                                        com.example.model.GlobalState.chatMessagesStorage[activeChatId] = messages
                                    }
                                    showDeleteConfirmDialog = false
                                    selectedActionMsg = null
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE53935))
                        ) {
                            Text("Delete for Me & Raj (Both Sides)", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                        
                        OutlinedButton(
                            onClick = {
                                coroutineScope.launch {
                                    val success = com.example.network.AqualynRepository.deleteMessage(activeChatId, selectedActionMsg!!.id)
                                    if (success) {
                                        messages = messages.filter { it.id != selectedActionMsg!!.id }
                                        com.example.model.GlobalState.chatMessagesStorage[activeChatId] = messages
                                        com.example.model.GlobalState.showToast("Message deleted for you", isGreen = true)
                                    } else {
                                        messages = messages.filter { it.id != selectedActionMsg!!.id }
                                        com.example.model.GlobalState.chatMessagesStorage[activeChatId] = messages
                                    }
                                    showDeleteConfirmDialog = false
                                    selectedActionMsg = null
                                }
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Delete for Me Only", color = Color(0xFF546E7A))
                        }
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showDeleteConfirmDialog = false; selectedActionMsg = null }) {
                        Text("Cancel", color = Color.Gray)
                    }
                }
            )
        }

        if (showReactionsForMsg != null) {
            Popup(
                alignment = Alignment.Center,
                onDismissRequest = { showReactionsForMsg = null },
                offset = IntOffset(0, 0)
            ) {
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(32.dp))
                        .background(Color.White.copy(alpha=0.9f))
                        .border(1.dp, Color(0xFFE0E0E0), RoundedCornerShape(32.dp))
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    listOf("👍", "❤️", "😂", "😮", "😢", "🙏").forEach { emoji ->
                        Text(
                            text = emoji,
                            fontSize = 28.sp,
                            modifier = Modifier.clickable {
                                val msg = showReactionsForMsg!!
                                val currentReactions = msg.reactions.toMutableList()
                                if (currentReactions.contains(emoji)) currentReactions.remove(emoji) else currentReactions.add(emoji)
                                messages = messages.map { if (it.id == msg.id) it.copy(reactions = currentReactions) else it }
                                com.example.model.GlobalState.chatMessagesStorage[activeChatId] = messages
                                showReactionsForMsg = null
                                coroutineScope.launch {
                                    com.example.network.AqualynRepository.reactMessage(activeChatId, msg.id, emoji)
                                }
                            }
                        )
                    }
                }
            }
        }
        
        if (showProfileDetails) {
            ModalBottomSheet(
                onDismissRequest = { showProfileDetails = false },
                containerColor = Color.White
            ) {
                Column(
                    modifier = Modifier.fillMaxWidth().padding(bottom = 32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Spacer(modifier = Modifier.height(16.dp))
                    Box(modifier = Modifier.size(100.dp).clip(CircleShape)) {
                        if (resolvedAvatarUrl.isNotBlank()) {
                            coil.compose.AsyncImage(
                                model = resolvedAvatarUrl,
                                contentDescription = null,
                                contentScale = androidx.compose.ui.layout.ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )
                        } else {
                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(Color(0xFF0091EA)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(resolvedName.take(1).uppercase(), color = Color.White, fontSize = 48.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(resolvedName, fontWeight = FontWeight.Bold, fontSize = 24.sp, color = Color(0xFF263238))
                    Text("@$resolvedHandle", fontSize = 16.sp, color = Color(0xFF546E7A))
                    Spacer(modifier = Modifier.height(24.dp))
                    Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp), horizontalArrangement = Arrangement.SpaceEvenly) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clickable { }) {
                            Box(modifier = Modifier.size(48.dp).clip(CircleShape).background(Color(0xFFE1F5FE)), contentAlignment = Alignment.Center) {
                                Icon(Icons.Filled.Call, contentDescription = "Audio", tint = Color(0xFF0091EA))
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("Audio", fontSize = 12.sp, color = Color(0xFF0091EA), fontWeight = FontWeight.Bold)
                        }
                        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clickable { }) {
                            Box(modifier = Modifier.size(48.dp).clip(CircleShape).background(Color(0xFFE1F5FE)), contentAlignment = Alignment.Center) {
                                Icon(Icons.Filled.Videocam, contentDescription = "Video", tint = Color(0xFF0091EA))
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("Video", fontSize = 12.sp, color = Color(0xFF0091EA), fontWeight = FontWeight.Bold)
                        }
                        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clickable { }) {
                            Box(modifier = Modifier.size(48.dp).clip(CircleShape).background(Color(0xFFE1F5FE)), contentAlignment = Alignment.Center) {
                                Icon(Icons.Filled.Search, contentDescription = "Search", tint = Color(0xFF0091EA))
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("Search", fontSize = 12.sp, color = Color(0xFF0091EA), fontWeight = FontWeight.Bold)
                        }
                        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clickable { }) {
                            Box(modifier = Modifier.size(48.dp).clip(CircleShape).background(Color(0xFFE1F5FE)), contentAlignment = Alignment.Center) {
                                Icon(Icons.Outlined.Notifications, contentDescription = "Mute", tint = Color(0xFF0091EA))
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("Mute", fontSize = 12.sp, color = Color(0xFF0091EA), fontWeight = FontWeight.Bold)
                        }
                    }
                    Spacer(modifier = Modifier.height(24.dp))
                    HorizontalDivider(color = Color(0xFFECEFF1))
                    Row(modifier = Modifier.fillMaxWidth().clickable { }.padding(horizontal = 24.dp, vertical = 16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.Image, contentDescription = null, tint = Color(0xFF263238))
                        Spacer(modifier = Modifier.width(24.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Media, links, and docs", fontSize = 16.sp, color = Color(0xFF263238))
                            Text("12 items", fontSize = 14.sp, color = Color(0xFF78909C))
                        }
                    }
                    Row(modifier = Modifier.fillMaxWidth().clickable { }.padding(horizontal = 24.dp, vertical = 16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.Star, contentDescription = null, tint = Color(0xFF263238))
                        Spacer(modifier = Modifier.width(24.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Starred messages", fontSize = 16.sp, color = Color(0xFF263238))
                            Text("None", fontSize = 14.sp, color = Color(0xFF78909C))
                        }
                    }
                    HorizontalDivider(color = Color(0xFFECEFF1))
                    Row(modifier = Modifier.fillMaxWidth().clickable { }.padding(horizontal = 24.dp, vertical = 16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.Lock, contentDescription = null, tint = Color(0xFF263238))
                        Spacer(modifier = Modifier.width(24.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Encyption", fontSize = 16.sp, color = Color(0xFF263238))
                            Text("Messages are end-to-end encrypted", fontSize = 14.sp, color = Color(0xFF78909C))
                        }
                    }
                    Row(modifier = Modifier.fillMaxWidth().clickable { }.padding(horizontal = 24.dp, vertical = 16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.Timer, contentDescription = null, tint = Color(0xFF263238))
                        Spacer(modifier = Modifier.width(24.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Disappearing messages", fontSize = 16.sp, color = Color(0xFF263238))
                            Text("Off", fontSize = 14.sp, color = Color(0xFF78909C))
                        }
                    }
                    HorizontalDivider(color = Color(0xFFECEFF1))
                    Row(modifier = Modifier.fillMaxWidth().clickable { }.padding(horizontal = 24.dp, vertical = 16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.Block, contentDescription = null, tint = Color(0xFFE53935))
                        Spacer(modifier = Modifier.width(24.dp))
                        Text("Block $resolvedName", fontSize = 16.sp, color = Color(0xFFE53935))
                    }
                    Row(modifier = Modifier.fillMaxWidth().clickable { }.padding(horizontal = 24.dp, vertical = 16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.Report, contentDescription = null, tint = Color(0xFFE53935))
                        Spacer(modifier = Modifier.width(24.dp))
                        Text("Report $resolvedName", fontSize = 16.sp, color = Color(0xFFE53935))
                    }
                }
            }
        }

        
        if (showAttachmentPicker) {
            ModalBottomSheet(
                onDismissRequest = { showAttachmentPicker = false },
                containerColor = Color.White
            ) {
                MediaAttachmentPickerView(
                    onSelect = { option ->
                        showAttachmentPicker = false
                        when (option) {
                            "Camera" -> {
                                galleryLauncher.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
                            }
                            "Photo & Video" -> {
                                galleryLauncher.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageAndVideo))
                            }
                            "Document" -> {
                                documentLauncher.launch(arrayOf("*/*"))
                            }
                            "Location" -> sendMessage(location = "Mountain View, CA")
                            "Send Money" -> sendMessage(paymentAmount = "$50.00")
                        }
                    }
                )
            }
        }

        // --- ZIP EXPORT PROGRESS DIALOG ---
        if (isExportingChatProgress) {
            LaunchedEffect(Unit) {
                while (exportPercent < 100) {
                    delay(80)
                    exportPercent += 10
                }
                isExportingChatProgress = false
                com.example.model.GlobalState.showToast("aqualyn_chat_ansh.zip exported!", isGreen = true)
            }

            androidx.compose.ui.window.Dialog(onDismissRequest = { }) {
                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    modifier = Modifier.padding(16.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        CircularProgressIndicator(
                            progress = exportPercent / 100f,
                            color = Color(0xFF0091EA),
                            trackColor = Color(0xFFECEFF1)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("Exporting conversation...", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Spacer(modifier = Modifier.height(6.dp))
                        Text("Preparing ZIP artifact ($exportPercent%)", fontSize = 13.sp, color = Color(0xFF78909C))
                    }
                }
            }
        }

        // --- SIMULATED VOICE CALL SCREEN ---
        if (showVoiceCallScreen) {
            var isMutedCallState by remember { mutableStateOf(false) }
            var isSpeakerCallState by remember { mutableStateOf(false) }
            var timerSeconds by remember { mutableStateOf(0) }
            LaunchedEffect(Unit) {
                while (true) {
                    delay(1000)
                    timerSeconds += 1
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
                            Text("AQUALYN SECURE VOICE CALL", color = Color(0xFF00E5FF), fontSize = 12.sp, fontWeight = FontWeight.Bold, letterSpacing = 2.sp)
                            Spacer(modifier = Modifier.height(24.dp))
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
                                ) {
                                    if (resolvedAvatarUrl.isNotBlank()) {
                                        coil.compose.AsyncImage(
                                            model = resolvedAvatarUrl,
                                            contentDescription = null,
                                            contentScale = androidx.compose.ui.layout.ContentScale.Crop,
                                            modifier = Modifier.fillMaxSize()
                                        )
                                    } else {
                                        Box(
                                            modifier = Modifier
                                                .fillMaxSize()
                                                .background(Color(0xFF0091EA)),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(resolvedName.take(2).uppercase(), fontWeight = FontWeight.Bold, fontSize = 32.sp, color = Color.White)
                                        }
                                    }
                                }
                            }
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(resolvedName, fontWeight = FontWeight.Bold, fontSize = 28.sp, color = Color.White)
                            Spacer(modifier = Modifier.height(8.dp))
                            val minutesStr = (timerSeconds / 60).toString().padStart(2, '0')
                            val secondsStr = (timerSeconds % 60).toString().padStart(2, '0')
                            Text("Connected • $minutesStr:$secondsStr", fontSize = 15.sp, color = Color.White.copy(0.7f))
                        }

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 48.dp),
                            horizontalArrangement = Arrangement.SpaceEvenly,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            IconButton(
                                onClick = { isMutedCallState = !isMutedCallState },
                                modifier = Modifier
                                    .size(56.dp)
                                    .clip(CircleShape)
                                    .background(if (isMutedCallState) Color.White else Color.White.copy(0.15f))
                            ) {
                                Icon(
                                    imageVector = if (isMutedCallState) Icons.Default.MicOff else Icons.Default.Mic,
                                    contentDescription = "Mute",
                                    tint = if (isMutedCallState) Color(0xFF00365C) else Color.White
                                )
                            }

                            IconButton(
                                onClick = {
                                    showVoiceCallScreen = false
                                    com.example.model.GlobalState.showToast("Voice call completed details logged", isGreen = true)
                                },
                                modifier = Modifier
                                    .size(72.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFEF5350))
                            ) {
                                Icon(Icons.Default.CallEnd, contentDescription = "Decline", tint = Color.White, modifier = Modifier.size(36.dp))
                            }

                            IconButton(
                                onClick = { isSpeakerCallState = !isSpeakerCallState },
                                modifier = Modifier
                                    .size(56.dp)
                                    .clip(CircleShape)
                                    .background(if (isSpeakerCallState) Color.White else Color.White.copy(0.15f))
                            ) {
                                Icon(
                                    imageVector = if (isSpeakerCallState) Icons.Default.VolumeUp else Icons.Default.VolumeMute,
                                    contentDescription = "Speaker",
                                    tint = if (isSpeakerCallState) Color(0xFF00365C) else Color.White
                                )
                            }
                        }
                    }
                }
            }
        }

        // --- SIMULATED VIDEO CALL SCREEN ---
        if (showVideoCallScreen) {
            var isCameraOn by remember { mutableStateOf(true) }
            var isVoiceMuted by remember { mutableStateOf(false) }
            var callConnectedTime by remember { mutableStateOf(0) }
            LaunchedEffect(Unit) {
                while (true) {
                    delay(1000)
                    callConnectedTime += 1
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
                    if (isCameraOn) {
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
                                Text("${resolvedName}'s Feed Camera Simulator", color = Color.White.copy(0.6f), fontSize = 12.sp)
                            }
                        }
                    } else {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(Color.Black),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("${resolvedName}'s Video Paused", color = Color.White, fontWeight = FontWeight.Bold)
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
                                .background(
                                    Brush.linearGradient(listOf(Color(0xFF0091EA), Color(0xFF637BFE)))
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(imageVector = Icons.Outlined.PhotoCamera, contentDescription = null, tint = Color.White.copy(0.8f), modifier = Modifier.size(20.dp))
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
                                Text("$resolvedName Video Call Session", color = Color.White, fontWeight = FontWeight.Black, fontSize = 20.sp)
                                val minStr = (callConnectedTime / 60).toString().padStart(2, '0')
                                val secStr = (callConnectedTime % 60).toString().padStart(2, '0')
                                Text("Aqualyn HD Link • Connected $minStr:$secStr", color = Color(0xFF00E5FF), fontSize = 12.sp, fontWeight = FontWeight.Bold)
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
                                onClick = { isCameraOn = !isCameraOn },
                                modifier = Modifier
                                    .size(56.dp)
                                    .clip(CircleShape)
                                    .background(if (isCameraOn) Color.White.copy(0.2f) else Color.White)
                            ) {
                                Icon(
                                    imageVector = if (isCameraOn) Icons.Filled.VideocamOff else Icons.Filled.Videocam,
                                    tint = if (isCameraOn) Color.White else Color(0xFF001122),
                                    contentDescription = "Toggle Video"
                                )
                            }

                            IconButton(
                                onClick = {
                                    showVideoCallScreen = false
                                    com.example.model.GlobalState.showToast("Video session terminated. Connection secure.", isGreen = true)
                                },
                                modifier = Modifier
                                    .size(72.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFEF5350))
                            ) {
                                Icon(Icons.Default.CallEnd, contentDescription = "Decline call", tint = Color.White, modifier = Modifier.size(36.dp))
                            }

                            IconButton(
                                onClick = { isVoiceMuted = !isVoiceMuted },
                                modifier = Modifier
                                    .size(56.dp)
                                    .clip(CircleShape)
                                    .background(if (isVoiceMuted) Color.White else Color.White.copy(0.2f))
                            ) {
                                Icon(
                                    imageVector = if (isVoiceMuted) Icons.Filled.MicOff else Icons.Filled.Mic,
                                    tint = if (isVoiceMuted) Color(0xFF001122) else Color.White,
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

