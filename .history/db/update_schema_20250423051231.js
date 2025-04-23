// Elriel - Database Schema Update Script
// Adds tables and columns for new features

const Database = require('better-sqlite3');
const path = require('path');

// Connect to SQLite database
const db = new Database(path.join(__dirname, 'elriel.db'), { verbose: console.log });

console.log('Updating Elriel database schema...');

// Run schema updates
try {
  // Add user_activity_logs table for tracking user actions
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      activity_type TEXT NOT NULL,
      description TEXT NOT NULL,
      metadata TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('User activity logs table created');

  // Add rewards table for badges and achievements
  db.exec(`
    CREATE TABLE IF NOT EXISTS rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      badge_image TEXT,
      reward_type TEXT NOT NULL,
      unlock_condition TEXT,
      reputation_value INTEGER DEFAULT 0,
      is_hidden INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Rewards table created');

  // Add user_rewards table to track earned rewards
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      reward_id INTEGER NOT NULL,
      earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_equipped INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE CASCADE,
      UNIQUE(user_id, reward_id)
    )
  `);
  console.log('User rewards table created');

  // Add user_reputation table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_reputation (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      reputation_points INTEGER DEFAULT 0,
      reputation_level INTEGER DEFAULT 1,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('User reputation table created');

  // Add encrypted_messages table
  db.exec(`
    CREATE TABLE IF NOT EXISTS encrypted_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER,
      recipient_id INTEGER,
      encrypted_content TEXT NOT NULL,
      public_hint TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_read INTEGER DEFAULT 0,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  console.log('Encrypted messages table created');

  // Update districts table with theme information and puzzle data
  db.exec(`
    ALTER TABLE districts ADD COLUMN IF NOT EXISTS css_theme TEXT;
    ALTER TABLE districts ADD COLUMN IF NOT EXISTS theme_color TEXT;
    ALTER TABLE districts ADD COLUMN IF NOT EXISTS unlock_puzzle TEXT;
    ALTER TABLE districts ADD COLUMN IF NOT EXISTS has_forum INTEGER DEFAULT 0;
    ALTER TABLE districts ADD COLUMN IF NOT EXISTS has_chat INTEGER DEFAULT 0;
    ALTER TABLE districts ADD COLUMN IF NOT EXISTS has_minigame INTEGER DEFAULT 0;
  `);
  console.log('Districts table updated');

  // Update profiles table for theme templates
  db.exec(`
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme_template TEXT DEFAULT 'default';
  `);
  console.log('Profiles table updated');

  // Add forum_categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS forum_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      district_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      is_encrypted INTEGER DEFAULT 0,
      access_level TEXT DEFAULT 'public',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE
    )
  `);
  console.log('Forum categories table created');

  // Add forum_threads table
  db.exec(`
    CREATE TABLE IF NOT EXISTS forum_threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      user_id INTEGER,
      title TEXT NOT NULL,
      is_encrypted INTEGER DEFAULT 0,
      is_pinned INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES forum_categories(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);
  console.log('Forum threads table created');

  // Add forum_posts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS forum_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL,
      user_id INTEGER,
      content TEXT NOT NULL,
      is_encrypted INTEGER DEFAULT 0,
      glyph_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (thread_id) REFERENCES forum_threads(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (glyph_id) REFERENCES glyphs(id) ON DELETE SET NULL
    )
  `);
  console.log('Forum posts table created');

  // Insert WHISPERBOARD district
  const whisperboardStmt = db.prepare(`
    INSERT OR IGNORE INTO districts (name, description, theme, is_hidden, access_code, css_theme, theme_color, has_forum, has_chat)
    VALUES ('WHISPERBOARD', 'A private, encrypted forum for sensitive communications. What happens in WHISPERBOARD stays in WHISPERBOARD.', 'encrypted', 1, 'SPEAK-FREELY', 'dark_encrypted', '#cc00ff', 1, 1)
  `);
  whisperboardStmt.run();
  console.log('WHISPERBOARD district created');

  // Create some hidden districts with puzzles
  const hiddenDistricts = [
    {
      name: 'VOID SECTOR',
      description: 'A glitched and corrupted sector of fragmented data. Reality is unstable here.',
      theme: 'glitch',
      access_code: 'BLACKHOLE-TERMINAL',
      css_theme: 'void_glitch',
      theme_color: '#ff0033',
      unlock_puzzle: 'Find the void command and enter the correct sequence of void coordinates.'
    },
    {
      name: 'DIGITAL OCCULT',
      description: 'Where code meets ritual. The digital manifestation of arcane practices.',
      theme: 'occult',
      access_code: 'SIGIL-MANIFESTATION',
      css_theme: 'occult_dark',
      theme_color: '#800080',
      unlock_puzzle: 'Create a perfect sigil in the crucible with all five elements aligned.'
    },
    {
      name: 'NEURAL NEXUS',
      description: 'A district for enhanced minds. Neural interfaces recommended but not required.',
      theme: 'neural',
      access_code: 'CORTEX-OVERRIDE',
      css_theme: 'neural_blue',
      theme_color: '#0077ff',
      unlock_puzzle: 'Decode the neural pattern sequence hidden in the terminal glitches.'
    }
  ];
  
  const districtInsert = db.prepare(`
    INSERT OR IGNORE INTO districts 
    (name, description, theme, is_hidden, access_code, css_theme, theme_color, unlock_puzzle, has_forum, has_minigame)
    VALUES (?, ?, ?, 1, ?, ?, ?, ?, 1, 1)
  `);
  
  hiddenDistricts.forEach(district => {
    districtInsert.run(
      district.name,
      district.description,
      district.theme,
      district.access_code,
      district.css_theme,
      district.theme_color,
      district.unlock_puzzle
    );
  });
  console.log('Hidden districts created');

  // Insert initial rewards/badges
  const rewards = [
    {
      name: 'Network Initiate',
      description: 'Joined the Elriel Network',
      badge_image: '/images/badges/initiate.svg',
      reward_type: 'badge',
      reputation_value: 10,
      is_hidden: 0
    },
    {
      name: 'Content Creator',
      description: 'Created your first post',
      badge_image: '/images/badges/creator.svg',
      reward_type: 'badge',
      reputation_value: 20,
      is_hidden: 0
    },
    {
      name: 'Sigil Master',
      description: 'Created a glyph in the Crucible',
      badge_image: '/images/badges/sigil.svg',
      reward_type: 'badge',
      reputation_value: 30,
      is_hidden: 0
    },
    {
      name: 'Whisper in the Dark',
      description: 'Posted to the Whisperboard',
      badge_image: '/images/badges/whisper.svg',
      reward_type: 'badge',
      reputation_value: 15,
      is_hidden: 0
    },
    {
      name: 'Void Walker',
      description: 'Discovered the Void Sector district',
      badge_image: '/images/badges/void.svg',
      reward_type: 'badge',
      reputation_value: 50,
      is_hidden: 1
    },
    {
      name: 'Digital Occultist',
      description: 'Accessed the Digital Occult district',
      badge_image: '/images/badges/occult.svg',
      reward_type: 'badge',
      reputation_value: 50,
      is_hidden: 1
    },
    {
      name: 'Neural Interface',
      description: 'Connected to the Neural Nexus district',
      badge_image: '/images/badges/neural.svg',
      reward_type: 'badge',
      reputation_value: 50,
      is_hidden: 1
    },
    {
      name: 'Cryptographer',
      description: 'Sent your first encrypted message',
      badge_image: '/images/badges/crypto.svg',
      reward_type: 'badge',
      reputation_value: 25,
      is_hidden: 0
    }
  ];
  
  const rewardInsert = db.prepare(`
    INSERT OR IGNORE INTO rewards
    (name, description, badge_image, reward_type, reputation_value, is_hidden)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  rewards.forEach(reward => {
    rewardInsert.run(
      reward.name,
      reward.description,
      reward.badge_image,
      reward.reward_type,
      reward.reputation_value,
      reward.is_hidden
    );
  });
  console.log('Initial rewards created');

  // Create WHISPERBOARD forum category
  const whisperboardCat = db.prepare(`
    INSERT OR IGNORE INTO forum_categories (district_id, name, description, is_encrypted, access_level)
    VALUES (
      (SELECT id FROM districts WHERE name = 'WHISPERBOARD'),
      'ENCRYPTED COMMUNICATIONS',
      'All messages here are encrypted. Only those with the key may understand.',
      1,
      'restricted'
    )
  `);
  whisperboardCat.run();
  console.log('WHISPERBOARD forum category created');

  console.log('Database schema update complete.');
} catch (err) {
  console.error('Database schema update failed:', err);
} finally {
  db.close();
}