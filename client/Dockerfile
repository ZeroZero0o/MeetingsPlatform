FROM node:20-alpine

WORKDIR /app

# Гарантируем установку dev-зависимостей (vite, @vitejs/plugin-react).
ENV NODE_ENV=development

# Манифесты — для кэширования слоя зависимостей.
COPY package*.json ./
RUN npm install

# Исходники клиента (Vite + React).
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
