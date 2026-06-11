# FinTrack — Deployment Guide

This guide covers shipping FinTrack to various production servers: container clouds (Google Cloud Run), static vercel deployments, and virtual private servers (VPS).

---

## 1. Container Deployments (Docker / Google Cloud Run)

FinTrack is pre-configured to build into a highly optimized, single-bundle workspace. 

### 1.1 Triggering Builds
Our production compiler splits the build processes:
1.  **Vite Client Compilation:** Generates static assets inside `/dist`.
2.  **Server Bundle:** Employs `esbuild` to compile our parent Express bridge (`server.ts`) and Hono routes into a self-contained CommonJS block: `/dist/server.cjs`.

To run the full production compilation suite:
```bash
npm run build
```

The production server starts with:
```bash
npm run start
```

### 1.2 Multi-Stage Dockerfile Layout
```dockerfile
# Stage 1: Build Workspace
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Minimalist Slim Execution
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["npm", "run", "start"]
```

---

## 2. Serverless Environments (Vercel Deployments)

Our Hono API is designed with edge functions in mind, as defined in `/vercel.json`.

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Steps to Deploy to Vercel:
1.  Install the Vercel CLI locally (`npm install -g vercel`).
2.  Run `vercel` from the project's root folder.
3.  Assign your environment parameters (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the Vercel dashboard.
4.  Standard static and server-bridge compilation processes complete automatically.

---

## 3. Traditional VPS Implementations (Ubuntu / PM2)

To run FinTrack on a VPS (such as Hostinger or digitalOcean), pair node deployment processes with **PM2** to manage background tasks:

```bash
# 1. Compile bundle
npm run build

# 2. Spawn and monitor production thread via PM2
pm2 start dist/server.cjs --name "fintrack-prod"

# 3. Save states across hardware reboots
pm2 save
pm2 startup
```

Configure Nginx to reverse proxy external HTTP/HTTPS traffic to internal port `3000`.
```nginx
server {
    listen 80;
    server_name fintrack.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
 oily
