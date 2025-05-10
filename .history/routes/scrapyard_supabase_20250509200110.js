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
    // Start multiple queries in parallel for better performance

    // 1. Get all assets with user info
    const assetsPromise = supabase
      .from('scrapyard_assets')
      .select(`
        *,
        users:user_id (username)
      `)
      .order('created_at', { ascending: false });

    // 2. Get asset categories
    const categoriesPromise = getAssetCategories();

    // 3. Check if user is a junker (if logged in)
    let junkerPromise = null;
    if (req.session.user) {
      junkerPromise = supabase
        .from('junkers')
        .select('*')
        .eq('user_id', req.session.user.id)
        .maybeSingle();
    }

    // 4. Get junker count
    const junkerCountPromise = supabase
      .from('junkers')
      .select('*', { count: 'exact', head: true });

    // 5. Get asset count
    const assetCountPromise = supabase
      .from('scrapyard_assets')
      .select('*', { count: 'exact', head: true });

    // Wait for all initial queries to complete
    const [
      { data: assets, error: assetsError },
      categories,
      junkerResult,
      { count: junkerCount, error: junkerCountError },
      { count: assetCount, error: assetCountError }
    ] = await Promise.all([
      assetsPromise,
      categoriesPromise,
      junkerPromise || Promise.resolve({ data: null, error: null }),
      junkerCountPromise,
      assetCountPromise
    ]);

    // Check for errors
    if (assetsError) {
      throw assetsError;
    }
    if (junkerCountError) {
      throw junkerCountError;
    }
    if (assetCountError) {
      throw assetCountError;
    }

    // Extract junker data
    const junker = junkerResult?.data || null;

    // Optimize comment and favorite count queries by batching them
    // Instead of making 2 queries per asset, make 2 queries total with filters

    // Get all asset IDs
    const assetIds = assets.map(asset => asset.id);

    // Get comment counts for all assets in one query
    const { data: commentCounts, error: commentError } = await supabase
      .from('asset_comments')
      .select('asset_id, id')
      .in('asset_id', assetIds);

    // Get favorite counts for all assets in one query
    const { data: favoriteCounts, error: favoriteError } = await supabase
      .from('asset_favorites')
      .select('asset_id, id')
      .in('asset_id', assetIds);

    // Process the results to create a map of counts
    const commentCountMap = {};
    const favoriteCountMap = {};

    if (!commentError && commentCounts) {
      commentCounts.forEach(comment => {
        commentCountMap[comment.asset_id] = (commentCountMap[comment.asset_id] || 0) + 1;
      });
    }

    if (!favoriteError && favoriteCounts) {
      favoriteCounts.forEach(favorite => {
        favoriteCountMap[favorite.asset_id] = (favoriteCountMap[favorite.asset_id] || 0) + 1;
      });
    }

    // Enhance assets with comment and favorite counts
    const enhancedAssets = assets.map(asset => ({
      ...asset,
      username: asset.users.username,
      comment_count: commentCountMap[asset.id] || 0,
      favorite_count: favoriteCountMap[asset.id] || 0
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
    const { error } = await supabase
      .from('junkers')
      .insert({
        user_id: req.session.user.id,
        junker_name: junkerName,
        bio: bio || ''
      });

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

// Serve junker profile page
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    // Get junker profile
    const { data: junker, error: junkerError } = await supabase
      .from('junkers')
      .select(`
        *,
        users:user_id (username)
      `)
      .eq('user_id', req.session.user.id)
      .single();

    if (junkerError) {
      throw junkerError;
    }

    if (!junker) {
      // Not a junker, redirect to registration
      return res.redirect('/scrapyard/register');
    }

    // Get junker's assets
    const { data: assets, error: assetsError } = await supabase
      .from('scrapyard_assets')
      .select('*')
      .eq('user_id', req.session.user.id)
      .order('created_at', { ascending: false });

    if (assetsError) {
      throw assetsError;
    }

    // Enhance assets with comment and favorite counts
    const enhancedAssets = await Promise.all((assets || []).map(async (asset) => {
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
        comment_count: commentError ? 0 : commentCount,
        favorite_count: favoriteError ? 0 : favoriteCount
      };
    }));

    // Get asset categories
    const categories = await getAssetCategories();

    // Pass data to the frontend
    const data = {
      junker: {
        ...junker,
        username: junker.users.username
      },
      assets: enhancedAssets,
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
router.get('/upload', isJunker, async (req, res) => {
  try {
    // Get asset categories
    const categories = await getAssetCategories();

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
]), async (req, res) => {
  try {
    const { title, description, category, tags, asset_type, is_free } = req.body;

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
    const { data: newAsset, error } = await supabase
      .from('scrapyard_assets')
      .insert({
        user_id: req.session.user.id,
        title,
        description,
        file_path: assetPath,
        thumbnail_path: thumbnailPath,
        asset_type,
        category,
        tags: tags || '',
        is_free: is_free === 'true' ? 1 : 0
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Return success
    res.status(201).json({
      success: true,
      message: 'Asset uploaded successfully!',
      assetId: newAsset.id,
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
router.get('/asset/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get asset with user info
    const { data: asset, error: assetError } = await supabase
      .from('scrapyard_assets')
      .select(`
        *,
        users:user_id (username)
      `)
      .eq('id', id)
      .single();

    if (assetError || !asset) {
      return res.status(404).sendFile(path.join(__dirname, '../views/404.html'));
    }

    // Get junker info
    const { data: junker, error: junkerError } = await supabase
      .from('junkers')
      .select('junker_name')
      .eq('user_id', asset.user_id)
      .single();

    if (junkerError) {
      console.error('Error fetching junker info:', junkerError);
    }

    // Increment view count
    const { error: updateError } = await supabase
      .from('scrapyard_assets')
      .update({ download_count: asset.download_count + 1 })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating download count:', updateError);
    }

    // Get comments
    const { data: comments, error: commentsError } = await supabase
      .from('asset_comments')
      .select(`
        *,
        users:user_id (username)
      `)
      .eq('asset_id', id)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.error('Error fetching comments:', commentsError);
    }

    // Check if user has favorited this asset
    let isFavorited = false;
    if (req.session.user) {
      const { data: favorite, error: favoriteError } = await supabase
        .from('asset_favorites')
        .select('id')
        .eq('user_id', req.session.user.id)
        .eq('asset_id', id)
        .maybeSingle();

      if (!favoriteError) {
        isFavorited = !!favorite;
      }
    }

    // Prepare enhanced asset with junker name
    const enhancedAsset = {
      ...asset,
      username: asset.users.username,
      junker_name: junker ? junker.junker_name : asset.users.username
    };

    // Prepare enhanced comments with usernames
    const enhancedComments = (comments || []).map(comment => ({
      ...comment,
      username: comment.users.username
    }));

    // Pass data to the frontend
    const data = {
      asset: enhancedAsset,
      comments: enhancedComments,
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
router.post('/asset/:id/comment', isAuthenticated, async (req, res) => {
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
    const { data: asset, error: assetError } = await supabase
      .from('scrapyard_assets')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (assetError || !asset) {
      return res.status(404).json({
        error: 'Asset not found',
        message: 'The requested asset does not exist.'
      });
    }

    // Insert comment
    const { data: comment, error } = await supabase
      .from('asset_comments')
      .insert({
        asset_id: id,
        user_id: req.session.user.id,
        content
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Return success
    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      commentId: comment.id
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
router.post('/asset/:id/favorite', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if asset exists
    const { data: asset, error: assetError } = await supabase
      .from('scrapyard_assets')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (assetError || !asset) {
      return res.status(404).json({
        error: 'Asset not found',
        message: 'The requested asset does not exist.'
      });
    }

    // Check if already favorited
    const { data: favorite, error: favoriteError } = await supabase
      .from('asset_favorites')
      .select('id')
      .eq('user_id', req.session.user.id)
      .eq('asset_id', id)
      .maybeSingle();

    if (favoriteError) {
      throw favoriteError;
    }

    let action;

    if (favorite) {
      // Remove favorite
      const { error: deleteError } = await supabase
        .from('asset_favorites')
        .delete()
        .eq('id', favorite.id);

      if (deleteError) {
        throw deleteError;
      }

      action = 'removed';
    } else {
      // Add favorite
      const { error: insertError } = await supabase
        .from('asset_favorites')
        .insert({
          user_id: req.session.user.id,
          asset_id: id
        });

      if (insertError) {
        throw insertError;
      }

      action = 'added';
    }

    // Get updated favorite count
    const { count: favoriteCount, error: countError } = await supabase
      .from('asset_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('asset_id', id);

    if (countError) {
      throw countError;
    }

    // Update likes count
    const { error: updateError } = await supabase
      .from('scrapyard_assets')
      .update({ likes_count: favoriteCount || 0 })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

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
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;

    // Get category info
    const { data: categoryInfo, error: categoryError } = await supabase
      .from('asset_categories')
      .select('*')
      .eq('name', category)
      .maybeSingle();

    if (categoryError || !categoryInfo) {
      return res.status(404).sendFile(path.join(__dirname, '../views/404.html'));
    }

    // Get assets in category
    const { data: assets, error: assetsError } = await supabase
      .from('scrapyard_assets')
      .select(`
        *,
        users:user_id (username)
      `)
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (assetsError) {
      throw assetsError;
    }

    // Enhance assets with comment and favorite counts
    const enhancedAssets = await Promise.all((assets || []).map(async (asset) => {
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

    // Get all categories
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

    // Pass data to the frontend
    const data = {
      assets: enhancedAssets,
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