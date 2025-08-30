#!/bin/bash

# HierarchiGraph AWS EC2 Deployment Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="hierarchigraph"
APP_DIR="/var/www/hierarchigraph"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
LOG_DIR="$APP_DIR/logs"

echo -e "${GREEN}🚀 Starting HierarchiGraph deployment...${NC}"

# Function to log messages
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root"
fi

# Check if required directories exist
if [ ! -d "$APP_DIR" ]; then
    error "Application directory $APP_DIR does not exist. Run ec2-setup.sh first."
fi

# Navigate to application directory
cd "$APP_DIR"

# Backup current version
if [ -d "current" ]; then
    log "Creating backup of current version..."
    cp -r current backup-$(date +%Y%m%d-%H%M%S)
fi

# Pull latest changes from Git
log "Pulling latest changes from Git..."
git pull origin main || error "Failed to pull from Git"

# Install backend dependencies
log "Installing backend dependencies..."
cd "$BACKEND_DIR"
npm ci --production || error "Failed to install backend dependencies"

# Build backend
log "Building backend..."
npm run build || error "Failed to build backend"

# Install frontend dependencies
log "Installing frontend dependencies..."
cd "$FRONTEND_DIR"
npm ci --production || error "Failed to install frontend dependencies"

# Build frontend
log "Building frontend..."
npm run build || error "Failed to build frontend"

# Create production environment file
log "Setting up environment variables..."
cd "$BACKEND_DIR"
if [ ! -f ".env" ]; then
    error "Environment file .env not found. Please create it with required variables."
fi

# Validate environment variables
log "Validating environment configuration..."
node -e "
const { validateDeploymentConfig } = require('./dist/config/deploy');
validateDeploymentConfig();
" || error "Environment validation failed"

# Restart PM2 processes
log "Restarting PM2 processes..."
cd "$APP_DIR"
pm2 restart ecosystem.config.js --env production || pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Test backend health
log "Testing backend health..."
sleep 5
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    log "✅ Backend is healthy"
else
    error "❌ Backend health check failed"
fi

# Reload Nginx configuration
log "Reloading Nginx configuration..."
sudo nginx -t && sudo systemctl reload nginx || warning "Nginx reload failed"

# Clean up old backups (keep last 5)
log "Cleaning up old backups..."
cd "$APP_DIR"
ls -t backup-* | tail -n +6 | xargs -r rm -rf

# Show deployment status
log "Deployment completed successfully!"
echo ""
echo -e "${GREEN}📊 Deployment Status:${NC}"
echo "   Backend: $(pm2 status | grep hierarchigraph-backend | awk '{print $10}')"
echo "   Nginx: $(sudo systemctl is-active nginx)"
echo "   Health Check: $(curl -s http://localhost:5000/api/health | jq -r '.status' 2>/dev/null || echo 'Failed')"
echo ""
echo -e "${GREEN}🔗 Useful Commands:${NC}"
echo "   PM2 Status: pm2 status"
echo "   PM2 Logs: pm2 logs hierarchigraph-backend"
echo "   Nginx Status: sudo systemctl status nginx"
echo "   Nginx Logs: sudo tail -f /var/log/nginx/error.log"
echo "   Application Logs: tail -f $LOG_DIR/combined.log"
echo ""
echo -e "${GREEN}🌐 Your application should be available at:${NC}"
echo "   https://your-domain.com"
