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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import coil.compose.AsyncImage
import kotlinx.coroutines.launch
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.result.PickVisualMediaRequest
import androidx.compose.foundation.text.BasicTextField

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PostCreatorDialog(
    postsList: androidx.compose.runtime.snapshots.SnapshotStateList<LocalPost>,
    postToEdit: LocalPost?,
    onDismissRequest: () -> Unit,
    triggerToast: (String) -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    var postCaption by remember { mutableStateOf(postToEdit?.caption ?: "") }
    var postLocation by remember { mutableStateOf(postToEdit?.location ?: "") }
    var selectedImageUri by remember { mutableStateOf<android.net.Uri?>(null) }
    val context = androidx.compose.ui.platform.LocalContext.current
    
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia(),
        onResult = { uri -> selectedImageUri = uri }
    )
    var isUploadInProgress by remember { mutableStateOf(false) }
    var isShareToStoriesEnabled by remember { mutableStateOf(true) }

    Dialog(
        onDismissRequest = onDismissRequest,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFFF3F7FB))
        ) {
            // Background atmospheric glowing blobs
            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .offset(x = 100.dp, y = (-80).dp)
                    .size(340.dp)
                    .background(Color(0xFF0057BD).copy(0.06f), CircleShape)
            )
            Box(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .offset(x = (-100).dp, y = 100.dp)
                    .size(300.dp)
                    .background(Color(0xFF006668).copy(0.08f), CircleShape)
            )

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 20.dp)
            ) {
                // Header Row (TopAppBar)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 48.dp, bottom = 16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        IconButton(
                            onClick = onDismissRequest,
                            modifier = Modifier
                                .size(40.dp)
                                .background(Color.White, CircleShape)
                        ) {
                            Icon(
                                Icons.Filled.ArrowBack,
                                contentDescription = "Back",
                                tint = Color(0xFF0057BD),
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = if (postToEdit != null) "Edit Post" else "New Post",
                            style = androidx.compose.ui.text.TextStyle(
                                fontWeight = FontWeight.ExtraBold,
                                fontSize = 20.sp,
                                color = Color(0xFF0057BD)
                            )
                        )
                    }
                    
                    Text(
                        text = "Drafts",
                        color = Color(0xFF0057BD),
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        modifier = Modifier.clickable { triggerToast("Draft auto-saved successfully!") }
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                Column(
                    modifier = Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState())
                ) {
                    // Glass Post Composer Card
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .shadow(elevation = 8.dp, shape = RoundedCornerShape(24.dp), ambientColor = Color(0xFF0057BD).copy(0.1f))
                            .background(Color.White.copy(0.9f), RoundedCornerShape(24.dp))
                            .border(1.dp, Color.White.copy(0.4f), RoundedCornerShape(24.dp))
                            .padding(16.dp)
                    ) {
                        Row(modifier = Modifier.fillMaxWidth()) {
                            // Rounded Image Preview
                            Box(
                                modifier = Modifier
                                    .size(96.dp)
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(Color(0xFFE3E9EE))
                                    .clickable { 
                                        imagePickerLauncher.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
                                    }
                            ) {
                                if (selectedImageUri != null) {
                                    AsyncImage(
                                        model = selectedImageUri,
                                        contentDescription = "Selected photo",
                                        modifier = Modifier.fillMaxSize(),
                                        contentScale = ContentScale.Crop
                                    )
                                    Box(
                                        modifier = Modifier
                                            .fillMaxSize()
                                            .background(Color.Black.copy(0.12f))
                                    )
                                } else if (!postToEdit?.imageUrl.isNullOrBlank()) {
                                    AsyncImage(
                                        model = postToEdit!!.imageUrl,
                                        contentDescription = "Selected photo",
                                        modifier = Modifier.fillMaxSize(),
                                        contentScale = ContentScale.Crop
                                    )
                                } else {
                                    Box(
                                        modifier = Modifier.fillMaxSize(),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            Icons.Filled.Image,
                                            contentDescription = "No image",
                                            tint = Color.Gray,
                                            modifier = Modifier.size(28.dp)
                                        )
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.width(16.dp))

                            // Caption Textarea
                            BasicTextField(
                                value = postCaption,
                                onValueChange = { postCaption = it },
                                modifier = Modifier
                                    .weight(1f)
                                    .height(96.dp),
                                textStyle = androidx.compose.ui.text.TextStyle(
                                    fontSize = 16.sp,
                                    color = Color(0xFF2A2F32),
                                    lineHeight = 22.sp
                                ),
                                decorationBox = { innerTextField ->
                                    if (postCaption.isEmpty()) {
                                        Text(
                                            text = "Write a caption reflecting your aquatic state... 📸🎨",
                                            color = Color(0xFF575C60).copy(0.6f),
                                            fontSize = 16.sp
                                        )
                                    }
                                    innerTextField()
                                }
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    // Interaction Options (Tag, Place, Stories Switch)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp)
                            .shadow(elevation = 2.dp, shape = RoundedCornerShape(16.dp))
                            .background(Color.White.copy(0.8f), RoundedCornerShape(16.dp))
                            .clickable { triggerToast("Tag team system loaded.") }
                            .padding(horizontal = 16.dp, vertical = 14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .background(Color(0xFF0BFBFF).copy(0.2f), CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    Icons.Filled.Person,
                                    contentDescription = "Tag Person",
                                    tint = Color(0xFF006668),
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(
                                "Tag People",
                                fontWeight = FontWeight.SemiBold,
                                color = Color(0xFF2A2F32),
                                fontSize = 15.sp
                            )
                        }
                        Icon(
                            Icons.Filled.KeyboardArrowRight,
                            contentDescription = null,
                            tint = Color(0xFF575C60)
                        )
                    }

                    // Option: Add Location Details
                    var showLocationInput by remember { mutableStateOf(false) }
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp)
                            .shadow(elevation = 2.dp, shape = RoundedCornerShape(16.dp))
                            .background(Color.White.copy(0.8f), RoundedCornerShape(16.dp))
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { showLocationInput = !showLocationInput }
                                .padding(horizontal = 16.dp, vertical = 14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .background(Color(0xFF0BFBFF).copy(0.2f), CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        Icons.Filled.Place,
                                        contentDescription = "Add Location",
                                        tint = Color(0xFF006668),
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Text(
                                    text = if (postLocation.isNotBlank()) "Location: $postLocation" else "Add Location",
                                    fontWeight = FontWeight.SemiBold,
                                    color = Color(0xFF2A2F32),
                                    fontSize = 15.sp
                                )
                            }
                            Icon(
                                if (showLocationInput) Icons.Filled.KeyboardArrowUp else Icons.Filled.KeyboardArrowRight,
                                contentDescription = null,
                                tint = Color(0xFF575C60)
                            )
                        }

                        if (showLocationInput) {
                            OutlinedTextField(
                                value = postLocation,
                                onValueChange = { postLocation = it },
                                placeholder = { Text("e.g. Blue Lagoon, Maldives, Goa", color = Color.Gray) },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(start = 16.dp, end = 16.dp, bottom = 16.dp),
                                shape = RoundedCornerShape(12.dp),
                                singleLine = true,
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedContainerColor = Color.White,
                                    unfocusedContainerColor = Color.White,
                                    focusedBorderColor = Color(0xFF0091EA)
                                )
                            )
                        }
                    }

                    // Option: Share to Stories
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp)
                            .shadow(elevation = 2.dp, shape = RoundedCornerShape(16.dp))
                            .background(Color.White.copy(0.8f), RoundedCornerShape(16.dp))
                            .padding(horizontal = 16.dp, vertical = 14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .background(Color(0xFF0BFBFF).copy(0.2f), CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    Icons.Filled.AutoAwesome,
                                    contentDescription = "Story Share",
                                    tint = Color(0xFF006668),
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    "Share to Stories",
                                    fontWeight = FontWeight.SemiBold,
                                    color = Color(0xFF2A2F32),
                                    fontSize = 15.sp
                                )
                                Text(
                                    "Post to both Feed and Profile highlights",
                                    color = Color(0xFF575C60),
                                    fontSize = 11.sp
                                )
                            }
                        }
                        Switch(
                            checked = isShareToStoriesEnabled,
                            onCheckedChange = { isShareToStoriesEnabled = it },
                            colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = Color(0xFF006668))
                        )
                    }

                    Spacer(modifier = Modifier.height(20.dp))

                    // Advanced options
                    Row(
                        modifier = Modifier
                            .clickable { triggerToast("Aqualyn water refract analysis calibrated.") }
                            .padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Filled.Settings,
                            contentDescription = null,
                            tint = Color(0xFF575C60).copy(0.8f),
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            "Advanced Settings",
                            color = Color(0xFF575C60).copy(0.8f),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }

                    Spacer(modifier = Modifier.height(40.dp))
                }

                // Bottom glossy share
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 32.dp)
                ) {
                    Button(
                        onClick = {
                            if (postCaption.isNotBlank()) {
                                val captionText = postCaption
                                val locationText = if (postLocation.isNotBlank()) postLocation else ""
                                
                                coroutineScope.launch {
                                    isUploadInProgress = true
                                    var finalMediaUrl: String? = null
                                    if (selectedImageUri != null) {
                                        try {
                                             val inputStream = context.contentResolver.openInputStream(selectedImageUri!!)
                                             val bytes = inputStream?.readBytes()
                                             inputStream?.close()
                                             if (bytes != null) {
                                                 finalMediaUrl = com.example.network.AqualynRepository.uploadFile(bytes, "image/jpeg", "upload.jpg")
                                             }
                                        } catch (e: Exception) {
                                             android.util.Log.e("FeedScreen", "Image load error", e)
                                        }
                                    }

                                    val success = if (postToEdit != null) {
                                        val edited = com.example.network.AqualynRepository.editPost(postToEdit.id, captionText)
                                        edited != null
                                    } else {
                                        com.example.network.AqualynRepository.createPost(captionText, locationText, finalMediaUrl)
                                    }
                                    
                                    if (success) {
                                        triggerToast(if (postToEdit != null) "Post updated successfully!" else "Post uploaded successfully!")
                                        if (postToEdit != null) {
                                            val editIndex = postsList.indexOfFirst { it.id == postToEdit.id }
                                            if (editIndex >= 0) {
                                                postsList[editIndex] = postsList[editIndex].copy(caption = captionText)
                                            }
                                        } else {
                                            postsList.add(0, LocalPost(
                                                id = System.currentTimeMillis().toString(),
                                                username = "You",
                                                caption = captionText,
                                                imageGradient = listOf(Color(0xFF0091EA), Color(0xFF637BFE)),
                                                location = locationText,
                                                imageUrl = finalMediaUrl
                                            ))
                                        }
                                    } else {
                                        triggerToast(if (postToEdit != null) "Failed to update post." else "Failed to upload post.")
                                    }
                                    
                                    isUploadInProgress = false
                                    onDismissRequest()
                                }
                            } else {
                                triggerToast("Caption cannot be blank!")
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp)
                            .shadow(12.dp, CircleShape, ambientColor = Color(0xFF006668).copy(0.4f)),
                        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                        contentPadding = PaddingValues(),
                        shape = CircleShape
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(
                                    Brush.linearGradient(listOf(Color(0xFF006668), Color(0xFF6E9FFF))),
                                    CircleShape
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            if (isUploadInProgress) {
                                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                            } else {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        "Share",
                                        fontWeight = FontWeight.ExtraBold,
                                        fontSize = 17.sp,
                                        color = Color.White
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Icon(
                                        Icons.Filled.Send,
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
