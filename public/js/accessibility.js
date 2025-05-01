/**
 * Elriel - Accessibility Enhancements
 * This script improves accessibility features across the application
 */

document.addEventListener('DOMContentLoaded', function() {
  // Add skip to content link for keyboard users
  addSkipToContentLink();
  
  // Enhance focus styles for keyboard navigation
  enhanceFocusStyles();
  
  // Add ARIA labels to elements that need them
  addAriaLabels();
  
  // Make sure all interactive elements are keyboard accessible
  ensureKeyboardAccessibility();
  
  // Add high contrast mode toggle
  addHighContrastModeToggle();
  
  console.log('Accessibility enhancements initialized');
});

/**
 * Add a skip to content link for keyboard users
 */
function addSkipToContentLink() {
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.className = 'skip-to-content';
  skipLink.textContent = 'Skip to content';
  
  // Add styles for the skip link
  const skipLinkStyles = document.createElement('style');
  skipLinkStyles.textContent = `
    .skip-to-content {
      position: absolute;
      top: -40px;
      left: 0;
      background: var(--terminal-green);
      color: var(--terminal-bg);
      padding: 8px;
      z-index: 9999;
      transition: top 0.3s;
    }
    
    .skip-to-content:focus {
      top: 0;
    }
  `;
  
  document.head.appendChild(skipLinkStyles);
  document.body.insertBefore(skipLink, document.body.firstChild);
  
  // Add ID to main content area if it doesn't exist
  const mainContent = document.querySelector('main') || document.querySelector('.main-content');
  if (mainContent && !mainContent.id) {
    mainContent.id = 'main-content';
  }
}

/**
 * Enhance focus styles for keyboard navigation
 */
function enhanceFocusStyles() {
  const focusStyles = document.createElement('style');
  focusStyles.textContent = `
    /* Enhanced focus styles */
    a:focus,
    button:focus,
    input:focus,
    textarea:focus,
    select:focus,
    [tabindex]:focus {
      outline: 2px solid var(--terminal-green) !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 4px rgba(0, 255, 0, 0.2) !important;
    }
    
    /* Only show focus styles for keyboard navigation */
    body:not(.using-mouse) *:focus {
      outline: 2px solid var(--terminal-green) !important;
      outline-offset: 2px !important;
    }
  `;
  
  document.head.appendChild(focusStyles);
  
  // Add class to body when using mouse vs keyboard
  document.body.addEventListener('mousedown', function() {
    document.body.classList.add('using-mouse');
  });
  
  document.body.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      document.body.classList.remove('using-mouse');
    }
  });
}

/**
 * Add ARIA labels to elements that need them
 */
function addAriaLabels() {
  // Add labels to icon buttons
  document.querySelectorAll('button:not([aria-label])').forEach(button => {
    if (!button.textContent.trim() && !button.getAttribute('aria-label')) {
      // Try to infer a label from title or nearby context
      const label = button.getAttribute('title') || 
                    button.getAttribute('data-tooltip') || 
                    'Button';
      button.setAttribute('aria-label', label);
    }
  });
  
  // Add labels to form controls without labels
  document.querySelectorAll('input:not([aria-label])').forEach(input => {
    if (!input.id || !document.querySelector(`label[for="${input.id}"]`)) {
      const label = input.getAttribute('placeholder') || 
                    input.getAttribute('name') || 
                    'Input field';
      input.setAttribute('aria-label', label);
    }
  });
  
  // Add labels to images without alt text
  document.querySelectorAll('img:not([alt])').forEach(img => {
    img.setAttribute('alt', img.getAttribute('src').split('/').pop() || 'Image');
  });
}

/**
 * Make sure all interactive elements are keyboard accessible
 */
function ensureKeyboardAccessibility() {
  // Add tabindex to clickable divs without it
  document.querySelectorAll('div[onclick], div.clickable').forEach(div => {
    if (!div.getAttribute('tabindex')) {
      div.setAttribute('tabindex', '0');
      
      // Also add keydown event for Enter key
      div.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          div.click();
        }
      });
    }
  });
}

/**
 * Add high contrast mode toggle
 */
function addHighContrastModeToggle() {
  // Check if high contrast mode was previously enabled
  const highContrastEnabled = localStorage.getItem('high-contrast-mode') === 'true';
  
  if (highContrastEnabled) {
    document.body.classList.add('high-contrast');
  }
  
  // Create high contrast styles
  const highContrastStyles = document.createElement('style');
  highContrastStyles.textContent = `
    body.high-contrast {
      --bg-color: #000000 !important;
      --terminal-bg: #000000 !important;
      --terminal-green: #00FF00 !important;
      --terminal-dim-green: #00CC00 !important;
      --terminal-blue: #00FFFF !important;
      --terminal-red: #FF0000 !important;
      --terminal-purple: #FF00FF !important;
      --terminal-text: #FFFFFF !important;
      --terminal-bright: #FFFFFF !important;
      --terminal-dim: #CCCCCC !important;
      --glow-color: rgba(0, 255, 0, 0.7) !important;
      --panel-bg: rgba(0, 0, 0, 0.9) !important;
      --panel-border: 2px solid #00FF00 !important;
      --sidebar-bg: rgba(0, 0, 0, 0.9) !important;
    }
    
    body.high-contrast a,
    body.high-contrast button,
    body.high-contrast .nav-links a {
      text-decoration: underline !important;
    }
    
    body.high-contrast img {
      filter: contrast(1.5) !important;
    }
    
    .high-contrast-toggle {
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.7);
      color: #FFFFFF;
      border: 1px solid #FFFFFF;
      padding: 8px 12px;
      font-family: var(--terminal-font, monospace);
      cursor: pointer;
      z-index: 1000;
    }
  `;
  
  document.head.appendChild(highContrastStyles);
  
  // Add toggle button
  const toggleButton = document.createElement('button');
  toggleButton.className = 'high-contrast-toggle';
  toggleButton.textContent = 'High Contrast';
  toggleButton.setAttribute('aria-label', 'Toggle high contrast mode');
  toggleButton.setAttribute('title', 'Toggle high contrast mode');
  
  toggleButton.addEventListener('click', function() {
    document.body.classList.toggle('high-contrast');
    const isEnabled = document.body.classList.contains('high-contrast');
    localStorage.setItem('high-contrast-mode', isEnabled ? 'true' : 'false');
  });
  
  document.body.appendChild(toggleButton);
}

// Expose accessibility functions globally
window.elrielAccessibility = {
  addSkipToContentLink,
  enhanceFocusStyles,
  addAriaLabels,
  ensureKeyboardAccessibility,
  addHighContrastModeToggle
};
