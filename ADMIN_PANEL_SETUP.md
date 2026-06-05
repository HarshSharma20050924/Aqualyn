# 🔐 Admin Panel Setup & Access Guide

## ✅ Admin Panel is Now Live!

Your admin panel is accessible at:
```
https://aqualyn.onrender.com/admin-panel.html
```

Or alternatively:
```
https://aqualyn.onrender.com/admin
```

---

## 🔑 Getting Your Admin Token

### Option 1: Login via Kotlin App (Recommended)

1. **Open your Kotlin app** and login with:
   - Phone: `+919999999999`
   - OTP: Check console (or use test OTP from backend log)

2. **After successful login**, the app receives a JWT token

3. **Get the token from Logcat:**
   ```
   Filter: "GlobalState"
   Look for: authToken = "eyJhbGc..."
   ```

4. **Copy this token** and paste into admin panel login

### Option 2: Create Admin User via Backend

```bash
# First, get any valid token by logging in via Kotlin/API
TOKEN="YOUR_VALID_JWT_TOKEN"

# Promote user to admin (requires existing admin or direct DB access)
# Via Prisma Studio or direct database:
UPDATE users SET role = 'admin' WHERE id = 'USER_ID';
```

### Option 3: Generate Test Token

If you have direct database access:
```bash
# In Prisma Studio or your DB client
1. Create a test user
2. Set role to 'admin'
3. Generate JWT with your JWT_SECRET from .env
```

---

## 🚀 Accessing the Admin Panel

### Step 1: Open Admin Panel
```
https://aqualyn.onrender.com/admin-panel.html
```

### Step 2: Login
1. Paste your JWT token into the "Enter API Token" field
2. Click "Login"
3. Should show dashboard with statistics

### Step 3: Start Managing
- View users, chats, posts
- Delete data
- View analytics
- Cleanup database

---

## 🧪 Testing the Admin Panel Locally

If running backend locally:

```bash
# Terminal 1: Start backend
cd /home/harsh/Aqualyn/backend
npm run dev

# Terminal 2: Access admin panel
# Open: http://localhost:5000/admin-panel.html
# Or: http://127.0.0.1:5000/admin-panel.html
```

---

## 📊 Admin Panel Features

### Dashboard
- **Total Users** - All registered users
- **Active Users** - Last 24 hours
- **Total Chats** - All conversations
- **Total Messages** - System-wide count
- **Total Posts** - Social content count

### Users Tab
**Features:**
- Search by email or name
- View user details
  - Display name
  - Email address
  - Phone number
  - Role (user/admin)
  - Join date
  - Last login
- **Delete User** - Cascades to:
  - All messages sent
  - All posts created
  - All chats participation
  - All follow relationships
  - All notifications
  - All sessions
- **Ban User** - Prevent login
- Pagination support

### Chats Tab
**Features:**
- List all chats with participants
- View last message timestamp
- **Delete Chat** - Removes:
  - All messages in chat
  - Chat participants
  - Chat metadata
- View full message history
- See who participated when

### Posts Tab
**Features:**
- List all posts with content preview
- View author details
- See engagement metrics
  - Likes count
  - Comments count
- **Delete Post** - Removes:
  - Post content
  - All comments
  - All likes
- Creation date

### Maintenance Tab
**Features:**
- **7-Day Analytics**
  - New users joined
  - Total messages sent
  - Posts created
  
- **Cleanup Sessions**
  - Removes sessions older than 30 days
  - Safe operation (doesn't affect current users)
  
- **HARD RESET** (Dangerous!)
  - Deletes ALL chats, messages, posts
  - Deletes ALL stories and notifications
  - Deletes ALL follows and relationships
  - **PRESERVES users** (so you don't lose user accounts)
  - Requires confirmation phrase: `CONFIRM_RESET_ALL_DATA`

---

## 🔒 Security Best Practices

### Do's ✅
- Use strong, random tokens
- Change tokens regularly
- Monitor admin panel usage
- Backup database before bulk operations
- Test in development first
- Use admin role sparingly

### Don'ts ❌
- Never share tokens publicly
- Don't run HARD RESET without backup
- Don't use test credentials in production
- Don't commit tokens to git
- Don't allow untrusted users admin access

---

## 🧪 Troubleshooting Admin Panel

### Error: "Token not valid" or "unauthorized"

**Solutions:**
1. Verify token is valid JWT
   - Visit [jwt.io](https://jwt.io)
   - Paste token to verify format
   - Check expiration time

2. Verify user has admin role
   - In database: `SELECT role FROM users WHERE id = '...';`
   - Should return: `admin`

3. Check token not expired
   - In jwt.io decoder, check "exp" field
   - If timestamp is in past, get new token

4. Verify backend is running
   ```bash
   curl https://aqualyn.onrender.com/api/health
   # Should return: { "status": "Aqualyn server is running" }
   ```

### Error: "API request failed" or "Cannot fetch"

**Solutions:**
1. Check network connection
2. Open DevTools (F12) → Network tab
   - Look for failed requests
   - Check response status codes
3. Check CORS errors in Console
4. Verify API endpoint exists

### Error: "Message port closed before response was received"

**Solutions:**
1. Refresh page (Ctrl+R or Cmd+R)
2. Clear browser cache
3. Try in private/incognito window
4. Check backend logs

### Page loads but no data shows

**Solutions:**
1. Token might not have admin role
   - Check user is promoted to admin
   - Get fresh token from Kotlin app

2. Check backend logs
   ```bash
   heroku logs --app aqualyn-backend -t
   # Look for 401 (Unauthorized) errors
   ```

3. Try health check first
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://aqualyn.onrender.com/api/admin/stats
   ```

---

## 📱 Kotlin App Integration with Admin Panel

### Workflow

1. **User logs in via Kotlin app**
   ```
   Phone/Email → OTP → Token
   ```

2. **Token received in Kotlin app**
   - Stored in GlobalState.authToken
   - See in Logcat: "GlobalState" → "authToken"

3. **Copy token to admin panel**
   - Paste into admin panel login field
   - Click "Login"
   - Dashboard loads

4. **Monitor user in real-time**
   - See user in Users tab
   - See their chats in Chats tab
   - See their posts in Posts tab
   - Delete if needed

---

## 📈 Analytics Example

Sample analytics response (7-day period):
```json
{
  "period": "Last 7 days",
  "newUsers": 15,
  "messages": 342,
  "posts": 28
}
```

---

## 🗑️ Database Operations

### Soft Delete (Archive)
- User marks chat as archived
- Data not truly deleted
- Can be restored

### Hard Delete (Permanent)
- Complete removal from database
- **CANNOT be restored**
- Requires backup for recovery

### Cascade Delete
When deleting user:
```
User (delete)
  ├─ All messages sent
  ├─ All posts created
  ├─ All comments authored
  ├─ Chat participations
  ├─ Follow relationships
  ├─ Notifications
  └─ Sessions
```

---

## 🚀 Production Checklist

- [ ] Admin panel accessible at production URL
- [ ] At least one admin user created
- [ ] Admin tested with real token
- [ ] Database backups configured
- [ ] Logs being monitored
- [ ] Rate limiting considered
- [ ] 2FA considered for admin access
- [ ] Audit logging implemented
- [ ] Regular data cleanup scheduled
- [ ] Incident response plan ready

---

## 📞 Support

### If Admin Panel Doesn't Load:

1. **Check backend is running**
   ```bash
   curl https://aqualyn.onrender.com/api/health
   ```

2. **Check browser console** (F12)
   - Look for errors
   - Check Network tab
   - Save screenshot of errors

3. **Check backend logs**
   ```bash
   heroku logs --app aqualyn-backend --tail
   ```

4. **Try from different browser**
   - Chrome, Firefox, Safari
   - Eliminates browser-specific issues

### If You Forget Admin Token:

1. Get new token by logging in to Kotlin app
2. Or reset database user role manually
3. Or check backend logs for recent tokens

---

## 🎉 You're Ready!

Your admin panel is live and ready to manage your Aqualyn chat application!

**Start by:**
1. Getting your admin token
2. Opening the admin panel URL
3. Logging in with your token
4. Viewing the dashboard
5. Exploring all features

---

**Last Updated:** June 5, 2026  
**Status:** ✅ Admin Panel Live and Operational
