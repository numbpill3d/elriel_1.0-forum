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

// Expose functions globally
window.elrielPerformance = {
  detectLowEndDevice,
  isLowEndDevice,
  optimizeImages,
  optimizeMobileAnimations,
  setupEventDebouncing
};
