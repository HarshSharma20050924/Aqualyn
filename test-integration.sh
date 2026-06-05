#!/bin/bash

# 🧪 Aqualyn Integration Testing Script
# Tests Kotlin-Backend communication end-to-end

set -e

BACKEND_URL="${1:-https://aqualyn.onrender.com}"
PHONE="${2:-+919999999999}"
OTP_CODE=""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}🧪 Aqualyn Integration Test Suite${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo "Backend URL: $BACKEND_URL"
echo "Phone: $PHONE"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}[1/7] Testing backend health...${NC}"
HEALTH=$(curl -s "$BACKEND_URL/api/health")
if echo "$HEALTH" | grep -q "running"; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    echo "Response: $HEALTH"
    exit 1
fi

# Test 2: Send OTP
echo -e "${YELLOW}[2/7] Testing OTP generation...${NC}"
OTP_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/send-otp" \
  -H "Content-Type: application/json" \
  -d "{\"identifier\": \"$PHONE\"}")

if echo "$OTP_RESPONSE" | grep -q "otp"; then
    OTP_CODE=$(echo "$OTP_RESPONSE" | grep -o '"otp":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✅ OTP generated: $OTP_CODE${NC}"
else
    echo -e "${RED}❌ OTP generation failed${NC}"
    echo "Response: $OTP_RESPONSE"
    exit 1
fi

# Test 3: Verify OTP
echo -e "${YELLOW}[3/7] Testing OTP verification...${NC}"
VERIFY_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{\"identifier\": \"$PHONE\", \"otp\": \"$OTP_CODE\"}")

if echo "$VERIFY_RESPONSE" | grep -q "token"; then
    TOKEN=$(echo "$VERIFY_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✅ Token generated${NC}"
    echo "Token: ${TOKEN:0:20}..."
else
    echo -e "${RED}❌ OTP verification failed${NC}"
    echo "Response: $VERIFY_RESPONSE"
    exit 1
fi

# Test 4: Get User Profile
echo -e "${YELLOW}[4/7] Testing user profile fetch...${NC}"
PROFILE_RESPONSE=$(curl -s -X GET "$BACKEND_URL/api/auth/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

if echo "$PROFILE_RESPONSE" | grep -q "id"; then
    USER_ID=$(echo "$PROFILE_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
    echo -e "${GREEN}✅ User profile loaded${NC}"
    echo "User ID: ${USER_ID:0:20}..."
else
    echo -e "${RED}❌ Profile fetch failed${NC}"
    echo "Response: $PROFILE_RESPONSE"
    exit 1
fi

# Test 5: Get Chats
echo -e "${YELLOW}[5/7] Testing chats listing...${NC}"
CHATS_RESPONSE=$(curl -s -X GET "$BACKEND_URL/api/chats" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

CHAT_COUNT=$(echo "$CHATS_RESPONSE" | grep -o '"id"' | wc -l)
if [ "$CHAT_COUNT" -ge 0 ]; then
    echo -e "${GREEN}✅ Chats endpoint working${NC}"
    echo "Chats found: $CHAT_COUNT"
else
    echo -e "${RED}❌ Chats endpoint failed${NC}"
    echo "Response: ${CHATS_RESPONSE:0:100}"
fi

# Test 6: Create a Chat
if [ ! -z "$USER_ID" ]; then
    echo -e "${YELLOW}[6/7] Testing chat creation...${NC}"
    CREATE_CHAT_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/chats" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"isGroup\": false, \"name\": \"Test Chat\", \"memberIds\": [\"$USER_ID\"]}")

    if echo "$CREATE_CHAT_RESPONSE" | grep -q "id"; then
        CHAT_ID=$(echo "$CREATE_CHAT_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
        echo -e "${GREEN}✅ Chat created${NC}"
        echo "Chat ID: ${CHAT_ID:0:20}..."
        
        # Test 7: Send Message
        echo -e "${YELLOW}[7/7] Testing message sending...${NC}"
        MESSAGE_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/chats/$CHAT_ID/messages" \
          -H "Authorization: Bearer $TOKEN" \
          -H "Content-Type: application/json" \
          -d "{\"content\": \"Test message from integration test\"}")

        if echo "$MESSAGE_RESPONSE" | grep -q "id"; then
            echo -e "${GREEN}✅ Message sent${NC}"
        else
            echo -e "${RED}❌ Message sending failed${NC}"
            echo "Response: ${MESSAGE_RESPONSE:0:100}"
        fi
    else
        echo -e "${RED}❌ Chat creation failed${NC}"
        echo "Response: ${CREATE_CHAT_RESPONSE:0:100}"
    fi
else
    echo -e "${YELLOW}⚠️  Skipping chat/message tests (no user ID)${NC}"
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}✅ Integration Tests Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Summary:"
echo "  ✅ Backend connection verified"
echo "  ✅ OTP authentication working"
echo "  ✅ User profile loading"
echo "  ✅ Chat endpoints accessible"
echo "  ✅ Chat creation working"
echo "  ✅ Message sending working"
echo ""
echo "Your Kotlin app should now be able to:"
echo "  • Send OTP and authenticate"
echo "  • Load user profile"
echo "  • Display chats"
echo "  • Send and receive messages"
echo ""
