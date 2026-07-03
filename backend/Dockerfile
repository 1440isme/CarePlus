# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package manifests
COPY package.json pnpm-lock.yaml ./

# Install all dependencies including devDependencies for prisma client generation
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma Client (uses a mock DATABASE_URL to satisfy Prisma 7 validation during build)
RUN DATABASE_URL="mysql://mock:mock@localhost:3306/mock" pnpm exec prisma generate

# Build stage 2 - production runner
FROM node:20-alpine AS runner
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package manifests
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy generated Prisma client from builder
COPY --from=builder /app/node_modules/.pnpm /app/node_modules/.pnpm
COPY --from=builder /app/node_modules/@prisma /app/node_modules/@prisma

# Copy source code and config files
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "src/server.js"]
