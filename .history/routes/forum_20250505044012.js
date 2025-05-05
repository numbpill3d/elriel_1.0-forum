// Elriel - Forum Routes
// Handles forum, topics, and comments

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const db = new Database('./db/elriel.db', { verbose: console.log });

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).redirect('/auth/login');
  }
  next();
};

// Get user rewards and signature
const getUserForumData = (userId) => {
  // Get user rewards
  const userRewards = db.prepare(`
    SELECT r.*, ur.is_equipped
    FROM user_rewards ur
    JOIN repute_rewards r ON ur.reward_id = r.id
    WHERE ur.user_id = ? AND ur.is_equipped = 1
  `).all(userId);
  
  // Get user signature
  let signature = db.prepare(`
    SELECT * FROM user_signatures
    WHERE user_id = ? AND is_enabled = 1
  `).get(userId);
  
  return { userRewards, signature };
};

// Serve forums listing
router.get('/', (req, res) => {
  try {
    // Get all forums
    const forums = db.prepare(`
      SELECT f.*, 
        (SELECT COUNT(*) FROM forum_topics WHERE forum_id = f.id) as topic_count,
        (SELECT COUNT(*) FROM forum_comments c 
         JOIN forum_topics t ON c.topic_id = t.id 
         WHERE t.forum_id = f.id) as comment_count,
        (SELECT MAX(c.created_at) FROM forum_comments c
         JOIN forum_topics t ON c.topic_id = t.id
         WHERE t.forum_id = f.id) as last_activity
      FROM forums f
      ORDER BY f.position ASC
    `).all();
    
    // Pass data to the frontend
    const data = {
      forums,
      user: req.session.user || null
    };
    
    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/forum/index.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));
    
    res.send(html);
  } catch (err) {
    console.error('Error loading forums:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Serve single forum view (topic listing)
router.get('/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    
    // Get forum
    const forum = db.prepare(`
      SELECT * FROM forums WHERE slug = ?
    `).get(slug);
    
    if (!forum) {
      return res.status(404).sendFile(path.join(__dirname, '../views/404.html'));
    }
    
    // Get topics
    const topics = db.prepare(`
      SELECT t.*, u.username,
        (SELECT COUNT(*) FROM forum_comments WHERE topic_id = t.id) as comment_count,
        (SELECT MAX(created_at) FROM forum_comments WHERE topic_id = t.id) as last_activity
      FROM forum_topics t
      JOIN users u ON t.user_id = u.id
      WHERE t.forum_id = ?
      ORDER BY t.is_pinned DESC, t.created_at DESC
    `).all(forum.id);
    
    // Pass data to the frontend
    const data = {
      forum,
      topics,
      user: req.session.user || null
    };
    
    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/forum/topics.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));
    
    res.send(html);
  } catch (err) {
    console.error('Error loading forum topics:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Serve create topic page
router.get('/:slug/new', isAuthenticated, (req, res) => {
  try {
    const { slug } = req.params;
    
    // Get forum
    const forum = db.prepare(`
      SELECT * FROM forums WHERE slug = ?
    `).get(slug);
    
    if (!forum) {
      return res.status(404).sendFile(path.join(__dirname, '../views/404.html'));
    }
    
    // Pass data to the frontend
    const data = {
      forum,
      user: req.session.user
    };
    
    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/forum/new-topic.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));
    
    res.send(html);
  } catch (err) {
    console.error('Error loading new topic page:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Create new topic
router.post('/:slug/create', isAuthenticated, (req, res) => {
  try {
    const { slug } = req.params;
    const { title, content } = req.body;
    
    // Validate input
    if (!title || !content) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        message: 'Title and content are required.' 
      });
    }
    
    // Get forum
    const forum = db.prepare(`
      SELECT id FROM forums WHERE slug = ?
    `).get(slug);
    
    if (!forum) {
      return res.status(404).json({ 
        error: 'Forum not found', 
        message: 'The requested forum does not exist.' 
      });
    }
    
    // Insert topic
    const result = db.prepare(`
      INSERT INTO forum_topics (forum_id, user_id, title, content)
      VALUES (?, ?, ?, ?)
    `).run(forum.id, req.session.user.id, title, content);
    
    if (result.changes === 0) {
      throw new Error('Failed to create topic');
    }
    
    // Award reputation for creating a topic
    db.prepare(`
      UPDATE profiles SET reputation = reputation + 5 WHERE user_id = ?
    `).run(req.session.user.id);
    
    // Return success
    res.status(201).json({ 
      success: true, 
      message: 'Topic created successfully',
      topicId: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Error creating topic:', err);
    res.status(500).json({ 
      error: 'System error', 
      message: 'Terminal connection unstable. Try again later.' 
    });
  }
});

// View topic
router.get('/topic/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Get topic
    const topic = db.prepare(`
      SELECT t.*, u.username, f.title as forum_title, f.slug as forum_slug
      FROM forum_topics t
      JOIN users u ON t.user_id = u.id
      JOIN forums f ON t.forum_id = f.id
      WHERE t.id = ?
    `).get(id);
    
    if (!topic) {
      return res.status(404).sendFile(path.join(__dirname, '../views/404.html'));
    }
    
    // Increment view count
    db.prepare(`
      UPDATE forum_topics SET view_count = view_count + 1 WHERE id = ?
    `).run(id);
    
    // Get comments
    const comments = db.prepare(`
      SELECT c.*, u.username, p.glyph_id, g.svg_data as glyph_svg,
        p.district_id, d.name as district_name
      FROM forum_comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN glyphs g ON p.glyph_id = g.id
      LEFT JOIN districts d ON p.district_id = d.id
      WHERE c.topic_id = ?
      ORDER BY c.created_at ASC
    `).all(id);
    
    // Get forum data for each user
    const enhancedComments = comments.map(comment => {
      const userData = getUserForumData(comment.user_id);
      return {
        ...comment,
        userRewards: userData.userRewards,
        signature: userData.signature
      };
    });
    
    // Get topic creator's forum data
    const topicUserData = getUserForumData(topic.user_id);
    
    // Get user profile
    const topicProfile = db.prepare(`
      SELECT p.*, g.svg_data as glyph_svg, d.name as district_name
      FROM profiles p
      LEFT JOIN glyphs g ON p.glyph_id = g.id
      LEFT JOIN districts d ON p.district_id = d.id
      WHERE p.user_id = ?
    `).get(topic.user_id);
    
    // Pass data to the frontend
    const data = {
      topic: {
        ...topic,
        userRewards: topicUserData.userRewards,
        signature: topicUserData.signature,
        profile: topicProfile
      },
      comments: enhancedComments,
      user: req.session.user || null,
      isOwner: req.session.user && req.session.user.id === topic.user_id
    };
    
    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/forum/view-topic.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));
    
    res.send(html);
  } catch (err) {
    console.error('Error viewing topic:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Add comment to topic
router.post('/topic/:id/comment', isAuthenticated, (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    // Validate input
    if (!content) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        message: 'Comment content is required.' 
      });
    }
    
    // Check if topic exists
    const topic = db.prepare(`
      SELECT id FROM forum_topics WHERE id = ?
    `).get(id);
    
    if (!topic) {
      return res.status(404).json({ 
        error: 'Topic not found', 
        message: 'The requested topic does not exist.' 
      });
    }
    
    // Insert comment
    const result = db.prepare(`
      INSERT INTO forum_comments (topic_id, user_id, content)
      VALUES (?, ?, ?)
    `).run(id, req.session.user.id, content);
    
    if (result.changes === 0) {
      throw new Error('Failed to add comment');
    }
    
    // Award reputation for commenting
    db.prepare(`
      UPDATE profiles SET reputation = reputation + 2 WHERE user_id = ?
    `).run(req.session.user.id);
    
    // Update topic updated_at timestamp
    db.prepare(`
      UPDATE forum_topics SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(id);
    
    // Return success
    res.status(201).json({ 
      success: true, 
      message: 'Comment added successfully',
      commentId: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ 
      error: 'System error', 
      message: 'Terminal connection unstable. Try again later.' 
    });
  }
});

// Update user signature
router.post('/signature/update', isAuthenticated, (req, res) => {
  try {
    const { content, isEnabled } = req.body;
    
    // Get existing signature
    const existingSignature = db.prepare(`
      SELECT id FROM user_signatures WHERE user_id = ?
    `).get(req.session.user.id);
    
    // Insert or update signature
    let result;
    if (existingSignature) {
      result = db.prepare(`
        UPDATE user_signatures 
        SET content = ?, is_enabled = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(
        content, 
        isEnabled === true || isEnabled === '1' ? 1 : 0, 
        req.session.user.id
      );
    } else {
      result = db.prepare(`
        INSERT INTO user_signatures (user_id, content, is_enabled)
        VALUES (?, ?, ?)
      `).run(
        req.session.user.id, 
        content, 
        isEnabled === true || isEnabled === '1' ? 1 : 0
      );
    }
    
    if (result.changes === 0) {
      throw new Error('Failed to update signature');
    }
    
    // Return success
    res.json({ 
      success: true, 
      message: 'Signature updated successfully' 
    });
  } catch (err) {
    console.error('Error updating signature:', err);
    res.status(500).json({ 
      error: 'System error', 
      message: 'Terminal connection unstable. Try again later.' 
    });
  }
});

// Toggle reward equipped status
router.post('/rewards/toggle/:rewardId', isAuthenticated, (req, res) => {
  try {
    const { rewardId } = req.params;
    const { isEquipped } = req.body;
    
    // Check if user has this reward
    const userReward = db.prepare(`
      SELECT ur.* 
      FROM user_rewards ur
      JOIN repute_rewards r ON ur.reward_id = r.id
      WHERE ur.user_id = ? AND ur.reward_id = ?
    `).get(req.session.user.id, rewardId);
    
    if (!userReward) {
      return res.status(404).json({ 
        error: 'Reward not found', 
        message: 'You do not have this reward.' 
      });
    }
    
    // Update equipped status
    const result = db.prepare(`
      UPDATE user_rewards SET is_equipped = ?
      WHERE user_id = ? AND reward_id = ?
    `).run(
      isEquipped === true || isEquipped === '1' ? 1 : 0,
      req.session.user.id,
      rewardId
    );
    
    if (result.changes === 0) {
      throw new Error('Failed to update reward status');
    }
    
    // Return success
    res.json({ 
      success: true, 
      message: 'Reward status updated successfully' 
    });
  } catch (err) {
    console.error('Error updating reward status:', err);
    res.status(500).json({ 
      error: 'System error', 
      message: 'Terminal connection unstable. Try again later.' 
    });
  }
});

// Serve Scrapyard page
router.get('/scrapyard', (req, res) => {
  try {
    // Get all scrapyard items (using forum_topics table but for scrapyard content)
    const scrapyardItems = db.prepare(`
      SELECT t.*, u.username,
        (SELECT COUNT(*) FROM forum_comments WHERE topic_id = t.id) as comment_count,
        (SELECT MAX(created_at) FROM forum_comments WHERE topic_id = t.id) as last_activity
      FROM forum_topics t
      JOIN users u ON t.user_id = u.id
      WHERE t.forum_id = (SELECT id FROM forums WHERE slug = 'scrapyard')
      ORDER BY t.created_at DESC
    `).all();
    
    // Pass data to the frontend
    const data = {
      items: scrapyardItems,
      user: req.session.user || null
    };
    
    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/forum/scrapyard.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));
    
    res.send(html);
  } catch (err) {
    console.error('Error loading scrapyard:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

module.exports = router;