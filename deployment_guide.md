# Linux Deployment Guide

This guide describes how to migrate `ParticipationManagerBot` to a Linux server (e.g., Ubuntu).

## Prerequisites

- A Linux server (VPS) with a public IP.
- SSH access to the server.
- Domain name (optional but recommended for SSL).

## 1. Server Setup

Update packages and install Node.js (v18+), Git, and Nginx.

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Git & Nginx
sudo apt install -y git nginx
```

## 2. Install the Bot

Clone your repository and install dependencies.

```bash
# Clone repo (replace with your actual repo URL)
git clone https://github.com/netwavers/ParticipationManagerBot.git
cd ParticipationManagerBot

# Install dependencies
npm install

# Setup Environment Variables
nano .env
# Paste your DISCORD_TOKEN=... here
```

## 3. Process Management (PM2)

Use PM2 to keep the bot running 24/7 and restart it automatically on reboot.

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the bot
pm2 start index.js --name "discord-bot"

# Save the process list and setup startup hook
pm2 save
pm2 startup
# (Run the command output by pm2 startup)
```

## 4. Network & Security (Important!)

Since the Web App needs to talk to the Bot, you must expose the API.

### Option A: Direct Access (Not Recommended)
Open port 3000 on the firewall.
```bash
sudo ufw allow 3000
```
*Web App Config*: Set Bot URL to `http://<YOUR_SERVER_IP>:3000`

### Option B: Nginx Reverse Proxy + SSL (Recommended)
Use Nginx to forward port 80/443 to 3000, and use Certbot for HTTPS.

1.  **Configure Nginx**:
    Create `/etc/nginx/sites-available/bot`
    ```nginx
    server {
        listen 80;
        server_name your-domain.com;

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
2.  **Enable Site**:
    ```bash
    sudo ln -s /etc/nginx/sites-available/bot /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```
3.  **SSL (HTTPS)**:
    ```bash
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d your-domain.com
    ```

*Web App Config*: Set Bot URL to `https://your-domain.com`

## 5. Web App Configuration

Update the `ParticipationManager` Web App settings:
1.  Open `index.html` (or the deployed Web App).
2.  In "Bot Integration", change **Bot API URL** from `http://localhost:3000` to your server's address (IP or Domain).
