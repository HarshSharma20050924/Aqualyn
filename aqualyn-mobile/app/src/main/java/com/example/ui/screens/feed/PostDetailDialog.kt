package com.example.ui.screens.feed

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PostDetailDialog(
    post: LocalPost,
    postsList: androidx.compose.runtime.snapshots.SnapshotStateList<LocalPost>,
    onDismissRequest: () -> Unit,
    triggerToast: (String) -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    var inputCommentText by remember { mutableStateOf("") }
    val liveComments = remember { mutableStateListOf<Pair<String, String>>().apply { addAll(post.comments) } }

    Dialog(
        onDismissRequest = onDismissRequest,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.White)
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Header title
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 14.dp)
                        .padding(top = 16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = onDismissRequest) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back", tint = Color.Black)
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Comments Detail", fontWeight = FontWeight.Bold, fontSize = 20.sp, color = Color.Black)
                    Spacer(modifier = Modifier.weight(1f))
                    Text("${liveComments.size} items", color = Color.Gray, fontSize = 13.sp)
                }
                HorizontalDivider(color = Color(0xFFEEEEEE), thickness = 1.dp)

                // Main scrolling details
                LazyColumn(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth(),
                    contentPadding = PaddingValues(16.dp)
                ) {
                    // Original Post description card
                    item {
                        Row(verticalAlignment = Alignment.Top) {
                            if (!post.avatarUrl.isNullOrEmpty()) {
                                AsyncImage(
                                    model = post.avatarUrl,
                                    contentDescription = "",
                                    modifier = Modifier
                                        .size(42.dp)
                                        .clip(CircleShape)
                                )
                            } else {
                                Box(
                                    modifier = Modifier
                                        .size(42.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFFE0F7FA)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(post.username.take(2).uppercase(), color = Color(0xFF0091EA), fontWeight = FontWeight.Bold)
                                }
                            }

                            Spacer(modifier = Modifier.width(12.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Text(post.username, fontWeight = FontWeight.Bold, color = Color.Black, fontSize = 15.sp)
                                if (!post.location.isNullOrEmpty()) {
                                    Text(post.location, color = Color.Gray, fontSize = 11.sp)
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(post.caption, color = Color.Black, fontSize = 14.sp)
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(post.timeInfo, color = Color.Gray, fontSize = 10.sp)
                            }
                        }
                        Spacer(modifier = Modifier.height(24.dp))
                        HorizontalDivider(color = Color(0xFFEEEEEE))
                        Spacer(modifier = Modifier.height(16.dp))
                    }

                    // Comments listing
                    if (liveComments.isEmpty()) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 40.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("No comments yet. Start the conversation!", color = Color.Gray)
                            }
                        }
                    } else {
                        itemsIndexed(liveComments) { _, commentPair ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 10.dp),
                                verticalAlignment = Alignment.Top
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFFECEFF1)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(commentPair.first.take(2).uppercase(), color = Color(0xFF546E7A), fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text(commentPair.first, fontWeight = FontWeight.Bold, color = Color.Black, fontSize = 13.sp)
                                    Text(commentPair.second, color = Color(0xFF263238), fontSize = 13.sp)
                                }
                            }
                        }
                    }
                }

                // Bottom comments text submit tool
                HorizontalDivider(color = Color(0xFFEEEEEE), thickness = 1.dp)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.White)
                        .padding(horizontal = 12.dp, vertical = 12.dp)
                        .navigationBarsPadding()
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = inputCommentText,
                            onValueChange = { inputCommentText = it },
                            placeholder = { Text("Add comment on ${post.username}...", color = Color.Gray, fontSize = 13.sp) },
                            modifier = Modifier
                                .weight(1f)
                                .height(50.dp),
                            shape = RoundedCornerShape(25.dp),
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedContainerColor = Color(0xFFF9F9F9),
                                unfocusedContainerColor = Color(0xFFF9F9F9),
                                focusedTextColor = Color.Black,
                                unfocusedTextColor = Color.Black
                            )
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Button(
                            onClick = {
                                if (inputCommentText.isNotBlank()) {
                                    val cText = inputCommentText
                                    val newC = "you" to cText
                                    liveComments.add(newC)
                                    // Also write back to global state list
                                    val indexInGlobal = postsList.indexOfFirst { it.id == post.id }
                                    if (indexInGlobal != -1) {
                                        postsList[indexInGlobal] = postsList[indexInGlobal].copy(
                                            comments = postsList[indexInGlobal].comments + newC
                                        )
                                    }
                                    inputCommentText = ""
                                    coroutineScope.launch {
                                        com.example.network.AqualynRepository.commentPost(post.id, cText)
                                    }
                                    triggerToast("Comment added successfully!")
                                }
                            },
                            enabled = inputCommentText.isNotBlank(),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0091EA)),
                            contentPadding = PaddingValues(horizontal = 16.dp),
                            shape = RoundedCornerShape(25.dp),
                            modifier = Modifier.height(48.dp)
                        ) {
                            Text("Publish", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}
