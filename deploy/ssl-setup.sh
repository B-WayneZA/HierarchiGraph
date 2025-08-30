#!/bin/bash

# HierarchiGraph SSL Certificate Setup Script
# This script sets up SSL certificates using Let's Encrypt

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔒 Setting up SSL certificates for HierarchiGraph...${NC}"

# Check if domain is provided
if [ -z "$1" ]; then
    echo -e "${RED}Usage: $0 <your-domain.com>${NC}"
    echo "Example: $0 myapp.example.com"
    exit 1
fi

DOMAIN=$1
EMAIL=${2:-"admin@$DOMAIN"}

echo -e "${GREEN}Domain: $DOMAIN${NC}"
echo -e "${GREEN}Email: $EMAIL${NC}"

# Check if Certbot is installed
if ! command -v certbot &> /dev/null; then
    echo -e "${RED}Certbot is not installed. Installing...${NC}"
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-nginx
fi

# Check if Nginx is running
if ! sudo systemctl is-active --quiet nginx; then
    echo -e "${RED}Nginx is not running. Starting Nginx...${NC}"
    sudo systemctl start nginx
    sudo systemctl enable nginx
fi

# Create temporary Nginx configuration for domain verification
echo -e "${GREEN}Creating temporary Nginx configuration...${NC}"
sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location / {
        return 200 "Domain verification successful";
        add_header Content-Type text/plain;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Obtain SSL certificate
echo -e "${GREEN}Obtaining SSL certificate from Let's Encrypt...${NC}"
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive

# Update Nginx configuration with the new domain
echo -e "${GREEN}Updating Nginx configuration...${NC}"
sudo cp deploy/nginx.conf /etc/nginx/sites-available/$DOMAIN

# Replace placeholder domain in Nginx config
sudo sed -i "s/your-domain.com/$DOMAIN/g" /etc/nginx/sites-available/$DOMAIN

# Test and reload Nginx
echo -e "${GREEN}Testing and reloading Nginx configuration...${NC}"
sudo nginx -t && sudo systemctl reload nginx

# Set up automatic renewal
echo -e "${GREEN}Setting up automatic certificate renewal...${NC}"
sudo crontab -l 2>/dev/null | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | sudo crontab -

# Test SSL configuration
echo -e "${GREEN}Testing SSL configuration...${NC}"
if curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN | grep -q "200"; then
    echo -e "${GREEN}✅ SSL setup completed successfully!${NC}"
else
    echo -e "${YELLOW}⚠️  SSL setup completed, but HTTPS test failed. Please check manually.${NC}"
fi

echo ""
echo -e "${GREEN}🔗 Your application is now available at:${NC}"
echo "   https://$DOMAIN"
echo ""
echo -e "${GREEN}📋 SSL Certificate Information:${NC}"
echo "   Certificate: /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
echo "   Private Key: /etc/letsencrypt/live/$DOMAIN/privkey.pem"
echo "   Auto-renewal: Configured (runs daily at 12:00 PM)"
echo ""
echo -e "${GREEN}🔧 Useful Commands:${NC}"
echo "   Test SSL: curl -I https://$DOMAIN"
echo "   Check certificate: sudo certbot certificates"
echo "   Manual renewal: sudo certbot renew"
echo "   Nginx status: sudo systemctl status nginx"
