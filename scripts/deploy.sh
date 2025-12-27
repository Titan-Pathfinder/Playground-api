#!/bin/bash

##############################################################################
# Deployment Script for Titan Swap API Playground
# Run this script to build and deploy the application on EC2
##############################################################################

set -e  # Exit on error

echo "🚀 Starting deployment..."
echo ""

# Navigate to app directory
cd /var/www/titan-playground

# Pull latest changes (if using git)
if [ -d ".git" ]; then
  echo "📥 Pulling latest changes from git..."
  git pull
else
  echo "ℹ️  Not a git repository, skipping pull"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Build the application
echo "🔨 Building application..."
npm run build

# Stop existing PM2 process if running
echo "🛑 Stopping existing process..."
pm2 stop titan-playground || true
pm2 delete titan-playground || true

# Start the application with PM2
echo "▶️  Starting application..."
pm2 start npm --name "titan-playground" -- start

# Save PM2 process list
pm2 save

# Show status
echo ""
echo "✅ Deployment complete!"
echo ""
pm2 status
echo ""
echo "📊 Application is running on http://localhost:3000"
echo "🔍 View logs: pm2 logs titan-playground"
echo "🔄 Restart: pm2 restart titan-playground"
echo "🛑 Stop: pm2 stop titan-playground"
echo ""
