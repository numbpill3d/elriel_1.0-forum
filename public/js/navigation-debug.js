/**
 * Elriel - Navigation Debugging
 * This file helps diagnose navigation issues in the application
 */

// Log all navigation attempts
window.navigationDebug = true;

document.addEventListener('DOMContentLoaded', function() {
  console.log("[NAV DEBUG] Page loaded:", window.location.pathname);
  
  // Add event listeners to all links
  const links = document.querySelectorAll('a[href]');
  links.forEach(link => {
    const originalHref = link.getAttribute('href');
    link.addEventListener('click', function(e) {
      if (window.navigationDebug) {
        console.log("[NAV DEBUG] Link clicked:", this.href);
        if (this.href.includes('/feed/') || 
            this.href.includes('/glyph/') || 
            this.href.includes('/whisper/') ||
            this.href.includes('/terminal/')) {
          e.preventDefault();
          console.log("[NAV DEBUG] Special navigation to:", this.href);
          
          // Show a temporary message
          const msg = document.createElement('div');
          msg.style.position = 'fixed';
          msg.style.top = '50%';
          msg.style.left = '50%';
          msg.style.transform = 'translate(-50%, -50%)';
          msg.style.padding = '20px';
          msg.style.background = 'rgba(0, 255, 0, 0.2)';
          msg.style.border = '1px solid #00ff00';
          msg.style.zIndex = '9999';
          msg.innerText = 'Navigating to: ' + this.href;
          document.body.appendChild(msg);
          
          // Delay navigation to allow seeing the message
          setTimeout(() => {
            window.location.href = this.href;
          }, 500);
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