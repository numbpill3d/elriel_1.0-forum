// Targeted script to migrate profiles only
require('dotenv').config();
const https = require('https');
const Database = require('better-sqlite3');

// SQLite connection
const sqliteDb = new Database('./db/elriel.db', { verbose: console.log });

// Supabase connection details
const supabaseUrl = process.env.SUPABASE_URL.replace('https://', '');
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Helper to pause execution when needed
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Function to make a request to Supabase REST API
function supabaseRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: supabaseUrl,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedData);
          } else {
            reject({
              statusCode: res.statusCode,
              error: parsedData
            });
          }
        } catch (error) {
          reject({
            statusCode: res.statusCode,
            error: error.message,
            data: responseData
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

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

// Simplify by not checking columns
async function verifyConnection() {
  try {
    await supabaseRequest('GET', '/rest/v1/profiles?select=id&limit=1', null);
    console.log('Successfully connected to Supabase and profiles table exists');
    return true;
  } catch (error) {
    console.error('Error connecting to Supabase or profiles table:', error);
    return false;
  }
}

// Migrate profiles
async function migrateProfiles() {
  console.log('Migrating profiles table...');
  
  // Get all profiles from SQLite
  const profiles = sqliteDb.prepare('SELECT * FROM profiles').all();
  console.log(`Found ${profiles.length} profiles to migrate.`);
  
  if (profiles.length === 0) {
    console.log('No profiles to migrate');
    return;
  }
  
  // Log the structure of the first profile
  console.log('Sample profile structure:', Object.keys(profiles[0]));
  
  // Proceed with migration
  for (const profile of profiles) {
    const formattedProfile = formatForSupabase(profile);
    
    // Strip out any fields that might not exist in the target table
    const cleanProfile = {
      id: formattedProfile.id,
      user_id: formattedProfile.user_id,
      status: formattedProfile.status,
      background_image: formattedProfile.background_image,
      custom_css: formattedProfile.custom_css,
      custom_html: formattedProfile.custom_html,
      blog_layout: formattedProfile.blog_layout,
      glyph_id: formattedProfile.glyph_id,
      district_id: formattedProfile.district_id,
      created_at: formattedProfile.created_at,
      updated_at: formattedProfile.updated_at
    };
    
    console.log('Migrating profile:', cleanProfile);
    
    try {
      await supabaseRequest('POST', '/rest/v1/profiles', [cleanProfile]);
      console.log(`Successfully migrated profile for user_id: ${cleanProfile.user_id}`);
    } catch (error) {
      console.error('Error inserting profile:', error);
      
      // If there's a primary key violation, try an upsert instead
      if (error.statusCode === 409) {
        try {
          console.log('Attempting upsert...');
          await supabaseRequest('POST', '/rest/v1/profiles?on_conflict=id', [cleanProfile]);
          console.log(`Successfully upserted profile for user_id: ${cleanProfile.user_id}`);
        } catch (upsertError) {
          console.error('Upsert failed:', upsertError);
        }
      }
    }
    
    // Avoid rate limiting
    await sleep(1000);
  }
  
  console.log('Profiles migration completed.');
}

// Main function
async function main() {
  try {
    console.log('Starting targeted profiles migration...');
    
    // First check if we can connect to Supabase
    try {
      await supabaseRequest('GET', '/rest/v1/users?select=count', null);
      console.log('Successfully connected to Supabase');
    } catch (error) {
      console.error('Error connecting to Supabase. Please check your credentials:', error);
      return;
    }
    
    // Try to check the table structure
    await checkProfilesTableColumns();
    
    // Migrate profiles
    await migrateProfiles();
    
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
main();