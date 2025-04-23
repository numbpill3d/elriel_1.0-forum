// Elriel - Web Development Forum Update
// Adds web development / underground web forum district and categories

const Database = require('better-sqlite3');
const path = require('path');

// Connect to SQLite database
const db = new Database(path.join(__dirname, 'elriel.db'), { verbose: console.log });

console.log('Adding Web Development & Underground Web Forum...');

try {
  // Create DARKNET district for web development and underground web topics
  const darknetDistrict = db.prepare(`
    INSERT OR IGNORE INTO districts (
      name, 
      description, 
      theme, 
      is_hidden, 
      access_code, 
      css_theme, 
      theme_color, 
      unlock_puzzle,
      has_forum, 
      has_chat, 
      has_minigame
    )
    VALUES (
      'DARKNET', 
      'Underground web development, unconventional coding techniques, and hidden networks. The source behind the surface.', 
      'underground', 
      0, 
      NULL,
      'darknet_theme', 
      '#1e5128', 
      NULL,
      1, 
      1, 
      0
    )
  `);
  
  darknetDistrict.run();
  console.log('DARKNET district created');
  
  // Get the district id
  const districtRow = db.prepare('SELECT id FROM districts WHERE name = ?').get('DARKNET');
  const districtId = districtRow.id;
  
  // Create forum categories for DARKNET
  const categories = [
    {
      name: 'RESOURCES & TOOLS',
      description: 'Development tools, libraries, frameworks, and resources for builders.',
      is_encrypted: 0,
      access_level: 'public'
    },
    {
      name: 'TUTORIALS & GUIDES',
      description: 'Learn techniques for web development and hidden network architecture.',
      is_encrypted: 0,
      access_level: 'public'
    },
    {
      name: 'SHARE YOUR SITE',
      description: 'Show off your web creations and get feedback from the community.',
      is_encrypted: 0,
      access_level: 'public'
    },
    {
      name: 'UNDERGROUND LINKS',
      description: 'Explore unconventional web spaces and hidden networks. No illegal content.',
      is_encrypted: 0,
      access_level: 'restricted'
    },
    {
      name: 'WEB THEORY',
      description: 'Discussions on web architecture, decentralization, and the future of networks.',
      is_encrypted: 0,
      access_level: 'public'
    },
    {
      name: 'RETRO WEB',
      description: 'Celebrate and resurrect the aesthetic of the early internet. Windows 98, geocities, etc.',
      is_encrypted: 0,
      access_level: 'public'
    }
  ];
  
  const categoryInsert = db.prepare(`
    INSERT OR IGNORE INTO forum_categories (
      district_id, 
      name, 
      description, 
      is_encrypted, 
      access_level
    )
    VALUES (?, ?, ?, ?, ?)
  `);
  
  categories.forEach(category => {
    categoryInsert.run(
      districtId,
      category.name,
      category.description,
      category.is_encrypted,
      category.access_level
    );
  });
  
  console.log('DARKNET forum categories created');
  
  // Create a new Dark Web Explorer badge
  const explorerBadge = db.prepare(`
    INSERT OR IGNORE INTO rewards (
      name, 
      description, 
      badge_image, 
      reward_type, 
      reputation_value, 
      is_hidden
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  explorerBadge.run(
    'Web Explorer',
    'Contributed to the DARKNET forum',
    '/images/badges/darknet.svg',
    'badge',
    20,
    0
  );
  
  console.log('Web Explorer badge created');
  
  console.log('Web Development forum setup complete.');
} catch (err) {
  console.error('Error setting up web development forum:', err);
} finally {
  db.close();
}