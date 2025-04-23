/**
 * Elriel - Windows 98 Style Windows
 * Provides functionality for creating and managing Windows 98-style windows on profiles
 */

class Win98Window {
  constructor(options = {}) {
    this.id = options.id || 'win-' + Math.floor(Math.random() * 10000);
    this.title = options.title || 'Untitled Window';
    this.content = options.content || '';
    this.contentType = options.contentType || 'text';
    this.icon = options.icon || 'default';
    this.width = options.width || 300;
    this.height = options.height || 200;
    this.x = options.x || 50;
    this.y = options.y || 50;
    this.isMinimized = false;
    this.isMaximized = false;
    this.zIndex = options.zIndex || 10;
    this.parent = options.parent || document.body;
    
    this.create();
    this.setupEventListeners();
  }
  
  create() {
    // Create window element
    this.element = document.createElement('div');
    this.element.className = 'win98-window';
    this.element.id = this.id;
    this.element.style.width = this.width + 'px';
    this.element.style.height = this.height + 'px';
    this.element.style.left = this.x + 'px';
    this.element.style.top = this.y + 'px';
    this.element.style.zIndex = this.zIndex;
    
    // Create titlebar
    this.titlebar = document.createElement('div');
    this.titlebar.className = 'win98-titlebar';
    
    let iconHtml = '';
    if (this.icon !== 'none') {
      iconHtml = `<img src="/images/win98-icons/${this.icon}.png" class="win98-titlebar-icon" alt="${this.title}">`;
    }
    
    this.titlebar.innerHTML = `
      ${iconHtml}
      <div class="win98-titlebar-text">${this.title}</div>
      <div class="win98-controls">
        <div class="win98-button minimize-btn" title="Minimize"></div>
        <div class="win98-button maximize-btn" title="Maximize"></div>
        <div class="win98-button close-btn" title="Close"></div>
      </div>
    `;
    
    // Create content area
    this.contentArea = document.createElement('div');
    this.contentArea.className = 'win98-content';
    
    // Add content based on type
    this.setContent(this.content, this.contentType);
    
    // Assemble window
    this.element.appendChild(this.titlebar);
    this.element.appendChild(this.contentArea);
    
    // Add to parent
    this.parent.appendChild(this.element);
    
    // Bring to front when created
    this.bringToFront();
  }
  
  setContent(content, type = 'text') {
    this.content = content;
    this.contentType = type;
    
    switch (type) {
      case 'text':
        this.contentArea.innerHTML = `<div class="win98-paragraph">${content}</div>`;
        break;
        
      case 'list':
        let listItems = '';
        if (Array.isArray(content)) {
          listItems = content.map(item => `<li>${item}</li>`).join('');
        } else {
          listItems = content;
        }
        this.contentArea.innerHTML = `<ul class="win98-list">${listItems}</ul>`;
        break;
        
      case 'gallery':
        let galleryItems = '';
        if (Array.isArray(content)) {
          galleryItems = content.map(item => `
            <div class="win98-gallery-item">
              <img src="${item.src}" alt="${item.caption || ''}">
              ${item.caption ? `<div class="win98-gallery-caption">${item.caption}</div>` : ''}
            </div>
          `).join('');
        }
        this.contentArea.innerHTML = `<div class="win98-gallery">${galleryItems}</div>`;
        break;
        
      case 'iframe':
        const height = content.height || 200;
        this.contentArea.innerHTML = `
          <div class="win98-iframe-container">
            <iframe src="${content.src}" height="${height}" frameborder="0" allowfullscreen></iframe>
          </div>
        `;
        break;
        
      case 'html':
        this.contentArea.innerHTML = content;
        break;
        
      case 'table':
        this.contentArea.innerHTML = `
          <div class="win98-inset">
            <table class="win98-table">${content}</table>
          </div>
        `;
        break;
        
      default:
        this.contentArea.innerHTML = content;
    }
  }
  
  setupEventListeners() {
    // Titlebar drag functionality
    this.titlebar.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('win98-button')) return;
      
      // Bring window to front when starting to drag
      this.bringToFront();
      
      const initialX = e.clientX;
      const initialY = e.clientY;
      const initialLeft = this.element.offsetLeft;
      const initialTop = this.element.offsetTop;
      
      const moveWindow = (moveEvent) => {
        const dx = moveEvent.clientX - initialX;
        const dy = moveEvent.clientY - initialY;
        
        this.element.style.left = initialLeft + dx + 'px';
        this.element.style.top = initialTop + dy + 'px';
      };
      
      const stopMoving = () => {
        document.removeEventListener('mousemove', moveWindow);
        document.removeEventListener('mouseup', stopMoving);
        
        // Update window position
        this.x = this.element.offsetLeft;
        this.y = this.element.offsetTop;
        
        // Save window configuration
        this.saveConfiguration();
      };
      
      document.addEventListener('mousemove', moveWindow);
      document.addEventListener('mouseup', stopMoving);
    });
    
    // Button functionality
    this.titlebar.querySelector('.minimize-btn').addEventListener('click', () => this.minimize());
    this.titlebar.querySelector('.maximize-btn').addEventListener('click', () => this.maximize());
    this.titlebar.querySelector('.close-btn').addEventListener('click', () => this.close());
    
    // Bring to front on click
    this.element.addEventListener('mousedown', () => this.bringToFront());
  }
  
  minimize() {
    this.isMinimized = !this.isMinimized;
    this.element.classList.toggle('minimized', this.isMinimized);
    this.saveConfiguration();
  }
  
  maximize() {
    this.isMaximized = !this.isMaximized;
    
    if (this.isMaximized) {
      // Store current size and position for restore
      this.restoreState = {
        width: this.element.style.width,
        height: this.element.style.height,
        left: this.element.style.left,
        top: this.element.style.top
      };
      
      // Calculate available space (excluding margins)
      const parentRect = this.parent.getBoundingClientRect();
      const margin = 10;
      
      // Set maximized state
      this.element.style.width = (parentRect.width - margin * 2) + 'px';
      this.element.style.height = (parentRect.height - margin * 2) + 'px';
      this.element.style.left = margin + 'px';
      this.element.style.top = margin + 'px';
    } else {
      // Restore previous size and position
      this.element.style.width = this.restoreState.width;
      this.element.style.height = this.restoreState.height;
      this.element.style.left = this.restoreState.left;
      this.element.style.top = this.restoreState.top;
    }
    
    this.saveConfiguration();
  }
  
  close() {
    this.element.remove();
    
    // Remove window configuration from storage
    this.removeConfiguration();
    
    // Trigger close event
    const closeEvent = new CustomEvent('win98window:close', { detail: { id: this.id } });
    document.dispatchEvent(closeEvent);
  }
  
  bringToFront() {
    // Find highest z-index
    const windows = document.querySelectorAll('.win98-window');
    let maxZ = this.zIndex;
    
    windows.forEach(win => {
      const z = parseInt(win.style.zIndex || 10);
      if (z > maxZ) maxZ = z;
    });
    
    // Set this window's z-index to highest + 1
    this.zIndex = maxZ + 1;
    this.element.style.zIndex = this.zIndex;
  }
  
  saveConfiguration() {
    // Get current config
    const config = {
      id: this.id,
      title: this.title,
      contentType: this.contentType,
      content: this.content,
      icon: this.icon,
      width: parseInt(this.element.style.width),
      height: parseInt(this.element.style.height),
      x: parseInt(this.element.style.left),
      y: parseInt(this.element.style.top),
      isMinimized: this.isMinimized,
      zIndex: this.zIndex
    };
    
    // Save to local storage (real implementation would save to server)
    if (window.saveProfileWindow) {
      window.saveProfileWindow(config);
    } else {
      // Fallback to localStorage for testing
      let windows = JSON.parse(localStorage.getItem('win98windows') || '[]');
      const index = windows.findIndex(w => w.id === this.id);
      
      if (index >= 0) {
        windows[index] = config;
      } else {
        windows.push(config);
      }
      
      localStorage.setItem('win98windows', JSON.stringify(windows));
    }
  }
  
  removeConfiguration() {
    // Remove from local storage (real implementation would remove from server)
    if (window.removeProfileWindow) {
      window.removeProfileWindow(this.id);
    } else {
      // Fallback to localStorage for testing
      let windows = JSON.parse(localStorage.getItem('win98windows') || '[]');
      windows = windows.filter(w => w.id !== this.id);
      localStorage.setItem('win98windows', JSON.stringify(windows));
    }
  }
}

// Window Manager
class Win98WindowManager {
  constructor(containerId = 'profile-windows') {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.windows = [];
    
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = containerId;
      document.body.appendChild(this.container);
    }
    
    // Set up container for windows
    this.container.style.position = 'relative';
    
    // Initialize existing windows if any
    this.loadWindows();
  }
  
  loadWindows() {
    // Load windows from storage (real implementation would load from server)
    let windowConfigs = [];
    
    if (window.getProfileWindows) {
      windowConfigs = window.getProfileWindows();
    } else {
      // Fallback to localStorage for testing
      windowConfigs = JSON.parse(localStorage.getItem('win98windows') || '[]');
    }
    
    // Create windows from saved configs
    windowConfigs.forEach(config => {
      config.parent = this.container;
      this.createWindow(config);
    });
  }
  
  createWindow(config) {
    const window = new Win98Window({
      ...config,
      parent: this.container
    });
    
    this.windows.push(window);
    return window;
  }
  
  closeAllWindows() {
    while (this.windows.length > 0) {
      const window = this.windows.pop();
      window.close();
    }
  }
}

// Window creation form handler
function initWindowCreator(formId = 'new-window-form') {
  const form = document.getElementById(formId);
  if (!form) return;
  
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const title = form.querySelector('#window-title').value || 'Untitled Window';
    const contentType = form.querySelector('#content-type').value;
    const icon = form.querySelector('#window-icon').value;
    
    let content = '';
    
    // Get content based on selected type
    switch (contentType) {
      case 'text':
        content = form.querySelector('#text-content').value;
        break;
        
      case 'list':
        const listItems = form.querySelector('#list-content').value.split('\n');
        content = listItems;
        break;
        
      case 'gallery':
        // Parse gallery items (format: url|caption)
        const galleryLines = form.querySelector('#gallery-content').value.split('\n');
        content = galleryLines.map(line => {
          const [src, caption] = line.split('|');
          return { src, caption };
        });
        break;
        
      case 'iframe':
        content = {
          src: form.querySelector('#iframe-url').value,
          height: form.querySelector('#iframe-height').value
        };
        break;
        
      case 'html':
        content = form.querySelector('#html-content').value;
        break;
        
      case 'table':
        content = form.querySelector('#table-content').value;
        break;
    }
    
    // Calculate position for new window (staggered)
    const windowCount = document.querySelectorAll('.win98-window').length;
    const x = 50 + (windowCount * 20);
    const y = 50 + (windowCount * 20);
    
    // Create the window
    if (window.windowManager) {
      window.windowManager.createWindow({
        title,
        contentType,
        content,
        icon,
        x,
        y
      });
    }
    
    // Hide the form
    const modal = document.getElementById('new-window-modal');
    if (modal) modal.style.display = 'none';
  });
  
  // Show/hide different content fields based on selected type
  const contentTypeSelect = form.querySelector('#content-type');
  if (contentTypeSelect) {
    contentTypeSelect.addEventListener('change', function() {
      const contentType = this.value;
      
      // Hide all content fields
      const contentFields = form.querySelectorAll('.content-field');
      contentFields.forEach(field => field.style.display = 'none');
      
      // Show selected content field
      const selectedField = form.querySelector(`#${contentType}-field`);
      if (selectedField) selectedField.style.display = 'block';
    });
    
    // Trigger change event to initialize
    contentTypeSelect.dispatchEvent(new Event('change'));
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  // Create window manager if on a profile page
  if (document.getElementById('profile-windows')) {
    window.windowManager = new Win98WindowManager('profile-windows');
    initWindowCreator('new-window-form');
  }
  
  // Initialize any buttons that open the window creator
  const createButtons = document.querySelectorAll('.create-window-btn');
  createButtons.forEach(button => {
    button.addEventListener('click', function() {
      const modal = document.getElementById('new-window-modal');
      if (modal) modal.style.display = 'flex';
    });
  });
  
  // Close modal when clicking outside
  const modals = document.querySelectorAll('.win98-overlay');
  modals.forEach(modal => {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        this.style.display = 'none';
      }
    });
  });
});