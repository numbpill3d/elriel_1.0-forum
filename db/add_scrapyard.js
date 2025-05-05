// Script to add Scrapyard section to the forums table

const Database = require('better-sqlite3');
const db = new Database('./db/elriel.db', { verbose: console.log });

console.log("Checking for forums table...");

// Check if forums table exists, if not, create it
const createForumsTable = `
CREATE TABLE IF NOT EXISTS forums (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  position INTEGER DEFAULT 0,
  is_public INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
`;

try {
  db.exec(createForumsTable);
  console.log("Forums table initialized");
  
  // Check if Scrapyard already exists
  const scrapyardExists = db.prepare(`SELECT id FROM forums WHERE slug = 'scrapyard'`).get();
  
  if (!scrapyardExists) {
    // Add the Scrapyard forum section
    const addScrapyard = db.prepare(`
      INSERT INTO forums (title, description, slug, position)
      VALUES (?, ?, ?, ?)
    `);
    
    addScrapyard.run(
      'SCRAPYARD',
      'A mystical collection of discarded code, forgotten artifacts, and broken tech. Exchange digital artifacts from the wasteland.',
      'scrapyard',
      3 // Position in the list
    );
    
    console.log("Scrapyard forum section has been added");
  } else {
    console.log("Scrapyard forum section already exists");
  }
  
  // List all forums
  const forums = db.prepare(`SELECT id, title, slug FROM forums ORDER BY position`).all();
  console.log("Available forums:");
  forums.forEach(forum => {
    console.log(`- ${forum.title} (${forum.slug})`);
  });
  
} catch (err) {
  console.error('Error setting up Scrapyard:', err);
}

// Check if forum_topics table exists, if not, create it
const createTopicsTable = `
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
)
`;

try {
  db.exec(createTopicsTable);
  console.log("Forum topics table initialized");
  
  // Add a sample scrapyard topic if none exist
  const scrapyardTopicsCount = db.prepare(`
    SELECT COUNT(*) as count FROM forum_topics t
    JOIN forums f ON t.forum_id = f.id
    WHERE f.slug = 'scrapyard'
  `).get();
  
  // Get Scrapyard forum ID
  const scrapyard = db.prepare(`SELECT id FROM forums WHERE slug = 'scrapyard'`).get();
  
  if (scrapyard && scrapyardTopicsCount.count === 0) {
    // Get admin user ID
    const admin = db.prepare(`SELECT id FROM users WHERE username = 'admin'`).get();
    
    if (admin) {
      // Add a sample scrapyard artifact
      const addSampleArtifact = db.prepare(`
        INSERT INTO forum_topics (forum_id, user_id, title, content)
        VALUES (?, ?, ?, ?)
      `);
      
      addSampleArtifact.run(
        scrapyard.id,
        admin.id,
        'CORRUPTED TERMINAL FRAGMENT - #00FF00',
        `I found this artifact in a corrupted sector of the mainframe. It appears to be a fragment of ancient code from the Before Times.

\`\`\`
function initializeMatrix() {
  const grid = [];
  for (let i = 0; i < dimensions; i++) {
    grid[i] = [];
    for (let j = 0; j < dimensions; j++) {
      grid[i][j] = new Node(i, j);
      grid[i][j].activate(Math.random() > 0.7);
      // ERROR: CORRUPTED_MEMORY_SEGMENT_0xF7A913
    }
  }
  return grid;
}
\`\`\`

The corruption appears to be spreading. Approach with caution.`
      );
      
      console.log("Added sample artifact to Scrapyard");
    }
  }
  
  // Create forum_comments table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS forum_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (topic_id) REFERENCES forum_topics(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  
  console.log("Forum comments table initialized");
  console.log("Scrapyard setup complete!");
  
} catch (err) {
  console.error('Error setting up forum topics table:', err);
}

db.close();