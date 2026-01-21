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

# Копіюємо файли конфігурації пакетів
COPY package.json pnpm-lock.yaml* ./

# Встановлюємо ВСІ залежності
RUN pnpm install --frozen-lockfile

# --- Етап збірки ---
FROM base AS builder
WORKDIR /app

# Копіюємо залежності з попереднього етапу
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Вимикаємо телеметрію
ENV NEXT_TELEMETRY_DISABLED=1

# Запускаємо білд
RUN pnpm run build

# --- Етап Production ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Створюємо користувача для безпеки
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

# Копіюємо публічні файли
COPY --from=builder /app/public ./public

# Створюємо необхідні папки та налаштовуємо права
RUN mkdir .next logs && chown nextjs:nodejs .next logs

# Копіюємо результати збірки (Next.js standalone)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# !!! ДОДАНО: Копіюємо папку lib для роботи крона !!!
# Це дозволить запускати 'node lib/cron.js' в окремому ресурсі
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# За замовчуванням запускаємо веб-сервер. 
# Для крон-ресурсу в Coolify ви зміните Start Command на 'node lib/cron.js'
CMD ["node", "server.js"]
