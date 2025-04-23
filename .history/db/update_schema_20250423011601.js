// Elriel - Database Schema Update Script
// Adds tables for forums, reputation, and enhanced customization

const Database = require('better-sqlite3');
const path = require('path');

// Connect to SQLite database
const db = new Database(path.join(__dirname, 'elriel.db'), { verbose: console.log });

console.log('Updating Elriel database schema...');

try {
  // Add reputation column to profiles table if it doesn't exist
  db.exec(`
    PRAGMA foreign_keys = OFF;
    
    BEGIN TRANSACTION;
    
    -- Check if reputation column exists in profiles
    SELECT COUNT(*) FROM pragma_table_info('profiles') WHERE name='reputation';
    
    -- Add reputation column if it doesn't exist
    ALTER TABLE profiles ADD COLUMN reputation INTEGER DEFAULT 0;
    
    -- Add profile_bg_type column
    ALTER TABLE profiles ADD COLUMN profile_bg_type TEXT DEFAULT 'single';
    
    -- Add profile_bg_tile column
    ALTER TABLE profiles ADD COLUMN profile_bg_tile INTEGER DEFAULT 0;
    
    -- Create forums table
    CREATE TABLE IF NOT EXISTS forums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      slug TEXT UNIQUE NOT NULL,
      icon TEXT,
      position INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Create forum topics table
    CREATE TABLE IF NOT EXISTS forum_topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      forum_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      is_pinned INTEGER DEFAULT 0,
      is_locked INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (forum_id) REFERENCES forums(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    
    -- Create forum comments table
    CREATE TABLE IF NOT EXISTS forum_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (topic_id) REFERENCES forum_topics(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    
    -- Create user signatures table
    CREATE TABLE IF NOT EXISTS user_signatures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      content TEXT,
      is_enabled INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    
    -- Create repute_rewards table
    CREATE TABLE IF NOT EXISTS repute_rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      unlock_at INTEGER NOT NULL,
      icon TEXT,
      css_class TEXT,
      data TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Create user_rewards table
    CREATE TABLE IF NOT EXISTS user_rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      reward_id INTEGER NOT NULL,
      is_equipped INTEGER DEFAULT 0,
      unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reward_id) REFERENCES repute_rewards(id) ON DELETE CASCADE,
      UNIQUE(user_id, reward_id)
    );
    
    -- Create profile_containers table
    CREATE TABLE IF NOT EXISTS profile_containers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL,
      container_type TEXT NOT NULL,
      title TEXT,
      content TEXT,
      position INTEGER DEFAULT 0,
      settings TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );
    
    -- Create skins table
    CREATE TABLE IF NOT EXISTS skins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      creator_id INTEGER,
      is_system INTEGER DEFAULT 0,
      css TEXT NOT NULL,
      preview_image TEXT,
      is_public INTEGER DEFAULT 0,
      required_repute INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL
    );
    
    -- Add glyph_rotation_speed and glyph_3d columns to profiles
    ALTER TABLE profiles ADD COLUMN glyph_rotation_speed INTEGER DEFAULT 3;
    ALTER TABLE profiles ADD COLUMN glyph_3d INTEGER DEFAULT 0;
    
    -- Add glyph_shape and glyph_color columns to glyphs
    ALTER TABLE glyphs ADD COLUMN glyph_shape TEXT DEFAULT 'standard';
    ALTER TABLE glyphs ADD COLUMN glyph_color TEXT DEFAULT '#00ff00';
    ALTER TABLE glyphs ADD COLUMN glyph_3d_model TEXT;
    
    -- Insert default forums
    INSERT INTO forums (title, description, slug, position) VALUES 
    ('General Discussion', 'General discussion about Elriel and related topics', 'general', 1),
    ('Introductions', 'Introduce yourself to the community', 'introductions', 2),
    ('Glyph Exchange', 'Share and discuss glyphs and sigils', 'glyphs', 3),
    ('Technical Support', 'Get help with terminal issues', 'support', 4),
    ('Cryptography', 'Discuss encryption and hidden messages', 'crypto', 5);
    
    -- Insert default repute rewards
    INSERT INTO repute_rewards (name, description, type, unlock_at, css_class, data) VALUES
    ('Green Terminal', 'Classic green terminal theme', 'theme', 0, 'theme-green', '{"primary":"#00ff00","background":"#0a0a0a"}'),
    ('Blue Terminal', 'Cool blue terminal theme', 'theme', 100, 'theme-blue', '{"primary":"#0077ff","background":"#0a0a0a"}'),
    ('Purple Terminal', 'Elegant purple terminal theme', 'theme', 250, 'theme-purple', '{"primary":"#cc00ff","background":"#0a0a0a"}'),
    ('Red Terminal', 'Aggressive red terminal theme', 'theme', 500, 'theme-red', '{"primary":"#ff0033","background":"#0a0a0a"}'),
    ('Gold Border', 'Gold border for profile containers', 'border', 200, 'border-gold', '{"borderColor":"#ffd700"}'),
    ('Neon Border', 'Neon glowing border for profile containers', 'border', 350, 'border-neon', '{"borderColor":"#00ffff","glowEffect":true}'),
    ('Circuit Border', 'Animated circuit pattern border', 'border', 750, 'border-circuit', '{"borderPattern":"circuit","animated":true}'),
    ('VT323 Font', 'Classic terminal font', 'font', 150, 'font-vt323', '{"fontFamily":"VT323"}'),
    ('Share Tech Mono Font', 'Technical monospace font', 'font', 0, 'font-share-tech', '{"fontFamily":"Share Tech Mono"}'),
    ('Ubuntu Mono Font', 'Clean, readable monospace font', 'font', 300, 'font-ubuntu', '{"fontFamily":"Ubuntu Mono"}'),
    ('Animated Avatar', 'Animated avatar frame', 'effect', 400, 'effect-animated-avatar', '{"animation":"pulse"}'),
    ('Glitch Username', 'Glitched username display effect', 'effect', 600, 'effect-glitch-text', '{"glitchLevel":2}'),
    ('Shadow Effects', 'Enhanced shadow effects for containers', 'effect', 450, 'effect-shadow', '{"shadowSize":"large","shadowColor":"rgba(0,255,0,0.5)"}');
    
    COMMIT;
    
    PRAGMA foreign_keys = ON;
  `);
  
  console.log('Database schema updated successfully');
} catch (err) {
  console.error('Database schema update failed:', err);
} finally {
  db.close();
}

console.log('Schema update script completed');