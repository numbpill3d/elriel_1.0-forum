// Elriel - A haunted terminal-based social network
// Render deployment version - completely removes SQLite dependency

// ==== RENDER SQLITE PREVENTION SYSTEM ====
// Overwrite the require function to prevent any SQLite module from loading
const originalRequire = module.require;
module.require = function(id) {
  if (id === 'better-sqlite3' || id === 'sqlite3' || id.includes('sqlite')) {
    console.error(`❌ BLOCKED IMPORT: Attempted to require SQLite module: ${id}`);
    console.error('This is prevented in the Render deployment version.');
    // Return a mock object instead of actually loading SQLite
    return {
      verbose: () => ({}),
      Database: function() {
        return {
          prepare: () => ({
            get: () => ({}),
            all: () => ([]),
            run: () => ({})
          }),
          close: () => {}
        };
      }
    };
  }
  return originalRequire.apply(this, arguments);
};

// Also patch the global require function
const originalGlobalRequire = require;
global.require = function(id) {
  if (id === 'better-sqlite3' || id === 'sqlite3' || id.includes('sqlite')) {
    console.error(`❌ BLOCKED IMPORT: Attempted to require SQLite module: ${id}`);
    console.error('This is prevented in the Render deployment version.');
    // Return a mock object instead of actually loading SQLite
    return {
      verbose: () => ({}),
      Database: function() {
        return {
          prepare: () => ({
            get: () => ({}),
            all: () => ([]),
            run: () => ({})
          }),
          close: () => {}
        };
      }
    };
  }
  return originalGlobalRequire.apply(this, arguments);
};

console.log('✅ Render SQLite Prevention System active - all SQLite imports will be mocked');

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');

// IMPORTANT: This version is specifically for Render.com deployment
// It does NOT use any SQLite dependencies and should not import any modules that use SQLite

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Add a Render health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Configure Express for production behind proxy
app.set('trust proxy', 1);

// Configure middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configure static file serving with multiple paths for better compatibility
const publicPath = path.join(__dirname, 'public');
console.log('Serving static files from primary path:', publicPath);
app.use(express.static(publicPath));

// Also serve files directly from the root for compatibility with some paths
app.use('/public', express.static(publicPath));

// Add logging and cache control for static assets
app.use((req, res, next) => {
  // Log static asset requests
  if (req.url.startsWith('/css/') || req.url.startsWith('/js/') || req.url.match(/\.(css|js|png|jpg|ico)$/)) {
    console.log(`[STATIC ASSET] ${req.method} ${req.url} from ${publicPath}`);
  }
  // If the request is for a static asset
  if (req.url.match(/\.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    // Set cache headers
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
    res.setHeader('Expires', new Date(Date.now() + 86400000).toUTCString());
  }
  next();
});

// Configure session
app.use(session({
  secret: process.env.SESSION_SECRET || 'elriel_default_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Only secure in production
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  }
}));

// Configure file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Route to appropriate directory based on field name
    if (file.fieldname === 'background' || file.fieldname === 'headerImage') {
      cb(null, './public/uploads/backgrounds/');
    } else if (file.fieldname === 'asset') {
      cb(null, './public/uploads/assets/');
    } else {
      cb(null, './public/uploads/');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const prefix = file.fieldname === 'background' ? 'bg-' : 
                   file.fieldname === 'headerImage' ? 'header-' :
                   file.fieldname === 'asset' ? 'asset-' : '';
    cb(null, prefix + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage,
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // For profile images, accept only images
    if (file.fieldname === 'background' || file.fieldname === 'headerImage') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for backgrounds'), false);
      }
    } 
    // For assets, accept more file types
    else if (file.fieldname === 'asset') {
      const allowedTypes = [
        'image/', 'text/', 'application/json', 'application/pdf',
        'application/zip', 'application/x-zip-compressed',
        'application/javascript', 'application/xml'
      ];
      
      const isAllowed = allowedTypes.some(type => file.mimetype.startsWith(type));
      if (isAllowed) {
        cb(null, true);
      } else {
        cb(new Error('File type not allowed for assets'), false);
      }
    }
    else {
      cb(null, true);
    }
  }
});

// Create uploads directories if they don't exist
const fs = require('fs');
const uploadDirs = [
  './public/uploads',
  './public/uploads/backgrounds',
  './public/uploads/assets',
  './public/uploads/assets/thumbnails'
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created upload directory: ${dir}`);
  }
});

// Render health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// IMPORTANT: We do NOT import any routes files from the /routes directory here
// because those files might require better-sqlite3 directly or indirectly

// Instead, we define all routes directly in this file
// This ensures no SQLite dependencies are loaded
const staticRouter = express.Router();

// Basic home page
staticRouter.get('/', (req, res) => {
  // Create mock data for the index page
  const data = {
    announcement: {
      title: "Welcome to Elriel Network",
      content: "This is a static demo version. Some features may be limited.",
      created_at: new Date().toISOString()
    },
    recentActivity: [],
    user: req.session.user || null
  };

  // Inject data into the HTML
  let html = fs.readFileSync(path.join(__dirname, 'views', 'index.html'), 'utf8');
  html = html.replace('__DATA__', JSON.stringify(data));

  res.send(html);
});

// Serve static views for demo
// Feed routes - Updated to use session-based data
staticRouter.get('/feed/bleedstream', (req, res) => {
  try {
    const { tag } = req.query;
    const appData = initializeSessionData(req);

    // Filter posts based on tag if provided
    let posts = [...appData.posts];
    if (tag) {
      posts = posts.filter(post => post.tags && post.tags.includes(tag));
    }

    // Add some default posts if none exist
    if (posts.length === 0 && !tag) {
      const defaultPosts = [
        {
          id: 'default-1',
          title: "Welcome to the Bleedstream",
          content: "This is your personal feed. Create posts to see them here.",
          username: "system_admin",
          user_id: 'system',
          created_at: new Date().toISOString(),
          is_encrypted: 0,
          tags: null,
          glyph_id: null
        },
        {
          id: 'default-2',
          title: "Exploring the Digital Wasteland",
          content: "The network expands. The signal grows stronger. Start posting to build your presence.",
          username: "terminal_ghost",
          user_id: 'system',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          is_encrypted: 0,
          tags: 'exploration,network',
          glyph_id: null
        }
      ];
      posts = defaultPosts;
    }

    // Get all unique tags for filter dropdown
    const allTags = new Set();
    [...appData.posts].forEach(post => {
      if (post.tags) {
        post.tags.split(',').forEach(t => allTags.add(t.trim()));
      }
    });

    const feedData = {
      user: req.session.user || null,
      posts: posts.slice(0, 50), // Limit to 50 posts
      tags: Array.from(allTags),
      currentTag: tag || null
    };

    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, 'views', 'feed', 'bleedstream.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(feedData));

    res.send(html);
  } catch (err) {
    console.error('Error loading Bleedstream:', err);
    res.status(500).sendFile(path.join(__dirname, 'views', 'error.html'));
  }
});

// Redirect for compatibility with old links
staticRouter.get('/bleedstream', (req, res) => {
  res.redirect('/feed/bleedstream');
});

// Glyph routes
staticRouter.get('/glyph/crucible', (req, res) => {
  // Create mock glyph data
  const glyphData = {
    user: req.session.user || null,
    glyphs: [
      {
        id: 1,
        name: "Void Sigil",
        creator: "system_admin",
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        name: "Digital Rune",
        creator: "terminal_ghost",
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ]
  };

  // Inject data into the HTML
  let html = fs.readFileSync(path.join(__dirname, 'views', 'glyph', 'crucible.html'), 'utf8');
  html = html.replace('__DATA__', JSON.stringify(glyphData));

  res.send(html);
});

// Redirect for compatibility with old links
staticRouter.get('/glyph-crucible', (req, res) => {
  res.redirect('/glyph/crucible');
});

// Whisper routes
staticRouter.get('/whisper/board', (req, res) => {
  try {
    const appData = initializeSessionData(req);
    
    // Initialize whispers if they don't exist
    if (!appData.whispers) {
      appData.whispers = [];
    }

    // Add default whispers if none exist
    let whispers = [...appData.whispers];
    if (whispers.length === 0) {
      const defaultWhispers = [
        {
          id: 'whisper-1',
          content: "The void listens. The network expands.",
          user_id: 'system',
          username: 'void_speaker',
          created_at: new Date().toISOString()
        },
        {
          id: 'whisper-2',
          content: "Signals in the noise. Patterns in the static.",
          user_id: 'system',
          username: 'signal_hunter',
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      whispers = defaultWhispers;
    }

    const whisperData = {
      user: req.session.user || null,
      whispers: whispers.slice(0, 50) // Limit to 50 whispers
    };

    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, 'views', 'whisper', 'board.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(whisperData));

    res.send(html);
  } catch (err) {
    console.error('Error loading whisper board:', err);
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.status(500).sendFile(path.join(__dirname, 'views', 'error.html'));
  }
});

// Create whisper
staticRouter.post('/whisper/create', (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to create whispers.'
      });
    }

    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Content is required.'
      });
    }

    const appData = initializeSessionData(req);
    if (!appData.whispers) {
      appData.whispers = [];
    }

    const newWhisper = {
      id: `whisper-${Date.now()}`,
      content: content.slice(0, 500),
      user_id: req.session.user.id,
      username: req.session.user.username,
      created_at: new Date().toISOString()
    };

    appData.whispers.unshift(newWhisper);

    res.status(201).json({
      success: true,
      message: 'Whisper sent into the void',
      whisperId: newWhisper.id
    });
  } catch (err) {
    console.error('Whisper creation error:', err);
    res.status(500).json({
      error: 'System error',
      message: 'Terminal connection unstable. Try again later.'
    });
  }
});

// Get whisper creation page
staticRouter.get('/whisper/new', (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }

    const data = {
      user: req.session.user
    };

    let html = fs.readFileSync(path.join(__dirname, 'views', 'whisper', 'new.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));

    res.send(html);
  } catch (err) {
    console.error('Error loading whisper creation page:', err);
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.status(500).sendFile(path.join(__dirname, 'views', 'error.html'));
  }
});

// Redirect for compatibility with old links
staticRouter.get('/whisperboard', (req, res) => {
  res.redirect('/whisper/board');
});

// Terminal/secrets routes
staticRouter.get('/terminal/numbpill', (req, res) => {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(path.join(__dirname, 'views', 'secrets', 'numbpill.html'));
});

// Redirect for compatibility with old links
staticRouter.get('/numbpill', (req, res) => {
  res.redirect('/terminal/numbpill');
});

staticRouter.get('/terminal/void', (req, res) => {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(path.join(__dirname, 'views', 'secrets', 'void.html'));
});


// Profile routes
staticRouter.get('/profile', (req, res) => {
  if (req.session.user) {
    const appData = initializeSessionData(req);
    
    // Get or create profile for this user
    let profile = appData.profiles.get(req.session.user.id) || {
      user_id: req.session.user.id,
      status: 'New terminal connected',
      custom_css: '',
      custom_html: '',
      theme_template: 'default',
      blog_layout: 'feed',
      district_id: 1,
      background_image: null,
      header_image: null,
      widgets_data: null,
      glyph_id: null,
      glyph_3d: 0,
      glyph_rotation_speed: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Get user's glyph if set
    let glyph = null;
    if (profile.glyph_id) {
      glyph = appData.glyphs.find(g => g.id == profile.glyph_id);
    }

    // Get user's posts
    const posts = appData.posts.filter(p => p.user_id === req.session.user.id);

    const profileData = {
      user: req.session.user,
      profile: profile,
      glyph: glyph,
      posts: posts
    };

    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, 'views', 'profile', 'view.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(profileData));

    res.send(html);
  } else {
    res.redirect('/auth/login');
  }
});

// Auth routes
staticRouter.get('/auth/login', (req, res) => {
  const filePath = path.join(__dirname, 'views', 'auth', 'login.html');
  console.log(`[LOGIN ROUTE] Requested login page. Path: ${filePath}`);
  console.log(`[LOGIN ROUTE] File exists: ${fs.existsSync(filePath)}`);
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error(`[LOGIN ROUTE] Error serving file: ${err}`);
      res.status(err.status || 500).send('Failed to load login page');
    } else {
      console.log(`[LOGIN ROUTE] Login page sent successfully. Status: ${res.statusCode}`);
      console.log(`[LOGIN ROUTE] Content-Type: ${res.get('Content-Type')}`);
    }
  });
});

staticRouter.get('/auth/register', (req, res) => {
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(path.join(__dirname, 'views', 'auth', 'register.html'));
});

// Handle login (mock version for demo)
staticRouter.post('/auth/login', (req, res) => {
  const { username, password } = req.body;

  // For demo purposes, accept any login
  // In a real app, you would validate against a database
  req.session.user = {
    id: 1,
    username: username,
    isAdmin: false
  };

  res.json({
    success: true,
    message: 'Terminal access granted',
    user: req.session.user
  });
});

// Handle registration (mock version for demo)
staticRouter.post('/auth/register', (req, res) => {
  const { username, email, password } = req.body;

  // For demo purposes, accept any registration
  // In a real app, you would store in a database
  req.session.user = {
    id: Math.floor(Math.random() * 1000) + 1,
    username: username,
    isAdmin: false
  };

  res.status(201).json({
    success: true,
    message: 'Terminal identity registered successfully',
    user: req.session.user
  });
});

// Handle logout
staticRouter.get('/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({
        error: 'System error',
        message: 'Terminal disconnection failed. Try again.'
      });
    }

    res.redirect('/');
  });
});

// Redirect for compatibility with old links
staticRouter.get('/login', (req, res) => {
  res.redirect('/auth/login');
});

staticRouter.get('/register', (req, res) => {
  res.redirect('/auth/register');
});

// Additional redirects for common path issues
staticRouter.get('/bleedstream.html', (req, res) => {
  res.redirect('/feed/bleedstream');
});

staticRouter.get('/glyph-crucible.html', (req, res) => {
  res.redirect('/glyph/crucible');
});

staticRouter.get('/whisperboard.html', (req, res) => {
  res.redirect('/whisper/board');
});

staticRouter.get('/numbpill.html', (req, res) => {
  res.redirect('/terminal/numbpill');
});

staticRouter.get('/void', (req, res) => {
  res.redirect('/terminal/void');
});

staticRouter.get('/secrets/numbpill', (req, res) => {
  res.redirect('/terminal/numbpill');
});

staticRouter.get('/secrets/void', (req, res) => {
  res.redirect('/terminal/void');
});

// Forum routes
staticRouter.get('/forum', (req, res) => {
  res.redirect('/forum/scrapyard');
});

staticRouter.get('/forum/scrapyard', (req, res) => {
  // Create mock forum data
  const forumData = {
    items: [
      {
        id: 1,
        title: "Welcome to the Scrapyard",
        content: "This is a demo post in the static version.",
        username: "system_admin",
        created_at: new Date().toISOString(),
        comment_count: 2
      },
      {
        id: 2,
        title: "Digital Artifacts Collection",
        content: "Share your findings from the digital wasteland.",
        username: "terminal_ghost",
        created_at: new Date(Date.now() - 86400000).toISOString(),
        comment_count: 0
      }
    ],
    user: req.session.user || null
  };

  // Inject data into the HTML
  let html = fs.readFileSync(path.join(__dirname, 'views', 'forum', 'scrapyard.html'), 'utf8');
  html = html.replace('__DATA__', JSON.stringify(forumData));

  res.send(html);
});

// Forum topic view
staticRouter.get('/forum/topic/:id', (req, res) => {
  const id = req.params.id;

  // Create mock topic data
  const topicData = {
    topic: {
      id: id,
      title: id === "1" ? "Welcome to the Scrapyard" : "Digital Artifacts Collection",
      content: "This is a demo topic in the static version.",
      username: "system_admin",
      created_at: new Date().toISOString(),
      forum_title: "Scrapyard",
      forum_slug: "scrapyard"
    },
    comments: [
      {
        id: 1,
        content: "First comment on this topic.",
        username: "terminal_ghost",
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ],
    user: req.session.user || null
  };

  // Inject data into the HTML
  let html = fs.readFileSync(path.join(__dirname, 'views', 'forum', 'topic.html'), 'utf8');
  html = html.replace('__DATA__', JSON.stringify(topicData));

  res.send(html);
});

// Session-based data storage for the static version
// This creates persistent data that survives across requests within the same session
const initializeSessionData = (req) => {
  if (!req.session.appData) {
    req.session.appData = {
      profiles: new Map(),
      posts: [],
      glyphs: [],
      districts: [
        { id: 1, name: 'Central Terminal', is_hidden: 0 },
        { id: 2, name: 'Digital Wasteland', is_hidden: 0 },
        { id: 3, name: 'Void District', is_hidden: 0 },
        { id: 4, name: 'Neon Sector', is_hidden: 0 }
      ],
      nextPostId: 1,
      nextGlyphId: 1
    };
  }
  return req.session.appData;
};

// Profile update route
staticRouter.post('/profile/update', upload.fields([
  { name: 'background', maxCount: 1 },
  { name: 'headerImage', maxCount: 1 }
]), (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to update your profile.'
      });
    }

    const appData = initializeSessionData(req);
    const { status, customCss, customHtml, themeTemplate, blogLayout, districtId, widgets } = req.body;

    // Get or create profile for this user
    let profile = appData.profiles.get(req.session.user.id) || {
      user_id: req.session.user.id,
      status: 'New terminal connected',
      custom_css: '',
      custom_html: '',
      theme_template: 'default',
      blog_layout: 'feed',
      district_id: 1,
      background_image: null,
      header_image: null,
      widgets_data: null,
      glyph_id: null,
      glyph_3d: 0,
      glyph_rotation_speed: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Update profile fields
    if (status !== undefined) profile.status = status.slice(0, 100);
    if (customCss !== undefined) profile.custom_css = customCss.slice(0, 10000);
    if (customHtml !== undefined) profile.custom_html = customHtml.slice(0, 20000);
    if (themeTemplate) profile.theme_template = themeTemplate;
    if (blogLayout) profile.blog_layout = blogLayout;
    if (districtId) profile.district_id = parseInt(districtId);

    // Handle file uploads
    if (req.files) {
      if (req.files.background && req.files.background[0]) {
        profile.background_image = '/uploads/backgrounds/' + req.files.background[0].filename;
      }
      if (req.files.headerImage && req.files.headerImage[0]) {
        profile.header_image = '/uploads/backgrounds/' + req.files.headerImage[0].filename;
      }
    }

    // Handle widgets
    if (widgets) {
      try {
        const parsedWidgets = JSON.parse(widgets);
        if (Array.isArray(parsedWidgets)) {
          profile.widgets_data = widgets;
        }
      } catch (e) {
        console.error('Error parsing widgets data:', e);
      }
    }

    profile.updated_at = new Date().toISOString();

    // Save profile back to session
    appData.profiles.set(req.session.user.id, profile);

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

// Profile edit page with proper data injection
staticRouter.get('/profile/edit', (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }

    const appData = initializeSessionData(req);
    let profile = appData.profiles.get(req.session.user.id) || {
      user_id: req.session.user.id,
      status: 'New terminal connected',
      custom_css: '',
      custom_html: '',
      theme_template: 'default',
      blog_layout: 'feed',
      district_id: 1,
      background_image: null,
      header_image: null,
      widgets_data: null,
      glyph_id: null,
      glyph_3d: 0,
      glyph_rotation_speed: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Get user's glyphs (mock data for now)
    const userGlyphs = appData.glyphs.filter(g => g.user_id === req.session.user.id);

    const data = {
      profile,
      glyph: profile.glyph_id ? userGlyphs.find(g => g.id === profile.glyph_id) : null,
      userGlyphs,
      districts: appData.districts,
      user: req.session.user
    };

    let html = fs.readFileSync(path.join(__dirname, 'views', 'profile', 'edit.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));

    res.send(html);
  } catch (err) {
    console.error('Error loading profile editor:', err);
    res.status(500).sendFile(path.join(__dirname, 'views', 'error.html'));
  }
});

// Feed post creation
staticRouter.get('/feed/new', (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }

    const appData = initializeSessionData(req);
    const userGlyphs = appData.glyphs.filter(g => g.user_id === req.session.user.id);

    const data = {
      glyphs: userGlyphs,
      user: req.session.user
    };

    let html = fs.readFileSync(path.join(__dirname, 'views', 'feed', 'new-post.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));

    res.send(html);
  } catch (err) {
    console.error('Error loading new post page:', err);
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.status(500).sendFile(path.join(__dirname, 'views', 'error.html'));
  }
});

// Create new post
staticRouter.post('/feed/create', (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to create posts.'
      });
    }

    const { title, content, tags, glyphId, isEncrypted } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Title and content are required.'
      });
    }

    const appData = initializeSessionData(req);

    // Generate encryption key if post is encrypted
    let encryptionKey = null;
    if (isEncrypted === '1' || isEncrypted === true) {
      encryptionKey = require('crypto').randomBytes(16).toString('hex');
    }

    // Create new post
    const newPost = {
      id: appData.nextPostId++,
      user_id: req.session.user.id,
      username: req.session.user.username,
      title,
      content,
      tags: tags || null,
      is_encrypted: isEncrypted === '1' || isEncrypted === true ? 1 : 0,
      encryption_key: encryptionKey,
      glyph_id: glyphId || null,
      created_at: new Date().toISOString()
    };

    appData.posts.unshift(newPost); // Add to beginning for latest first

    const response = {
      success: true,
      message: 'Post successfully transmitted to the Bleedstream',
      postId: newPost.id
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

// View specific post
staticRouter.get('/feed/post/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { key } = req.query;
    const appData = initializeSessionData(req);

    const post = appData.posts.find(p => p.id == id);

    if (!post) {
      return res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
    }

    // Check if post is encrypted and key is provided
    if (post.is_encrypted === 1 && post.encryption_key !== key) {
      let html = fs.readFileSync(path.join(__dirname, 'views', 'feed', 'encrypted-post.html'), 'utf8');
      html = html.replace('__POST_ID__', id);
      return res.send(html);
    }

    // Get user profile
    const profile = appData.profiles.get(post.user_id) || {
      user_id: post.user_id,
      status: 'Terminal connected',
      district_name: 'Unknown District'
    };

    const data = {
      post,
      profile,
      user: req.session.user || null,
      isOwner: req.session.user && req.session.user.id === post.user_id
    };

    let html = fs.readFileSync(path.join(__dirname, 'views', 'feed', 'view-post.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));

    res.send(html);
  } catch (err) {
    console.error('Error viewing post:', err);
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.status(500).sendFile(path.join(__dirname, 'views', 'error.html'));
  }
});

// Delete post
staticRouter.delete('/feed/post/:id', (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to delete posts.'
      });
    }

    const { id } = req.params;
    const appData = initializeSessionData(req);

    const postIndex = appData.posts.findIndex(p => p.id == id && p.user_id === req.session.user.id);

    if (postIndex === -1) {
      return res.status(404).json({
        error: 'Post not found',
        message: 'The requested post does not exist or does not belong to you.'
      });
    }

    appData.posts.splice(postIndex, 1);

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
staticRouter.post('/feed/check-key/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { key } = req.body;

    if (!key) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Encryption key is required.'
      });
    }

    const appData = initializeSessionData(req);
    const post = appData.posts.find(p => p.id == id && p.is_encrypted === 1);

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

// Glyph/Crucible routes
staticRouter.get('/glyph/crucible', (req, res) => {
  try {
    const appData = initializeSessionData(req);
    const userGlyphs = req.session.user ? 
      appData.glyphs.filter(g => g.user_id === req.session.user.id) : [];

    // Add some default glyphs if none exist
    let allGlyphs = [...appData.glyphs];
    if (allGlyphs.length === 0) {
      const defaultGlyphs = [
        {
          id: 'default-glyph-1',
          name: "Void Sigil",
          creator: "system_admin",
          user_id: 'system',
          svg_data: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="#00ff00" stroke-width="2"/><path d="M30,30 L70,70 M70,30 L30,70" stroke="#00ff00" stroke-width="2"/></svg>',
          created_at: new Date().toISOString()
        },
        {
          id: 'default-glyph-2',
          name: "Digital Rune",
          creator: "terminal_ghost",
          user_id: 'system',
          svg_data: '<svg viewBox="0 0 100 100"><rect x="20" y="20" width="60" height="60" fill="none" stroke="#00ff00" stroke-width="2"/><path d="M35,35 L65,35 L50,65 Z" fill="#00ff00" opacity="0.3"/></svg>',
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      allGlyphs = defaultGlyphs;
    }

    const glyphData = {
      user: req.session.user || null,
      glyphs: allGlyphs.slice(0, 20), // Limit to 20 glyphs
      userGlyphs: userGlyphs
    };

    let html = fs.readFileSync(path.join(__dirname, 'views', 'glyph', 'crucible.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(glyphData));

    res.send(html);
  } catch (err) {
    console.error('Error loading Glyph Crucible:', err);
    res.status(500).sendFile(path.join(__dirname, 'views', 'error.html'));
  }
});

// Create glyph
staticRouter.post('/glyph/create', (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to create glyphs.'
      });
    }

    const { name, svgData } = req.body;

    if (!name || !svgData) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Name and SVG data are required.'
      });
    }

    const appData = initializeSessionData(req);

    const newGlyph = {
      id: appData.nextGlyphId++,
      name: name.slice(0, 50),
      creator: req.session.user.username,
      user_id: req.session.user.id,
      svg_data: svgData,
      created_at: new Date().toISOString()
    };

    appData.glyphs.unshift(newGlyph);

    res.status(201).json({
      success: true,
      message: 'Glyph successfully forged in the crucible',
      glyphId: newGlyph.id
    });
  } catch (err) {
    console.error('Glyph creation error:', err);
    res.status(500).json({
      error: 'System error',
      message: 'Terminal connection unstable. Try again later.'
    });
  }
});

// Set profile glyph
staticRouter.post('/profile/set-glyph/:glyphId', (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to set glyphs.'
      });
    }

    const { glyphId } = req.params;
    const { enable3d, rotationSpeed } = req.body;
    const appData = initializeSessionData(req);

    // Check if glyph exists and belongs to user
    const glyph = appData.glyphs.find(g => g.id == glyphId && g.user_id === req.session.user.id);

    if (!glyph) {
      return res.status(404).json({
        error: 'Glyph not found',
        message: 'The requested glyph does not exist or does not belong to you.'
      });
    }

    // Update profile
    let profile = appData.profiles.get(req.session.user.id) || {
      user_id: req.session.user.id,
      status: 'New terminal connected',
      custom_css: '',
      custom_html: '',
      theme_template: 'default',
      blog_layout: 'feed',
      district_id: 1,
      background_image: null,
      header_image: null,
      widgets_data: null,
      glyph_id: null,
      glyph_3d: 0,
      glyph_rotation_speed: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    profile.glyph_id = glyphId;
    if (enable3d !== undefined) {
      profile.glyph_3d = enable3d === true || enable3d === '1' ? 1 : 0;
    }
    if (rotationSpeed !== undefined) {
      profile.glyph_rotation_speed = parseInt(rotationSpeed) || 3;
    }
    profile.updated_at = new Date().toISOString();

    appData.profiles.set(req.session.user.id, profile);

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

// Forum routes
staticRouter.get('/forum/scrapyard', (req, res) => {
  try {
    const appData = initializeSessionData(req);
    
    // Initialize scrapyard assets if they don't exist
    if (!appData.scrapyardAssets) {
      appData.scrapyardAssets = [];
    }

    // Add default scrapyard assets if none exist
    let assets = [...appData.scrapyardAssets];
    if (assets.length === 0) {
      const defaultAssets = [
        {
          id: 'asset-1',
          title: "Welcome to the Scrapyard",
          description: "This is your scrapyard space. Upload digital artifacts and assets.",
          filename: "welcome_artifact.txt",
          size: 1024,
          category: "Data Fragment",
          username: "system_admin",
          user_id: 'system',
          created_at: new Date().toISOString(),
          comment_count: 0,
          download_count: 0,
          file_path: "/uploads/assets/welcome_artifact.txt"
        },
        {
          id: 'asset-2',
          title: "Digital Wasteland Map",
          description: "Navigation data for the digital frontier.",
          filename: "wasteland_map.json",
          size: 2048,
          category: "Map Data",
          username: "terminal_ghost",
          user_id: 'system',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          comment_count: 1,
          download_count: 5,
          file_path: "/uploads/assets/wasteland_map.json"
        }
      ];
      assets = defaultAssets;
    }

    const scrapyardData = {
      assets: assets.slice(0, 20), // Limit to 20 assets
      assetCount: assets.length,
      junkerCount: Math.floor(Math.random() * 10) + 5,
      user: req.session.user || null,
      categories: [
        { id: 1, name: "Data Fragment" },
        { id: 2, name: "Map Data" },
        { id: 3, name: "Code Archive" },
        { id: 4, name: "Media Asset" },
        { id: 5, name: "Unknown" }
      ]
    };

    let html = fs.readFileSync(path.join(__dirname, 'views', 'forum', 'scrapyard.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(scrapyardData));

    res.send(html);
  } catch (err) {
    console.error('Error loading forum:', err);
    res.status(500).sendFile(path.join(__dirname, 'views', 'error.html'));
  }
});

// Upload asset to scrapyard
staticRouter.post('/forum/upload-asset', upload.single('asset'), (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to upload assets.'
      });
    }

    const { title, description, category } = req.body;

    if (!title || !req.file) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Title and file are required.'
      });
    }

    const appData = initializeSessionData(req);
    if (!appData.scrapyardAssets) {
      appData.scrapyardAssets = [];
    }

    const newAsset = {
      id: `asset-${Date.now()}`,
      title: title.slice(0, 200),
      description: description ? description.slice(0, 1000) : '',
      filename: req.file.filename,
      original_filename: req.file.originalname,
      size: req.file.size,
      category: category || 'Unknown',
      username: req.session.user.username,
      user_id: req.session.user.id,
      created_at: new Date().toISOString(),
      comment_count: 0,
      download_count: 0,
      file_path: '/uploads/assets/' + req.file.filename
    };

    appData.scrapyardAssets.unshift(newAsset);

    res.status(201).json({
      success: true,
      message: 'Asset successfully uploaded to the scrapyard',
      assetId: newAsset.id
    });
  } catch (err) {
    console.error('Asset upload error:', err);
    res.status(500).json({
      error: 'System error',
      message: 'Terminal connection unstable. Try again later.'
    });
  }
});

// Get asset upload page
staticRouter.get('/forum/upload-asset', (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }

    const data = {
      user: req.session.user,
      categories: [
        { id: 1, name: "Data Fragment" },
        { id: 2, name: "Map Data" },
        { id: 3, name: "Code Archive" },
        { id: 4, name: "Media Asset" },
        { id: 5, name: "Unknown" }
      ]
    };

    let html = fs.readFileSync(path.join(__dirname, 'views', 'forum', 'upload-asset.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));

    res.send(html);
  } catch (err) {
    console.error('Error loading asset upload page:', err);
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.status(500).sendFile(path.join(__dirname, 'views', 'error.html'));
  }
});

// View specific asset
staticRouter.get('/forum/asset/:id', (req, res) => {
  try {
    const { id } = req.params;
    const appData = initializeSessionData(req);

    const asset = appData.scrapyardAssets ? appData.scrapyardAssets.find(a => a.id === id) : null;

    if (!asset) {
      return res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
    }

    const data = {
      asset,
      user: req.session.user || null,
      isOwner: req.session.user && req.session.user.id === asset.user_id
    };

    let html = fs.readFileSync(path.join(__dirname, 'views', 'forum', 'view-asset.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));

    res.send(html);
  } catch (err) {
    console.error('Error viewing asset:', err);
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.status(500).sendFile(path.join(__dirname, 'views', 'error.html'));
  }
});

// Download asset
staticRouter.get('/forum/download/:id', (req, res) => {
  try {
    const { id } = req.params;
    const appData = initializeSessionData(req);

    const asset = appData.scrapyardAssets ? appData.scrapyardAssets.find(a => a.id === id) : null;

    if (!asset) {
      return res.status(404).json({
        error: 'Asset not found',
        message: 'The requested asset does not exist.'
      });
    }

    // Increment download count
    asset.download_count = (asset.download_count || 0) + 1;

    // In a real implementation, serve the actual file
    // For now, just return success
    res.json({
      success: true,
      message: 'Asset download initiated',
      filename: asset.original_filename || asset.filename
    });
  } catch (err) {
    console.error('Asset download error:', err);
    res.status(500).json({
      error: 'System error',
      message: 'Terminal connection unstable. Try again later.'
    });
  }
});

// Forum junker registration
staticRouter.get('/forum/junker-register', (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }

    const data = {
      user: req.session.user
    };

    let html = fs.readFileSync(path.join(__dirname, 'views', 'forum', 'junker-register.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));

    res.send(html);
  } catch (err) {
    console.error('Error loading junker registration:', err);
    res.status(500).sendFile(path.join(__dirname, 'views', 'error.html'));
  }
});

// Process junker registration
staticRouter.post('/forum/junker-register', (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to register as a junker.'
      });
    }

    const { specialization, experience, equipment } = req.body;

    if (!specialization) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Specialization is required.'
      });
    }

    const appData = initializeSessionData(req);
    
    // Update user profile with junker status
    let profile = appData.profiles.get(req.session.user.id) || {
      user_id: req.session.user.id,
      status: 'New terminal connected',
      custom_css: '',
      custom_html: '',
      theme_template: 'default',
      blog_layout: 'feed',
      district_id: 1,
      background_image: null,
      header_image: null,
      widgets_data: null,
      glyph_id: null,
      glyph_3d: 0,
      glyph_rotation_speed: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    profile.junker_status = 'registered';
    profile.junker_specialization = specialization;
    profile.junker_experience = experience || '';
    profile.junker_equipment = equipment || '';
    profile.updated_at = new Date().toISOString();

    appData.profiles.set(req.session.user.id, profile);

    res.json({
      success: true,
      message: 'Junker registration successful. Welcome to the scrapyard.',
      junkerStatus: 'registered'
    });
  } catch (err) {
    console.error('Junker registration error:', err);
    res.status(500).json({
      error: 'System error',
      message: 'Terminal connection unstable. Try again later.'
    });
  }
});

// About page with data injection
staticRouter.get('/about', (req, res) => {
  try {
    const data = {
      user: req.session.user || null
    };

    let html = fs.readFileSync(path.join(__dirname, 'views', 'about.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));

    res.send(html);
  } catch (err) {
    console.error('Error loading about page:', err);
    res.status(500).sendFile(path.join(__dirname, 'views', 'error.html'));
  }
});

// Activity log page
staticRouter.get('/activity', (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }

    const appData = initializeSessionData(req);
    
    // Initialize activity logs if they don't exist
    if (!appData.activityLogs) {
      appData.activityLogs = new Map();
    }

    const userActivityLogs = appData.activityLogs.get(req.session.user.id) || [];

    const data = {
      user: req.session.user,
      activityLogs: userActivityLogs.slice(0, 50) // Limit to 50 entries
    };

    let html = fs.readFileSync(path.join(__dirname, 'views', 'activity-log.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));

    res.send(html);
  } catch (err) {
    console.error('Error loading activity log:', err);
    res.status(500).sendFile(path.join(__dirname, 'views', 'error.html'));
  }
});

// Crypto index page
staticRouter.get('/crypto', (req, res) => {
  try {
    const appData = initializeSessionData(req);
    
    // Mock crypto data
    const data = {
      user: req.session.user || null,
      users: [
        { username: 'system_admin', status: 'Online', district: 'Central Terminal' },
        { username: 'terminal_ghost', status: 'Away', district: 'Digital Wasteland' },
        { username: 'void_speaker', status: 'Offline', district: 'Void District' }
      ]
    };

    let html = fs.readFileSync(path.join(__dirname, 'views', 'crypto', 'index.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));

    res.send(html);
  } catch (err) {
    console.error('Error loading crypto page:', err);
    res.status(500).sendFile(path.join(__dirname, 'views', 'error.html'));
  }
});

// Profile dashboard
staticRouter.get('/profile/dashboard', (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }

    const appData = initializeSessionData(req);
    
    // Get or create profile for this user
    let profile = appData.profiles.get(req.session.user.id) || {
      user_id: req.session.user.id,
      status: 'New terminal connected',
      custom_css: '',
      custom_html: '',
      theme_template: 'default',
      blog_layout: 'feed',
      district_id: 1,
      background_image: null,
      header_image: null,
      widgets_data: null,
      glyph_id: null,
      glyph_3d: 0,
      glyph_rotation_speed: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Get user's glyph if set
    let glyph = null;
    if (profile.glyph_id) {
      glyph = appData.glyphs.find(g => g.id == profile.glyph_id);
    }

    // Get user's posts
    const posts = appData.posts.filter(p => p.user_id === req.session.user.id);

    const data = {
      user: req.session.user,
      profile: profile,
      glyph: glyph,
      posts: posts
    };

    let html = fs.readFileSync(path.join(__dirname, 'views', 'profile', 'dashboard.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));

    res.send(html);
  } catch (err) {
    console.error('Error loading profile dashboard:', err);
    res.status(500).sendFile(path.join(__dirname, 'views', 'error.html'));
  }
});

// Additional missing forum routes
// Forum index
staticRouter.get('/forum', (req, res) => {
  try {
    const data = {
      user: req.session.user || null,
      forums: [
        {
          id: 'scrapyard',
          slug: 'scrapyard',
          title: 'Digital Scrapyard',
          description: 'A place to share and discuss digital artifacts, data fragments, and code.',
          topic_count: 12,
          post_count: 47,
          last_activity: new Date().toISOString()
        }
      ]
    };

    let html = fs.readFileSync(path.join(__dirname, 'views', 'forum', 'index.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));

    res.send(html);
  } catch (err) {
    console.error('Error loading forum index:', err);
    res.status(500).sendFile(path.join(__dirname, 'views', 'error.html'));
  }
});

// Forum topic view
staticRouter.get('/forum/topic/:id', (req, res) => {
  try {
    const { id } = req.params;
    const appData = initializeSessionData(req);

    // Check both regular forum posts and scrapyard assets
    let topic = null;
    let isAsset = false;

    // First check scrapyard assets
    if (appData.scrapyardAssets) {
      topic = appData.scrapyardAssets.find(a => a.id === id);
      if (topic) {
        isAsset = true;
        // Transform asset to topic format
        topic = {
          ...topic,
          content: topic.description || 'No description provided.',
          forum_title: 'Scrapyard',
          forum_slug: 'scrapyard'
        };
      }
    }

    // If not found, check regular forum posts
    if (!topic && appData.forumPosts) {
      topic = appData.forumPosts.find(p => p.id === id);
    }

    // If still not found, create a default topic
    if (!topic) {
      topic = {
        id: id,
        title: "Topic Not Found",
        content: "This topic may have been removed or does not exist.",
        username: "system",
        created_at: new Date().toISOString(),
        forum_title: "Unknown",
        forum_slug: "unknown"
      };
    }

    // Mock comments
    const comments = [
      {
        id: 1,
        content: "Interesting topic. Thanks for sharing.",
        username: "terminal_ghost",
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ];

    const data = {
      topic,
      comments,
      user: req.session.user || null,
      isOwner: req.session.user && req.session.user.id === topic.user_id,
      isAsset: isAsset
    };

    let html = fs.readFileSync(path.join(__dirname, 'views', 'forum', 'view-topic.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));

    res.send(html);
  } catch (err) {
    console.error('Error viewing forum topic:', err);
    res.status(500).sendFile(path.join(__dirname, 'views', 'error.html'));
  }
});

// Forum new topic
staticRouter.get('/forum/:slug/new', (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }

    const { slug } = req.params;

    const data = {
      user: req.session.user,
      forum: {
        slug: slug,
        title: slug === 'scrapyard' ? 'Digital Scrapyard' : 'Forum',
        id: slug
      }
    };

    let html = fs.readFileSync(path.join(__dirname, 'views', 'forum', 'new-topic.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));

    res.send(html);
  } catch (err) {
    console.error('Error loading new topic page:', err);
    res.status(500).sendFile(path.join(__dirname, 'views', 'error.html'));
  }
});

// Create topic
staticRouter.post('/forum/:slug/create-topic', (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please log in to create topics.'
      });
    }

    const { title, content } = req.body;
    const { slug } = req.params;

    if (!title || !content) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Title and content are required.'
      });
    }

    const appData = initializeSessionData(req);
    if (!appData.forumPosts) {
      appData.forumPosts = [];
    }

    const newTopic = {
      id: `topic-${Date.now()}`,
      title: title.slice(0, 200),
      content: content.slice(0, 5000),
      username: req.session.user.username,
      user_id: req.session.user.id,
      created_at: new Date().toISOString(),
      comment_count: 0,
      forum_title: slug === 'scrapyard' ? 'Digital Scrapyard' : 'Forum',
      forum_slug: slug
    };

    appData.forumPosts.unshift(newTopic);

    res.status(201).json({
      success: true,
      message: 'Topic successfully created',
      topicId: newTopic.id,
      redirectUrl: `/forum/topic/${newTopic.id}`
    });
  } catch (err) {
    console.error('Forum topic creation error:', err);
    res.status(500).json({
      error: 'System error',
      message: 'Terminal connection unstable. Try again later.'
    });
  }
});

// Use the static router
app.use('/', staticRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);

  // Log additional information for debugging
  console.error('Error URL:', req.originalUrl);
  console.error('Error Method:', req.method);
  console.error('Error Headers:', JSON.stringify(req.headers, null, 2));

  // Handle multer file upload errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size must be less than 10MB.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Invalid file field',
        message: 'Unexpected file field in upload.'
      });
    }
    return res.status(400).json({
      error: 'File upload error',
      message: err.message
    });
  }

  // Handle file filter errors
  if (err.message && (err.message.includes('Only image files') || err.message.includes('File type not allowed'))) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: err.message
    });
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON.'
    });
  }

  // For AJAX requests, return JSON error
  if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Something went wrong. Please try again.'
    });
  }

  // For regular requests, return HTML error page
  res.status(500).sendFile(path.join(__dirname, 'views', 'error.html'));
});

// 404 handler with detailed logging
app.use((req, res) => {
  // Log detailed information about the 404 error
  console.warn('404 Not Found:', req.originalUrl);
  console.warn('Referrer:', req.get('Referrer') || 'None');
  console.warn('User Agent:', req.get('User-Agent') || 'None');

  // Send the 404 page
  res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// Add memory management
const memoryManagement = () => {
  try {
    // Force garbage collection if available (requires --expose-gc flag)
    if (global.gc) {
      global.gc();
      console.log('Garbage collection completed');
    }

    // Log memory usage
    const memoryUsage = process.memoryUsage();
    console.log('Memory usage:');
    console.log(`  RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)} MB`);
    console.log(`  Heap total: ${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`);
    console.log(`  Heap used: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`);
    console.log(`  External: ${Math.round(memoryUsage.external / 1024 / 1024)} MB`);

    // Check if memory usage is too high and restart if necessary
    if (memoryUsage.heapUsed > 500 * 1024 * 1024) { // 500 MB
      console.warn('Memory usage too high, restarting process...');
      process.exit(1); // Exit with error code to trigger restart
    }
  } catch (err) {
    console.error('Error in memory management:', err);
  }
};

// Start server
const server = app.listen(PORT, () => {
  console.log(`Elriel network node activated on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Run memory management every 5 minutes
  setInterval(memoryManagement, 5 * 60 * 1000);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;