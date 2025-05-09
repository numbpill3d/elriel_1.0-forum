/**
 * Elriel - Navigation Debugging and Path Correction
 * This file helps diagnose navigation issues in the application and fixes common path problems
 * Updated for better handling of navigation issues on deployed sites
 */

// Log all navigation attempts
window.navigationDebug = true;

document.addEventListener('DOMContentLoaded', function() {
  console.log("[NAV DEBUG] Page loaded:", window.location.pathname);

  // Get the base URL for the site
  const baseUrl = window.location.origin;
  console.log("[NAV DEBUG] Base URL:", baseUrl);

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
    '/crypto',
    '/sitemap.html',
    '/sitemap',
    '/error',
    '/404'
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
    '/forum.html': '/forum/scrapyard',
    '/profile.html': '/profile',
    '/login.html': '/auth/login',
    '/register.html': '/auth/register',

    // Auth shortcuts
    '/login': '/auth/login',
    '/register': '/auth/register',
    '/logout': '/auth/logout',
    '/signin': '/auth/login',
    '/signup': '/auth/register',
    '/signout': '/auth/logout',

    // Secret paths
    '/secrets/numbpill': '/terminal/numbpill',
    '/secrets/void': '/terminal/void',
    '/secret/numbpill': '/terminal/numbpill',
    '/secret/void': '/terminal/void',

    // Old style paths
    '/bleedstream': '/feed/bleedstream',
    '/glyph-crucible': '/glyph/crucible',
    '/whisperboard': '/whisper/board',
    '/numbpill': '/terminal/numbpill',
    '/void': '/terminal/void',
    '/scrapyard': '/forum/scrapyard',
    '/forum-scrapyard': '/forum/scrapyard',
    '/crucible': '/glyph/crucible',
    '/board': '/whisper/board',

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
    '/profile/user': '/profile/user',

    // Common typos and variations
    '/forums': '/forum/scrapyard',
    '/forums/': '/forum/scrapyard',
    '/feed/stream': '/feed/bleedstream',
    '/feeds': '/feed/bleedstream',
    '/glyphs': '/glyph/crucible',
    '/whispers': '/whisper/board',
    '/profiles': '/profile'
  };

  // Log and fix navigation
  const links = document.querySelectorAll('a[href]');
  links.forEach(link => {
    const originalHref = link.getAttribute('href');

    // Skip empty, javascript: or # links
    if (!originalHref || originalHref.startsWith('javascript:') || originalHref === '#') {
      return;
    }

    // Fix old-style links proactively
    if (originalHref && window.oldStylePaths[originalHref]) {
      console.log("[NAV DEBUG] Fixing old-style link:", originalHref, "->", window.oldStylePaths[originalHref]);
      link.setAttribute('href', window.oldStylePaths[originalHref]);
    }

    // Add click listener for logging and path correction
    link.addEventListener('click', function(e) {
      if (window.navigationDebug) {
        console.log("[NAV DEBUG] Link clicked:", this.href);

        try {
          // Check if it's an unknown path
          const url = new URL(this.href, window.location.origin);
          const path = url.pathname;

          // Log the full URL for debugging
          console.log("[NAV DEBUG] Full URL:", url.toString());
          console.log("[NAV DEBUG] Path component:", path);

          // Check if the path is known or matches a pattern
          const isKnownPath = knownPaths.includes(path) ||
                             path.startsWith('/static/') ||
                             path.startsWith('/images/') ||
                             path.startsWith('/forum/topic/') ||
                             path.startsWith('/profile/user/') ||
                             path.match(/^\/api\/.*/) ||
                             path.match(/^\/uploads\/.*/) ||
                             path.match(/^\/css\/.*/) ||
                             path.match(/^\/js\/.*/) ||
                             path.match(/^\/sitemap.*/);

          if (!isKnownPath) {
            console.warn("[NAV DEBUG] Potentially unknown path:", path);

            // Try to fix the path
            let fixedPath = null;

            // Check if it's a direct match in oldStylePaths
            if (window.oldStylePaths && window.oldStylePaths[path]) {
              fixedPath = window.oldStylePaths[path];
              console.log("[NAV DEBUG] Found direct path match:", fixedPath);
            }
            // If not a direct match, try to find a pattern match
            else {
              // Check if it's a path with parameters like /forum/topic/123
              const pathParts = path.split('/').filter(part => part);
              console.log("[NAV DEBUG] Path parts:", pathParts);

              if (pathParts.length >= 2) {
                const basePath = '/' + pathParts[0];
                console.log("[NAV DEBUG] Checking base path:", basePath);

                if (window.oldStylePaths && window.oldStylePaths[basePath]) {
                  fixedPath = window.oldStylePaths[basePath];
                  // Append the rest of the path
                  if (pathParts.length > 1) {
                    fixedPath += '/' + pathParts.slice(1).join('/');
                  }
                  console.log("[NAV DEBUG] Fixed using base path:", fixedPath);
                }

                // Check for common section patterns
                const sectionPath = '/' + pathParts[0] + '/' + pathParts[1];
                console.log("[NAV DEBUG] Checking section path:", sectionPath);

                if (!fixedPath && window.oldStylePaths && window.oldStylePaths[sectionPath]) {
                  fixedPath = window.oldStylePaths[sectionPath];
                  // Append the rest of the path if any
                  if (pathParts.length > 2) {
                    fixedPath += '/' + pathParts.slice(2).join('/');
                  }
                  console.log("[NAV DEBUG] Fixed using section path:", fixedPath);
                }
              }
            }

            if (fixedPath) {
              console.log("[NAV DEBUG] Fixing path:", path, "->", fixedPath);

              // Preserve query parameters and hash
              if (url.search) {
                fixedPath += url.search;
              }
              if (url.hash) {
                fixedPath += url.hash;
              }

              // Use the full URL with the fixed path
              const fixedUrl = new URL(fixedPath, window.location.origin).toString();
              console.log("[NAV DEBUG] Final fixed URL:", fixedUrl);

              e.preventDefault();
              window.location.href = fixedUrl;
              return;
            } else {
              console.log("[NAV DEBUG] No fix found for path:", path);
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
        } catch (error) {
          console.error("[NAV DEBUG] Error processing link:", error);
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

  // Add a global error handler for 404s
  window.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG' || e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK') {
      const resource = e.target.src || e.target.href;
      if (!resource) return;

      console.warn('[NAV DEBUG] Resource failed to load:', resource);

      // Check if it's a navigation path issue
      if (resource.includes('/feed/') ||
          resource.includes('/glyph/') ||
          resource.includes('/whisper/') ||
          resource.includes('/terminal/') ||
          resource.includes('/auth/') ||
          resource.includes('/forum/') ||
          resource.includes('/profile/') ||
          resource.includes('/api/')) {

        try {
          // Try to fix the path using oldStylePaths
          const resourcePath = new URL(resource, window.location.origin).pathname;

          // Check if we have a fix for this path
          if (window.oldStylePaths && window.oldStylePaths[resourcePath]) {
            const fixedPath = window.oldStylePaths[resourcePath];
            console.log('[NAV DEBUG] Found fixed path:', fixedPath, 'for', resourcePath);

            // For images and CSS, we can try to fix them directly
            if (e.target.tagName === 'IMG') {
              e.target.src = e.target.src.replace(resourcePath, fixedPath);
            } else if (e.target.tagName === 'LINK') {
              e.target.href = e.target.href.replace(resourcePath, fixedPath);
            }
          }
        } catch (error) {
          console.error('[NAV DEBUG] Error fixing resource path:', error);
        }
      }
    }
  }, true);
});