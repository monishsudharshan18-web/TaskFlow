# ==============================================================================
# Multi-stage Dockerfile for TaskFlow Full-Stack (Frontend + Backend + Supabase)
# ==============================================================================

FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source files
COPY . .

# Build frontend and server
RUN npm run build

# ==============================================================================
# Production Runtime Stage
# ==============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy built frontend assets and server bundle
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server

# Expose port (default 5000 or dynamically set by host like Render/Railway/CloudRun)
EXPOSE 5000

# Start unified Node.js Express server
CMD ["node", "dist-server/server.js"]
