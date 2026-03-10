# Используем Node 20 (Debian-based, чтобы работали сборщики C++)
FROM node:20-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# 1. Копируем конфиги зависимостей (для кэширования слоев)
COPY package*.json ./
COPY apps/server/package.json ./apps/server/
COPY apps/electron/package.json ./apps/electron/
COPY packages/shared/package.json ./packages/shared/

# 2. Устанавливаем зависимости
# npm ci работает быстрее и надежнее для CI/CD
# Это скомпилирует better-sqlite3 под Linux
RUN npm install

# 3. Копируем исходный код
COPY packages/shared ./packages/shared
COPY apps/server ./apps/server

# 4. Билдим Shared и Server (если у shared есть билд-шаг)
# Если shared - это просто TS файлы, то достаточно билда сервера
RUN npm run build --workspace=@btw-app/server

# 5. Переменные окружения
ENV NODE_ENV=production
ENV DATA_DIR=/app/data
ENV PORT=3000

# 6. Открываем порт
EXPOSE 3000

# 7. Запускаем
CMD ["npm", "start", "--workspace=@btw-app/server"]