package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Headset
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun JoinScreen(
    onContinue: (String) -> Unit,
    onGoogleSuccess: (Boolean) -> Unit
) {
    var isEmailMode by remember { mutableStateOf(false) }
    var phoneNumber by remember { mutableStateOf("") }
    var emailAddress by remember { mutableStateOf("") }
    
    val isPhoneValid = phoneNumber.length >= 10
    val isEmailValid = emailAddress.contains("@") && emailAddress.contains(".")
    val isValid = if (isEmailMode) isEmailValid else isPhoneValid
    
    val currentIdentifier = if (isEmailMode) emailAddress else phoneNumber
    var isLoading by remember { mutableStateOf(false) }
    
    var isGoogleLoading by remember { mutableStateOf(false) }
    var googleAccountEmail by remember { mutableStateOf("") }

    LaunchedEffect(isLoading) {
        if (isLoading) {
            val success = com.example.network.AqualynRepository.sendOtp(currentIdentifier)
            isLoading = false
            if (success) {
                onContinue(currentIdentifier)
            }
        }
    }

    LaunchedEffect(isGoogleLoading) {
        if (isGoogleLoading && googleAccountEmail.isNotEmpty()) {
            val sendSuccess = com.example.network.AqualynRepository.sendOtp(googleAccountEmail)
            if (sendSuccess) {
                val otp = com.example.model.GlobalState.lastSentOtp
                if (otp != null) {
                    val status = com.example.network.AqualynRepository.verifyOtp(googleAccountEmail, otp)
                    isGoogleLoading = false
                    if (status > 0) {
                        onGoogleSuccess(status == 2)
                    }
                } else {
                    isGoogleLoading = false
                }
            } else {
                isGoogleLoading = false
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
                        text = "Join Aqualyn",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF263238)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Create an account to experience\nIndia's best messaging app.",
                        fontSize = 14.sp,
                        color = Color(0xFF546E7A),
                        lineHeight = 20.sp
                    )
                    
                    Spacer(modifier = Modifier.height(32.dp))
                    
                    Text(
                        text = if (isEmailMode) "Email Address" else "Phone Number",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF546E7A)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        if (!isEmailMode) {
                            // Country Code box
                            Box(
                                modifier = Modifier
                                    .height(56.dp)
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(Color.White)
                                    .border(1.dp, Color(0xFFE0E0E0), RoundedCornerShape(16.dp))
                                    .clickable { }
                                    .padding(horizontal = 16.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(text = "🇮🇳 +91 ⌄", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            }
                            
                            Spacer(modifier = Modifier.width(12.dp))
                        }
                        
                        // Unified input box
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(56.dp)
                                .clip(RoundedCornerShape(16.dp))
                                .background(Color.White)
                                .border(2.dp, Color(0xFF0091EA).copy(alpha = 0.6f), RoundedCornerShape(16.dp))
                                .padding(horizontal = 16.dp),
                            contentAlignment = Alignment.CenterStart
                        ) {
                            val currentVal = if (isEmailMode) emailAddress else phoneNumber
                            if (currentVal.isEmpty()) {
                                Text(
                                    text = if (isEmailMode) "example@domain.com" else "000 000 0000",
                                    color = Color.Gray,
                                    fontSize = 16.sp
                                )
                            }
                            BasicTextField(
                                value = currentVal,
                                onValueChange = { 
                                    if (isEmailMode) emailAddress = it else phoneNumber = it
                                },
                                keyboardOptions = KeyboardOptions(
                                    keyboardType = if (isEmailMode) KeyboardType.Email else KeyboardType.Number
                                ),
                                textStyle = LocalTextStyle.current.copy(fontSize = 16.sp, color = Color.Black),
                                modifier = Modifier.fillMaxWidth()
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    Button(
                        onClick = { if (isValid) isLoading = true },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                        enabled = isValid && !isLoading,
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
                                    if (isValid) {
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
                                        "Continue",
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Icon(Icons.Filled.ArrowForward, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                                }
                            }
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    Text(
                        text = "OR",
                        modifier = Modifier.fillMaxWidth(),
                        textAlign = TextAlign.Center,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF546E7A)
                    )
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    var showGoogleSelector by remember { mutableStateOf(false) }

                    Button(
                        onClick = { showGoogleSelector = true },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color.White)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            // Simple colored G stand-in
                            Text("G", color = Color(0xFFDB4437), fontWeight = FontWeight.Bold, fontSize = 20.sp)
                            Spacer(modifier = Modifier.width(12.dp))
                            Text("Continue with Google", color = Color(0xFF263238), fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        }
                    }
                    
                    if (showGoogleSelector) {
                        AlertDialog(
                            onDismissRequest = { showGoogleSelector = false },
                            title = { Text("Choose a Google Account", fontWeight = FontWeight.Bold) },
                            text = {
                                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Text("Select an account to continue to Aqualyn:", color = Color.Gray, fontSize = 13.sp)
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Card(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickable {
                                                googleAccountEmail = "harsh20050924@gmail.com"
                                                showGoogleSelector = false
                                                isGoogleLoading = true
                                            },
                                        colors = CardDefaults.cardColors(containerColor = Color(0xFFF0F4FC))
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(16.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Box(
                                                modifier = Modifier
                                                    .size(36.dp)
                                                    .clip(CircleShape)
                                                    .background(Color(0xFF637BFE)),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Text("H", color = Color.White, fontWeight = FontWeight.Bold)
                                            }
                                            Spacer(modifier = Modifier.width(12.dp))
                                            Column {
                                                Text("Harsh Vardhan", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                                Text("harsh20050924@gmail.com", color = Color.Gray, fontSize = 12.sp)
                                            }
                                        }
                                    }
                                }
                            },
                            confirmButton = {
                                TextButton(onClick = { showGoogleSelector = false }) {
                                    Text("Cancel")
                                }
                            }
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(32.dp))
                    
                    Text(
                        text = if (isEmailMode) "Use phone number instead" else "Use email instead",
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { isEmailMode = !isEmailMode },
                        textAlign = TextAlign.Center,
                        color = Color(0xFF0091EA),
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
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
