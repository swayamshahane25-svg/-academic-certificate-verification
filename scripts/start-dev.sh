#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT"

# Check ports
RPC_HOST=127.0.0.1
RPC_PORT=8545
BACKEND_PORT=5050
FRONTEND_PORT=5173

function is_port_open() {
  nc -z "$1" "$2" >/dev/null 2>&1
}

echo "Starting CertiChain local development environment..."

# Start Hardhat node if not running
if is_port_open "$RPC_HOST" "$RPC_PORT"; then
  echo "Hardhat RPC already running at http://$RPC_HOST:$RPC_PORT"
else
  echo "Starting Hardhat node..."
  (cd "$ROOT/blockchain" && npx hardhat node --hostname 127.0.0.1) &
  sleep 1
  # wait up to 10s for port
  for i in {1..10}; do
    if is_port_open "$RPC_HOST" "$RPC_PORT"; then
      break
    fi
    sleep 1
  done
  if ! is_port_open "$RPC_HOST" "$RPC_PORT"; then
    echo "Warning: Hardhat RPC did not start on $RPC_HOST:$RPC_PORT"
  else
    echo "Hardhat RPC is up at http://$RPC_HOST:$RPC_PORT"
  fi
fi

# Start backend
if is_port_open "127.0.0.1" "$BACKEND_PORT"; then
  echo "Backend appears to be running on port $BACKEND_PORT"
else
  echo "Starting backend (will install dependencies if missing)..."
  (cd "$ROOT/backend" && npm install --no-audit --no-fund >/dev/null 2>&1 || true)
  (cd "$ROOT/backend" && node server.js) &
  sleep 1
  for i in {1..10}; do
    if is_port_open "127.0.0.1" "$BACKEND_PORT"; then
      break
    fi
    sleep 1
  done
  if ! is_port_open "127.0.0.1" "$BACKEND_PORT"; then
    echo "Warning: Backend did not start on port $BACKEND_PORT"
  else
    echo "Backend is up at http://127.0.0.1:$BACKEND_PORT"
  fi
fi

# Start frontend
if is_port_open "127.0.0.1" "$FRONTEND_PORT"; then
  echo "Frontend dev server appears to be running on port $FRONTEND_PORT"
else
  echo "Starting frontend (will install dependencies if missing)..."
  (cd "$ROOT/frontend" && npm install --no-audit --no-fund >/dev/null 2>&1 || true)
  (cd "$ROOT/frontend" && npm run dev -- --host) &
  sleep 1
  for i in {1..10}; do
    if is_port_open "127.0.0.1" "$FRONTEND_PORT"; then
      break
    fi
    sleep 1
  done
  if ! is_port_open "127.0.0.1" "$FRONTEND_PORT"; then
    echo "Warning: Frontend did not start on port $FRONTEND_PORT"
  else
    echo "Frontend running at http://127.0.0.1:$FRONTEND_PORT"
  fi
fi

cat <<EOF

Startup complete (check any warnings above).
Open the frontend: http://127.0.0.1:$FRONTEND_PORT
Backend API: http://127.0.0.1:$BACKEND_PORT
Hardhat RPC: http://$RPC_HOST:$RPC_PORT

Note: This script starts processes in background in a simple way for demo convenience.
If you prefer terminal control, start each service in its own terminal.
EOF
