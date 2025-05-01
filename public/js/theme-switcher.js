/**
 * Elriel - Theme Switcher
 * This script handles theme switching between dark and light modes
 */

// Initialize theme based on environment variable or user preference
document.addEventListener('DOMContentLoaded', function() {
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('elriel-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // Set initial theme
  if (savedTheme) {
    setTheme(savedTheme);
  } else {
    // Default to dark theme or user preference
    setTheme(prefersDark ? 'dark' : 'light');
  }
  
  // Add theme toggle button if it doesn't exist
  if (!document.getElementById('theme-toggle')) {
    const userPanel = document.querySelector('.user-panel') || document.querySelector('header');
    
    if (userPanel) {
      const themeToggle = document.createElement('button');
      themeToggle.id = 'theme-toggle';
      themeToggle.className = 'theme-toggle-btn';
      themeToggle.innerHTML = getCurrentTheme() === 'dark' ? '☀️' : '🌙';
      themeToggle.title = getCurrentTheme() === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
      
      themeToggle.addEventListener('click', function() {
        toggleTheme();
      });
      
      userPanel.appendChild(themeToggle);
      
      // Add styles for the toggle button
      if (!document.getElementById('theme-toggle-styles')) {
        const style = document.createElement('style');
        style.id = 'theme-toggle-styles';
        style.textContent = `
          .theme-toggle-btn {
            background: none;
            border: none;
            font-size: 1.2rem;
            cursor: pointer;
            margin-left: 10px;
            padding: 5px;
            border-radius: 50%;
            transition: background-color 0.3s;
          }
          
          .theme-toggle-btn:hover {
            background-color: rgba(128, 128, 128, 0.2);
          }
        `;
        document.head.appendChild(style);
      }
    }
  }
});

// Get current theme
function getCurrentTheme() {
  return document.body.classList.contains('theme-light') ? 'light' : 'dark';
}

// Set theme
function setTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.remove('theme-light');
    document.body.classList.add('theme-dark');
    document.documentElement.style.setProperty('--bg-color', '#0a0a0a');
    document.documentElement.style.setProperty('--terminal-bg', '#000000');
    document.documentElement.style.setProperty('--terminal-green', '#00ff00');
    document.documentElement.style.setProperty('--terminal-dim-green', '#00aa00');
    document.documentElement.style.setProperty('--terminal-blue', '#0077ff');
    document.documentElement.style.setProperty('--terminal-red', '#ff0033');
    document.documentElement.style.setProperty('--terminal-purple', '#cc00ff');
    document.documentElement.style.setProperty('--terminal-text', '#cccccc');
    document.documentElement.style.setProperty('--terminal-bright', '#ffffff');
    document.documentElement.style.setProperty('--terminal-dim', '#666666');
    document.documentElement.style.setProperty('--glow-color', 'rgba(0, 255, 0, 0.5)');
    document.documentElement.style.setProperty('--panel-bg', 'rgba(0, 20, 0, 0.7)');
    document.documentElement.style.setProperty('--panel-border', '1px solid rgba(0, 255, 0, 0.3)');
    document.documentElement.style.setProperty('--sidebar-bg', 'rgba(5, 10, 5, 0.8)');
  } else {
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-light');
    document.documentElement.style.setProperty('--bg-color', '#f0f0f0');
    document.documentElement.style.setProperty('--terminal-bg', '#ffffff');
    document.documentElement.style.setProperty('--terminal-green', '#008800');
    document.documentElement.style.setProperty('--terminal-dim-green', '#006600');
    document.documentElement.style.setProperty('--terminal-blue', '#0066cc');
    document.documentElement.style.setProperty('--terminal-red', '#cc0033');
    document.documentElement.style.setProperty('--terminal-purple', '#9900cc');
    document.documentElement.style.setProperty('--terminal-text', '#333333');
    document.documentElement.style.setProperty('--terminal-bright', '#000000');
    document.documentElement.style.setProperty('--terminal-dim', '#777777');
    document.documentElement.style.setProperty('--glow-color', 'rgba(0, 100, 0, 0.3)');
    document.documentElement.style.setProperty('--panel-bg', 'rgba(240, 250, 240, 0.9)');
    document.documentElement.style.setProperty('--panel-border', '1px solid rgba(0, 120, 0, 0.3)');
    document.documentElement.style.setProperty('--sidebar-bg', 'rgba(230, 240, 230, 0.9)');
  }
  
  // Update toggle button if it exists
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    themeToggle.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  }
  
  // Save preference
  localStorage.setItem('elriel-theme', theme);
  
  // Log theme change
  console.log('Theme set to:', theme);
}

// Toggle between themes
function toggleTheme() {
  const currentTheme = getCurrentTheme();
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}

// Expose theme functions globally
window.elrielTheme = {
  get: getCurrentTheme,
  set: setTheme,
  toggle: toggleTheme
};

console.log('Theme switcher initialized');
