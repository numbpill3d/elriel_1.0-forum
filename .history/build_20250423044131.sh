#!/bin/bash
# Build script for Render deployment

# Install dependencies
npm install

# Remove problematic native modules and reinstall without them
rm -rf node_modules/better-sqlite3
npm uninstall better-sqlite3

# Display completion message
echo "Build completed successfully!"