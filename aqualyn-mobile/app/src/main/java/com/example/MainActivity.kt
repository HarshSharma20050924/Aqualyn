package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.animation.core.tween
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.example.ui.components.AqualynBottomNavBar
import com.example.ui.components.AquaticToastNotification
import com.example.ui.navigation.MainTabs
import com.example.ui.navigation.Routes
import com.example.ui.screens.*
import com.example.ui.screens.chat.*
import com.example.ui.theme.MyApplicationTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MyApplicationTheme {
                AqualynApp()
            }
        }
    }
}

@Composable
fun AqualynApp() {
    val navController = rememberNavController()
    val context = androidx.compose.ui.platform.LocalContext.current
    val sharedPreferences = remember {
        context.getSharedPreferences("aqualyn_prefs", android.content.Context.MODE_PRIVATE)
    }
    
    val isOnboardingComplete = remember {
        mutableStateOf(sharedPreferences.getBoolean("onboarding_complete", false))
    }
    
    androidx.compose.runtime.LaunchedEffect(Unit) {
        val storedToken = sharedPreferences.getString("auth_token", null)
        val storedUserId = sharedPreferences.getString("current_user_id", null)
        if (storedUserId != null) {
            com.example.model.GlobalState.currentUserId = storedUserId
        }
        if (storedToken != null) {
            com.example.model.GlobalState.authToken = storedToken
            // Fetch current profile and chats initially once token is successfully restored
            if (isOnboardingComplete.value) {
                com.example.network.AqualynRepository.fetchUserProfile("me")
                com.example.network.AqualynRepository.fetchChats()
            }
        }
    }
    
    androidx.compose.runtime.LaunchedEffect(com.example.model.GlobalState.authToken) {
        val token = com.example.model.GlobalState.authToken
        if (token != null) {
            sharedPreferences.edit().putString("auth_token", token).apply()
        } else {
            sharedPreferences.edit().remove("auth_token").apply()
        }
    }

    androidx.compose.runtime.LaunchedEffect(com.example.model.GlobalState.currentUserId) {
        val userId = com.example.model.GlobalState.currentUserId
        if (userId != null) {
            sharedPreferences.edit().putString("current_user_id", userId).apply()
        } else {
            sharedPreferences.edit().remove("current_user_id").apply()
        }
    }

    val permissionLauncher = androidx.activity.compose.rememberLauncherForActivityResult(
        contract = androidx.activity.result.contract.ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        if (permissions[android.Manifest.permission.READ_CONTACTS] == true) {
            val phoneContacts = com.example.utils.ContactsHelper.fetchContacts(context)
            phoneContacts.forEach { 
                if (!com.example.model.GlobalState.phoneNumbersToSync.contains(it)) {
                    com.example.model.GlobalState.phoneNumbersToSync.add(it)
                }
            }
        }
    }

    androidx.compose.runtime.LaunchedEffect(isOnboardingComplete.value) {
        if (isOnboardingComplete.value) {
            val permissionsToRequest = mutableListOf(
                android.Manifest.permission.CAMERA,
                android.Manifest.permission.RECORD_AUDIO,
                android.Manifest.permission.READ_CONTACTS
            )
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
                permissionsToRequest.add(android.Manifest.permission.READ_MEDIA_IMAGES)
                permissionsToRequest.add(android.Manifest.permission.READ_MEDIA_VIDEO)
                permissionsToRequest.add(android.Manifest.permission.READ_MEDIA_AUDIO)
            } else {
                permissionsToRequest.add(android.Manifest.permission.READ_EXTERNAL_STORAGE)
            }
            permissionLauncher.launch(permissionsToRequest.toTypedArray())
            
            // Also trigger fetch on dynamic login completion transitions
            com.example.network.AqualynRepository.fetchUserProfile("me")
            com.example.network.AqualynRepository.fetchChats()
        }
    }

    val startDest = if (isOnboardingComplete.value) Routes.MAIN else Routes.WELCOME

    Box(modifier = Modifier.fillMaxSize()) {
        NavHost(navController = navController, startDestination = startDest) {
            composable(Routes.WELCOME) {
                WelcomeScreen(
                    onLoginSuccess = {
                        navController.navigate(Routes.JOIN)
                    }
                )
            }
            composable(Routes.JOIN) {
                JoinScreen(
                    onContinue = { phone ->
                        navController.navigate("${Routes.VERIFY}/$phone")
                    },
                    onGoogleSuccess = { isComplete ->
                        if (isComplete) {
                            sharedPreferences.edit().putBoolean("onboarding_complete", true).apply()
                            isOnboardingComplete.value = true
                            navController.navigate(Routes.MAIN) {
                                popUpTo(0) { inclusive = true }
                            }
                        } else {
                            navController.navigate(Routes.COMPLETE_PROFILE) {
                                popUpTo(Routes.JOIN) { inclusive = true }
                            }
                        }
                    }
                )
            }
            composable("${Routes.VERIFY}/{phone}") { backStackEntry ->
                val phone = backStackEntry.arguments?.getString("phone") ?: ""
                VerificationScreen(
                    phone = phone,
                    onVerified = { isComplete ->
                        if (isComplete) {
                            sharedPreferences.edit().putBoolean("onboarding_complete", true).apply()
                            isOnboardingComplete.value = true
                            navController.navigate(Routes.MAIN) {
                                popUpTo(0) { inclusive = true }
                            }
                        } else {
                            navController.navigate(Routes.COMPLETE_PROFILE) {
                                popUpTo(Routes.JOIN) { inclusive = true }
                            }
                        }
                    }
                )
            }
            composable(Routes.COMPLETE_PROFILE) {
                CompleteProfileScreen(
                    onComplete = {
                        sharedPreferences.edit().putBoolean("onboarding_complete", true).apply()
                        isOnboardingComplete.value = true
                        navController.navigate(Routes.MAIN) {
                            popUpTo(Routes.WELCOME) { inclusive = true }
                        }
                    }
                )
            }
            composable(Routes.MAIN) {
                MainLayoutScreen(
                    onChatClick = { chatId ->
                        navController.navigate("${Routes.CHAT_DETAIL}/$chatId")
                    },
                    onUserClick = { userId ->
                        navController.navigate("${Routes.FRIEND_PROFILE}/$userId")
                    },
                    onNewChatClick = {
                        navController.navigate(Routes.NEW_CHAT)
                    },
                    onNotificationsClick = {
                        navController.navigate(Routes.NOTIFICATIONS)
                    },
                    onLogout = {
                        com.example.model.GlobalState.authToken = null
                        com.example.model.GlobalState.currentUserId = null
                        com.example.model.GlobalState.currentUserProfile = null
                        sharedPreferences.edit().putBoolean("onboarding_complete", false).apply()
                        isOnboardingComplete.value = false
                        navController.navigate(Routes.WELCOME) {
                            popUpTo(Routes.MAIN) { inclusive = true }
                        }
                    }
                )
            }
            composable("${Routes.CHAT_DETAIL}/{chatId}") { backStackEntry ->
                val chatId = backStackEntry.arguments?.getString("chatId") ?: "1"
                ChatDetailScreen(
                    userId = chatId,
                    onBack = { navController.popBackStack() },
                    onProfileClick = { friendId ->
                        navController.navigate("${Routes.FRIEND_PROFILE}/$friendId")
                    }
                )
            }
            composable("${Routes.FRIEND_PROFILE}/{friendId}") { backStackEntry ->
                val friendId = backStackEntry.arguments?.getString("friendId") ?: "1"
                FriendProfileScreen(
                    friendId = friendId,
                    onBack = { navController.popBackStack() },
                    onStartSecretChat = { chatId ->
                        navController.navigate("${Routes.CHAT_DETAIL}/$chatId")
                    }
                )
            }
            composable(Routes.NEW_CHAT) {
                NewChatScreen(
                    onBack = { navController.popBackStack() },
                    onChatCreated = { chatId ->
                        navController.popBackStack()
                        navController.navigate("${Routes.CHAT_DETAIL}/$chatId")
                    }
                )
            }
            composable(Routes.NOTIFICATIONS) {
                ActivityNotificationsScreen(
                    onBack = { navController.popBackStack() },
                    onUserClick = { friendId ->
                        navController.navigate("${Routes.FRIEND_PROFILE}/$friendId")
                    }
                )
            }
        }

        // Aqua Niche Notification Banner
        AquaticToastNotification()
    }
}

@Composable
fun MainLayoutScreen(
    onChatClick: (String) -> Unit,
    onUserClick: (String) -> Unit,
    onNewChatClick: () -> Unit,
    onNotificationsClick: () -> Unit,
    onLogout: () -> Unit
) {
    var currentTab by remember { mutableStateOf(MainTabs.CHATS) }
    var openPostCreatorTrigger by remember { mutableStateOf(false) }
    var showEditProfileInProfileTab by remember { mutableStateOf(false) }

    Scaffold(
        bottomBar = {
            AqualynBottomNavBar(
                currentTab = currentTab,
                onTabSelected = { currentTab = it }
            )
        }
    ) { padding ->
        Box(modifier = Modifier
            .fillMaxSize()
            .padding(padding)
        ) {
            AnimatedContent(
                targetState = currentTab,
                transitionSpec = {
                    fadeIn(animationSpec = tween(220)) togetherWith fadeOut(animationSpec = tween(220))
                },
                label = "TabTransition",
                modifier = Modifier.fillMaxSize()
            ) { targetTab ->
                when (targetTab) {
                    MainTabs.CHATS -> ChatsScreen(
                        onChatClick = onChatClick,
                        onNewChatClick = onNewChatClick,
                        onProfileClick = { currentTab = MainTabs.PROFILE },
                        onFriendProfileClick = onUserClick
                    )
                    MainTabs.CONTACTS -> ConnectionsScreen(onUserClick = onUserClick, onChatClick = onChatClick)
                    MainTabs.FEED -> FeedScreen(
                        onChatRedirect = { currentTab = MainTabs.CHATS },
                        onNotificationsClick = onNotificationsClick,
                        initiallyOpenPostCreator = openPostCreatorTrigger,
                        onPostCreatorDismissed = { openPostCreatorTrigger = false }
                    )
                    MainTabs.SETTINGS -> SettingsScreen(onLogout = onLogout)
                    MainTabs.PROFILE -> {
                        if (showEditProfileInProfileTab) {
                            EditProfileScreen(
                                onBack = { showEditProfileInProfileTab = false },
                                onSave = { showEditProfileInProfileTab = false }
                            )
                        } else {
                            ProfileScreen(
                                onBack = { currentTab = MainTabs.CHATS },
                                onEditProfile = { showEditProfileInProfileTab = true },
                                onAddPost = {
                                    openPostCreatorTrigger = true
                                    currentTab = MainTabs.FEED
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}
