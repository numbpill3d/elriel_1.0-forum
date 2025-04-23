/**
 * Elriel - Windows 98 Style Windows
 * Provides functionality for creating and managing Windows 98-style windows on profiles
 */

// Window Manager - Simplified version
class Win98WindowManager {
  constructor(containerId = 'profile-windows') {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.windows = [];
    
    if (!this.container) {
      console.log('Windows container not found, deferring initialization');
      return;
    }
    
    // Set up container for windows
    this.container.style.position = 'relative';
    console.log('Windows 98 manager initialized');
  }
  
  // Safe loading of windows
  loadWindows() {
    console.log('Windows would load here in the future');
    return [];
  }
  
  // Create a new window safely
  createWindow(config) {
    console.log('Window creation requested:', config);
    return null;
  }
}

// Initialize on page load with error handling
document.addEventListener('DOMContentLoaded', function() {
  try {
    // Create window manager if on a profile page
    if (document.getElementById('profile-windows')) {
      window.windowManager = new Win98WindowManager('profile-windows');
      console.log('Win98 windows system initialized');
    }
  } catch (e) {
    console.error('Error initializing Windows 98 features:', e);
  }
});

// Safe getProfileWindows function that won't break the site
window.getProfileWindows = function() {
  try {
    return JSON.parse(localStorage.getItem('win98windows') || '[]');
  } catch (e) {
    console.error('Error loading windows:', e);
    return [];
  }
};

// Safe window saving function
window.saveProfileWindow = function(config) {
  try {
    let windows = JSON.parse(localStorage.getItem('win98windows') || '[]');
    const index = windows.findIndex(w => w.id === config.id);
    
    if (index >= 0) {
      windows[index] = config;
    } else {
      windows.push(config);
    }
    
    localStorage.setItem('win98windows', JSON.stringify(windows));
    return true;
  } catch (e) {
    console.error('Error saving window:', e);
    return false;
  }
};

// Safe window removal function
window.removeProfileWindow = function(id) {
  try {
    let windows = JSON.parse(localStorage.getItem('win98windows') || '[]');
    windows = windows.filter(w => w.id !== id);
    localStorage.setItem('win98windows', JSON.stringify(windows));
    return true;
  } catch (e) {
    console.error('Error removing window:', e);
    return false;
  }
};

console.log('Windows 98 script loaded successfully');