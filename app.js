// Elriel - A haunted terminal-based social network
// Main application entry point

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const Database = require('better-sqlite3');
const multer = require('multer');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to SQLite database
const db = new Database('./db/elriel.db', { verbose: console.log });

// Configure middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

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
const fs = require('fs');
if (!fs.existsSync('./public/uploads')) {
  fs.mkdirSync('./public/uploads', { recursive: true });
}

// Import routes
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const glyphRoutes = require('./routes/glyph');
const feedRoutes = require('./routes/feed');
const whisperRoutes = require('./routes/whisper');

// Use routes
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/glyph', glyphRoutes);
app.use('/feed', feedRoutes);
app.use('/whisper', whisperRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).sendFile(path.join(__dirname, 'views', 'error.html'));
});

// 404 handler - with ARG-style mysterious error page
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Elriel network node activated on port ${PORT}`);
  console.log(`Terminal access: http://localhost:${PORT}`);
});

module.exports = app;