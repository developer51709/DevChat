#!/bin/bash
# Discord Devs Database Recovery Script

echo "Checking database connection..."
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL is not set."
    exit 1
fi

echo "Attempting to push schema to database..."
npm run db:push

if [ $? -eq 0 ]; then
    echo "Database schema synchronized successfully."
else
    echo "Standard push failed. Attempting forced push..."
    npm run db:push -- --force
fi

echo "Recovery complete."
