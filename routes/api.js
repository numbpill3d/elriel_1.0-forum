// Elriel - API Routes
// Handles API endpoints for the application

const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const db = new Database('./db/elriel.db', { verbose: console.log });

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required' 
    });
  }
  next();
};

// Get user activity
router.get('/activity/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    // Check if viewing own profile or if public activity
    const isOwnProfile = req.session.user && req.session.user.id === parseInt(userId);
    
    // Get activities
    const activities = db.prepare(`
      SELECT activity_type, description, created_at, metadata
      FROM user_activity_logs
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(userId, limit);
    
    res.json({
      success: true,
      activities: activities
    });
  } catch (err) {
    console.error('Error fetching activity:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity data'
    });
  }
});

// Get user reputation
router.get('/reputation/:userId', isAuthenticated, (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if viewing own reputation
    if (req.session.user.id !== parseInt(userId) && !req.session.user.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Get reputation
    const reputation = db.prepare(`
      SELECT reputation_points, reputation_level, last_updated
      FROM user_reputation
      WHERE user_id = ?
    `).get(userId);
    
    res.json({
      success: true,
      reputation: reputation || { reputation_points: 0, reputation_level: 1 }
    });
  } catch (err) {
    console.error('Error fetching reputation:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reputation data'
    });
  }
});

// Get user rewards
router.get('/rewards/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get rewards
    const rewards = db.prepare(`
      SELECT r.name, r.description, r.badge_image, r.reward_type, 
             ur.earned_at, ur.is_equipped
      FROM user_rewards ur
      JOIN rewards r ON ur.reward_id = r.id
      WHERE ur.user_id = ? AND r.is_hidden = 0
      ORDER BY ur.earned_at DESC
    `).all(userId);
    
    res.json({
      success: true,
      rewards: rewards
    });
  } catch (err) {
    console.error('Error fetching rewards:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rewards data'
    });
  }
});

// Log user activity
router.post('/log-activity', isAuthenticated, (req, res) => {
  try {
    const { activityType, description, metadata } = req.body;
    
    if (!activityType || !description) {
      return res.status(400).json({
        success: false,
        message: 'Activity type and description are required'
      });
    }
    
    // Insert activity log
    const result = db.prepare(`
      INSERT INTO user_activity_logs
      (user_id, activity_type, description, metadata)
      VALUES (?, ?, ?, ?)
    `).run(
      req.session.user.id,
      activityType,
      description,
      metadata ? JSON.stringify(metadata) : null
    );
    
    res.json({
      success: true,
      message: 'Activity logged successfully',
      logId: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Error logging activity:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to log activity'
    });
  }
});

// Get unlocked districts
router.get('/districts', isAuthenticated, (req, res) => {
  try {
    // Get user's district ID
    const profile = db.prepare(`
      SELECT district_id
      FROM profiles
      WHERE user_id = ?
    `).get(req.session.user.id);
    
    const userDistrictId = profile ? profile.district_id : 1;
    
    // Get all non-hidden districts + any district the user has access to
    const districts = db.prepare(`
      SELECT id, name, description, theme, theme_color, css_theme, 
             has_forum, has_chat, has_minigame
      FROM districts
      WHERE is_hidden = 0 OR id = ?
      ORDER BY id ASC
    `).all(userDistrictId);
    
    res.json({
      success: true,
      districts: districts
    });
  } catch (err) {
    console.error('Error fetching districts:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch districts'
    });
  }
});

// Unlock a district
router.post('/districts/unlock', isAuthenticated, (req, res) => {
  try {
    const { districtName, accessCode } = req.body;
    
    if (!districtName || !accessCode) {
      return res.status(400).json({
        success: false,
        message: 'District name and access code are required'
      });
    }
    
    // Check if the district exists and the access code is correct
    const district = db.prepare(`
      SELECT id, name
      FROM districts
      WHERE LOWER(name) = LOWER(?) AND access_code = ?
    `).get(districtName, accessCode);
    
    if (!district) {
      return res.status(404).json({
        success: false,
        message: 'Invalid district name or access code'
      });
    }
    
    // Update user's profile to unlock the district
    db.prepare(`
      UPDATE profiles
      SET district_id = ?
      WHERE user_id = ?
    `).run(district.id, req.session.user.id);
    
    // Log activity
    db.prepare(`
      INSERT INTO user_activity_logs
      (user_id, activity_type, description)
      VALUES (?, ?, ?)
    `).run(
      req.session.user.id,
      'district_unlocked',
      `Unlocked the ${district.name} district`
    );
    
    // Check if there's a reward for this district
    const rewardName = getDistrictRewardName(district.name);
    if (rewardName) {
      const reward = db.prepare(`
        SELECT id, reputation_value
        FROM rewards
        WHERE name = ?
      `).get(rewardName);
      
      if (reward) {
        // Check if user already has this reward
        const hasReward = db.prepare(`
          SELECT id
          FROM user_rewards
          WHERE user_id = ? AND reward_id = ?
        `).get(req.session.user.id, reward.id);
        
        if (!hasReward) {
          // Award the reward
          db.prepare(`
            INSERT INTO user_rewards
            (user_id, reward_id)
            VALUES (?, ?)
          `).run(req.session.user.id, reward.id);
          
          // Update user reputation
          updateUserReputation(req.session.user.id, reward.reputation_value);
          
          // Log activity
          db.prepare(`
            INSERT INTO user_activity_logs
            (user_id, activity_type, description)
            VALUES (?, ?, ?)
          `).run(
            req.session.user.id,
            'reward_earned',
            `Earned the ${rewardName} badge`
          );
        }
      }
    }
    
    res.json({
      success: true,
      message: `Successfully unlocked the ${district.name} district`,
      district: district
    });
  } catch (err) {
    console.error('Error unlocking district:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to unlock district'
    });
  }
});

// Helper function to get district reward name
function getDistrictRewardName(districtName) {
  const districtRewards = {
    'VOID SECTOR': 'Void Walker',
    'DIGITAL OCCULT': 'Digital Occultist',
    'NEURAL NEXUS': 'Neural Interface',
    'WHISPERBOARD': 'Whisper in the Dark'
  };
  
  return districtRewards[districtName];
}

// Helper function to update user reputation
function updateUserReputation(userId, points) {
  try {
    // Check if user has a reputation record
    const reputation = db.prepare(`
      SELECT id, reputation_points, reputation_level
      FROM user_reputation WHERE user_id = ?
    `).get(userId);
    
    if (reputation) {
      // Update existing reputation
      const newPoints = reputation.reputation_points + points;
      let newLevel = reputation.reputation_level;
      
      // Calculate new level (every 100 points = 1 level)
      const calculatedLevel = Math.floor(newPoints / 100) + 1;
      if (calculatedLevel > newLevel) {
        newLevel = calculatedLevel;
      }
      
      db.prepare(`
        UPDATE user_reputation
        SET reputation_points = ?, reputation_level = ?, last_updated = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(newPoints, newLevel, userId);
    } else {
      // Create new reputation record
      db.prepare(`
        INSERT INTO user_reputation (user_id, reputation_points, reputation_level)
        VALUES (?, ?, ?)
      `).run(userId, points, Math.floor(points / 100) + 1);
    }
  } catch (err) {
    console.error('Update reputation error:', err);
  }
}

module.exports = router;