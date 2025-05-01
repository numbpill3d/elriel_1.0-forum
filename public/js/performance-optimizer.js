/**
 * Elriel - Performance Optimizer
 * This script improves performance across the application
 */

document.addEventListener('DOMContentLoaded', function() {
  // Lazy load images
  setupLazyLoading();
  
  // Optimize animations
  optimizeAnimations();
  
  // Debounce event handlers
  setupEventDebouncing();
  
  // Optimize 3D rendering if available
  optimize3DRendering();
  
  // Monitor performance
  setupPerformanceMonitoring();
  
  console.log('Performance optimizations initialized');
});

/**
 * Set up lazy loading for images
 */
function setupLazyLoading() {
  // Check if IntersectionObserver is available
  if ('IntersectionObserver' in window) {
    // Create config for IntersectionObserver
    const config = {
      rootMargin: '50px 0px',
      threshold: 0.01
    };
    
    // Create observer for images
    const imgObserver = new IntersectionObserver(function(entries, self) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.getAttribute('data-src');
          
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            
            // Add fade-in effect
            img.style.opacity = 0;
            img.onload = function() {
              img.style.transition = 'opacity 0.5s ease';
              img.style.opacity = 1;
            };
          }
          
          // Stop observing this element
          self.unobserve(img);
        }
      });
    }, config);
    
    // Find all images with data-src attribute
    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => {
      imgObserver.observe(img);
    });
    
    // Also handle background images
    const lazyBackgrounds = document.querySelectorAll('[data-background]');
    lazyBackgrounds.forEach(element => {
      imgObserver.observe(element);
    });
    
    // Create observer for background images
    const bgObserver = new IntersectionObserver(function(entries, self) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          const bg = element.getAttribute('data-background');
          
          if (bg) {
            element.style.backgroundImage = `url(${bg})`;
            element.removeAttribute('data-background');
          }
          
          // Stop observing this element
          self.unobserve(element);
        }
      });
    }, config);
    
    // Find all elements with data-background attribute
    lazyBackgrounds.forEach(element => {
      bgObserver.observe(element);
    });
  } else {
    // Fallback for browsers without IntersectionObserver
    // Load all images immediately
    document.querySelectorAll('img[data-src]').forEach(img => {
      img.src = img.getAttribute('data-src');
      img.removeAttribute('data-src');
    });
    
    document.querySelectorAll('[data-background]').forEach(element => {
      element.style.backgroundImage = `url(${element.getAttribute('data-background')})`;
      element.removeAttribute('data-background');
    });
  }
  
  // Convert existing images to lazy loading
  function convertImagesToLazyLoad() {
    document.querySelectorAll('img:not([data-src])').forEach(img => {
      // Skip images that are already loaded or don't have a src
      if (!img.src || img.complete || img.getAttribute('data-src')) return;
      
      // Skip small images like icons
      if (img.width < 50 && img.height < 50) return;
      
      // Skip images that are already in viewport
      const rect = img.getBoundingClientRect();
      if (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth
      ) return;
      
      // Set data-src and remove src
      img.setAttribute('data-src', img.src);
      img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
    });
  }
  
  // Don't convert on small pages
  if (document.body.scrollHeight > window.innerHeight * 2) {
    convertImagesToLazyLoad();
  }
}

/**
 * Optimize animations
 */
function optimizeAnimations() {
  // Check if the browser supports requestAnimationFrame
  const requestAnimationFrame = 
    window.requestAnimationFrame || 
    window.mozRequestAnimationFrame || 
    window.webkitRequestAnimationFrame || 
    window.msRequestAnimationFrame;
  
  // If not supported, do nothing
  if (!requestAnimationFrame) return;
  
  // Add will-change property to animated elements
  const animatedElements = document.querySelectorAll('.glitch, .blink, [class*="anim"], [class*="glitch"]');
  animatedElements.forEach(element => {
    element.style.willChange = 'transform, opacity';
  });
  
  // Reduce animation complexity on low-end devices
  if (isLowEndDevice()) {
    // Add class to body for CSS targeting
    document.body.classList.add('low-performance-device');
    
    // Add styles to reduce animation complexity
    const reducedAnimationStyles = document.createElement('style');
    reducedAnimationStyles.textContent = `
      body.low-performance-device .glitch::before,
      body.low-performance-device .glitch::after {
        display: none !important;
      }
      
      body.low-performance-device .noise-overlay {
        opacity: 0.005 !important;
      }
      
      body.low-performance-device .scan-lines {
        opacity: 0.3 !important;
      }
      
      body.low-performance-device * {
        animation-duration: 1.5s !important;
      }
      
      @media (max-width: 768px) {
        body.low-performance-device .noise-overlay {
          display: none !important;
        }
      }
    `;
    
    document.head.appendChild(reducedAnimationStyles);
  }
}

/**
 * Set up event debouncing
 */
function setupEventDebouncing() {
  // Debounce function
  function debounce(func, wait) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }
  
  // Throttle function
  function throttle(func, limit) {
    let inThrottle;
    return function() {
      const context = this;
      const args = arguments;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
  
  // Debounce resize event
  const originalResize = window.onresize;
  window.onresize = debounce(function(e) {
    if (originalResize) originalResize(e);
    
    // Dispatch custom event
    const event = new CustomEvent('elrielResize', {
      detail: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
    
    document.dispatchEvent(event);
  }, 100);
  
  // Throttle scroll event
  const originalScroll = window.onscroll;
  window.onscroll = throttle(function(e) {
    if (originalScroll) originalScroll(e);
    
    // Dispatch custom event
    const event = new CustomEvent('elrielScroll', {
      detail: {
        scrollY: window.scrollY,
        scrollX: window.scrollX
      }
    });
    
    document.dispatchEvent(event);
  }, 100);
  
  // Expose debounce and throttle functions globally
  window.elrielDebounce = debounce;
  window.elrielThrottle = throttle;
}

/**
 * Optimize 3D rendering if available
 */
function optimize3DRendering() {
  // Check if Three.js is being used
  if (window.THREE) {
    console.log('Optimizing 3D rendering');
    
    // Lower quality for mobile or low-end devices
    if (isLowEndDevice() || window.innerWidth < 768) {
      // Find all 3D renderers
      if (window.elrielGlyph3D) {
        // Reduce complexity
        window.elrielGlyph3D.forEach(renderer => {
          if (renderer.setQuality) {
            renderer.setQuality('low');
          }
        });
      }
      
      // If there's a global THREE object, adjust its settings
      if (window.THREE) {
        // Reduce shadow map size
        THREE.Object3D.DefaultUp.set(0, 1, 0);
        
        // Patch renderer creation to use lower quality
        const originalWebGLRenderer = THREE.WebGLRenderer;
        THREE.WebGLRenderer = function(parameters) {
          parameters = parameters || {};
          parameters.antialias = false;
          parameters.precision = 'lowp';
          parameters.powerPreference = 'low-power';
          
          return new originalWebGLRenderer(parameters);
        };
      }
    }
  }
}

/**
 * Set up performance monitoring
 */
function setupPerformanceMonitoring() {
  // Only monitor in development mode
  if (window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')) {
    return;
  }
  
  // Create performance monitor
  const monitor = document.createElement('div');
  monitor.className = 'performance-monitor';
  monitor.style.cssText = `
    position: fixed;
    bottom: 10px;
    left: 10px;
    background-color: rgba(0, 0, 0, 0.7);
    color: #00ff00;
    font-family: monospace;
    font-size: 12px;
    padding: 5px;
    border: 1px solid #00ff00;
    z-index: 9999;
    display: none;
  `;
  
  // Add toggle button
  const toggleButton = document.createElement('button');
  toggleButton.textContent = 'PERF';
  toggleButton.style.cssText = `
    position: fixed;
    bottom: 10px;
    left: 10px;
    background-color: rgba(0, 0, 0, 0.7);
    color: #00ff00;
    font-family: monospace;
    font-size: 12px;
    padding: 5px;
    border: 1px solid #00ff00;
    z-index: 10000;
    cursor: pointer;
  `;
  
  toggleButton.addEventListener('click', function() {
    if (monitor.style.display === 'none') {
      monitor.style.display = 'block';
      toggleButton.style.display = 'none';
      startMonitoring();
    } else {
      monitor.style.display = 'none';
      toggleButton.style.display = 'block';
      stopMonitoring();
    }
  });
  
  document.body.appendChild(monitor);
  document.body.appendChild(toggleButton);
  
  let monitoringInterval;
  let frames = 0;
  let lastTime = performance.now();
  let fps = 0;
  
  function startMonitoring() {
    monitoringInterval = setInterval(updateMonitor, 1000);
    requestAnimationFrame(countFrame);
  }
  
  function stopMonitoring() {
    clearInterval(monitoringInterval);
  }
  
  function countFrame() {
    frames++;
    requestAnimationFrame(countFrame);
  }
  
  function updateMonitor() {
    const now = performance.now();
    fps = Math.round((frames * 1000) / (now - lastTime));
    frames = 0;
    lastTime = now;
    
    // Get memory usage if available
    let memory = 'N/A';
    if (window.performance && window.performance.memory) {
      memory = Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024)) + 'MB';
    }
    
    // Update monitor content
    monitor.innerHTML = `
      FPS: ${fps}<br>
      Memory: ${memory}<br>
      Viewport: ${window.innerWidth}x${window.innerHeight}<br>
      Low-end: ${isLowEndDevice() ? 'Yes' : 'No'}
    `;
    
    // Add warning color if FPS is low
    if (fps < 30) {
      monitor.style.color = '#ff0000';
    } else if (fps < 50) {
      monitor.style.color = '#ffff00';
    } else {
      monitor.style.color = '#00ff00';
    }
  }
}

/**
 * Check if the device is low-end
 */
function isLowEndDevice() {
  // Check for hardware concurrency (CPU cores)
  const lowConcurrency = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
  
  // Check for device memory
  const lowMemory = navigator.deviceMemory && navigator.deviceMemory <= 4;
  
  // Check for mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Check for low-end GPU (indirect check via canvas performance)
  let lowGPU = false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      
      // Check for known low-end GPU indicators
      lowGPU = /Intel|HD Graphics|Iris|GMA|Mali-|Adreno|PowerVR/i.test(renderer);
    }
  } catch (e) {
    // If we can't check, assume it might be low-end
    lowGPU = true;
  }
  
  // Return true if any of the checks indicate a low-end device
  return (lowConcurrency || lowMemory || (isMobile && lowGPU));
}

// Expose performance functions globally
window.elrielPerformance = {
  setupLazyLoading,
  optimizeAnimations,
  setupEventDebouncing,
  optimize3DRendering,
  setupPerformanceMonitoring,
  isLowEndDevice
};
