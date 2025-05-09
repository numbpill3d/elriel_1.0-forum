#!/bin/bash
# Build script for Render deployment

# Pre-install clean up to remove any trace of better-sqlite3
echo "Cleaning up any traces of SQLite..."
rm -rf node_modules/better-sqlite3
rm -rf node_modules/sqlite3
rm -rf node_modules/.bin/better-sqlite3
npm uninstall --save better-sqlite3 sqlite3 2>/dev/null || true

# Create a temporary .npmrc file to prevent SQLite installation
echo "better-sqlite3@*:*=false" > .npmrc
echo "sqlite3@*:*=false" >> .npmrc

# Install dependencies with SQLite excluded
echo "Installing dependencies without SQLite..."
npm install --omit=optional

# Double check for any better-sqlite3 that might have been installed as a sub-dependency
echo "Performing final cleanup of SQLite dependencies..."
find ./node_modules -name "better-sqlite3" -type d -exec rm -rf {} +
find ./node_modules -name "sqlite3" -type d -exec rm -rf {} +

# Make sure we're using app_render.js
echo "Ensuring we use app_render.js..."
# This will make "start" script use app_render.js, not app_supabase.js
if ! grep -q '"start": "node app_render.js"' package.json; then
  echo "ERROR: package.json is not correctly configured!"
  echo "The start script must use app_render.js, not app_supabase.js."
  cat package.json
  exit 1
fi

# Verify the app_render.js file exists
if [ ! -f "app_render.js" ]; then
  echo "ERROR: app_render.js not found!"
  exit 1
fi

# Display completion message
echo "Build completed successfully for Render deployment!"
echo "Using app_render.js which has no SQLite dependencies."