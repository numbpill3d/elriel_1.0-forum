/**
 * Elriel - Performance Optimizations
 * This file contains functions to optimize the performance of the site
 */

// Initialize performance optimizations when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('[PERFORMANCE] Initializing performance optimizations');
  
  // Detect device capabilities
  detectDeviceCapabilities();
  
  // Apply optimizations based on device capabilities
  applyOptimizations();
  
  // Fix resource paths
  fixResourcePaths();
  
  // Add error handling for resources
  addResourceErrorHandling();
});

/**
 * Detect device capabilities
 */
function detectDeviceCapabilities() {
  // Check if we're on a mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Check if we're on a low-end device
  const isLowEnd = navigator.hardwareConcurrency <= 2 || navigator.deviceMemory <= 2;
  
  // Check if we're on a slow connection
  const isSlowConnection = navigator.connection && 
    (navigator.connection.saveData || 
     navigator.connection.effectiveType === 'slow-2g' ||
     navigator.connection.effectiveType === '2g' ||
     navigator.connection.effectiveType === '3g');
  
  // Store device capabilities
  window.elrielDeviceCapabilities = {
    isMobile,
    isLowEnd,
    isSlowConnection
  };
  
  console.log('[PERFORMANCE] Device capabilities:', window.elrielDeviceCapabilities);
}

/**
 * Apply optimizations based on device capabilities
 */
function applyOptimizations() {
  const { isMobile, isLowEnd, isSlowConnection } = window.elrielDeviceCapabilities || {};
  
  // Optimize animations for mobile devices
  if (isMobile) {
    optimizeMobileAnimations();
  }
  
  // Optimize images for low-end devices or slow connections
  if (isLowEnd || isSlowConnection) {
    optimizeImages();
    deferNonCriticalResources();
  }
  
  // Set up lazy loading for images
  setupLazyLoading();
}

/**
 * Optimize animations for mobile devices
 */
function optimizeMobileAnimations() {
  // Add a class to the body to indicate mobile optimization
  document.body.classList.add('mobile-optimized');
  
  // Add a style element to reduce animations
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    .mobile-optimized .glitch::before,
    .mobile-optimized .glitch::after {
      display: none !important;
    }
    
    .mobile-optimized .scan-line {
      animation-duration: 5s !important;
    }
    
    .mobile-optimized .web1-marquee-content {
      animation-duration: 30s !important;
    }
    
    .mobile-optimized .profile-view-panel {
      animation: none !important;
      box-shadow: 0 0 20px var(--glow-color), inset 0 0 10px rgba(255, 0, 0, 0.2) !important;
    }
  `;
  document.head.appendChild(styleEl);
  
  console.log('[PERFORMANCE] Mobile animations optimized');
}

/**
 * Optimize images for low-end devices or slow connections
 */
function optimizeImages() {
  // Add loading="lazy" to all images
  document.querySelectorAll('img').forEach(img => {
    if (!img.hasAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
    }
    
    // Add error handling
    img.addEventListener('error', function() {
      console.error('[PERFORMANCE] Failed to load image:', img.src);
      
      // Try alternative path
      if (img.src.includes('/images/') && !img.src.includes('/public/')) {
        const altSrc = img.src.replace(/\/images\//, '/public/images/');
        console.log('[PERFORMANCE] Trying alternative image path:', altSrc);
        img.src = altSrc;
      }
    });
  });
  
  console.log('[PERFORMANCE] Images optimized');
}

/**
 * Set up lazy loading for images
 */
function setupLazyLoading() {
  // Use Intersection Observer if available
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.getAttribute('data-src');
          
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
          }
          
          observer.unobserve(img);
        }
      });
    });
    
    // Observe all images with data-src attribute
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
    
    console.log('[PERFORMANCE] Lazy loading set up with IntersectionObserver');
  } else {
    // Fallback for browsers that don't support IntersectionObserver
    console.log('[PERFORMANCE] IntersectionObserver not supported, using scroll event for lazy loading');
    
    function lazyLoad() {
      document.querySelectorAll('img[data-src]').forEach(img => {
        const rect = img.getBoundingClientRect();
        
        if (rect.top <= window.innerHeight && rect.bottom >= 0) {
          const src = img.getAttribute('data-src');
          
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
          }
        }
      });
    }
    
    // Load images on scroll
    window.addEventListener('scroll', lazyLoad);
    
    // Initial load
    lazyLoad();
  }
}

/**
 * Fix resource paths
 */
function fixResourcePaths() {
  // Check all CSS links
  document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('/css/')) {
      // Add error handling
      link.addEventListener('error', function() {
        console.error('[PERFORMANCE] Failed to load CSS:', href);
        // Try alternative path
        const altHref = href.replace(/^\/css\//, '/public/css/');
        console.log('[PERFORMANCE] Trying alternative CSS path:', altHref);
        link.href = altHref;
      });
    }
  });

  // Check all script sources
  document.querySelectorAll('script[src]').forEach(script => {
    const src = script.getAttribute('src');
    if (src && src.startsWith('/js/')) {
      // Add error handling
      script.addEventListener('error', function() {
        console.error('[PERFORMANCE] Failed to load script:', src);
        // Try alternative path
        const altSrc = src.replace(/^\/js\//, '/public/js/');
        console.log('[PERFORMANCE] Trying alternative script path:', altSrc);
        script.src = altSrc;
      });
    }
  });
}

/**
 * Add error handling for resources
 */
function addResourceErrorHandling() {
  window.addEventListener('error', function(e) {
    if (e.target && (e.target.tagName === 'IMG' || e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK')) {
      const resource = e.target.src || e.target.href;
      if (!resource) return;
      
      console.warn('[PERFORMANCE] Resource failed to load:', resource);
      
      // Try to fix the path
      tryFixResourcePath(e.target, resource);
    }
  }, true);
}

/**
 * Try to fix a broken resource path
 */
function tryFixResourcePath(element, resource) {
  if (!resource || !element) return false;
  
  try {
    const resourceUrl = new URL(resource, window.location.origin);
    const resourcePath = resourceUrl.pathname;
    
    // List of alternative path patterns to try
    const alternativePaths = [];
    
    // Check if it's a static asset
    if (resourcePath.match(/\.(css|js|jpg|jpeg|png|gif|svg)$/)) {
      // Try with /public prefix
      if (!resourcePath.startsWith('/public/')) {
        alternativePaths.push('/public' + resourcePath);
      }
      
      // Try without /public prefix
      if (resourcePath.startsWith('/public/')) {
        alternativePaths.push(resourcePath.replace(/^\/public/, ''));
      }
    }
    
    console.log('[PERFORMANCE] Trying alternative paths for:', resourcePath);
    
    // Try each alternative path
    for (const altPath of alternativePaths) {
      const fullAltUrl = new URL(altPath, window.location.origin).toString();
      
      if (element.tagName === 'IMG') {
        element.src = fullAltUrl;
      } else if (element.tagName === 'LINK') {
        element.href = fullAltUrl;
      } else if (element.tagName === 'SCRIPT') {
        const newScript = document.createElement('script');
        newScript.src = fullAltUrl;
        newScript.async = element.async;
        newScript.defer = element.defer;
        document.head.appendChild(newScript);
      }
    }
    
    return true;
  } catch (error) {
    console.error('[PERFORMANCE] Error fixing resource path:', error);
    return false;
  }
}

/**
 * Defer non-critical resources
 */
function deferNonCriticalResources() {
  // List of non-critical resources to defer
  const nonCriticalResources = [
    { type: 'script', src: '/js/glitch.js' },
    { type: 'script', src: '/js/terminal-effects.js' },
    { type: 'script', src: '/js/ascii-art.js' }
  ];
  
  // Defer loading of non-critical scripts
  nonCriticalResources.forEach(resource => {
    if (resource.type === 'script') {
      const existingScript = document.querySelector(`script[src="${resource.src}"]`);
      
      // If the script is already loaded with defer or async, leave it alone
      if (existingScript && (existingScript.defer || existingScript.async)) {
        return;
      }
      
      // If the script exists but isn't deferred, remove it
      if (existingScript) {
        existingScript.remove();
      }
      
      // Create a new deferred script
      const script = document.createElement('script');
      script.src = resource.src;
      script.defer = true;
      
      // Add error handling
      script.onerror = function() {
        console.error('[PERFORMANCE] Failed to load script:', resource.src);
        // Try alternative path
        const altSrc = resource.src.replace(/^\/js\//, '/public/js/');
        console.log('[PERFORMANCE] Trying alternative path:', altSrc);
        script.src = altSrc;
      };
      
      // Add to the document
      document.body.appendChild(script);
      console.log('[PERFORMANCE] Deferred loading of:', resource.src);
    }
  });
}
