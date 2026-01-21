# Dockerfile для Coolify (Next.js 16 + Tailwind 4)
FROM node:20-bookworm-slim AS base

# Встановлюємо системні залежності
RUN apt-get update && apt-get install -y \
    libpq-dev \
    build-essential \
    python3 \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Встановлюємо pnpm
RUN npm install -g pnpm

WORKDIR /app

# --- Етап залежностей ---
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# --- Етап збірки ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# Додаємо тимчасову адресу для білду, щоб уникнути помилок валідації
ENV DATABASE_URL=postgresql://placeholder:5432/db

RUN pnpm run build

# --- Етап Production ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
# Створюємо необхідні папки та налаштовуємо права
RUN mkdir .next logs && chown nextjs:nodejs .next logs

# Копіюємо результати збірки (standalone mode)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# !!! ВАЖЛИВО: Копіюємо папку lib, щоб скрипт cron.js був доступний всередині !!!
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# ПАРАЛЕЛЬНИЙ ЗАПУСК:
# node lib/cron.js & — запускає крон у фоні
# node server.js — запускає основний сервер Next.js
CMD node lib/cron.js & node server.js
