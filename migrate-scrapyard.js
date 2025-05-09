// Elriel - Scrapyard SQLite to Supabase Migration Script
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const Database = require('better-sqlite3');

// SQLite connection
const sqliteDb = new Database('./db/elriel.db', { verbose: console.log });

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for migration
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to pause execution when needed
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Progress tracking
let totalRecords = 0;
let migratedRecords = 0;
let errorCount = 0;

// Migrate asset categories
async function migrateAssetCategories() {
  console.log('\n🔄 Migrating asset categories...');
  
  try {
    // Get categories from SQLite
    const categories = sqliteDb.prepare(`
      SELECT * FROM asset_categories
    `).all();
    
    totalRecords += categories.length;
    console.log(`Found ${categories.length} categories to migrate`);
    
    // Insert categories into Supabase
    for (const category of categories) {
      try {
        const { error } = await supabase
          .from('asset_categories')
          .insert({
            id: category.id,
            name: category.name,
            display_name: category.display_name,
            description: category.description,
            created_at: new Date(category.created_at)
          });
        
        if (error) {
          throw error;
        }
        
        migratedRecords++;
        console.log(`✅ Migrated category: ${category.name}`);
      } catch (err) {
        errorCount++;
        console.error(`❌ Error migrating category ${category.name}:`, err);
      }
      
      // Avoid rate limiting
      await sleep(100);
    }
  } catch (err) {
    console.error('Error migrating asset categories:', err);
  }
}

// Migrate junkers
async function migrateJunkers() {
  console.log('\n🔄 Migrating junkers...');
  
  try {
    // Get junkers from SQLite
    const junkers = sqliteDb.prepare(`
      SELECT * FROM junkers
    `).all();
    
    totalRecords += junkers.length;
    console.log(`Found ${junkers.length} junkers to migrate`);
    
    // Insert junkers into Supabase
    for (const junker of junkers) {
      try {
        const { error } = await supabase
          .from('junkers')
          .insert({
            id: junker.id,
            user_id: junker.user_id,
            junker_name: junker.junker_name,
            bio: junker.bio,
            created_at: new Date(junker.created_at),
            updated_at: new Date(junker.updated_at),
            reputation: junker.reputation
          });
        
        if (error) {
          throw error;
        }
        
        migratedRecords++;
        console.log(`✅ Migrated junker ID: ${junker.id}`);
      } catch (err) {
        errorCount++;
        console.error(`❌ Error migrating junker ${junker.id}:`, err);
      }
      
      // Avoid rate limiting
      await sleep(100);
    }
  } catch (err) {
    console.error('Error migrating junkers:', err);
  }
}

// Migrate scrapyard assets
async function migrateScrapyardAssets() {
  console.log('\n🔄 Migrating scrapyard assets...');
  
  try {
    // Get assets from SQLite
    const assets = sqliteDb.prepare(`
      SELECT * FROM scrapyard_assets
    `).all();
    
    totalRecords += assets.length;
    console.log(`Found ${assets.length} assets to migrate`);
    
    // Insert assets into Supabase
    for (const asset of assets) {
      try {
        const { error } = await supabase
          .from('scrapyard_assets')
          .insert({
            id: asset.id,
            user_id: asset.user_id,
            title: asset.title,
            description: asset.description,
            file_path: asset.file_path,
            thumbnail_path: asset.thumbnail_path,
            asset_type: asset.asset_type,
            category: asset.category,
            tags: asset.tags,
            download_count: asset.download_count,
            likes_count: asset.likes_count,
            is_free: asset.is_free,
            created_at: new Date(asset.created_at),
            updated_at: new Date(asset.updated_at)
          });
        
        if (error) {
          throw error;
        }
        
        migratedRecords++;
        console.log(`✅ Migrated asset: ${asset.title}`);
      } catch (err) {
        errorCount++;
        console.error(`❌ Error migrating asset ${asset.id}:`, err);
      }
      
      // Avoid rate limiting
      await sleep(100);
    }
  } catch (err) {
    console.error('Error migrating scrapyard assets:', err);
  }
}

// Migrate asset comments
async function migrateAssetComments() {
  console.log('\n🔄 Migrating asset comments...');
  
  try {
    // Get comments from SQLite
    const comments = sqliteDb.prepare(`
      SELECT * FROM asset_comments
    `).all();
    
    totalRecords += comments.length;
    console.log(`Found ${comments.length} comments to migrate`);
    
    // Insert comments into Supabase
    for (const comment of comments) {
      try {
        const { error } = await supabase
          .from('asset_comments')
          .insert({
            id: comment.id,
            asset_id: comment.asset_id,
            user_id: comment.user_id,
            content: comment.content,
            created_at: new Date(comment.created_at),
            updated_at: new Date(comment.updated_at)
          });
        
        if (error) {
          throw error;
        }
        
        migratedRecords++;
        console.log(`✅ Migrated comment ID: ${comment.id}`);
      } catch (err) {
        errorCount++;
        console.error(`❌ Error migrating comment ${comment.id}:`, err);
      }
      
      // Avoid rate limiting
      await sleep(100);
    }
  } catch (err) {
    console.error('Error migrating asset comments:', err);
  }
}

// Migrate asset favorites
async function migrateAssetFavorites() {
  console.log('\n🔄 Migrating asset favorites...');
  
  try {
    // Get favorites from SQLite
    const favorites = sqliteDb.prepare(`
      SELECT * FROM asset_favorites
    `).all();
    
    totalRecords += favorites.length;
    console.log(`Found ${favorites.length} favorites to migrate`);
    
    // Insert favorites into Supabase
    for (const favorite of favorites) {
      try {
        const { error } = await supabase
          .from('asset_favorites')
          .insert({
            id: favorite.id,
            user_id: favorite.user_id,
            asset_id: favorite.asset_id,
            created_at: new Date(favorite.created_at)
          });
        
        if (error) {
          throw error;
        }
        
        migratedRecords++;
        console.log(`✅ Migrated favorite ID: ${favorite.id}`);
      } catch (err) {
        errorCount++;
        console.error(`❌ Error migrating favorite ${favorite.id}:`, err);
      }
      
      // Avoid rate limiting
      await sleep(100);
    }
  } catch (err) {
    console.error('Error migrating asset favorites:', err);
  }
}

// Run the migration
async function runMigration() {
  console.log('🚀 Starting Scrapyard migration from SQLite to Supabase...');
  
  const startTime = Date.now();
  
  // Run migrations in sequence
  await migrateAssetCategories();
  await migrateJunkers();
  await migrateScrapyardAssets();
  await migrateAssetComments();
  await migrateAssetFavorites();
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  console.log('\n✅ Migration completed!');
  console.log(`Total records: ${totalRecords}`);
  console.log(`Successfully migrated: ${migratedRecords}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Duration: ${duration.toFixed(2)} seconds`);
  
  // Close SQLite connection
  sqliteDb.close();
}

// Run the migration
runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
