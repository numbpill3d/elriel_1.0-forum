// Elriel - Bleedstream Enhancement Update Script
// Updates database schema for enhanced Bleedstream features

const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'elriel.db'), { verbose: console.log });

console.log('Updating Elriel database for Bleedstream enhancements...');

try {
  // Start a transaction
  db.prepare('BEGIN').run();

  // 1. Create activity_log table
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      activity_type TEXT NOT NULL,
      activity_data TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('Activity log table created');

  // 2. Create user_interests table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_interests (
      user_id INTEGER NOT NULL,
      tag TEXT,
      district_id INTEGER,
      glyph_id INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE SET NULL,
      FOREIGN KEY (glyph_id) REFERENCES glyphs(id) ON DELETE SET NULL
    )
  `);
  console.log('User interests table created');

  // 3. Add customization columns to users table
  // Check if the columns exist first to avoid errors
  const userColumns = db.prepare(`PRAGMA table_info(users)`).all();
  const columnNames = userColumns.map(col => col.name);

  if (!columnNames.includes('theme')) {
    db.exec(`ALTER TABLE users ADD COLUMN theme TEXT DEFAULT 'default'`);
    console.log('Added theme column to users table');
  }

  if (!columnNames.includes('background_image')) {
    db.exec(`ALTER TABLE users ADD COLUMN background_image TEXT`);
    console.log('Added background_image column to users table');
  }

  if (!columnNames.includes('font_size')) {
    db.exec(`ALTER TABLE users ADD COLUMN font_size TEXT DEFAULT 'medium'`);
    console.log('Added font_size column to users table');
  }

  if (!columnNames.includes('font_color')) {
    db.exec(`ALTER TABLE users ADD COLUMN font_color TEXT DEFAULT 'black'`);
    console.log('Added font_color column to users table');
  }

  // 4. Create indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);
    CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON user_interests(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_interests_tag ON user_interests(tag);
  `);
  console.log('Created indexes for performance');

  // Commit the transaction
  db.prepare('COMMIT').run();
  console.log('Database update completed successfully');
} catch (err) {
  // Rollback in case of error
  db.prepare('ROLLBACK').run();
  console.error('Database update failed:', err);
} finally {
  db.close();
}