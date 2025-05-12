// Elriel - Enhanced Scrapyard Update
// Adds tag system, ratings, and improved search capabilities

const Database = require('better-sqlite3');
const db = new Database('./db/elriel.db', { verbose: console.log });

console.log("Enhancing Scrapyard with advanced features...");

try {
  // Begin transaction
  db.exec('BEGIN TRANSACTION');

  // 1. Create asset_tags table
  db.exec(`
    CREATE TABLE IF NOT EXISTS asset_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("Asset tags table created");

  // 2. Create asset_ratings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS asset_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (asset_id) REFERENCES scrapyard_assets(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(asset_id, user_id)
    )
  `);
  console.log("Asset ratings table created");

  // 3. Modify scrapyard_assets table to update category reference and add rating fields
  // First check if we need to make these changes
  const tableInfo = db.prepare(`PRAGMA table_info(scrapyard_assets)`).all();
  const hasRating = tableInfo.some(col => col.name === 'rating');
  const hasCategoryId = tableInfo.some(col => col.name === 'category_id');
  
  if (!hasRating) {
    // Add rating and rating_count fields
    db.exec(`
      ALTER TABLE scrapyard_assets 
      ADD COLUMN rating REAL DEFAULT 0.0
    `);
    db.exec(`
      ALTER TABLE scrapyard_assets 
      ADD COLUMN rating_count INTEGER DEFAULT 0
    `);
    console.log("Added rating fields to scrapyard_assets");
  }

  if (!hasCategoryId) {
    // Add category_id field, but first we need to migrate existing data
    console.log("Migrating category data to use category_id references...");
    
    // First add the category_id column
    db.exec(`
      ALTER TABLE scrapyard_assets 
      ADD COLUMN category_id INTEGER REFERENCES asset_categories(id)
    `);
    
    // Update all existing assets to use the proper category_id
    const assets = db.prepare(`SELECT id, category FROM scrapyard_assets`).all();
    const updateCategoryId = db.prepare(`
      UPDATE scrapyard_assets 
      SET category_id = (SELECT id FROM asset_categories WHERE name = ?) 
      WHERE id = ?
    `);
    
    for (const asset of assets) {
      if (asset.category) {
        updateCategoryId.run(asset.category, asset.id);
      }
    }
    console.log(`Updated category_id for ${assets.length} assets`);
  }

  // 4. Create some initial tags
  const initialTags = [
    'pixel-art', 'retro', 'cyberpunk', 'glitch', 'vaporwave', 
    'minimal', 'textmode', 'animated', 'brutalist', 'geometric',
    'web1.0', 'y2k', 'synthwave', 'distorted', 'wireframe'
  ];

  const insertTag = db.prepare(`
    INSERT OR IGNORE INTO asset_tags (name)
    VALUES (?)
  `);

  for (const tag of initialTags) {
    insertTag.run(tag);
  }
  console.log("Initial tags created");

  // 5. Add indices for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_scrapyard_assets_category_id ON scrapyard_assets(category_id);
    CREATE INDEX IF NOT EXISTS idx_asset_ratings_asset_id ON asset_ratings(asset_id);
    CREATE INDEX IF NOT EXISTS idx_asset_ratings_user_id ON asset_ratings(user_id);
  `);
  console.log("Performance indices created");
  
  // Commit transaction
  db.exec('COMMIT');
  console.log("Scrapyard enhancement completed successfully!");

} catch (err) {
  // Rollback on error
  db.exec('ROLLBACK');
  console.error('Error enhancing scrapyard:', err);
} finally {
  db.close();
}