// Elriel - A haunted terminal-based social network
// Enhanced version with Bleedstream real-time capabilities
// Main application entry point

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const http = require('http');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server explicitly to attach WebSocket later
const server = http.createServer(app);

// Configure middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const publicPath = path.join(__dirname, 'public');
console.log('Serving static files from:', publicPath);
app.use(express.static(publicPath));

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

// Import routes
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth_supabase'); // Using Supabase auth
const profileRoutes = require('./routes/profile');
const glyphRoutes = require('./routes/glyph');
const feedRoutes = require('./routes/feed_supabase'); // Using Supabase feed
const whisperRoutes = require('./routes/whisper');
const forumRoutes = require('./routes/forum_supabase'); // Using Supabase forum
const cryptoRoutes = require('./routes/crypto');
const apiRoutes = require('./routes/api');
const scrapyardRoutes = require('./routes/scrapyard'); // Scrapyard marketplace

// Import new routes and services for Bleedstream
const activityRoutes = require('./routes/activity'); // New activity routes
const preferencesRoutes = require('./routes/preferences'); // New preferences routes

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
app.use('/scrapyard', scrapyardRoutes);

// Add new routes for Bleedstream enhancements
app.use('/activity', activityRoutes);
app.use('/user/preferences', preferencesRoutes);

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

// Initialize WebSocket server
const websocketService = require('./services/websocket');
const wss = websocketService.init(server);

// Start HTTP server (not app.listen)
server.listen(PORT, () => {
  console.log(`Elriel network node activated on port ${PORT}`);
  console.log(`Terminal access: http://localhost:${PORT}`);
  console.log(`WebSocket server active at ws://localhost:${PORT}/ws`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Using Supabase database: ${process.env.SUPABASE_URL}`);
});

// Export the app for testing
module.exports = app;