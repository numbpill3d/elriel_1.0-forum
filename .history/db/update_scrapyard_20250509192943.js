// Elriel - Scrapyard Marketplace Update
// Upgrade the scrapyard to a full user-run marketplace for digital assets

const Database = require('better-sqlite3');
const db = new Database('./db/elriel.db', { verbose: console.log });

console.log("Upgrading Scrapyard to marketplace functionality...");

try {
  // Begin transaction
  db.exec('BEGIN TRANSACTION');

  // 1. Create junkers table for users registered as asset creators
  db.exec(`
    CREATE TABLE IF NOT EXISTS junkers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      junker_name TEXT,
      bio TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      reputation INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log("Junkers table created");

  // 2. Create scrapyard_assets table for marketplace items
  db.exec(`
    CREATE TABLE IF NOT EXISTS scrapyard_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      file_path TEXT NOT NULL,
      thumbnail_path TEXT,
      asset_type TEXT NOT NULL,
      category TEXT NOT NULL,
      tags TEXT,
      download_count INTEGER DEFAULT 0,
      likes_count INTEGER DEFAULT 0,
      is_free INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log("Scrapyard assets table created");

  // 3. Create asset_favorites table for user favorites
  db.exec(`
    CREATE TABLE IF NOT EXISTS asset_favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      asset_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (asset_id) REFERENCES scrapyard_assets(id) ON DELETE CASCADE,
      UNIQUE(user_id, asset_id)
    )
  `);
  console.log("Asset favorites table created");

  // 4. Create asset_comments table 
  db.exec(`
    CREATE TABLE IF NOT EXISTS asset_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (asset_id) REFERENCES scrapyard_assets(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log("Asset comments table created");

  // 5. Add predefined asset categories
  const assetCategories = [
    'favicon', 'divider', 'background', 'template', 'widget', 
    'image', 'font', 'button', 'blinkie', 'cursor', 'other'
  ];

  // Create table for asset categories if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS asset_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert categories if they don't exist
  const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO asset_categories (name, display_name, description)
    VALUES (?, ?, ?)
  `);

  const categoryDescriptions = {
    'favicon': 'Small icons for website tabs and bookmarks',
    'divider': 'Decorative separators for webpages',
    'background': 'Background images and patterns',
    'template': 'Full templates for websites and profiles',
    'widget': 'Interactive elements and components',
    'image': 'GIFs, PNGs and other images',
    'font': 'Custom fonts and typography',
    'button': 'Clickable UI buttons and elements',
    'blinkie': 'Small animated banners',
    'cursor': 'Custom mouse cursors',
    'other': 'Miscellaneous digital assets'
  };

  for (const category of assetCategories) {
    const displayName = category.toUpperCase();
    const description = categoryDescriptions[category] || `${displayName} assets for web use`;
    insertCategory.run(category, displayName, description);
  }
  console.log("Asset categories initialized");

  // 6. Update the scrapyard description in forums table
  db.exec(`
    UPDATE forums
    SET description = 'A user-run marketplace for digital assets. Find and share favicons, dividers, backgrounds, templates, widgets, images, fonts, buttons, blinkies and more!'
    WHERE slug = 'scrapyard'
  `);
  console.log("Updated scrapyard description");

  // Create directories for asset uploads if they don't exist
  const fs = require('fs');
  const path = require('path');
  
  const uploadsPath = path.join(__dirname, '../public/uploads/assets');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log(`Created asset uploads directory at ${uploadsPath}`);
  }

  const thumbnailsPath = path.join(__dirname, '../public/uploads/assets/thumbnails');
  if (!fs.existsSync(thumbnailsPath)) {
    fs.mkdirSync(thumbnailsPath, { recursive: true });
    console.log(`Created thumbnails directory at ${thumbnailsPath}`);
  }

  // Commit transaction
  db.exec('COMMIT');
  console.log("Scrapyard upgrade completed successfully!");

} catch (err) {
  // Rollback on error
  db.exec('ROLLBACK');
  console.error('Error upgrading scrapyard:', err);
} finally {
  db.close();
}