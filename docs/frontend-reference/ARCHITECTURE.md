# Aqualyn Frontend Component Reference

## App.tsx - Main Application Component

### Purpose
Root component that manages application state, routing, theming, and screen navigation.

### Key Features
- Theme management (light/dark modes, accent colors, bubble styles, font sizes, aqua intensity)
- App lock screen with PIN protection
- Animated screen transitions using Framer Motion
- Firebase authentication redirect handling
- Dynamic screen routing based on authentication state

### Imports
- React, useState, useEffect
- AnimatePresence from motion/react
- All screen components (LoginScreen, ChatListScreen, etc.)
- UI components (ToastContainer, AppLockScreen, CallOverlay)
- App context (useAppContext)
- API endpoints configuration
- Firebase authentication utilities

### State & Effects
- currentScreen: Tracks which screen to display
- useAppContext: Accesses global state (currentUser, theme, aquaIntensity, etc.)
- Theme application effects: Updates CSS variables based on theme settings
- Google auth redirect handler: Processes Firebase authentication results
- Authentication state watcher: Switches between login and main app based on user status

### Theme Usage
- Sets CSS variables for secondary colors, font sizes
- Applies dark mode class to document element
- Configures bubble style (rounded, sharp, glass)
- Controls aqua intensity visual effect

### Screen Routing
Manages navigation between:
- Login
- Feed
- Chats (chat list)
- Chat Detail
- Profile
- Settings
- Contacts
- Edit Profile
- Contact Profile
- Notifications

### Props Interface
None (root component)

### Usage
Entry point of the application, rendered in index.html

## Screens Reference

### LoginScreen.tsx
Handles user authentication with email/password and social providers

### ChatListScreen.tsx
Displays list of conversations with recent messages and notifications

### ChatDetailScreen.tsx
Shows conversation thread with messaging capabilities

### ProfileScreen.tsx
Displays user profile information and statistics

### SettingsScreen.tsx
Manages application preferences, theme customization, privacy settings

### ContactsScreen.tsx
Browse and manage user contacts

### EditProfileScreen.tsx
Allows users to modify profile information

### ContactProfileScreen.tsx
View detailed information about specific contacts

### NotificationsScreen.tsx
Display system and social notifications

### FeedScreen.tsx
Main social feed with posts from followed users

### DiscoveryScreen.tsx
Explore new content and users

### StoriesScreen.xaml
View and create temporary story content

## Components Reference

### UI Components
- ToastContainer: Notification system
- ConfirmDialog: Modal for important actions
- AppLockScreen: PIN protection overlay
- CallOverlay: Active call interface

### Chat Components
- MessageBubble: Individual chat message styling
- MediaAttachmentPicker: File/media selection for messages
- AudioRecorderUI: Voice message recording
- CameraUI: In-app camera capture
- ShareContactModal: Contact sharing interface
- NewChatModal: Start new conversations
- DeleteChatDialog: Conversation deletion confirmation

### Post Components
- PostCreator: Create new social posts
- PostCard: Display individual posts in feed
- PostViewer: Full-screen post detail view

### Social Components
- UserListModal: Browse and select users
- StoryCreator: Create temporary story content
- StoryViewer: View stories from other users

### Navigation
- BottomNav: Tab-based navigation for main screens

## Context & State Management

### AppContext.tsx
Global state management for:
- Authentication status (currentUser, isLoading)
- Theme preferences (mode, accentColor, bubbleStyle, fontSize)
- App lock state (isAppLocked, appLockPin)
- Aqua intensity visual effect
- User actions dispatcher (useAppActions)

### useAppActions.ts
Action creators for modifying global state:
- Authentication actions (login, logout, update profile)
- Theme customization functions
- App lock controls
- Navigation helpers

## Configuration

### api.ts
REST API endpoint definitions:
- AUTH_SYNC: Firebase token synchronization
- USER endpoints: Profile management
- POST endpoints: Feed and content operations
- CHAT endpoints: Messaging functionality
- STORY endpoints: Temporary content
- NOTIFICATION endpoints: Alert system
- CONTACT endpoints: Social graph management
- UPLOAD endpoints: Media file handling

### firebase.ts
Firebase initialization and authentication setup

## Styling & Theme System

### CSS Variables
- --color-secondary: Accent color from theme
- --color-secondary-container: Accent color with opacity
- --color-on-secondary-container: Text color for secondary containers
- --aqua-intensity: Visual effect intensity percentage
- Font size: Based on theme.fontSize setting

### Theme Properties
- mode: 'light' | 'dark'
- accentColor: Hex color string
- bubbleStyle: 'rounded' | 'sharp' | 'glass'
- fontSize: Number (pixels)
- aquaIntensity: Number (0-100 percentage)

## Migration to Kotlin/Jetpack Compose Considerations

### Architecture Mapping
- React Components → @Composable functions
- React Context → ViewModel with StateFlow
- useState/useEffect → remember + LaunchedEffect
- Framer Motion → AnimatedVisibility, updateTransition
- CSS Variables → Material Theme or custom Theme class
- Firebase Auth → Firebase Authentication SDK
- REST APIs → Retrofit or Ktor with coroutines

### Component Conversion Guidelines
1. TSX props → Composable parameters
2. State variables → remember { mutableStateOf(...) }
3. Effects → LaunchedEffect or DisposableEffect
4. Conditional rendering → if statements or when
5. Lists → LazyColumn/LazyRow
6. Navigation → Navigation Compose component
7. Dialogs → AlertDialog or custom Dialog composables
8. Toasts → SnackbarHostState
9. Modals → ModalBottomSheet or Dialog
10. Images → AsyncImage or Coil for loading

### Theme Implementation
- Create custom Theme class with light/dark variants
- Use MaterialTheme or build custom theming system
- Map CSS variables to theme properties
- Implement dynamic theme switching

### State Management
- Replace useAppContext with ViewModel
- Convert useAppActions to ViewModel methods
- Use StateFlow for observable state
- Handle lifecycle with viewModelScope

This reference provides a comprehensive overview of the Aqualyn frontend architecture for migration to Kotlin/Jetpack Compose.