// Elriel - SQLite to Supabase Migration Script
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const Database = require('better-sqlite3');

// SQLite connection
const sqliteDb = new Database('./db/elriel.db', { verbose: console.log });

// Supabase connection - you'll need to replace these with your actual values
const supabaseUrl = process.env.SUPABASE_URL || 'your_supabase_url';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'your_supabase_key'; // Use service key for migration
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to pause execution when needed
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Migration functions for each table
async function migrateUsers() {
  console.log('Migrating users table...');
  const users = sqliteDb.prepare('SELECT * FROM users').all();
  console.log(`Found ${users.length} users to migrate.`);
  
  if (users.length === 0) return;
  
  // Migrate in batches to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    const { error } = await supabase
      .from('users')
      .insert(batch.map(user => ({
        id: user.id,
        username: user.username,
        password: user.password, // Note: passwords are hashed so this is safe
        email: user.email,
        created_at: user.created_at,
        last_login: user.last_login,
        is_admin: user.is_admin,
        status: user.status
      })));
      
    if (error) {
      console.error('Error inserting users batch:', error);
    } else {
      console.log(`Migrated users ${i + 1} to ${Math.min(i + batchSize, users.length)}`);
    }
    
    // Avoid rate limiting
    await sleep(500);
  }
  
  console.log('Users migration completed.');
}

async function migrateDistricts() {
  console.log('Migrating districts table...');
  const districts = sqliteDb.prepare('SELECT * FROM districts').all();
  console.log(`Found ${districts.length} districts to migrate.`);
  
  if (districts.length === 0) return;
  
  for (const district of districts) {
    const { error } = await supabase
      .from('districts')
      .insert({
        id: district.id,
        name: district.name,
        description: district.description,
        theme: district.theme,
        is_hidden: district.is_hidden,
        access_code: district.access_code,
        created_at: district.created_at
      });
      
    if (error) {
      console.error('Error inserting district:', error);
    } else {
      console.log(`Migrated district: ${district.name}`);
    }
    
    // Avoid rate limiting
    await sleep(100);
  }
  
  console.log('Districts migration completed.');
}

async function migrateGlyphs() {
  console.log('Migrating glyphs table...');
  const glyphs = sqliteDb.prepare('SELECT * FROM glyphs').all();
  console.log(`Found ${glyphs.length} glyphs to migrate.`);
  
  if (glyphs.length === 0) return;
  
  // Migrate in batches
  const batchSize = 5; // Smaller batch size as glyphs may contain large SVG data
  for (let i = 0; i < glyphs.length; i += batchSize) {
    const batch = glyphs.slice(i, i + batchSize);
    const { error } = await supabase
      .from('glyphs')
      .insert(batch.map(glyph => ({
        id: glyph.id,
        user_id: glyph.user_id,
        svg_data: glyph.svg_data,
        audio_data: glyph.audio_data,
        seed: glyph.seed,
        created_at: glyph.created_at
      })));
      
    if (error) {
      console.error('Error inserting glyphs batch:', error);
    } else {
      console.log(`Migrated glyphs ${i + 1} to ${Math.min(i + batchSize, glyphs.length)}`);
    }
    
    // Avoid rate limiting - longer pause for potentially larger data
    await sleep(1000);
  }
  
  console.log('Glyphs migration completed.');
}

async function migrateProfiles() {
  console.log('Migrating profiles table...');
  const profiles = sqliteDb.prepare('SELECT * FROM profiles').all();
  console.log(`Found ${profiles.length} profiles to migrate.`);
  
  if (profiles.length === 0) return;
  
  // Migrate in batches
  const batchSize = 10;
  for (let i = 0; i < profiles.length; i += batchSize) {
    const batch = profiles.slice(i, i + batchSize);
    const { error } = await supabase
      .from('profiles')
      .insert(batch.map(profile => ({
        id: profile.id,
        user_id: profile.user_id,
        status: profile.status,
        background_image: profile.background_image,
        custom_css: profile.custom_css,
        custom_html: profile.custom_html,
        blog_layout: profile.blog_layout,
        glyph_id: profile.glyph_id,
        district_id: profile.district_id,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      })));
      
    if (error) {
      console.error('Error inserting profiles batch:', error);
    } else {
      console.log(`Migrated profiles ${i + 1} to ${Math.min(i + batchSize, profiles.length)}`);
    }
    
    // Avoid rate limiting
    await sleep(500);
  }
  
  console.log('Profiles migration completed.');
}

async function migratePosts() {
  console.log('Migrating posts table...');
  const posts = sqliteDb.prepare('SELECT * FROM posts').all();
  console.log(`Found ${posts.length} posts to migrate.`);
  
  if (posts.length === 0) return;
  
  // Migrate in batches
  const batchSize = 10;
  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize);
    const { error } = await supabase
      .from('posts')
      .insert(batch.map(post => ({
        id: post.id,
        user_id: post.user_id,
        title: post.title,
        content: post.content,
        tags: post.tags,
        is_encrypted: post.is_encrypted,
        encryption_key: post.encryption_key,
        glyph_id: post.glyph_id,
        created_at: post.created_at,
        updated_at: post.updated_at
      })));
      
    if (error) {
      console.error('Error inserting posts batch:', error);
    } else {
      console.log(`Migrated posts ${i + 1} to ${Math.min(i + batchSize, posts.length)}`);
    }
    
    // Avoid rate limiting
    await sleep(500);
  }
  
  console.log('Posts migration completed.');
}

async function migrateWhispers() {
  console.log('Migrating whispers table...');
  const whispers = sqliteDb.prepare('SELECT * FROM whispers').all();
  console.log(`Found ${whispers.length} whispers to migrate.`);
  
  if (whispers.length === 0) return;
  
  // Migrate in batches
  const batchSize = 10;
  for (let i = 0; i < whispers.length; i += batchSize) {
    const batch = whispers.slice(i, i + batchSize);
    const { error } = await supabase
      .from('whispers')
      .insert(batch.map(whisper => ({
        id: whisper.id,
        content: whisper.content,
        glyph_id: whisper.glyph_id,
        is_encrypted: whisper.is_encrypted,
        encryption_key: whisper.encryption_key,
        created_at: whisper.created_at
      })));
      
    if (error) {
      console.error('Error inserting whispers batch:', error);
    } else {
      console.log(`Migrated whispers ${i + 1} to ${Math.min(i + batchSize, whispers.length)}`);
    }
    
    // Avoid rate limiting
    await sleep(500);
  }
  
  console.log('Whispers migration completed.');
}

async function migrateAnnouncements() {
  console.log('Migrating announcements table...');
  const announcements = sqliteDb.prepare('SELECT * FROM announcements').all();
  console.log(`Found ${announcements.length} announcements to migrate.`);
  
  if (announcements.length === 0) return;
  
  for (const announcement of announcements) {
    const { error } = await supabase
      .from('announcements')
      .insert({
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        is_active: announcement.is_active,
        created_at: announcement.created_at,
        updated_at: announcement.updated_at
      });
      
    if (error) {
      console.error('Error inserting announcement:', error);
    } else {
      console.log(`Migrated announcement: ${announcement.title}`);
    }
    
    // Avoid rate limiting
    await sleep(100);
  }
  
  console.log('Announcements migration completed.');
}

// Main migration function
async function migrateAllData() {
  try {
    console.log('Starting migration from SQLite to Supabase...');
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

// Execute the migration
migrateAllData();