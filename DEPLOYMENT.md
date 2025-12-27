# Titan Swap API Playground - EC2 Deployment Guide

Complete guide for deploying the Titan Swap API Playground on AWS EC2.

---

## 📋 Prerequisites

### AWS Resources Needed:
- **EC2 Instance**: t3.small or larger (Ubuntu 22.04 LTS recommended)
- **Security Group** with the following ports open:
  - Port 22 (SSH)
  - Port 80 (HTTP)
  - Port 443 (HTTPS - optional)
- **Elastic IP** (optional but recommended for stable access)

### Required IAM Permissions:
- EC2: Launch instances, manage security groups
- (Optional) Elastic IP: Allocate and associate

---

## 🚀 Deployment Steps

### Step 1: Launch EC2 Instance

1. **Launch Instance:**
   ```bash
   # Instance type: t3.small (2 vCPU, 2 GB RAM)
   # OS: Ubuntu Server 22.04 LTS
   # Storage: 20 GB gp3
   ```

2. **Configure Security Group:**
   ```
   Inbound Rules:
   - SSH (22) from your IP
   - HTTP (80) from 0.0.0.0/0
   - HTTPS (443) from 0.0.0.0/0 (if using SSL)
   ```

3. **Connect to Instance:**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

---

### Step 2: Run Initial Setup Script

1. **Upload setup script:**
   ```bash
   # On your local machine
   scp -i your-key.pem scripts/setup-ec2.sh ubuntu@your-ec2-ip:~
   ```

2. **Run setup on EC2:**
   ```bash
   chmod +x setup-ec2.sh
   ./setup-ec2.sh
   ```

   This script will:
   - Update system packages
   - Install Node.js 18
   - Install Git, Nginx, PM2
   - Create application directory

---

### Step 3: Upload Application Code

**Option A: Using SCP (Simple)**
```bash
# On your local machine, from project root
tar -czf titan-playground.tar.gz --exclude='node_modules' --exclude='.next' --exclude='.git' .
scp -i your-key.pem titan-playground.tar.gz ubuntu@your-ec2-ip:/var/www/titan-playground/

# On EC2 instance
cd /var/www/titan-playground
tar -xzf titan-playground.tar.gz
rm titan-playground.tar.gz
```

**Option B: Using Git (Recommended for CI/CD)**
```bash
# On EC2 instance
cd /var/www/titan-playground
git clone YOUR_REPO_URL .
```

---

### Step 4: Deploy Application

```bash
# On EC2 instance
cd /var/www/titan-playground
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

This will:
- Install dependencies
- Build the Next.js application
- Start the app with PM2 on port 3000

---

### Step 5: Configure Nginx

1. **Copy nginx configuration:**
   ```bash
   sudo cp scripts/nginx.conf /etc/nginx/sites-available/titan-playground
   ```

2. **Enable the site:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/titan-playground /etc/nginx/sites-enabled/
   ```

3. **Test nginx configuration:**
   ```bash
   sudo nginx -t
   ```

4. **Restart nginx:**
   ```bash
   sudo systemctl restart nginx
   ```

---

### Step 6: Verify Deployment

1. **Check PM2 status:**
   ```bash
   pm2 status
   ```

2. **View application logs:**
   ```bash
   pm2 logs titan-playground
   ```

3. **Access application:**
   - Open browser: `http://your-ec2-public-ip`
   - You should see the Titan Swap API Playground

---

## 🔧 Post-Deployment

### Enable PM2 Startup
Ensure the app starts automatically after server reboots:
```bash
pm2 startup
pm2 save
```

### Setup SSL (Optional but Recommended)

1. **Install Certbot:**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx -y
   ```

2. **Get SSL certificate:**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

3. **Auto-renewal:**
   ```bash
   sudo certbot renew --dry-run
   ```

---

## 📊 Monitoring & Maintenance

### View Logs
```bash
# PM2 logs
pm2 logs titan-playground

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Restart Application
```bash
pm2 restart titan-playground
```

### Update Application
```bash
cd /var/www/titan-playground
git pull  # If using git
./scripts/deploy.sh
```

### Monitor Resources
```bash
# CPU and memory usage
pm2 monit

# Detailed PM2 info
pm2 show titan-playground

# System resources
htop
```

---

## 🔍 Troubleshooting

### Application won't start
```bash
# Check PM2 logs
pm2 logs titan-playground --lines 50

# Check if port 3000 is in use
sudo lsof -i :3000

# Restart PM2
pm2 restart titan-playground
```

### Nginx errors
```bash
# Test nginx config
sudo nginx -t

# Check nginx status
sudo systemctl status nginx

# Restart nginx
sudo systemctl restart nginx
```

### Build errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Rebuild
npm run build
```

---

## 💰 Cost Estimate

**Monthly costs for internal tool:**
- EC2 t3.small: ~$15/month (on-demand)
- EBS Storage (20GB): ~$2/month
- Data Transfer: ~$1-5/month (internal use)
- **Total: ~$18-22/month**

**Cost optimization:**
- Use Reserved Instance for 40% savings
- Stop instance during non-business hours if appropriate

---

## 🔐 Security Best Practices

1. **SSH Key Management:**
   - Never share your .pem key
   - Use different keys for different environments

2. **Security Group:**
   - Restrict SSH (port 22) to your office IP only
   - Keep other rules as minimal as needed

3. **Updates:**
   ```bash
   # Regular system updates
   sudo apt-get update && sudo apt-get upgrade -y
   ```

4. **Firewall:**
   ```bash
   # Enable UFW (optional extra security)
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

---

## 📞 Quick Reference Commands

```bash
# Deploy updates
cd /var/www/titan-playground && ./scripts/deploy.sh

# View logs
pm2 logs titan-playground

# Restart app
pm2 restart titan-playground

# Stop app
pm2 stop titan-playground

# Start app
pm2 start titan-playground

# Restart nginx
sudo systemctl restart nginx

# Check app status
pm2 status
```

---

## ℹ️ Important Notes

- **No Environment Variables Needed**: Users enter their JWT tokens directly in the UI connection panel
- **WebSocket Support**: Nginx is configured to properly handle WebSocket connections for Titan API
- **Internal Tool**: This deployment assumes internal company use, adjust security accordingly for public access
- **Monitoring**: Consider setting up CloudWatch for production monitoring

---

## 🆘 Support

For issues or questions:
1. Check logs: `pm2 logs titan-playground`
2. Verify nginx: `sudo nginx -t`
3. Check system resources: `pm2 monit`
4. Review build output during deployment

---

Last updated: 2024
