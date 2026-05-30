# Aqualyn Data Models & Route Validation Reference

This document provides a comprehensive technical overview of the data models (Prisma-based) and the expected request/response schemas for the Aqualyn backend routes. It serves as a reference for aligning the Kotlin and React frontends.

---

## 1. Core Data Models

Below is the mapping from the backend Prisma schema to standard models.

### User
```typescript
interface User {
  id: string;               // UUID
  phone?: string;
  email?: string;
  firebaseUid?: string;
  username?: string;
  displayName?: string;
  dob?: string;             // ISO Date String (YYYY-MM-DD)
  avatar?: string;          // URL or base64
  bio?: string;
  appLockPin?: string;      // Hashed PIN
  isPrivate: boolean;       // Default: false
  searchByPhone: boolean;   // Default: true
  showPhoneTo: string;      // "everyone" | "contacts" | "nobody"
  invitationSettings: string; // "everyone" | "contacts"
  createdAt: string;
  updatedAt: string;
}
```

### Chat & Participant
```typescript
interface Chat {
  id: string;
  name?: string;            // Null for 1-on-1 chats (derived from participant)
  isGroup: boolean;
  isSecret: boolean;
  avatar?: string;
  selfDestructTimer: number; // In seconds (0 = disabled)
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface ChatParticipant {
  id: string;
  chatId: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  status: "JOINED" | "INVITED" | "DECLINED";
  isArchived: boolean;
  isPinned: boolean;
  joinedAt: string;
}
```

### Message
```typescript
interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
  fileUrl?: string;
  audioUrl?: string;
  document?: Record<string, any>;
  location?: Record<string, any>;
  contact?: Record<string, any>;
  payment?: Record<string, any>;
  schedule?: Record<string, any>;
  wallet?: Record<string, any>;
  replyToId?: string;
  status: "SENT" | "DELIVERED" | "READ";
  isEdited: boolean;
  isRead: boolean;
  isPinned: boolean;
  reactions: Record<string, any>;
  createdAt: string;
}
```

### Social: Post & Story
```typescript
interface Post {
  id: string;
  authorId: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  createdAt: string;
  updatedAt: string;
}

interface Story {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  content?: string;
  createdAt: string;
  expiresAt: string;        // 24 hours after creation
}
```

---

## 2. API Route Body Validation Reference

### Auth Service (`/api/auth`)

*   **`POST /send-otp`**
    *   `identifier`: String (Required). Must be a valid phone number or email address.
*   **`POST /verify-otp`**
    *   `identifier`: String (Required).
    *   `otp`: String (Required). Must be a 6-digit code.
*   **`POST /sync`**
    *   `displayName`: String (Optional).
    *   `username`: String (Optional). Minimum 3 characters, alphanumeric plus underscores.
    *   `dob`: Date String (Optional). Format: `YYYY-MM-DD`.
    *   `avatar`: String (Optional). URL or base64 encoded image.

### User Service (`/api/user`)

*   **`POST /follow` / `POST /unfollow`**
    *   `targetUserId`: String (Required). The target user's UUID.
*   **`POST /follow-request/handle`**
    *   `requestId`: String (Optional if `senderId` is provided).
    *   `senderId`: String (Optional if `requestId` is provided).
    *   `action`: String (Required). Value must be `"accept"` or `"reject"`.
*   **`POST /block` / `POST /report`**
    *   `targetUserId`: String (Required).
    *   `reason`: String (Required for report only).
*   **`PATCH /privacy`**
    *   `invitationSettings`: String (Optional). `"everyone"` | `"contacts"`.
    *   `showPhoneTo`: String (Optional). `"everyone"` | `"contacts"` | `"nobody"`.
    *   `searchByPhone`: Boolean (Optional).
    *   `isPrivate`: Boolean (Optional).
*   **`POST /upload-avatar`**
    *   `avatar`: String (Required). Image URL or base64 data.
*   **`POST /contacts/sync`**
    *   `phones`: Array of Strings (Required). E.g., `["+1234567890", "+9876543210"]`.
*   **`POST /pin/set` / `POST /pin/verify`**
    *   `pin`: String (Required). Must be a 4-digit numeric string.

### Chat Service (`/api/chats`)

*   **`POST /:chatId/messages`**
    *   `content`: String (Required). The message text body.
    *   `replyToId`: String (Optional). Parent message UUID for replies.
*   **`POST /:chatId/messages/:messageId/reactions`**
    *   `reactions`: Object (Required). Key-value pair of user IDs and emoji reactions.
*   **`PATCH /:chatId/settings`**
    *   `settings`: Object (Optional). Chat settings configuration.
    *   `selfDestructTimer`: Integer (Optional). Timer in seconds.
*   **`POST /secret/request`**
    *   `targetUserId`: String (Required). Participant user ID.
*   **`POST /secret/handle`**
    *   `chatId`: String (Required).
    *   `action`: String (Required). Value must be `"accept"` or `"decline"`.
*   **`POST /folders`**
    *   `name`: String (Required). Folder name.
    *   `chatIds`: Array of Strings (Optional). List of chat IDs to group.

### Social Service (`/api/social`)

*   **`POST /post`**
    *   `content`: String (Optional if media is present).
    *   `mediaUrl`: String (Optional).
    *   `mediaType`: String (Required if `mediaUrl` is present). `"image"` | `"video"`.
*   **`PATCH /post/:postId`**
    *   `content`: String (Required). The new text content.
*   **`POST /story`**
    *   `mediaUrl`: String (Required).
    *   `mediaType`: String (Required). `"image"` | `"video"`.
    *   `content`: String (Optional).
*   **`POST /post/:postId/comment`**
    *   `content`: String (Required). The text of the comment.

### Group Service (`/api/groups`)

*   **`POST /create`**
    *   `name`: String (Required). Name of the group.
    *   `participantIds`: Array of Strings (Optional). Users to invite.
    *   `description`: String (Optional). Group description.
*   **`PATCH /:id/settings`**
    *   `settings`: Object (Required).
*   **`POST /:id/member/:targetId/role`**
    *   `role`: String (Required). `"ADMIN"` | `"MEMBER"`.
*   **`POST /:chatId/invitation/handle`**
    *   `action`: String (Required). `"accept"` | `"decline"`.
