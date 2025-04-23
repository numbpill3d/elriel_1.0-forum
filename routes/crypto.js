// Elriel - Crypto Routes
// Handles encryption and decryption of messages

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Database = require('better-sqlite3');
const db = new Database('./db/elriel.db', { verbose: console.log });

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'You must be logged in to use encryption features.'
    });
  }
  next();
};

// Generate a random key for encryption
const generateKey = (length = 16) => {
  return crypto.randomBytes(length).toString('hex');
};

// Encrypt a message using AES-256-GCM
const encryptMessage = (message, key) => {
  try {
    // Create a unique initialization vector
    const iv = crypto.randomBytes(16);
    
    // Create cipher with key and iv
    const cipher = crypto.createCipheriv(
      'aes-256-gcm', 
      Buffer.from(key, 'hex'), 
      iv
    );
    
    // Encrypt the message
    let encrypted = cipher.update(message, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get the auth tag
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Return the encrypted data, iv, and auth tag
    return {
      encrypted: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
};

// Decrypt a message using AES-256-GCM
const decryptMessage = (encrypted, iv, authTag, key) => {
  try {
    // Create decipher
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(key, 'hex'),
      Buffer.from(iv, 'hex')
    );
    
    // Set auth tag
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt message. Incorrect key or corrupted data.');
  }
};

// Encrypt a message
router.post('/encrypt', isAuthenticated, (req, res) => {
  try {
    const { message, recipientId, publicHint } = req.body;
    
    if (!message) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Message is required'
      });
    }
    
    // Generate encryption key
    const encryptionKey = generateKey();
    
    // Encrypt the message
    const encryptedData = encryptMessage(message, encryptionKey);
    
    // Store the message if a recipient is specified
    if (recipientId) {
      // Check if recipient exists
      const recipient = db.prepare('SELECT id FROM users WHERE id = ?').get(recipientId);
      
      if (!recipient) {
        return res.status(404).json({
          error: 'Recipient not found',
          message: 'The specified recipient does not exist.'
        });
      }
      
      // Store encrypted message
      const result = db.prepare(`
        INSERT INTO encrypted_messages 
        (sender_id, recipient_id, encrypted_content, public_hint)
        VALUES (?, ?, ?, ?)
      `).run(
        req.session.user.id,
        recipientId,
        JSON.stringify(encryptedData),
        publicHint || null
      );
      
      // Log the activity
      db.prepare(`
        INSERT INTO user_activity_logs
        (user_id, activity_type, description)
        VALUES (?, ?, ?)
      `).run(
        req.session.user.id,
        'message_sent',
        `Sent an encrypted message to user #${recipientId}`
      );
      
      // Check if user has the Cryptographer badge
      const hasBadge = db.prepare(`
        SELECT ur.id FROM user_rewards ur
        JOIN rewards r ON ur.reward_id = r.id
        WHERE ur.user_id = ? AND r.name = 'Cryptographer'
      `).get(req.session.user.id);
      
      // Award the badge if they don't have it
      if (!hasBadge) {
        const cryptoBadge = db.prepare(`
          SELECT id FROM rewards WHERE name = 'Cryptographer'
        `).get();
        
        if (cryptoBadge) {
          db.prepare(`
            INSERT INTO user_rewards (user_id, reward_id)
            VALUES (?, ?)
          `).run(req.session.user.id, cryptoBadge.id);
          
          // Update user reputation
          updateUserReputation(req.session.user.id, 25);
        }
      }
      
      return res.json({
        success: true,
        message: 'Message encrypted and sent.',
        encryptionKey: encryptionKey,
        messageId: result.lastInsertRowid
      });
    }
    
    // If no recipient, just return the encrypted data and key
    res.json({
      success: true,
      message: 'Message encrypted.',
      encryptedData: encryptedData,
      encryptionKey: encryptionKey
    });
    
  } catch (err) {
    console.error('Encryption error:', err);
    res.status(500).json({
      error: 'Encryption failed',
      message: 'Could not encrypt the message. Try again later.'
    });
  }
});

// Decrypt a message
router.post('/decrypt', isAuthenticated, (req, res) => {
  try {
    const { messageId, encryptionKey, encryptedData } = req.body;
    
    if (!encryptionKey) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Encryption key is required'
      });
    }
    
    let encrypted, iv, authTag;
    
    // If messageId is provided, fetch the encrypted message from the database
    if (messageId) {
      const message = db.prepare(`
        SELECT encrypted_content, sender_id, recipient_id, is_read
        FROM encrypted_messages 
        WHERE id = ? AND (sender_id = ? OR recipient_id = ?)
      `).get(messageId, req.session.user.id, req.session.user.id);
      
      if (!message) {
        return res.status(404).json({
          error: 'Message not found',
          message: 'The specified message does not exist or you do not have permission to decrypt it.'
        });
      }
      
      const parsedContent = JSON.parse(message.encrypted_content);
      encrypted = parsedContent.encrypted;
      iv = parsedContent.iv;
      authTag = parsedContent.authTag;
      
      // Mark message as read if user is the recipient
      if (message.recipient_id === req.session.user.id && !message.is_read) {
        db.prepare(`
          UPDATE encrypted_messages SET is_read = 1
          WHERE id = ?
        `).run(messageId);
      }
    } 
    // Otherwise, use the provided encrypted data
    else if (encryptedData) {
      encrypted = encryptedData.encrypted;
      iv = encryptedData.iv;
      authTag = encryptedData.authTag;
    } else {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'Either messageId or encryptedData must be provided'
      });
    }
    
    // Decrypt the message
    try {
      const decryptedMessage = decryptMessage(encrypted, iv, authTag, encryptionKey);
      
      res.json({
        success: true,
        message: 'Message decrypted successfully.',
        decryptedMessage: decryptedMessage
      });
    } catch (decryptErr) {
      res.status(400).json({
        error: 'Decryption failed',
        message: 'Incorrect encryption key or corrupted data.'
      });
    }
    
  } catch (err) {
    console.error('Decryption error:', err);
    res.status(500).json({
      error: 'Decryption failed',
      message: 'Could not decrypt the message. Try again later.'
    });
  }
});

// Get encrypted messages for the current user
router.get('/messages', isAuthenticated, (req, res) => {
  try {
    const messages = db.prepare(`
      SELECT 
        em.id, 
        em.public_hint, 
        em.created_at, 
        em.is_read,
        sender.username as sender_username,
        recipient.username as recipient_username
      FROM encrypted_messages em
      LEFT JOIN users sender ON em.sender_id = sender.id
      LEFT JOIN users recipient ON em.recipient_id = recipient.id
      WHERE em.sender_id = ? OR em.recipient_id = ?
      ORDER BY em.created_at DESC
    `).all(req.session.user.id, req.session.user.id);
    
    res.json({
      success: true,
      messages: messages
    });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({
      error: 'Failed to fetch messages',
      message: 'Could not retrieve encrypted messages. Try again later.'
    });
  }
});

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