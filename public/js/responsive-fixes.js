/**
 * Elriel - Responsive Fixes
 * This script adds JavaScript support for responsive design features
 */

document.addEventListener('DOMContentLoaded', function() {
  // Add mobile navigation toggle
  addMobileNavToggle();
  
  // Fix viewport height issues on mobile
  fixViewportHeight();
  
  // Add responsive table support
  makeTablesResponsive();
  
  // Add touch-friendly navigation
  enhanceTouchNavigation();
  
  // Fix form elements on mobile
  fixMobileForms();
  
  console.log('[RESPONSIVE] Responsive fixes initialized');
});

/**
 * Add mobile navigation toggle button
 */
function addMobileNavToggle() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;
  
  // Only add if we don't already have one
  if (document.querySelector('.mobile-nav-toggle')) return;
  
  // Create toggle button
  const toggleButton = document.createElement('button');
  toggleButton.className = 'mobile-nav-toggle';
  toggleButton.setAttribute('aria-label', 'Toggle navigation');
  toggleButton.innerHTML = `
    <span class="toggle-icon"></span>
    <span class="toggle-text">MENU</span>
  `;
  
  // Add toggle button to the DOM
  const header = document.querySelector('.main-header');
  if (header) {
    header.appendChild(toggleButton);
  } else {
    document.body.insertBefore(toggleButton, document.body.firstChild);
  }
  
  // Add click handler
  toggleButton.addEventListener('click', function() {
    sidebar.classList.toggle('active');
    this.classList.toggle('active');
    document.body.classList.toggle('nav-open');
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', function(e) {
    if (sidebar.classList.contains('active') && 
        !sidebar.contains(e.target) && 
        !toggleButton.contains(e.target)) {
      sidebar.classList.remove('active');
      toggleButton.classList.remove('active');
      document.body.classList.remove('nav-open');
    }
  });
  
  // Add styles for the toggle button
  const style = document.createElement('style');
  style.textContent = `
    .mobile-nav-toggle {
      display: none;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background-color: var(--panel-bg, rgba(15, 0, 20, 0.8));
      border: var(--panel-border, 1px solid rgba(138, 43, 226, 0.3));
      color: var(--terminal-text, #d8b8ff);
      padding: 8px 12px;
      cursor: pointer;
      z-index: 100;
    }
    
    .toggle-icon {
      position: relative;
      width: 20px;
      height: 2px;
      background-color: var(--terminal-green, #8a2be2);
      transition: all 0.3s ease;
    }
    
    .toggle-icon::before,
    .toggle-icon::after {
      content: '';
      position: absolute;
      width: 20px;
      height: 2px;
      background-color: var(--terminal-green, #8a2be2);
      transition: all 0.3s ease;
    }
    
    .toggle-icon::before {
      transform: translateY(-6px);
    }
    
    .toggle-icon::after {
      transform: translateY(6px);
    }
    
    .mobile-nav-toggle.active .toggle-icon {
      background-color: transparent;
    }
    
    .mobile-nav-toggle.active .toggle-icon::before {
      transform: rotate(45deg);
    }
    
    .mobile-nav-toggle.active .toggle-icon::after {
      transform: rotate(-45deg);
    }
    
    @media (max-width: 768px) {
      .mobile-nav-toggle {
        display: flex;
      }
      
      .sidebar {
        position: fixed;
        top: 0;
        left: -100%;
        width: 80%;
        max-width: 300px;
        height: 100%;
        z-index: 99;
        transition: left 0.3s ease;
        background-color: var(--sidebar-bg, rgba(8, 0, 10, 0.95));
        padding: 20px;
        overflow-y: auto;
      }
      
      .sidebar.active {
        left: 0;
      }
      
      body.nav-open::after {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 98;
      }
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * Fix viewport height issues on mobile browsers
 */
function fixViewportHeight() {
  // Fix the 100vh issue on mobile browsers
  const setVH = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };
  
  // Set initial value
  setVH();
  
  // Update on resize and orientation change
  window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', setVH);
  
  // Add CSS variable usage
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 768px) {
      .container, .content-wrapper {
        min-height: calc(var(--vh, 1vh) * 100);
      }
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * Make tables responsive
 */
function makeTablesResponsive() {
  const tables = document.querySelectorAll('table:not(.responsive-table)');
  
  tables.forEach(table => {
    // Add responsive class
    table.classList.add('responsive-table');
    
    // Wrap table in a container for horizontal scrolling
    const wrapper = document.createElement('div');
    wrapper.className = 'table-responsive-wrapper';
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });
  
  // Add styles for responsive tables
  const style = document.createElement('style');
  style.textContent = `
    .table-responsive-wrapper {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    
    @media (max-width: 768px) {
      .responsive-table {
        min-width: 500px;
      }
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * Enhance touch navigation
 */
function enhanceTouchNavigation() {
  // Add active state to buttons and links for touch feedback
  const touchElements = document.querySelectorAll('a, button, .clickable');
  
  touchElements.forEach(element => {
    element.addEventListener('touchstart', function() {
      this.classList.add('touch-active');
    }, { passive: true });
    
    element.addEventListener('touchend', function() {
      this.classList.remove('touch-active');
    }, { passive: true });
  });
  
  // Add styles for touch feedback
  const style = document.createElement('style');
  style.textContent = `
    .touch-active {
      opacity: 0.8;
      transform: scale(0.98);
    }
  `;
  
  document.head.appendChild(style);
}

/**
 * Fix form elements on mobile
 */
function fixMobileForms() {
  // Increase font size for inputs to prevent zoom on iOS
  const formElements = document.querySelectorAll('input, select, textarea');
  
  formElements.forEach(element => {
    element.style.fontSize = '16px';
  });
  
  // Fix date inputs on iOS
  const dateInputs = document.querySelectorAll('input[type="date"]');
  
  dateInputs.forEach(input => {
    // iOS doesn't support date inputs properly, so we need to add a pattern
    input.setAttribute('pattern', '\\d{4}-\\d{2}-\\d{2}');
    input.setAttribute('placeholder', 'YYYY-MM-DD');
  });
}

// Expose functions globally
window.elrielResponsive = {
  addMobileNavToggle,
  fixViewportHeight,
  makeTablesResponsive,
  enhanceTouchNavigation,
  fixMobileForms
};
