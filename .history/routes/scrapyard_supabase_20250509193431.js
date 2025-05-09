// Elriel - Scrapyard Marketplace Routes (Supabase Version)
// Handles junker registration, asset uploads, and asset interactions

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const supabase = require('../services/db');

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
const isJunker = async (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).redirect('/auth/login');
  }
  
  try {
    const { data: junker, error } = await supabase
      .from('junkers')
      .select('*')
      .eq('user_id', req.session.user.id)
      .maybeSingle();
    
    if (error) {
      throw error;
    }
    
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
const getAssetCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('asset_categories')
      .select('*')
      .order('name');
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (err) {
    console.error('Error fetching asset categories:', err);
    return [];
  }
};

// Serve scrapyard marketplace page
router.get('/', async (req, res) => {
  try {
    // Get all assets with user info
    const { data: assets, error: assetsError } = await supabase
      .from('scrapyard_assets')
      .select(`
        *,
        users:user_id (username)
      `)
      .order('created_at', { ascending: false });
    
    if (assetsError) {
      throw assetsError;
    }
    
    // Get asset categories
    const categories = await getAssetCategories();
    
    // Check if user is a junker
    let junker = null;
    if (req.session.user) {
      const { data, error } = await supabase
        .from('junkers')
        .select('*')
        .eq('user_id', req.session.user.id)
        .maybeSingle();
      
      if (!error) {
        junker = data;
      }
    }
    
    // Get junker count
    const { count: junkerCount, error: junkerCountError } = await supabase
      .from('junkers')
      .select('*', { count: 'exact', head: true });
    
    if (junkerCountError) {
      throw junkerCountError;
    }
    
    // Get asset count
    const { count: assetCount, error: assetCountError } = await supabase
      .from('scrapyard_assets')
      .select('*', { count: 'exact', head: true });
    
    if (assetCountError) {
      throw assetCountError;
    }
    
    // Enhance assets with comment and favorite counts
    const enhancedAssets = await Promise.all(assets.map(async (asset) => {
      // Get comment count
      const { count: commentCount, error: commentError } = await supabase
        .from('asset_comments')
        .select('*', { count: 'exact', head: true })
        .eq('asset_id', asset.id);
      
      // Get favorite count
      const { count: favoriteCount, error: favoriteError } = await supabase
        .from('asset_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('asset_id', asset.id);
      
      return {
        ...asset,
        username: asset.users.username,
        comment_count: commentError ? 0 : commentCount,
        favorite_count: favoriteError ? 0 : favoriteCount
      };
    }));
    
    // Pass data to the frontend
    const data = {
      assets: enhancedAssets,
      categories,
      junkerCount: junkerCount || 0,
      assetCount: assetCount || 0,
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
router.get('/register', isAuthenticated, async (req, res) => {
  try {
    // Check if user is already a junker
    const { data: junker, error } = await supabase
      .from('junkers')
      .select('*')
      .eq('user_id', req.session.user.id)
      .maybeSingle();
    
    if (error) {
      throw error;
    }
    
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
router.post('/register', isAuthenticated, async (req, res) => {
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
    const { data: existingJunker, error: checkError } = await supabase
      .from('junkers')
      .select('*')
      .eq('user_id', req.session.user.id)
      .maybeSingle();
    
    if (checkError) {
      throw checkError;
    }
    
    if (existingJunker) {
      return res.status(400).json({
        error: 'Already registered',
        message: 'You are already registered as a junker.'
      });
    }
    
    // Register as junker
    const { data, error } = await supabase
      .from('junkers')
      .insert({
        user_id: req.session.user.id,
        junker_name: junkerName,
        bio: bio || ''
      })
      .select()
      .single();
    
    if (error) {
      throw error;
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
