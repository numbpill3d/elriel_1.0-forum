// Elriel - Feed Routes (Supabase Version)
// Handles the Bleedstream (global feed) and post management

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const supabase = require('../services/db');

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).redirect('/auth/login');
  }
  next();
};

// Serve Bleedstream page
router.get('/bleedstream', async (req, res) => {
  try {
    // Get tag filter if provided
    const { tag } = req.query;
    
    // Base query
    let query = supabase
      .from('posts')
      .select(`
        *,
        users:user_id (username),
        glyphs:glyph_id (svg_data),
        profiles:user_id (
          district_id,
          districts:district_id (name)
        )
      `)
      .eq('is_encrypted', 0)
      .order('created_at', { ascending: false })
      .limit(50);
    
    // Add tag filter if provided
    if (tag) {
      query = query.ilike('tags', `%${tag}%`);
    }
    
    // Execute query
    const { data: posts, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Format the posts to match the expected structure
    const formattedPosts = posts.map(post => ({
      ...post,
      username: post.users.username,
      glyph_svg: post.glyphs?.svg_data || null,
      district_name: post.profiles?.districts?.name || null
    }));
    
    // Get all tags for filter dropdown
    const { data: tagsResult, error: tagsError } = await supabase
      .from('posts')
      .select('tags')
      .not('tags', 'is', null)
      .not('tags', 'eq', '');
    
    if (tagsError) {
      throw tagsError;
    }
    
    // Extract unique tags
    const allTags = new Set();
    tagsResult.forEach(result => {
      if (result.tags) {
        result.tags.split(',').forEach(tag => {
          allTags.add(tag.trim());
        });
      }
    });
    
    // Pass data to the frontend
    const data = {
      posts: formattedPosts,
      tags: Array.from(allTags),
      currentTag: tag || null,
      user: req.session.user || null
    };
    
    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/feed/bleedstream.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));
    
    res.send(html);
  } catch (err) {
    console.error('Error loading Bleedstream:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Serve new post page
router.get('/new', isAuthenticated, async (req, res) => {
  try {
    // Get user's glyphs
    const { data: glyphs, error } = await supabase
      .from('glyphs')
      .select('*')
      .eq('user_id', req.session.user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    // Pass data to the frontend
    const data = {
      glyphs,
      user: req.session.user
    };
    
    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/feed/new-post.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));
    
    res.send(html);
  } catch (err) {
    console.error('Error loading new post page:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Create a new post
router.post('/create', isAuthenticated, async (req, res) => {
  try {
    const { title, content, tags, glyphId, isEncrypted } = req.body;
    
    // Validate input
    if (!title || !content) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        message: 'Title and content are required.' 
      });
    }
    
    // Generate encryption key if post is encrypted
    let encryptionKey = null;
    if (isEncrypted === '1' || isEncrypted === true) {
      encryptionKey = crypto.randomBytes(16).toString('hex');
    }
    
    // Insert post
    const { data: newPost, error } = await supabase
      .from('posts')
      .insert({
        user_id: req.session.user.id,
        title,
        content,
        tags: tags || null,
        is_encrypted: isEncrypted === '1' || isEncrypted === true ? 1 : 0,
        encryption_key: encryptionKey,
        glyph_id: glyphId || null
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // Return success with post ID and encryption key if applicable
    const response = { 
      success: true, 
      message: 'Post successfully transmitted to the Bleedstream', 
      postId: newPost.id
    };
    
    if (encryptionKey) {
      response.encryptionKey = encryptionKey;
      response.message += '. Save your encryption key to access this post later.';
    }
    
    res.status(201).json(response);
  } catch (err) {
    console.error('Post creation error:', err);
    res.status(500).json({ 
      error: 'System error', 
      message: 'Terminal connection unstable. Try again later.' 
    });
  }
});

// View a specific post
router.get('/post/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { key } = req.query; // Encryption key for encrypted posts
    
    // Get post
    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        users:user_id (username),
        glyphs:glyph_id (svg_data)
      `)
      .eq('id', id)
      .single();
    
    if (error || !post) {
      return res.status(404).sendFile(path.join(__dirname, '../views/404.html'));
    }
    
    // Format the post to match the expected structure
    const formattedPost = {
      ...post,
      username: post.users.username,
      glyph_svg: post.glyphs?.svg_data || null
    };
    
    // Check if post is encrypted and key is provided
    if (post.is_encrypted === 1 && post.encryption_key !== key) {
      // Serve the encrypted post view that prompts for key
      let html = fs.readFileSync(path.join(__dirname, '../views/feed/encrypted-post.html'), 'utf8');
      html = html.replace('__POST_ID__', id);
      return res.send(html);
    }
    
    // Get user profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        districts:district_id (name)
      `)
      .eq('user_id', post.user_id)
      .single();
    
    if (profileError) {
      throw profileError;
    }
    
    // Format the profile to match the expected structure
    const profile = {
      ...profileData,
      district_name: profileData.districts?.name || null
    };
    
    // Pass data to the frontend
    const data = {
      post: formattedPost,
      profile,
      user: req.session.user || null,
      isOwner: req.session.user && req.session.user.id === post.user_id
    };
    
    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/feed/view-post.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));
    
    res.send(html);
  } catch (err) {
    console.error('Error viewing post:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Delete a post
router.delete('/post/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if post exists and belongs to user
    const { data: post, error: getError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.session.user.id)
      .single();
    
    if (getError || !post) {
      return res.status(404).json({ 
        error: 'Post not found', 
        message: 'The requested post does not exist or does not belong to you.' 
      });
    }
    
    // Delete post
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      throw deleteError;
    }
    
    res.json({ 
      success: true, 
      message: 'Post successfully erased from the Bleedstream' 
    });
  } catch (err) {
    console.error('Post delete error:', err);
    res.status(500).json({ 
      error: 'System error', 
      message: 'Terminal connection unstable. Try again later.' 
    });
  }
});

// Check encryption key for encrypted post
router.post('/check-key/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { key } = req.body;
    
    if (!key) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        message: 'Encryption key is required.' 
      });
    }
    
    // Check if key is valid
    const { data: post, error } = await supabase
      .from('posts')
      .select('encryption_key')
      .eq('id', id)
      .eq('is_encrypted', 1)
      .single();
    
    if (error || !post) {
      return res.status(404).json({ 
        error: 'Post not found', 
        message: 'The requested post does not exist or is not encrypted.' 
      });
    }
    
    if (post.encryption_key !== key) {
      return res.status(401).json({ 
        error: 'Invalid key', 
        message: 'The provided encryption key is invalid.' 
      });
    }
    
    // Key is valid, redirect to post with key
    res.json({ 
      success: true, 
      redirectUrl: `/feed/post/${id}?key=${key}` 
    });
  } catch (err) {
    console.error('Check encryption key error:', err);
    res.status(500).json({ 
      error: 'System error', 
      message: 'Terminal connection unstable. Try again later.' 
    });
  }
});

module.exports = router;