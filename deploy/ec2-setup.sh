#!/bin/bash

# HierarchiGraph EC2 Setup Script
# This script sets up an EC2 instance for deploying the application

set -e

echo "🚀 Setting up EC2 instance for HierarchiGraph deployment..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 18.x
echo "📦 Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt-get install -y nginx

# Install MongoDB (if using local MongoDB)
# echo "📦 Installing MongoDB..."
# wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
# echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
# sudo apt-get update
# sudo apt-get install -y mongodb-org
# sudo systemctl start mongod
# sudo systemctl enable mongod

# Install Git
echo "📦 Installing Git..."
sudo apt-get install -y git

# Install AWS CLI
echo "📦 Installing AWS CLI..."
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm -rf aws awscliv2.zip

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /var/www/hierarchigraph
sudo chown $USER:$USER /var/www/hierarchigraph

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 5000
sudo ufw --force enable

# Install Certbot for SSL (Let's Encrypt)
echo "📦 Installing Certbot..."
sudo apt-get install -y certbot python3-certbot-nginx

# Create PM2 ecosystem file
echo "⚙️ Creating PM2 ecosystem file..."
cat > /var/www/hierarchigraph/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'hierarchigraph-backend',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p /var/www/hierarchigraph/logs

echo "✅ EC2 setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Clone your repository to /var/www/hierarchigraph"
echo "2. Set up environment variables"
echo "3. Install dependencies and build the application"
echo "4. Configure Nginx"
echo "5. Set up SSL certificate"
echo ""
echo "🔗 Useful commands:"
echo "   cd /var/www/hierarchigraph"
echo "   git clone <your-repo-url> ."
echo "   npm install"
echo "   npm run build"
echo "   pm2 start ecosystem.config.js --env production"
echo "   sudo systemctl status nginx"
