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
    
    // Check if glyph exists and belongs to user
    const glyph = db.prepare('SELECT * FROM glyphs WHERE id = ? AND user_id = ?')
      .get(glyphId, req.session.user.id);
    
    if (!glyph) {
      return res.status(404).json({ 
        error: 'Glyph not found', 
        message: 'The requested glyph does not exist or does not belong to you.' 
      });
    }
    
    // Update profile
    const result = db.prepare('UPDATE profiles SET glyph_id = ? WHERE user_id = ?')
      .run(glyphId, req.session.user.id);
    
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

module.exports = router;