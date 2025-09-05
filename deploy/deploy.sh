#!/bin/bash
# Quick deployment script for updates
set -e

APP_DIR="/var/www/hierarchigraph"
BRANCH="main"

echo "🚀 Starting quick deployment..."

cd $APP_DIR

# Pull latest changes
git pull origin $BRANCH

# Update backend
cd backend
npm install
npm run build

# Update frontend
cd ../frontend
npm install
npm run build

# Restart backend
cd ..
pm2 reload ecosystem.config.js --env production

echo "✅ Deployment completed!"