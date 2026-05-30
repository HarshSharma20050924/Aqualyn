package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.automirrored.filled.*
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog

enum class SettingsRoute { MAIN, PROFILE, EDIT_PROFILE, APPEARANCE, CHAT_FOLDERS, WALLET, NOTIFICATIONS, SECURITY, DATA_AND_STORAGE }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(onLogout: () -> Unit = {}) {
    var currentRoute by remember { mutableStateOf(SettingsRoute.MAIN) }
    var showLogoutDialog by remember { mutableStateOf(false) }

    when (currentRoute) {
        SettingsRoute.MAIN -> {
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
                        modifier = Modifier.clickable { }
                    )
                    Spacer(modifier = Modifier.width(16.dp))
                    Text(
                        "Settings",
                        fontWeight = FontWeight.Bold,
                        fontSize = 20.sp,
                        color = Color(0xFF263238),
                        letterSpacing = (-0.5).sp
                    )
                }

                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 16.dp),
                    contentPadding = PaddingValues(bottom = 100.dp)
                ) {
                    item {
                        // Top Profile Card
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(160.dp)
                                .clip(RoundedCornerShape(24.dp))
                                .background(Color.White)
                                .background(
                                    Brush.radialGradient(
                                        colors = listOf(Color(0xFFE1F5FE), Color.Transparent),
                                        radius = 300f
                                    )
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Box(
                                    modifier = Modifier
                                        .size(64.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFFC0CA33))
                                        .border(2.dp, Color.White, CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    if (!com.example.model.GlobalState.currentUserProfile?.avatarUrl.isNullOrEmpty()) {
                                        coil.compose.AsyncImage(
                                            model = com.example.model.GlobalState.currentUserProfile?.avatarUrl,
                                            contentDescription = null,
                                            contentScale = androidx.compose.ui.layout.ContentScale.Crop,
                                            modifier = Modifier.fillMaxSize()
                                        )
                                    } else {
                                        val name = com.example.model.GlobalState.currentUserProfile?.name ?: "User"
                                        Text(name.take(2).uppercase(), fontWeight = FontWeight.Bold, color = Color.White, fontSize = 24.sp)
                                    }
                                }
                                Spacer(modifier = Modifier.height(16.dp))
                                OutlinedButton(
                                    onClick = { currentRoute = SettingsRoute.PROFILE },
                                    shape = RoundedCornerShape(20.dp),
                                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE0E0E0)),
                                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFF0D47A1)),
                                    modifier = Modifier.height(36.dp),
                                    contentPadding = PaddingValues(horizontal = 24.dp)
                                ) {
                                    Text("Manage", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(16.dp))
                    }
                    
                    item {
                        // Settings List Card 1
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(24.dp))
                                .background(Color.White)
                                .padding(vertical = 8.dp)
                        ) {
                            SettingsListItem2(Icons.Outlined.Palette, "Appearance", "Theme, accent color, bubble style", Color(0xFF0097A7)) { currentRoute = SettingsRoute.APPEARANCE }
                            SettingsListItem2(Icons.Outlined.Folder, "Chat Folders", "Organize your chats into folders", Color(0xFF3F51B5)) { currentRoute = SettingsRoute.CHAT_FOLDERS }
                            SettingsListItem2(Icons.Outlined.AccountBalanceWallet, "Wallet", "Balance, payments, cards", Color(0xFF00BFA5)) { currentRoute = SettingsRoute.WALLET }
                            SettingsListItem2(Icons.Outlined.Notifications, "Notifications", "Sound, badges, alerts", Color(0xFFFFB300)) { currentRoute = SettingsRoute.NOTIFICATIONS }
                            SettingsListItem2(Icons.Outlined.Security, "Security", "Privacy, two-step verification", Color(0xFF8E24AA)) { currentRoute = SettingsRoute.SECURITY }
                        }
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        // Settings List Card 2
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(24.dp))
                                .background(Color.White)
                                .padding(vertical = 8.dp)
                        ) {
                            SettingsListItem2(Icons.Outlined.Storage, "Data and Storage", "Export chats, storage usage", Color(0xFFFF5722)) { currentRoute = SettingsRoute.DATA_AND_STORAGE }
                            SettingsListItem2(Icons.Outlined.FileDownload, "Export all chats as ZIP", "Download a backup of all conversations", Color(0xFF0097A7)) { }
                        }
                        
                        Spacer(modifier = Modifier.height(24.dp))
                        
                        // Log out button
                        OutlinedButton(
                            onClick = { showLogoutDialog = true },
                            modifier = Modifier.fillMaxWidth().height(56.dp),
                            shape = RoundedCornerShape(16.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFFCDD2)),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.Red)
                        ) {
                            Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Log Out", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        }

                        if (showLogoutDialog) {
                            Dialog(onDismissRequest = { showLogoutDialog = false }) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 16.dp)
                                        .clip(RoundedCornerShape(24.dp))
                                        .background(Color.White)
                                        .padding(24.dp)
                                ) {
                                    Column {
                                        Text(
                                            text = "Log Out",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 20.sp,
                                            color = Color(0xFF263238),
                                            letterSpacing = (-0.5).sp
                                        )
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Text(
                                            text = "Are you sure you want to log out of Aqualyn? You will need to verify your identity to log back in.",
                                            fontSize = 15.sp,
                                            color = Color(0xFF78909C),
                                            lineHeight = 20.sp
                                        )
                                        Spacer(modifier = Modifier.height(24.dp))
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                                        ) {
                                            Button(
                                                onClick = { showLogoutDialog = false },
                                                shape = RoundedCornerShape(16.dp),
                                                colors = ButtonDefaults.buttonColors(
                                                    containerColor = Color(0xFFECEFF1),
                                                    contentColor = Color(0xFF546E7A)
                                                ),
                                                modifier = Modifier
                                                    .weight(1f)
                                                    .height(48.dp)
                                            ) {
                                                Text("Cancel", fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                                            }
                                            
                                            Button(
                                                onClick = {
                                                    showLogoutDialog = false
                                                    onLogout()
                                                },
                                                shape = RoundedCornerShape(16.dp),
                                                colors = ButtonDefaults.buttonColors(
                                                    containerColor = Color.Red,
                                                    contentColor = Color.White
                                                ),
                                                modifier = Modifier
                                                    .weight(1f)
                                                    .height(48.dp)
                                            ) {
                                                Text("Log Out", fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        SettingsRoute.PROFILE -> {
            ProfileScreen(
                onBack = { currentRoute = SettingsRoute.MAIN },
                onEditProfile = { currentRoute = SettingsRoute.EDIT_PROFILE }
            )
        }
        SettingsRoute.EDIT_PROFILE -> {
            EditProfileScreen(
                onBack = { currentRoute = SettingsRoute.PROFILE },
                onSave = { currentRoute = SettingsRoute.PROFILE }
            )
        }
        SettingsRoute.APPEARANCE -> AppearanceScreen(onBack = { currentRoute = SettingsRoute.MAIN })
        SettingsRoute.CHAT_FOLDERS -> ChatFoldersScreen(onBack = { currentRoute = SettingsRoute.MAIN })
        SettingsRoute.WALLET -> WalletScreen(onBack = { currentRoute = SettingsRoute.MAIN })
        SettingsRoute.NOTIFICATIONS -> NotificationsScreen(onBack = { currentRoute = SettingsRoute.MAIN })
        SettingsRoute.SECURITY -> SecurityScreen(onBack = { currentRoute = SettingsRoute.MAIN })
        SettingsRoute.DATA_AND_STORAGE -> DataAndStorageScreen(onBack = { currentRoute = SettingsRoute.MAIN })
    }
}

@Composable
fun SettingsListItem2(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String, subtitle: String, iconTint: Color, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(vertical = 12.dp, horizontal = 20.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, contentDescription = null, tint = iconTint, modifier = Modifier.size(24.dp))
        Spacer(modifier = Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(title, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color(0xFF263238))
            Text(subtitle, fontSize = 12.sp, color = Color(0xFF78909C))
        }
        Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = null, tint = Color(0xFF90A4AE), modifier = Modifier.size(20.dp))
    }
}
