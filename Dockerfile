FROM node:20-alpine

WORKDIR /app

# Гарантируем установку dev-зависимостей (nodemon).
ENV NODE_ENV=development

# Манифесты — для кэширования слоя зависимостей.
COPY package*.json ./

# Все зависимости, включая dev (nodemon).
RUN npm install

# Исходники, модели и скрипт заполнения демо-данными.
COPY . .

# Скрипт запуска: заполняет MongoDB демо-данными, затем стартует сервер.
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint
RUN chmod +x /usr/local/bin/docker-entrypoint

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint"]
CMD ["npm", "run", "dev"]
