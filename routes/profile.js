// Elriel - Profile Routes (Supabase Version)
// Handles user profile viewing and editing

const escapeHTML = require('escape-html');
const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const supabase = require('../services/db');

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
router.get('/', isAuthenticated, async (req, res) => {
  try {
    // Get user profile with join
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*, users(username)')
      .eq('user_id', req.session.user.id)
      .single();

    if (error || !profile) {
      // Create default profile if it doesn't exist
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({ user_id: req.session.user.id, status: 'New terminal connected' })
        .select('*, users(username)')
        .eq('user_id', req.session.user.id)
        .single();

      if (insertError) {
        throw insertError;
      }

      // Use the newly created profile
      profile = newProfile;
    }

    // Get user's glyph if it exists
    let glyph = null;
    if (profile.glyph_id) {
      const { data, error: glyphError } = await supabase
        .from('glyphs')
        .select('*')
        .eq('id', profile.glyph_id)
        .single();
      if (!glyphError) {
        glyph = data;
      }
    }

    // Get user's posts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', req.session.user.id)
      .order('created_at', { ascending: false });

    if (postsError) {
      throw postsError;
    }

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
router.get('/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const useEnhanced = req.query.enhanced === '1' || req.query.enhanced === 'true';

    // Get user and profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*, users!inner(username, id)')
      .eq('users.username', username)
      .single();

    if (error || !profile) {
      return res.status(404).sendFile(path.join(__dirname, '../views/404.html'));
    }

    // Get user's glyph if it exists
    let glyph = null;
    if (profile.glyph_id) {
      const { data, error: glyphError } = await supabase
        .from('glyphs')
        .select('*')
        .eq('id', profile.glyph_id)
        .single();
      if (!glyphError) {
        glyph = data;
      }
    }

    // Get user's posts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', profile.users.id)
      .order('created_at', { ascending: false });

    if (postsError) {
      throw postsError;
    }

    // Get user's profile containers if enhanced view
    let containers = [];
    if (useEnhanced) {
      const { data, error: containersError } = await supabase
        .from('profile_containers')
        .select('*')
        .eq('profile_id', profile.id)
        .order('position', { ascending: true });
      if (!containersError) {
        containers = data;
      }
    }

    // Get user's rewards
    const { data: rewards, error: rewardsError } = await supabase
      .from('user_rewards')
      .select('*, repute_rewards(*)')
      .eq('user_id', profile.users.id);

    if (rewardsError) {
      throw rewardsError;
    }

    // Pass data to the frontend
    const data = {
      profile,
      glyph,
      posts,
      containers,
      rewards,
      user: req.session.user || null,
      isOwner: req.session.user && req.session.user.id === profile.users.id
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

// Activity log page
router.get('/activity', isAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = 10;
    const offset = (page - 1) * perPage;

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('user_activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.session.user.id);

    if (countError) {
      throw countError;
    }

    const totalPages = Math.ceil(totalCount / perPage);

    // Get activities for current page
    const { data: activities, error: activitiesError } = await supabase
      .from('user_activity_logs')
      .select('*')
      .eq('user_id', req.session.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + perPage - 1);

    if (activitiesError) {
      throw activitiesError;
    }

    // Pass data to the frontend
    const data = {
      activities,
      totalPages,
      currentPage: page,
      username: req.session.user.username,
      user: req.session.user
    };

    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/profile/activity.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));

    res.send(html);
  } catch (err) {
    console.error('Error loading activity log:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Container edit page - new container
router.get('/container/edit', isAuthenticated, async (req, res) => {
  try {
    // Pass data to the frontend for a new container
    const data = {
      container: null,
      user: req.session.user
    };

    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/profile/container-edit.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));

    res.send(html);
  } catch (err) {
    console.error('Error loading container editor:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Container edit page - edit existing container
router.get('/container/edit/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    let container = null;

    // Get user profile ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', req.session.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).sendFile(path.join(__dirname, '../views/404.html'));
    }

    // Get container and verify ownership
    const { data: containerData, error: containerError } = await supabase
      .from('profile_containers')
      .select('*')
      .eq('id', id)
      .eq('profile_id', profile.id)
      .single();

    if (containerError || !containerData) {
      return res.status(404).sendFile(path.join(__dirname, '../views/404.html'));
    }

    container = containerData;

    // Pass data to the frontend
    const data = {
      container,
      user: req.session.user
    };

    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/profile/container-edit.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));

    res.send(html);
  } catch (err) {
    console.error('Error loading container editor:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Serve profile edit page
router.get('/edit', isAuthenticated, async (req, res) => {
  try {
    console.log('Loading profile edit for user ID:', req.session.user.id);
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, users(username)')
      .eq('user_id', req.session.user.id)
      .single();

    console.log('Profile query result - data exists:', !!profile, 'error:', profileError ? profileError.message : 'None');

    if (profileError || !profile) {
      // Create default profile if it doesn't exist
      console.log('Creating default profile for user ID:', req.session.user.id);
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({ user_id: req.session.user.id, status: 'New terminal connected' })
        .select('*, users(username)')
        .eq('user_id', req.session.user.id)
        .single();

      if (insertError) {
        console.error('Default profile creation error:', insertError);
        throw insertError;
      }

      // Use the newly created profile
      profile = newProfile;
      console.log('Default profile created successfully');
    }

    // Get user's glyph if it exists
    let glyph = null;
    if (profile.glyph_id) {
      const { data, error: glyphError } = await supabase
        .from('glyphs')
        .select('*')
        .eq('id', profile.glyph_id)
        .single();
      if (!glyphError) {
        glyph = data;
      }
    }
    // Get all districts
    const { data: districts, error: districtsError } = await supabase
      .from('districts')
      .select('*')
      .or(`is_hidden.eq.false,id.eq.${profile.district_id}`);

    if (districtsError) {
      throw districtsError;
    }

    // Pass data to the frontend
    const data = {
      profile,
      glyph,
      districts,
      user: req.session.user
    };

    // Inject data into the HTML
    console.log('Reading edit.html template and injecting data');
    let html = fs.readFileSync(path.join(__dirname, '../views/profile/edit.html'), 'utf8');
    const jsonData = JSON.stringify(data);
    console.log('Data JSON length:', jsonData.length);
    html = html.replace('__DATA__', jsonData);

    res.send(html);
  } catch (err) {
    console.error('Error loading profile editor details:', {
      message: err.message,
      stack: err.stack,
      userId: req.session.user.id
    });
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Update profile
router.post('/update', isAuthenticated, upload.fields([
  { name: 'background', maxCount: 1 },
  { name: 'headerImage', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('Profile update started for user ID:', req.session.user.id);
    console.log('Request body keys:', Object.keys(req.body));
    const { status, customCss, customHtml, themeTemplate, blogLayout, districtId, widgets } = req.body;

    // Sanitize inputs (basic sanitization, would use a proper library in production)
    const sanitizedStatus = status ? escapeHTML(status.slice(0, 100)) : null;
    const sanitizedCss = customCss ? escapeHTML(customCss.slice(0, 10000)) : null;
    const sanitizedHtml = customHtml ? escapeHTML(customHtml.slice(0, 20000)) : null;

    // Build update object
    const updateData = {};
    if (sanitizedStatus !== null) updateData.status = sanitizedStatus;
    if (sanitizedCss !== null) updateData.custom_css = sanitizedCss;
    if (sanitizedHtml !== null) updateData.custom_html = sanitizedHtml;
    if (themeTemplate) updateData.theme_template = themeTemplate;
    if (blogLayout) updateData.blog_layout = blogLayout;
    if (districtId) updateData.district_id = districtId;

    // Log this activity
    const activityDescription = 'Updated profile settings';
    try {
      await supabase
        .from('user_activity_logs')
        .insert({
          user_id: req.session.user.id,
          activity_type: 'profile_updated',
          description: activityDescription
        });
    } catch (logErr) {
      console.error('Failed to log activity:', logErr);
    }

    // Handle background image upload
    if (req.files && req.files.background && req.files.background[0]) {
      updateData.background_image = '/uploads/backgrounds/' + req.files.background[0].filename;
    }
    
    // Handle header image upload
    if (req.files && req.files.headerImage && req.files.headerImage[0]) {
      updateData.header_image = '/uploads/backgrounds/' + req.files.headerImage[0].filename;
    }
    
    // Handle widgets
    if (widgets) {
      try {
        const parsedWidgets = JSON.parse(widgets);
        if (Array.isArray(parsedWidgets)) {
          updateData.widgets_data = widgets;
        }
      } catch (e) {
        console.error('Error parsing widgets data:', e);
      }
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    // Execute the update
    console.log('Attempting Supabase update with data:', updateData);
    const { data: result, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', req.session.user.id)
      .select()
      .single();
    console.log('Supabase update result:', result ? 'Success' : 'No result', 'Error:', error ? error.message : 'None');

    if (error || !result) {
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
    console.error('Profile update error details:', {
      message: err.message,
      stack: err.stack,
      userId: req.session.user.id,
      updateData: updateData
    });
    res.status(500).json({
      error: 'System error',
      message: 'Terminal connection unstable. Try again later.'
    });
  }
});

// Set profile glyph
router.post('/set-glyph/:glyphId', isAuthenticated, async (req, res) => {
  try {
    const { glyphId } = req.params;
    const { enable3d, rotationSpeed } = req.body;

    // Check if glyph exists and belongs to user
    const { data: glyph, error } = await supabase
      .from('glyphs')
      .select('*')
      .eq('id', glyphId)
      .eq('user_id', req.session.user.id)
      .single();

    if (error || !glyph) {
      return res.status(404).json({
        error: 'Glyph not found',
        message: 'The requested glyph does not exist or does not belong to you.'
      });
    }

    // Build update data
    const updateData = { glyph_id: glyphId };

    if (enable3d !== undefined) {
      updateData.glyph_3d = enable3d === true || enable3d === '1' ? true : false;
    }

    if (rotationSpeed !== undefined) {
      updateData.glyph_rotation_speed = parseInt(rotationSpeed) || 3;
    }

    // Update profile
    const { data: result, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', req.session.user.id)
      .select()
      .single();

    if (updateError || !result) {
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
router.post('/background', isAuthenticated, async (req, res) => {
  try {
    const { backgroundType, tileBackground } = req.body;

    // Build update data
    const updateData = {};
    if (backgroundType) updateData.profile_bg_type = backgroundType;
    if (tileBackground !== undefined) updateData.profile_bg_tile = tileBackground === true || tileBackground === '1' ? true : false;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'No background options provided.'
      });
    }

    // Execute the update
    const { data: result, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', req.session.user.id)
      .select()
      .single();

    if (error || !result) {
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
router.post('/container', isAuthenticated, async (req, res) => {
  try {
    const { containerType, title, content, settings, position } = req.body;

    if (!containerType) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Container type is required.'
      });
    }

    // Get user profile ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', req.session.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'User profile not found.'
      });
    }

    // Insert container
    const insertData = {
      profile_id: profile.id,
      container_type: containerType,
      title: title || null,
      content: content || null,
      position: position || 0,
      settings: settings || null
    };

    const { data: result, error: insertError } = await supabase
      .from('profile_containers')
      .insert(insertData)
      .select()
      .single();

    if (insertError || !result) {
      throw new Error('Failed to create container');
    }

    res.status(201).json({
      success: true,
      message: 'Container created successfully',
      containerId: result.id
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
router.put('/container/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { containerType, title, content, settings, position } = req.body;

    // Check if container exists and belongs to user
    const { data: container, error: containerError } = await supabase
      .from('profile_containers')
      .select('profile_containers(*), profiles(user_id)')
      .eq('profile_containers.id', id)
      .eq('profiles.user_id', req.session.user.id)
      .single();

    if (containerError || !container) {
      return res.status(404).json({
        error: 'Container not found',
        message: 'The requested container does not exist or does not belong to you.'
      });
    }

    // Build update data
    const updateData = {};
    if (containerType) updateData.container_type = containerType;
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (settings) updateData.settings = settings;
    if (position !== undefined) updateData.position = position;

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    // Execute the update
    const { data: result, error: updateError } = await supabase
      .from('profile_containers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !result) {
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
router.delete('/container/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if container exists and belongs to user
    const { data: container, error: containerError } = await supabase
      .from('profile_containers')
      .select('profile_containers(*), profiles(user_id)')
      .eq('profile_containers.id', id)
      .eq('profiles.user_id', req.session.user.id)
      .single();

    if (containerError || !container) {
      return res.status(404).json({
        error: 'Container not found',
        message: 'The requested container does not exist or does not belong to you.'
      });
    }

    // Delete container
    const { error: deleteError } = await supabase
      .from('profile_containers')
      .delete()
      .eq('id', id);

    if (deleteError) {
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
router.post('/reward/:id/toggle', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { equipped } = req.body;

    // Check if user has this reward
    const { data: userReward, error } = await supabase
      .from('user_rewards')
      .select('user_rewards(*), repute_rewards(id)')
      .eq('user_id', req.session.user.id)
      .eq('repute_rewards.id', id)
      .single();

    if (error || !userReward) {
      return res.status(404).json({
        error: 'Reward not found',
        message: 'You do not have this reward.'
      });
    }

    // Update equipped status
    const { error: updateError } = await supabase
      .from('user_rewards')
      .update({ is_equipped: equipped === true || equipped === '1' ? true : false })
      .eq('user_id', req.session.user.id)
      .eq('reward_id', id);

    if (updateError) {
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