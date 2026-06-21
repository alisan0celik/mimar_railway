#!/bin/sh
set -e

echo "Booting Mimar API..."
echo "Node: $(node -v)"
echo "Working directory: $(pwd)"
echo "PORT: ${PORT:-3000}"
echo "DATABASE_URL: ${DATABASE_URL:+set}"

echo "Running database migrations..."
node scripts/railway-migrate.js

echo "Starting API server..."
exec node dist/main.js
