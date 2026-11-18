#!/bin/sh
set -e

echo "Ожидание MongoDB и заполнение демо-данными..."
attempt=1
until node seed.js; do
  if [ "$attempt" -ge 30 ]; then
    echo "MongoDB недоступна, завершение."
    exit 1
  fi
  echo "MongoDB ещё не готова, попытка $attempt/30, повтор через 3 сек..."
  attempt=$((attempt + 1))
  sleep 3
done

echo "Запуск сервера..."
exec "$@"
