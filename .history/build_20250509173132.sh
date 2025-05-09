#!/bin/bash
# Build script for Render deployment

# Install dependencies with better-sqlite3 excluded
npm install --omit=optional

# Make sure better-sqlite3 is completely removed
rm -rf node_modules/better-sqlite3
npm uninstall --save better-sqlite3

# Add a .npmrc file to prevent accidental reinstallation
echo "better-sqlite3@*:*=false" > .npmrc

# Verify the app_render.js file exists
if [ ! -f "app_render.js" ]; then
  echo "ERROR: app_render.js not found!"
  exit 1
fi

# Display completion message
echo "Build completed successfully for Render deployment!"