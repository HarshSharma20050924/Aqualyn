# --- STAGE 1: BUILD ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies + OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat
COPY package*.json ./
RUN npm install

# Build Prisma & App
COPY . .
RUN npx prisma generate
RUN npm run build

# --- STAGE 2: PRODUCTION ---
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Install OpenSSL for Prisma Runtime
RUN apk add --no-cache openssl libc6-compat

# Only copy production dependencies & build artifacts
COPY package*.json ./
RUN npm install --only=production
RUN npm install -g prisma

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Production Start Script
EXPOSE 5000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
