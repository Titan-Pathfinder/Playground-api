#!/bin/bash

##############################################################################
# EC2 Initial Setup Script for Titan Swap API Playground
# Run this script on a fresh Ubuntu 22.04 EC2 instance
##############################################################################

set -e  # Exit on error

echo "🚀 Starting EC2 setup for Titan Swap API Playground..."
echo ""

# Update system packages
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 18.x
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
echo "✅ Node.js version: $(node --version)"
echo "✅ NPM version: $(npm --version)"

# Install Git
echo "📦 Installing Git..."
sudo apt-get install -y git

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt-get install -y nginx

# Install PM2 globally
echo "📦 Installing PM2 (Process Manager)..."
sudo npm install -g pm2

# Install build essentials (needed for some npm packages)
echo "📦 Installing build essentials..."
sudo apt-get install -y build-essential

# Create app directory
echo "📁 Creating application directory..."
sudo mkdir -p /var/www/titan-playground
sudo chown -R $USER:$USER /var/www/titan-playground

# Clone repository (you'll need to update this with your repo URL)
echo "📥 Cloning repository..."
echo "⚠️  NOTE: Update the git clone command with your actual repository URL"
echo "    For now, you'll need to manually clone or upload your code to /var/www/titan-playground"
# cd /var/www/titan-playground
# git clone YOUR_REPO_URL .

echo ""
echo "✅ EC2 setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Upload your code to /var/www/titan-playground"
echo "2. Run the deploy script: ./scripts/deploy.sh"
echo ""
echo "ℹ️  No environment variables needed - users enter JWT tokens in the UI"
echo ""
