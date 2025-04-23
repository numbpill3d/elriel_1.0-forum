/**
 * Elriel - Navigation Debugging
 * This file helps diagnose navigation issues in the application
 */

// Log all navigation attempts
window.navigationDebug = true;

// Override the window.location methods to log navigation attempts
(function() {
  const originalReplace = window.location.replace;
  window.location.replace = function(url) {
    console.log("[NAV DEBUG] Replacing location with:", url);
    if (window.navigationDebug) {
      alert("Navigating to: " + url);
    }
    return originalReplace.call(this, url);
  };
  
  // Also patch href changes
  const originalHrefSetter = Object.getOwnPropertyDescriptor(window.location, 'href').set;
  Object.defineProperty(window.location, 'href', {
    set: function(url) {
      console.log("[NAV DEBUG] Setting location.href to:", url);
      if (window.navigationDebug) {
        alert("Navigating href to: " + url);
      }
      return originalHrefSetter.call(this, url);
    }
  });
  
  // Log page load
  console.log("[NAV DEBUG] Page loaded:", window.location.pathname);
  
  // Add event listener to all anchor tags
  document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
      link.addEventListener('click', function(e) {
        console.log("[NAV DEBUG] Link clicked:", this.href);
      });
    });
    
    console.log("[NAV DEBUG] Attached listeners to", links.length, "links");
  });
})();

// Expose direct navigation functions
window.navigateTo = function(path) {
  console.log("[NAV DEBUG] Direct navigation to:", path);
  try {
    window.location.href = path;
    return true;
  } catch (e) {
    console.error("[NAV DEBUG] Navigation error:", e);
    return false;
  }
};

// Debug current user session
window.checkUserSession = function() {
  const userPanel = document.getElementById('user-status');
  console.log("[NAV DEBUG] User panel content:", userPanel ? userPanel.innerHTML : "Not found");
  
  // Add login buttons if missing
  if (userPanel && !userPanel.innerHTML.trim()) {
    console.log("[NAV DEBUG] Adding login buttons to empty user panel");
    userPanel.innerHTML = `
      <div class="logged-out">
        <a href="/auth/login" class="win98-btn login-btn">LOGIN</a>
        <a href="/auth/register" class="win98-btn register-btn">REGISTER</a>
      </div>
    `;
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
  console.log("[NAV DEBUG] DOM loaded, checking user session");
  window.checkUserSession();
});