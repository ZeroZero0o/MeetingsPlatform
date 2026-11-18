#!/bin/sh
set -e

echo "Ожидание базы данных и применение миграций..."
attempt=1
until npx sequelize-cli db:migrate; do
  if [ "$attempt" -ge 30 ]; then
    echo "База данных недоступна, завершение."
    exit 1
  fi
  echo "База ещё не готова, попытка $attempt/30, повтор через 3 сек..."
  attempt=$((attempt + 1))
  sleep 3
done

echo "Заполнение демо-данными (если ещё не применены)..."
npx sequelize-cli db:seed:all

echo "Запуск сервера..."
exec "$@"
