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

  const oldStylePaths = {
    '/bleedstream.html': '/feed/bleedstream',
    '/glyph-crucible.html': '/glyph/crucible',
    '/whisperboard.html': '/whisper/board',
    '/numbpill.html': '/terminal/numbpill',
    '/login': '/auth/login',
    '/register': '/auth/register',
    '/secrets/numbpill': '/terminal/numbpill',
    '/secrets/void': '/terminal/void',
    '/bleedstream': '/feed/bleedstream',
    '/glyph-crucible': '/glyph/crucible',
    '/whisperboard': '/whisper/board',
    '/numbpill': '/terminal/numbpill',
    '/void': '/terminal/void',
    '/scrapyard': '/forum/scrapyard',
    '/scrapyard.html': '/forum/scrapyard',
    '/forum-scrapyard': '/forum/scrapyard'
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
                           path.match(/^\/uploads\/.*/);

        if (!isKnownPath) {
          console.warn("[NAV DEBUG] Potentially unknown path:", path);

          // Show error notification if available
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