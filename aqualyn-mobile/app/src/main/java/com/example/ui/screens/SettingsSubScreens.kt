package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.*
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch

@Composable
fun SettingsSubHeader(title: String, onBack: () -> Unit) {
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
            modifier = Modifier.clickable { onBack() }.padding(end = 16.dp)
        )
        Text(
            title,
            fontWeight = FontWeight.Bold,
            fontSize = 20.sp,
            color = Color(0xFF263238),
            letterSpacing = (-0.5).sp
        )
    }
}

@Composable
fun AppearanceScreen(onBack: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF4F7F9))
    ) {
        SettingsSubHeader("Appearance", onBack)
        
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Text("Visual Preferences", fontWeight = FontWeight.Bold, color = Color(0xFF006BB6), fontSize = 14.sp, modifier = Modifier.padding(16.dp))
            
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .background(Color.White)
                    .padding(16.dp)
            ) {
                Text("Theme Mode", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF263238))
                Spacer(modifier = Modifier.height(12.dp))
                Row(modifier = Modifier.fillMaxWidth()) {
                    Box(modifier = Modifier.weight(1f).height(48.dp).border(1.dp, Color(0xFF0097A7), RoundedCornerShape(12.dp)).padding(horizontal = 16.dp), contentAlignment = Alignment.CenterStart) {
                        Text("Liquid (Light)", color = Color(0xFF0097A7), fontWeight = FontWeight.Medium, fontSize = 14.sp)
                        Icon(Icons.Filled.Check, contentDescription = null, tint = Color(0xFF0097A7), modifier = Modifier.align(Alignment.CenterEnd).size(18.dp))
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Box(modifier = Modifier.weight(1f).height(48.dp).border(1.dp, Color(0xFFE0E0E0), RoundedCornerShape(12.dp)).padding(horizontal = 16.dp), contentAlignment = Alignment.CenterStart) {
                        Text("Obsidian (Dark)", color = Color(0xFF546E7A), fontWeight = FontWeight.Medium, fontSize = 14.sp)
                    }
                }
                
                Spacer(modifier = Modifier.height(24.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text("Aqua Intensity", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF263238))
                    Text("50%", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF0097A7))
                }
                Spacer(modifier = Modifier.height(12.dp))
                Slider(value = 0.5f, onValueChange = {}, colors = SliderDefaults.colors(thumbColor = Color(0xFF00E5FF), activeTrackColor = Color(0xFF0097A7)))
                Text("Adjusts the blur and opacity of glassmorphism elements.", fontSize = 12.sp, color = Color(0xFF78909C))
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            Text("THEME ENGINE", fontWeight = FontWeight.Bold, color = Color(0xFF3F51B5), fontSize = 12.sp, modifier = Modifier.padding(16.dp))
            
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .background(Color.White)
                    .padding(16.dp)
            ) {
                Text("Accent Color", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF263238))
                Spacer(modifier = Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    val colors = listOf(Color(0xFF0097A7), Color(0xFF00BFA5), Color(0xFFAA00FF), Color(0xFFF50057), Color(0xFFFF3D00), Color(0xFFFFC107), Color(0xFF00E676))
                    colors.forEachIndexed { index, color ->
                        Box(modifier = Modifier.size(36.dp).clip(CircleShape).background(color).border(if(index == 0) 2.dp else 0.dp, Color(0xFF263238), CircleShape))
                    }
                }
                
                Spacer(modifier = Modifier.height(24.dp))
                Text("Bubble Style", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF263238))
                Spacer(modifier = Modifier.height(12.dp))
                Row(modifier = Modifier.fillMaxWidth()) {
                    Box(modifier = Modifier.weight(1f).height(36.dp).clip(RoundedCornerShape(8.dp)).background(Color(0xFF0097A7)), contentAlignment = Alignment.Center) {
                        Text("Rounded", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                    Box(modifier = Modifier.weight(1f).height(36.dp), contentAlignment = Alignment.Center) {
                        Text("Sharp", color = Color(0xFF546E7A), fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                    Box(modifier = Modifier.weight(1f).height(36.dp), contentAlignment = Alignment.Center) {
                        Text("Glass", color = Color(0xFF546E7A), fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
                
                Spacer(modifier = Modifier.height(24.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text("Font Scaling", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF263238))
                    Text("16px", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF0097A7))
                }
                Spacer(modifier = Modifier.height(12.dp))
                Slider(value = 0.5f, onValueChange = {}, colors = SliderDefaults.colors(thumbColor = Color(0xFF00E5FF), activeTrackColor = Color(0xFF0097A7)))
            }
            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

@Composable
fun ChatFoldersScreen(onBack: () -> Unit) {
    var showCreateFolder by remember { mutableStateOf(false) }
    var folderName by remember { mutableStateOf("") }
    var folders by remember { mutableStateOf(listOf("Work" to 3, "Personal" to 8)) }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF4F7F9))
    ) {
        SettingsSubHeader("Chat Folders", onBack)
        
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("YOUR FOLDERS", fontWeight = FontWeight.Bold, color = Color(0xFF0097A7), fontSize = 12.sp)
                Text(
                    "+ Create New", 
                    fontWeight = FontWeight.Bold, 
                    color = Color(0xFF3F51B5), 
                    fontSize = 12.sp,
                    modifier = Modifier.clickable { showCreateFolder = true }
                )
            }
            
            if (showCreateFolder) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(24.dp))
                        .background(Color.White)
                        .border(1.dp, Color(0xFF0097A7), RoundedCornerShape(24.dp))
                        .padding(16.dp)
                ) {
                    OutlinedTextField(
                        value = folderName,
                        onValueChange = { folderName = it },
                        placeholder = { Text("Folder Name") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            unfocusedBorderColor = Color(0xFFE0E0E0),
                            focusedBorderColor = Color(0xFF0097A7)
                        )
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                        TextButton(onClick = { showCreateFolder = false }) {
                            Text("Cancel", color = Color(0xFF78909C), fontWeight = FontWeight.Bold)
                        }
                        Button(
                            onClick = { 
                                if(folderName.isNotBlank()) {
                                    folders = folders + (folderName to 0)
                                    folderName = ""
                                    showCreateFolder = false
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0097A7))
                        ) {
                            Text("Create")
                        }
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
            }
            
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .background(Color.White)
                    .padding(vertical = 8.dp)
            ) {
                folders.forEachIndexed { index, folder ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color(0xFFE0F7FA)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Filled.Folder, contentDescription = null, tint = Color(0xFF0097A7))
                        }
                        Spacer(modifier = Modifier.width(16.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(folder.first, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color(0xFF263238))
                            Text("${folder.second} chats", fontSize = 12.sp, color = Color(0xFF78909C))
                        }
                        Icon(
                            Icons.Filled.DeleteOutline, 
                            contentDescription = "Delete", 
                            tint = Color(0xFF90A4AE),
                            modifier = Modifier.clickable { 
                                folders = folders.filterIndexed { i, _ -> i != index }
                            }
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = null, tint = Color(0xFF90A4AE))
                    }
                    if (index < folders.size - 1) {
                        HorizontalDivider(color = Color(0xFFECEFF1), modifier = Modifier.padding(horizontal = 20.dp))
                    }
                }
            }
        }
    }
}

@Composable
fun WalletScreen(onBack: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF4F7F9))
    ) {
        SettingsSubHeader("Wallet", onBack)
        
        Column(modifier = Modifier.fillMaxSize().padding(16.dp).verticalScroll(rememberScrollState())) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(32.dp))
                    .background(Brush.linearGradient(listOf(Color(0xFF0097A7), Color(0xFF00BFA5))))
                    .padding(24.dp)
            ) {
                Column {
                    Text("TOTAL BALANCE", fontWeight = FontWeight.Bold, color = Color.White.copy(alpha=0.8f), fontSize = 12.sp, letterSpacing = 1.sp)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text("$12,450.00", fontWeight = FontWeight.Black, color = Color.White, fontSize = 36.sp)
                    Spacer(modifier = Modifier.height(24.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Button(
                            onClick = {},
                            modifier = Modifier.weight(1f).height(48.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha=0.2f)),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Text("Add Funds", fontWeight = FontWeight.Bold)
                        }
                        Button(
                            onClick = {},
                            modifier = Modifier.weight(1f).height(48.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha=0.2f)),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Text("Withdraw", fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            Text("PAYMENT METHODS", fontWeight = FontWeight.Bold, color = Color(0xFF0097A7), fontSize = 12.sp, modifier = Modifier.padding(horizontal = 8.dp, vertical = 8.dp))
            
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .background(Color.White)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 20.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(modifier = Modifier.size(40.dp).clip(RoundedCornerShape(12.dp)).background(Color(0xFFE3F2FD)), contentAlignment = Alignment.Center) {
                        Icon(Icons.Filled.CreditCard, contentDescription = null, tint = Color(0xFF2196F3))
                    }
                    Spacer(modifier = Modifier.width(16.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Visa •••• 4242", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color(0xFF263238))
                        Text("Expires 12/25", fontSize = 12.sp, color = Color(0xFF78909C))
                    }
                    Text("Primary", color = Color(0xFF0097A7), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
                HorizontalDivider(color = Color(0xFFECEFF1))
                Row(
                    modifier = Modifier.fillMaxWidth().clickable { }.padding(horizontal = 20.dp, vertical = 20.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Filled.Add, contentDescription = null, tint = Color(0xFF00BFA5))
                    Spacer(modifier = Modifier.width(16.dp))
                    Text("Add Bank Account or Card", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color(0xFF00BFA5))
                }
            }
        }
    }
}

@Composable
fun NotificationsScreen(onBack: () -> Unit) {
    var soundsEnabled by remember { mutableStateOf(true) }
    var previewsEnabled by remember { mutableStateOf(true) }
    var callsEnabled by remember { mutableStateOf(true) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF4F7F9))
    ) {
        SettingsSubHeader("Notifications", onBack)
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Text("MESSAGE NOTIFICATIONS", fontWeight = FontWeight.Bold, color = Color(0xFF0097A7), fontSize = 12.sp, modifier = Modifier.padding(16.dp))
            Column(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(24.dp)).background(Color.White).padding(8.dp)) {
                SettingToggleRow("In-App Sounds", "Play sounds for incoming messages", soundsEnabled) { soundsEnabled = it }
                HorizontalDivider(color = Color(0xFFECEFF1), modifier = Modifier.padding(horizontal = 12.dp))
                SettingToggleRow("Message Previews", "Show message text in notifications", previewsEnabled) { previewsEnabled = it }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            Text("CALL NOTIFICATIONS", fontWeight = FontWeight.Bold, color = Color(0xFF0097A7), fontSize = 12.sp, modifier = Modifier.padding(16.dp))
            Column(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(24.dp)).background(Color.White).padding(8.dp)) {
                SettingToggleRow("Audio & Video Calls", "Ring for incoming calls", callsEnabled) { callsEnabled = it }
            }
        }
    }
}

@Composable
fun SecurityScreen(onBack: () -> Unit) {
    var twoStepEnabled by remember { mutableStateOf(false) }
    var lockEnabled by remember { mutableStateOf(true) }
    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        com.example.network.AqualynRepository.fetchSettings()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.linearGradient(
                    colors = listOf(Color(0xFFD6F5F6), Color(0xFFE9E5F8))
                )
            )
    ) {
        SettingsSubHeader("Security", onBack)
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Text("ACCOUNT SECURITY", fontWeight = FontWeight.Bold, color = Color(0xFF0091EA), fontSize = 12.sp, modifier = Modifier.padding(16.dp))
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .background(Color.White.copy(alpha = 0.85f))
                    .border(1.dp, Color.White.copy(alpha = 0.4f), RoundedCornerShape(24.dp))
                    .padding(8.dp)
            ) {
                SettingToggleRow("Two-Step Verification", "Require a PIN when logging in", twoStepEnabled) { twoStepEnabled = it }
                HorizontalDivider(color = Color(0xFFECEFF1).copy(alpha = 0.5f), modifier = Modifier.padding(horizontal = 12.dp))
                SettingToggleRow("App Lock", "Require biometrics to open Aqualyn", lockEnabled) { lockEnabled = it }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            Text("ARCHIVED CHATS LOCK & SECURITY", fontWeight = FontWeight.Bold, color = Color(0xFF0091EA), fontSize = 12.sp, modifier = Modifier.padding(16.dp))
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .background(Color.White.copy(alpha = 0.85f))
                    .border(1.dp, Color.White.copy(alpha = 0.4f), RoundedCornerShape(24.dp))
                    .padding(8.dp)
            ) {
                var showPinDialog by remember { mutableStateOf(false) }
                var pinTempText by remember { mutableStateOf(com.example.model.GlobalState.archivePinCode) }

                SettingToggleRow(
                    title = "Protect Archive with PIN",
                    subtitle = "Require a 4-digit security code to open archived chats",
                    checked = com.example.model.GlobalState.archivePinRequired
                ) {
                    com.example.model.GlobalState.archivePinRequired = it
                    if (it) {
                        showPinDialog = true
                    } else {
                        com.example.model.GlobalState.showToast("Archive lock disabled", isGreen = false)
                    }
                    coroutineScope.launch {
                        com.example.network.AqualynRepository.updateSettings(
                            com.example.network.SettingsDto(
                                archivePinRequired = it,
                                archivePinCode = com.example.model.GlobalState.archivePinCode
                            )
                        )
                    }
                }

                if (com.example.model.GlobalState.archivePinRequired) {
                    HorizontalDivider(color = Color(0xFFECEFF1).copy(alpha = 0.5f), modifier = Modifier.padding(horizontal = 12.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { showPinDialog = true }
                            .padding(horizontal = 12.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Archive Lock PIN Code", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color(0xFF263238))
                            Text("Current PIN: ${com.example.model.GlobalState.archivePinCode}", fontSize = 12.sp, color = Color(0xFF546E7A))
                        }
                        Icon(Icons.Filled.Lock, contentDescription = null, tint = Color(0xFF0091EA))
                    }

                    HorizontalDivider(color = Color(0xFFECEFF1).copy(alpha = 0.5f), modifier = Modifier.padding(horizontal = 12.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                com.example.model.GlobalState.archiveLockedState = true
                                com.example.model.GlobalState.showToast("Archives locked securely!", isGreen = true)
                            }
                            .padding(horizontal = 12.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Lock Archive Instantly", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color(0xFFEF5350))
                            Text(
                                if (com.example.model.GlobalState.archiveLockedState) "Currently Locked" else "Click to lock archives now",
                                fontSize = 12.sp,
                                color = if (com.example.model.GlobalState.archiveLockedState) Color(0xFFE53935) else Color(0xFF78909C)
                            )
                        }
                        Icon(
                            imageVector = if (com.example.model.GlobalState.archiveLockedState) Icons.Filled.Lock else Icons.Filled.LockOpen,
                            contentDescription = null,
                            tint = if (com.example.model.GlobalState.archiveLockedState) Color(0xFFEF5350) else Color(0xFF4CAF50)
                        )
                    }
                }

                if (showPinDialog) {
                    androidx.compose.ui.window.Dialog(onDismissRequest = { showPinDialog = false }) {
                        Card(
                            shape = RoundedCornerShape(24.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            modifier = Modifier.padding(16.dp)
                        ) {
                            Column(modifier = Modifier.padding(20.dp)) {
                                Text("Set Archive Lock PIN", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                                Spacer(modifier = Modifier.height(12.dp))
                                OutlinedTextField(
                                    value = pinTempText,
                                    onValueChange = { if (it.length <= 4) pinTempText = it },
                                    label = { Text("4-digit PIN Code") },
                                    placeholder = { Text("e.g. 1234") },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp),
                                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                                        keyboardType = androidx.compose.ui.text.input.KeyboardType.Number
                                    )
                                )
                                Spacer(modifier = Modifier.height(20.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.End
                                ) {
                                    TextButton(onClick = { showPinDialog = false }) {
                                        Text("Cancel")
                                    }
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Button(
                                        onClick = {
                                            if (pinTempText.length == 4) {
                                                com.example.model.GlobalState.archivePinCode = pinTempText
                                                com.example.model.GlobalState.archiveLockedState = true
                                                showPinDialog = false
                                                com.example.model.GlobalState.showToast("PIN set to $pinTempText and locked!", isGreen = true)
                                                coroutineScope.launch {
                                                    com.example.network.AqualynRepository.updateSettings(
                                                        com.example.network.SettingsDto(
                                                            archivePinRequired = com.example.model.GlobalState.archivePinRequired,
                                                            archivePinCode = pinTempText
                                                        )
                                                    )
                                                }
                                            } else {
                                                com.example.model.GlobalState.showToast("PIN must be exactly 4 digits!", isGreen = false)
                                            }
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0091EA)),
                                        shape = RoundedCornerShape(12.dp)
                                    ) {
                                        Text("Save PIN", color = Color.White)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            Text("GLOBAL SEARCH PRIVACY", fontWeight = FontWeight.Bold, color = Color(0xFF0091EA), fontSize = 12.sp, modifier = Modifier.padding(16.dp))
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .background(Color.White.copy(alpha = 0.85f))
                    .border(1.dp, Color.White.copy(alpha = 0.4f), RoundedCornerShape(24.dp))
                    .padding(8.dp)
            ) {
                SettingToggleRow(
                    title = "Search by Number",
                    subtitle = "Allow users to find your account globally by phone number",
                    checked = com.example.model.GlobalState.searchByNumberEnabled
                ) {
                    com.example.model.GlobalState.searchByNumberEnabled = it
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            Text("PRIVACY", fontWeight = FontWeight.Bold, color = Color(0xFF0091EA), fontSize = 12.sp, modifier = Modifier.padding(16.dp))
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .background(Color.White.copy(alpha = 0.85f))
                    .border(1.dp, Color.White.copy(alpha = 0.4f), RoundedCornerShape(24.dp))
                    .padding(8.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().clickable { }.padding(horizontal = 12.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Blocked Users", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color(0xFF263238))
                        Text("${com.example.model.GlobalState.blockedUsers.size} contacts", fontSize = 12.sp, color = Color(0xFF78909C))
                    }
                    Icon(Icons.AutoMirrored.Filled.KeyboardArrowRight, contentDescription = null, tint = Color(0xFF90A4AE))
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            var activeSessions by remember { mutableStateOf<List<com.example.network.SessionDto>>(emptyList()) }
            var isLoadingSessions by remember { mutableStateOf(false) }

            LaunchedEffect(Unit) {
                isLoadingSessions = true
                activeSessions = com.example.network.AqualynRepository.getSessions()
                isLoadingSessions = false
            }

            Text("ACTIVE SESSIONS", fontWeight = FontWeight.Bold, color = Color(0xFF0091EA), fontSize = 12.sp, modifier = Modifier.padding(16.dp))
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .background(Color.White.copy(alpha = 0.85f))
                    .border(1.dp, Color.White.copy(alpha = 0.4f), RoundedCornerShape(24.dp))
                    .padding(8.dp)
            ) {
                if (isLoadingSessions) {
                    Box(modifier = Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Color(0xFF0091EA))
                    }
                } else if (activeSessions.isEmpty()) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Filled.Devices, contentDescription = null, tint = Color(0xFF90A4AE))
                        Spacer(modifier = Modifier.width(16.dp))
                        Text("No other active sessions", fontSize = 14.sp, color = Color(0xFF78909C))
                    }
                } else {
                    activeSessions.forEachIndexed { index, session ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 12.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Filled.Devices, contentDescription = null, tint = Color(0xFF0091EA))
                            Spacer(modifier = Modifier.width(16.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(session.deviceName, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color(0xFF263238))
                                Text("IP: ${session.ipAddress} • Active: ${session.lastActive}", fontSize = 12.sp, color = Color(0xFF78909C))
                            }
                            IconButton(
                                onClick = {
                                    coroutineScope.launch {
                                        val success = com.example.network.AqualynRepository.revokeSession(session.id)
                                        if (success) {
                                            com.example.model.GlobalState.showToast("Session revoked successfully", isGreen = true)
                                            activeSessions = activeSessions.filter { it.id != session.id }
                                        } else {
                                            com.example.model.GlobalState.showToast("Failed to revoke session", isGreen = false)
                                        }
                                    }
                                }
                            ) {
                                Icon(Icons.Filled.Delete, contentDescription = "Revoke", tint = Color(0xFFEF5350))
                            }
                        }
                        if (index < activeSessions.size - 1) {
                            HorizontalDivider(color = Color(0xFFECEFF1).copy(alpha = 0.5f), modifier = Modifier.padding(horizontal = 12.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun DataAndStorageScreen(onBack: () -> Unit) {
    var storageValue by remember { mutableStateOf(2.4f) }
    var mediaValue by remember { mutableStateOf(1.2f) }
    var docsValue by remember { mutableStateOf(0.6f) }
    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        val usage = com.example.network.AqualynRepository.getStorageUsage()
        if (usage != null) {
            storageValue = usage.totalBytes.toFloat() / (1024f * 1024f * 1024f)
            mediaValue = usage.mediaBytes.toFloat() / (1024f * 1024f * 1024f)
            docsValue = usage.docsBytes.toFloat() / (1024f * 1024f * 1024f)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF4F7F9))
    ) {
        SettingsSubHeader("Data and Storage", onBack)
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Text("STORAGE USAGE", fontWeight = FontWeight.Bold, color = Color(0xFF0097A7), fontSize = 12.sp, modifier = Modifier.padding(16.dp))
            Column(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(24.dp)).background(Color.White).padding(16.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Bottom) {
                    Text("Total Used", color = Color(0xFF78909C), fontSize = 14.sp)
                    Text(String.format("%.2f GB", storageValue), fontWeight = FontWeight.Bold, color = Color(0xFF263238), fontSize = 24.sp)
                }
                Spacer(modifier = Modifier.height(16.dp))
                LinearProgressIndicator(
                    progress = { if (storageValue > 0f) (mediaValue + docsValue) / storageValue else 0f },
                    modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)),
                    color = Color(0xFF0097A7),
                    trackColor = Color(0xFFECEFF1)
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(String.format("Media: %.2f GB", mediaValue), fontSize = 12.sp, color = Color(0xFF78909C))
                    Text(String.format("Docs: %.2f GB", docsValue), fontSize = 12.sp, color = Color(0xFF78909C))
                }
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = { storageValue = 0f },
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE0F7FA)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Clear Cache", color = Color(0xFF0097A7), fontWeight = FontWeight.Bold)
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            Text("DATA EXPORT", fontWeight = FontWeight.Bold, color = Color(0xFF0097A7), fontSize = 12.sp, modifier = Modifier.padding(16.dp))
            Column(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(24.dp)).background(Color.White).padding(8.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth().clickable {
                        coroutineScope.launch {
                            com.example.model.GlobalState.showToast("Exporting data...", isGreen = true)
                            val success = com.example.network.AqualynRepository.exportData()
                            if (success) com.example.model.GlobalState.showToast("Export triggered via email", isGreen = true)
                            else com.example.model.GlobalState.showToast("Export failed", isGreen = false)
                        }
                    }.padding(horizontal = 12.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Filled.Download, contentDescription = null, tint = Color(0xFF0097A7))
                    Spacer(modifier = Modifier.width(16.dp))
                    Column {
                        Text("Export all chats as ZIP", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color(0xFF263238))
                        Text("Download a backup of all conversations", fontSize = 12.sp, color = Color(0xFF78909C))
                    }
                }
            }
        }
    }
}

@Composable
fun SettingToggleRow(title: String, subtitle: String, checked: Boolean, onCheckedChange: (Boolean) -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onCheckedChange(!checked) }
            .padding(horizontal = 12.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(title, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color(0xFF263238))
            Text(subtitle, fontSize = 12.sp, color = Color(0xFF78909C))
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = Color.White,
                checkedTrackColor = Color(0xFF0097A7)
            )
        )
    }
}
