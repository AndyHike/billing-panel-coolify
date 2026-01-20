# Dockerfile для Coolify Admin Panel
# Оптимізований для Coolify deployment

FROM node:20-alpine AS base

# Встановлюємо залежності для PostgreSQL
RUN apk add --no-cache libc6-compat postgresql-client

WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Копіюємо файли залежностей
COPY package.json package-lock.json* ./

# Встановлюємо залежності
RUN npm ci

# Build the application
FROM base AS builder
WORKDIR /app

# Копіюємо залежності з попереднього stage
COPY --from=deps /app/node_modules ./node_modules

# Копіюємо всі файли проекту
COPY . .

# Вимикаємо телеметрію Next.js під час білда
ENV NEXT_TELEMETRY_DISABLED=1

# Білдимо додаток
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Створюємо non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копіюємо публічні файли
COPY --from=builder /app/public ./public

# Створюємо .next директорію з правильними правами
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Копіюємо білд
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Запускаємо додаток
CMD ["node", "server.js"]
