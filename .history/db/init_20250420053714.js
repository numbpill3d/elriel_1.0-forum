// Elriel - Database Initialization Script
// Creates all necessary tables for the application

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Connect to SQLite database
const db = new Database(path.join(__dirname, 'elriel.db'), { verbose: console.log });

console.log('Initializing Elriel database...');

// Create tables
const createTables = () => {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP,
      is_admin INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active'
    )
  `);
  console.log('Users table initialized');

  // Profiles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      status TEXT,
      background_image TEXT,
      custom_css TEXT,
      custom_html TEXT,
      blog_layout TEXT DEFAULT 'feed',
      glyph_id INTEGER,
      district_id INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('Profiles table initialized');

  // Posts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT,
      is_encrypted INTEGER DEFAULT 0,
      encryption_key TEXT,
      glyph_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('Posts table initialized');

  // Glyphs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS glyphs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      svg_data TEXT NOT NULL,
      audio_data TEXT,
      seed TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  console.log('Glyphs table initialized');

  // Whispers table (anonymous messages)
  db.exec(`
    CREATE TABLE IF NOT EXISTS whispers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      glyph_id INTEGER,
      is_encrypted INTEGER DEFAULT 0,
      encryption_key TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (glyph_id) REFERENCES glyphs(id) ON DELETE SET NULL
    )
  `);
  console.log('Whispers table initialized');

  // Districts table (aesthetic sub-networks)
  db.exec(`
    CREATE TABLE IF NOT EXISTS districts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      theme TEXT,
      is_hidden INTEGER DEFAULT 0,
      access_code TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Districts table initialized');

  // Announcements table (for admin messages on landing page)
  db.exec(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Announcements table initialized');
};

// Insert initial data
const insertInitialData = () => {
  // Insert default district (Numbpill Cell)
  const districtStmt = db.prepare(`
    INSERT OR IGNORE INTO districts (id, name, description, theme)
    VALUES (1, 'Numbpill Cell', 'The primary node of the Elriel network. A digital wasteland of glitched terminals and corrupted data.', 'terminal')
  `);
  districtStmt.run();
  console.log('Default district created');

  // Insert admin user if it doesn't exist
  const adminUserStmt = db.prepare(`
    INSERT OR IGNORE INTO users (username, password, email, is_admin)
    VALUES ('admin', '$2b$10$rH7ppDcX.uNIh3LXnL0QC.4SPnYZDPbHaG0nIrgW9hTZjY3mU8bEe', 'admin@elriel.net', 1)
  `);
  adminUserStmt.run();
  console.log('Admin user created (username: admin, password: elriel_admin)');

  // Insert initial announcement
  const announcementStmt = db.prepare(`
    INSERT OR IGNORE INTO announcements (id, title, content)
    VALUES (1, 'SYSTEM ALERT', 'Welcome to Elriel. This terminal has been compromised. Proceed with caution. The Numbpill Cell awaits your contribution.')
  `);
  announcementStmt.run();
  console.log('Initial announcement created');
};

// Run initialization
try {
  createTables();
  insertInitialData();
  console.log('Database initialization complete.');
} catch (err) {
  console.error('Database initialization failed:', err);
} finally {
  db.close();
}