#!/usr/bin/env bash
# Build script for Render.com

set -o errexit

# Install dependencies
composer install --no-dev --optimize-autoloader

# Clear and warm up cache
rm -rf var/cache/*
APP_ENV=prod php bin/console cache:clear --no-debug --no-warmup
APP_ENV=prod php bin/console cache:warmup --no-debug

# Create public/uploads directory if it doesn't exist
mkdir -p public/uploads

echo "Build completed successfully!"
