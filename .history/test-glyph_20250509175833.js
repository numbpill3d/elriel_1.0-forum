// Test script for glyph generation

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
  console.log('Generating SVG with seed:', seed, 'and complexity:', complexity);
  
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

  console.log('Parameters:', { numPoints, numLines, numCircles });

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
  for (let i = 0; i < numLines && points.length > 0; i++) {
    const startPointIndex = Math.floor(random() * points.length);
    const endPointIndex = Math.floor(random() * points.length);
    
    const startPoint = points[startPointIndex];
    const endPoint = points[endPointIndex];
    
    if (startPoint && endPoint) {
      svg += `<line x1="${startPoint.x}" y1="${startPoint.y}" x2="${endPoint.x}" y2="${endPoint.y}" stroke="#c0c0c0" stroke-width="1.5" />`;
    }
  }

  // Add circles
  for (let i = 0; i < numCircles && points.length > 0; i++) {
    const centerPointIndex = Math.floor(random() * points.length);
    const centerPoint = points[centerPointIndex];
    
    if (centerPoint) {
      const radius = 5 + random() * 20;
      svg += `<circle cx="${centerPoint.x}" cy="${centerPoint.y}" r="${radius}" fill="none" stroke="#a0a0a0" stroke-width="1" />`;
    }
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

  console.log('SVG generated successfully');
  return svg;
}

// Helper function to generate audio data for a glyph
function generateGlyphAudio(seed, complexity) {
  console.log('Generating audio with seed:', seed, 'and complexity:', complexity);
  
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

  console.log('Audio data generated successfully');
  return JSON.stringify(audioData);
}

// Test the functions
try {
  console.log('Starting glyph generation test...');
  
  // Test with a fixed seed
  const testSeed = 'test-seed-123';
  const complexity = 'medium';
  
  console.log('Generating glyph with seed:', testSeed, 'and complexity:', complexity);
  
  // Generate SVG
  const svgData = generateGlyphSVG(testSeed, complexity);
  console.log('SVG data length:', svgData.length);
  
  // Generate audio data
  const audioData = generateGlyphAudio(testSeed, complexity);
  console.log('Audio data length:', audioData.length);
  
  console.log('Test completed successfully!');
} catch (error) {
  console.error('Test failed with error:', error);
  console.error('Error stack:', error.stack);
}
