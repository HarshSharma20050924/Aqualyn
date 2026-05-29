# Aqualyn Frontend Reference

## Project Structure
```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── ui/         # Base UI components (toast, dialog, etc.)
│   │   ├── posts/      # Post-related components
│   │   ├── chat/       # Chat-related components
│   │   ├── social/     # Social components (user lists, etc.)
│   │   └── stories/    # Story-related components
│   ├── context/        # React context providers and types
│   ├── screens/        # Screen components (pages)
│   ├── utils/          # Utility functions and services
│   ├── config/         # Configuration (API, Firebase)
│   └── App.tsx         # Main application component
```

## Technology Stack
- **Framework**: React with TypeScript
- **State Management**: React Context API
- **Animations**: Framer Motion
- **Build Tool**: Vite
- **Styling**: CSS with custom properties and theme support
- **Firebase**: Authentication and data synchronization
- **Icons**: Likely using a custom icon system or Material Icons (to be verified)

## Key Features
1. **Authentication**: Firebase auth with Google redirect handling
2. **Theming**: Dynamic theme switching (light/dark) with customizable accent colors, bubble styles, font sizes, and aqua intensity
3. **App Lock**: PIN-based app locking mechanism
4. **Navigation**: Custom navigation with animated screen transitions
5. **Core Screens**:
   - Login
   - Feed (main social feed)
   - Chats (chat list)
   - Chat Detail
   - Profile
   - Settings
   - Contacts
   - Edit Profile
   - Contact Profile
   - Notifications
   - Discovery
   - Stories

## Migration Considerations for Kotlin
When migrating to Kotlin (likely for Android with Jetpack Compose):
1. **State Management**: Replace React Context with ViewModel and StateFlow/LiveData
2. **UI Components**: Convert TSX components to Composable functions
3. **Theming**: Use Material Theme or custom theme system in Compose
4. **Navigation**: Use Jetpack Compose Navigation component
5. **Async Operations**: Replace fetch/coroutines with Kotlin coroutines
6. **Firebase**: Use Firebase Android SDK
7. **Assets**: Convert SVG/PNG assets to Vector Drawables or bitmap assets
