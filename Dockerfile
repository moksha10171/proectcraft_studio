# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY frontend/package.json /app/frontend/package.json
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY frontend ./frontend
COPY data ./data
COPY package.json pnpm-lock.yaml ./
ENV GEMINI_API_KEY=placeholder-build-only \
    GROQ_API_KEY=placeholder-build-only \
    BACKEND_URL=http://backend:8000 \
    NEXT_PUBLIC_APP_URL=http://localhost:3000
WORKDIR /app/frontend
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/frontend/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0 BACKEND_URL=http://backend:8000
CMD ["node", "server.js"]
