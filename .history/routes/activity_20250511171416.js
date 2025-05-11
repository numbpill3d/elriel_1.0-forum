// Elriel - Activity Routes
// Handles activity logging and retrieval for Bleedstream

const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const db = new Database('./db/elriel.db', { verbose: console.log });
const websocketService = require('../services/websocket');

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Authentication required' 
    });
  }
  next();
};

// Get activity log (paginated)
router.get('/log', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const userId = req.query.userId || null;
    
    // Base query
    let query = `
      SELECT a.*, u.username 
      FROM activity_log a
      JOIN users u ON a.user_id = u.id
    `;
    
    const params = [];
    
    // Add user filter if provided
    if (userId) {
      query += ' WHERE a.user_id = ?';
      params.push(userId);
    }
    
    // Add order by and pagination
    query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    // Get activities
    const activities = db.prepare(query).all(...params);
    
    // Format activities for response
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      userId: activity.user_id,
      username: activity.username,
      type: activity.activity_type,
      data: JSON.parse(activity.activity_data || '{}'),
      createdAt: activity.created_at
    }));
    
    res.json({ 
      success: true, 
      activities: formattedActivities,
      pagination: {
        limit,
        offset,
        hasMore: formattedActivities.length === limit
      }
    });
  } catch (err) {
    console.error('Error fetching activity log:', err);
    res.status(500).json({ 
      error: 'System error', 
      message: 'Failed to fetch activity log' 
    });
  }
});

// Log a new activity
router.post('/log', isAuthenticated, async (req, res) => {
  try {
    const { activity_type, activity_data } = req.body;
    const userId = req.session.user.id;
    
    // Validate input
    if (!activity_type) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        message: 'Activity type is required' 
      });
    }
    
    // Insert activity
    const result = db.prepare(`
      INSERT INTO activity_log (user_id, activity_type, activity_data)
      VALUES (?, ?, ?)
    `).run(
      userId,
      activity_type,
      activity_data ? JSON.stringify(activity_data) : null
    );
    
    if (result.changes === 0) {
      throw new Error('Failed to log activity');
    }
    
    // Get the inserted activity for WebSocket broadcast
    const activity = {
      id: result.lastInsertRowid,
      userId,
      username: req.session.user.username,
      type: activity_type,
      data: activity_data || {},
      createdAt: new Date().toISOString()
    };
    
    // Find interested users for this activity
    // For simplicity in this implementation, broadcast to all users
    // In a real implementation, query user_interests to find relevant users
    websocketService.broadcast({
      type: 'activity',
      data: activity
    });
    
    res.status(201).json({ 
      success: true, 
      message: 'Activity logged successfully',
      activity
    });
  } catch (err) {
    console.error('Error logging activity:', err);
    res.status(500).json({ 
      error: 'System error', 
      message: 'Failed to log activity' 
    });
  }
});

// Get personalized activity feed for current user
router.get('/feed', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    // Get user interests
    const userInterests = db.prepare(`
      SELECT tag, district_id, glyph_id
      FROM user_interests
      WHERE user_id = ?
    `).all(userId);
    
    // Build a scoring query based on user interests
    // This is a simple implementation - in a real system this would be more sophisticated
    let query = `
      SELECT a.*, u.username,
        CASE
          WHEN a.user_id = ? THEN 100  -- Highest score for own activities
    `;
    
    const params = [userId];
    
    // Add weights for each interest
    userInterests.forEach((interest, index) => {
      if (interest.tag) {
        query += `
          WHEN a.activity_data LIKE ? THEN 50  -- Score for matching tag
        `;
        params.push(`%${interest.tag}%`);
      }
      
      if (interest.district_id) {
        query += `
          WHEN a.activity_data LIKE ? THEN 40  -- Score for matching district
        `;
        params.push(`%"district_id":${interest.district_id}%`);
      }
      
      if (interest.glyph_id) {
        query += `
          WHEN a.activity_data LIKE ? THEN 30  -- Score for matching glyph
        `;
        params.push(`%"glyph_id":${interest.glyph_id}%`);
      }
    });
    
    // Default score for everything else
    query += `
          ELSE 10  -- Base score for non-matching activities
        END as relevance_score
      FROM activity_log a
      JOIN users u ON a.user_id = u.id
      ORDER BY relevance_score DESC, a.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    
    // Get activities
    const activities = db.prepare(query).all(...params);
    
    // Format activities for response
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      userId: activity.user_id,
      username: activity.username,
      type: activity.activity_type,
      data: JSON.parse(activity.activity_data || '{}'),
      createdAt: activity.created_at,
      relevanceScore: activity.relevance_score
    }));
    
    res.json({ 
      success: true, 
      activities: formattedActivities,
      pagination: {
        limit,
        offset,
        hasMore: formattedActivities.length === limit
      }
    });
  } catch (err) {
    console.error('Error fetching personalized feed:', err);
    res.status(500).json({ 
      error: 'System error', 
      message: 'Failed to fetch personalized feed' 
    });
  }
});

// Hook for auto-logging of system events
function logActivity(userId, activityType, activityData) {
  try {
    const result = db.prepare(`
      INSERT INTO activity_log (user_id, activity_type, activity_data)
      VALUES (?, ?, ?)
    `).run(
      userId,
      activityType,
      activityData ? JSON.stringify(activityData) : null
    );
    
    return result.lastInsertRowid;
  } catch (err) {
    console.error('Error auto-logging activity:', err);
    return null;
  }
}

// Export router and utility functions
module.exports = {
  router,
  logActivity
};

// Export only the router as default (for Express use)
module.exports = router;