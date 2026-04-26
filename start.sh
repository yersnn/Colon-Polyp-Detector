#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "=== PolyDetect startup ==="

# ---------- Backend ----------
cd "$ROOT/backend"

if [ ! -d ".venv" ]; then
  echo "[backend] Creating virtual environment…"
  python3 -m venv .venv
fi

source .venv/bin/activate

echo "[backend] Installing dependencies…"
pip install -q -r requirements.txt

echo "[backend] Starting FastAPI on http://localhost:8000"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

deactivate

# ---------- Frontend ----------
cd "$ROOT/frontend"

if [ ! -d "node_modules" ]; then
  echo "[frontend] Installing npm packages…"
  npm install
fi

echo "[frontend] Starting Vite on http://localhost:5173"
npm run dev &
FRONTEND_PID=$!

# ---------- Cleanup ----------
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT INT TERM

echo ""
echo "  Backend  →  http://localhost:8000"
echo "  Frontend →  http://localhost:5173"
echo "  API docs →  http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."

wait
