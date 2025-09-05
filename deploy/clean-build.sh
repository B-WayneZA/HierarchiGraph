#!/bin/bash

# Clean Build Script - Fixes TypeScript caching issues
set -e

APP_DIR="/var/www/hierarchigraph"

log() { echo -e "\033[0;32m[$(date)]\033[0m $1"; }

cd $APP_DIR

log "Performing complete TypeScript cleanup..."

# Remove build artifacts
log "Removing build artifacts..."
rm -rf backend/dist
rm -rf frontend/dist
rm -rf frontend/node_modules/.vite

# Clean npm cache
log "Cleaning npm cache..."
npm cache clean --force

# Remove node_modules and reinstall (optional - nuclear option)
# log "Removing node_modules..."
# rm -rf backend/node_modules
# rm -rf frontend/node_modules

# Remove TypeScript cache
log "Cleaning TypeScript cache..."
find . -name "tsconfig.tsbuildinfo" -delete
find . -name "*.tsbuildinfo" -delete

# Clean any leftover files
log "Cleaning temporary files..."
find . -name "*.js" -not -path "*/node_modules/*" -delete
find . -name "*.js.map" -not -path "*/node_modules/*" -delete
find . -name "*.d.ts" -not -path "*/node_modules/*" -delete

log "Rebuilding applications..."

# Build backend
cd backend
npm install
npm run build

# Build frontend  
cd ../frontend
npm install
npm run build

log "✅ Clean build completed successfully!"