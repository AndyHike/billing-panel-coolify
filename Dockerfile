# Dockerfile для Coolify Admin Panel на базі Debian Slim
FROM node:20-bookworm-slim AS base

# Встановлюємо залежності для PostgreSQL та інструменти збірки для pg-native
# Нам потрібні python3, build-essential та libpq-dev для node-gyp
RUN apt-get update && apt-get install -y \
    libpq-dev \
    build-essential \
    python3 \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Етап встановлення залежностей
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json* ./

# Встановлюємо залежності (тепер pg-native зможе скомпілюватися)
RUN npm install

# Етап збірки додатку
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Production образ
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Створюємо non-root user (синтаксис Debian відрізняється від Alpine)
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public

# Створюємо .next директорію з правильними правами
RUN mkdir .next && chown nextjs:nodejs .next

# Копіюємо білд (standalone режим Next.js)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
