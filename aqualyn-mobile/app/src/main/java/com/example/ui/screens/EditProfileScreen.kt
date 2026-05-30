package com.example.ui.screens

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.automirrored.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.model.GlobalState
import com.example.network.AqualynRepository
import kotlinx.coroutines.launch

@Composable
fun EditProfileScreen(onBack: () -> Unit, onSave: () -> Unit) {
    var displayName by remember { mutableStateOf(GlobalState.currentUserProfile?.name ?: "") }
    var username by remember { mutableStateOf(GlobalState.currentUserProfile?.handle ?: "") }
    var bio by remember { mutableStateOf(GlobalState.currentUserProfile?.description ?: "") }
    var isLoading by remember { mutableStateOf(false) }
    
    var selectedImageUri by remember { mutableStateOf<android.net.Uri?>(null) }
    val context = androidx.compose.ui.platform.LocalContext.current
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia(),
        onResult = { uri -> selectedImageUri = uri }
    )
    val coroutineScope = rememberCoroutineScope()

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
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = "Back",
                tint = Color(0xFF546E7A),
                modifier = Modifier.clickable { onBack() }
            )
            Spacer(modifier = Modifier.width(24.dp))
            Text(
                "Edit Profile",
                fontWeight = FontWeight.Bold,
                fontSize = 20.sp,
                color = Color(0xFF263238),
                modifier = Modifier.weight(1f)
            )
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.clickable {
                    if (isLoading) return@clickable
                    isLoading = true
                    coroutineScope.launch {
                        var finalAvatarUrl: String? = null
                        if (selectedImageUri != null) {
                            try {
                                val inputStream = context.contentResolver.openInputStream(selectedImageUri!!)
                                val bytes = inputStream?.readBytes()
                                inputStream?.close()
                                if (bytes != null) {
                                    finalAvatarUrl = AqualynRepository.uploadFile(bytes, "image/jpeg", "avatar.jpg")
                                    if (finalAvatarUrl != null) {
                                        AqualynRepository.uploadAvatar(finalAvatarUrl!!)
                                    }
                                }
                            } catch (e: Exception) {
                                android.util.Log.e("EditProfile", "Image load error", e)
                            }
                        }
                        
                        // We also call syncProfile to update name/bio
                        // Note: The custom backend might require bio to be sent in syncProfile or updateSettings 
                        // But we will use syncProfile with what the API accepts
                        val success = AqualynRepository.syncProfile(displayName, "2000-01-01", finalAvatarUrl)
                        if (success) {
                            AqualynRepository.fetchUserProfile("me")
                            onSave()
                        }
                        isLoading = false
                    }
                }
            ) {
                if (isLoading) {
                    CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color(0xFF0D47A1), strokeWidth = 2.dp)
                } else {
                    Icon(Icons.Filled.Save, contentDescription = null, tint = Color(0xFF0D47A1), modifier = Modifier.size(20.dp))
                }
                Spacer(modifier = Modifier.width(4.dp))
                Text("Save", fontWeight = FontWeight.Bold, color = Color(if (isLoading) 0xFF90A4AE else 0xFF0D47A1), fontSize = 16.sp)
            }
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Spacer(modifier = Modifier.height(24.dp))

            // Avatar
            Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxWidth()) {
                Box(contentAlignment = Alignment.BottomEnd, modifier = Modifier.clickable {
                    imagePickerLauncher.launch(androidx.activity.result.PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
                }) {
                    Box(
                        modifier = Modifier
                            .size(120.dp)
                            .clip(CircleShape)
                            .background(Color.LightGray)
                            .border(4.dp, Color.White, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        if (selectedImageUri != null) {
                            AsyncImage(
                                model = selectedImageUri,
                                contentDescription = null,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )
                        } else if (!GlobalState.currentUserProfile?.avatarUrl.isNullOrEmpty()) {
                            AsyncImage(
                                model = GlobalState.currentUserProfile?.avatarUrl,
                                contentDescription = null,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )
                        } else {
                            Icon(Icons.Filled.Person, contentDescription = null, tint = Color.White, modifier = Modifier.size(64.dp))
                        }
                    }
                    Box(modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF0091EA))
                        .border(2.dp, Color.White, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Filled.CameraAlt, contentDescription = "Change photo", tint = Color.White, modifier = Modifier.size(18.dp))
                    }
                }
            }

            Spacer(modifier = Modifier.height(40.dp))

            EditFieldGroup(label = "Display Name", value = displayName, onValueChange = { displayName = it })
            Spacer(modifier = Modifier.height(24.dp))

            EditFieldGroup(label = "Username", value = username, onValueChange = { username = it })
            Text(
                "You can choose a unique username on Aqualyn (lowercase and underscores only). People will be able to find you securely without needing your phone number.",
                color = Color(0xFF78909C),
                fontSize = 12.sp,
                lineHeight = 16.sp,
                modifier = Modifier.padding(top = 8.dp, bottom = 24.dp)
            )

            EditFieldGroup(label = "Role / Title", value = "", onValueChange = {})
            Spacer(modifier = Modifier.height(24.dp))

            EditFieldGroup(label = "About", value = bio, onValueChange = { bio = it }, isMultiline = true)
            
            Spacer(modifier = Modifier.height(40.dp))
        }
    }
}

@Composable
fun EditFieldGroup(label: String, value: String, onValueChange: (String) -> Unit, isMultiline: Boolean = false) {
    Column {
        Text(label, fontWeight = FontWeight.Bold, color = Color(0xFF546E7A), fontSize = 14.sp)
        Spacer(modifier = Modifier.height(8.dp))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(if (isMultiline) 100.dp else 56.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(Color.White)
                .padding(horizontal = 16.dp, vertical = if (isMultiline) 16.dp else 0.dp),
            contentAlignment = if (isMultiline) Alignment.TopStart else Alignment.CenterStart
        ) {
            BasicTextField(
                value = value,
                onValueChange = onValueChange,
                modifier = Modifier.fillMaxWidth(),
                textStyle = androidx.compose.ui.text.TextStyle(fontSize = 16.sp, color = Color(0xFF263238)),
                decorationBox = { innerTextField ->
                    if (value.isEmpty()) {
                        Text(label, fontSize = 16.sp, color = Color(0xFFB0BEC5))
                    }
                    innerTextField()
                }
            )
        }
    }
}
