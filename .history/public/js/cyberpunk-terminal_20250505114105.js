/**
 * ELRIEL - CYBERPUNK TERMINAL FUNCTIONALITY
 * JavaScript for the cyberpunk terminal aesthetic
 * Handles interactive elements, animations, and mobile responsiveness
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing Cyberpunk Terminal Interface...');

  // Initialize all system components
  initBootstrapSequence();
  initMobileNavigation();
  initGlitchEffects();
  initTerminalTyping();
  initEasterEggs();
  initDraggableWindows();

  // Dispatch system ready event
  setTimeout(() => {
    console.log('Systems online.');
    document.dispatchEvent(new CustomEvent('systemReady'));
  }, 1000);
});

/**
 * Bootstrap Sequence - Initial loading animation
 */
function initBootstrapSequence() {
  if (sessionStorage.getItem('bootstrapComplete') === 'true') {
    console.log('Bootstrap sequence already completed this session.');
    return;
  }

  const bootstrapLines = [
    'ELRIEL SUBNET v1.0.3 - LOADING',
    '> INITIALIZING SYSTEM KERNEL',
    '> MOUNTING FILESYSTEMS............DONE',
    '> CHECKING MEMORY INTEGRITY......DONE',
    '> LOADING SECURITY MODULES.......DONE',
    '> INITIALIZING NETWORK STACK.....DONE',
    '> SCANNING FOR MALICIOUS CODE....WARNING: 3 ANOMALIES DETECTED',
    '> ACTIVATING GLITCH PROTOCOLS....',
    '> BYPASSING SECURITY PROTOCOLS...',
    '> CONNECTING TO ELRIEL SUBNET....',
    '> ESTABLISHING ENCRYPTED TUNNEL..',
    '> ACCESS GRANTED. WELCOME BACK.',
    '[PRESS ANY KEY TO CONTINUE]'
  ];

  // Create bootstrap overlay
  const bootstrapEl = document.createElement('div');
  bootstrapEl.className = 'bootstrap-sequence';
  bootstrapEl.innerHTML = `
    <div class="bootstrap-content">
      <div id="bootstrap-lines"></div>
    </div>
  `;
  document.body.appendChild(bootstrapEl);

  // Type out each line with delay
  const linesContainer = document.getElementById('bootstrap-lines');
  let lineIndex = 0;

  const typeBootstrapLine = () => {
    if (lineIndex >= bootstrapLines.length) {
      // Bootstrap complete, add continue handler
      bootstrapEl.addEventListener('click', () => {
        bootstrapEl.style.opacity = '0';
        setTimeout(() => {
          bootstrapEl.remove();
          sessionStorage.setItem('bootstrapComplete', 'true');
        }, 1000);
      });

      document.addEventListener('keydown', () => {
        bootstrapEl.style.opacity = '0';
        setTimeout(() => {
          bootstrapEl.remove();
          sessionStorage.setItem('bootstrapComplete', 'true');
        }, 1000);
      }, { once: true });

      return;
    }

    const line = document.createElement('div');
    line.className = 'bootstrap-line';
    line.textContent = bootstrapLines[lineIndex];
    linesContainer.appendChild(line);

    lineIndex++;
    setTimeout(typeBootstrapLine, lineIndex < 3 ? 800 : Math.random() * 500 + 300);
  };

  // Start bootstrap sequence after a short delay
  setTimeout(typeBootstrapLine, 500);
}

/**
 * Mobile Navigation Handler
 */
function initMobileNavigation() {
  // Create mobile navigation toggle button if not exists
  if (!document.querySelector('.mobile-nav-toggle')) {
    const navToggle = document.createElement('button');
    navToggle.className = 'mobile-nav-toggle';
    navToggle.setAttribute('aria-label', 'Toggle navigation menu');
    navToggle.innerHTML = `
      <div class="toggle-bar"></div>
      <div class="toggle-bar"></div>
      <div class="toggle-bar"></div>
    `;
    document.body.appendChild(navToggle);

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'mobile-nav-overlay';
    document.body.appendChild(overlay);

    // Add toggle functionality
    navToggle.addEventListener('click', function() {
      document.body.classList.toggle('mobile-nav-active');
      playGlitchSound();
    });

    // Close menu when clicking overlay
    overlay.addEventListener('click', function() {
      document.body.classList.remove('mobile-nav-active');
    });

    // Close menu when clicking links
    const sidebarLinks = document.querySelectorAll('.sidebar a');
    sidebarLinks.forEach(link => {
      link.addEventListener('click', function() {
        document.body.classList.remove('mobile-nav-active');
      });
    });
  }

  // Handle window resize
  window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
      document.body.classList.remove('mobile-nav-active');
    }
  });
}

/**
 * Terminal Input Simulation
 */
function initTerminalTyping() {
  const terminalInput = document.getElementById('terminal-input');
  if (!terminalInput) return;

  terminalInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const command = this.value.trim().toLowerCase();
      processTerminalCommand(command);
      this.value = '';
    }
  });

  // Focus terminal on page load
  setTimeout(() => {
    terminalInput.focus();
  }, 1500);
}

/**
 * Process terminal commands
 */
function processTerminalCommand(command) {
  const terminalOutput = document.querySelector('.terminal-output');
  if (!terminalOutput) return;

  // Create command line
  const commandLine = document.createElement('div');
  commandLine.className = 'line';
  commandLine.textContent = command;

  // Insert before the prompt
  const promptLine = document.querySelector('.command-line');
  terminalOutput.insertBefore(commandLine, promptLine);

  // Process command
  let response;

  switch (command) {
    case 'help':
      response = `
Available commands:
  help          - Display this help message
  about         - Display information about Elriel
  clear         - Clear the terminal
  ls, dir       - List available areas
  whoami        - Display your identity
  glitch        - Toggle glitch effects
      `;
      break;

    case 'about':
      response = `
Elriel Network v1.0.3
A forgotten underground internet cathedral.
Part TempleOS, part Geocities, part industrial hacker shrine.
ESTABLISHED 2025 // ALL RIGHTS SURRENDERED
      `;
      break;

    case 'clear':
      // Clear all lines except the prompt
      const lines = terminalOutput.querySelectorAll('.line');
      lines.forEach(line => line.remove());
      return;

    case 'ls':
    case 'dir':
      response = `
> terminal/      - Main system
> bleedstream/   - Data feed
> glyph/         - Sigil generator
> whisper/       - Encrypted messages
> forum/         - Scrapyard discussions
      `;
      break;

    case 'whoami':
      response = `Identity unknown. Terminal compromised.`;
      break;

    case 'glitch':
      document.body.classList.toggle('glitch-active');
      response = `Glitch system ${document.body.classList.contains('glitch-active') ? 'activated' : 'deactivated'}.`;
      break;

    default:
      response = `Command not recognized: ${command}`;
      break;
  }

  // Add response with typing effect
  if (response) {
    const words = response.split(' ');
    let wordIndex = 0;

    const typeWord = () => {
      if (wordIndex >= words.length) return;

      const responseLine = document.createElement('div');
      responseLine.className = 'line';
      responseLine.textContent = words.slice(0, wordIndex + 1).join(' ');

      // Replace previous response line if exists
      const prevResponseLine = document.querySelector('.response-line');
      if (prevResponseLine) {
        terminalOutput.replaceChild(responseLine, prevResponseLine);
      } else {
        terminalOutput.insertBefore(responseLine, promptLine);
      }

      responseLine.classList.add('response-line');
      wordIndex++;
      setTimeout(typeWord, 10); // Type fast
    };

    typeWord();
  }

  // Scroll to bottom
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

/**
 * Add glitch effects to elements
 */
function initGlitchEffects() {
  // Add scanner line to panels
  document.querySelectorAll('.panel, .win98-window').forEach(panel => {
    const scannerLine = document.createElement('div');
    scannerLine.className = 'scanner-line';
    panel.appendChild(scannerLine);
  });

  // Add CRT flicker effect
  if (!document.querySelector('.crt-effect')) {
    const crtEffect = document.createElement('div');
    crtEffect.className = 'crt-effect';
    document.body.appendChild(crtEffect);
  }

  // Toggle glitch button
  const glitchToggle = document.getElementById('toggle-glitch');
  if (glitchToggle) {
    glitchToggle.addEventListener('click', function(e) {
      e.preventDefault();
      document.body.classList.toggle('glitch-active');
      playGlitchSound();
    });
  }

  // Random glitch effect
  setInterval(() => {
    if (Math.random() > 0.97) { // Rare random glitch
      const glitchDuration = Math.random() * 200 + 50;
      document.body.classList.add('glitch-active');
      setTimeout(() => {
        document.body.classList.remove('glitch-active');
      }, glitchDuration);
    }
  }, 5000);
}

/**
 * Play glitch sound effect
 */
function playGlitchSound() {
  // Create simple audio glitch effect using Web Audio API
  try {
    // Use standard AudioContext with fallback for older browsers
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (e) {
    console.warn('Audio context not supported:', e);
  }
}

/**
 * Initialize hidden easter eggs
 */
function initEasterEggs() {
  // Konami code (up, up, down, down, left, right, left, right, b, a)
  const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let konamiIndex = 0;

  document.addEventListener('keydown', function(e) {
    if (e.key === konamiCode[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === konamiCode.length) {
        activateEasterEgg();
        konamiIndex = 0;
      }
    } else {
      konamiIndex = 0;
    }
  });

  // Add hidden clickable areas
  const easterEggTriggers = [
    { selector: '.logo h1', clicks: 3 },
    { selector: '.footer-glyphs', sequence: [0, 2, 1] } // Click glyphs in this order
  ];

  easterEggTriggers.forEach(trigger => {
    const elements = document.querySelectorAll(trigger.selector);
    if (elements.length === 0) return;

    if (trigger.clicks) {
      let clickCount = 0;
      elements.forEach(el => {
        el.addEventListener('click', function() {
          clickCount++;
          if (clickCount === trigger.clicks) {
            activateEasterEgg();
            clickCount = 0;
          }
        });
      });
    }

    if (trigger.sequence) {
      const sequenceElements = Array.from(elements);
      let sequenceIndex = 0;

      sequenceElements.forEach((el, index) => {
        el.addEventListener('click', function() {
          if (trigger.sequence[sequenceIndex] === index) {
            sequenceIndex++;
            if (sequenceIndex === trigger.sequence.length) {
              activateEasterEgg();
              sequenceIndex = 0;
            }
          } else {
            sequenceIndex = 0;
          }
        });
      });
    }
  });
}

/**
 * Hidden feature activation
 */
function activateEasterEgg() {
  console.log('Easter egg activated!');

  // Create special overlay
  const overlay = document.createElement('div');
  overlay.className = 'fullscreen-overlay';
  overlay.innerHTML = `
    <div class="overlay-content">
      <h2>HIDDEN SYSTEM ACCESSED</h2>
      <div class="ascii-art">
   ▄████████  ▄█          ▄████████  ▄█     ▄████████  ▄█
  ███    ███ ███         ███    ███ ███    ███    ███ ███
  ███    █▀  ███         ███    ███ ███▌   ███    █▀  ███
 ▄███▄▄▄     ███         ███    ███ ███▌  ▄███▄▄▄     ███
▀▀███▀▀▀     ███       ▀███████████ ███▌ ▀▀███▀▀▀     ███
  ███        ███         ███    ███ ███    ███        ███
  ███        ███▌    ▄   ███    ███ ███    ███        ███▌    ▄
  ███        █████▄▄██   ███    █▀  █▀     ███        █████▄▄██
            ▀                                         ▀
      </div>
      <p>You've discovered a hidden system function. The Elriel Network acknowledges your curiosity.</p>
      <div class="loading-indicator">REWARD DOWNLOADING</div>
      <button class="close-overlay">CONTINUE</button>
    </div>
  `;
  document.body.appendChild(overlay);

  // Add close handler
  overlay.querySelector('.close-overlay').addEventListener('click', function() {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 500);
  });

  // Auto close after 10 seconds
  setTimeout(() => {
    if (document.body.contains(overlay)) {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 500);
    }
  }, 10000);

  // Play special glitch sound
  try {
    // Use standard AudioContext with fallback for older browsers
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass();

    // Create multiple oscillators for a more complex sound
    for (let i = 0; i < 3; i++) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = ['sine', 'square', 'sawtooth'][i];
      oscillator.frequency.setValueAtTime(220 * (i + 1), audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(110 * (i + 1), audioContext.currentTime + 0.5);

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  } catch (e) {
    console.warn('Audio context not supported:', e);
  }
}

/**
 * Make Windows 98-style windows draggable
 */
function initDraggableWindows() {
  document.querySelectorAll('.win98-window').forEach(window => {
    const titlebar = window.querySelector('.win98-titlebar');
    if (!titlebar) return;

    let isDragging = false;
    let offsetX, offsetY;

    titlebar.addEventListener('mousedown', function(e) {
      isDragging = true;
      offsetX = e.clientX - window.getBoundingClientRect().left;
      offsetY = e.clientY - window.getBoundingClientRect().top;

      window.style.position = 'absolute';
      window.style.zIndex = 1000;

      // Add dragging class
      window.classList.add('dragging');
    });

    document.addEventListener('mousemove', function(e) {
      if (!isDragging) return;

      window.style.left = (e.clientX - offsetX) + 'px';
      window.style.top = (e.clientY - offsetY) + 'px';
    });

    document.addEventListener('mouseup', function() {
      isDragging = false;
      window.classList.remove('dragging');
    });

    // Add window controls functionality
    const closeButton = window.querySelector('.win98-window-control:last-child');
    if (closeButton) {
      closeButton.addEventListener('click', function() {
        window.style.display = 'none';
      });
    }
  });
}

/**
 * Enhance touch interactions on mobile
 */
function enhanceTouchInteractions() {
  // Add active state to buttons for touch feedback
  const interactiveElements = document.querySelectorAll('a, button, .clickable');
  interactiveElements.forEach(el => {
    el.addEventListener('touchstart', function() {
      this.classList.add('touch-active');
    }, { passive: true });

    el.addEventListener('touchend', function() {
      this.classList.remove('touch-active');
    }, { passive: true });
  });

  // Fix 100vh issue on mobile browsers
  function setVH() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  setVH();
  window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', setVH);
}

/**
 * Generate a random glyph for visual interest
 */
function generateRandomGlyph(container) {
  if (!container) return;

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");

  // Create a circular base
  const circle = document.createElementNS(svgNS, "circle");
  circle.setAttribute("cx", "50");
  circle.setAttribute("cy", "50");
  circle.setAttribute("r", "40");
  circle.setAttribute("fill", "none");
  circle.setAttribute("stroke", "#00ff00");
  circle.setAttribute("stroke-width", "1");
  svg.appendChild(circle);

  // Add random lines
  const numLines = Math.floor(Math.random() * 6) + 3;
  for (let i = 0; i < numLines; i++) {
    const line = document.createElementNS(svgNS, "line");
    const angle = (i / numLines) * Math.PI * 2;
    const oppositeAngle = angle + Math.PI;

    const x1 = 50 + Math.cos(angle) * 30;
    const y1 = 50 + Math.sin(angle) * 30;
    const x2 = 50 + Math.cos(oppositeAngle) * 30;
    const y2 = 50 + Math.sin(oppositeAngle) * 30;

    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", "#00ff00");
    line.setAttribute("stroke-width", "1");
    svg.appendChild(line);
  }

  // Add some symbols
  const symbols = ['△', '○', '□', '⨯', '✧', '⬡'];
  const text = document.createElementNS(svgNS, "text");
  text.setAttribute("x", "50");
  text.setAttribute("y", "55");
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("dominant-baseline", "middle");
  text.setAttribute("font-family", "sans-serif");
  text.setAttribute("font-size", "12");
  text.setAttribute("fill", "#00ff00");
  text.textContent = symbols[Math.floor(Math.random() * symbols.length)];
  svg.appendChild(text);

  container.innerHTML = '';
  container.appendChild(svg);
}

// Export functions to global scope
window.elrielTerminal = {
  toggleGlitch: function() {
    document.body.classList.toggle('glitch-active');
    playGlitchSound();
  },
  generateGlyph: generateRandomGlyph,
  playGlitchSound: playGlitchSound
};