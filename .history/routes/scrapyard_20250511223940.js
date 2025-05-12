// Elriel - Scrapyard Marketplace Routes
// Handles junker registration, asset uploads, and asset interactions

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const db = new Database('./db/elriel.db', { verbose: console.log });

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine destination based on file type
    let uploadPath = path.join(__dirname, '../public/uploads/assets');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExt);
  }
});

// File filter for accepted file types
const fileFilter = (req, file, cb) => {
  // Accept images, fonts, html/css files
  const allowedTypes = [
    // Images
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico',
    // Fonts
    '.ttf', '.otf', '.woff', '.woff2',
    // Web files
    '.html', '.css', '.js',
    // Archives
    '.zip'
  ];
  
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    return cb(null, true);
  }
  
  cb(new Error('Invalid file type. Only web assets are allowed.'));
};

// Initialize upload
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).redirect('/auth/login');
  }
  next();
};

// Check if user is a junker
const isJunker = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).redirect('/auth/login');
  }
  
  try {
    const junker = db.prepare(`
      SELECT * FROM junkers WHERE user_id = ?
    `).get(req.session.user.id);
    
    if (!junker) {
      return res.status(403).redirect('/scrapyard/register');
    }
    
    req.junker = junker;
    next();
  } catch (err) {
    console.error('Error checking junker status:', err);
    res.status(500).send('Error checking junker status');
  }
};

// Get asset categories
const getAssetCategories = () => {
  try {
    return db.prepare(`
      SELECT * FROM asset_categories ORDER BY name
    `).all();
  } catch (err) {
    console.error('Error fetching asset categories:', err);
    return [];
  }
};

// Serve scrapyard marketplace page
router.get('/', (req, res) => {
  try {
    // Get all assets with user info
    const assets = db.prepare(`
      SELECT a.*, u.username, 
        (SELECT COUNT(*) FROM asset_comments WHERE asset_id = a.id) as comment_count,
        (SELECT COUNT(*) FROM asset_favorites WHERE asset_id = a.id) as favorite_count
      FROM scrapyard_assets a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
    `).all();
    
    // Get asset categories
    const categories = getAssetCategories();
    
    // Check if user is a junker
    let junker = null;
    if (req.session.user) {
      junker = db.prepare(`
        SELECT * FROM junkers WHERE user_id = ?
      `).get(req.session.user.id);
    }
    
    // Get junker count
    const junkerCount = db.prepare(`
      SELECT COUNT(*) as count FROM junkers
    `).get().count;
    
    // Get asset count
    const assetCount = db.prepare(`
      SELECT COUNT(*) as count FROM scrapyard_assets
    `).get().count;
    
    // Pass data to the frontend
    const data = {
      assets,
      categories,
      junkerCount,
      assetCount,
      user: req.session.user || null,
      isJunker: !!junker
    };
    
    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/forum/scrapyard.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));
    
    res.send(html);
  } catch (err) {
    console.error('Error loading scrapyard marketplace:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Serve junker registration page
router.get('/register', isAuthenticated, (req, res) => {
  try {
    // Check if user is already a junker
    const junker = db.prepare(`
      SELECT * FROM junkers WHERE user_id = ?
    `).get(req.session.user.id);
    
    if (junker) {
      // User is already a junker, redirect to profile
      return res.redirect('/scrapyard/profile');
    }
    
    // Pass data to the frontend
    const data = {
      user: req.session.user
    };
    
    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/forum/junker-register.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));
    
    res.send(html);
  } catch (err) {
    console.error('Error loading junker registration:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Process junker registration
router.post('/register', isAuthenticated, (req, res) => {
  try {
    const { junkerName, bio } = req.body;
    
    // Validate input
    if (!junkerName) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Junker name is required.'
      });
    }
    
    // Check if user is already a junker
    const existingJunker = db.prepare(`
      SELECT * FROM junkers WHERE user_id = ?
    `).get(req.session.user.id);
    
    if (existingJunker) {
      return res.status(400).json({
        error: 'Already registered',
        message: 'You are already registered as a junker.'
      });
    }
    
    // Register as junker
    const result = db.prepare(`
      INSERT INTO junkers (user_id, junker_name, bio)
      VALUES (?, ?, ?)
    `).run(req.session.user.id, junkerName, bio || '');
    
    if (result.changes === 0) {
      throw new Error('Failed to register as junker');
    }
    
    // Return success
    res.status(201).json({
      success: true,
      message: 'Successfully registered as a junker!',
      redirect: '/scrapyard'
    });
  } catch (err) {
    console.error('Error registering as junker:', err);
    res.status(500).json({
      error: 'System error',
      message: 'Terminal connection unstable. Try again later.'
    });
  }
});

// Serve junker profile page
router.get('/profile', isAuthenticated, (req, res) => {
  try {
    // Get junker profile
    const junker = db.prepare(`
      SELECT j.*, u.username
      FROM junkers j
      JOIN users u ON j.user_id = u.id
      WHERE j.user_id = ?
    `).get(req.session.user.id);
    
    if (!junker) {
      // Not a junker, redirect to registration
      return res.redirect('/scrapyard/register');
    }
    
    // Get junker's assets
    const assets = db.prepare(`
      SELECT a.*, 
        (SELECT COUNT(*) FROM asset_comments WHERE asset_id = a.id) as comment_count,
        (SELECT COUNT(*) FROM asset_favorites WHERE asset_id = a.id) as favorite_count
      FROM scrapyard_assets a
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
    `).all(req.session.user.id);
    
    // Get asset categories
    const categories = getAssetCategories();
    
    // Pass data to the frontend
    const data = {
      junker,
      assets,
      categories,
      user: req.session.user
    };
    
    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/forum/junker-profile.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));
    
    res.send(html);
  } catch (err) {
    console.error('Error loading junker profile:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Serve upload asset page
router.get('/upload', isJunker, (req, res) => {
  try {
    // Get asset categories
    const categories = getAssetCategories();
    
    // Pass data to the frontend
    const data = {
      categories,
      user: req.session.user,
      junker: req.junker
    };
    
    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/forum/upload-asset.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));
    
    res.send(html);
  } catch (err) {
    console.error('Error loading upload asset page:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Process asset upload
router.post('/upload', isJunker, upload.fields([
  { name: 'asset', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), (req, res) => {
 const startTime = Date.now();
 try {
   const { title, description, category, tags, asset_type, is_free } = req.body;
   
   // Log file sizes
   if (req.files.asset) {
     console.log('Uploaded asset size:', req.files.asset[0].size, 'bytes');
   }
   if (req.files.thumbnail) {
     console.log('Uploaded thumbnail size:', req.files.thumbnail[0].size, 'bytes');
   }
   
   // Validate input
    if (!title || !description || !category || !asset_type) {
      // Remove uploaded files
      if (req.files.asset) {
        fs.unlinkSync(req.files.asset[0].path);
      }
      if (req.files.thumbnail) {
        fs.unlinkSync(req.files.thumbnail[0].path);
      }
      
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Required fields missing.'
      });
    }
    
    // Ensure we have an asset file
    if (!req.files.asset) {
      return res.status(400).json({
        error: 'Missing file',
        message: 'Asset file is required.'
      });
    }
    
    // Get file paths relative to public directory
    const assetPath = req.files.asset[0].path.replace(path.join(__dirname, '../public'), '');
    let thumbnailPath = null;
    
    if (req.files.thumbnail) {
      thumbnailPath = req.files.thumbnail[0].path.replace(path.join(__dirname, '../public'), '');
    }
    
    // Insert asset
    const result = db.prepare(`
      INSERT INTO scrapyard_assets (
        user_id, title, description, file_path, thumbnail_path,
        asset_type, category, tags, is_free
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.session.user.id,
      title,
      description,
      assetPath,
      thumbnailPath,
      asset_type,
      category,
      tags || '',
      is_free === 'true' ? 1 : 0
    );
    
    if (result.changes === 0) {
      throw new Error('Failed to upload asset');
    }
    
    // Return success
    res.status(201).json({
      success: true,
      message: 'Asset uploaded successfully!',
      assetId: result.lastInsertRowid,
      redirect: '/scrapyard'
    });
  } catch (err) {
    console.error('Error uploading asset:', err);
    res.status(500).json({
      error: 'System error',
      message: 'Terminal connection unstable. Try again later.'
    });
  }
});

// View single asset
router.get('/asset/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Get asset with user info
    const asset = db.prepare(`
      SELECT a.*, u.username, j.junker_name
      FROM scrapyard_assets a
      JOIN users u ON a.user_id = u.id
      JOIN junkers j ON a.user_id = j.user_id
      WHERE a.id = ?
    `).get(id);
    
    if (!asset) {
      return res.status(404).sendFile(path.join(__dirname, '../views/404.html'));
    }
    
    // Increment view count
    db.prepare(`
      UPDATE scrapyard_assets SET download_count = download_count + 1 WHERE id = ?
    `).run(id);
    
    // Get comments
    const comments = db.prepare(`
      SELECT c.*, u.username
      FROM asset_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.asset_id = ?
      ORDER BY c.created_at ASC
    `).all(id);
    
    // Check if user has favorited this asset
    let isFavorited = false;
    if (req.session.user) {
      const favorite = db.prepare(`
        SELECT id FROM asset_favorites
        WHERE user_id = ? AND asset_id = ?
      `).get(req.session.user.id, id);
      
      isFavorited = !!favorite;
    }
    
    // Pass data to the frontend
    const data = {
      asset,
      comments,
      isFavorited,
      user: req.session.user || null,
      isOwner: req.session.user && req.session.user.id === asset.user_id
    };
    
    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/forum/view-asset.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));
    
    res.send(html);
  } catch (err) {
    console.error('Error viewing asset:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Add comment to asset
router.post('/asset/:id/comment', isAuthenticated, (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    // Validate input
    if (!content) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Comment content is required.'
      });
    }
    
    // Check if asset exists
    const asset = db.prepare(`
      SELECT id FROM scrapyard_assets WHERE id = ?
    `).get(id);
    
    if (!asset) {
      return res.status(404).json({
        error: 'Asset not found',
        message: 'The requested asset does not exist.'
      });
    }
    
    // Insert comment
    const result = db.prepare(`
      INSERT INTO asset_comments (asset_id, user_id, content)
      VALUES (?, ?, ?)
    `).run(id, req.session.user.id, content);
    
    if (result.changes === 0) {
      throw new Error('Failed to add comment');
    }
    
    // Return success
    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      commentId: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({
      error: 'System error',
      message: 'Terminal connection unstable. Try again later.'
    });
  }
});

// Toggle favorite status
router.post('/asset/:id/favorite', isAuthenticated, (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if asset exists
    const asset = db.prepare(`
      SELECT id FROM scrapyard_assets WHERE id = ?
    `).get(id);
    
    if (!asset) {
      return res.status(404).json({
        error: 'Asset not found',
        message: 'The requested asset does not exist.'
      });
    }
    
    // Check if already favorited
    const favorite = db.prepare(`
      SELECT id FROM asset_favorites
      WHERE user_id = ? AND asset_id = ?
    `).get(req.session.user.id, id);
    
    let result;
    let action;
    
    if (favorite) {
      // Remove favorite
      result = db.prepare(`
        DELETE FROM asset_favorites
        WHERE id = ?
      `).run(favorite.id);
      action = 'removed';
    } else {
      // Add favorite
      result = db.prepare(`
        INSERT INTO asset_favorites (user_id, asset_id)
        VALUES (?, ?)
      `).run(req.session.user.id, id);
      action = 'added';
    }
    
    if (result.changes === 0) {
      throw new Error(`Failed to ${action} favorite`);
    }
    
    // Update likes count
    db.prepare(`
      UPDATE scrapyard_assets
      SET likes_count = (
        SELECT COUNT(*) FROM asset_favorites WHERE asset_id = ?
      )
      WHERE id = ?
    `).run(id, id);
    
    // Return success
    res.json({
      success: true,
      message: `Favorite ${action} successfully`,
      isFavorited: action === 'added'
    });
  } catch (err) {
    console.error('Error toggling favorite:', err);
    res.status(500).json({
      error: 'System error',
      message: 'Terminal connection unstable. Try again later.'
    });
  }
});

// Filter assets by category
router.get('/category/:category', (req, res) => {
  try {
    const { category } = req.params;
    
    // Get assets in category
    const assets = db.prepare(`
      SELECT a.*, u.username, 
        (SELECT COUNT(*) FROM asset_comments WHERE asset_id = a.id) as comment_count,
        (SELECT COUNT(*) FROM asset_favorites WHERE asset_id = a.id) as favorite_count
      FROM scrapyard_assets a
      JOIN users u ON a.user_id = u.id
      WHERE a.category = ?
      ORDER BY a.created_at DESC
    `).all(category);
    
    // Get category info
    const categoryInfo = db.prepare(`
      SELECT * FROM asset_categories WHERE name = ?
    `).get(category);
    
    if (!categoryInfo) {
      return res.status(404).sendFile(path.join(__dirname, '../views/404.html'));
    }
    
    // Get all categories
    const categories = getAssetCategories();
    
    // Check if user is a junker
    let junker = null;
    if (req.session.user) {
      junker = db.prepare(`
        SELECT * FROM junkers WHERE user_id = ?
      `).get(req.session.user.id);
    }
    
    // Pass data to the frontend
    const data = {
      assets,
      categoryInfo,
      categories,
      user: req.session.user || null,
      isJunker: !!junker
    };
    
    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/forum/scrapyard-category.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));
    
    res.send(html);
  } catch (err) {
    console.error('Error filtering assets by category:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

module.exports = router;