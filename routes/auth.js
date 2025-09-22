// Elriel - Authentication Routes
// Handles user registration, login, and logout

const express = require('express');
const router = express.Router();
const path = require('path');
const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');
const db = new Database('./db/elriel.db', { verbose: console.log });

// Serve login page
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/profile');
  }
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(path.join(__dirname, '../views/auth/login.html'));
});

// Serve registration page
router.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/profile');
  }
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(path.join(__dirname, '../views/auth/register.html'));
});

// Handle login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Find user
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Authentication failed', 
        message: 'Terminal access denied: Invalid credentials' 
      });
    }
    
    // Check password
    bcrypt.compare(password, user.password, (err, result) => {
      if (err || !result) {
        return res.status(401).json({ 
          error: 'Authentication failed', 
          message: 'Terminal access denied: Invalid credentials' 
        });
      }
      
      // Update last login
      db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
      
      // Create session
      req.session.user = {
        id: user.id,
        username: user.username,
        isAdmin: user.is_admin === 1
      };
      
      res.json({ 
        success: true, 
        message: 'Terminal access granted', 
        user: req.session.user 
      });
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      error: 'System error', 
      message: 'Terminal connection unstable. Try again later.' 
    });
  }
});

// Handle registration
router.post('/register', async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;
  
  // Validate input
  if (!username || !email || !password || password !== confirmPassword) {
    return res.status(400).json({ 
      error: 'Invalid input', 
      message: 'Data corruption detected. Check your input and try again.' 
    });
  }
  
  try {
    // Check if username or email already exists
    const existingUser = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, email);
    
    if (existingUser) {
      return res.status(409).json({ 
        error: 'User exists', 
        message: 'Terminal identity already registered in the system.' 
      });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert new user
    const insertUser = db.prepare(`
      INSERT INTO users (username, email, password)
      VALUES (?, ?, ?)
    `);
    
    const result = insertUser.run(username, email, hashedPassword);
    
    if (result.changes === 0) {
      throw new Error('Failed to create user');
    }
    
    // Create default profile
    const insertProfile = db.prepare(`
      INSERT INTO profiles (user_id, status)
      VALUES (?, 'New terminal connected')
    `);
    
    insertProfile.run(result.lastInsertRowid);
    
    // Create session
    req.session.user = {
      id: result.lastInsertRowid,
      username,
      isAdmin: 0
    };
    
    res.status(201).json({ 
      success: true, 
      message: 'Terminal identity registered successfully', 
      user: req.session.user 
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ 
      error: 'System error', 
      message: 'Terminal connection unstable. Try again later.' 
    });
  }
});

// Handle logout
router.get('/logout', (req, res) => {
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

module.exports = router;