/**
 * Elriel - 3D Glyph Renderer
 * 
 * Provides 3D rendering capabilities for the Elriel sigils/glyphs
 * using Three.js to create interactive, rotating 3D representations.
 */

class Glyph3DRenderer {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container with ID "${containerId}" not found`);
      return;
    }

    // Default options
    this.options = Object.assign({
      rotationSpeed: 0.01,
      color: '#00ff00',
      shape: 'sphere', // sphere, cube, cylinder, torus, custom
      autoRotate: true,
      size: 1.0,
      complexity: 'medium',
      glowIntensity: 1.5,
      backgroundColor: '#000000',
      particleCount: 50,
      seed: null
    }, options);

    // Store created meshes for later manipulation
    this.meshes = [];
    this.glowMeshes = [];
    this.particles = [];
    this.glyphGroup = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.animationFrameId = null;
    this.isActive = false;

    // Create seeded random function if seed is provided
    if (this.options.seed) {
      this.randomFn = this.createSeededRandom(this.options.seed);
    } else {
      this.randomFn = Math.random;
    }

    // Initialize the 3D renderer
    this.init();
  }

  /**
   * Create a seeded random number generator
   */
  createSeededRandom(seed) {
    let m = 0x80000000; // 2**31
    let a = 1103515245;
    let c = 12345;
    let state = seed || Math.floor(Math.random() * m);
    
    return function() {
      state = (a * state + c) % m;
      return state / m;
    };
  }

  /**
   * Initialize the 3D scene
   */
  init() {
    // Get container dimensions
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.options.backgroundColor);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.z = 5;

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    this.scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    // Add point light for glow effect
    const pointLight = new THREE.PointLight(this.hexToRgb(this.options.color), 1, 100);
    pointLight.position.set(0, 0, 2);
    this.scene.add(pointLight);

    // Create a group to hold all glyph elements
    this.glyphGroup = new THREE.Group();
    this.scene.add(this.glyphGroup);

    // Generate the 3D glyph based on options
    this.generateGlyph();
    
    // Add particle effects
    this.addParticles();

    // Start animation
    this.isActive = true;
    this.animate();

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  /**
   * Generate a 3D glyph based on the options
   */
  generateGlyph() {
    const color = new THREE.Color(this.options.color);
    const glowColor = new THREE.Color(this.options.color);
    glowColor.multiplyScalar(this.options.glowIntensity);
    
    // Create material with glow effect
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: glowColor,
      emissiveIntensity: 0.5,
      metalness: 0.3,
      roughness: 0.4,
      wireframe: this.options.complexity === 'low' ? true : false
    });

    // Create the main geometry based on shape
    let geometry;
    
    switch (this.options.shape) {
      case 'cube':
        geometry = new THREE.BoxGeometry(2, 2, 2);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(1, 1, 2, 32);
        break;
      case 'torus':
        geometry = new THREE.TorusGeometry(1, 0.4, 16, 50);
        break;
      case 'tetrahedron':
        geometry = new THREE.TetrahedronGeometry(1.5);
        break;
      case 'octahedron':
        geometry = new THREE.OctahedronGeometry(1.5);
        break;
      case 'dodecahedron':
        geometry = new THREE.DodecahedronGeometry(1.5);
        break;
      case 'icosahedron':
        geometry = new THREE.IcosahedronGeometry(1.5);
        break;
      case 'sphere':
      default:
        geometry = new THREE.SphereGeometry(1.5, 32, 32);
        break;
    }
    
    // Create main mesh
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set(this.options.size, this.options.size, this.options.size);
    this.glyphGroup.add(mesh);
    this.meshes.push(mesh);

    // Add complexity to the glyph based on settings
    if (this.options.complexity === 'high' || this.options.complexity === 'medium') {
      this.addComplexityElements();
    }
  }

  /**
   * Add additional elements to create more complex glyphs
   */
  addComplexityElements() {
    const color = new THREE.Color(this.options.color);
    
    // Create material for secondary elements
    const secondaryMaterial = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.3,
      metalness: 0.5,
      roughness: 0.5,
      transparent: true,
      opacity: 0.8,
      wireframe: this.options.complexity === 'high' ? false : true
    });

    // Number of secondary elements based on complexity
    const count = this.options.complexity === 'high' ? 5 : 3;
    
    // Add orbital rings
    for (let i = 0; i < count; i++) {
      const radius = 2 + (i * 0.2);
      const tubeRadius = 0.02 + (this.randomFn() * 0.05);
      const ringGeometry = new THREE.TorusGeometry(radius, tubeRadius, 16, 100);
      
      const ring = new THREE.Mesh(ringGeometry, secondaryMaterial);
      
      // Random rotation to create more dynamic look
      ring.rotation.x = this.randomFn() * Math.PI;
      ring.rotation.y = this.randomFn() * Math.PI;
      
      this.glyphGroup.add(ring);
      this.meshes.push(ring);
    }

    // Add accent geometric shapes
    if (this.options.complexity === 'high') {
      const shapes = ['sphere', 'box', 'tetrahedron', 'octahedron'];
      
      for (let i = 0; i < 8; i++) {
        const shape = shapes[Math.floor(this.randomFn() * shapes.length)];
        let accentGeometry;
        
        switch (shape) {
          case 'box':
            accentGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
            break;
          case 'tetrahedron':
            accentGeometry = new THREE.TetrahedronGeometry(0.2);
            break;
          case 'octahedron':
            accentGeometry = new THREE.OctahedronGeometry(0.2);
            break;
          case 'sphere':
          default:
            accentGeometry = new THREE.SphereGeometry(0.15, 16, 16);
            break;
        }
        
        const accent = new THREE.Mesh(accentGeometry, secondaryMaterial);
        
        // Position around the main shape in 3D space
        const theta = this.randomFn() * Math.PI * 2;
        const phi = Math.acos(2 * this.randomFn() - 1);
        const radius = 1.5 + (this.randomFn() * 0.5);
        
        accent.position.x = radius * Math.sin(phi) * Math.cos(theta);
        accent.position.y = radius * Math.sin(phi) * Math.sin(theta);
        accent.position.z = radius * Math.cos(phi);
        
        this.glyphGroup.add(accent);
        this.meshes.push(accent);
      }
    }

    // Add connecting lines between elements
    if (this.options.complexity === 'high') {
      const lineMaterial = new THREE.LineBasicMaterial({
        color: this.options.color,
        transparent: true,
        opacity: 0.5
      });
      
      for (let i = 0; i < this.meshes.length - 1; i++) {
        if (this.randomFn() > 0.7) continue; // Only connect some elements
        
        const startPoint = this.meshes[i].position.clone();
        const endPoint = this.meshes[i + 1].position.clone();
        
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([startPoint, endPoint]);
        const line = new THREE.Line(lineGeometry, lineMaterial);
        
        this.glyphGroup.add(line);
      }
    }
  }

  /**
   * Add particle effects around the glyph
   */
  addParticles() {
    const particleCount = this.options.complexity === 'high' ? 
      this.options.particleCount : 
      (this.options.complexity === 'medium' ? this.options.particleCount / 2 : this.options.particleCount / 4);
    
    const particleGeometry = new THREE.BufferGeometry();
    const particleMaterial = new THREE.PointsMaterial({
      color: this.options.color,
      size: 0.05,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    
    const positions = [];
    
    for (let i = 0; i < particleCount; i++) {
      // Position particles in a spherical volume around the glyph
      const theta = this.randomFn() * Math.PI * 2;
      const phi = Math.acos(2 * this.randomFn() - 1);
      const radius = 2 + (this.randomFn() * 3);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      positions.push(x, y, z);
      
      // Store particle data for animation
      this.particles.push({
        index: i * 3,
        speed: 0.001 + (this.randomFn() * 0.005),
        theta: theta,
        phi: phi,
        radius: radius,
        originalRadius: radius
      });
    }
    
    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    this.glyphGroup.add(particleSystem);
    
    // Store reference to position attribute for animation
    this.particlePositions = particleGeometry.attributes.position;
  }

  /**
   * Animate the glyph
   */
  animate() {
    if (!this.isActive) return;
    
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    
    // Rotate the entire glyph group
    if (this.options.autoRotate) {
      this.glyphGroup.rotation.y += this.options.rotationSpeed;
      this.glyphGroup.rotation.z += this.options.rotationSpeed * 0.5;
    }
    
    // Animate individual elements if complexity is high
    if (this.options.complexity === 'high' || this.options.complexity === 'medium') {
      for (let i = 1; i < this.meshes.length; i++) {
        if (i % 2 === 0) {
          this.meshes[i].rotation.x += this.options.rotationSpeed * 0.3;
          this.meshes[i].rotation.z += this.options.rotationSpeed * 0.2;
        } else {
          this.meshes[i].rotation.y += this.options.rotationSpeed * 0.4;
        }
      }
    }
    
    // Animate particles
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      
      // Update theta to create orbital movement
      particle.theta += particle.speed;
      
      // Make radius pulse slightly
      particle.radius = particle.originalRadius + (Math.sin(Date.now() * 0.001 + i) * 0.1);
      
      // Calculate new position
      const x = particle.radius * Math.sin(particle.phi) * Math.cos(particle.theta);
      const y = particle.radius * Math.sin(particle.phi) * Math.sin(particle.theta);
      const z = particle.radius * Math.cos(particle.phi);
      
      // Update particle position
      this.particlePositions.array[particle.index] = x;
      this.particlePositions.array[particle.index + 1] = y;
      this.particlePositions.array[particle.index + 2] = z;
    }
    
    // Mark particles for update
    this.particlePositions.needsUpdate = true;
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Handle window resize
   */
  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Update options and regenerate the glyph
   */
  updateOptions(options) {
    this.options = Object.assign(this.options, options);
    
    // Clear existing elements
    while (this.glyphGroup.children.length > 0) {
      const child = this.glyphGroup.children[0];
      this.glyphGroup.remove(child);
      
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
    
    this.meshes = [];
    this.glowMeshes = [];
    this.particles = [];
    
    // Regenerate the glyph
    this.generateGlyph();
    this.addParticles();
  }

  /**
   * Toggle auto-rotation
   */
  toggleRotation() {
    this.options.autoRotate = !this.options.autoRotate;
  }

  /**
   * Set rotation speed
   */
  setRotationSpeed(speed) {
    this.options.rotationSpeed = speed;
  }

  /**
   * Stop animation and clean up
   */
  destroy() {
    this.isActive = false;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    // Remove renderer from DOM
    if (this.renderer && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
    
    // Dispose of geometries and materials
    if (this.meshes) {
      this.meshes.forEach(mesh => {
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(material => material.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });
    }
    
    // Clear references
    this.meshes = [];
    this.glowMeshes = [];
    this.particles = [];
    this.glyphGroup = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
  }

  /**
   * Convert hex color to RGB
   */
  hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse hex values
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    return new THREE.Color(r, g, b);
  }

  /**
   * Generate a data URL of the current glyph view
   */
  toDataURL() {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL();
  }
}