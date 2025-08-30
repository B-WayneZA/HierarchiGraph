#!/bin/bash

echo "🚀 Setting up HierarchiGraph - Employee Hierarchy Management System"
echo "================================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check if MongoDB is running
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed. Please install MongoDB v4.4 or higher."
    echo "   You can download it from: https://www.mongodb.com/try/download/community"
fi

echo "📦 Installing backend dependencies..."
cd backend
npm install

echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

echo "✅ Dependencies installed successfully!"
echo ""
echo "🔧 Next steps:"
echo "1. Create a .env file in the backend directory with your configuration"
echo "2. Start MongoDB service"
echo "3. Run the following commands to start the application:"
echo ""
echo "   # Terminal 1 - Start Backend"
echo "   cd backend"
echo "   npm run dev"
echo ""
echo "   # Terminal 2 - Start Frontend"
echo "   cd frontend"
echo "   npm start"
echo ""
echo "🌐 The application will be available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000"
echo ""
echo "📚 For more information, see the README.md file"
