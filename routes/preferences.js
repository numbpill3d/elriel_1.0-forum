// Elriel - User Preferences Routes
// Handles user customization preferences for Bleedstream

const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const db = new Database('./db/elriel.db', { verbose: console.log });
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Authentication required' 
    });
  }
  next();
};

// Configure background image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './public/uploads/backgrounds';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Use userId and timestamp for unique naming
    const userId = req.session.user.id;
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    cb(null, `bg-${timestamp}-${userId}${extension}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Validate image type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG and GIF images are allowed'), false);
    }
    cb(null, true);
  }
});

// Get user preferences
router.get('/', isAuthenticated, (req, res) => {
  try {
    const userId = req.session.user.id;
    
    // Get user preferences
    const user = db.prepare(`
      SELECT username, theme, background_image, font_size, font_color
      FROM users
      WHERE id = ?
    `).get(userId);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found', 
        message: 'User preferences not found' 
      });
    }
    
    // Format preferences for response
    const preferences = {
      username: user.username,
      theme: user.theme || 'default',
      backgroundImage: user.background_image || null,
      fontSize: user.font_size || 'medium',
      fontColor: user.font_color || 'black'
    };
    
    // Get available themes
    const availableThemes = [
      { id: 'default', name: 'Default Terminal', description: 'The standard Elriel terminal theme' },
      { id: 'cyberpunk', name: 'Cyberpunk Neon', description: 'High contrast neon colors on dark background' },
      { id: 'win98', name: 'Windows 98', description: 'Retro computing aesthetic' },
      { id: 'glitch', name: 'Glitch', description: 'Distorted digital artifacts with scan lines' },
      { id: 'vaporwave', name: 'Vaporwave', description: 'Pastel colors with 90s internet vibes' }
    ];
    
    // Get font size options
    const fontSizeOptions = [
      { id: 'small', name: 'Small' },
      { id: 'medium', name: 'Medium' },
      { id: 'large', name: 'Large' },
      { id: 'x-large', name: 'Extra Large' }
    ];
    
    res.json({ 
      success: true, 
      preferences,
      options: {
        themes: availableThemes,
        fontSizes: fontSizeOptions
      }
    });
  } catch (err) {
    console.error('Error fetching user preferences:', err);
    res.status(500).json({ 
      error: 'System error', 
      message: 'Failed to fetch user preferences' 
    });
  }
});

// Update user preferences
router.post('/', isAuthenticated, (req, res) => {
  try {
    const userId = req.session.user.id;
    const { theme, fontSize, fontColor } = req.body;
    
    // Validate input (simplified validation)
    const validThemes = ['default', 'cyberpunk', 'win98', 'glitch', 'vaporwave'];
    const validFontSizes = ['small', 'medium', 'large', 'x-large'];
    
    if (theme && !validThemes.includes(theme)) {
      return res.status(400).json({ 
        error: 'Invalid theme', 
        message: 'Selected theme is not valid' 
      });
    }
    
    if (fontSize && !validFontSizes.includes(fontSize)) {
      return res.status(400).json({ 
        error: 'Invalid font size', 
        message: 'Selected font size is not valid' 
      });
    }
    
    // Prepare update query
    let query = 'UPDATE users SET ';
    const updateFields = [];
    const params = [];
    
    if (theme) {
      updateFields.push('theme = ?');
      params.push(theme);
    }
    
    if (fontSize) {
      updateFields.push('font_size = ?');
      params.push(fontSize);
    }
    
    if (fontColor) {
      updateFields.push('font_color = ?');
      params.push(fontColor);
    }
    
    // If no fields to update, return error
    if (updateFields.length === 0) {
      return res.status(400).json({ 
        error: 'No changes', 
        message: 'No preferences were provided to update' 
      });
    }
    
    // Complete the query
    query += updateFields.join(', ');
    query += ' WHERE id = ?';
    params.push(userId);
    
    // Execute update
    const result = db.prepare(query).run(...params);
    
    if (result.changes === 0) {
      return res.status(404).json({ 
        error: 'Update failed', 
        message: 'Failed to update user preferences' 
      });
    }
    
    // Log the activity
    try {
      const activityLog = require('./activity');
      activityLog.logActivity(userId, 'update_preferences', { 
        theme, fontSize, fontColor 
      });
    } catch (logErr) {
      console.error('Failed to log preference update activity:', logErr);
      // Non-blocking, continue with response
    }
    
    res.json({ 
      success: true, 
      message: 'Preferences updated successfully' 
    });
  } catch (err) {
    console.error('Error updating preferences:', err);
    res.status(500).json({ 
      error: 'System error', 
      message: 'Failed to update preferences' 
    });
  }
});

// Upload background image
router.post('/background', isAuthenticated, upload.single('image'), (req, res) => {
  try {
    const userId = req.session.user.id;
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file', 
        message: 'No image file was provided' 
      });
    }
    
    // Get the relative path for storage in DB
    const relativeFilePath = `/uploads/backgrounds/${req.file.filename}`;
    
    // Update user with new background
    const result = db.prepare(`
      UPDATE users
      SET background_image = ?
      WHERE id = ?
    `).run(relativeFilePath, userId);
    
    if (result.changes === 0) {
      // Clean up the file if update failed
      fs.unlinkSync(path.join('./public', relativeFilePath));
      
      return res.status(500).json({ 
        error: 'Update failed', 
        message: 'Failed to update background image' 
      });
    }
    
    // Log the activity
    try {
      const activityLog = require('./activity');
      activityLog.logActivity(userId, 'update_background', { 
        backgroundImage: relativeFilePath 
      });
    } catch (logErr) {
      console.error('Failed to log background update activity:', logErr);
      // Non-blocking, continue with response
    }
    
    res.json({ 
      success: true, 
      message: 'Background image updated successfully',
      backgroundImage: relativeFilePath
    });
  } catch (err) {
    console.error('Error updating background image:', err);
    res.status(500).json({ 
      error: 'System error', 
      message: 'Failed to update background image' 
    });
  }
});

// User interests management
router.get('/interests', isAuthenticated, (req, res) => {
  try {
    const userId = req.session.user.id;
    
    // Get user interests
    const interests = db.prepare(`
      SELECT tag, district_id, glyph_id
      FROM user_interests
      WHERE user_id = ?
    `).all(userId);
    
    // Get available tags (from posts)
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
    
    // Get districts
    const districts = db.prepare(`
      SELECT id, name, description
      FROM districts
      WHERE is_hidden = 0
    `).all();
    
    // Get user's glyphs
    const glyphs = db.prepare(`
      SELECT id, seed
      FROM glyphs
      WHERE user_id = ?
    `).all(userId);
    
    res.json({ 
      success: true, 
      interests,
      options: {
        tags: Array.from(allTags),
        districts,
        glyphs
      }
    });
  } catch (err) {
    console.error('Error fetching user interests:', err);
    res.status(500).json({ 
      error: 'System error', 
      message: 'Failed to fetch user interests' 
    });
  }
});

// Update user interests
router.post('/interests', isAuthenticated, (req, res) => {
  try {
    const userId = req.session.user.id;
    const { tags, districtId, glyphId } = req.body;
    
    // Start transaction
    db.prepare('BEGIN').run();
    
    // Clear existing interests
    db.prepare(`
      DELETE FROM user_interests
      WHERE user_id = ?
    `).run(userId);
    
    // Insert new interests
    const insertInterest = db.prepare(`
      INSERT INTO user_interests (user_id, tag, district_id, glyph_id)
      VALUES (?, ?, ?, ?)
    `);
    
    // If tags provided, insert each one
    if (tags && Array.isArray(tags)) {
      tags.forEach(tag => {
        insertInterest.run(userId, tag, null, null);
      });
    }
    
    // If district provided, insert it
    if (districtId) {
      insertInterest.run(userId, null, districtId, null);
    }
    
    // If glyph provided, insert it
    if (glyphId) {
      insertInterest.run(userId, null, null, glyphId);
    }
    
    // Commit transaction
    db.prepare('COMMIT').run();
    
    // Log the activity
    try {
      const activityLog = require('./activity');
      activityLog.logActivity(userId, 'update_interests', { 
        tags, districtId, glyphId 
      });
    } catch (logErr) {
      console.error('Failed to log interests update activity:', logErr);
      // Non-blocking, continue with response
    }
    
    res.json({ 
      success: true, 
      message: 'Interests updated successfully' 
    });
  } catch (err) {
    // Rollback transaction
    db.prepare('ROLLBACK').run();
    
    console.error('Error updating user interests:', err);
    res.status(500).json({ 
      error: 'System error', 
      message: 'Failed to update user interests' 
    });
  }
});

module.exports = router;