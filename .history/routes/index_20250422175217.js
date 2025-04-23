// Elriel - Index Routes
// Handles the landing page and main navigation

const express = require('express');
const router = express.Router();
const path = require('path');
const Database = require('better-sqlite3');
const db = new Database('./db/elriel.db', { verbose: console.log });

// Landing page route
router.get('/', (req, res) => {
  try {
    // Get the latest announcement
    const announcement = db.prepare(`
      SELECT * FROM announcements 
      WHERE is_active = 1 
      ORDER BY created_at DESC 
      LIMIT 1
    `).get();
    
    // Pass data to the frontend
    const data = {
      announcement: announcement || { 
        title: 'SYSTEM ALERT', 
        content: 'Terminal connection established. No active announcements found.' 
      },
      user: req.session.user || null
    };
    
    // Inject data into the HTML
    const filePath = path.join(__dirname, '../views/index.html');
    let html = '';
    try {
      html = require('fs').readFileSync(filePath, 'utf8');
      if (!html.includes('__DATA__')) {
        console.error('__DATA__ placeholder not found in index.html');
      }
      html = html.replace('__DATA__', JSON.stringify(data));
    } catch (err) {
      console.error('Error reading or processing index.html:', err);
      return res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
    }
    
    res.send(html);
  } catch (err) {
    console.error('Error loading landing page:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Hidden ARG routes
router.get('/terminal/:code', (req, res) => {
  const { code } = req.params;
  
  // Secret routes for ARG elements
  const secretRoutes = {
    'void': '../views/secrets/void.html',
    'numbpill': '../views/secrets/numbpill.html',
    'glitch': '../views/secrets/glitch.html'
  };
  
  if (secretRoutes[code]) {
    res.sendFile(path.join(__dirname, secretRoutes[code]));
  } else {
    // Send to a "corrupted data" page that has hints
    res.sendFile(path.join(__dirname, '../views/secrets/corrupted.html'));
  }
});

// About page
router.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/about.html'));
});

module.exports = router;