#!/bin/bash

echo "🚀 Starting PT Prospect Manager with separate logs..."
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Error: .env file not found!"
    echo "Please create a .env file with your Office365 credentials"
    echo ""
    exit 1
fi

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
sleep 1

# Create logs directory
mkdir -p logs

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup EXIT INT TERM

echo ""
echo "📡 Starting backend server..."
echo "   Backend logs: logs/backend.log"
cd backend
npm start > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend
sleep 3

echo "🎨 Starting frontend server..."
echo "   Frontend logs: logs/frontend.log"
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

sleep 2

echo ""
echo "✅ Both servers started!"
echo ""
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:3001"
echo "📊 Test:     http://localhost:3001/api/email/test"
echo ""
echo "📋 View logs:"
echo "   Backend:  tail -f logs/backend.log"
echo "   Frontend: tail -f logs/frontend.log"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for processes
wait
