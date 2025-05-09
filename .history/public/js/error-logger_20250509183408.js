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

    // Ignore errors from external domains or non-critical resources
    if (src) {
      try {
        const resourceUrl = new URL(src);

        // Check if it's from a different domain
        if (resourceUrl.origin !== window.location.origin) {
          console.warn('[ERROR LOGGER] External resource error (ignoring):', src);
          return;
        }

        // Check if it's a non-critical resource
        if (src.includes('analytics') ||
            src.includes('tracking') ||
            src.includes('social') ||
            src.includes('glitch.js') ||
            src.includes('terminal-effects.js')) {
          console.warn('[ERROR LOGGER] Non-critical resource error (ignoring):', src);
          return;
        }
      } catch (err) {
        // If URL parsing fails, continue with error handling
        console.warn('[ERROR LOGGER] Error parsing resource URL:', err);
      }
    }

    console.error('[ERROR LOGGER] Resource loading error:', src);

    // Add more detailed logging
    const details = {
      resource: src,
      element: e.target.outerHTML,
      tagName: e.target.tagName,
      time: new Date().toISOString(),
      page: window.location.href,
      referrer: document.referrer || 'None'
    };

    console.error('[ERROR LOGGER] Error details:', JSON.stringify(details, null, 2));

    // Try to fix the resource path
    const fixed = tryFixResourcePath(e.target, src);

    // If the resource wasn't fixed, try alternative paths
    if (!fixed) {
      tryAlternativeResourcePaths(e.target, src);
    }

    // Show user-friendly error notification
    showErrorNotification(src);
  }
});

/**
 * Try to fix a broken resource path
 */
function tryFixResourcePath(element, resource) {
  if (!resource || !element) return false;

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

/**
 * Try alternative paths for a resource that failed to load
 */
function tryAlternativeResourcePaths(element, resource) {
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

      // Try with /static prefix
      if (!resourcePath.startsWith('/static/')) {
        alternativePaths.push('/static' + resourcePath);
      }
    }

    // For CSS files
    if (resourcePath.endsWith('.css')) {
      if (!resourcePath.includes('/css/')) {
        const filename = resourcePath.split('/').pop();
        alternativePaths.push('/css/' + filename);
        alternativePaths.push('/public/css/' + filename);
      }
    }

    // For JS files
    if (resourcePath.endsWith('.js')) {
      if (!resourcePath.includes('/js/')) {
        const filename = resourcePath.split('/').pop();
        alternativePaths.push('/js/' + filename);
        alternativePaths.push('/public/js/' + filename);
      }
    }

    // For images
    if (resourcePath.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
      if (!resourcePath.includes('/images/')) {
        const filename = resourcePath.split('/').pop();
        alternativePaths.push('/images/' + filename);
        alternativePaths.push('/public/images/' + filename);
      }
    }

    console.log('[ERROR LOGGER] Trying alternative paths for:', resourcePath);
    console.log('[ERROR LOGGER] Alternatives:', alternativePaths);

    // Try each alternative path
    for (const altPath of alternativePaths) {
      const fullAltUrl = new URL(altPath, window.location.origin).toString();

      // Create a test element to check if the resource exists
      if (element.tagName === 'IMG') {
        const testImg = new Image();
        testImg.onload = function() {
          console.log('[ERROR LOGGER] Alternative image path works:', altPath);
          element.src = fullAltUrl;
        };
        testImg.src = fullAltUrl;
      } else if (element.tagName === 'LINK') {
        // For CSS, we'll just try to set it directly
        element.href = fullAltUrl;
        console.log('[ERROR LOGGER] Trying alternative CSS path:', altPath);
      } else if (element.tagName === 'SCRIPT') {
        // For scripts, create a new script element
        const newScript = document.createElement('script');
        newScript.src = fullAltUrl;
        newScript.async = element.async;
        newScript.defer = element.defer;
        newScript.onload = function() {
          console.log('[ERROR LOGGER] Alternative script path works:', altPath);
        };
        document.head.appendChild(newScript);
      }
    }

    return true; // We've attempted fixes
  } catch (error) {
    console.error('[ERROR LOGGER] Error trying alternative paths:', error);
    return false;
  }
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

/**
 * Suggest relevant links based on the current URL
 */
function suggestRelevantLinks() {
  const currentPath = window.location.pathname;
  const suggestionsList = document.getElementById('suggestions-list');

  if (!suggestionsList) return;

  // Common pages to suggest
  const commonSuggestions = [
    { url: '/', title: 'Home Page' },
    { url: '/feed/bleedstream', title: 'Bleedstream' },
    { url: '/glyph/crucible', title: 'Glyph Crucible' },
    { url: '/whisper/board', title: 'Whisperboard' },
    { url: '/forum/scrapyard', title: 'Scrapyard Forum' }
  ];

  // Add specific suggestions based on the URL
  let specificSuggestions = [];

  // Check for patterns in the URL to make relevant suggestions
  if (currentPath.includes('feed') || currentPath.includes('bleed')) {
    specificSuggestions.push({ url: '/feed/bleedstream', title: 'Bleedstream Feed' });
  }

  if (currentPath.includes('glyph') || currentPath.includes('crucible')) {
    specificSuggestions.push({ url: '/glyph/crucible', title: 'Glyph Crucible' });
  }

  if (currentPath.includes('whisper') || currentPath.includes('board')) {
    specificSuggestions.push({ url: '/whisper/board', title: 'Whisperboard' });
  }

  if (currentPath.includes('forum') || currentPath.includes('scrap')) {
    specificSuggestions.push({ url: '/forum/scrapyard', title: 'Scrapyard Forum' });
  }

  if (currentPath.includes('profile') || currentPath.includes('user')) {
    specificSuggestions.push({ url: '/profile', title: 'User Profile' });
    specificSuggestions.push({ url: '/auth/login', title: 'Login Page' });
  }

  // Combine and deduplicate suggestions
  const allSuggestions = [...specificSuggestions];

  // Add common suggestions if we don't have enough specific ones
  if (specificSuggestions.length < 3) {
    commonSuggestions.forEach(suggestion => {
      if (!allSuggestions.some(s => s.url === suggestion.url)) {
        allSuggestions.push(suggestion);
      }
    });
  }

  // Limit to 5 suggestions
  const limitedSuggestions = allSuggestions.slice(0, 5);

  // Add to the page
  limitedSuggestions.forEach(suggestion => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = suggestion.url;
    a.textContent = suggestion.title;
    li.appendChild(a);
    suggestionsList.appendChild(li);
  });
}

// Log when document is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Document loaded successfully');

  // Check for visible cursors
  const { styleSheets } = document;
  let cursorStylesFound = false;

  try {
    for (let i = 0; i < styleSheets.length; i++) {
      const sheet = styleSheets[i];
      try {
        // Use cssRules (sheet.rules is deprecated)
        const rules = sheet.cssRules;
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

console.log('[ERROR LOGGER] Enhanced error logger initialized');