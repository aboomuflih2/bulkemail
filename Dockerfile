# Build stage
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Compile backend TypeScript to ES Modules
RUN npx tsc api/**/*.ts --outDir compiled --module es2020 --target es2020 --moduleResolution node --esModuleInterop true --allowSyntheticDefaultImports true --skipLibCheck true --resolveJsonModule true

# Production stage
FROM node:20-alpine

# Install curl for health check
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy compiled backend
COPY --from=builder /app/compiled ./api

# Copy production server
COPY --from=builder /app/api/prod-server.js ./server.js

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "server.js"]
