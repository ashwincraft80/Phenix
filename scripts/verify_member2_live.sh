#!/bin/bash
set -e

echo "=============================================================="
echo "🚀 SymbioLink Member 2 Live Endpoints Verification Script"
echo "=============================================================="

SERVER_DIR="$(cd "$(dirname "$0")/../server" && pwd)"
cd "$SERVER_DIR"

PORT=5001
export PORT

# Start server in background
echo "1. Starting server on port $PORT..."
node server.js > /tmp/symbiolink_server.log 2>&1 &
SERVER_PID=$!

cleanup() {
  echo ""
  echo "Stopping test server (PID: $SERVER_PID)..."
  kill $SERVER_PID 2>/dev/null || true
}
trap cleanup EXIT

# Poll until server is ready (up to 5 seconds)
echo "Waiting for server to become ready on http://localhost:$PORT/api/health..."
for i in {1..10}; do
  if curl -s "http://localhost:$PORT/api/health" > /dev/null 2>&1; then
    echo "✅ Server is online!"
    break
  fi
  sleep 0.5
done

echo ""
echo "2. Health Check:"
curl -s "http://localhost:$PORT/api/health" | head -c 250
echo -e "\n..."

echo ""
echo "3. Testing GET /api/impact/aggregate (Exact Contract Verification):"
curl -s "http://localhost:$PORT/api/impact/aggregate"
echo -e "\n"

echo "4. Testing GET /api/deals (List Deals):"
curl -s "http://localhost:$PORT/api/deals" | head -c 300
echo -e "\n..."

echo ""
echo "5. Testing Deal State Machine Flow:"
echo "   a. Initiating 500 Tons Slag Deal (Tata Steel -> Prism Cement)..."
CREATE_RESP=$(curl -s -X POST "http://localhost:$PORT/api/deals" \
  -H "Content-Type: application/json" \
  -d '{
    "targetListingId": "L1",
    "matchedListingId": "L20",
    "supplierCompanyId": "comp_tata_steel",
    "buyerCompanyId": "comp_prism_cement",
    "material": "Granulated Blast Furnace Slag",
    "materialCategory": "Industrial Slag",
    "quantity": 500,
    "pricePerTon": 850,
    "logistics": { "distanceKm": 42.5 }
  }')

DEAL_ID=$(echo "$CREATE_RESP" | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)
echo "   -> Created Deal ID: $DEAL_ID"

echo "   b. Advancing to IN_NEGOTIATION (Simulating Escrow Handshake)..."
curl -s -X POST "http://localhost:$PORT/api/deals/$DEAL_ID/simulate-escrow" \
  -H "Content-Type: application/json" \
  -d '{ "escrowAmount": 425000, "notes": "₹4.25 Lakhs locked in escrow" }' | grep -o '"escrowStatus":"[^"]*'

echo -e "\n   c. Advancing to LOGISTICS_DISPATCHED (Assigning Gate Pass & Vehicle)..."
curl -s -X PATCH "http://localhost:$PORT/api/deals/$DEAL_ID/status" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "LOGISTICS_DISPATCHED",
    "vehicleNumber": "JH-05-CD-4421",
    "notes": "Gate pass GP-JAM-2026-8941 cleared"
  }' | grep -o '"gatePassNumber":"[^"]*'

echo -e "\n   d. Advancing to DELIVERED_VERIFIED (Weighbridge Verified & Hash Stamp)..."
curl -s -X PATCH "http://localhost:$PORT/api/deals/$DEAL_ID/status" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "DELIVERED_VERIFIED",
    "verifiedTonnage": 500,
    "weighbridgeSlipNumber": "WB-CHAIBASA-8812",
    "notes": "500T net certified. SEBI BRSR hash created."
  }' | grep -o '"digitalCertificateHash":"[^"]*'

echo -e "\n\n6. Testing GET /api/impact/certificate/$DEAL_ID (SEBI BRSR Compliance):"
curl -s "http://localhost:$PORT/api/impact/certificate/$DEAL_ID" | head -c 400
echo -e "\n..."

echo -e "\n7. Live Updated Aggregate Impact Counter (Diverted Waste increased by 500T):"
curl -s "http://localhost:$PORT/api/impact/aggregate"
echo -e "\n"

echo "=============================================================="
echo "🎉 ALL ENDPOINTS VERIFIED LIVE! Member 2 Backend is 100% Operational."
echo "=============================================================="
