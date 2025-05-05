// Elriel - Glyph Routes
// Handles the Glyph Crucible for procedural sigil generation

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
    return res.status(401).redirect('/auth/login');
  }
  next();
};

// Serve Glyph Crucible page
router.get('/crucible', (req, res) => {
  try {
    // Get user's saved glyphs if logged in
    let userGlyphs = [];
    if (req.session.user) {
      userGlyphs = db.prepare(`
        SELECT * FROM glyphs
        WHERE user_id = ?
        ORDER BY created_at DESC
      `).all(req.session.user.id);
    }

    // Pass data to the frontend
    const data = {
      user: req.session.user || null,
      userGlyphs
    };

    // Check what mode is requested
    const mode = req.query.mode || 'normal';

    // Choose template based on mode parameter
    let templatePath;
    if (mode === 'extreme') {
      templatePath = '../views/glyph/crucible-extreme.html';
    } else if (mode === 'enhanced' || req.query.enhanced === '1' || req.query.enhanced === 'true') {
      templatePath = '../views/glyph/crucible-enhanced.html';
    } else {
      templatePath = '../views/glyph/crucible.html';
    }

    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, templatePath), 'utf8');
    const safeData = JSON.stringify(data).replace(/</g, '\\u003c')
                                         .replace(/>/g, '\\u003e')
                                         .replace(/&/g, '\\u0026')
                                         .replace(/'/g, '\\u0027')
                                         .replace(/"/g, '\\"');
    html = html.replace('__DATA__', safeData);

    res.send(html);
  } catch (err) {
    console.error('Error loading Glyph Crucible:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Serve Enhanced Glyph Crucible page
router.get('/crucible-3d', (req, res) => {
  try {
    // Get user's saved glyphs if logged in
    let userGlyphs = [];
    if (req.session.user) {
      userGlyphs = db.prepare(`
        SELECT * FROM glyphs
        WHERE user_id = ?
        ORDER BY created_at DESC
      `).all(req.session.user.id);
    }

    // Pass data to the frontend
    const data = {
      user: req.session.user || null,
      userGlyphs
    };

    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/glyph/crucible-enhanced.html'), 'utf8');
    const safeData = JSON.stringify(data).replace(/</g, '\\u003c')
                                         .replace(/>/g, '\\u003e')
                                         .replace(/&/g, '\\u0026')
                                         .replace(/'/g, '\\u0027')
                                         .replace(/"/g, '\\"');
    html = html.replace('__DATA__', safeData);

    res.send(html);
  } catch (err) {
    console.error('Error loading Enhanced Glyph Crucible:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Generate a new glyph
router.post('/generate', (req, res) => {
  console.log('Received glyph generation request:', req.body);
  try {
    const { seed, complexity } = req.body;
    console.log('Processing with seed:', seed, 'and complexity:', complexity);

    // Generate a random seed if not provided
    const glyphSeed = seed || crypto.randomBytes(16).toString('hex');
    console.log('Using seed:', glyphSeed);

    // Generate SVG data based on the seed
    // This is a placeholder - the actual generation would be more complex
    console.log('Generating SVG data...');
    const svgData = generateGlyphSVG(glyphSeed, complexity || 'medium');
    console.log('SVG data generated successfully');

    // Generate audio data based on the seed
    console.log('Generating audio data...');
    const audioData = generateGlyphAudio(glyphSeed, complexity || 'medium');
    console.log('Audio data generated successfully');

    // Return the generated glyph
    console.log('Sending successful response');
    res.json({
      success: true,
      glyph: {
        seed: glyphSeed,
        svgData,
        audioData
      }
    });
  } catch (err) {
    console.error('Glyph generation error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({
      error: 'System error',
      message: 'Crucible malfunction. Try again later.'
    });
  }
});

// Save a generated glyph
router.post('/save', isAuthenticated, (req, res) => {
  try {
    const {
      svgData,
      audioData,
      seed,
      glyphShape = 'standard',
      glyphColor = '#00ff00',
      glyph3dModel = null
    } = req.body;

    if (!svgData) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'No glyph data provided.'
      });
    }

    // Insert glyph into database with enhanced properties
    const result = db.prepare(`
      INSERT INTO glyphs (
        user_id,
        svg_data,
        audio_data,
        seed,
        glyph_shape,
        glyph_color,
        glyph_3d_model
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.session.user.id,
      svgData,
      audioData,
      seed,
      glyphShape,
      glyphColor,
      glyph3dModel
    );

    if (result.changes === 0) {
      throw new Error('Failed to save glyph');
    }

    // Award reputation for creating a sigil
    db.prepare(`
      UPDATE profiles SET reputation = reputation + 1 WHERE user_id = ?
    `).run(req.session.user.id);

    res.status(201).json({
      success: true,
      message: 'Glyph saved to your collection',
      glyphId: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Glyph save error:', err);
    res.status(500).json({
      error: 'System error',
      message: 'Crucible malfunction. Try again later.'
    });
  }
});

// View a specific glyph
router.get('/view/:id', (req, res) => {
  try {
    const { id } = req.params;

    // Get glyph
    const glyph = db.prepare('SELECT * FROM glyphs WHERE id = ?').get(id);

    if (!glyph) {
      return res.status(404).sendFile(path.join(__dirname, '../views/404.html'));
    }

    // Get glyph owner
    let owner = null;
    if (glyph.user_id) {
      owner = db.prepare('SELECT username FROM users WHERE id = ?').get(glyph.user_id);
    }

    // Pass data to the frontend
    const data = {
      glyph,
      owner,
      user: req.session.user || null,
      isOwner: req.session.user && req.session.user.id === glyph.user_id
    };

    // Inject data into the HTML
    let html = fs.readFileSync(path.join(__dirname, '../views/glyph/view.html'), 'utf8');
    const safeData = JSON.stringify(data).replace(/</g, '\\u003c')
                                         .replace(/>/g, '\\u003e')
                                         .replace(/&/g, '\\u0026')
                                         .replace(/'/g, '\\u0027')
                                         .replace(/"/g, '\\"');
    html = html.replace('__DATA__', safeData);

    res.send(html);
  } catch (err) {
    console.error('Error viewing glyph:', err);
    res.status(500).sendFile(path.join(__dirname, '../views/error.html'));
  }
});

// Delete a glyph
router.delete('/:id', isAuthenticated, (req, res) => {
  try {
    const { id } = req.params;

    // Check if glyph exists and belongs to user
    const glyph = db.prepare('SELECT * FROM glyphs WHERE id = ? AND user_id = ?')
      .get(id, req.session.user.id);

    if (!glyph) {
      return res.status(404).json({
        error: 'Glyph not found',
        message: 'The requested glyph does not exist or does not belong to you.'
      });
    }

    // Delete glyph
    const result = db.prepare('DELETE FROM glyphs WHERE id = ?').run(id);

    if (result.changes === 0) {
      throw new Error('Failed to delete glyph');
    }

    // Check if this was the profile glyph and remove it if so
    db.prepare('UPDATE profiles SET glyph_id = NULL WHERE glyph_id = ?').run(id);

    res.json({
      success: true,
      message: 'Glyph successfully erased from the system'
    });
  } catch (err) {
    console.error('Glyph delete error:', err);
    res.status(500).json({
      error: 'System error',
      message: 'Terminal connection unstable. Try again later.'
    });
  }
});

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

// Helper function to generate SVG data for a glyph
function generateGlyphSVG(seed, complexity) {
  // Create a deterministic random number generator based on the seed
  const random = seedRandom(seed);

  // Set complexity parameters
  let numPoints, numLines, numCircles;
  switch (complexity) {
    case 'low':
      numPoints = 5 + Math.floor(random() * 5);
      numLines = 4 + Math.floor(random() * 4);
      numCircles = 1 + Math.floor(random() * 2);
      break;
    case 'high':
      numPoints = 15 + Math.floor(random() * 10);
      numLines = 12 + Math.floor(random() * 8);
      numCircles = 3 + Math.floor(random() * 4);
      break;
    case 'medium':
    default:
      numPoints = 10 + Math.floor(random() * 5);
      numLines = 8 + Math.floor(random() * 4);
      numCircles = 2 + Math.floor(random() * 2);
      break;
  }

  // Generate SVG elements
  const width = 300;
  const height = 300;
  const centerX = width / 2;
  const centerY = height / 2;

  // Generate points
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = random() * Math.PI * 2;
    const distance = 30 + random() * (centerX - 40);
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    points.push({ x, y });
  }

  // Start SVG
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" class="glyph-svg">`;

  // Add a background circle
  svg += `<circle cx="${centerX}" cy="${centerY}" r="${centerX - 10}" fill="none" stroke="#333" stroke-width="2" />`;

  // Add lines
  for (let i = 0; i < numLines; i++) {
    const startPoint = points[Math.floor(random() * points.length)];
    const endPoint = points[Math.floor(random() * points.length)];
    svg += `<line x1="${startPoint.x}" y1="${startPoint.y}" x2="${endPoint.x}" y2="${endPoint.y}" stroke="#c0c0c0" stroke-width="1.5" />`;
  }

  // Add circles
  for (let i = 0; i < numCircles; i++) {
    const centerPoint = points[Math.floor(random() * points.length)];
    const radius = 5 + random() * 20;
    svg += `<circle cx="${centerPoint.x}" cy="${centerPoint.y}" r="${radius}" fill="none" stroke="#a0a0a0" stroke-width="1" />`;
  }

  // Add points
  for (const point of points) {
    svg += `<circle cx="${point.x}" cy="${point.y}" r="2" fill="#ffffff" />`;
  }

  // Add glitch effects
  const numGlitches = Math.floor(random() * 5) + 2;
  for (let i = 0; i < numGlitches; i++) {
    const x = random() * width;
    const y = random() * height;
    const rectWidth = 10 + random() * 40;
    const rectHeight = 2 + random() * 5;
    svg += `<rect x="${x}" y="${y}" width="${rectWidth}" height="${rectHeight}" fill="#8a2be2" opacity="${0.1 + random() * 0.3}" />`;
  }

  // Close SVG
  svg += '</svg>';

  return svg;
}

// Helper function to generate audio data for a glyph
function generateGlyphAudio(seed, complexity) {
  // Create a deterministic random number generator based on the seed
  const random = seedRandom(seed);

  // Generate audio parameters
  // This would be a JSON representation of audio parameters
  // In a real implementation, this would be used to generate actual audio
  const audioData = {
    baseFrequency: 220 + Math.floor(random() * 220),
    harmonics: [],
    duration: 3 + random() * 2,
    waveform: ['sine', 'square', 'sawtooth', 'triangle'][Math.floor(random() * 4)]
  };

  // Add harmonics based on complexity
  const numHarmonics = complexity === 'low' ? 3 : (complexity === 'medium' ? 5 : 8);
  for (let i = 0; i < numHarmonics; i++) {
    audioData.harmonics.push({
      frequency: audioData.baseFrequency * (i + 1 + random()),
      amplitude: 0.1 + random() * 0.5,
      attack: 0.01 + random() * 0.2,
      decay: 0.1 + random() * 0.3,
      sustain: 0.2 + random() * 0.5,
      release: 0.1 + random() * 0.5
    });
  }

  return JSON.stringify(audioData);
}

module.exports = router;