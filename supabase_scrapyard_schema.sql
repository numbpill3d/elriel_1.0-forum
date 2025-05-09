-- Elriel - Supabase Scrapyard Schema
-- Execute this in the Supabase SQL Editor to create all tables for the Scrapyard marketplace

-- Junkers table for users registered as asset creators
CREATE TABLE IF NOT EXISTS public.junkers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  junker_name TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  reputation INTEGER DEFAULT 0
);

-- Enable RLS on junkers table
ALTER TABLE public.junkers ENABLE ROW LEVEL SECURITY;

-- Create policy for junkers table
CREATE POLICY "Allow public read access to junkers"
  ON public.junkers
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to create their own junker profile"
  ON public.junkers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own junker profile"
  ON public.junkers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Scrapyard assets table for marketplace items
CREATE TABLE IF NOT EXISTS public.scrapyard_assets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  file_path TEXT NOT NULL,
  thumbnail_path TEXT,
  asset_type TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT,
  download_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  is_free INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on scrapyard_assets table
ALTER TABLE public.scrapyard_assets ENABLE ROW LEVEL SECURITY;

-- Create policy for scrapyard_assets table
CREATE POLICY "Allow public read access to scrapyard_assets"
  ON public.scrapyard_assets
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to create their own assets"
  ON public.scrapyard_assets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own assets"
  ON public.scrapyard_assets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own assets"
  ON public.scrapyard_assets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Asset favorites table for user favorites
CREATE TABLE IF NOT EXISTS public.asset_favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  asset_id INTEGER NOT NULL REFERENCES public.scrapyard_assets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, asset_id)
);

-- Enable RLS on asset_favorites table
ALTER TABLE public.asset_favorites ENABLE ROW LEVEL SECURITY;

-- Create policy for asset_favorites table
CREATE POLICY "Allow users to view all favorites"
  ON public.asset_favorites
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to create their own favorites"
  ON public.asset_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own favorites"
  ON public.asset_favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Asset comments table
CREATE TABLE IF NOT EXISTS public.asset_comments (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER NOT NULL REFERENCES public.scrapyard_assets(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on asset_comments table
ALTER TABLE public.asset_comments ENABLE ROW LEVEL SECURITY;

-- Create policy for asset_comments table
CREATE POLICY "Allow public read access to asset_comments"
  ON public.asset_comments
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to create their own comments"
  ON public.asset_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own comments"
  ON public.asset_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own comments"
  ON public.asset_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Asset categories table
CREATE TABLE IF NOT EXISTS public.asset_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on asset_categories table
ALTER TABLE public.asset_categories ENABLE ROW LEVEL SECURITY;

-- Create policy for asset_categories table
CREATE POLICY "Allow public read access to asset_categories"
  ON public.asset_categories
  FOR SELECT
  USING (true);

-- Insert predefined asset categories
INSERT INTO public.asset_categories (name, display_name, description)
VALUES
  ('favicon', 'FAVICON', 'Small icons for website tabs and bookmarks'),
  ('divider', 'DIVIDER', 'Decorative separators for webpages'),
  ('background', 'BACKGROUND', 'Background images and patterns'),
  ('template', 'TEMPLATE', 'Full templates for websites and profiles'),
  ('widget', 'WIDGET', 'Interactive elements and components'),
  ('image', 'IMAGE', 'GIFs, PNGs and other images'),
  ('font', 'FONT', 'Custom fonts and typography'),
  ('button', 'BUTTON', 'Clickable UI buttons and elements'),
  ('blinkie', 'BLINKIE', 'Small animated banners'),
  ('cursor', 'CURSOR', 'Custom mouse cursors'),
  ('other', 'OTHER', 'Miscellaneous digital assets')
ON CONFLICT (name) DO NOTHING;
