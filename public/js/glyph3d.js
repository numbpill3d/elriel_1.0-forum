/**
 * ELRIEL - GLYPH CRUCIBLE 3D VISUALIZER
 * Enhanced 3D visualization for glyphs using Three.js
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('[GLYPH3D] Initializing 3D visualization system...');

  // Wait for crucible to be ready
  document.addEventListener('crucibleReady', initGlyph3D);
});

/**
 * Glyph3DRenderer Class - Main 3D rendering handler for enhanced/extreme modes
 */
class Glyph3DRenderer {
  constructor(containerId, options = {}) {
    console.log('[GLYPH3D] Glyph3DRenderer initialized with options:', options);
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error('[GLYPH3D] Container not found:', containerId);
      return;
    }
    this.options = {
      seed: options.seed || Date.now().toString(),
      complexity: options.complexity || 'medium',
      shape: options.shape || 'sphere',
      color: options.color || 0x00ff00,
      rotationSpeed: options.rotationSpeed || 0.01,
      autoRotate: options.autoRotate !== false,
      opacity: options.opacity || 1,
      size: options.size || 1,
      glowColor: options.glowColor || 0x00ff00,
      glowIntensity: options.glowIntensity || 1,
      glowAnimation: options.glowAnimation || 'none',
      glowSpeed: options.glowSpeed || 1,
      secondaryColor: options.secondaryColor || 0x0088ff,
      bloomEffect: options.bloomEffect || 'none',
      secondaryGlow: options.secondaryGlow || false,
      haloEffect: options.haloEffect || false,
      wireframeStyle: options.wireframeStyle || 'none',
      metalness: options.metalness || 0.3,
      roughness: options.roughness || 0.4,
      animationStyle: options.animationStyle || 'rotate',
      animationSpeed: options.animationSpeed || 1,
      animationPath: options.animationPath || 'none',
      elementAnimation: options.elementAnimation || 'none',
      morphIntensity: options.morphIntensity || 0.5,
      reverseAnimation: options.reverseAnimation || false,
      alternateAnimation: options.alternateAnimation || false,
      particleEnabled: options.particleEnabled || 'basic',
      particleCount: options.particleCount || 50,
      particleSize: options.particleSize || 0.05,
      particleColor: options.particleColor || 0x00ff88,
      particleShape: options.particleShape || 'point',
      particleSpeed: options.particleSpeed || 1,
      particleOpacity: options.particleOpacity || 0.7,
      particleBehavior: options.particleBehavior || 'orbit',
      auraEnabled: options.auraEnabled || 'none',
      auraColor: options.auraColor || 0x5500ff,
      auraIntensity: options.auraIntensity || 1,
      auraSize: options.auraSize || 1.5,
      auraPulseRate: options.auraPulseRate || 1,
      auraSecondaryColor: options.auraSecondaryColor || 0xff00aa,
      auraStyle: options.auraStyle || 'smooth',
      auraRotate: options.auraRotate !== false,
      textureMap: options.textureMap || 'none',
      textureScale: options.textureScale || 1,
      textureOpacity: options.textureOpacity || 0.8,
      normalMap: options.normalMap || 'none',
      normalScale: options.normalScale || 1,
      displacementMap: options.displacementMap || 'none',
      displacementScale: options.displacementScale || 0.5,
      animateTexture: options.animateTexture || false,
      ...options
    };
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.glyphObject = null;
    this.active = true;
    this.animationId = null;
    this.init();
  }

  init() {
    this.renderer = this.createRenderer();
    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.createGlyphModel(); // Initial model creation
    this.animate();
    console.log('[GLYPH3D] Renderer fully initialized');
  }

  createRenderer() {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    const width = this.container.clientWidth;
    const height = width; // Square
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = 'auto';
    renderer.domElement.id = 'glyph-3d-canvas-' + Date.now(); // Unique ID
    this.container.appendChild(renderer.domElement);
    return renderer;
  }

  createScene() {
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.1);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x00ff00, 0.2);
    scene.add(ambientLight);

    // Directional light
    const directionalLight = new THREE.DirectionalLight(0x00ff00, 0.8);
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);

    // Point light for glow
    const pointLight = new THREE.PointLight(this.options.glowColor, this.options.glowIntensity, 10);
    pointLight.position.set(0, 0, 3);
    scene.add(pointLight);

    return scene;
  }

  createCamera() {
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 5;
    return camera;
  }

  createGlyphModel(svgData = null) {
    console.log('[GLYPH3D] Creating glyph model with options:', this.options);
    if (this.glyphObject) {
      this.scene.remove(this.glyphObject);
    }

    const glyphGroup = new THREE.Group();

    // If SVG data provided, parse it; else generate procedural based on seed/complexity
    if (svgData) {
      // Parse SVG string to DOM for element extraction
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgData, 'image/svg+xml');
      const svgElement = svgDoc.documentElement;

      const paths = svgElement.querySelectorAll('path');
      const circles = svgElement.querySelectorAll('circle');
      const lines = svgElement.querySelectorAll('line');
      const rects = svgElement.querySelectorAll('rect'); // New: handle rects

      console.log('[GLYPH3D] Processing SVG: paths=', paths.length, 'circles=', circles.length, 'lines=', lines.length, 'rects=', rects.length);

      let viewBox = svgElement.getAttribute('viewBox');
      let svgWidth = 100, svgHeight = 100;
      if (viewBox) {
        const parts = viewBox.split(' ').map(Number);
        if (parts.length >= 4) {
          svgWidth = parts[2];
          svgHeight = parts[3];
        }
      }
      const scale = 3 / Math.max(svgWidth, svgHeight);

      // Paths (if any)
      paths.forEach((path, index) => {
        // Simplified: create torus knot for paths
        const geometry = new THREE.TorusKnotGeometry(0.5, 0.1, 64, 8, 2, 3);
        const material = new THREE.MeshPhongMaterial({
          color: this.options.color,
          emissive: 0x003300,
          wireframe: this.options.wireframeStyle !== 'none',
          transparent: true,
          opacity: this.options.opacity,
          metalness: this.options.metalness,
          roughness: this.options.roughness
        });
        const mesh = new THREE.Mesh(geometry, material);
        const angle = (index / paths.length) * Math.PI * 2;
        const radius = 1.5 + Math.random() * 0.5;
        mesh.position.x = Math.cos(angle) * radius;
        mesh.position.y = Math.sin(angle) * radius;
        mesh.position.z = (Math.random() - 0.5) * 2;
        mesh.scale.setScalar(this.options.size);
        glyphGroup.add(mesh);
      });

      // Circles as spheres
      circles.forEach((circle) => {
        const radius = parseFloat(circle.getAttribute('r')) * scale * 0.1;
        const geometry = new THREE.SphereGeometry(radius || 0.2, 16, 16);
        const material = new THREE.MeshPhongMaterial({
          color: this.options.secondaryColor,
          emissive: 0x003366,
          transparent: true,
          opacity: this.options.opacity * 0.8
        });
        const mesh = new THREE.Mesh(geometry, material);
        const cx = parseFloat(circle.getAttribute('cx')) * scale;
        const cy = parseFloat(circle.getAttribute('cy')) * scale;
        mesh.position.set(cx, -cy, 0.5);
        mesh.scale.setScalar(this.options.size);
        glyphGroup.add(mesh);
      });

      // Lines as cylinders
      lines.forEach((line) => {
        const x1 = parseFloat(line.getAttribute('x1')) * scale;
        const y1 = parseFloat(line.getAttribute('y1')) * scale;
        const x2 = parseFloat(line.getAttribute('x2')) * scale;
        const y2 = parseFloat(line.getAttribute('y2')) * scale;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const geometry = new THREE.CylinderGeometry(0.05, 0.05, length, 8);
        const material = new THREE.MeshPhongMaterial({
          color: this.options.color,
          emissive: 0x330000,
          transparent: true,
          opacity: this.options.opacity * 0.7
        });
        const cylinder = new THREE.Mesh(geometry, material);
        cylinder.position.set((x1 + x2) / 2, -(y1 + y2) / 2, 0.2);
        cylinder.rotation.z = Math.atan2(dy, dx);
        cylinder.rotation.x = Math.PI / 2;
        cylinder.scale.setScalar(this.options.size);
        glyphGroup.add(cylinder);
      });

      // New: Rects as boxes
      rects.forEach((rect) => {
        const x = parseFloat(rect.getAttribute('x')) * scale;
        const y = parseFloat(rect.getAttribute('y')) * scale;
        const width = parseFloat(rect.getAttribute('width')) * scale;
        const height = parseFloat(rect.getAttribute('height')) * scale;
        const rx = parseFloat(rect.getAttribute('rx')) || 0;
        const ry = parseFloat(rect.getAttribute('ry')) || 0;
        // Simplified box for rect
        const geometry = new THREE.BoxGeometry(width, height, 0.1);
        const material = new THREE.MeshPhongMaterial({
          color: 0x8a2be2, // Glitch color
          transparent: true,
          opacity: parseFloat(rect.getAttribute('opacity')) || 0.2
        });
        const box = new THREE.Mesh(geometry, material);
        box.position.set(x + width/2, -(y + height/2), 0);
        if (rx > 0) {
          // Approximate rounded with smaller box or ignore for simplicity
        }
        box.scale.setScalar(this.options.size);
        glyphGroup.add(box);
      });

    } else {
      // Procedural fallback based on options.shape
      let geometry;
      switch (this.options.shape) {
        case 'sphere':
          geometry = new THREE.SphereGeometry(1, 32, 32);
          break;
        case 'cube':
          geometry = new THREE.BoxGeometry(2, 2, 2);
          break;
        case 'cylinder':
          geometry = new THREE.CylinderGeometry(1, 1, 2, 32);
          break;
        case 'torus':
          geometry = new THREE.TorusGeometry(1, 0.4, 16, 100);
          break;
        case 'tetrahedron':
          geometry = new THREE.TetrahedronGeometry(1.5);
          break;
        case 'octahedron':
          geometry = new THREE.OctahedronGeometry(1.5);
          break;
        case 'dodecahedron':
          geometry = new THREE.DodecahedronGeometry(1.2);
          break;
        case 'icosahedron':
          geometry = new THREE.IcosahedronGeometry(1.2);
          break;
        case 'torusknot':
          geometry = new THREE.TorusKnotGeometry(1, 0.4, 100, 16);
          break;
        default:
          geometry = new THREE.OctahedronGeometry(1, 1); // Core fallback
      }
      const material = new THREE.MeshPhongMaterial({
        color: this.options.color,
        emissive: 0x003300,
        wireframe: this.options.wireframeStyle !== 'none',
        transparent: true,
        opacity: this.options.opacity,
        metalness: this.options.metalness,
        roughness: this.options.roughness
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.scale.setScalar(this.options.size);
      glyphGroup.add(mesh);
    }

    // Add particles if enabled
    if (this.options.particleEnabled !== 'off') {
      const particleGeometry = new THREE.BufferGeometry();
      const particleCount = this.options.particleCount;
      const particlePositions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const radius = 2 + Math.random() * 1;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        particlePositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
        particlePositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        particlePositions[i3 + 2] = radius * Math.cos(phi);
      }
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
      const particleMaterial = new THREE.PointsMaterial({
        color: this.options.particleColor,
        size: this.options.particleSize,
        transparent: true,
        opacity: this.options.particleOpacity,
        sizeAttenuation: true
      });
      const particles = new THREE.Points(particleGeometry, particleMaterial);
      glyphGroup.add(particles);
    }

    glyphGroup.position.set(0, 0, 0);
    this.glyphObject = glyphGroup;
    this.scene.add(glyphGroup);

    this.renderer.render(this.scene, this.camera);
  }

  updateOptions(newOptions) {
    console.log('[GLYPH3D] Updating options:', newOptions);
    Object.assign(this.options, newOptions);
    // Update lights/materials if changed
    if (this.scene) {
      const pointLight = this.scene.children.find(child => child.type === 'PointLight');
      if (pointLight) {
        pointLight.color.setHex(this.options.glowColor);
        pointLight.intensity = this.options.glowIntensity;
      }
    }
    // Recreate model with new options
    this.createGlyphModel();
  }

  animate() {
    if (!this.active) return;
    this.animationId = requestAnimationFrame(() => this.animate());

    if (this.glyphObject) {
      if (this.options.autoRotate) {
        this.glyphObject.rotation.y += this.options.rotationSpeed;
        this.glyphObject.rotation.z += this.options.rotationSpeed * 0.5;
      }
      // Add camera movement
      const t = Date.now() * 0.001 * this.options.animationSpeed;
      this.camera.position.x = Math.sin(t * 0.5) * 0.5;
      this.camera.position.y = Math.cos(t * 0.3) * 0.5;
      this.camera.lookAt(this.scene.position);
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    console.log('[GLYPH3D] Destroying renderer');
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.glyphObject) {
      this.scene.remove(this.glyphObject);
    }
    if (this.renderer) {
      this.container.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }
    this.active = false;
  }
}

window.Glyph3DRenderer = Glyph3DRenderer; // Export globally

/**
 * Initialize 3D visualization components
 */
function initGlyph3D() {
  // Check if visualization target exists
  const visualizationTarget = document.getElementById('generated-glyph-svg');
  if (!visualizationTarget) {
    console.warn('[GLYPH3D] Visualization target not found');
    return;
  }

  // Add visualization controls to the Crucible
  addVisualizationControls();

  // Initialize 3D system but don't start rendering until needed
  const renderer = createRenderer(visualizationTarget);
  const scene = createScene();
  const camera = createCamera();
  let glyphObject = null;

  // Store in global scope for other functions
  window.glyph3D = {
    renderer,
    scene,
    camera,
    glyphObject,
    active: false,
    visualizationTarget
  };

  // Listen for glyph generation to create 3D visualization
  const generateButton = document.getElementById('generate-glyph');
  if (generateButton) {
    // We'll hook into the existing generation flow
    // Wait for generation to complete, then offer 3D view
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && visualizationTarget.querySelector('svg')) {
          // SVG has been added - offer 3D visualization
          setTimeout(() => {
            offerVisualization(visualizationTarget);
          }, 2000); // Wait for SVG animations to complete
        }
      });
    });

    observer.observe(visualizationTarget, { childList: true });
  }

  // Add animation loop
  function animate() {
    if (!window.glyph3D.active) return;

    requestAnimationFrame(animate);

    // Rotate the glyph object if it exists
    if (window.glyph3D.glyphObject) {
      window.glyph3D.glyphObject.rotation.y += 0.005;
      window.glyph3D.glyphObject.rotation.z += 0.002;
    }

    // Add subtle camera movement
    const t = Date.now() * 0.001;
    window.glyph3D.camera.position.x = Math.sin(t * 0.5) * 0.5;
    window.glyph3D.camera.position.y = Math.cos(t * 0.3) * 0.5;
    window.glyph3D.camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }

  // Start animation loop
  animate();

  console.log('[GLYPH3D] 3D visualization system initialized');
}

/**
 * Create WebGL renderer
 */
function createRenderer(container) {
  // Create renderer
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });

  // Set size to match container
  const width = container.clientWidth;
  const height = container.clientWidth; // Make it square
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Set styling
  renderer.domElement.style.display = 'none'; // Hidden initially
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = 'auto';
  renderer.domElement.style.aspectRatio = '1/1';
  renderer.domElement.style.borderRadius = '5px';
  renderer.domElement.id = 'glyph-3d-canvas';

  // Set clear color to transparent
  renderer.setClearColor(0x000000, 0);

  // Store for later
  container.appendChild(renderer.domElement);

  return renderer;
}

/**
 * Create scene with appropriate lighting
 */
function createScene() {
  const scene = new THREE.Scene();

  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0x00ff00, 0.2);
  scene.add(ambientLight);

  // Add directional light
  const directionalLight = new THREE.DirectionalLight(0x00ff00, 0.8);
  directionalLight.position.set(0, 1, 1);
  scene.add(directionalLight);

  // Add point light for glow effect
  const pointLight = new THREE.PointLight(0x00ff00, 1, 10);
  pointLight.position.set(0, 0, 3);
  scene.add(pointLight);

  // Add subtle fog for depth
  scene.fog = new THREE.FogExp2(0x000000, 0.1);

  return scene;
}

/**
 * Create camera with appropriate position
 */
function createCamera() {
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.z = 5;
  return camera;
}

/**
 * Add visualization controls to the UI
 */
function addVisualizationControls() {
  const actionsContainer = document.querySelector('.glyph-actions');
  if (!actionsContainer) return;

  // Create 3D view toggle button
  const viewButton = document.createElement('button');
  viewButton.id = 'toggle-3d-view';
  viewButton.className = 'button hover-glow';
  viewButton.textContent = 'TOGGLE 3D VIEW';
  viewButton.style.display = 'none'; // Hidden initially

  // Add to container
  actionsContainer.appendChild(viewButton);

  // Add event listener
  viewButton.addEventListener('click', toggleVisualization);
}

/**
 * Offer 3D visualization option after glyph generation
 */
function offerVisualization(container) {
  const viewButton = document.getElementById('toggle-3d-view');
  if (viewButton) {
    viewButton.style.display = 'inline-block';

    // Extract SVG data to create 3D model
    const svgElement = container.querySelector('svg');
    if (svgElement) {
      // Pre-create the 3D model so it's ready
      createGlyphModel(svgElement);
    }

    // Add log entry
    if (typeof addCrucibleLog === 'function') {
      addCrucibleLog('3D visualization available for current glyph');
    }
  }
}

/**
 * Toggle between 3D and 2D visualization
 */
function toggleVisualization() {
  const canvas = document.getElementById('glyph-3d-canvas');
  const svgContainer = window.glyph3D.visualizationTarget.querySelector('svg');

  if (!canvas || !svgContainer) return;

  // Toggle state
  window.glyph3D.active = !window.glyph3D.active;

  if (window.glyph3D.active) {
    // Switch to 3D view
    canvas.style.display = 'block';
    svgContainer.style.display = 'none';
    document.getElementById('toggle-3d-view').textContent = 'SHOW 2D VIEW';

    // Play effect
    if (window.elrielTerminal && window.elrielTerminal.playGlitchSound) {
      window.elrielTerminal.playGlitchSound();
    }

    // Add log entry
    if (typeof addCrucibleLog === 'function') {
      addCrucibleLog('Switched to 3D glyph visualization mode');
    }
  } else {
    // Switch to 2D view
    canvas.style.display = 'none';
    svgContainer.style.display = 'block';
    document.getElementById('toggle-3d-view').textContent = 'SHOW 3D VIEW';

    // Add log entry
    if (typeof addCrucibleLog === 'function') {
      addCrucibleLog('Switched to 2D glyph visualization mode');
    }
  }
}

/**
 * Create 3D model from SVG glyph
 */
function createGlyphModel(svgElement) {
  // First clear any existing object
  if (window.glyph3D.glyphObject) {
    window.glyph3D.scene.remove(window.glyph3D.glyphObject);
    window.glyph3D.glyphObject = null;
  }

  // Create a group to hold all parts of the glyph
  const glyphGroup = new THREE.Group();

  try {
    // Extract path data from SVG
    const paths = svgElement.querySelectorAll('path');
    const circles = svgElement.querySelectorAll('circle');
    const lines = svgElement.querySelectorAll('line');

    // Get SVG viewBox for scaling
    let viewBox = svgElement.getAttribute('viewBox');
    let svgWidth = 100, svgHeight = 100;

    if (viewBox) {
      const parts = viewBox.split(' ').map(Number);
      if (parts.length >= 4) {
        svgWidth = parts[2];
        svgHeight = parts[3];
      }
    }

    // Scale factor to normalize to THREE.js coordinate system
    const scale = 3 / Math.max(svgWidth, svgHeight);

    // Process each path
    paths.forEach((_, index) => {
      // Create simple shape for each path
      const geometry = new THREE.TorusKnotGeometry(0.5, 0.1, 64, 8, 2, 3);
      const material = new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        emissive: 0x003300,
        wireframe: Math.random() > 0.7,
        transparent: true,
        opacity: 0.9,
      });

      const mesh = new THREE.Mesh(geometry, material);

      // Position randomly but organized in a circular pattern
      const angle = (index / paths.length) * Math.PI * 2;
      const radius = 1.5 + Math.random() * 0.5;
      mesh.position.x = Math.cos(angle) * radius;
      mesh.position.y = Math.sin(angle) * radius;
      mesh.position.z = (Math.random() - 0.5) * 2;

      // Add to group
      glyphGroup.add(mesh);
    });

    // Process circles as spheres
    circles.forEach((circle) => {
      const radius = parseFloat(circle.getAttribute('r')) * scale * 0.1;
      const geometry = new THREE.SphereGeometry(radius || 0.2, 16, 16);
      const material = new THREE.MeshPhongMaterial({
        color: 0x00aaff,
        emissive: 0x003366,
        transparent: true,
        opacity: 0.8,
      });

      const mesh = new THREE.Mesh(geometry, material);

      // Position based on circle center
      const cx = parseFloat(circle.getAttribute('cx')) * scale;
      const cy = parseFloat(circle.getAttribute('cy')) * scale;
      mesh.position.x = cx;
      mesh.position.y = -cy; // Flip Y to match THREE.js coordinate system
      mesh.position.z = 0.5;

      // Add to group
      glyphGroup.add(mesh);
    });

    // Process lines as cylinders
    lines.forEach((line) => {
      const x1 = parseFloat(line.getAttribute('x1')) * scale;
      const y1 = parseFloat(line.getAttribute('y1')) * scale;
      const x2 = parseFloat(line.getAttribute('x2')) * scale;
      const y2 = parseFloat(line.getAttribute('y2')) * scale;

      // Calculate length and position
      const dx = x2 - x1;
      const dy = y2 - y1;
      const length = Math.sqrt(dx * dx + dy * dy);

      // Create cylinder
      const geometry = new THREE.CylinderGeometry(0.05, 0.05, length, 8);
      const material = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        emissive: 0x330000,
        transparent: true,
        opacity: 0.7,
      });

      const cylinder = new THREE.Mesh(geometry, material);

      // Position and rotate to match line
      cylinder.position.x = (x1 + x2) / 2;
      cylinder.position.y = -(y1 + y2) / 2; // Flip Y
      cylinder.position.z = 0.2;

      // Rotate to match line orientation
      cylinder.rotation.z = Math.atan2(dy, dx);
      cylinder.rotation.x = Math.PI / 2;

      // Add to group
      glyphGroup.add(cylinder);
    });

    // Add central core geometry for all glyphs
    const coreGeometry = new THREE.OctahedronGeometry(0.5, 1);
    const coreMaterial = new THREE.MeshPhongMaterial({
      color: 0xaaffaa,
      emissive: 0x003300,
      wireframe: true,
      transparent: true,
      opacity: 0.8,
    });

    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    glyphGroup.add(core);

    // Add particle system for effect
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 500;
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      // Create particles in a spherical volume
      const radius = 2 + Math.random() * 1;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      particlePositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i3 + 2] = radius * Math.cos(phi);
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0x00ff00,
      size: 0.05,
      transparent: true,
      opacity: 0.5,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    glyphGroup.add(particles);

    // Center the entire model
    glyphGroup.position.set(0, 0, 0);

    // Store for animation
    window.glyph3D.glyphObject = glyphGroup;
    window.glyph3D.scene.add(glyphGroup);

    // Render once
    window.glyph3D.renderer.render(window.glyph3D.scene, window.glyph3D.camera);

    console.log('[GLYPH3D] 3D model created successfully');
  } catch (error) {
    console.error('[GLYPH3D] Error creating 3D model:', error);

    // Create a fallback object if SVG parsing fails
    createFallbackGlyphModel();
  }
}

/**
 * Create a fallback 3D model when SVG parsing fails
 */
function createFallbackGlyphModel() {
  console.log('[GLYPH3D] Creating fallback model');

  // Create a group to hold all parts of the glyph
  const glyphGroup = new THREE.Group();

  // Create a complex geometric shape
  const geometry = new THREE.TorusKnotGeometry(1, 0.3, 128, 16, 2, 3);
  const material = new THREE.MeshPhongMaterial({
    color: 0x00ff00,
    emissive: 0x003300,
    wireframe: true,
    transparent: true,
    opacity: 0.8
  });

  const centralForm = new THREE.Mesh(geometry, material);
  glyphGroup.add(centralForm);

  // Add some orbiting spheres
  for (let i = 0; i < 8; i++) {
    const sphereGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      color: 0x00aaff,
      emissive: 0x003366
    });

    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

    // Position in orbit
    const angle = (i / 8) * Math.PI * 2;
    const radius = 2;
    sphere.position.x = Math.cos(angle) * radius;
    sphere.position.y = Math.sin(angle) * radius;

    glyphGroup.add(sphere);
  }

  // Add particle system
  const particleGeometry = new THREE.BufferGeometry();
  const particleCount = 300;
  const particlePositions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    // Create particles in a spherical volume
    const radius = 1.5 + Math.random() * 1;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;

    particlePositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    particlePositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    particlePositions[i3 + 2] = radius * Math.cos(phi);
  }

  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

  const particleMaterial = new THREE.PointsMaterial({
    color: 0x00ff00,
    size: 0.05,
    transparent: true,
    opacity: 0.5
  });

  const particles = new THREE.Points(particleGeometry, particleMaterial);
  glyphGroup.add(particles);

  // Store for animation
  window.glyph3D.glyphObject = glyphGroup;
  window.glyph3D.scene.add(glyphGroup);

  // Render once
  window.glyph3D.renderer.render(window.glyph3D.scene, window.glyph3D.camera);
}

/**
 * Handle window resize
 */
window.addEventListener('resize', function() {
  if (!window.glyph3D || !window.glyph3D.active) return;

  const container = window.glyph3D.visualizationTarget;
  const width = container.clientWidth;
  const height = container.clientWidth; // Keep square aspect ratio

  window.glyph3D.camera.aspect = width / height;
  window.glyph3D.camera.updateProjectionMatrix();

  window.glyph3D.renderer.setSize(width, height);
});