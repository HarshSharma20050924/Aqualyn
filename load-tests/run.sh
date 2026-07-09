#!/bin/bash
# ─────────────────────────────────────────────────────────────────────
# Aqualyn Load Test Runner — 100% FREE using k6 local
# Usage:
#   ./run.sh http          # test REST endpoints
#   ./run.sh socket        # test Socket.IO connections
#   ./run.sh http 5000     # test HTTP with custom max VUs
# ─────────────────────────────────────────────────────────────────────

K6=/home/harsh/.local/bin/k6
TEST=${1:-http}
BASE_URL=${BASE_URL:-https://aqualyn.onrender.com}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORTS_DIR="$(dirname "$0")/reports"
mkdir -p "$REPORTS_DIR"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 Aqualyn Load Test"
echo "  Target: $BASE_URL"
echo "  Mode:   $TEST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$TEST" = "http" ]; then
  $K6 run \
    -e BASE_URL="$BASE_URL" \
    --out json="$REPORTS_DIR/http-$TIMESTAMP.json" \
    --summary-export="$REPORTS_DIR/http-summary-$TIMESTAMP.json" \
    "$(dirname "$0")/test-http.js"

elif [ "$TEST" = "socket" ]; then
  $K6 run \
    -e BASE_URL="$(echo $BASE_URL | sed 's/https/wss/;s/http/ws/')" \
    --out json="$REPORTS_DIR/socket-$TIMESTAMP.json" \
    --summary-export="$REPORTS_DIR/socket-summary-$TIMESTAMP.json" \
    "$(dirname "$0")/test-socket.js"

else
  echo "❌ Unknown test type: $TEST"
  echo "   Use: http | socket"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📊 Report saved: $REPORTS_DIR/$TEST-summary-$TIMESTAMP.json"
echo "  Look for:"
echo "    http_req_duration → response time"
echo "    http_req_failed   → error rate"
echo "    errors            → custom failures"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
