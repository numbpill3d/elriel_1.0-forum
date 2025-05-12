// Enhanced Scrapyard Integration for 2133.lol
// This file demonstrates how to integrate the enhanced scrapyard routes

const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

// Configure middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configure session
app.use(session({
  secret: process.env.SESSION_SECRET || 'terminal_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Import routes
const enhancedScrapyardRoutes = require('./routes/enhanced_scrapyard');

// Use routes
app.use('/scrapyard', enhancedScrapyardRoutes);

// Handle 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'views/404.html'));
});

// Handle errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).sendFile(path.join(__dirname, 'views/error.html'));
});

// Export app
module.exports = app;