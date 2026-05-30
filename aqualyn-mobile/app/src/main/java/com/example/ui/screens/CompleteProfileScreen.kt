package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Headset
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.RemoveRedEye
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.outlined.RemoveRedEye
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.result.PickVisualMediaRequest
import coil.compose.AsyncImage
import androidx.compose.ui.unit.sp
import androidx.compose.material.icons.filled.Person

@Composable
fun CompleteProfileScreen(onComplete: () -> Unit) {
    var displayName by remember { mutableStateOf(com.example.model.GlobalState.currentUserProfile?.name ?: "") }
    var showBirthday by remember { mutableStateOf(true) }
    var isLoading by remember { mutableStateOf(false) }
    var showDatePicker by remember { mutableStateOf(false) }
    var selectedDate by remember { mutableStateOf("") }

    var selectedImageUri by remember { mutableStateOf<android.net.Uri?>(null) }
    val context = androidx.compose.ui.platform.LocalContext.current
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia(),
        onResult = { uri -> selectedImageUri = uri }
    )

    val months = listOf("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")
    val days = (1..31).map { if (it < 10) "0$it" else "$it" }
    val years = (1950..2026).map { it.toString() }.reversed()

    var activeMonthIdx by remember { mutableStateOf(4) } // May
    var activeDayIdx by remember { mutableStateOf(14) } // 15
    var activeYearIdx by remember { mutableStateOf(26) } // 2000

    val monthMap = mapOf("Jan" to "01", "Feb" to "02", "Mar" to "03", "Apr" to "04", "May" to "05", "Jun" to "06", "Jul" to "07", "Aug" to "08", "Sep" to "09", "Oct" to "10", "Nov" to "11", "Dec" to "12")

    // Keep selectedDate dynamically in sync with current indices
    LaunchedEffect(activeMonthIdx, activeDayIdx, activeYearIdx) {
        selectedDate = "${months[activeMonthIdx]} ${days[activeDayIdx]}, ${years[activeYearIdx]}"
    }

    LaunchedEffect(isLoading) {
        if (isLoading) {
            var finalAvatarUrl: String? = null
            if (selectedImageUri != null) {
                try {
                    val inputStream = context.contentResolver.openInputStream(selectedImageUri!!)
                    val bytes = inputStream?.readBytes()
                    inputStream?.close()
                    if (bytes != null) {
                        finalAvatarUrl = com.example.network.AqualynRepository.uploadFile(bytes, "image/jpeg", "avatar.jpg")
                    }
                } catch (e: Exception) {
                    android.util.Log.e("CompleteProfile", "Image load error", e)
                }
            }

            val dobIso = "${years[activeYearIdx]}-${monthMap[months[activeMonthIdx]]}-${days[activeDayIdx]}"
            val success = com.example.network.AqualynRepository.syncProfile(displayName, dobIso, finalAvatarUrl)
            isLoading = false
            if (success || displayName.isNotEmpty()) {
                onComplete()
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.linearGradient(
                    colors = listOf(Color(0xFFD6F5F6), Color(0xFFE9E5F8)),
                    start = Offset.Zero,
                    end = Offset.Infinite
                )
            )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(32.dp))
                    .background(Color(0xFFF4F6F9).copy(alpha = 0.9f))
                    .padding(32.dp)
            ) {
                Column {
                    Text(
                        text = "Complete Profile",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF263238)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Just a few details to get you started.",
                        fontSize = 14.sp,
                        color = Color(0xFF546E7A),
                        lineHeight = 20.sp
                    )
                    
                    Spacer(modifier = Modifier.height(32.dp))

                    // Avatar Selection
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Box(
                            modifier = Modifier
                                .size(96.dp)
                                .clip(androidx.compose.foundation.shape.CircleShape)
                                .background(Color(0xFFE3E9EE))
                                .clickable {
                                    imagePickerLauncher.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            if (selectedImageUri != null) {
                                AsyncImage(
                                    model = selectedImageUri,
                                    contentDescription = "Avatar",
                                    modifier = Modifier.fillMaxSize(),
                                    contentScale = androidx.compose.ui.layout.ContentScale.Crop
                                )
                            } else {
                                androidx.compose.material3.Icon(
                                    imageVector = androidx.compose.material.icons.Icons.Filled.Person,
                                    contentDescription = "Add Avatar",
                                    tint = androidx.compose.ui.graphics.Color.Gray,
                                    modifier = Modifier.size(48.dp)
                                )
                            }
                        }
                    }
                    
                    Text(
                        text = "Display Name",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF546E7A)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    // Display Name input
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color.White)
                            .border(2.dp, Color(0xFF0091EA).copy(alpha = 0.6f), RoundedCornerShape(16.dp))
                            .padding(horizontal = 16.dp),
                        contentAlignment = Alignment.CenterStart
                    ) {
                        if (displayName.isEmpty()) {
                            Text("e.g. Alex Rivero", color = Color.Gray.copy(alpha = 0.7f), fontSize = 16.sp)
                        }
                        BasicTextField(
                            value = displayName,
                            onValueChange = { displayName = it },
                            textStyle = LocalTextStyle.current.copy(fontSize = 16.sp, color = Color.Black),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    Text(
                        text = "Date of Birth",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF546E7A)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    // Dob box
                    Column {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(56.dp)
                                .clip(RoundedCornerShape(16.dp))
                                .background(Color.White)
                                .border(1.dp, if(showDatePicker) Color(0xFF0091EA) else Color(0xFFE0E0E0), RoundedCornerShape(16.dp))
                                .clickable { showDatePicker = !showDatePicker }
                                .padding(horizontal = 16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Filled.CalendarToday, contentDescription = null, tint = Color(0xFF546E7A), modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(12.dp))
                            Text(if(selectedDate.isNotEmpty()) selectedDate else "Select Date of Birth", color = if(selectedDate.isNotEmpty()) Color.Black else Color(0xFF90A4AE), fontSize = 16.sp, modifier = Modifier.weight(1f))
                            Icon(Icons.Filled.KeyboardArrowDown, contentDescription = null, tint = Color(0xFF546E7A))
                        }
                        
                        if (showDatePicker) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(24.dp))
                                    .background(Color.White)
                                    .border(1.dp, Color(0xFF0091EA).copy(alpha = 0.3f), RoundedCornerShape(24.dp))
                                    .padding(16.dp)
                            ) {
                                Column {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .height(130.dp),
                                        horizontalArrangement = Arrangement.SpaceEvenly
                                    ) {
                                        // Month selector
                                        Box(
                                            modifier = Modifier
                                                .weight(1f)
                                                .fillMaxHeight(),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            androidx.compose.foundation.lazy.LazyColumn(
                                                modifier = Modifier.fillMaxSize(),
                                                horizontalAlignment = Alignment.CenterHorizontally,
                                                verticalArrangement = Arrangement.spacedBy(4.dp)
                                            ) {
                                                items(months.size) { idx ->
                                                    val isSel = idx == activeMonthIdx
                                                    Box(
                                                        modifier = Modifier
                                                            .fillMaxWidth()
                                                            .clip(RoundedCornerShape(8.dp))
                                                            .background(if (isSel) Color(0xFF0091EA).copy(alpha = 0.12f) else Color.Transparent)
                                                            .clickable { activeMonthIdx = idx }
                                                            .padding(vertical = 4.dp, horizontal = 8.dp),
                                                        contentAlignment = Alignment.Center
                                                    ) {
                                                        Text(
                                                            text = months[idx],
                                                            fontSize = if (isSel) 16.sp else 13.sp,
                                                            fontWeight = if (isSel) FontWeight.Bold else FontWeight.Normal,
                                                            color = if (isSel) Color(0xFF0091EA) else Color.Gray
                                                        )
                                                    }
                                                }
                                            }
                                        }

                                        // Day selector
                                        Box(
                                            modifier = Modifier
                                                .weight(1f)
                                                .fillMaxHeight(),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            androidx.compose.foundation.lazy.LazyColumn(
                                                modifier = Modifier.fillMaxSize(),
                                                horizontalAlignment = Alignment.CenterHorizontally,
                                                verticalArrangement = Arrangement.spacedBy(4.dp)
                                            ) {
                                                items(days.size) { idx ->
                                                    val isSel = idx == activeDayIdx
                                                    Box(
                                                        modifier = Modifier
                                                            .fillMaxWidth()
                                                            .clip(RoundedCornerShape(8.dp))
                                                            .background(if (isSel) Color(0xFF0091EA).copy(alpha = 0.12f) else Color.Transparent)
                                                            .clickable { activeDayIdx = idx }
                                                            .padding(vertical = 4.dp, horizontal = 8.dp),
                                                        contentAlignment = Alignment.Center
                                                    ) {
                                                        Text(
                                                            text = days[idx],
                                                            fontSize = if (isSel) 16.sp else 13.sp,
                                                            fontWeight = if (isSel) FontWeight.Bold else FontWeight.Normal,
                                                            color = if (isSel) Color(0xFF0091EA) else Color.Gray
                                                        )
                                                    }
                                                }
                                            }
                                        }

                                        // Year selector
                                        Box(
                                            modifier = Modifier
                                                .weight(1f)
                                                .fillMaxHeight(),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            androidx.compose.foundation.lazy.LazyColumn(
                                                modifier = Modifier.fillMaxSize(),
                                                horizontalAlignment = Alignment.CenterHorizontally,
                                                verticalArrangement = Arrangement.spacedBy(4.dp)
                                            ) {
                                                items(years.size) { idx ->
                                                    val isSel = idx == activeYearIdx
                                                    Box(
                                                        modifier = Modifier
                                                            .fillMaxWidth()
                                                            .clip(RoundedCornerShape(8.dp))
                                                            .background(if (isSel) Color(0xFF0091EA).copy(alpha = 0.12f) else Color.Transparent)
                                                            .clickable { activeYearIdx = idx }
                                                            .padding(vertical = 4.dp, horizontal = 8.dp),
                                                        contentAlignment = Alignment.Center
                                                    ) {
                                                        Text(
                                                            text = years[idx],
                                                            fontSize = if (isSel) 16.sp else 13.sp,
                                                            fontWeight = if (isSel) FontWeight.Bold else FontWeight.Normal,
                                                            color = if (isSel) Color(0xFF0091EA) else Color.Gray
                                                        )
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(12.dp))

                                    Button(
                                        onClick = { showDatePicker = false },
                                        modifier = Modifier.fillMaxWidth(),
                                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0091EA))
                                    ) {
                                        Text("Confirm Date", color = Color.White, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    // Show Birthday switch
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color.White)
                            .border(1.dp, Color(0xFFE0E0E0), RoundedCornerShape(16.dp))
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Outlined.RemoveRedEye, contentDescription = null, tint = Color(0xFF0091EA), modifier = Modifier.size(24.dp))
                        Spacer(modifier = Modifier.width(16.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Show Birthday", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color(0xFF263238))
                            Text("Let friends know it's your special day", fontSize = 11.sp, color = Color(0xFF546E7A))
                        }
                        Switch(
                            checked = showBirthday,
                            onCheckedChange = { showBirthday = it },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = Color.White,
                                checkedTrackColor = Color(0xFF0091EA)
                            )
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(32.dp))
                    
                    Button(
                        onClick = { if (displayName.isNotEmpty()) isLoading = true },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                        enabled = displayName.isNotEmpty() && !isLoading,
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color.Transparent,
                            disabledContainerColor = Color.Transparent
                        ),
                        contentPadding = PaddingValues()
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(
                                    if (displayName.isNotEmpty()) {
                                        Brush.horizontalGradient(listOf(Color(0xFF0091EA), Color(0xFF637BFE)))
                                    } else {
                                        Brush.horizontalGradient(listOf(Color(0xFF88C9E8), Color(0xFFAAB8FF)))
                                    }
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            if (isLoading) {
                                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                            } else {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        "Complete Setup",
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Icon(Icons.Filled.Check, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                                }
                            }
                        }
                    }
                }
            }
        }
        
        // Bottom icons
        Row(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 48.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            val iconModifier = Modifier
                .size(48.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(Color(0xFFF4F6F9).copy(alpha = 0.9f))
                .clickable { }
            
            Box(iconModifier, contentAlignment = Alignment.Center) {
                Icon(Icons.Filled.Language, contentDescription = "Language", tint = Color(0xFF546E7A), modifier = Modifier.size(20.dp))
            }
            Box(iconModifier, contentAlignment = Alignment.Center) {
                Icon(Icons.Filled.Security, contentDescription = "Security", tint = Color(0xFF546E7A), modifier = Modifier.size(20.dp))
            }
            Box(iconModifier, contentAlignment = Alignment.Center) {
                Icon(Icons.Filled.Headset, contentDescription = "Support", tint = Color(0xFF546E7A), modifier = Modifier.size(20.dp))
            }
        }
    }
}
