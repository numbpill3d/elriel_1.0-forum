-- Elriel - Supabase Schema
-- Execute this in the Supabase SQL Editor to create all tables

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.settings.jwt_secret" TO 'your-jwt-secret';

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMPTZ,
  is_admin INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active'
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT,
  background_image TEXT,
  custom_css TEXT,
  custom_html TEXT,
  blog_layout TEXT DEFAULT 'feed',
  glyph_id INTEGER,
  district_id INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT,
  is_encrypted INTEGER DEFAULT 0,
  encryption_key TEXT,
  glyph_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on posts table
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Glyphs table
CREATE TABLE IF NOT EXISTS public.glyphs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  svg_data TEXT NOT NULL,
  audio_data TEXT,
  seed TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on glyphs table
ALTER TABLE public.glyphs ENABLE ROW LEVEL SECURITY;

-- Whispers table (anonymous messages)
CREATE TABLE IF NOT EXISTS public.whispers (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  glyph_id INTEGER REFERENCES public.glyphs(id) ON DELETE SET NULL,
  is_encrypted INTEGER DEFAULT 0,
  encryption_key TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on whispers table
ALTER TABLE public.whispers ENABLE ROW LEVEL SECURITY;

-- Districts table (aesthetic sub-networks)
CREATE TABLE IF NOT EXISTS public.districts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  theme TEXT,
  is_hidden INTEGER DEFAULT 0,
  access_code TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on districts table
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;

-- Announcements table (for admin messages on landing page)
CREATE TABLE IF NOT EXISTS public.announcements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on announcements table
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Add RLS policies

-- Users policies
CREATE POLICY "Allow public access to users" 
  ON public.users FOR SELECT 
  USING (true);

CREATE POLICY "Allow users to update own data" 
  ON public.users FOR UPDATE 
  USING (auth.uid() = id);

-- Profiles policies
CREATE POLICY "Allow public access to profiles" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Allow users to update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = user_id);

-- Posts policies
CREATE POLICY "Allow public access to non-encrypted posts" 
  ON public.posts FOR SELECT 
  USING (is_encrypted = 0);

CREATE POLICY "Allow users to update own posts" 
  ON public.posts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own posts" 
  ON public.posts FOR DELETE 
  USING (auth.uid() = user_id);

-- Insert default district (Numbpill Cell)
INSERT INTO public.districts (id, name, description, theme)
VALUES (1, 'Numbpill Cell', 'The primary node of the Elriel network. A digital wasteland of glitched terminals and corrupted data.', 'terminal')
ON CONFLICT (id) DO NOTHING;

-- Insert initial announcement
INSERT INTO public.announcements (id, title, content)
VALUES (1, 'SYSTEM ALERT', 'Welcome to Elriel. This terminal has been compromised. Proceed with caution. The Numbpill Cell awaits your contribution.')
ON CONFLICT (id) DO NOTHING;