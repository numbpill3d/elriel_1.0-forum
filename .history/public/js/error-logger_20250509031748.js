/**
 * Elriel - Error Logger Script
 * This script helps identify 404 errors and resource loading issues
 */

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

    // Show user-friendly error notification
    showErrorNotification(src);
  }
});

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
      if (window.oldStylePaths && window.oldStylePaths[resourcePath]) {
        fixedPath = window.oldStylePaths[resourcePath];
        console.log('[NAV ERROR] Found fixed path:', fixedPath, 'for', resourcePath);
      }
    }

    // Create notification
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.innerHTML = `
      <div class="error-notification-content">
        <div class="error-notification-title">${isNavigationIssue ? 'Navigation Error' : 'Resource Error'}</div>
        <div class="error-notification-message">Failed to load: ${resource.split('/').pop()}</div>
        ${isNavigationIssue ? '<div class="error-notification-help">Try refreshing the page or returning to the home page.</div>' : ''}
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