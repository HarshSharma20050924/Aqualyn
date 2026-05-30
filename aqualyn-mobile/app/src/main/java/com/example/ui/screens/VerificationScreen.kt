package com.example.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun VerificationScreen(phone: String, onVerified: (isProfileComplete: Boolean) -> Unit) {
    var otp by remember { mutableStateOf("") }
    val isOtpComplete = otp.length == 6
    var isLoading by remember { mutableStateOf(false) }
    var countdownSeconds by remember { mutableStateOf(30) }

    LaunchedEffect(isLoading) {
        if (isLoading) {
            val status = com.example.network.AqualynRepository.verifyOtp(phone, otp)
            isLoading = false
            if (status > 0) {
                onVerified(status == 2)
            }
        }
    }

    LaunchedEffect(Unit) {
        while (countdownSeconds > 0) {
            kotlinx.coroutines.delay(1000)
            countdownSeconds--
        }
    }

    val infiniteTransition = rememberInfiniteTransition(label = "cursorBlink")
    val cursorAlpha by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 0f,
        animationSpec = infiniteRepeatable(
            animation = tween(500, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "cursorAlpha"
    )

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
                        text = if (com.example.model.GlobalState.isEnteringPhoneExisting) "Welcome Back!" else "Verify it's you",
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF263238)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = if (phone.contains("@") || phone.startsWith("+")) "We sent a 6-digit code to $phone" else "We sent a 6-digit code to +91 $phone",
                        fontSize = 14.sp,
                        color = Color(0xFF546E7A),
                        lineHeight = 20.sp
                    )
                    
                    com.example.model.GlobalState.lastSentOtp?.let { code ->
                        Spacer(modifier = Modifier.height(12.dp))
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color(0xFFE3F2FD))
                                .clickable { otp = code }
                                .padding(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = "💡 Autofill OTP: $code",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Color(0xFF0D47A1)
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(32.dp))
                    
                    // Input block with custom blinking cursor
                    Box(modifier = Modifier.fillMaxWidth().height(60.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            for (i in 0 until 6) {
                                val char = otp.getOrNull(i)?.toString() ?: ""
                                val isFocused = i == otp.length
                                val hasValue = char.isNotEmpty()
                                
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .aspectRatio(1f)
                                        .padding(horizontal = 4.dp)
                                        .clip(RoundedCornerShape(16.dp))
                                        .background(Color.White)
                                        .border(
                                            width = if (isFocused) 2.dp else 1.dp,
                                            color = if (isFocused) Color(0xFF0091EA) else Color.Transparent,
                                            shape = RoundedCornerShape(16.dp)
                                        ),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.Center
                                    ) {
                                        if (hasValue) {
                                            Text(
                                                text = char,
                                                fontSize = 24.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = Color(0xFF637BFE)
                                            )
                                        }
                                        if (isFocused) {
                                            Box(
                                                modifier = Modifier
                                                    .width(2.dp)
                                                    .height(24.dp)
                                                    .background(Color(0xFF0091EA).copy(alpha = cursorAlpha))
                                            )
                                        }
                                    }
                                }
                            }
                        }
                        
                        BasicTextField(
                            value = otp,
                            onValueChange = { if (it.length <= 6) otp = it },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                            modifier = Modifier
                                .fillMaxSize()
                                .background(Color.Transparent),
                            textStyle = LocalTextStyle.current.copy(color = Color.Transparent),
                            cursorBrush = SolidColor(Color.Transparent)
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(32.dp))
                    
                    Button(
                        onClick = { if (isOtpComplete) isLoading = true },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                        enabled = isOtpComplete && !isLoading,
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
                                    if (isOtpComplete) {
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
                                        "Verify & Enter",
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
                    
                    if (countdownSeconds > 0) {
                        Text(
                            text = "Resend Code in 00:${if (countdownSeconds >= 10) countdownSeconds.toString() else "0$countdownSeconds"}",
                            modifier = Modifier.fillMaxWidth(),
                            textAlign = TextAlign.Center,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFFA0AAB2)
                        )
                    } else {
                        Text(
                            text = "Resend Code",
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    countdownSeconds = 30
                                },
                            textAlign = TextAlign.Center,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF0091EA)
                        )
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
