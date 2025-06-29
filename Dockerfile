# Use Node.js 20 LTS Alpine for smaller image size
FROM node:20-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy root package.json for engine requirements
COPY package*.json ./

# Copy backend package.json and install dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --only=production
WORKDIR /app

# Copy backend source code
COPY backend/ ./backend/

# Create uploads directory
RUN mkdir -p ./backend/uploads

# Create a simple API status page for the root route
RUN mkdir -p ./backend/public && \
    echo '<!DOCTYPE html><html><head><title>MetroUni API Server</title><style>body{font-family:Arial,sans-serif;margin:40px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;text-align:center}.container{max-width:800px;margin:0 auto}.status{background:#4CAF50;padding:15px;border-radius:8px;margin:20px 0}.link{color:#fff;text-decoration:none;background:rgba(255,255,255,0.2);padding:10px 20px;border-radius:5px;margin:10px;display:inline-block}h1{font-size:2.5em;margin-bottom:20px}</style></head><body><div class="container"><h1>🎓 MetroUni API Server</h1><div class="status">✅ Backend API Running Successfully</div><p>Your MetroUni social learning platform backend is live!</p><div><a href="/api/health" class="link">🔍 Health Check</a><a href="https://wondrous-souffle-ff83f7.netlify.app" class="link">🌐 Frontend App</a></div><p style="margin-top:40px;opacity:0.8">Frontend: <strong>https://wondrous-souffle-ff83f7.netlify.app</strong></p></div></body></html>' > ./backend/public/index.html

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV JWT_EXPIRES_IN=7d
ENV UPLOAD_MAX_SIZE=10485760
ENV RATE_LIMIT_WINDOW_MS=900000
ENV RATE_LIMIT_MAX_REQUESTS=100

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Set working directory to backend for startup
WORKDIR /app/backend

# Start the backend server
CMD ["node", "server.js"]