/**
 * Elriel - Navigation Debugging
 * This file helps diagnose navigation issues in the application
 */

// Log all navigation attempts
window.navigationDebug = true;

document.addEventListener('DOMContentLoaded', function() {
  console.log("[NAV DEBUG] Page loaded:", window.location.pathname);
  
  // Just log navigation without intercepting it
  const links = document.querySelectorAll('a[href]');
  links.forEach(link => {
    const originalHref = link.getAttribute('href');
    link.addEventListener('click', function(e) {
      if (window.navigationDebug) {
        console.log("[NAV DEBUG] Link clicked:", this.href);
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