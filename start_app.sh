#!/bin/bash

# Ensure we are in the script's directory (Project Root)
cd "$(dirname "$0")"

echo "🚀 Starting stepback.dev..."

# 1. Start Backend
echo "🐍 Launching Backend..."
if [ -d "stepback_env" ]; then
    source stepback_env/bin/activate
else
    echo "⚠️  Virtual environment not found. Please run:"
    echo "   python3 -m venv venv"
    echo "   source venv/bin/activate"
    echo "   python -m pip install -r backend/requirements.txt"
    exit 1
fi

# Explicitly set PYTHONPATH to current directory so 'backend' package is found
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Run uvicorn in background.
# Use `python -m uvicorn` so we always use the currently activated venv interpreter,
# rather than a globally-installed `uvicorn` entrypoint (e.g., Homebrew Python).
# We use 'backend.main:app' which tells python to look for package 'backend', module 'main'
python -m uvicorn backend.main:app --reload --port 8000 &
BACKEND_PID=$!

# 2. Start Frontend
echo "⚛️  Launching Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!

echo "✅ App is running!"
echo "   - Backend: http://localhost:8000"
echo "   - Frontend: http://localhost:5173"
echo "   (Press CTRL+C to stop both)"

# 3. Cleanup on Exit
trap "kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM
wait
