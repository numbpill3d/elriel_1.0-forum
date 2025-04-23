// Elriel - Index Routes
// Handles main site navigation

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const db = new Database('./db/elriel.db', { verbose: console.log });

// Home page
router.get('/', (req, res) => {
  // Get current announcements
  let announcement = null;
  try {
    announcement = db.prepare(`
      SELECT * FROM announcements 
      WHERE is_active = 1
      ORDER BY created_at DESC LIMIT 1
    `).get();
  } catch (err) {
    console.error('Error loading announcement:', err);
  }
  
  // Get recent activity
  let recentActivity = [];
  try {
    recentActivity = db.prepare(`
      SELECT p.id, p.title, u.username, p.created_at
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC LIMIT 5
    `).all();
  } catch (err) {
    console.error('Error loading recent activity:', err);
  }
  
  // Pass data to the frontend
  const data = {
    announcement,
    recentActivity,
    user: req.session.user || null
  };
  
  // Inject data into the HTML
  let html = fs.readFileSync(path.join(__dirname, '../views/index.html'), 'utf8');
  html = html.replace('__DATA__', JSON.stringify(data));
  
  res.send(html);
});

// About page
router.get('/about', (req, res) => {
  // Pass user data to the frontend
  const data = {
    user: req.session.user || null
  };
  
  // Inject data into the HTML
  let html = fs.readFileSync(path.join(__dirname, '../views/about.html'), 'utf8');
  html = html.replace('__DATA__', JSON.stringify(data));
  
  res.send(html);
});

// Crypto page
router.get('/crypto', (req, res) => {
  // Authentication check
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  
  try {
    // Get all users for recipient dropdown
    const users = db.prepare(`
      SELECT id, username FROM users
      WHERE id != ?
      ORDER BY username ASC
    `).all(req.session.user.id);
    
    // Pass data to the frontend
    const data = {
      user: req.session.user,
      users: users
    };
    
    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/crypto/index.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));
    
    res.send(html);
  } catch (err) {
    console.error('Error loading crypto page:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Add activity log to user's session
router.get('/activity-log', (req, res) => {
  // Authentication check
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  
  try {
    // Get user's activity logs
    const activityLogs = db.prepare(`
      SELECT activity_type, description, created_at, metadata
      FROM user_activity_logs
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(req.session.user.id);
    
    // Get user's reputation
    const reputation = db.prepare(`
      SELECT reputation_points, reputation_level
      FROM user_reputation
      WHERE user_id = ?
    `).get(req.session.user.id) || { reputation_points: 0, reputation_level: 1 };
    
    // Get user's badges/rewards
    const rewards = db.prepare(`
      SELECT r.name, r.description, r.badge_image, ur.earned_at, ur.is_equipped
      FROM user_rewards ur
      JOIN rewards r ON ur.reward_id = r.id
      WHERE ur.user_id = ?
      ORDER BY ur.earned_at DESC
    `).all(req.session.user.id);
    
    // Pass data to the frontend
    const data = {
      user: req.session.user,
      activityLogs: activityLogs,
      reputation: reputation,
      rewards: rewards
    };
    
    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/activity-log.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));
    
    res.send(html);
  } catch (err) {
    console.error('Error loading activity log:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

module.exports = router;