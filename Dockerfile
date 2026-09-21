FROM node:20-bookworm-slim AS builder

RUN npm install -g pnpm
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Копируем конфиги монорепозитория
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/

# Ставим зависимости
RUN pnpm install --frozen-lockfile

# Копируем исходники
COPY . .

# Генерируем Prisma и билдим бэкенд
RUN pnpm --filter @btw-app/db exec prisma generate
RUN pnpm --filter @btw-app/server build

# Финальный образ
FROM node:20-bookworm-slim
RUN npm install -g pnpm
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app ./

EXPOSE 3000

ENV NODE_OPTIONS="--dns-result-order=ipv4first"

# Команда запуска с автоматическим накатыванием миграций
CMD ["sh", "-c", "pnpm --filter @btw-app/db exec prisma migrate deploy && npx tsx apps/server/src/index.ts"]
