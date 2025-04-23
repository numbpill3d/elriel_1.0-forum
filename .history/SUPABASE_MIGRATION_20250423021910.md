# Elriel - Supabase Migration Guide

This document provides comprehensive instructions for migrating the Elriel application from SQLite to Supabase and deploying it to a hosting platform.

## Table of Contents

1. [Setting Up Supabase](#setting-up-supabase)
2. [Configuring Your Environment](#configuring-your-environment)
3. [Creating Supabase Tables](#creating-supabase-tables)
4. [Running the Migration Script](#running-the-migration-script)
5. [Converting Your Application Code](#converting-your-application-code)
6. [Deployment Options](#deployment-options)
7. [Troubleshooting](#troubleshooting)

## Setting Up Supabase

1. **Create a Supabase Account**:
   - Go to https://supabase.com/ and sign up for a free account
   - Create a new project with a name like "elriel"
   - Wait for the database to be created (1-2 minutes)

2. **Get Your API Credentials**:
   - Navigate to Project Settings > API in the Supabase dashboard
   - Note down:
     - Project URL (`https://[your-project-id].supabase.co`)
     - API Key (anon public key for client access)
     - Service Role Key (for migration and admin operations)

## Configuring Your Environment

1. **Update Your .env File**:
   ```
   # Supabase configuration
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   ```

2. **Install Required Packages**:
   ```bash
   npm install @supabase/supabase-js pg
   ```

## Creating Supabase Tables

You have two options for creating tables:

### Option 1: Using the Supabase Dashboard (Recommended for Beginners)

1. Go to the "Table Editor" in the Supabase dashboard
2. Click "Create a new table"
3. Create tables matching your SQLite schema:

   **users table:**
   - id (serial, primary key)
   - username (text, unique, not null)
   - password (text, not null)
   - email (text, unique, not null)
   - created_at (timestamptz, default now())
   - last_login (timestamptz)
   - is_admin (integer, default 0)
   - status (text, default 'active')

   Continue creating all tables according to your init.js schema.

### Option 2: Using SQL Editor (For Advanced Users)

1. Go to the "SQL Editor" in the Supabase dashboard
2. Create a new query and paste the SQL schema from the SQL file provided in this repository

## Running the Migration Script

1. **Make sure your Supabase environment is set up**:
   - Verify your .env file has the correct Supabase credentials
   - Ensure all tables have been created in Supabase

2. **Run the Migration**:
   ```bash
   npm run migrate-to-supabase
   ```

3. **Monitor the Output**:
   - The script will show progress for each table migration
   - If any errors occur, they will be displayed in the console

## Converting Your Application Code

You'll need to update your route files to use Supabase instead of SQLite. We've provided two example conversions:

1. `routes/auth_supabase.js` - Shows how to convert authentication routes
2. `routes/feed_supabase.js` - Shows how to convert feed/posts routes

Key differences to note:

### 1. Asynchronous Queries

Supabase queries are Promise-based rather than synchronous like SQLite:

```javascript
// Old SQLite code
const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

// New Supabase code
const { data: user, error } = await supabase
  .from('users')
  .select('*')
  .eq('username', username)
  .single();
```

### 2. Route Handler Changes

Your route handlers need to be `async` functions:

```javascript
// Old
router.get('/profile', (req, res) => { ... });

// New
router.get('/profile', async (req, res) => { ... });
```

### 3. Relationship Queries

Supabase can handle relationships in a single query:

```javascript
const { data: posts } = await supabase
  .from('posts')
  .select(`
    *,
    users:user_id (username),
    glyphs:glyph_id (svg_data)
  `)
```

## Deployment Options

Once your application is migrated to Supabase, you can deploy it to various platforms:

### Option 1: Render.com (Free Tier)

1. Create a Render account at https://render.com/
2. Connect your GitHub repository
3. Create a new Web Service
4. Configure the service:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables: Add your Supabase credentials
5. Deploy your application
6. Set up a custom domain if you have one

### Option 2: Railway.app (Free Tier with Limitations)

1. Create a Railway account at https://railway.app/
2. Connect your GitHub repository
3. Create a new project and select your repo
4. Configure environment variables
5. Deploy your application

### Option 3: Fly.io (Free Tier)

1. Create a Fly.io account
2. Install the Fly CLI
3. Run `fly launch` in your project directory
4. Configure your app and deploy

## Troubleshooting

### Common Issues

1. **Connection Errors**:
   - Verify your Supabase URL and API keys are correct in .env
   - Check if your IP is allowed in Supabase

2. **Database Errors**:
   - Ensure table schemas match exactly (case matters)
   - Check for missing foreign key relationships

3. **Migration Timeouts**:
   - For large datasets, try increasing batch sizes in the migration script

### Getting Support

- Join the Supabase Discord community for help
- Check the Supabase documentation at https://supabase.com/docs
- For Elriel-specific questions, create an issue in the GitHub repository

## Next Steps

Once your migration is complete, consider enhancing your application:

1. Implement Supabase Auth for more secure authentication
2. Set up Row Level Security (RLS) policies
3. Configure database backups
4. Add real-time features using Supabase's real-time capabilities