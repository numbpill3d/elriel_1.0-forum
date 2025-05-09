/**
 * Elriel - Enhanced Error Logger Script
 * This script helps identify and fix 404 errors and resource loading issues
 * Updated with improved path correction and error handling
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log("[ERROR LOGGER] Initialized");

  // Track 404 errors
  trackPageErrors();

  // Fix broken paths in the current page
  fixBrokenPaths();
});

/**
 * Track 404 and other page errors
 */
function trackPageErrors() {
  // Check if we're on a 404 or error page
  if (document.title.includes('404') || document.title.includes('ERROR')) {
    const path = window.location.pathname;
    const referrer = document.referrer;

    // Log to console for debugging
    console.error('[ERROR LOGGER] Page error:', {
      path,
      referrer,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });

    // Suggest relevant links based on the current URL
    suggestRelevantLinks();
  }
}

/**
 * Fix broken paths in the current page
 */
function fixBrokenPaths() {
  // Fix links with old paths
  if (window.oldStylePaths) {
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && window.oldStylePaths[href]) {
        link.setAttribute('href', window.oldStylePaths[href]);
        console.log('[ERROR LOGGER] Fixed link path:', href, '->', window.oldStylePaths[href]);
      }
    });
  }
}

// Record all 404 errors with detailed information
window.addEventListener('error', function(e) {
  if (e.target && (e.target.tagName === 'IMG' || e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK')) {
    const src = e.target.src || e.target.href;
    console.error('Resource loading error:', src);

    // Add more detailed logging
    const details = {
      resource: src,
      element: e.target.outerHTML,
      tagName: e.target.tagName,
      time: new Date().toISOString()
    };

    console.error('Error details:', JSON.stringify(details, null, 2));

    // Try to fix the resource path
    tryFixResourcePath(e.target, src);

    // Show user-friendly error notification
    showErrorNotification(src);
  }
});

/**
 * Try to fix a broken resource path
 */
function tryFixResourcePath(element, resource) {
  if (!resource || !element) return;

  try {
    // Check if it's a navigation path issue
    if (resource.includes('/feed/') ||
        resource.includes('/glyph/') ||
        resource.includes('/whisper/') ||
        resource.includes('/terminal/') ||
        resource.includes('/auth/') ||
        resource.includes('/forum/') ||
        resource.includes('/profile/') ||
        resource.includes('/api/')) {

      // Try to fix the path using oldStylePaths
      const resourcePath = new URL(resource, window.location.origin).pathname;
      let fixedPath = null;

      // Check if we have a fix for this path
      if (window.oldStylePaths && window.oldStylePaths[resourcePath]) {
        fixedPath = window.oldStylePaths[resourcePath];
        console.log('[ERROR LOGGER] Found fixed path:', fixedPath, 'for', resourcePath);
      } else {
        // Try pattern matching
        const pathParts = resourcePath.split('/').filter(part => part);
        if (pathParts.length >= 2) {
          const basePath = '/' + pathParts[0];
          if (window.oldStylePaths && window.oldStylePaths[basePath]) {
            fixedPath = window.oldStylePaths[basePath];
            // Append the rest of the path
            if (pathParts.length > 1) {
              fixedPath += '/' + pathParts.slice(1).join('/');
            }
            console.log('[ERROR LOGGER] Found pattern match:', fixedPath, 'for', resourcePath);
          }

          // Check for section paths
          if (!fixedPath && pathParts.length >= 2) {
            const sectionPath = '/' + pathParts[0] + '/' + pathParts[1];
            if (window.oldStylePaths && window.oldStylePaths[sectionPath]) {
              fixedPath = window.oldStylePaths[sectionPath];
              // Append the rest of the path if any
              if (pathParts.length > 2) {
                fixedPath += '/' + pathParts.slice(2).join('/');
              }
              console.log('[ERROR LOGGER] Found section match:', fixedPath, 'for', resourcePath);
            }
          }
        }
      }

      // Apply the fix if found
      if (fixedPath) {
        // For images and CSS, we can try to fix them directly
        if (element.tagName === 'IMG') {
          element.src = element.src.replace(resourcePath, fixedPath);
          console.log('[ERROR LOGGER] Fixed image path:', element.src);
          return true;
        } else if (element.tagName === 'LINK') {
          element.href = element.href.replace(resourcePath, fixedPath);
          console.log('[ERROR LOGGER] Fixed CSS path:', element.href);
          return true;
        } else if (element.tagName === 'SCRIPT') {
          // For scripts, we might need to reload them
          const newScript = document.createElement('script');
          newScript.src = element.src.replace(resourcePath, fixedPath);
          newScript.async = element.async;
          newScript.defer = element.defer;
          document.head.appendChild(newScript);
          console.log('[ERROR LOGGER] Fixed script path:', newScript.src);
          return true;
        }
      }
    }
  } catch (error) {
    console.error('[ERROR LOGGER] Error fixing resource path:', error);
  }

  return false;
}

// Create a user-friendly error notification
function showErrorNotification(resource) {
  // Only show for important resources, not for things like tracking pixels
  if (resource.includes('css') || resource.includes('js') || resource.includes('html') ||
      resource.includes('feed') || resource.includes('glyph') || resource.includes('whisper') ||
      resource.includes('terminal') || resource.includes('auth')) {

    // Check if it's a navigation issue
    let isNavigationIssue = false;
    let fixedPath = null;

    // Check if it's a navigation path issue
    if (resource.includes('/feed/') || resource.includes('/glyph/') ||
        resource.includes('/whisper/') || resource.includes('/terminal/') ||
        resource.includes('/auth/') || resource.includes('/forum/') ||
        resource.includes('/profile/') || resource.includes('/api/')) {
      isNavigationIssue = true;

      // Try to fix the path using oldStylePaths
      const resourcePath = new URL(resource, window.location.origin).pathname;

      // First check if it's a direct match in oldStylePaths
      if (window.oldStylePaths && window.oldStylePaths[resourcePath]) {
        fixedPath = window.oldStylePaths[resourcePath];
        console.log('[NAV ERROR] Found fixed path:', fixedPath, 'for', resourcePath);
      }
      // If not a direct match, try to find a pattern match
      else {
        // Check if it's a path with parameters like /forum/topic/123
        const pathParts = resourcePath.split('/').filter(part => part);
        if (pathParts.length >= 2) {
          const basePath = '/' + pathParts[0];
          if (window.oldStylePaths && window.oldStylePaths[basePath]) {
            fixedPath = window.oldStylePaths[basePath];
            // Append the rest of the path
            if (pathParts.length > 1) {
              fixedPath += '/' + pathParts.slice(1).join('/');
            }
            console.log('[NAV ERROR] Found pattern-matched fixed path:', fixedPath, 'for', resourcePath);
          }
        }
      }
    }

    // Create notification
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.innerHTML = `
      <div class="error-notification-content">
        <div class="error-notification-title">${isNavigationIssue ? 'Navigation Error' : 'Resource Error'}</div>
        <div class="error-notification-message">Failed to load: ${resource.split('/').pop()}</div>
        ${isNavigationIssue ?
          `<div class="error-notification-help">
            ${fixedPath ?
              `<a href="${fixedPath}" class="error-fix-link">Click here to navigate to the correct path</a>` :
              'Try refreshing the page or returning to the home page.'}
          </div>` :
          ''}
        <div class="error-notification-close">×</div>
      </div>
    `;

    // Add styles if they don't exist
    if (!document.getElementById('error-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'error-notification-styles';
      style.textContent = `
        .error-notification {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background-color: rgba(204, 0, 0, 0.9);
          color: white;
          padding: 15px;
          border-radius: 4px;
          z-index: 9999;
          font-family: var(--terminal-font, monospace);
          max-width: 350px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
          animation: slideIn 0.3s ease-out;
        }

        .error-notification-title {
          font-weight: bold;
          margin-bottom: 5px;
        }

        .error-notification-message {
          font-size: 0.9em;
          margin-bottom: 5px;
          word-break: break-all;
        }

        .error-notification-help {
          font-size: 0.85em;
          margin-top: 8px;
          margin-bottom: 5px;
          opacity: 0.9;
        }

        .error-fix-link {
          color: #ffffff;
          text-decoration: underline;
          font-weight: bold;
          display: inline-block;
          margin-top: 5px;
        }

        .error-fix-link:hover {
          color: #ffcc00;
        }

        .error-notification-close {
          position: absolute;
          top: 5px;
          right: 10px;
          cursor: pointer;
          font-size: 1.2em;
        }

        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    // Add to document
    document.body.appendChild(notification);

    // Add close button functionality
    const closeBtn = notification.querySelector('.error-notification-close');
    closeBtn.addEventListener('click', function() {
      notification.remove();
    });

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);

    // Log additional information for debugging
    if (isNavigationIssue) {
      console.warn('[NAV ERROR] Navigation issue detected:', resource);
      console.info('[NAV ERROR] Current pathname:', window.location.pathname);
      console.info('[NAV ERROR] Referrer:', document.referrer);
    }
  }
}

// Log when document is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Document loaded successfully');

  // Check for visible cursors
  const styleSheets = document.styleSheets;
  let cursorStylesFound = false;

  try {
    for (let i = 0; i < styleSheets.length; i++) {
      const sheet = styleSheets[i];
      try {
        const rules = sheet.cssRules || sheet.rules;
        for (let j = 0; j < rules.length; j++) {
          if (rules[j].cssText && rules[j].cssText.includes('cursor')) {
            cursorStylesFound = true;
            break;
          }
        }
      } catch (e) {
        // Cross-origin stylesheets will throw an error
        console.log('Could not access rules in stylesheet:', sheet.href);
      }
    }

    console.log('Cursor styles found:', cursorStylesFound);
  } catch (e) {
    console.error('Error checking for cursor styles:', e);
  }
});

console.log('Error logger initialized');