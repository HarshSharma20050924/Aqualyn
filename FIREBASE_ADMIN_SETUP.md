# Firebase Admin Panel Setup Guide

## Overview
The admin panel now uses **Firebase Authentication** (matching your webapp). Admin users can log in with their Firebase email/password and manage the entire Aqualyn backend.

## Prerequisites
- Firebase project created and configured
- Backend deployed (Render or local)
- Admin user created in Firebase Console

## Setup Steps

### 1. Get Your Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (likely `aqualyn-app`)
3. Navigate to **Project Settings** (gear icon, top-left)
4. Copy these values from the **Web API Key** section:

```
- API Key               (apiKey)
- Auth Domain           (authDomain)
- Project ID            (projectId)
- Storage Bucket        (storageBucket)
- Messaging Sender ID   (messagingSenderId)
- App ID                (appId)
```

### 2. Configure the Admin Panel

The admin panel is located at:
```
https://aqualyn.onrender.com/admin-panel.html  (Production)
http://localhost:5000/admin-panel.html         (Development)
```

There are **3 ways** to provide Firebase credentials:

#### Option A: Session Storage (Recommended for Security)
Before opening the admin panel, run in browser console:
```javascript
// Set these from your Firebase Console
sessionStorage.setItem('firebaseApiKey', 'YOUR_API_KEY');
sessionStorage.setItem('firebaseAuthDomain', 'YOUR_AUTH_DOMAIN');
sessionStorage.setItem('firebaseProjectId', 'YOUR_PROJECT_ID');
sessionStorage.setItem('firebaseStorageBucket', 'YOUR_STORAGE_BUCKET');
sessionStorage.setItem('firebaseMessagingSenderId', 'YOUR_MESSAGING_SENDER_ID');
sessionStorage.setItem('firebaseAppId', 'YOUR_APP_ID');
```

Then open `/admin-panel.html` → Firebase will load with these credentials.

#### Option B: Edit HTML (Quick Setup)
Edit the admin panel file and replace placeholders in the script:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

#### Option C: Environment Variables (Production)
Set these in your Render/deployment environment:
```
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
...etc
```

Then the backend can inject them via a config endpoint.

### 3. Create/Enable Admin User in Firebase

1. Go to Firebase Console → **Authentication**
2. Enable **Email/Password** sign-in method if not already enabled
3. Go to **Users** tab
4. **Add user** with email/password combo
5. Note this email for admin login

### 4. Set Admin Role in Database

After the user logs in once, they'll be auto-provisioned in your database. Then run:

```sql
-- Via Prisma CLI:
npx prisma studio

-- Then find the user and set:
UPDATE "User" SET role = 'admin' WHERE email = 'admin@example.com';
```

Or use the backend CLI:
```bash
# From backend directory
npx prisma db execute --stdin < update_admin.sql
```

### 5. Login to Admin Panel

1. Open `/admin-panel.html`
2. Enter your Firebase email and password
3. Click **Login with Firebase**
4. You should see the dashboard

## Admin Functions Available

After login, you can:

| Function | Endpoint | Purpose |
|----------|----------|---------|
| **View Stats** | GET `/admin/stats` | Dashboard KPIs (users, chats, messages) |
| **List Users** | GET `/admin/users?page=1&limit=10` | View all users with pagination |
| **Delete User** | DELETE `/admin/users/{id}` | Remove user and cascade delete data |
| **Ban User** | POST `/admin/users/{id}/ban` | Ban a user from the platform |
| **List Chats** | GET `/admin/chats?page=1&limit=10` | View all chats |
| **View Chat** | GET `/admin/chats/{id}` | See chat details and messages |
| **Delete Chat** | DELETE `/admin/chats/{id}` | Soft-delete a chat |
| **List Posts** | GET `/admin/posts?page=1&limit=10` | View all user posts |
| **Delete Post** | DELETE `/admin/posts/{id}` | Remove a post |
| **Cleanup Sessions** | POST `/admin/cleanup-sessions` | Delete expired sessions |
| **Analytics** | GET `/admin/analytics` | 7-day activity trends |
| **Hard Reset** | POST `/admin/reset-database` | 🚨 Delete ALL data (requires confirmation) |

## Troubleshooting

### Firebase SDK Not Loading
**Error**: "Firebase is not defined"
- **Solution**: Check Firebase CDN is accessible
- Open DevTools → Network tab → verify these load:
  - `firebase-app.js`
  - `firebase-auth.js`

### "Firebase not configured" Message
- **Cause**: Credentials not properly set
- **Solution**: Run Option A (sessionStorage) or Option B (edit HTML)

### 401 Unauthorized on API Calls
- **Cause**: Firebase token invalid or user not admin
- **Solution**: 
  1. Verify user has `role = 'admin'` in database
  2. Check Firebase token not expired (try logout/login)
  3. Check backend auth middleware logs: `heroku logs --app aqualyn-backend -t`

### "Admin access required" Error
- **Cause**: User exists but role is not "admin"
- **Solution**: Update user role in database to "admin"

## Development Mode

For local development:
```bash
# Start backend
cd backend
npm install
npm run dev

# Serve admin panel
# Open: http://localhost:5000/admin-panel.html
```

Set local Firebase credentials:
```javascript
// In browser console before opening admin panel
sessionStorage.setItem('firebaseApiKey', 'YOUR_DEV_API_KEY');
// ... etc for all 6 fields
```

## Production Deployment (Render)

The admin panel is automatically served from:
```
https://aqualyn.onrender.com/admin-panel.html
```

If not accessible:
1. Verify `backend/public/admin-panel.html` exists
2. Check it's served by Express: `app.use(express.static('public'));`
3. Verify not behind authentication middleware

## Security Notes

⚠️ **Important**:
1. Only share admin credentials with trusted team members
2. Use strong, unique passwords
3. Never commit Firebase API keys to Git
4. Use Session Storage (Option A) for temporary admin sessions
5. Regularly rotate admin user credentials
6. Monitor admin activity in backend logs

## Testing Admin Functions

```bash
# Test admin stats endpoint
curl -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  https://aqualyn.onrender.com/api/admin/stats

# Test list users
curl -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  https://aqualyn.onrender.com/api/admin/users
```

## Next Steps

1. ✅ Configure Firebase credentials (Option A/B/C)
2. ✅ Create admin user in Firebase Console
3. ✅ Set user role to "admin" in database
4. ✅ Login to admin panel
5. ✅ Test dashboard functions

Questions? Check:
- Firebase Console → Authentication → Providers
- Backend logs: `heroku logs --app aqualyn-backend --tail`
- Browser DevTools → Console for JS errors
