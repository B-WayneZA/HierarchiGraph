# HierarchiGraph AWS EC2 Deployment Guide

This guide will help you deploy the HierarchiGraph application on AWS EC2 with production-ready configuration.

## Prerequisites

- AWS Account with EC2 access
- Domain name (for SSL certificates)
- MongoDB Atlas cluster (recommended) or local MongoDB
- Git repository with your application code

## Step 1: Launch EC2 Instance

### 1.1 Create EC2 Instance
1. Go to AWS Console → EC2 → Launch Instance
2. Choose **Ubuntu Server 22.04 LTS**
3. Select **t3.medium** or larger for production
4. Configure Security Group:
   - SSH (22) - Your IP
   - HTTP (80) - 0.0.0.0/0
   - HTTPS (443) - 0.0.0.0/0
   - Custom TCP (5000) - 0.0.0.0/0 (for backend)

### 1.2 Connect to Instance
```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

## Step 2: Initial Server Setup

### 2.1 Run EC2 Setup Script
```bash
# Download and run the setup script
curl -O https://raw.githubusercontent.com/your-repo/hierarchigraph/main/deploy/ec2-setup.sh
chmod +x ec2-setup.sh
./ec2-setup.sh
```

### 2.2 Clone Your Repository
```bash
cd /var/www/hierarchigraph
git clone https://github.com/your-username/hierarchigraph.git .
```

## Step 3: Configure Environment Variables

### 3.1 Create Production Environment File
```bash
cd /var/www/hierarchigraph/backend
cp deploy/production.env.example .env
nano .env
```

### 3.2 Update Environment Variables
```env
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hierarchigraph?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# CORS Configuration
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Other configurations...
```

## Step 4: Set Up SSL Certificate

### 4.1 Point Domain to EC2
1. Go to your domain registrar
2. Create A record pointing to your EC2 public IP
3. Wait for DNS propagation (5-30 minutes)

### 4.2 Obtain SSL Certificate
```bash
cd /var/www/hierarchigraph
chmod +x deploy/ssl-setup.sh
./deploy/ssl-setup.sh your-domain.com your-email@domain.com
```

## Step 5: Deploy Application

### 5.1 Run Deployment Script
```bash
cd /var/www/hierarchigraph
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

### 5.2 Verify Deployment
```bash
# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Test application
curl https://your-domain.com/api/health
```

## Step 6: Configure Monitoring

### 6.1 Set Up PM2 Monitoring
```bash
# Install PM2 monitoring
pm2 install pm2-server-monit

# Set up PM2 startup script
pm2 startup
pm2 save
```

### 6.2 Configure Log Rotation
```bash
# Create logrotate configuration
sudo tee /etc/logrotate.d/hierarchigraph << EOF
/var/www/hierarchigraph/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
}
EOF
```

## Step 7: Security Hardening

### 7.1 Update Firewall Rules
```bash
# Remove port 5000 from public access (only allow through Nginx)
sudo ufw delete allow 5000
sudo ufw reload
```

### 7.2 Set Up Fail2ban
```bash
sudo apt-get install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 7.3 Configure Automatic Updates
```bash
sudo apt-get install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Step 8: Backup Strategy

### 8.1 Database Backups
```bash
# Create backup script
sudo tee /usr/local/bin/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/hierarchigraph"
mkdir -p $BACKUP_DIR

# MongoDB Atlas backup (if using Atlas)
# Use MongoDB Atlas automated backups

# Application backup
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/hierarchigraph
find $BACKUP_DIR -name "app_*.tar.gz" -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-db.sh

# Add to crontab
echo "0 2 * * * /usr/local/bin/backup-db.sh" | sudo crontab -
```

## Step 9: CI/CD Setup (Optional)

### 9.1 GitHub Actions Workflow
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to EC2

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to EC2
      uses: appleboy/ssh-action@v0.1.4
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.KEY }}
        script: |
          cd /var/www/hierarchigraph
          git pull origin main
          ./deploy/deploy.sh
```

## Troubleshooting

### Common Issues

1. **Application not starting**
   ```bash
   pm2 logs hierarchigraph-backend
   sudo journalctl -u nginx
   ```

2. **SSL certificate issues**
   ```bash
   sudo certbot certificates
   sudo certbot renew --dry-run
   ```

3. **Database connection issues**
   ```bash
   # Test MongoDB connection
   node -e "
   const mongoose = require('mongoose');
   mongoose.connect(process.env.MONGODB_URI)
     .then(() => console.log('Connected'))
     .catch(err => console.error(err));
   "
   ```

4. **Nginx configuration errors**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

### Performance Monitoring

```bash
# Monitor system resources
htop
df -h
free -h

# Monitor application
pm2 monit
pm2 logs --lines 100

# Monitor Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Maintenance

### Regular Tasks

1. **Update system packages**
   ```bash
   sudo apt-get update && sudo apt-get upgrade -y
   ```

2. **Update application**
   ```bash
   cd /var/www/hierarchigraph
   git pull origin main
   ./deploy/deploy.sh
   ```

3. **Monitor logs**
   ```bash
   tail -f /var/www/hierarchigraph/logs/combined.log
   ```

4. **Check SSL certificate renewal**
   ```bash
   sudo certbot renew --dry-run
   ```

## Support

- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

## Security Checklist

- [ ] Firewall configured (UFW)
- [ ] SSL certificate installed
- [ ] Automatic security updates enabled
- [ ] Fail2ban configured
- [ ] Strong JWT secret set
- [ ] Database credentials secured
- [ ] Log rotation configured
- [ ] Backup strategy implemented
- [ ] Monitoring set up
- [ ] Rate limiting configured
