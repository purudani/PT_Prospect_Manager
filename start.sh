#!/bin/bash

echo "🚀 Starting PT Prospect Manager..."
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Error: .env file not found!"
    echo "Please create a .env file with your Office365 credentials"
    echo "See README.md for setup instructions"
    echo ""
    exit 1
fi

# Kill any existing processes on ports 3001 and 5173
echo "🧹 Checking for existing processes..."

BACKEND_PID=$(lsof -ti:3001)
if [ ! -z "$BACKEND_PID" ]; then
    echo "   Stopping existing backend on port 3001..."
    kill -9 $BACKEND_PID 2>/dev/null
fi

FRONTEND_PID=$(lsof -ti:5173)
if [ ! -z "$FRONTEND_PID" ]; then
    echo "   Stopping existing frontend on port 5173..."
    kill -9 $FRONTEND_PID 2>/dev/null
fi

sleep 1

# Check if dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $NEW_BACKEND_PID $NEW_FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup EXIT INT TERM

# Start backend
echo "📡 Starting backend server on port 3001..."
cd backend
npm start &
NEW_BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend server on port 5173..."
cd frontend
npm run dev &
NEW_FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Both servers started!"
echo ""
echo "🌐 Open your browser: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for processes
wait
