// Elriel - Index Routes
// Handles main site navigation

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const supabase = require('../services/db');

// Home page
router.get('/', async (req, res) => {
  // Get current announcements
  let announcement = null;
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (!error) announcement = data;
  } catch (err) {
    console.error('Error loading announcement:', err);
  }
  
  // Get recent activity
  let recentActivity = [];
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, users!inner(username), created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    if (!error) recentActivity = data || [];
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
router.get('/crypto', async (req, res) => {
  // Authentication check
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  
  try {
    // Get all users for recipient dropdown
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username')
      .neq('id', req.session.user.id)
      .order('username');
    
    if (error) throw error;
    
    // Pass data to the frontend
    const data = {
      user: req.session.user,
      users: users || []
    };
    
    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/crypto/index.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));
    
    res.send(html);
  } catch (err) {
    console.error('Error loading crypto page:', err);
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Add activity log to user's session
router.get('/activity-log', async (req, res) => {
  // Authentication check
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  
  try {
    // Get user's activity logs
    const { data: activityLogs, error: activityError } = await supabase
      .from('user_activity_logs')
      .select('activity_type, description, created_at, metadata')
      .eq('user_id', req.session.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (activityError) throw activityError;
    
    // Get user's reputation
    const { data: reputation, error: repError } = await supabase
      .from('user_reputation')
      .select('reputation_points, reputation_level')
      .eq('user_id', req.session.user.id)
      .single();
    
    if (repError && repError.code !== 'PGRST116') throw repError; // PGRST116 is no rows
    const repData = reputation || { reputation_points: 0, reputation_level: 1 };
    
    // Get user's badges/rewards
    const { data: rewards, error: rewardsError } = await supabase
      .from('user_rewards')
      .select('*, rewards(name, description, badge_image)')
      .eq('user_id', req.session.user.id)
      .order('earned_at', { ascending: false });
    
    if (rewardsError) throw rewardsError;
    
    // Pass data to the frontend
    const data = {
      user: req.session.user,
      activityLogs: activityLogs || [],
      reputation: repData,
      rewards: rewards || []
    };
    
    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/activity-log.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));
    
    res.send(html);
  } catch (err) {
    console.error('Error loading activity log:', err);
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Terminal special pages
router.get('/terminal/numbpill', (req, res) => {
  // Pass user data to the frontend
  const data = {
    user: req.session.user || null
  };
  
  // Inject data into the HTML
  let html = fs.readFileSync(path.join(__dirname, '../views/secrets/numbpill.html'), 'utf8');
  html = html.replace('__DATA__', JSON.stringify(data));
  
  res.send(html);
});

// Terminal void page
router.get('/terminal/void', (req, res) => {
  // Pass user data to the frontend
  const data = {
    user: req.session.user || null
  };
  
  // Inject data into the HTML
  let html = fs.readFileSync(path.join(__dirname, '../views/secrets/void.html'), 'utf8');
  html = html.replace('__DATA__', JSON.stringify(data));
  
  res.send(html);
});

module.exports = router;