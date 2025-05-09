/**
 * Sidebar Manager
 * Handles responsive sidebar functionality across all ELRIEL pages
 * Version 1.0.1
 */

(function() {
  // Initialize when DOM is fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    console.log("[Sidebar Manager] Initializing...");
    initSidebar();
  });

  // Initialize sidebar functionality
  function initSidebar() {
    const mobileNavToggle = document.getElementById('mobile-nav-toggle');
    const sidebar = document.getElementById('main-sidebar');
    
    if (!mobileNavToggle || !sidebar) {
      console.warn("[Sidebar Manager] Required elements not found, sidebar functionality limited");
      return;
    }
    
    // Set up toggle button click handler
    mobileNavToggle.addEventListener('click', function() {
      sidebar.classList.toggle('active');
      this.textContent = sidebar.classList.contains('active') ? 'HIDE NAVIGATION' : 'SHOW NAVIGATION';
      
      // Store sidebar state in localStorage
      localStorage.setItem('sidebar-active', sidebar.classList.contains('active') ? 'true' : 'false');
      
      // Log to console for debugging
      console.log(`[Sidebar Manager] Sidebar ${sidebar.classList.contains('active') ? 'activated' : 'deactivated'}`);
      
      // Emit custom event for other scripts to listen to
      document.dispatchEvent(new CustomEvent('sidebarToggle', { 
        detail: { active: sidebar.classList.contains('active') } 
      }));
    });
    
    // Set initial state on page load
    const sidebarActive = localStorage.getItem('sidebar-active');
    if (sidebarActive === 'true') {
      sidebar.classList.add('active');
      mobileNavToggle.textContent = 'HIDE NAVIGATION';
    }
    
    // Handle window resize events to adjust sidebar as needed
    let resizeTimeout;
    window.addEventListener('resize', function() {
      // Debounce the resize handler
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function() {
        handleResize(sidebar);
      }, 250);
    });
    
    // Initial check for screen size
    handleResize(sidebar);
    
    // Add accessibility support
    enhanceAccessibility(mobileNavToggle, sidebar);
    
    console.log("[Sidebar Manager] Initialization complete");
  }
  
  // Handle window resize
  function handleResize(sidebar) {
    // Always show sidebar on desktop regardless of active state
    if (window.innerWidth > 768) {
      sidebar.style.display = 'block';
    } else {
      // On mobile, respect the active state
      sidebar.style.display = sidebar.classList.contains('active') ? 'block' : '';
    }
  }
  
  // Add accessibility enhancements
  function enhanceAccessibility(toggle, sidebar) {
    // Add ARIA attributes
    toggle.setAttribute('aria-expanded', sidebar.classList.contains('active') ? 'true' : 'false');
    toggle.setAttribute('aria-controls', 'main-sidebar');
    sidebar.setAttribute('aria-hidden', sidebar.classList.contains('active') ? 'false' : 'true');
    
    // Update ARIA attributes when toggled
    toggle.addEventListener('click', function() {
      toggle.setAttribute('aria-expanded', sidebar.classList.contains('active') ? 'true' : 'false');
      sidebar.setAttribute('aria-hidden', sidebar.classList.contains('active') ? 'false' : 'true');
    });
    
    // Add keyboard support
    toggle.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle.click();
      }
    });
  }
})();