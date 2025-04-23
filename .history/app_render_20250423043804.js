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
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Serve static views for demo
staticRouter.get('/bleedstream', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'feed', 'bleedstream.html'));
});

staticRouter.get('/profile', (req, res) => {
  if (req.session.user) {
    res.sendFile(path.join(__dirname, 'views', 'profile', 'view.html'));
  } else {
    res.redirect('/login');
  }
});

staticRouter.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'auth', 'login.html'));
});

staticRouter.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'auth', 'register.html'));
});

// Use the static router
app.use('/', staticRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).sendFile(path.join(__dirname, 'views', 'error.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Elriel network node activated on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;