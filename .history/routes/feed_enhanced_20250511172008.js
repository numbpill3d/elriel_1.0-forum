// Elriel - Enhanced Feed Routes
// Handles the enhanced Bleedstream with real-time updates, personalization, and customization

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Database = require('better-sqlite3');
const db = new Database('./db/elriel.db', { verbose: console.log });
const activityService = require('./activity');
const websocketService = require('../services/websocket');

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).redirect('/auth/login');
  }
  next();
};

// Serve Enhanced Bleedstream page
router.get('/bleedstream/enhanced', (req, res) => {
  try {
    // Get tag filter if provided
    const { tag } = req.query;
    
    // Build posts query
    let postsQuery = `
      SELECT p.*, u.username, g.svg_data as glyph_svg, d.name as district_name
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN glyphs g ON p.glyph_id = g.id
      LEFT JOIN profiles pr ON u.id = pr.user_id
      LEFT JOIN districts d ON pr.district_id = d.id
      WHERE p.is_encrypted = 0
    `;
    
    const postsParams = [];
    
    // Add tag filter if provided
    if (tag) {
      postsQuery += ` AND p.tags LIKE ?`;
      postsParams.push(`%${tag}%`);
    }
    
    // Add order by
    postsQuery += ` ORDER BY p.created_at DESC LIMIT 50`;
    
    // Execute posts query
    const posts = db.prepare(postsQuery).all(...postsParams);
    
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
    
    // Get recent activities (only if user is logged in)
    let activities = [];
    if (req.session.user) {
      activities = db.prepare(`
        SELECT a.*, u.username
        FROM activity_log a
        JOIN users u ON a.user_id = u.id
        ORDER BY a.created_at DESC
        LIMIT 20
      `).all();
      
      // Format activities for response
      activities = activities.map(activity => ({
        id: activity.id,
        userId: activity.user_id,
        username: activity.username,
        type: activity.activity_type,
        data: JSON.parse(activity.activity_data || '{}'),
        createdAt: activity.created_at
      }));
    }
    
    // Get user preferences if logged in
    let preferences = {};
    if (req.session.user) {
      const userPrefs = db.prepare(`
        SELECT theme, background_image, font_size, font_color
        FROM users
        WHERE id = ?
      `).get(req.session.user.id);
      
      if (userPrefs) {
        preferences = {
          theme: userPrefs.theme || 'default',
          backgroundImage: userPrefs.background_image || null,
          fontSize: userPrefs.font_size || 'medium',
          fontColor: userPrefs.font_color || '#00ff00'
        };
      }
      
      // Get user interests
      const userInterests = db.prepare(`
        SELECT tag, district_id, glyph_id
        FROM user_interests
        WHERE user_id = ?
      `).all(req.session.user.id);
      
      if (userInterests && userInterests.length > 0) {
        preferences.interests = userInterests;
      }
    }
    
    // Pass data to the frontend
    const data = {
      posts,
      tags: Array.from(allTags),
      currentTag: tag || null,
      user: req.session.user || null,
      preferences,
      activities
    };
    
    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/feed/enhanced-bleedstream.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));
    
    res.send(html);
  } catch (err) {
    console.error('Error loading Enhanced Bleedstream:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// API endpoint for personalized feed
router.get('/api/stream', isAuthenticated, (req, res) => {
  try {
    const userId = req.session.user.id;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    // Get user interests
    const userInterests = db.prepare(`
      SELECT tag, district_id, glyph_id
      FROM user_interests
      WHERE user_id = ?
    `).all(userId);
    
    // If no interests, just return newest posts
    if (!userInterests || userInterests.length === 0) {
      const posts = db.prepare(`
        SELECT p.*, u.username, g.svg_data as glyph_svg, d.name as district_name
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN glyphs g ON p.glyph_id = g.id
        LEFT JOIN profiles pr ON u.id = pr.user_id
        LEFT JOIN districts d ON pr.district_id = d.id
        WHERE p.is_encrypted = 0
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `).all(limit, offset);
      
      return res.json({
        success: true,
        posts,
        personalized: false
      });
    }
    
    // Build a complex query that scores posts based on user interests
    let query = `
      WITH post_scores AS (
        SELECT p.*, u.username, g.svg_data as glyph_svg, d.name as district_name,
          CASE
            WHEN p.user_id = ? THEN 100  -- Highest score for own posts
    `;
    
    const params = [userId];
    
    // Add scores for each interest
    userInterests.forEach((interest, index) => {
      if (interest.tag) {
        query += `
            WHEN p.tags LIKE ? THEN 50  -- Score for matching tag
        `;
        params.push(`%${interest.tag}%`);
      }
      
      if (interest.district_id) {
        query += `
            WHEN pr.district_id = ? THEN 40  -- Score for matching district
        `;
        params.push(interest.district_id);
      }
      
      if (interest.glyph_id) {
        query += `
            WHEN p.glyph_id = ? THEN 30  -- Score for matching glyph
        `;
        params.push(interest.glyph_id);
      }
    });
    
    // Default score for non-matching posts and ordering
    query += `
            ELSE 10  -- Base score for non-matching posts
          END as relevance_score
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN glyphs g ON p.glyph_id = g.id
        LEFT JOIN profiles pr ON u.id = pr.user_id
        LEFT JOIN districts d ON pr.district_id = d.id
        WHERE p.is_encrypted = 0
      )
      SELECT * FROM post_scores
      ORDER BY relevance_score DESC, created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    
    // Execute the query
    const posts = db.prepare(query).all(...params);
    
    res.json({
      success: true,
      posts,
      personalized: true
    });
    
  } catch (err) {
    console.error('Error fetching personalized stream:', err);
    res.status(500).json({
      error: 'System error',
      message: 'Failed to fetch personalized stream'
    });
  }
});

// Create a new post with activity logging
router.post('/create', isAuthenticated, (req, res) => {
  try {
    const { title, content, tags, glyphId, isEncrypted } = req.body;
    const userId = req.session.user.id;
    
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
    
    // Start a transaction
    db.prepare('BEGIN').run();
    
    // Insert post
    const result = db.prepare(`
      INSERT INTO posts (
        user_id, title, content, tags, 
        is_encrypted, encryption_key, glyph_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      title,
      content,
      tags || null,
      isEncrypted === '1' || isEncrypted === true ? 1 : 0,
      encryptionKey,
      glyphId || null
    );
    
    if (result.changes === 0) {
      db.prepare('ROLLBACK').run();
      throw new Error('Failed to create post');
    }
    
    const postId = result.lastInsertRowid;
    
    // Log activity for the new post
    try {
      if (!isEncrypted) {  // Don't log encrypted posts for privacy
        const activityData = {
          postId,
          title,
          tags: tags || null,
          glyphId: glyphId || null
        };
        
        const activityId = db.prepare(`
          INSERT INTO activity_log (user_id, activity_type, activity_data)
          VALUES (?, ?, ?)
        `).run(
          userId,
          'new_post',
          JSON.stringify(activityData)
        ).lastInsertRowid;
        
        // Broadcast activity to connected clients if not encrypted
        const username = req.session.user.username;
        websocketService.broadcast({
          type: 'activity',
          data: {
            id: activityId,
            userId,
            username,
            type: 'new_post',
            data: activityData,
            createdAt: new Date().toISOString()
          }
        });
      }
    } catch (logErr) {
      console.error('Failed to log post activity:', logErr);
      // Non-blocking error, continue with post creation
    }
    
    // Commit transaction
    db.prepare('COMMIT').run();
    
    // Return success with post ID and encryption key if applicable
    const response = { 
      success: true, 
      message: 'Post successfully transmitted to the Bleedstream', 
      postId
    };
    
    if (encryptionKey) {
      response.encryptionKey = encryptionKey;
      response.message += '. Save your encryption key to access this post later.';
    }
    
    res.status(201).json(response);
  } catch (err) {
    // Rollback transaction if active
    try {
      db.prepare('ROLLBACK').run();
    } catch (rollbackErr) {
      // Ignore rollback errors if transaction wasn't active
    }
    
    console.error('Post creation error:', err);
    res.status(500).json({ 
      error: 'System error', 
      message: 'Terminal connection unstable. Try again later.' 
    });
  }
});

// Import and combine routes from original feed.js
// This ensures we have all the functionality from the original file
// while adding new features.
const originalFeedRoutes = require('./feed');

// Explicitly add routes from the original feed.js router
// Skipping the ones we've already defined.
// If using Express Router directly, we need a different approach
// since we can't enumerate the routes.

// Export the router
module.exports = router;