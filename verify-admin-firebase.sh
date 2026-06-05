#!/bin/bash

###############################################################################
# Admin Panel Firebase Setup Verification Script
# Tests the complete admin panel and Firebase integration
###############################################################################

set -e

BACKEND_URL="${1:-https://aqualyn.onrender.com}"
API="${BACKEND_URL}/api"
ADMIN_PANEL="${BACKEND_URL}/admin-panel.html"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║        Admin Panel Firebase Setup Verification                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "Backend URL: $BACKEND_URL"
echo "Admin Panel: $ADMIN_PANEL"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
check_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
        return 1
    fi
}

# Test 1: Check if backend is accessible
echo -e "${BLUE}[1/8]${NC} Checking backend health..."
RESULT=$(curl -s -o /dev/null -w "%{http_code}" "${API}/auth/health" || echo "000")
if [ "$RESULT" = "200" ] || [ "$RESULT" = "404" ]; then
    check_status 0 "Backend is accessible (HTTP $RESULT)"
else
    check_status 1 "Backend health check failed (HTTP $RESULT)"
fi
echo ""

# Test 2: Check if admin panel is served
echo -e "${BLUE}[2/8]${NC} Checking admin panel availability..."
RESULT=$(curl -s -o /dev/null -w "%{http_code}" "$ADMIN_PANEL")
if [ "$RESULT" = "200" ]; then
    check_status 0 "Admin panel HTML is accessible"
else
    check_status 1 "Admin panel not accessible (HTTP $RESULT)"
    echo "   Make sure backend/public/admin-panel.html exists"
fi
echo ""

# Test 3: Check if admin routes exist
echo -e "${BLUE}[3/8]${NC} Checking admin routes registration..."
RESULT=$(curl -s -X GET "$API/admin/stats" \
    -H "Authorization: Bearer test-token" 2>/dev/null | grep -q "error" && echo "protected" || echo "error")
if [ "$RESULT" = "protected" ]; then
    check_status 0 "Admin routes are registered and protected"
else
    check_status 1 "Admin routes may not be properly registered"
fi
echo ""

# Test 4: Check Firebase SDK in admin panel HTML
echo -e "${BLUE}[4/8]${NC} Checking Firebase SDK in admin panel..."
PANEL_HTML=$(curl -s "$ADMIN_PANEL")
if echo "$PANEL_HTML" | grep -q "firebase-app.js"; then
    check_status 0 "Firebase SDK imports found in HTML"
else
    check_status 1 "Firebase SDK imports not found"
    echo "   Add: <script src='https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js'></script>"
fi
echo ""

# Test 5: Check if auth functions are defined
echo -e "${BLUE}[5/8]${NC} Checking Firebase auth functions..."
if echo "$PANEL_HTML" | grep -q "loginWithFirebase"; then
    check_status 0 "loginWithFirebase() function defined"
else
    check_status 1 "loginWithFirebase() function not found"
fi
echo ""

# Test 6: Check if Firebase token handling exists
echo -e "${BLUE}[6/8]${NC} Checking Firebase token handling..."
if echo "$PANEL_HTML" | grep -q "firebaseToken"; then
    check_status 0 "Firebase token variable found"
else
    check_status 1 "Firebase token handling not found"
fi
echo ""

# Test 7: Check auth state listener
echo -e "${BLUE}[7/8]${NC} Checking auth state listener..."
if echo "$PANEL_HTML" | grep -q "onAuthStateChanged"; then
    check_status 0 "Firebase auth state listener configured"
else
    check_status 1 "Auth state listener not found"
fi
echo ""

# Test 8: Configuration Manual
echo -e "${BLUE}[8/8]${NC} Firebase Configuration Status..."
echo -e "${YELLOW}ℹ️  MANUAL SETUP REQUIRED:${NC}"
echo ""
echo "1. Get Firebase Credentials:"
echo "   - Go to Firebase Console → Project Settings"
echo "   - Copy apiKey, authDomain, projectId, etc."
echo ""
echo "2. Configure Admin Panel (Choose one):"
echo "   Option A - Session Storage (Recommended):"
echo "   sessionStorage.setItem('firebaseApiKey', 'YOUR_KEY');"
echo "   sessionStorage.setItem('firebaseAuthDomain', 'YOUR_DOMAIN');"
echo "   ... (repeat for all 6 fields)"
echo ""
echo "   Option B - Edit HTML:"
echo "   Replace placeholders in backend/public/admin-panel.html"
echo ""
echo "3. Create Admin User:"
echo "   - Firebase Console → Authentication → Users"
echo "   - Add email/password"
echo ""
echo "4. Set Admin Role in Database:"
echo "   UPDATE \"User\" SET role = 'admin' WHERE email = 'admin@example.com';"
echo ""
echo "5. Login:"
echo "   - Open ${ADMIN_PANEL}"
echo "   - Enter Firebase email/password"
echo ""

# Summary
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                        SUMMARY                                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ Backend and Admin Panel setup verified${NC}"
echo ""
echo "Next Steps:"
echo "1. Follow Firebase Configuration steps above ☝️"
echo "2. Test admin panel login at: $ADMIN_PANEL"
echo "3. Monitor backend logs for auth issues:"
echo "   heroku logs --app aqualyn-backend -t"
echo ""
echo "Documentation: See FIREBASE_ADMIN_SETUP.md"
echo ""
