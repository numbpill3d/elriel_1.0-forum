// Elriel - A haunted terminal-based social network
// Main application entry point - Supabase Version

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Configure middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configure static file serving with multiple paths for better compatibility
const publicPath = path.join(__dirname, 'public');
console.log('Serving static files from primary path:', publicPath);
app.use(express.static(publicPath));

// Also serve files directly from the root for compatibility with some paths
app.use('/public', express.static(publicPath));

// Add cache control for static assets
app.use((req, res, next) => {
  // If the request is for a static asset
  if (req.url.match(/\.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    // Set cache headers
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
    res.setHeader('Expires', new Date(Date.now() + 86400000).toUTCString());
  }
  next();
});

// Add CORS headers for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  console.log(`Request: ${req.method} ${req.url}`);
  next();
});

// Configure session
app.use(session({
  secret: process.env.SESSION_SECRET || 'elriel_default_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
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
if (!fs.existsSync('./public/uploads')) {
  fs.mkdirSync('./public/uploads', { recursive: true });
}

// Import routes - using Supabase versions
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth_supabase'); // Using Supabase auth
const profileRoutes = require('./routes/profile');
const glyphRoutes = require('./routes/glyph');
const feedRoutes = require('./routes/feed_supabase'); // Using Supabase feed
const whisperRoutes = require('./routes/whisper');
const forumRoutes = require('./routes/forum_supabase'); // Using Supabase forum
// const scrapyardRoutes = require('./routes/scrapyard_supabase'); // Using Supabase scrapyard - now handled by forum routes
const cryptoRoutes = require('./routes/crypto');
const apiRoutes = require('./routes/api');

// Use routes
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/glyph', glyphRoutes);
app.use('/feed', feedRoutes);
app.use('/whisper', whisperRoutes);
app.use('/forum', forumRoutes);
app.use('/crypto', cryptoRoutes);
app.use('/api', apiRoutes);

// Redirect /scrapyard to /forum/scrapyard for compatibility
app.get('/scrapyard', (req, res) => {
  res.redirect('/forum/scrapyard');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  console.error('Error URL:', req.originalUrl);
  console.error('Error Method:', req.method);
  console.error('Error Headers:', JSON.stringify(req.headers, null, 2));
  res.status(500).sendFile(path.join(__dirname, 'views', 'error.html'));
});

// 404 handler - with ARG-style mysterious error page
app.use((req, res) => {
  console.warn('404 Not Found:', req.originalUrl);
  console.warn('Referrer:', req.get('Referrer') || 'None');
  console.warn('User Agent:', req.get('User-Agent') || 'None');
  res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Elriel network node activated on port ${PORT}`);
  console.log(`Terminal access: http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Using Supabase database: ${process.env.SUPABASE_URL}`);
});

module.exports = app;