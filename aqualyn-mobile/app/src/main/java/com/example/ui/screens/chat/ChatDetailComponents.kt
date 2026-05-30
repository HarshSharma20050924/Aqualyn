package com.example.ui.screens.chat

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.Message

@Composable
fun ActionTab(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, onClick: () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clickable(onClick = onClick).padding(8.dp)) {
        Box(modifier = Modifier.size(48.dp).clip(CircleShape).background(Color(0xFF0091EA).copy(alpha = 0.12f)), contentAlignment = Alignment.Center) {
            Icon(icon, contentDescription = label, tint = Color(0xFF0091EA))
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(label, fontSize = 12.sp, color = Color(0xFF546E7A))
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun MessageBubbleView(msg: Message, onClick: () -> Unit, onLongClick: () -> Unit) {
    val isMe = msg.isMine
    val bubbleBrush = if (isMe) Brush.linearGradient(listOf(Color(0xFF0091EA), Color(0xFF637BFE))) else Brush.linearGradient(listOf(Color.White, Color.White))
    val textColor = if (isMe) Color.White else Color(0xFF263238)
    val alignment = if (isMe) Alignment.End else Alignment.Start
    val shape = if (isMe) RoundedCornerShape(20.dp, 20.dp, 4.dp, 20.dp) else RoundedCornerShape(20.dp, 20.dp, 20.dp, 4.dp)

    Column(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        horizontalAlignment = alignment
    ) {
        if (msg.isPinned) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(bottom = 4.dp)) {
                Icon(Icons.Filled.PushPin, contentDescription = "Pinned", tint = Color(0xFF0091EA), modifier = Modifier.size(12.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Pinned Message", fontSize = 10.sp, color = Color(0xFF90A4AE), fontWeight = FontWeight.Bold)
            }
        }
        
        Box(
            modifier = Modifier
                .widthIn(max = 280.dp)
                .clip(shape)
                .background(bubbleBrush)
                .then(if (!isMe) Modifier.border(1.dp, Color(0xFFECEFF1), shape) else Modifier)
                .combinedClickable(
                    onClick = onClick,
                    onLongClick = onLongClick
                )
                .padding(14.dp)
        ) {
            Column {
                if (msg.replyToMsg != null) {
                    val reply = msg.replyToMsg
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color.White.copy(alpha = 0.2f))
                            .padding(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(modifier = Modifier.width(4.dp).height(30.dp).background(if (isMe) Color.White else Color(0xFF0091EA), RoundedCornerShape(2.dp)))
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(if (reply.isMine) "You" else "Sender", color = if (isMe) Color.White else Color(0xFF0091EA), fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            Text(reply.content.takeIf { it.isNotBlank() } ?: "Attachment", color = textColor.copy(alpha = 0.8f), fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                }
                
                if (msg.imageUrl != null) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(150.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color.LightGray),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("📷 Image", color = Color.White)
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                }
                
                if (msg.location != null) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(120.dp)
                            .clip(RoundedCornerShape(8.dp))
                            .background(Color(0xFFFFF9C4)),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(Icons.Filled.Place, contentDescription = "Location", tint = Color(0xFFE53935), modifier = Modifier.size(32.dp))
                            Text(msg.location!!, color = Color(0xFF263238), fontSize = 12.sp, modifier = Modifier.padding(8.dp))
                        }
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                }
                
                if (msg.paymentAmount != null) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (isMe) Color.White.copy(alpha=0.2f) else Color(0xFFE8F5E9))
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier.size(40.dp).clip(CircleShape).background(Color(0xFF0091EA)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Filled.AttachMoney, contentDescription = "Money", tint = Color.White)
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(msg.paymentAmount!!, fontWeight = FontWeight.Bold, fontSize = 18.sp, color = textColor)
                            Text(if (isMe) "You sent payment" else "Payment received", fontSize = 12.sp, color = textColor.copy(alpha=0.8f))
                        }
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                }
                
                if (msg.documentName != null) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(if (isMe) Color.White.copy(alpha=0.2f) else Color(0xFFE3F2FD))
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier.size(40.dp).clip(CircleShape).background(Color(0xFF2196F3)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Filled.InsertDriveFile, contentDescription = "File", tint = Color.White)
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(msg.documentName!!, fontWeight = FontWeight.Bold, fontSize = 14.sp, color = textColor)
                            Text("2.4 MB", fontSize = 12.sp, color = textColor.copy(alpha=0.8f))
                        }
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                }
                
                if (msg.audioUrl != null) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Filled.PlayArrow, contentDescription = "Play", tint = textColor)
                        Spacer(modifier = Modifier.width(8.dp))
                        Box(modifier = Modifier.weight(1f).height(4.dp).background(if(isMe) Color.White.copy(alpha=0.5f) else Color.LightGray)) {
                            Box(modifier = Modifier.fillMaxHeight().fillMaxWidth(0.3f).background(textColor))
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("0:14", fontSize = 12.sp, color = textColor)
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                }

                if (msg.content.isNotBlank()) {
                    Text(msg.content, color = textColor, fontSize = 16.sp)
                }
                
                if (msg.reactions.isNotEmpty()) {
                    Row(
                        modifier = Modifier
                            .padding(top = 4.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color.White.copy(alpha = 0.8f))
                            .border(1.dp, Color(0xFFECEFF1), RoundedCornerShape(12.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        msg.reactions.forEach { reaction ->
                            Text(reaction, fontSize = 14.sp)
                        }
                    }
                }
                
                Row(
                    modifier = Modifier.align(Alignment.End).padding(top = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (msg.isEdited) {
                        Text("Edited", fontSize = 10.sp, color = textColor.copy(alpha = 0.7f), fontStyle = androidx.compose.ui.text.font.FontStyle.Italic)
                        Spacer(modifier = Modifier.width(4.dp))
                    }
                    Text(msg.timeInfo, fontSize = 10.sp, color = textColor.copy(alpha = 0.7f))
                    if (isMe) {
                        Spacer(modifier = Modifier.width(4.dp))
                        Icon(Icons.Default.Check, contentDescription = "Read", tint = textColor.copy(alpha = 0.7f), modifier = Modifier.size(12.dp))
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatInputBar(text: String, onTextChange: (String) -> Unit, onSend: () -> Unit, onAttachClick: () -> Unit, onMicClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White)
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        IconButton(onClick = onAttachClick) {
            Icon(Icons.Filled.Add, contentDescription = "Add", tint = Color(0xFF0091EA), modifier = Modifier.size(28.dp))
        }
        
        Spacer(modifier = Modifier.width(4.dp))
        
        OutlinedTextField(
            value = text,
            onValueChange = onTextChange,
            placeholder = { Text("Message...", color = Color(0xFF90A4AE)) },
            modifier = Modifier
                .weight(1f)
                .height(50.dp),
            shape = RoundedCornerShape(25.dp),
            colors = OutlinedTextFieldDefaults.colors(
                unfocusedContainerColor = Color(0xFFF4F7F9),
                focusedContainerColor = Color(0xFFF4F7F9),
                unfocusedBorderColor = Color.Transparent,
                focusedBorderColor = Color.Transparent
            ),
            trailingIcon = {
                Icon(Icons.Outlined.Mood, contentDescription = "Emoji", tint = Color(0xFF90A4AE))
            }
        )
        
        Spacer(modifier = Modifier.width(8.dp))
        
        if (text.isNotBlank()) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(Color(0xFF0091EA))
                    .clickable { onSend() },
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "Send", tint = Color.White)
            }
        } else {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(Color(0xFF0091EA))
                    .clickable { onMicClick() },
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Filled.Mic, contentDescription = "Mic", tint = Color.White)
            }
        }
    }
}

@Composable
fun MediaAttachmentPickerView(onSelect: (String) -> Unit) {
    val options = listOf(
        Triple("Camera", Icons.Filled.CameraAlt, Color(0xFF0091EA)),
        Triple("Photo & Video", Icons.Filled.Photo, Color(0xFF637BFE)),
        Triple("Document", Icons.Filled.InsertDriveFile, Color(0xFF00B0FF)),
        Triple("Location", Icons.Filled.Place, Color(0xFF0091EA)),
        Triple("Send Money", Icons.Filled.AttachMoney, Color(0xFF00B0FF)),
        Triple("Schedule", Icons.Filled.AccessTime, Color(0xFFFF9800))
    )

    Column(modifier = Modifier.padding(24.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceAround
        ) {
            options.take(3).forEach { (label, icon, color) ->
                AttachmentOptionItem(label, icon, color) { onSelect(label as String) }
            }
        }
        Spacer(modifier = Modifier.height(24.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceAround
        ) {
            options.drop(3).forEach { (label, icon, color) ->
                AttachmentOptionItem(label, icon, color) { onSelect(label as String) }
            }
        }
        Spacer(modifier = Modifier.height(24.dp))
    }
}

@Composable
fun AttachmentOptionItem(label: String, icon: androidx.compose.ui.graphics.vector.ImageVector, color: Color, onClick: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .clickable { onClick() }
            .padding(8.dp)
    ) {
        Box(
            modifier = Modifier
                .size(64.dp)
                .clip(CircleShape)
                .background(color),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, contentDescription = label, tint = Color.White, modifier = Modifier.size(32.dp))
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text(label, fontSize = 12.sp, color = Color(0xFF546E7A), fontWeight = FontWeight.Medium)
    }
}
