/**
 * Elriel - Mobile Responsiveness Enhancements
 * This script improves the mobile experience across the application
 */

document.addEventListener('DOMContentLoaded', function() {
  // Add mobile navigation menu
  addMobileNavigation();

  // Enhance touch interactions
  enhanceTouchInteractions();

  // Fix font sizes for better readability
  adjustFontSizes();

  // Add viewport height fix for mobile browsers
  fixViewportHeight();

  // Add orientation change handler
  handleOrientationChange();

  console.log('Mobile enhancements initialized');
});

/**
 * Add mobile navigation menu
 */
function addMobileNavigation() {
  // Only add mobile navigation on small screens
  if (window.innerWidth > 768) return;

  // Check if we have a sidebar navigation
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  // Create mobile navigation toggle button
  const navToggle = document.createElement('button');
  navToggle.className = 'mobile-nav-toggle';
  navToggle.setAttribute('aria-label', 'Toggle navigation menu');
  navToggle.innerHTML = `
    <span class="toggle-bar"></span>
    <span class="toggle-bar"></span>
    <span class="toggle-bar"></span>
  `;

  // Add styles for mobile navigation
  const mobileNavStyles = document.createElement('style');
  mobileNavStyles.textContent = `
    .mobile-nav-toggle {
      display: none;
      position: fixed;
      top: 15px;
      right: 15px;
      width: 40px;
      height: 40px;
      background-color: var(--panel-bg);
      border: var(--panel-border);
      z-index: 1000;
      padding: 5px;
      flex-direction: column;
      justify-content: space-around;
      align-items: center;
    }

    .toggle-bar {
      width: 25px;
      height: 3px;
      background-color: var(--terminal-green);
      transition: all 0.3s;
    }

    .mobile-nav-active .toggle-bar:nth-child(1) {
      transform: translateY(8px) rotate(45deg);
    }

    .mobile-nav-active .toggle-bar:nth-child(2) {
      opacity: 0;
    }

    .mobile-nav-active .toggle-bar:nth-child(3) {
      transform: translateY(-8px) rotate(-45deg);
    }

    @media (max-width: 768px) {
      .mobile-nav-toggle {
        display: flex;
      }

      .sidebar {
        position: fixed;
        top: 0;
        left: -100%;
        width: 80% !important;
        max-width: 300px;
        height: 100vh;
        z-index: 999;
        transition: left 0.3s ease;
        overflow-y: auto;
        padding: 20px !important;
      }

      body.mobile-nav-active .sidebar {
        left: 0;
      }

      .mobile-nav-overlay {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.7);
        z-index: 998;
      }

      body.mobile-nav-active .mobile-nav-overlay {
        display: block;
      }

      .content-wrapper {
        margin-top: 60px;
      }
    }
  `;

  document.head.appendChild(mobileNavStyles);

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'mobile-nav-overlay';

  // Add toggle functionality
  navToggle.addEventListener('click', function() {
    document.body.classList.toggle('mobile-nav-active');
  });

  // Close menu when clicking overlay
  overlay.addEventListener('click', function() {
    document.body.classList.remove('mobile-nav-active');
  });

  // Close menu when clicking a link
  sidebar.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', function(e) {
      document.body.classList.remove('mobile-nav-active');

      // Fix navigation issues by checking for known paths
      const href = this.getAttribute('href');
      if (href && window.navigationDebug) {
        // Log navigation for debugging
        console.log("[MOBILE NAV] Link clicked:", href);

        // Check if it's a path that needs fixing
        if (typeof window.oldStylePaths === 'object' && window.oldStylePaths[href]) {
          e.preventDefault();
          const newPath = window.oldStylePaths[href];
          console.log("[MOBILE NAV] Redirecting to:", newPath);
          window.location.href = newPath;
        }
      }
    });
  });

  // Add elements to the DOM
  document.body.appendChild(navToggle);
  document.body.appendChild(overlay);
}

/**
 * Enhance touch interactions
 */
function enhanceTouchInteractions() {
  // Add touch feedback to buttons and links
  const touchStyles = document.createElement('style');
  touchStyles.textContent = `
    @media (max-width: 768px) {
      a, button, .clickable {
        -webkit-tap-highlight-color: rgba(0, 255, 0, 0.2);
      }

      a:active, button:active, .clickable:active {
        opacity: 0.7;
        transform: scale(0.98);
        transition: all 0.1s;
      }

      /* Increase touch target sizes */
      nav a, .nav-links a, button, .win98-btn, input[type="submit"] {
        min-height: 44px;
        min-width: 44px;
        padding: 10px 15px;
        margin: 5px 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      /* Adjust spacing for better touch */
      .nav-links li {
        margin-bottom: 8px;
      }

      /* Make form elements more touch-friendly */
      input, select, textarea {
        font-size: 16px !important; /* Prevent zoom on iOS */
        min-height: 44px;
        padding: 10px !important;
      }
    }
  `;

  document.head.appendChild(touchStyles);
}

/**
 * Adjust font sizes for better readability on mobile
 */
function adjustFontSizes() {
  const fontStyles = document.createElement('style');
  fontStyles.textContent = `
    @media (max-width: 768px) {
      body {
        font-size: 16px !important;
      }

      h1 {
        font-size: 1.8rem !important;
      }

      h2 {
        font-size: 1.5rem !important;
      }

      h3 {
        font-size: 1.3rem !important;
      }

      .logo-subtitle {
        font-size: 0.9rem !important;
      }

      /* Ensure content doesn't overflow */
      .container {
        width: 100% !important;
        padding: 0 10px !important;
      }

      /* Adjust main content padding */
      .main-content {
        padding: 10px !important;
      }

      /* Make windows take full width */
      .win98-window {
        width: 100% !important;
        margin-bottom: 15px !important;
      }
    }
  `;

  document.head.appendChild(fontStyles);
}

/**
 * Fix viewport height issues on mobile browsers
 */
function fixViewportHeight() {
  // Fix the 100vh issue on mobile browsers
  function setVH() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  // Set initial value
  setVH();

  // Update on resize
  window.addEventListener('resize', setVH);

  // Add CSS variable usage
  const vhStyles = document.createElement('style');
  vhStyles.textContent = `
    @media (max-width: 768px) {
      .container, body, html {
        min-height: calc(var(--vh, 1vh) * 100) !important;
      }

      .sidebar {
        max-height: calc(var(--vh, 1vh) * 100) !important;
      }
    }
  `;

  document.head.appendChild(vhStyles);
}

/**
 * Handle orientation change
 */
function handleOrientationChange() {
  window.addEventListener('orientationchange', function() {
    // Add a small delay to ensure the browser has updated dimensions
    setTimeout(function() {
      // Fix viewport height
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);

      // Close mobile navigation if open
      document.body.classList.remove('mobile-nav-active');

      // Dispatch custom event for other scripts to respond to
      const event = new CustomEvent('elrielOrientationChange', {
        detail: {
          orientation: window.orientation,
          width: window.innerWidth,
          height: window.innerHeight
        }
      });

      document.dispatchEvent(event);
    }, 200);
  });
}

// Expose mobile functions globally
window.elrielMobile = {
  addMobileNavigation,
  enhanceTouchInteractions,
  adjustFontSizes,
  fixViewportHeight,
  handleOrientationChange
};
