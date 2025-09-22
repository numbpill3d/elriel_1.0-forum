// Elriel - Feed Routes
// Handles the Bleedstream (global feed) and post management

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Database = require('better-sqlite3');
const db = new Database('./db/elriel.db', { verbose: console.log });

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).redirect('/auth/login');
  }
  next();
};

// Serve Bleedstream page
router.get('/bleedstream', (req, res) => {
  try {
    // Get tag filter if provided
    const { tag } = req.query;
    
    // Build query
    let query = `
      SELECT p.*, u.username, g.svg_data as glyph_svg, d.name as district_name
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN glyphs g ON p.glyph_id = g.id
      LEFT JOIN profiles pr ON u.id = pr.user_id
      LEFT JOIN districts d ON pr.district_id = d.id
      WHERE p.is_encrypted = 0
    `;
    
    const queryParams = [];
    
    // Add tag filter if provided
    if (tag) {
      query += ` AND p.tags LIKE ?`;
      queryParams.push(`%${tag}%`);
    }
    
    // Add order by
    query += ` ORDER BY p.created_at DESC LIMIT 50`;
    
    // Execute query
    const posts = db.prepare(query).all(...queryParams);
    
    // Get all tags for filter dropdown
    const tagsResult = db.prepare(`
      SELECT DISTINCT tags FROM posts WHERE tags IS NOT NULL AND tags != ''
    `).all();
    
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
      posts,
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
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Serve new post page
router.get('/new', isAuthenticated, (req, res) => {
  try {
    // Get user's glyphs
    const glyphs = db.prepare(`
      SELECT * FROM glyphs 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).all(req.session.user.id);
    
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
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Create a new post
router.post('/create', isAuthenticated, (req, res) => {
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
    const result = db.prepare(`
      INSERT INTO posts (
        user_id, title, content, tags, 
        is_encrypted, encryption_key, glyph_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.session.user.id,
      title,
      content,
      tags || null,
      isEncrypted === '1' || isEncrypted === true ? 1 : 0,
      encryptionKey,
      glyphId || null
    );
    
    if (result.changes === 0) {
      throw new Error('Failed to create post');
    }
    
    // Return success with post ID and encryption key if applicable
    const response = { 
      success: true, 
      message: 'Post successfully transmitted to the Bleedstream', 
      postId: result.lastInsertRowid 
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
router.get('/post/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { key } = req.query; // Encryption key for encrypted posts
    
    // Get post
    const post = db.prepare(`
      SELECT p.*, u.username, g.svg_data as glyph_svg
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN glyphs g ON p.glyph_id = g.id
      WHERE p.id = ?
    `).get(id);
    
    if (!post) {
      return res.status(404).sendFile(path.join(__dirname, '../views/404.html'));
    }
    
    // Check if post is encrypted and key is provided
    if (post.is_encrypted === 1 && post.encryption_key !== key) {
      // Serve the encrypted post view that prompts for key
      let html = fs.readFileSync(path.join(__dirname, '../views/feed/encrypted-post.html'), 'utf8');
      html = html.replace('__POST_ID__', id);
      return res.send(html);
    }
    
    // Get user profile
    const profile = db.prepare(`
      SELECT p.*, d.name as district_name
      FROM profiles p
      LEFT JOIN districts d ON p.district_id = d.id
      WHERE p.user_id = ?
    `).get(post.user_id);
    
    // Pass data to the frontend
    const data = {
      post,
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
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Delete a post
router.delete('/post/:id', isAuthenticated, (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if post exists and belongs to user
    const post = db.prepare('SELECT * FROM posts WHERE id = ? AND user_id = ?')
      .get(id, req.session.user.id);
    
    if (!post) {
      return res.status(404).json({ 
        error: 'Post not found', 
        message: 'The requested post does not exist or does not belong to you.' 
      });
    }
    
    // Delete post
    const result = db.prepare('DELETE FROM posts WHERE id = ?').run(id);
    
    if (result.changes === 0) {
      throw new Error('Failed to delete post');
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
router.post('/check-key/:id', (req, res) => {
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
    const post = db.prepare('SELECT encryption_key FROM posts WHERE id = ? AND is_encrypted = 1')
      .get(id);
    
    if (!post) {
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