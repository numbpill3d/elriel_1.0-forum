// Standalone Supabase Migration Script
// This script doesn't require installed npm packages
require('dotenv').config();
const https = require('https');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js'); // We'll still need this
const Database = require('better-sqlite3');

// SQLite connection
const sqliteDb = new Database('./db/elriel.db', { verbose: console.log });

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to pause execution when needed
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Function to format data from SQLite for Supabase
const formatForSupabase = (data) => {
  // Convert SQLite timestamps to ISO format for PostgreSQL
  const formattedData = {...data};
  for (const key in formattedData) {
    if (typeof formattedData[key] === 'string' && 
       (key.includes('_at') || key.includes('date') || key === 'created_at' || key === 'updated_at' || key === 'last_login')) {
      try {
        // Try to parse as date if it looks like a timestamp
        if (formattedData[key] && !formattedData[key].includes('Z') && 
            (formattedData[key].includes('-') || formattedData[key].includes(':'))) {
          const date = new Date(formattedData[key]);
          if (!isNaN(date.getTime())) {
            formattedData[key] = date.toISOString();
          }
        }
      } catch (e) {
        // Keep original value if parsing fails
        console.warn(`Failed to parse date for ${key}: ${formattedData[key]}`);
      }
    }
  }
  return formattedData;
};

// Migration functions for each table
async function migrateUsers() {
  console.log('Migrating users table...');
  const users = sqliteDb.prepare('SELECT * FROM users').all();
  console.log(`Found ${users.length} users to migrate.`);
  
  if (users.length === 0) return;
  
  // Migrate in batches to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    const formattedBatch = batch.map(user => formatForSupabase(user));
    
    const { error } = await supabase
      .from('users')
      .insert(formattedBatch);
      
    if (error) {
      console.error('Error inserting users batch:', error);
    } else {
      console.log(`Migrated users ${i + 1} to ${Math.min(i + batchSize, users.length)}`);
    }
    
    // Avoid rate limiting
    await sleep(1000);
  }
  
  console.log('Users migration completed.');
}

async function migrateDistricts() {
  console.log('Migrating districts table...');
  const districts = sqliteDb.prepare('SELECT * FROM districts').all();
  console.log(`Found ${districts.length} districts to migrate.`);
  
  if (districts.length === 0) return;
  
  for (const district of districts) {
    const formattedDistrict = formatForSupabase(district);
    const { error } = await supabase
      .from('districts')
      .insert(formattedDistrict);
      
    if (error) {
      console.error('Error inserting district:', error);
    } else {
      console.log(`Migrated district: ${district.name}`);
    }
    
    // Avoid rate limiting
    await sleep(500);
  }
  
  console.log('Districts migration completed.');
}

async function migrateGlyphs() {
  console.log('Migrating glyphs table...');
  const glyphs = sqliteDb.prepare('SELECT * FROM glyphs').all();
  console.log(`Found ${glyphs.length} glyphs to migrate.`);
  
  if (glyphs.length === 0) return;
  
  // Migrate in batches
  const batchSize = 3; // Smaller batch size as glyphs may contain large SVG data
  for (let i = 0; i < glyphs.length; i += batchSize) {
    const batch = glyphs.slice(i, i + batchSize);
    const formattedBatch = batch.map(glyph => formatForSupabase(glyph));
    
    const { error } = await supabase
      .from('glyphs')
      .insert(formattedBatch);
      
    if (error) {
      console.error('Error inserting glyphs batch:', error);
    } else {
      console.log(`Migrated glyphs ${i + 1} to ${Math.min(i + batchSize, glyphs.length)}`);
    }
    
    // Avoid rate limiting - longer pause for potentially larger data
    await sleep(1500);
  }
  
  console.log('Glyphs migration completed.');
}

async function migrateProfiles() {
  console.log('Migrating profiles table...');
  const profiles = sqliteDb.prepare('SELECT * FROM profiles').all();
  console.log(`Found ${profiles.length} profiles to migrate.`);
  
  if (profiles.length === 0) return;
  
  // Migrate in batches
  const batchSize = 5;
  for (let i = 0; i < profiles.length; i += batchSize) {
    const batch = profiles.slice(i, i + batchSize);
    const formattedBatch = batch.map(profile => formatForSupabase(profile));
    
    const { error } = await supabase
      .from('profiles')
      .insert(formattedBatch);
      
    if (error) {
      console.error('Error inserting profiles batch:', error);
    } else {
      console.log(`Migrated profiles ${i + 1} to ${Math.min(i + batchSize, profiles.length)}`);
    }
    
    // Avoid rate limiting
    await sleep(1000);
  }
  
  console.log('Profiles migration completed.');
}

async function migratePosts() {
  console.log('Migrating posts table...');
  const posts = sqliteDb.prepare('SELECT * FROM posts').all();
  console.log(`Found ${posts.length} posts to migrate.`);
  
  if (posts.length === 0) return;
  
  // Migrate in batches
  const batchSize = 5;
  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize);
    const formattedBatch = batch.map(post => formatForSupabase(post));
    
    const { error } = await supabase
      .from('posts')
      .insert(formattedBatch);
      
    if (error) {
      console.error('Error inserting posts batch:', error);
    } else {
      console.log(`Migrated posts ${i + 1} to ${Math.min(i + batchSize, posts.length)}`);
    }
    
    // Avoid rate limiting
    await sleep(1000);
  }
  
  console.log('Posts migration completed.');
}

async function migrateWhispers() {
  console.log('Migrating whispers table...');
  const whispers = sqliteDb.prepare('SELECT * FROM whispers').all();
  console.log(`Found ${whispers.length} whispers to migrate.`);
  
  if (whispers.length === 0) return;
  
  // Migrate in batches
  const batchSize = 5;
  for (let i = 0; i < whispers.length; i += batchSize) {
    const batch = whispers.slice(i, i + batchSize);
    const formattedBatch = batch.map(whisper => formatForSupabase(whisper));
    
    const { error } = await supabase
      .from('whispers')
      .insert(formattedBatch);
      
    if (error) {
      console.error('Error inserting whispers batch:', error);
    } else {
      console.log(`Migrated whispers ${i + 1} to ${Math.min(i + batchSize, whispers.length)}`);
    }
    
    // Avoid rate limiting
    await sleep(1000);
  }
  
  console.log('Whispers migration completed.');
}

async function migrateAnnouncements() {
  console.log('Migrating announcements table...');
  const announcements = sqliteDb.prepare('SELECT * FROM announcements').all();
  console.log(`Found ${announcements.length} announcements to migrate.`);
  
  if (announcements.length === 0) return;
  
  for (const announcement of announcements) {
    const formattedAnnouncement = formatForSupabase(announcement);
    const { error } = await supabase
      .from('announcements')
      .insert(formattedAnnouncement);
      
    if (error) {
      console.error('Error inserting announcement:', error);
    } else {
      console.log(`Migrated announcement: ${announcement.title}`);
    }
    
    // Avoid rate limiting
    await sleep(500);
  }
  
  console.log('Announcements migration completed.');
}

// Main migration function
async function migrateAllData() {
  try {
    console.log('Starting migration from SQLite to Supabase...');
    console.log('Using Supabase URL:', supabaseUrl);
    console.log('--------------------------------');
    
    // First check if we can connect to Supabase
    const { data, error } = await supabase.from('users').select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error connecting to Supabase. Please check your credentials:', error);
      return;
    }
    
    console.log('Successfully connected to Supabase');
    console.log('--------------------------------');
    
    // Migrate tables in order to respect foreign key constraints
    // First tables without dependencies
    await migrateUsers();
    console.log('--------------------------------');
    
    await migrateDistricts();
    console.log('--------------------------------');
    
    await migrateGlyphs();
    console.log('--------------------------------');
    
    // Then tables with dependencies
    await migrateProfiles();
    console.log('--------------------------------');
    
    await migratePosts();
    console.log('--------------------------------');
    
    await migrateWhispers();
    console.log('--------------------------------');
    
    await migrateAnnouncements();
    console.log('--------------------------------');
    
    console.log('Migration completed successfully!');
    
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    // Close SQLite connection
    sqliteDb.close();
  }
}

// Check that we have the required environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in environment variables.');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file.');
  process.exit(1);
}

// Execute the migration
migrateAllData();