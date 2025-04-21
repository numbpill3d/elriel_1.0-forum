/**
 * Elriel - Glitch Effects
 * Handles visual glitch effects throughout the application
 */

document.addEventListener('DOMContentLoaded', () => {
  // Toggle glitch effects when the toggle button is clicked
  const toggleGlitchBtn = document.getElementById('toggle-glitch');
  if (toggleGlitchBtn) {
    toggleGlitchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.body.classList.toggle('glitch-active');
      
      // Store preference in localStorage
      const isActive = document.body.classList.contains('glitch-active');
      localStorage.setItem('glitch-active', isActive ? 'true' : 'false');
    });
  }
  
  // Check if glitch effects were previously enabled
  const glitchActive = localStorage.getItem('glitch-active');
  if (glitchActive === 'true') {
    document.body.classList.add('glitch-active');
  }
  
  // Randomly apply glitch effects to elements
  function applyRandomGlitches() {
    // Only apply if glitch effects are active
    if (!document.body.classList.contains('glitch-active')) return;
    
    // Get all headings
    const headings = document.querySelectorAll('h1, h2, h3');
    
    // Randomly glitch some headings
    headings.forEach(heading => {
      if (Math.random() < 0.05 && !heading.classList.contains('glitch')) {
        // 5% chance to apply a temporary glitch effect
        const originalText = heading.textContent;
        heading.setAttribute('data-text', originalText);
        heading.classList.add('glitch-temp');
        
        // Remove the effect after a short time
        setTimeout(() => {
          heading.classList.remove('glitch-temp');
        }, 2000);
      }
    });
    
    // Randomly add glitch blocks
    if (Math.random() < 0.02) {
      // Create a glitch block element
      const glitchBlock = document.createElement('div');
      glitchBlock.className = 'glitch-block';
      glitchBlock.style.position = 'fixed';
      glitchBlock.style.zIndex = '1000';
      glitchBlock.style.width = `${Math.floor(Math.random() * 300) + 50}px`;
      glitchBlock.style.height = `${Math.floor(Math.random() * 20) + 5}px`;
      glitchBlock.style.top = `${Math.floor(Math.random() * window.innerHeight)}px`;
      glitchBlock.style.left = `${Math.floor(Math.random() * window.innerWidth)}px`;
      glitchBlock.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
      glitchBlock.style.pointerEvents = 'none';
      
      // Add to body
      document.body.appendChild(glitchBlock);
      
      // Remove after animation
      setTimeout(() => {
        glitchBlock.remove();
      }, 2000);
    }
  }
  
  // Apply random glitches periodically
  setInterval(applyRandomGlitches, 5000);
  
  // Apply glitch effect to images
  function setupGlitchImages() {
    const images = document.querySelectorAll('.glitch-image');
    
    images.forEach(container => {
      const img = container.querySelector('img');
      if (img) {
        // Set the data-image attribute to the image source
        container.setAttribute('data-image', img.src);
      }
    });
  }
  
  // Call once on page load
  setupGlitchImages();
  
  // Reapply when content changes (for dynamic content)
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        setupGlitchImages();
      }
    });
  });
  
  // Observe the entire document for changes
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Text corruption effect
  function setupCorruptText() {
    const corruptElements = document.querySelectorAll('.corrupt-text');
    
    corruptElements.forEach(element => {
      const text = element.textContent;
      element.setAttribute('data-text', text);
    });
  }
  
  // Call once on page load
  setupCorruptText();
  
  // Inject random glitch characters into text occasionally
  function injectGlitchCharacters() {
    // Only apply if glitch effects are active
    if (!document.body.classList.contains('glitch-active')) return;
    
    // Get all paragraph text
    const paragraphs = document.querySelectorAll('p, .line, .activity-text');
    
    // Glitch characters
    const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/\\`~░▒▓█▄▀■□▪▫▬▲►▼◄◊○●◘◙☺☻♥♦♣♠♂♀♪♫☼►◄▲▼§¶';
    
    // Randomly select a paragraph to glitch
    if (paragraphs.length > 0 && Math.random() < 0.1) {
      const paragraph = paragraphs[Math.floor(Math.random() * paragraphs.length)];
      const text = paragraph.textContent;
      
      if (text.length > 10) {
        // Select a random position to inject glitch
        const position = Math.floor(Math.random() * (text.length - 5)) + 5;
        const glitchLength = Math.floor(Math.random() * 3) + 1;
        
        // Generate glitch characters
        let glitchText = '';
        for (let i = 0; i < glitchLength; i++) {
          glitchText += glitchChars.charAt(Math.floor(Math.random() * glitchChars.length));
        }
        
        // Create new text with glitch
        const newText = text.substring(0, position) + glitchText + text.substring(position + glitchLength);
        
        // Store original text
        if (!paragraph.hasAttribute('data-original')) {
          paragraph.setAttribute('data-original', text);
        }
        
        // Apply glitched text
        paragraph.textContent = newText;
        
        // Restore original text after a short delay
        setTimeout(() => {
          paragraph.textContent = paragraph.getAttribute('data-original');
        }, 1000);
      }
    }
  }
  
  // Apply random text glitches periodically
  setInterval(injectGlitchCharacters, 8000);
  
  // Add scan line effect
  function addScanLine() {
    // Only apply if glitch effects are active
    if (!document.body.classList.contains('glitch-active')) return;
    
    const scanLine = document.createElement('div');
    scanLine.className = 'scan-line-effect';
    scanLine.style.position = 'fixed';
    scanLine.style.top = '0';
    scanLine.style.left = '0';
    scanLine.style.width = '100%';
    scanLine.style.height = '2px';
    scanLine.style.backgroundColor = 'rgba(0, 255, 0, 0.3)';
    scanLine.style.zIndex = '9999';
    scanLine.style.pointerEvents = 'none';
    
    document.body.appendChild(scanLine);
    
    // Animate the scan line
    let position = 0;
    const interval = setInterval(() => {
      position += 2;
      scanLine.style.top = `${position}px`;
      
      if (position > window.innerHeight) {
        clearInterval(interval);
        scanLine.remove();
      }
    }, 10);
  }
  
  // Add scan line effect periodically
  setInterval(addScanLine, 15000);
});

// CSS class for temporary glitch effect
document.head.insertAdjacentHTML('beforeend', `
  <style>
    .glitch-temp {
      position: relative;
      animation: glitch-skew 1s infinite linear alternate-reverse;
    }
    
    .glitch-temp::before,
    .glitch-temp::after {
      content: attr(data-text);
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0.8;
    }
    
    .glitch-temp::before {
      color: var(--terminal-red);
      animation: glitch-anim 2s infinite linear alternate-reverse;
      clip-path: polygon(0 0, 100% 0, 100% 45%, 0 45%);
      transform: translate(-2px, -2px);
    }
    
    .glitch-temp::after {
      color: var(--terminal-blue);
      animation: glitch-anim-2 1s infinite linear alternate-reverse;
      clip-path: polygon(0 60%, 100% 60%, 100% 100%, 0 100%);
      transform: translate(2px, 2px);
    }
  </style>
`);