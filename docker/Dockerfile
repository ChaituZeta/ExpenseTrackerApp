# Multi-stage production build container
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json tsconfig.json vite.config.ts ./
COPY frontend/ ./frontend/
COPY backend/ ./backend/
COPY scripts/ ./scripts/
COPY index.html ./

# Install development node modules and build assets
RUN npm ci
RUN npm run build

# Production-optimized runtime runner setup
FROM node:22-alpine AS runner

WORKDIR /usr/src/app
ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/server.dist.cjs ./server.dist.cjs
COPY --from=builder /usr/src/app/server.dist.cjs.map ./server.dist.cjs.map

EXPOSE 3000

CMD ["npm", "run", "start"]
