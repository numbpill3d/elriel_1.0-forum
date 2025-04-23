// Elriel - Profile Routes
// Handles user profile viewing and editing

const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const Database = require('better-sqlite3');
const db = new Database('./db/elriel.db', { verbose: console.log });

// Configure file uploads for profile backgrounds
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './public/uploads/backgrounds';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'bg-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).redirect('/auth/login');
  }
  next();
};

// Serve profile dashboard
router.get('/', isAuthenticated, (req, res) => {
  try {
    // Get user profile
    let profile = db.prepare(`
      SELECT p.*, u.username
      FROM profiles p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
    `).get(req.session.user.id);
    
    if (!profile) {
      // Create default profile if it doesn't exist
      const insertProfile = db.prepare(`
        INSERT INTO profiles (user_id, status)
        VALUES (?, 'New terminal connected')
      `);
      
      insertProfile.run(req.session.user.id);
      
      // Get the newly created profile
      profile = db.prepare(`
        SELECT p.*, u.username 
        FROM profiles p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id = ?
      `).get(req.session.user.id);
    }
    
    // Get user's glyph if it exists
    let glyph = null;
    if (profile.glyph_id) {
      glyph = db.prepare('SELECT * FROM glyphs WHERE id = ?').get(profile.glyph_id);
    }
    
    // Get user's posts
    const posts = db.prepare(`
      SELECT * FROM posts 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).all(req.session.user.id);
    
    // Pass data to the frontend
    const data = {
      profile,
      glyph,
      posts,
      user: req.session.user
    };
    
    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/profile/dashboard.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));
    
    res.send(html);
  } catch (err) {
    console.error('Error loading profile:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// View a user's profile
router.get('/user/:username', (req, res) => {
  try {
    const { username } = req.params;
    const useEnhanced = req.query.enhanced === '1' || req.query.enhanced === 'true';
    
    // Get user and profile
    const profile = db.prepare(`
      SELECT p.*, u.username, u.id as user_id
      FROM profiles p
      JOIN users u ON p.user_id = u.id
      WHERE u.username = ?
    `).get(username);
    
    if (!profile) {
      return res.status(404).sendFile(path.join(__dirname, '../views/404.html'));
    }
    
    // Get user's glyph if it exists
    let glyph = null;
    if (profile.glyph_id) {
      glyph = db.prepare('SELECT * FROM glyphs WHERE id = ?').get(profile.glyph_id);
    }
    
    // Get user's posts
    const posts = db.prepare(`
      SELECT * FROM posts
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(profile.user_id);
    
    // Get user's profile containers if enhanced view
    let containers = [];
    if (useEnhanced) {
      containers = db.prepare(`
        SELECT * FROM profile_containers
        WHERE profile_id = ?
        ORDER BY position ASC
      `).all(profile.id);
    }
    
    // Get user's rewards
    const rewards = db.prepare(`
      SELECT r.*, ur.is_equipped
      FROM user_rewards ur
      JOIN repute_rewards r ON ur.reward_id = r.id
      WHERE ur.user_id = ?
    `).all(profile.user_id);
    
    // Pass data to the frontend
    const data = {
      profile,
      glyph,
      posts,
      containers,
      rewards,
      user: req.session.user || null,
      isOwner: req.session.user && req.session.user.id === profile.user_id
    };
    
    // Determine which template to use
    const templatePath = useEnhanced ?
      '../views/profile/view-enhanced.html' :
      '../views/profile/view.html';
    
    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, templatePath), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));
    
    res.send(html);
  } catch (err) {
    console.error('Error viewing profile:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Enhanced profile view
router.get('/enhanced', isAuthenticated, (req, res) => {
  res.redirect(`/profile/user/${req.session.user.username}?enhanced=1`);
});

// Serve profile edit page
router.get('/edit', isAuthenticated, (req, res) => {
  try {
    // Get user profile
    const profile = db.prepare(`
      SELECT p.*, u.username 
      FROM profiles p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
    `).get(req.session.user.id);
    
    // Get user's glyph if it exists
    let glyph = null;
    if (profile.glyph_id) {
      glyph = db.prepare('SELECT * FROM glyphs WHERE id = ?').get(profile.glyph_id);
    }
    
    // Get all districts
    const districts = db.prepare(`
      SELECT * FROM districts
      WHERE is_hidden = 0 OR id = ?
    `).all(profile.district_id);
    
    // Pass data to the frontend
    const data = {
      profile,
      glyph,
      districts,
      user: req.session.user
    };
    
    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/profile/edit.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));
    
    res.send(html);
  } catch (err) {
    console.error('Error loading profile editor:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Update profile
router.post('/update', isAuthenticated, upload.single('background'), (req, res) => {
  try {
    const { status, customCss, customHtml, blogLayout, districtId } = req.body;
    
    // Sanitize inputs (basic sanitization, would use a proper library in production)
    const sanitizedStatus = status ? status.slice(0, 100) : null;
    const sanitizedCss = customCss ? customCss.slice(0, 10000) : null;
    const sanitizedHtml = customHtml ? customHtml.slice(0, 20000) : null;
    
    // Build update query
    let updateQuery = 'UPDATE profiles SET ';
    const updateParams = [];
    const updateFields = [];
    
    if (sanitizedStatus !== null) {
      updateFields.push('status = ?');
      updateParams.push(sanitizedStatus);
    }
    
    if (sanitizedCss !== null) {
      updateFields.push('custom_css = ?');
      updateParams.push(sanitizedCss);
    }
    
    if (sanitizedHtml !== null) {
      updateFields.push('custom_html = ?');
      updateParams.push(sanitizedHtml);
    }
    
    if (blogLayout) {
      updateFields.push('blog_layout = ?');
      updateParams.push(blogLayout);
    }
    
    if (districtId) {
      updateFields.push('district_id = ?');
      updateParams.push(districtId);
    }
    
    // Handle background image upload
    if (req.file) {
      updateFields.push('background_image = ?');
      updateParams.push('/uploads/backgrounds/' + req.file.filename);
    }
    
    // Add updated_at timestamp
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    // Complete the query
    updateQuery += updateFields.join(', ') + ' WHERE user_id = ?';
    updateParams.push(req.session.user.id);
    
    // Execute the update
    const result = db.prepare(updateQuery).run(...updateParams);
    
    if (result.changes === 0) {
      return res.status(404).json({ 
        error: 'Profile not found', 
        message: 'Terminal identity not found in the system.' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Terminal identity updated successfully' 
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ 
      error: 'System error', 
      message: 'Terminal connection unstable. Try again later.' 
    });
  }
});

// Set profile glyph
router.post('/set-glyph/:glyphId', isAuthenticated, (req, res) => {
  try {
    const { glyphId } = req.params;
    const { enable3d, rotationSpeed } = req.body;
    
    // Check if glyph exists and belongs to user
    const glyph = db.prepare('SELECT * FROM glyphs WHERE id = ? AND user_id = ?')
      .get(glyphId, req.session.user.id);
    
    if (!glyph) {
      return res.status(404).json({
        error: 'Glyph not found',
        message: 'The requested glyph does not exist or does not belong to you.'
      });
    }
    
    // Update profile with 3D settings if provided
    let query = 'UPDATE profiles SET glyph_id = ?';
    const params = [glyphId];
    
    if (enable3d !== undefined) {
      query += ', glyph_3d = ?';
      params.push(enable3d === true || enable3d === '1' ? 1 : 0);
    }
    
    if (rotationSpeed !== undefined) {
      query += ', glyph_rotation_speed = ?';
      params.push(parseInt(rotationSpeed) || 3);
    }
    
    query += ' WHERE user_id = ?';
    params.push(req.session.user.id);
    
    const result = db.prepare(query).run(...params);
    
    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'Terminal identity not found in the system.'
      });
    }
    
    res.json({
      success: true,
      message: 'Glyph set as profile sigil'
    });
  } catch (err) {
    console.error('Set profile glyph error:', err);
    res.status(500).json({
      error: 'System error',
      message: 'Terminal connection unstable. Try again later.'
    });
  }
});

// Set background options
router.post('/background', isAuthenticated, (req, res) => {
  try {
    const { backgroundType, tileBackground } = req.body;
    
    // Update profile background settings
    let query = 'UPDATE profiles SET ';
    const updateParams = [];
    const updateFields = [];
    
    if (backgroundType) {
      updateFields.push('profile_bg_type = ?');
      updateParams.push(backgroundType);
    }
    
    if (tileBackground !== undefined) {
      updateFields.push('profile_bg_tile = ?');
      updateParams.push(tileBackground === true || tileBackground === '1' ? 1 : 0);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'No background options provided.'
      });
    }
    
    // Complete the query
    query += updateFields.join(', ') + ' WHERE user_id = ?';
    updateParams.push(req.session.user.id);
    
    // Execute the update
    const result = db.prepare(query).run(...updateParams);
    
    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'Terminal identity not found in the system.'
      });
    }
    
    res.json({
      success: true,
      message: 'Background options updated successfully'
    });
  } catch (err) {
    console.error('Update background options error:', err);
    res.status(500).json({
      error: 'System error',
      message: 'Terminal connection unstable. Try again later.'
    });
  }
});

// Profile container routes
// Create new container
router.post('/container', isAuthenticated, (req, res) => {
  try {
    const { containerType, title, content, settings, position } = req.body;
    
    if (!containerType) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Container type is required.'
      });
    }
    
    // Get user profile ID
    const profile = db.prepare('SELECT id FROM profiles WHERE user_id = ?')
      .get(req.session.user.id);
    
    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'User profile not found.'
      });
    }
    
    // Insert container
    const result = db.prepare(`
      INSERT INTO profile_containers (
        profile_id, container_type, title, content, position, settings
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      profile.id,
      containerType,
      title || null,
      content || null,
      position || 0,
      settings || null
    );
    
    if (result.changes === 0) {
      throw new Error('Failed to create container');
    }
    
    res.status(201).json({
      success: true,
      message: 'Container created successfully',
      containerId: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Container creation error:', err);
    res.status(500).json({
      error: 'System error',
      message: 'Terminal connection unstable. Try again later.'
    });
  }
});

// Update container
router.put('/container/:id', isAuthenticated, (req, res) => {
  try {
    const { id } = req.params;
    const { containerType, title, content, settings, position } = req.body;
    
    // Check if container exists and belongs to user
    const container = db.prepare(`
      SELECT pc.*
      FROM profile_containers pc
      JOIN profiles p ON pc.profile_id = p.id
      WHERE pc.id = ? AND p.user_id = ?
    `).get(id, req.session.user.id);
    
    if (!container) {
      return res.status(404).json({
        error: 'Container not found',
        message: 'The requested container does not exist or does not belong to you.'
      });
    }
    
    // Build update query
    let updateQuery = 'UPDATE profile_containers SET ';
    const updateParams = [];
    const updateFields = [];
    
    if (containerType) {
      updateFields.push('container_type = ?');
      updateParams.push(containerType);
    }
    
    if (title !== undefined) {
      updateFields.push('title = ?');
      updateParams.push(title);
    }
    
    if (content !== undefined) {
      updateFields.push('content = ?');
      updateParams.push(content);
    }
    
    if (settings) {
      updateFields.push('settings = ?');
      updateParams.push(settings);
    }
    
    if (position !== undefined) {
      updateFields.push('position = ?');
      updateParams.push(position);
    }
    
    // Add updated_at timestamp
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    // Complete the query
    updateQuery += updateFields.join(', ') + ' WHERE id = ?';
    updateParams.push(id);
    
    // Execute the update
    const result = db.prepare(updateQuery).run(...updateParams);
    
    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Update failed',
        message: 'Failed to update container.'
      });
    }
    
    res.json({
      success: true,
      message: 'Container updated successfully'
    });
  } catch (err) {
    console.error('Container update error:', err);
    res.status(500).json({
      error: 'System error',
      message: 'Terminal connection unstable. Try again later.'
    });
  }
});

// Delete container
router.delete('/container/:id', isAuthenticated, (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if container exists and belongs to user
    const container = db.prepare(`
      SELECT pc.*
      FROM profile_containers pc
      JOIN profiles p ON pc.profile_id = p.id
      WHERE pc.id = ? AND p.user_id = ?
    `).get(id, req.session.user.id);
    
    if (!container) {
      return res.status(404).json({
        error: 'Container not found',
        message: 'The requested container does not exist or does not belong to you.'
      });
    }
    
    // Delete container
    const result = db.prepare('DELETE FROM profile_containers WHERE id = ?').run(id);
    
    if (result.changes === 0) {
      throw new Error('Failed to delete container');
    }
    
    res.json({
      success: true,
      message: 'Container successfully removed'
    });
  } catch (err) {
    console.error('Container delete error:', err);
    res.status(500).json({
      error: 'System error',
      message: 'Terminal connection unstable. Try again later.'
    });
  }
});

// Equip/unequip rewards
router.post('/reward/:id/toggle', isAuthenticated, (req, res) => {
  try {
    const { id } = req.params;
    const { equipped } = req.body;
    
    // Check if user has this reward
    const userReward = db.prepare(`
      SELECT ur.*
      FROM user_rewards ur
      JOIN repute_rewards r ON ur.reward_id = r.id
      WHERE ur.user_id = ? AND r.id = ?
    `).get(req.session.user.id, id);
    
    if (!userReward) {
      return res.status(404).json({
        error: 'Reward not found',
        message: 'You do not have this reward.'
      });
    }
    
    // Update equipped status
    const result = db.prepare(`
      UPDATE user_rewards SET is_equipped = ?
      WHERE user_id = ? AND reward_id = ?
    `).run(
      equipped === true || equipped === '1' ? 1 : 0,
      req.session.user.id,
      id
    );
    
    if (result.changes === 0) {
      throw new Error('Failed to update reward status');
    }
    
    res.json({
      success: true,
      message: 'Reward status updated successfully'
    });
  } catch (err) {
    console.error('Update reward status error:', err);
    res.status(500).json({
      error: 'System error',
      message: 'Terminal connection unstable. Try again later.'
    });
  }
});

module.exports = router;