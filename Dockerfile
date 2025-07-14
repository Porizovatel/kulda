# Multi-stage build for production
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm ci --only=production
RUN cd backend && npm ci --only=production

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Build backend
RUN cd backend && npm run build

# Production stage
FROM node:18-alpine AS production

# Install sqlite3 and other runtime dependencies
RUN apk add --no-cache sqlite

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S kulich -u 1001

# Set working directory
WORKDIR /app

# Create data directory with proper permissions
RUN mkdir -p /app/data && chown kulich:nodejs /app/data

# Copy built application
COPY --from=builder --chown=kulich:nodejs /app/dist ./frontend
COPY --from=builder --chown=kulich:nodejs /app/backend/dist ./backend
COPY --from=builder --chown=kulich:nodejs /app/backend/node_modules ./backend/node_modules
COPY --from=builder --chown=kulich:nodejs /app/backend/package.json ./backend/

# Copy migration files
COPY --from=builder --chown=kulich:nodejs /app/backend/src/migrations ./backend/migrations

# Switch to non-root user
USER kulich

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "backend/server.js"]