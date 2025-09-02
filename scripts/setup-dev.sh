#!/bin/bash

# Development setup script for MCP Server

echo "🚀 Setting up MCP Server development environment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install dev dependencies for testing
echo "🧪 Installing testing dependencies..."
npm install --save-dev @types/jest jest ts-jest @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint

# Build the project
echo "🔨 Building project..."
npm run build

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Please create one with your database configuration."
    echo "Example .env:"
    echo "DB_HOST=127.0.0.1"
    echo "DB_PORT=5432"
    echo "DB_NAME=your_database"
    echo "DB_USER=your_username"
    echo "DB_PASSWORD=your_password"
    echo "DB_SSL=false"
else
    echo "✅ .env file found"
fi

# Test database connection
echo "🔌 Testing database connection..."
node scripts/test-direct-db.js

echo "✅ Setup complete! You can now:"
echo "  - npm run dev      # Run in development mode"
echo "  - npm run test     # Run tests"
echo "  - npm run lint     # Run linting"
echo "  - npm start        # Run production build"
