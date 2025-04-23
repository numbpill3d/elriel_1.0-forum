/**
 * Elriel - Error Logger Script
 * This script helps identify 404 errors and resource loading issues
 */

// Record all 404 errors
window.addEventListener('error', function(e) {
  if (e.target && (e.target.tagName === 'IMG' || e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK')) {
    console.error('Resource loading error:', e.target.src || e.target.href);
  }
});

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