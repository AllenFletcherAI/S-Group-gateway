# Multi-stage production build for S-Group Gateway (Schäfer & SIS Interlogistik)
# Stage 1: Build & Compile TypeScript
FROM node:24-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json tsconfig.json ./

# Install all dependencies including devDependencies for build
RUN npm ci

# Copy source code and static assets
COPY src/ ./src

# Compile TypeScript and copy static files to dist/
RUN npm run build

# Stage 2: Hardened, Non-Root Production Runtime
FROM node:24-alpine AS runner

WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

# Copy package manifests
COPY package*.json ./

# Install only production dependencies and clear cache to minimize image size
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application and static assets from builder stage
COPY --from=builder --chown=node:node /app/dist ./dist

# Switch to unprivileged non-root user (UID 1000)
USER node

# Expose internal gateway port
EXPOSE 3000

# Container orchestrator healthcheck probe
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:3000/health || exit 1

# Start S-Group Gateway
CMD ["node", "dist/server.js"]
