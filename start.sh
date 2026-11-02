#!/usr/bin/env bash

# FieldIQ Run Script
# Starts both the FastAPI backend and Vite frontend

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting FieldIQ..."

# Kill any existing processes on ports 8000 and 5173
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

# Start backend
echo "Starting backend on http://127.0.0.1:8000 ..."
cd "$ROOT_DIR/backend"
PYTHONPATH=. python3 -m uvicorn app.main:app --port 8000 &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 1.5

# Start frontend
echo "Starting frontend on http://localhost:5173 ..."
cd "$ROOT_DIR/frontend"
npx vite --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!

echo ""
echo "FieldIQ is now running!"
echo "Open: http://localhost:5173"
echo "Backend API: http://127.0.0.1:8000"
echo "Press Ctrl+C to stop all servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait

