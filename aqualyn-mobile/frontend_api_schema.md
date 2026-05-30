# Aqualyn Frontend-to-Backend API Schema Contract

This schema defines all the endpoints and JSON structures requested by the Aqualyn frontend. It covers Auth, User Directory, Profile customization, Social Posts, Highlights, Security, and Chat/Group sessions to facilitate 100% accurate backend development.

---

## 1. Authentication & Session Services

### 1.1 Send OTP Code
- **Endpoint**: `POST /api/auth/send-otp`
- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "phoneNumber": "+919876543210"
  }
  ```
- **Response** (Success): `200 OK`
  ```json
  {
    "success": true,
    "message": "OTP sent successfully"
  }
  ```

### 1.2 Verify OTP Code
- **Endpoint**: `POST /api/auth/verify-otp`
- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "phoneNumber": "+919876543210",
    "code": "123456"
  }
  ```
- **Response** (Success): `200 OK`
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "u-93821",
      "username": "aqua_dev",
      "fullName": "Aqua Developer",
      "phoneNumber": "+919876543210",
      "role": "Moderator",
      "description": "Designing future fluid webs",
      "followersCount": 450,
      "followingCount": 182
    }
  }
  ```

### 1.3 Account Identity Sync
- **Endpoint**: `POST /api/auth/sync`
- **Request Headers**: `Authorization: Bearer <token>`
- **Request Body**: *(Empty)*
- **Response** (Success): `200 OK`
  ```json
  {
    "id": "u-93821",
    "username": "aqua_dev",
    "fullName": "Aqua Developer",
    "phoneNumber": "+919876543210",
    "role": "Moderator",
    "description": "Designing future fluid webs",
    "followersCount": 450,
    "followingCount": 182
  }
  ```

---

## 2. Directory & User Synced Operations

### 2.1 Contacts Sync Lookup
- **Endpoint**: `POST /api/user/sync-contacts`
- **Request Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "phoneNumbers": [
      "+91 98765 43210",
      "+91 91111 22222"
    ]
  }
  ```
- **Response** (Success): `200 OK`
  - Array of matched registered user profiles.
  ```json
  [
    {
      "id": "u-101",
      "username": "raj_1034",
      "fullName": "Raj Sharma",
      "phoneNumber": "+91 98765 43210",
      "role": "Developer",
      "description": "Wave systems",
      "followersCount": 1420,
      "followingCount": 182
    }
  ]
  ```

### 2.2 Get Followers List
- **Endpoint**: `GET /api/user/followers`
- **Request Headers**: `Authorization: Bearer <token>`
- **Response** (Success): `200 OK`
  ```json
  [
    {
      "id": "u-102",
      "username": "harsh_7742",
      "fullName": "Harsh Vardhan",
      "phoneNumber": "+91 91111 22222",
      "role": "Designer",
      "description": "Bioluminescent shadows",
      "followersCount": 852,
      "followingCount": 345
    }
  ]
  ```

### 2.3 Get Following List
- **Endpoint**: `GET /api/user/following`
- **Request Headers**: `Authorization: Bearer <token>`
- **Response** (Success): `200 OK`
  ```json
  [
    {
      "id": "u-103",
      "username": "bhavya_xx",
      "fullName": "Bhavya Goel",
      "phoneNumber": "+91 88888 77777",
      "role": "Creative Lead",
      "description": "Stardust and oceans",
      "followersCount": 2109,
      "followingCount": 450
    }
  ]
  ```

---

## 3. Social Media, Comments & Insights

### 3.1 Fetch Main Feed Posts
- **Endpoint**: `GET /api/posts`
- **Request Headers**: `Authorization: Bearer <token>`
- **Response** (Success): `200 OK`
  ```json
  [
    {
      "id": "post-921",
      "userId": "u-102",
      "username": "harsh_7742",
      "caption": "Liquid gradients in action! 📱💡",
      "imageUrl": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
      "avatarUrl": "",
      "location": "Aqualine Studio, CA",
      "likeCount": 35,
      "isLikedByMe": true,
      "comments": [
        {
          "username": "raj_1034",
          "text": "Splendid glass aesthetics! ✨🌊"
        }
      ]
    }
  ]
  ```

### 3.2 Publish Feed Post
- **Endpoint**: `POST /api/posts`
- **Request Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "caption": "Designing with real-world fluid dynamic layouts!",
    "imageUrl": "https://images.unsplash.com/photo-sample",
    "location": "Mumbai, India"
  }
  ```
- **Response** (Success): `201 Created`
  ```json
  {
    "id": "post-922",
    "username": "aqua_dev",
    "caption": "Designing with real-world fluid dynamic layouts!",
    "imageUrl": "https://images.unsplash.com/photo-sample",
    "location": "Mumbai, India",
    "likeCount": 0,
    "isLikedByMe": false,
    "comments": []
  }
  ```

### 3.3 Get Dynamic User Highlight Media
- **Endpoint**: `GET /api/posts/user/{userId}`
- **Request Headers**: `Authorization: Bearer <token>`
- **Response** (Success): `200 OK`
  - Returns array of specific user's posts.

---

## 4. Chats, Dialog Rooms & Connections

### 4.1 Fetch Available Rooms / Chats
- **Endpoint**: `GET /api/chats`
- **Request Headers**: `Authorization: Bearer <token>`
- **Response** (Success): `200 OK`
  ```json
  [
    {
      "id": "c_u-101",
      "isGroup": false,
      "groupName": "",
      "user": {
        "id": "u-101",
        "username": "raj_1034",
        "fullName": "Raj Sharma"
      },
      "lastMessage": "Direct Message started!",
      "timeInfo": "10:30 AM"
    }
  ]
  ```

### 4.2 Create Chat or Group Session
- **Endpoint**: `POST /api/chats`
- **Request Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "isGroup": true,
    "name": "Design Team Room",
    "memberIds": ["u-101", "u-102", "u-103"]
  }
  ```
- **Response** (Success): `201 Created`
  ```json
  {
    "id": "g-8201",
    "isGroup": true,
    "groupName": "Design Team Room",
    "user": null,
    "lastMessage": "Group Session created successfully",
    "timeInfo": "Just now"
  }
  ```

### 4.3 Send Instant Message
- **Endpoint**: `POST /api/chats/{chatId}/messages`
- **Request Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "text": "Hello Ocean! Let's build.",
    "isEncrypted": true
  }
  ```
- **Response** (Success): `200 OK`
  ```json
  {
    "id": "msg-lk12",
    "senderId": "u-93821",
    "text": "Hello Ocean! Let's build.",
    "timestamp": 1780063769000,
    "isEncrypted": true
  }
  ```
