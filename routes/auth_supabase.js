// Elriel - Authentication Routes (Supabase Version)
// Handles user registration, login, and logout

const express = require('express');
const router = express.Router();
const path = require('path');
const bcrypt = require('bcrypt');
const supabase = require('../services/db');

// Serve login page
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/profile');
  }
  res.sendFile(path.join(__dirname, '../views/auth/login.html'));
});

// Serve registration page
router.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/profile');
  }
  res.sendFile(path.join(__dirname, '../views/auth/register.html'));
});

// Handle login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error || !user) {
      return res.status(401).json({ 
        error: 'Authentication failed', 
        message: 'Terminal access denied: Invalid credentials' 
      });
    }
    
    // Check password
    bcrypt.compare(password, user.password, async (err, result) => {
      if (err || !result) {
        return res.status(401).json({ 
          error: 'Authentication failed', 
          message: 'Terminal access denied: Invalid credentials' 
        });
      }
      
      // Update last login
      const now = new Date().toISOString();
      await supabase
        .from('users')
        .update({ last_login: now })
        .eq('id', user.id);
      
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
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .or(`username.eq.${username},email.eq.${email}`)
      .maybeSingle();
    
    if (checkError) {
      throw checkError;
    }
    
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
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        username,
        email,
        password: hashedPassword
      })
      .select()
      .single();
    
    if (insertError || !newUser) {
      throw new Error(insertError?.message || 'Failed to create user');
    }
    
    // Create default profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: newUser.id,
        status: 'New terminal connected'
      });
      
    if (profileError) {
      console.error('Error creating profile:', profileError);
    }
    
    // Create session
    req.session.user = {
      id: newUser.id,
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