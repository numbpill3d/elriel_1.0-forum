// Elriel - Whisper Routes
// Handles the Whisperboard for anonymous messages

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Database = require('better-sqlite3');
const db = new Database('./db/elriel.db', { verbose: console.log });

// Serve Whisperboard page
router.get('/board', (req, res) => {
  try {
    // Get recent whispers
    const whispers = db.prepare(`
      SELECT w.*, g.svg_data as glyph_svg
      FROM whispers w
      LEFT JOIN glyphs g ON w.glyph_id = g.id
      WHERE w.is_encrypted = 0
      ORDER BY w.created_at DESC
      LIMIT 50
    `).all();
    
    // Pass data to the frontend
    const data = {
      whispers,
      user: req.session.user || null
    };
    
    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/whisper/board.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));
    
    res.send(html);
  } catch (err) {
    console.error('Error loading Whisperboard:', err);
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Serve new whisper page
router.get('/new', (req, res) => {
  try {
    // Get user's glyphs if logged in
    let glyphs = [];
    if (req.session.user) {
      glyphs = db.prepare(`
        SELECT * FROM glyphs 
        WHERE user_id = ? 
        ORDER BY created_at DESC
      `).all(req.session.user.id);
    }
    
    // Pass data to the frontend
    const data = {
      glyphs,
      user: req.session.user || null
    };
    
    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/whisper/new.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));
    
    res.send(html);
  } catch (err) {
    console.error('Error loading new whisper page:', err);
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Create a new whisper
router.post('/create', (req, res) => {
  try {
    const { content, glyphId, isEncrypted } = req.body;
    
    // Validate input
    if (!content) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        message: 'Whisper content is required.' 
      });
    }
    
    // Check if glyph belongs to user if provided
    if (glyphId && req.session.user) {
      const glyph = db.prepare('SELECT * FROM glyphs WHERE id = ? AND user_id = ?')
        .get(glyphId, req.session.user.id);
      
      if (!glyph) {
        return res.status(404).json({ 
          error: 'Glyph not found', 
          message: 'The requested glyph does not exist or does not belong to you.' 
        });
      }
    } else if (glyphId && !req.session.user) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        message: 'You must be logged in to use a personal glyph.' 
      });
    }
    
    // Generate encryption key if whisper is encrypted
    let encryptionKey = null;
    if (isEncrypted === '1' || isEncrypted === true) {
      encryptionKey = crypto.randomBytes(16).toString('hex');
    }
    
    // Insert whisper
    const result = db.prepare(`
      INSERT INTO whispers (
        content, glyph_id, is_encrypted, encryption_key
      )
      VALUES (?, ?, ?, ?)
    `).run(
      content,
      glyphId || null,
      isEncrypted === '1' || isEncrypted === true ? 1 : 0,
      encryptionKey
    );
    
    if (result.changes === 0) {
      throw new Error('Failed to create whisper');
    }
    
    // Return success with whisper ID and encryption key if applicable
    const response = { 
      success: true, 
      message: 'Whisper successfully transmitted to the board', 
      whisperId: result.lastInsertRowid 
    };
    
    if (encryptionKey) {
      response.encryptionKey = encryptionKey;
      response.message += '. Save your encryption key to access this whisper later.';
    }
    
    res.status(201).json(response);
  } catch (err) {
    console.error('Whisper creation error:', err);
    res.status(500).json({ 
      error: 'System error', 
      message: 'Terminal connection unstable. Try again later.' 
    });
  }
});

// View a specific whisper
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { key } = req.query; // Encryption key for encrypted whispers
    
    // Get whisper
    const whisper = db.prepare(`
      SELECT w.*, g.svg_data as glyph_svg
      FROM whispers w
      LEFT JOIN glyphs g ON w.glyph_id = g.id
      WHERE w.id = ?
    `).get(id);
    
    if (!whisper) {
      return res.status(404).sendFile(path.join(__dirname, '../views/404.html'));
    }
    
    // Check if whisper is encrypted and key is provided
    if (whisper.is_encrypted === 1 && whisper.encryption_key !== key) {
      // Serve the encrypted whisper view that prompts for key
      let html = fs.readFileSync(path.join(__dirname, '../views/whisper/encrypted.html'), 'utf8');
      html = html.replace('__WHISPER_ID__', id);
      return res.send(html);
    }
    
    // Pass data to the frontend
    const data = {
      whisper,
      user: req.session.user || null
    };
    
    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/whisper/view.html'), 'utf8');
    html = html.replace('__DATA__', JSON.stringify(data));
    
    res.send(html);
  } catch (err) {
    console.error('Error viewing whisper:', err);
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Check encryption key for encrypted whisper
router.post('/check-key/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { key } = req.body;
    
    if (!key) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        message: 'Encryption key is required.' 
      });
    }
    
    // Check if key is valid
    const whisper = db.prepare('SELECT encryption_key FROM whispers WHERE id = ? AND is_encrypted = 1')
      .get(id);
    
    if (!whisper) {
      return res.status(404).json({ 
        error: 'Whisper not found', 
        message: 'The requested whisper does not exist or is not encrypted.' 
      });
    }
    
    if (whisper.encryption_key !== key) {
      return res.status(401).json({ 
        error: 'Invalid key', 
        message: 'The provided encryption key is invalid.' 
      });
    }
    
    // Key is valid, redirect to whisper with key
    res.json({ 
      success: true, 
      redirectUrl: `/whisper/${id}?key=${key}` 
    });
  } catch (err) {
    console.error('Check encryption key error:', err);
    res.status(500).json({ 
      error: 'System error', 
      message: 'Terminal connection unstable. Try again later.' 
    });
  }
});

// Generate a random anonymous glyph for whispers
router.get('/generate-anon-glyph', (req, res) => {
  try {
    // Generate a random seed
    const seed = crypto.randomBytes(16).toString('hex');
    
    // Generate SVG data
    const svgData = generateAnonGlyphSVG(seed);
    
    res.json({
      success: true,
      glyph: {
        svgData
      }
    });
  } catch (err) {
    console.error('Anonymous glyph generation error:', err);
    res.status(500).json({ 
      error: 'System error', 
      message: 'Terminal connection unstable. Try again later.' 
    });
  }
});

// Helper function to generate SVG data for an anonymous glyph
function generateAnonGlyphSVG(seed) {
  // Create a deterministic random number generator based on the seed
  const random = seedRandom(seed);
  
  // Generate SVG elements
  const width = 100;
  const height = 100;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Start SVG
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="anon-glyph-svg">`;
  
  // Add a background circle
  svg += `<circle cx="${centerX}" cy="${centerY}" r="${centerX - 5}" fill="none" stroke="#333" stroke-width="1" />`;
  
  // Generate a simple symbol
  const symbolType = Math.floor(random() * 5);
  
  switch (symbolType) {
    case 0: // Cross
      svg += `<line x1="${centerX - 20}" y1="${centerY}" x2="${centerX + 20}" y2="${centerY}" stroke="#666" stroke-width="1" />`;
      svg += `<line x1="${centerX}" y1="${centerY - 20}" x2="${centerX}" y2="${centerY + 20}" stroke="#666" stroke-width="1" />`;
      break;
    case 1: // Triangle
      svg += `<polygon points="${centerX},${centerY - 20} ${centerX - 20},${centerY + 10} ${centerX + 20},${centerY + 10}" fill="none" stroke="#666" stroke-width="1" />`;
      break;
    case 2: // Square
      svg += `<rect x="${centerX - 15}" y="${centerY - 15}" width="30" height="30" fill="none" stroke="#666" stroke-width="1" />`;
      break;
    case 3: // Circle
      svg += `<circle cx="${centerX}" cy="${centerY}" r="15" fill="none" stroke="#666" stroke-width="1" />`;
      break;
    case 4: // Star
      const points = 5;
      const outerRadius = 20;
      const innerRadius = 10;
      let starPoints = '';
      
      for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (Math.PI / points) * i;
        const x = centerX + radius * Math.sin(angle);
        const y = centerY - radius * Math.cos(angle);
        starPoints += `${x},${y} `;
      }
      
      svg += `<polygon points="${starPoints}" fill="none" stroke="#666" stroke-width="1" />`;
      break;
  }
  
  // Add a few random dots
  for (let i = 0; i < 5; i++) {
    const angle = random() * Math.PI * 2;
    const distance = 5 + random() * 25;
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    svg += `<circle cx="${x}" cy="${y}" r="1" fill="#999" />`;
  }
  
  // Close SVG
  svg += '</svg>';
  
  return svg;
}

// Deterministic random number generator based on a seed
function seedRandom(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  
  // Simple LCG random number generator
  let state = hash;
  return function() {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

module.exports = router;