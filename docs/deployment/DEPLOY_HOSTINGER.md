# Deployment Guide: Hostinger VPS

Hostinger VPS provides full administrative root access over a Linux (Ubuntu/Debian) web server.

---

## 1. Environment Requirements
Connect to your VPS using SSH, and ensure Node.js (v20+ or v22+) is installed:

```bash
# Update systems
sudo apt update && sudo apt upgrade -y

# Install Node.js LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs git build-essential

# Verify versions
node -v
npm -v
```

---

## 2. Process Management with PM2
Install PM2 globally to daemonize your running server and handle crash recovery:

```bash
sudo npm i -g pm2
```

Navigate to your application root directory and run the initialization cycle:

```bash
# Populate dependencies and build production artifacts
npm ci
npm run build

# Start process
NODE_ENV=production PORT=3000 pm2 start server.dist.cjs --name "expense-tracker"

# Save configuration for automatic boots
pm2 save
pm2 startup
```

---

## 3. Nginx Reverse Proxy Setup
Proxy incoming standard traffic (port 80/443) dynamically onto application port 3000.

1. Install Nginx:
   ```bash
   sudo apt install nginx -y
   ```

2. Create block config `sudo nano /etc/nginx/sites-available/expense-tracker`:
   ```nginx
   server {
       listen 80;
       server_name tracker.yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. Enable block configuration and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/expense-tracker /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. Install SSL Certificates (Certbot):
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   sudo certbot --nginx -d tracker.yourdomain.com
   ```
