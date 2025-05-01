/**
 * Elriel - Loading Indicator
 * This script provides consistent loading indicators across the application
 */

class ElrielLoadingIndicator {
  constructor(options = {}) {
    this.options = Object.assign({
      type: 'terminal', // terminal, spinner, progress, dots
      text: 'LOADING',
      container: null,
      autoShow: false,
      theme: document.body.classList.contains('theme-light') ? 'light' : 'dark',
      size: 'medium', // small, medium, large
      fullscreen: false
    }, options);
    
    this.element = null;
    this.visible = false;
    
    if (this.options.autoShow) {
      this.show();
    }
  }
  
  /**
   * Create the loading indicator element
   */
  createIndicator() {
    // Create container
    this.element = document.createElement('div');
    this.element.className = `elriel-loading ${this.options.type} ${this.options.size}`;
    
    if (this.options.fullscreen) {
      this.element.classList.add('fullscreen');
    }
    
    // Add theme class
    this.element.classList.add(this.options.theme);
    
    // Create content based on type
    switch (this.options.type) {
      case 'terminal':
        this.createTerminalLoader();
        break;
      case 'spinner':
        this.createSpinnerLoader();
        break;
      case 'progress':
        this.createProgressLoader();
        break;
      case 'dots':
        this.createDotsLoader();
        break;
      default:
        this.createTerminalLoader();
    }
    
    // Add styles if they don't exist
    if (!document.getElementById('elriel-loading-styles')) {
      this.addStyles();
    }
  }
  
  /**
   * Create terminal-style loading indicator
   */
  createTerminalLoader() {
    this.element.innerHTML = `
      <div class="loading-content">
        <div class="loading-text">${this.options.text}</div>
        <div class="loading-cursor"></div>
      </div>
    `;
  }
  
  /**
   * Create spinner loading indicator
   */
  createSpinnerLoader() {
    this.element.innerHTML = `
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">${this.options.text}</div>
      </div>
    `;
  }
  
  /**
   * Create progress bar loading indicator
   */
  createProgressLoader() {
    this.element.innerHTML = `
      <div class="loading-content">
        <div class="loading-text">${this.options.text}</div>
        <div class="loading-progress-container">
          <div class="loading-progress-bar"></div>
        </div>
      </div>
    `;
  }
  
  /**
   * Create dots loading indicator
   */
  createDotsLoader() {
    this.element.innerHTML = `
      <div class="loading-content">
        <div class="loading-text">${this.options.text}</div>
        <div class="loading-dots">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
    `;
  }
  
  /**
   * Add styles for loading indicators
   */
  addStyles() {
    const style = document.createElement('style');
    style.id = 'elriel-loading-styles';
    style.textContent = `
      /* Base loading styles */
      .elriel-loading {
        font-family: var(--terminal-font, monospace);
        color: var(--terminal-green, #00ff00);
        text-align: center;
        padding: 20px;
        box-sizing: border-box;
      }
      
      .elriel-loading.light {
        color: var(--terminal-green, #008800);
      }
      
      .elriel-loading.fullscreen {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.8);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .elriel-loading.light.fullscreen {
        background-color: rgba(240, 240, 240, 0.8);
      }
      
      .loading-content {
        display: inline-block;
      }
      
      /* Size variations */
      .elriel-loading.small .loading-text {
        font-size: 14px;
      }
      
      .elriel-loading.medium .loading-text {
        font-size: 18px;
      }
      
      .elriel-loading.large .loading-text {
        font-size: 24px;
      }
      
      /* Terminal loader styles */
      .elriel-loading.terminal .loading-content {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .elriel-loading.terminal .loading-cursor {
        width: 10px;
        height: 18px;
        background-color: currentColor;
        margin-left: 5px;
        animation: blink 1s infinite;
      }
      
      .elriel-loading.terminal.small .loading-cursor {
        width: 8px;
        height: 14px;
      }
      
      .elriel-loading.terminal.large .loading-cursor {
        width: 12px;
        height: 24px;
      }
      
      @keyframes blink {
        0%, 49% { opacity: 1; }
        50%, 100% { opacity: 0; }
      }
      
      /* Spinner loader styles */
      .elriel-loading.spinner .loading-spinner {
        width: 30px;
        height: 30px;
        border: 3px solid rgba(0, 255, 0, 0.3);
        border-radius: 50%;
        border-top-color: currentColor;
        animation: spin 1s infinite linear;
        margin: 0 auto 10px;
      }
      
      .elriel-loading.spinner.small .loading-spinner {
        width: 20px;
        height: 20px;
        border-width: 2px;
      }
      
      .elriel-loading.spinner.large .loading-spinner {
        width: 40px;
        height: 40px;
        border-width: 4px;
      }
      
      .elriel-loading.light.spinner .loading-spinner {
        border: 3px solid rgba(0, 136, 0, 0.3);
        border-top-color: currentColor;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      /* Progress bar styles */
      .elriel-loading.progress .loading-progress-container {
        width: 200px;
        height: 10px;
        background-color: rgba(0, 255, 0, 0.2);
        margin: 10px auto 0;
        overflow: hidden;
      }
      
      .elriel-loading.progress.small .loading-progress-container {
        width: 150px;
        height: 6px;
      }
      
      .elriel-loading.progress.large .loading-progress-container {
        width: 300px;
        height: 14px;
      }
      
      .elriel-loading.progress .loading-progress-bar {
        height: 100%;
        width: 0%;
        background-color: currentColor;
        animation: progress 2s infinite;
      }
      
      @keyframes progress {
        0% { width: 0%; }
        50% { width: 100%; }
        100% { width: 0%; }
      }
      
      /* Dots loader styles */
      .elriel-loading.dots .loading-dots {
        display: flex;
        justify-content: center;
        margin-top: 10px;
      }
      
      .elriel-loading.dots .dot {
        width: 8px;
        height: 8px;
        margin: 0 4px;
        background-color: currentColor;
        border-radius: 50%;
        animation: dots 1.4s infinite ease-in-out;
      }
      
      .elriel-loading.dots.small .dot {
        width: 6px;
        height: 6px;
        margin: 0 3px;
      }
      
      .elriel-loading.dots.large .dot {
        width: 10px;
        height: 10px;
        margin: 0 5px;
      }
      
      .elriel-loading.dots .dot:nth-child(1) {
        animation-delay: 0s;
      }
      
      .elriel-loading.dots .dot:nth-child(2) {
        animation-delay: 0.2s;
      }
      
      .elriel-loading.dots .dot:nth-child(3) {
        animation-delay: 0.4s;
      }
      
      @keyframes dots {
        0%, 100% { transform: scale(0.5); opacity: 0.5; }
        50% { transform: scale(1); opacity: 1; }
      }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * Show the loading indicator
   */
  show() {
    if (!this.element) {
      this.createIndicator();
    }
    
    if (!this.visible) {
      // Add to container or body
      const container = this.options.container 
        ? (typeof this.options.container === 'string' 
            ? document.querySelector(this.options.container) 
            : this.options.container)
        : document.body;
      
      container.appendChild(this.element);
      this.visible = true;
      
      // For progress bar, start the animation
      if (this.options.type === 'progress') {
        this.startProgress();
      }
    }
    
    return this;
  }
  
  /**
   * Hide the loading indicator
   */
  hide() {
    if (this.element && this.visible) {
      this.element.remove();
      this.visible = false;
    }
    
    return this;
  }
  
  /**
   * Update the loading text
   */
  updateText(text) {
    if (this.element) {
      const textElement = this.element.querySelector('.loading-text');
      if (textElement) {
        textElement.textContent = text;
      }
    }
    
    this.options.text = text;
    return this;
  }
  
  /**
   * Start progress animation for progress bar
   */
  startProgress() {
    if (this.options.type !== 'progress' || !this.element) return this;
    
    const progressBar = this.element.querySelector('.loading-progress-bar');
    if (progressBar) {
      progressBar.style.width = '0%';
      progressBar.style.animation = 'none';
      
      // Force reflow
      void progressBar.offsetWidth;
      
      progressBar.style.animation = 'progress 2s infinite';
    }
    
    return this;
  }
  
  /**
   * Set progress for progress bar (0-100)
   */
  setProgress(percent) {
    if (this.options.type !== 'progress' || !this.element) return this;
    
    const progressBar = this.element.querySelector('.loading-progress-bar');
    if (progressBar) {
      // Stop animation
      progressBar.style.animation = 'none';
      
      // Set width
      progressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    }
    
    return this;
  }
}

// Create global loading indicator instance
window.elrielLoading = {
  create: function(options) {
    return new ElrielLoadingIndicator(options);
  },
  
  // Show a global loading indicator
  showGlobal: function(options = {}) {
    if (window.globalLoadingIndicator) {
      window.globalLoadingIndicator.hide();
    }
    
    window.globalLoadingIndicator = new ElrielLoadingIndicator(Object.assign({
      fullscreen: true,
      autoShow: true
    }, options));
    
    return window.globalLoadingIndicator;
  },
  
  // Hide the global loading indicator
  hideGlobal: function() {
    if (window.globalLoadingIndicator) {
      window.globalLoadingIndicator.hide();
      window.globalLoadingIndicator = null;
    }
  }
};

// Add loading indicators to common elements
document.addEventListener('DOMContentLoaded', function() {
  // Replace all loading placeholders with actual loading indicators
  document.querySelectorAll('.loading-messages, .loading-activity').forEach(placeholder => {
    const text = placeholder.textContent || 'LOADING';
    placeholder.textContent = '';
    
    const loader = new ElrielLoadingIndicator({
      container: placeholder,
      text: text,
      type: 'terminal',
      autoShow: true,
      size: 'small'
    });
  });
  
  // Add loading indicators to forms
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function() {
      const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
      
      if (submitButton) {
        const originalText = submitButton.textContent || submitButton.value;
        submitButton.disabled = true;
        
        if (submitButton.tagName === 'INPUT') {
          submitButton.value = 'PROCESSING...';
        } else {
          submitButton.innerHTML = 'PROCESSING...';
        }
        
        // Restore button after submission (in case of error)
        setTimeout(() => {
          submitButton.disabled = false;
          if (submitButton.tagName === 'INPUT') {
            submitButton.value = originalText;
          } else {
            submitButton.innerHTML = originalText;
          }
        }, 10000); // 10 second timeout
      }
    });
  });
});
