/**
 * Elriel - Performance Fixes
 * This script improves performance across the application, especially on mobile devices
 * Updated with additional optimizations and better device detection
 */

document.addEventListener('DOMContentLoaded', function() {
  // Detect device capabilities
  detectDeviceCapabilities();

  // Optimize images
  optimizeImages();

  // Reduce animation complexity on mobile
  optimizeMobileAnimations();

  // Debounce scroll and resize events
  setupEventDebouncing();

  // Defer non-critical resources
  deferNonCriticalResources();

  // Set up lazy loading for heavy elements
  setupLazyLoading();

  console.log('[PERFORMANCE] Performance fixes initialized');
});

/**
 * Detect device capabilities and apply appropriate optimizations
 */
function detectDeviceCapabilities() {
  // Check if device is low-end
  const isLowEnd = isLowEndDevice();

  // Check if we're on a mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

  // Check if we're on a slow connection
  const isSlowConnection = navigator.connection ?
    (navigator.connection.saveData ||
    ['slow-2g', '2g', '3g'].includes(navigator.connection.effectiveType)) :
    false;

  // Check if user prefers reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Store these flags globally
  window.elrielDeviceCapabilities = {
    isLowEnd,
    isMobile,
    isSlowConnection,
    prefersReducedMotion
  };

  // Apply performance mode if needed
  if (isLowEnd || isSlowConnection || prefersReducedMotion) {
    console.log('[PERFORMANCE] Low-end device or slow connection detected, applying performance optimizations');
    document.body.classList.add('low-performance-device');

    // Add styles to reduce animation complexity
    const reducedAnimationStyles = document.createElement('style');
    reducedAnimationStyles.textContent = `
      body.low-performance-device .glitch::before,
      body.low-performance-device .glitch::after {
        display: none !important;
      }

      body.low-performance-device .noise-overlay {
        opacity: 0.02 !important;
      }

      body.low-performance-device .scan-lines {
        opacity: 0.3 !important;
      }

      body.low-performance-device * {
        animation-duration: 1.5s !important;
      }

      @media (max-width: 768px) {
        body.low-performance-device .noise-overlay,
        body.low-performance-device .scan-lines {
          display: none !important;
        }

        body.low-performance-device .glitch-effect {
          text-shadow: none !important;
        }
      }
    `;

    document.head.appendChild(reducedAnimationStyles);
  }

  // Apply mobile optimizations if needed
  if (isMobile) {
    document.body.classList.add('mobile-device');
  }

  return window.elrielDeviceCapabilities;
}

/**
 * Check if the device is low-end
 */
function isLowEndDevice() {
  // Check for low memory
  if ('deviceMemory' in navigator && navigator.deviceMemory < 4) {
    return true;
  }

  // Check for slow CPU
  if ('hardwareConcurrency' in navigator && navigator.hardwareConcurrency < 4) {
    return true;
  }

  // Check for mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // If it's a mobile device, do additional checks
  if (isMobile) {
    // Check for older iOS devices
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      const match = navigator.userAgent.match(/OS (\d+)_(\d+)/);
      if (match && match[1] < 12) {
        return true;
      }
    }

    // Check for older Android devices
    if (/Android/.test(navigator.userAgent)) {
      const match = navigator.userAgent.match(/Android (\d+)\.(\d+)/);
      if (match && match[1] < 8) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Optimize images
 */
function optimizeImages() {
  // Lazy load images
  const images = document.querySelectorAll('img:not([loading="eager"])');
  images.forEach(img => {
    img.setAttribute('loading', 'lazy');
  });

  // Add error handling for images
  images.forEach(img => {
    img.addEventListener('error', function() {
      this.style.display = 'none';
      console.warn('Failed to load image:', this.src);
    });
  });
}

/**
 * Optimize animations on mobile
 */
function optimizeMobileAnimations() {
  if (window.innerWidth <= 768) {
    // Add styles to reduce animation complexity on mobile
    const mobileAnimationStyles = document.createElement('style');
    mobileAnimationStyles.textContent = `
      @media (max-width: 768px) {
        .glitch::before, .glitch::after {
          display: none !important;
        }

        .scanner-line {
          opacity: 0.3 !important;
        }

        .noise-overlay {
          opacity: 0.03 !important;
        }

        .scan-lines {
          opacity: 0.2 !important;
        }

        @keyframes glowing {
          0% { text-shadow: 0 0 2px var(--glow-color); }
          50% { text-shadow: 0 0 5px var(--glow-color); }
          100% { text-shadow: 0 0 2px var(--glow-color); }
        }
      }
    `;

    document.head.appendChild(mobileAnimationStyles);
  }
}

/**
 * Setup event debouncing
 */
function setupEventDebouncing() {
  // Debounce scroll event
  let scrollTimeout;
  window.addEventListener('scroll', function() {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }

    scrollTimeout = setTimeout(function() {
      // Handle scroll event
      console.log('Scroll event debounced');
    }, 100);
  }, { passive: true });

  // Debounce resize event
  let resizeTimeout;
  window.addEventListener('resize', function() {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }

    resizeTimeout = setTimeout(function() {
      // Handle resize event
      console.log('Resize event debounced');
    }, 100);
  });
}

/**
 * Defer non-critical resources
 */
function deferNonCriticalResources() {
  // Check if we're on a low-end device or slow connection
  const { isLowEnd, isSlowConnection } = window.elrielDeviceCapabilities || {};

  // List of non-critical resources to defer
  const nonCriticalResources = [
    { type: 'script', src: '/js/glitch.js' },
    { type: 'script', src: '/js/terminal-effects.js' },
    { type: 'script', src: '/js/ascii-art.js' }
  ];

  // Fix broken resource paths
  fixResourcePaths();

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

/**
 * Set up lazy loading for heavy elements
 */
function setupLazyLoading() {
  // Check if Intersection Observer is supported
  if (!('IntersectionObserver' in window)) {
    return;
  }

  // Create an observer for lazy loading
  const lazyLoadObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;

        // Handle different types of lazy-loaded content
        if (element.classList.contains('lazy-image')) {
          const src = element.dataset.src;
          if (src) {
            element.src = src;
            element.classList.remove('lazy-image');
            observer.unobserve(element);
          }
        } else if (element.classList.contains('lazy-background')) {
          const src = element.dataset.background;
          if (src) {
            element.style.backgroundImage = `url(${src})`;
            element.classList.remove('lazy-background');
            observer.unobserve(element);
          }
        } else if (element.classList.contains('lazy-load')) {
          element.classList.add('loaded');
          observer.unobserve(element);
        }
      }
    });
  }, {
    rootMargin: '100px',
    threshold: 0.1
  });

  // Observe all elements with lazy loading classes
  document.querySelectorAll('.lazy-image, .lazy-background, .lazy-load').forEach(element => {
    lazyLoadObserver.observe(element);
  });
}

/**
 * Fix resource paths that might be broken in production
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

  // Check all images
  document.querySelectorAll('img[src]').forEach(img => {
    const src = img.getAttribute('src');
    if (src && (src.startsWith('/images/') || src.startsWith('/uploads/'))) {
      // Add error handling
      img.addEventListener('error', function() {
        console.error('[PERFORMANCE] Failed to load image:', src);
        // Try alternative path
        const altSrc = src.replace(/^\/(images|uploads)\//, '/public/$1/');
        console.log('[PERFORMANCE] Trying alternative image path:', altSrc);
        img.src = altSrc;
      });
    }
  });
}

// Expose functions globally
window.elrielPerformance = {
  detectDeviceCapabilities,
  isLowEndDevice,
  optimizeImages,
  optimizeMobileAnimations,
  setupEventDebouncing,
  deferNonCriticalResources,
  setupLazyLoading,
  fixResourcePaths
};
