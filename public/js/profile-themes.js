/**
 * Elriel - Profile Theme Templates
 * This script provides theme templates for user profiles
 */

// Theme templates collection
const profileThemes = {
  // Default theme - Terminal style
  terminal: {
    name: "Terminal",
    description: "Classic terminal style with green text on dark background",
    css: `
      /* Terminal Theme */
      .profile-view-content {
        background-color: rgba(0, 0, 0, 0.9);
        color: #00ff00;
        font-family: monospace;
      }
      
      .profile-container {
        border: 1px solid #00ff00;
        background-color: rgba(0, 20, 0, 0.3);
        margin-bottom: 1.5rem;
      }
      
      .container-header {
        background-color: rgba(0, 40, 0, 0.5);
        border-bottom: 1px solid #00ff00;
        padding: 0.5rem 1rem;
      }
      
      .container-title {
        color: #00ff00;
        font-family: monospace;
        font-size: 1.2rem;
        margin: 0;
      }
      
      .container-content {
        padding: 1rem;
      }
      
      .profile-view-header {
        border: 1px solid #00ff00;
      }
      
      .profile-view-info {
        background-color: rgba(0, 0, 0, 0.8);
        border: 1px solid #00ff00;
      }
      
      .profile-view-info h3 {
        color: #00ff00;
      }
      
      .profile-view-district {
        color: #00aa00;
      }
      
      .profile-nav-bar {
        background-color: #000000;
        border: 1px solid #00ff00;
      }
      
      .profile-nav-item {
        color: #00ff00;
        border-right: 1px solid #00aa00;
      }
      
      .profile-nav-item:hover, .profile-nav-item.active {
        background-color: #003300;
      }
    `,
    preview: '/images/themes/terminal-preview.jpg'
  },
  
  // Cyberpunk theme
  cyberpunk: {
    name: "Cyberpunk",
    description: "Neon colors with a dark background",
    css: `
      /* Cyberpunk Theme */
      .profile-view-content {
        background-color: #0a0a1a;
        color: #f0f0ff;
        font-family: 'Courier New', monospace;
      }
      
      .profile-container {
        border: 1px solid #ff00ff;
        background-color: rgba(20, 0, 30, 0.6);
        margin-bottom: 1.5rem;
        box-shadow: 0 0 10px rgba(255, 0, 255, 0.5);
      }
      
      .container-header {
        background-color: rgba(40, 0, 60, 0.8);
        border-bottom: 1px solid #ff00ff;
        padding: 0.5rem 1rem;
      }
      
      .container-title {
        color: #ff00ff;
        font-family: 'Arial', sans-serif;
        font-size: 1.2rem;
        margin: 0;
        text-shadow: 0 0 5px #ff00ff;
      }
      
      .container-content {
        padding: 1rem;
      }
      
      .profile-view-header {
        border: 1px solid #ff00ff;
        box-shadow: 0 0 15px rgba(255, 0, 255, 0.5);
      }
      
      .profile-view-info {
        background-color: rgba(20, 0, 30, 0.8);
        border: 1px solid #ff00ff;
      }
      
      .profile-view-info h3 {
        color: #00ffff;
        text-shadow: 0 0 5px #00ffff;
      }
      
      .profile-view-district {
        color: #ff00ff;
      }
      
      .profile-nav-bar {
        background-color: #0a0a1a;
        border: 1px solid #ff00ff;
      }
      
      .profile-nav-item {
        color: #00ffff;
        border-right: 1px solid #ff00ff;
      }
      
      .profile-nav-item:hover, .profile-nav-item.active {
        background-color: rgba(255, 0, 255, 0.2);
        text-shadow: 0 0 5px #00ffff;
      }
    `,
    preview: '/images/themes/cyberpunk-preview.jpg'
  },
  
  // Retro Windows 98 theme
  win98: {
    name: "Windows 98",
    description: "Classic Windows 98 style interface",
    css: `
      /* Windows 98 Theme */
      .profile-view-content {
        background-color: #c0c0c0;
        color: #000000;
        font-family: 'Arial', sans-serif;
      }
      
      .profile-container {
        border: 2px outset #ffffff;
        background-color: #c0c0c0;
        margin-bottom: 1.5rem;
      }
      
      .container-header {
        background-color: #000080;
        padding: 0.25rem 0.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .container-title {
        color: #ffffff;
        font-family: 'Arial', sans-serif;
        font-size: 1rem;
        margin: 0;
        font-weight: bold;
      }
      
      .container-content {
        padding: 1rem;
        border: 2px inset #ffffff;
        background-color: #ffffff;
      }
      
      .profile-view-header {
        border: 2px outset #ffffff;
      }
      
      .profile-view-info {
        background-color: #c0c0c0;
        border: 2px outset #ffffff;
      }
      
      .profile-view-info h3 {
        color: #000000;
      }
      
      .profile-view-district {
        color: #000080;
      }
      
      .profile-nav-bar {
        background-color: #c0c0c0;
        border: 2px outset #ffffff;
      }
      
      .profile-nav-item {
        color: #000000;
        border-right: 1px solid #808080;
      }
      
      .profile-nav-item:hover {
        background-color: #d0d0d0;
      }
      
      .profile-nav-item.active {
        background-color: #e0e0e0;
        box-shadow: inset 2px 2px 5px rgba(0, 0, 0, 0.3);
      }
    `,
    preview: '/images/themes/win98-preview.jpg'
  },
  
  // Vaporwave theme
  vaporwave: {
    name: "Vaporwave",
    description: "Retro 80s/90s aesthetic with pastel colors",
    css: `
      /* Vaporwave Theme */
      .profile-view-content {
        background-color: #330066;
        color: #ffffff;
        font-family: 'Arial', sans-serif;
        background-image: linear-gradient(45deg, #330066, #660066);
      }
      
      .profile-container {
        border: 3px solid #00ffff;
        background-color: rgba(102, 0, 102, 0.7);
        margin-bottom: 1.5rem;
        box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
      }
      
      .container-header {
        background-color: #ff00ff;
        padding: 0.5rem 1rem;
      }
      
      .container-title {
        color: #ffffff;
        font-family: 'Arial', sans-serif;
        font-size: 1.2rem;
        margin: 0;
        text-shadow: 2px 2px 0 #000000;
      }
      
      .container-content {
        padding: 1rem;
      }
      
      .profile-view-header {
        border: 3px solid #00ffff;
      }
      
      .profile-view-info {
        background-color: rgba(102, 0, 102, 0.8);
        border: 3px solid #ff00ff;
      }
      
      .profile-view-info h3 {
        color: #00ffff;
        text-shadow: 2px 2px 0 #000000;
      }
      
      .profile-view-district {
        color: #ff00ff;
      }
      
      .profile-nav-bar {
        background-color: #ff00ff;
      }
      
      .profile-nav-item {
        color: #ffffff;
        border-right: 2px solid #00ffff;
        text-shadow: 1px 1px 0 #000000;
      }
      
      .profile-nav-item:hover, .profile-nav-item.active {
        background-color: #cc00cc;
      }
    `,
    preview: '/images/themes/vaporwave-preview.jpg'
  },
  
  // Minimal theme
  minimal: {
    name: "Minimal",
    description: "Clean, minimalist design with ample whitespace",
    css: `
      /* Minimal Theme */
      .profile-view-content {
        background-color: #ffffff;
        color: #333333;
        font-family: 'Arial', sans-serif;
      }
      
      .profile-container {
        border: 1px solid #eeeeee;
        background-color: #ffffff;
        margin-bottom: 2rem;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      }
      
      .container-header {
        background-color: #fafafa;
        border-bottom: 1px solid #eeeeee;
        padding: 1rem;
      }
      
      .container-title {
        color: #333333;
        font-family: 'Arial', sans-serif;
        font-size: 1.2rem;
        margin: 0;
        font-weight: normal;
      }
      
      .container-content {
        padding: 1.5rem;
      }
      
      .profile-view-header {
        border: 1px solid #eeeeee;
      }
      
      .profile-view-info {
        background-color: #ffffff;
        border: 1px solid #eeeeee;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      }
      
      .profile-view-info h3 {
        color: #333333;
      }
      
      .profile-view-district {
        color: #666666;
      }
      
      .profile-nav-bar {
        background-color: #ffffff;
        border: 1px solid #eeeeee;
      }
      
      .profile-nav-item {
        color: #333333;
        border-right: 1px solid #eeeeee;
      }
      
      .profile-nav-item:hover {
        background-color: #f5f5f5;
      }
      
      .profile-nav-item.active {
        background-color: #f0f0f0;
        font-weight: bold;
      }
    `,
    preview: '/images/themes/minimal-preview.jpg'
  }
};

// Function to apply a theme
function applyProfileTheme(themeName) {
  // Get the theme
  const theme = profileThemes[themeName] || profileThemes.terminal;
  
  // Check if theme style element already exists
  let themeStyle = document.getElementById('profile-theme-style');
  
  if (!themeStyle) {
    // Create style element if it doesn't exist
    themeStyle = document.createElement('style');
    themeStyle.id = 'profile-theme-style';
    document.head.appendChild(themeStyle);
  }
  
  // Set the theme CSS
  themeStyle.textContent = theme.css;
  
  return theme;
}

// Function to get all available themes
function getAvailableThemes() {
  return Object.keys(profileThemes).map(key => ({
    id: key,
    name: profileThemes[key].name,
    description: profileThemes[key].description,
    preview: profileThemes[key].preview
  }));
}

// Export functions
window.profileThemes = {
  apply: applyProfileTheme,
  getAll: getAvailableThemes,
  themes: profileThemes
};
