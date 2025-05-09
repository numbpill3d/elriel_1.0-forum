/**
 * Elriel - Navigation Debugging
 * This file helps diagnose navigation issues in the application
 */

// Log all navigation attempts
window.navigationDebug = true;

document.addEventListener('DOMContentLoaded', function() {
  console.log("[NAV DEBUG] Page loaded:", window.location.pathname);

  // Define known and old-style paths
  const knownPaths = [
    '/',
    '/feed/bleedstream',
    '/glyph/crucible',
    '/whisper/board',
    '/terminal/numbpill',
    '/terminal/void',
    '/profile',
    '/profile/edit',
    '/profile/user',
    '/profile/enhanced',
    '/auth/login',
    '/auth/register',
    '/auth/logout',
    '/about',
    '/health',
    '/static',
    '/images',
    '/css',
    '/js',
    '/uploads',
    '/forum',
    '/forum/scrapyard',
    '/forum/topic',
    '/forum/scrapyard/new',
    '/api/status',
    '/crypto'
  ];

  // Make oldStylePaths available globally for other scripts
  window.oldStylePaths = {
    // HTML file extensions
    '/bleedstream.html': '/feed/bleedstream',
    '/glyph-crucible.html': '/glyph/crucible',
    '/whisperboard.html': '/whisper/board',
    '/numbpill.html': '/terminal/numbpill',
    '/scrapyard.html': '/forum/scrapyard',
    '/index.html': '/',

    // Auth shortcuts
    '/login': '/auth/login',
    '/register': '/auth/register',
    '/logout': '/auth/logout',

    // Secret paths
    '/secrets/numbpill': '/terminal/numbpill',
    '/secrets/void': '/terminal/void',

    // Old style paths
    '/bleedstream': '/feed/bleedstream',
    '/glyph-crucible': '/glyph/crucible',
    '/whisperboard': '/whisper/board',
    '/numbpill': '/terminal/numbpill',
    '/void': '/terminal/void',
    '/scrapyard': '/forum/scrapyard',
    '/forum-scrapyard': '/forum/scrapyard',

    // Trailing slashes
    '/forum/': '/forum',
    '/feed/': '/feed',
    '/glyph/': '/glyph',
    '/whisper/': '/whisper',
    '/terminal/': '/terminal',
    '/auth/': '/auth',
    '/profile/': '/profile',
    '/api/': '/api',
    '/crypto/': '/crypto',

    // Section roots
    '/forum': '/forum/scrapyard',
    '/feed': '/feed/bleedstream',
    '/glyph': '/glyph/crucible',
    '/whisper': '/whisper/board',
    '/terminal': '/',

    // Topic paths - these need special handling
    '/forum/topic': '/forum/topic',
    '/profile/user': '/profile/user'
  };

  // Log and fix navigation
  const links = document.querySelectorAll('a[href]');
  links.forEach(link => {
    const originalHref = link.getAttribute('href');

    // Fix old-style links
    if (originalHref && oldStylePaths[originalHref]) {
      console.log("[NAV DEBUG] Fixing old-style link:", originalHref, "->", oldStylePaths[originalHref]);
      link.setAttribute('href', oldStylePaths[originalHref]);
    }

    // Add click listener for logging
    link.addEventListener('click', function(e) {
      if (window.navigationDebug) {
        console.log("[NAV DEBUG] Link clicked:", this.href);

        // Check if it's an unknown path
        const path = new URL(this.href, window.location.origin).pathname;

        // Check if the path is known or matches a pattern
        const isKnownPath = knownPaths.includes(path) ||
                           path.startsWith('/static/') ||
                           path.startsWith('/images/') ||
                           path.startsWith('/forum/topic/') ||
                           path.startsWith('/profile/user/') ||
                           path.match(/^\/api\/.*/) ||
                           path.match(/^\/uploads\/.*/) ||
                           path.match(/^\/css\/.*/) ||
                           path.match(/^\/js\/.*/);

        if (!isKnownPath) {
          console.warn("[NAV DEBUG] Potentially unknown path:", path);

          // Try to fix the path
          let fixedPath = null;

          // Check if it's a direct match in oldStylePaths
          if (window.oldStylePaths && window.oldStylePaths[path]) {
            fixedPath = window.oldStylePaths[path];
          }
          // If not a direct match, try to find a pattern match
          else {
            // Check if it's a path with parameters like /forum/topic/123
            const pathParts = path.split('/').filter(part => part);
            if (pathParts.length >= 2) {
              const basePath = '/' + pathParts[0];
              if (window.oldStylePaths && window.oldStylePaths[basePath]) {
                fixedPath = window.oldStylePaths[basePath];
                // Append the rest of the path
                if (pathParts.length > 1) {
                  fixedPath += '/' + pathParts.slice(1).join('/');
                }
              }
            }
          }

          if (fixedPath) {
            console.log("[NAV DEBUG] Fixing path:", path, "->", fixedPath);
            e.preventDefault();
            window.location.href = fixedPath;
            return;
          }

          // Show error notification if available and no fix was found
          if (typeof showErrorNotification === 'function') {
            e.preventDefault();
            showErrorNotification(path);
            setTimeout(() => {
              window.location.href = this.href;
            }, 1000);
          }
        }
      }
    });
  });

  console.log("[NAV DEBUG] Attached listeners to", links.length, "links");

  // Force add user login buttons if missing
  const userPanel = document.getElementById('user-status');
  if (userPanel && (!userPanel.innerHTML || userPanel.innerHTML.trim() === '')) {
    console.log("[NAV DEBUG] Adding login buttons to empty user panel");
    userPanel.innerHTML = `
      <div class="logged-out">
        <a href="/auth/login" class="win98-btn login-btn">LOGIN</a>
        <a href="/auth/register" class="win98-btn register-btn">REGISTER</a>
      </div>
    `;
  }
});