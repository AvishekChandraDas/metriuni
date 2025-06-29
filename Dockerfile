# MetroUni Production Dockerfile
# Multi-stage build for optimized production image

# Build stage for frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./
RUN npm ci --only=production

# Copy frontend source and build
COPY frontend/ ./
RUN npm run build

# Build stage for backend
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:18-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    tini \
    curl \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy backend application
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend ./backend
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/node_modules ./backend/node_modules

# Copy frontend built files
COPY --from=frontend-builder --chown=nodejs:nodejs /app/frontend/dist ./frontend/dist

# Copy backend source files
COPY --chown=nodejs:nodejs backend/ ./backend/

# Create necessary directories
RUN mkdir -p /app/uploads/posts \
    && mkdir -p /app/uploads/profiles \
    && mkdir -p /app/uploads/id-cards \
    && mkdir -p /app/uploads/temp \
    && mkdir -p /var/log/metrouni \
    && chown -R nodejs:nodejs /app/uploads \
    && chown -R nodejs:nodejs /var/log/metrouni

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Use tini as entrypoint for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node", "backend/server.js"]
