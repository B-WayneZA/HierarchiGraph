#!/bin/bash

# HierarchiGraph Complete Deployment Script - Fixed Node.js Installation
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="hierarchigraph"
APP_DIR="/var/www/$APP_NAME"
DOMAIN="13.60.163.88"
REPO_URL="https://github.com/B-WayneZA/HierarchiGraph.git"
BRANCH="main"

# Logging functions
log() { echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
error() { echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"; exit 1; }
warning() { echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"; }
info() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"; }

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    error "Please run as a regular user, not root."
fi

# Update system
log "Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# Clean up existing Node.js installations
log "Cleaning up existing Node.js installations..."
sudo apt-get remove --purge -y nodejs npm libnode-dev
sudo apt-get autoremove -y

# Remove any remaining Node.js files
sudo rm -rf /usr/local/bin/npm
sudo rm -rf /usr/local/bin/node
sudo rm -rf /usr/local/lib/node_modules
sudo rm -rf /usr/local/include/node
sudo rm -rf /usr/local/share/man/man1/node.1
sudo rm -rf /usr/local/bin/npx

# Clean up apt cache
sudo apt-get clean

# Install curl if not present
sudo apt-get install -y curl

# Install Node.js 18.x from NodeSource (with fix for conflicts)
log "Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Force overwrite conflicting files during installation
sudo apt-get install -y -o Dpkg::Options::="--force-overwrite" nodejs

# Verify Node.js installation
log "Verifying Node.js installation..."
node -v
npm -v

# Install PM2
log "Installing PM2..."
sudo npm install -g pm2

# Install Nginx
log "Installing Nginx..."
sudo apt-get install -y nginx

# Install Git
sudo apt-get install -y git

# Configure firewall
log "Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 5000
echo "y" | sudo ufw enable

# Create application directory
log "Creating application directory..."
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Clone repository
cd $APP_DIR
if [ -d ".git" ]; then
    log "Updating existing repository..."
    git pull origin $BRANCH
else
    log "Cloning repository..."
    git clone $REPO_URL .
    git checkout $BRANCH
fi

# Install and build backend
log "Setting up backend..."
cd $APP_DIR/backend

# Check if we need to install TypeScript globally
if ! command -v tsc &> /dev/null; then
    log "Installing TypeScript globally..."
    sudo npm install -g typescript
fi

npm install
npm run build

# Install and build frontend
log "Setting up frontend..."
cd $APP_DIR/frontend
npm install
npm run build

# Create environment file for backend
log "Creating backend environment file..."
cd $APP_DIR/backend
cat > .env << EOF
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/$APP_NAME
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRE=7d
CORS_ORIGIN=http://$DOMAIN,http://localhost:3000
EOF

# Create environment file for frontend
log "Creating frontend environment file..."
cd $APP_DIR/frontend
cat > .env.production << EOF
VITE_API_BASE_URL=http://$DOMAIN/api
VITE_APP_NAME=HierarchiGraph
VITE_APP_VERSION=1.0.0
EOF

# Create PM2 ecosystem file
log "Creating PM2 ecosystem file..."
cd $APP_DIR
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$APP_NAME-backend',
    cwd: '$APP_DIR/backend',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    max_memory_restart: '1G',
    error_file: '$APP_DIR/logs/backend-err.log',
    out_file: '$APP_DIR/logs/backend-out.log',
    log_file: '$APP_DIR/logs/backend-combined.log',
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p $APP_DIR/logs

# Configure Nginx
log "Configuring Nginx..."
sudo bash -c "cat > /etc/nginx/sites-available/$APP_NAME" << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Frontend static files
    root $APP_DIR/frontend/dist;
    index index.html index.htm;

    # Frontend routes
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 600s;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
EOF

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Start backend with PM2
log "Starting backend with PM2..."
cd $APP_DIR
pm2 start ecosystem.config.js --env production
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER

# Set up log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true

# Create deployment script
log "Creating deployment script..."
cat > deploy.sh << EOF
#!/bin/bash
# Deployment script for updates
set -e

echo "🚀 Starting deployment..."
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
EOF

chmod +x deploy.sh

# Create health check script
cat > healthcheck.sh << EOF
#!/bin/bash
# Health check script
response=\$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health || true)

if [ "\$response" = "200" ]; then
    echo "✅ Application is healthy"
    exit 0
else
    echo "❌ Application health check failed: \$response"
    exit 1
fi
EOF

chmod +x healthcheck.sh

# Final checks
log "Running final checks..."
sleep 5

# Test backend health
if curl -s http://localhost:5000/api/health > /dev/null; then
    log "✅ Backend health check passed"
else
    warning "⚠️ Backend health check failed"
fi

# Test frontend access
if curl -s http://localhost > /dev/null; then
    log "✅ Frontend is accessible"
else
    warning "⚠️ Frontend access check failed"
fi

log "✅ Setup completed successfully!"
echo ""
echo "📋 Application Information:"
echo "   Frontend URL: http://$DOMAIN"
echo "   API URL: http://$DOMAIN/api"
echo "   Backend URL: http://localhost:5000"
echo "   Application directory: $APP_DIR"
echo ""
echo "🔧 Management Commands:"
echo "   View logs: pm2 logs $APP_NAME-backend"
echo "   Restart: pm2 restart $APP_NAME-backend"
echo "   Deploy updates: ./deploy.sh"
echo "   Health check: ./healthcheck.sh"