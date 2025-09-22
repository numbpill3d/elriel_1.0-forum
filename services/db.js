// Elriel - Supabase Database Connection Service
let createClient;
try {
  // Try to load the Supabase client
  const { createClient: supabaseCreateClient } = require('@supabase/supabase-js');
  createClient = supabaseCreateClient;
  console.log('Supabase client loaded successfully');
} catch (error) {
  console.warn('Supabase client not available:', error.message);
  console.warn('Will use mock client instead');
  createClient = () => null; // Dummy function
}

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Create a mock Supabase client for development/fallback
const createMockClient = () => {
  console.warn('⚠️ Using mock Supabase client. Data operations will not persist.');

  // In-memory storage for mock data
  const mockData = {
    users: [],
    profiles: [],
    posts: [],
    glyphs: [],
    whispers: [],
    forum_topics: [],
    forum_comments: []
  };

  return {
    from: (table) => ({
      select: (columns = '*') => ({
        eq: (column, value) => ({
          single: () => Promise.resolve({ data: null, error: null }),
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
          then: (callback) => Promise.resolve(callback({ data: [], error: null }))
        }),
        or: (conditions) => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null }),
          then: (callback) => Promise.resolve(callback({ data: [], error: null }))
        }),
        order: (column, { ascending }) => ({
          limit: (limit) => ({
            then: (callback) => Promise.resolve(callback({ data: [], error: null }))
          }),
          then: (callback) => Promise.resolve(callback({ data: [], error: null }))
        }),
        limit: (limit) => ({
          then: (callback) => Promise.resolve(callback({ data: [], error: null }))
        }),
        single: () => Promise.resolve({ data: null, error: null }),
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
        then: (callback) => Promise.resolve(callback({ data: [], error: null }))
      }),
      insert: (data) => ({
        select: () => ({
          single: () => Promise.resolve({ data: { id: Date.now(), ...data }, error: null })
        }),
        then: (callback) => Promise.resolve(callback({ data: { id: Date.now(), ...data }, error: null }))
      }),
      update: (data) => ({
        eq: (column, value) => ({
          then: (callback) => Promise.resolve(callback({ data: { id: value, ...data }, error: null }))
        })
      }),
      delete: () => ({
        eq: (column, value) => ({
          then: (callback) => Promise.resolve(callback({ data: null, error: null }))
        })
      })
    }),
    auth: {
      signUp: () => Promise.resolve({ user: null, session: null, error: null }),
      signIn: () => Promise.resolve({ user: null, session: null, error: null }),
      signOut: () => Promise.resolve({ error: null })
    },
    storage: {
      from: (bucket) => ({
        upload: (path, file) => Promise.resolve({ data: { path }, error: null }),
        getPublicUrl: (path) => ({ data: { publicUrl: `/mock-storage/${path}` } })
      })
    }
  };
};

let supabase;

// Validate environment variables and create appropriate client
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_KEY in .env file.');
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Connected to Supabase at:', supabaseUrl);
  } catch (error) {
    throw new Error(`Failed to connect to Supabase: ${error.message}. Check your SUPABASE_URL and SUPABASE_KEY.`);
  }
}

// Export the client for use throughout the application
module.exports = supabase;