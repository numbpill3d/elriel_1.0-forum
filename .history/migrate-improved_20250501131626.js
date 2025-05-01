// Elriel - Improved SQLite to Supabase Migration Script
// Migrates all data from SQLite database to Supabase

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Progress tracking variables
let totalRecords = 0;
let migratedRecords = 0;
let errorCount = 0;

// Connect to Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for admin operations
const supabase = createClient(supabaseUrl, supabaseKey);

// Connect to SQLite
const db = new Database(path.join(__dirname, 'db', 'elriel.db'), { verbose: console.log });

// Table definitions to migrate
const tables = [
  { 
    name: 'users', 
    primaryKey: 'id',
    query: 'SELECT * FROM users'
  },
  { 
    name: 'districts', 
    primaryKey: 'id',
    query: 'SELECT * FROM districts'
  },
  { 
    name: 'profiles', 
    primaryKey: 'id',
    foreignKeys: [{ key: 'user_id', table: 'users' }],
    query: 'SELECT * FROM profiles'
  },
  { 
    name: 'glyphs', 
    primaryKey: 'id',
    foreignKeys: [{ key: 'user_id', table: 'users' }],
    query: 'SELECT * FROM glyphs'
  },
  { 
    name: 'posts', 
    primaryKey: 'id',
    foreignKeys: [
      { key: 'user_id', table: 'users' },
      { key: 'glyph_id', table: 'glyphs' }
    ],
    query: 'SELECT * FROM posts'
  },
  { 
    name: 'whispers', 
    primaryKey: 'id',
    foreignKeys: [{ key: 'glyph_id', table: 'glyphs' }],
    query: 'SELECT * FROM whispers'
  },
  { 
    name: 'announcements', 
    primaryKey: 'id',
    query: 'SELECT * FROM announcements'
  }
];

// Optional tables (might exist in newer versions)
const optionalTables = [
  { 
    name: 'forums',
    primaryKey: 'id',
    query: 'SELECT * FROM forums'
  },
  { 
    name: 'forum_topics',
    primaryKey: 'id',
    foreignKeys: [
      { key: 'forum_id', table: 'forums' },
      { key: 'user_id', table: 'users' }
    ],
    query: 'SELECT * FROM forum_topics'
  },
  { 
    name: 'forum_comments',
    primaryKey: 'id',
    foreignKeys: [
      { key: 'topic_id', table: 'forum_topics' },
      { key: 'user_id', table: 'users' }
    ],
    query: 'SELECT * FROM forum_comments'
  },
  { 
    name: 'user_signatures',
    primaryKey: 'id',
    foreignKeys: [{ key: 'user_id', table: 'users' }],
    query: 'SELECT * FROM user_signatures'
  },
  { 
    name: 'profile_containers',
    primaryKey: 'id',
    foreignKeys: [{ key: 'profile_id', table: 'profiles' }],
    query: 'SELECT * FROM profile_containers'
  },
  { 
    name: 'repute_rewards',
    primaryKey: 'id',
    query: 'SELECT * FROM repute_rewards'
  },
  { 
    name: 'user_rewards',
    primaryKey: 'id',
    foreignKeys: [
      { key: 'user_id', table: 'users' },
      { key: 'reward_id', table: 'repute_rewards' }
    ],
    query: 'SELECT * FROM user_rewards'
  },
  { 
    name: 'user_activity_logs',
    primaryKey: 'id',
    foreignKeys: [{ key: 'user_id', table: 'users' }],
    query: 'SELECT * FROM user_activity_logs'
  }
];

// Main migration function
async function migrateDatabase() {
  console.log('Starting Elriel migration from SQLite to Supabase...');
  console.log(`Supabase URL: ${supabaseUrl}`);
  
  // Check if SQLite database exists
  if (!fs.existsSync(path.join(__dirname, 'db', 'elriel.db'))) {
    console.error('Error: SQLite database file not found.');
    process.exit(1);
  }
  
  // Add optional tables that exist in the database
  const allTables = [...tables];
  for (const optTable of optionalTables) {
    try {
      // Check if table exists by running a dummy query
      db.prepare(`SELECT 1 FROM ${optTable.name} LIMIT 1`).get();
      allTables.push(optTable);
      console.log(`Optional table found: ${optTable.name}`);
    } catch (err) {
      console.log(`Optional table not found: ${optTable.name}`);
    }
  }
  
  // Count total records for progress tracking
  for (const table of allTables) {
    try {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get().count;
      totalRecords += count;
      console.log(`Found ${count} records in table ${table.name}`);
    } catch (err) {
      console.error(`Error counting records in ${table.name}:`, err.message);
    }
  }
  
  console.log(`Total records to migrate: ${totalRecords}`);
  
  // Migrate each table
  for (const table of allTables) {
    await migrateTable(table);
  }
  
  // Migration summary
  console.log('\nMigration Summary:');
  console.log(`Total records: ${totalRecords}`);
  console.log(`Migrated successfully: ${migratedRecords}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Success rate: ${(migratedRecords / totalRecords * 100).toFixed(2)}%`);
  
  console.log('\nMigration complete! Please verify your data in Supabase.');
}

// Migrate a single table
async function migrateTable(table) {
  const { name, query } = table;
  console.log(`\nMigrating table: ${name}`);
  
  try {
    // Get all records from SQLite
    const records = db.prepare(query).all();
    console.log(`Found ${records.length} records to migrate.`);
    
    if (records.length === 0) {
      console.log(`No records to migrate for ${name}.`);
      return;
    }
    
    // Migrate in batches of 100 records
    const batchSize = 100;
    const batches = Math.ceil(records.length / batchSize);
    
    for (let i = 0; i < batches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, records.length);
      const batch = records.slice(start, end);
      
      // Prepare data for Supabase (handle timestamps etc.)
      const preparedBatch = batch.map(record => {
        // Convert SQLite automatic timestamps to ISO format Supabase expects
        const prepared = { ...record };
        if (prepared.created_at && !prepared.created_at.includes('T')) {
          prepared.created_at = new Date(prepared.created_at).toISOString();
        }
        if (prepared.updated_at && !prepared.updated_at.includes('T')) {
          prepared.updated_at = new Date(prepared.updated_at).toISOString();
        }
        if (prepared.last_login && !prepared.last_login.includes('T')) {
          prepared.last_login = new Date(prepared.last_login).toISOString();
        }
        return prepared;
      });
      
      // Insert batch into Supabase
      const { data, error } = await supabase
        .from(name)
        .upsert(preparedBatch);
      
      if (error) {
        console.error(`Error inserting batch ${i+1}/${batches} for ${name}:`, error);
        errorCount += batch.length;
      } else {
        console.log(`Migrated batch ${i+1}/${batches} for ${name}`);
        migratedRecords += batch.length;
      }
      
      // Progress update
      const progress = ((migratedRecords + errorCount) / totalRecords * 100).toFixed(2);
      console.log(`Overall progress: ${progress}% (${migratedRecords + errorCount}/${totalRecords})`);
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`Completed migration for table ${name}`);
  } catch (err) {
    console.error(`Error migrating table ${name}:`, err);
    errorCount += 1;
  }
}

// Run migration
migrateDatabase()
  .catch(err => {
    console.error('Migration failed:', err);
  })
  .finally(() => {
    // Close SQLite connection
    db.close();
    console.log('Closed SQLite connection.');
  });