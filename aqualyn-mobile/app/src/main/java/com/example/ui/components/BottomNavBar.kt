package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ui.navigation.MainTabs

@Composable
fun AqualynBottomNavBar(currentTab: String, onTabSelected: (String) -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .navigationBarsPadding()
            .height(80.dp)
            .clip(RoundedCornerShape(topStart = 32.dp, topEnd = 32.dp))
            .background(Color.White.copy(alpha = 0.8f))
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            NavItem(
                icon = Icons.Outlined.ChatBubbleOutline,
                label = "Chats",
                isSelected = currentTab == MainTabs.CHATS,
                onClick = { onTabSelected(MainTabs.CHATS) }
            )
            NavItem(
                icon = Icons.Outlined.PeopleOutline,
                label = "Contacts",
                isSelected = currentTab == MainTabs.CONTACTS || currentTab == MainTabs.PROFILE,
                onClick = { onTabSelected(MainTabs.CONTACTS) }
            )
            NavItem(
                icon = Icons.Outlined.DataUsage,
                label = "Feed",
                isSelected = currentTab == MainTabs.FEED,
                onClick = { onTabSelected(MainTabs.FEED) }
            )
            NavItem(
                icon = Icons.Outlined.Settings,
                label = "Settings",
                isSelected = currentTab == MainTabs.SETTINGS,
                onClick = { onTabSelected(MainTabs.SETTINGS) }
            )
        }
    }
}

@Composable
private fun NavItem(
    icon: ImageVector,
    label: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val color = if (isSelected) Color(0xFF0091EA) else Color(0xFFB0BEC5)
    
    IconButton(
        onClick = onClick,
        modifier = Modifier.padding(horizontal = 16.dp)
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = color,
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = label,
                fontSize = 11.sp,
                color = color,
                fontWeight = if (isSelected) androidx.compose.ui.text.font.FontWeight.Bold else androidx.compose.ui.text.font.FontWeight.Medium
            )
        }
    }
}
