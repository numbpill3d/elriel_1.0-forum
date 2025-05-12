// Elriel - Enhanced Scrapyard Marketplace Routes
// Handles junker registration, asset uploads, ratings, tags, and search

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const db = new Database('./db/elriel.db', { verbose: console.log });

// Import S3 configuration
const s3 = require('../config/s3');

// Configure multer for file uploads
// We'll still use disk storage for fallback when S3 isn't configured
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

// Get asset tags
const getAssetTags = () => {
  try {
    return db.prepare(`
      SELECT * FROM asset_tags ORDER BY name
    `).all();
  } catch (err) {
    console.error('Error fetching asset tags:', err);
    return [];
  }
};

// Parse tag string into an array
const parseTagsString = (tagsString) => {
  if (!tagsString) return [];
  return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
};

// Generate tag links from tag string
const getTagsFromString = (tagsString) => {
  const tagIds = parseTagsString(tagsString);
  
  if (tagIds.length === 0) return [];
  
  try {
    // Get tags by ID
    const placeholders = tagIds.map(() => '?').join(',');
    const tags = db.prepare(`
      SELECT * FROM asset_tags 
      WHERE id IN (${placeholders})
    `).all(tagIds);
    
    return tags;
  } catch (err) {
    console.error('Error fetching tags by IDs:', err);
    return [];
  }
};

// Build asset query with filters
const buildAssetQuery = (filters = {}) => {
  let query = `
    SELECT a.*, u.username, c.name as category_name, c.display_name as category_display_name,
      (SELECT COUNT(*) FROM asset_comments WHERE asset_id = a.id) as comment_count,
      (SELECT COUNT(*) FROM asset_favorites WHERE asset_id = a.id) as favorite_count
    FROM scrapyard_assets a
    JOIN users u ON a.user_id = u.id
    LEFT JOIN asset_categories c ON a.category_id = c.id
    WHERE 1=1
  `;
  
  const params = [];
  
  // Add category filter
  if (filters.category) {
    query += ` AND a.category_id = ?`;
    params.push(filters.category);
  }
  
  // Add search filter
  if (filters.search) {
    query += ` AND (a.title LIKE ? OR a.description LIKE ?)`;
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm);
  }
  
  // Add tag filter
  if (filters.tag) {
    query += ` AND a.tags LIKE ?`;
    params.push(`%${filters.tag}%`);
  }
  
  // Add sort option
  if (filters.sort === 'rating') {
    query += ` ORDER BY a.rating DESC, a.created_at DESC`;
  } else if (filters.sort === 'downloads') {
    query += ` ORDER BY a.download_count DESC, a.created_at DESC`;
  } else if (filters.sort === 'popular') {
    query += ` ORDER BY a.likes_count DESC, a.created_at DESC`;
  } else {
    query += ` ORDER BY a.created_at DESC`;
  }
  
  return { query, params };
};

// Serve scrapyard marketplace page with enhanced filters
router.get('/', (req, res) => {
  try {
    // Get filters from query params
    const filters = {
      category: req.query.category,
      search: req.query.search,
      tag: req.query.tag,
      sort: req.query.sort
    };
    
    // Build and execute query
    const { query, params } = buildAssetQuery(filters);
    const assets = db.prepare(query).all(...params);
    
    // Get asset categories
    const categories = getAssetCategories();
    
    // Get asset tags
    const tags = getAssetTags();
    
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
      tags,
      junkerCount,
      assetCount,
      user: req.session.user || null,
      isJunker: !!junker,
      filters
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
      SELECT a.*, c.name as category_name, c.display_name as category_display_name,
        (SELECT COUNT(*) FROM asset_comments WHERE asset_id = a.id) as comment_count,
        (SELECT COUNT(*) FROM asset_favorites WHERE asset_id = a.id) as favorite_count
      FROM scrapyard_assets a
      LEFT JOIN asset_categories c ON a.category_id = c.id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
    `).all(req.session.user.id);
    
    // Get asset categories
    const categories = getAssetCategories();
    
    // Get asset tags
    const tags = getAssetTags();
    
    // Pass data to the frontend
    const data = {
      junker,
      assets,
      categories,
      tags,
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
    
    // Get asset tags
    const tags = getAssetTags();
    
    // Check S3 configuration
    const s3Configured = s3.isConfigured();
    
    // Pass data to the frontend
    const data = {
      categories,
      tags,
      user: req.session.user,
      junker: req.junker,
      s3Configured
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

// Generate S3 presigned URL for asset upload
router.post('/get-upload-url', isJunker, (req, res) => {
  try {
    // Check if S3 is configured
    if (!s3.isConfigured()) {
      return res.status(400).json({
        error: 'S3 not configured',
        message: 'S3 storage is not configured. Please use the standard upload method.'
      });
    }
    
    const { filename, contentType, type } = req.body;
    
    if (!filename || !contentType) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Filename and content type are required.'
      });
    }
    
    // Generate presigned URL
    s3.getPresignedUploadUrl(filename, contentType, type || 'assets')
      .then(data => {
        res.json({
          success: true,
          ...data
        });
      })
      .catch(err => {
        console.error('Error generating presigned URL:', err);
        res.status(500).json({
          error: 'System error',
          message: 'Failed to generate upload URL.'
        });
      });
  } catch (err) {
    console.error('Error generating presigned URL:', err);
    res.status(500).json({
      error: 'System error',
      message: 'Terminal connection unstable. Try again later.'
    });
  }
});

// Process asset upload (S3 version)
router.post('/upload-s3', isJunker, (req, res) => {
  try {
    const { 
      title, description, category_id, tags, asset_type, is_free,
      assetKey, assetUrl, thumbnailKey, thumbnailUrl
    } = req.body;
    
    // Validate input
    if (!title || !description || !category_id || !asset_type || !assetKey || !assetUrl) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Required fields missing.'
      });
    }
    
    // Insert asset
    const result = db.prepare(`
      INSERT INTO scrapyard_assets (
        user_id, title, description, file_path, thumbnail_path,
        asset_type, category_id, tags, is_free
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.session.user.id,
      title,
      description,
      assetUrl,
      thumbnailUrl || null,
      asset_type,
      category_id,
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

// Process asset upload (local fallback)
router.post('/upload', isJunker, upload.fields([
  { name: 'asset', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), (req, res) => {
  try {
    const { title, description, category_id, tags, asset_type, is_free } = req.body;
    
    // Validate input
    if (!title || !description || !category_id || !asset_type) {
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
        asset_type, category_id, tags, is_free
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.session.user.id,
      title,
      description,
      assetPath,
      thumbnailPath,
      asset_type,
      category_id,
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
      SELECT a.*, u.username, j.junker_name, c.name as category_name, c.display_name as category_display_name
      FROM scrapyard_assets a
      JOIN users u ON a.user_id = u.id
      JOIN junkers j ON a.user_id = j.user_id
      LEFT JOIN asset_categories c ON a.category_id = c.id
      WHERE a.id = ?
    `).get(id);
    
    if (!asset) {
      return res.status(404).sendFile(path.join(__dirname, '../views/404.html'));
    }
    
    // Get asset tags
    const assetTags = getTagsFromString(asset.tags);
    
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
    
    // Check if user has favorited and rated this asset
    let isFavorited = false;
    let userRating = 0;
    
    if (req.session.user) {
      const favorite = db.prepare(`
        SELECT id FROM asset_favorites
        WHERE user_id = ? AND asset_id = ?
      `).get(req.session.user.id, id);
      
      isFavorited = !!favorite;
      
      const rating = db.prepare(`
        SELECT rating FROM asset_ratings
        WHERE user_id = ? AND asset_id = ?
      `).get(req.session.user.id, id);
      
      userRating = rating ? rating.rating : 0;
    }
    
    // Pass data to the frontend
    const data = {
      asset,
      assetTags,
      comments,
      isFavorited,
      userRating,
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

// Rate an asset
router.post('/asset/:id/rate', isAuthenticated, (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    
    // Validate input
    const ratingValue = parseInt(rating, 10);
    if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Rating must be a number between 1 and 5.'
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
    
    // Begin transaction
    db.exec('BEGIN TRANSACTION');
    
    try {
      // Check if user has already rated this asset
      const existingRating = db.prepare(`
        SELECT id, rating FROM asset_ratings
        WHERE user_id = ? AND asset_id = ?
      `).get(req.session.user.id, id);
      
      let result;
      
      if (existingRating) {
        // Update existing rating
        result = db.prepare(`
          UPDATE asset_ratings
          SET rating = ?
          WHERE id = ?
        `).run(ratingValue, existingRating.id);
      } else {
        // Add new rating
        result = db.prepare(`
          INSERT INTO asset_ratings (asset_id, user_id, rating)
          VALUES (?, ?, ?)
        `).run(id, req.session.user.id, ratingValue);
      }
      
      if (result.changes === 0) {
        throw new Error('Failed to rate asset');
      }
      
      // Calculate new average rating
      const ratingStats = db.prepare(`
        SELECT COUNT(*) as count, AVG(rating) as average
        FROM asset_ratings
        WHERE asset_id = ?
      `).get(id);
      
      // Update asset rating
      db.prepare(`
        UPDATE scrapyard_assets
        SET rating = ?, rating_count = ?
        WHERE id = ?
      `).run(
        ratingStats.average || 0,
        ratingStats.count || 0,
        id
      );
      
      // Commit transaction
      db.exec('COMMIT');
      
      // Return success
      res.json({
        success: true,
        message: 'Rating submitted successfully',
        newRating: ratingStats.average || 0,
        ratingCount: ratingStats.count || 0
      });
    } catch (err) {
      // Rollback transaction
      db.exec('ROLLBACK');
      throw err;
    }
  } catch (err) {
    console.error('Error rating asset:', err);
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
router.get('/category/:categoryId', (req, res) => {
  try {
    const { categoryId } = req.params;
    
    // Get category info
    const categoryInfo = db.prepare(`
      SELECT * FROM asset_categories WHERE id = ?
    `).get(categoryId);
    
    if (!categoryInfo) {
      return res.status(404).sendFile(path.join(__dirname, '../views/404.html'));
    }
    
    // Build filters object
    const filters = {
      category: categoryId,
      sort: req.query.sort
    };
    
    // Build and execute query
    const { query, params } = buildAssetQuery(filters);
    const assets = db.prepare(query).all(...params);
    
    // Get all categories
    const categories = getAssetCategories();
    
    // Get all tags
    const tags = getAssetTags();
    
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
      tags,
      user: req.session.user || null,
      isJunker: !!junker,
      filters
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

// Filter assets by tag
router.get('/tag/:tagId', (req, res) => {
  try {
    const { tagId } = req.params;
    
    // Get tag info
    const tagInfo = db.prepare(`
      SELECT * FROM asset_tags WHERE id = ?
    `).get(tagId);
    
    if (!tagInfo) {
      return res.status(404).sendFile(path.join(__dirname, '../views/404.html'));
    }
    
    // Build filters object
    const filters = {
      tag: tagId,
      sort: req.query.sort
    };
    
    // Build and execute query
    const { query, params } = buildAssetQuery(filters);
    const assets = db.prepare(query).all(...params);
    
    // Get all categories
    const categories = getAssetCategories();
    
    // Get all tags
    const tags = getAssetTags();
    
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
      tagInfo,
      categories,
      tags,
      user: req.session.user || null,
      isJunker: !!junker,
      filters
    };
    
    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/forum/scrapyard-tag.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));
    
    res.send(html);
  } catch (err) {
    console.error('Error filtering assets by tag:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Get tags list (API endpoint for autocomplete)
router.get('/api/tags', (req, res) => {
  try {
    const search = req.query.search || '';
    let tags;
    
    if (search) {
      tags = db.prepare(`
        SELECT * FROM asset_tags 
        WHERE name LIKE ? 
        ORDER BY name LIMIT 20
      `).all(`%${search}%`);
    } else {
      tags = db.prepare(`
        SELECT * FROM asset_tags 
        ORDER BY name LIMIT 20
      `).all();
    }
    
    res.json({
      success: true,
      tags
    });
  } catch (err) {
    console.error('Error fetching tags:', err);
    res.status(500).json({
      error: 'System error',
      message: 'Failed to fetch tags'
    });
  }
});

// Add a new tag (API endpoint)
router.post('/api/tags', isAuthenticated, (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Tag name must be at least 2 characters long'
      });
    }
    
    // Check if tag already exists
    const existingTag = db.prepare(`
      SELECT id FROM asset_tags WHERE name = ?
    `).get(name.trim().toLowerCase());
    
    if (existingTag) {
      return res.json({
        success: true,
        tag: existingTag,
        message: 'Tag already exists'
      });
    }
    
    // Insert new tag
    const result = db.prepare(`
      INSERT INTO asset_tags (name)
      VALUES (?)
    `).run(name.trim().toLowerCase());
    
    if (result.changes === 0) {
      throw new Error('Failed to create tag');
    }
    
    const newTag = db.prepare(`
      SELECT * FROM asset_tags WHERE id = ?
    `).get(result.lastInsertRowid);
    
    res.status(201).json({
      success: true,
      tag: newTag,
      message: 'Tag created successfully'
    });
  } catch (err) {
    console.error('Error creating tag:', err);
    res.status(500).json({
      error: 'System error',
      message: 'Failed to create tag'
    });
  }
});

module.exports = router;