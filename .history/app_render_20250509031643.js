// Elriel - A haunted terminal-based social network
// Render deployment version - completely removes SQLite dependency

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Configure Express for production behind proxy
app.set('trust proxy', 1);

// Configure middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const publicPath = path.join(__dirname, 'public');
console.log('Serving static files from:', publicPath);
app.use(express.static(publicPath));

// Configure session
app.use(session({
  secret: process.env.SESSION_SECRET || 'elriel_default_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // Force secure cookies in production
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  }
}));

// Configure file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('./public/uploads')) {
  fs.mkdirSync('./public/uploads', { recursive: true });
}

// Render health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Import only needed routes for a static demo
// In a real production setup, you would adapt all routes to use Supabase instead
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
// Feed routes
staticRouter.get('/feed/bleedstream', (req, res) => {
  // Create mock feed data
  const feedData = {
    user: req.session.user || null,
    posts: [
      {
        id: 1,
        title: "Welcome to the Bleedstream",
        content: "This is a demo post in the static version.",
        username: "system_admin",
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        title: "Exploring the Digital Wasteland",
        content: "The network expands. The signal grows stronger.",
        username: "terminal_ghost",
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ]
  };

  // Inject data into the HTML
  let html = fs.readFileSync(path.join(__dirname, 'views', 'feed', 'bleedstream.html'), 'utf8');
  html = html.replace('__DATA__', JSON.stringify(feedData));

  res.send(html);
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
  // Create mock whisper data
  const whisperData = {
    user: req.session.user || null,
    whispers: [
      {
        id: 1,
        content: "The void listens. The network expands.",
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        content: "Signals in the noise. Patterns in the static.",
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ]
  };

  // Inject data into the HTML
  let html = fs.readFileSync(path.join(__dirname, 'views', 'whisper', 'board.html'), 'utf8');
  html = html.replace('__DATA__', JSON.stringify(whisperData));

  res.send(html);
});

// Redirect for compatibility with old links
staticRouter.get('/whisperboard', (req, res) => {
  res.redirect('/whisper/board');
});

// Terminal/secrets routes
staticRouter.get('/terminal/numbpill', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'secrets', 'numbpill.html'));
});

// Redirect for compatibility with old links
staticRouter.get('/numbpill', (req, res) => {
  res.redirect('/terminal/numbpill');
});

staticRouter.get('/terminal/void', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'secrets', 'void.html'));
});

// About page
staticRouter.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'about.html'));
});

// Profile routes
staticRouter.get('/profile', (req, res) => {
  if (req.session.user) {
    // Create mock profile data
    const profileData = {
      user: req.session.user,
      profile: {
        bio: "This is a demo profile for the static version.",
        status: "Online",
        avatar: "/images/default-avatar.png",
        created_at: new Date().toISOString()
      }
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
  res.sendFile(path.join(__dirname, 'views', 'auth', 'login.html'));
});

staticRouter.get('/auth/register', (req, res) => {
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

// Use the static router
app.use('/', staticRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);

  // Log additional information for debugging
  console.error('Error URL:', req.originalUrl);
  console.error('Error Method:', req.method);
  console.error('Error Headers:', JSON.stringify(req.headers, null, 2));

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

// Start server
app.listen(PORT, () => {
  console.log(`Elriel network node activated on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;