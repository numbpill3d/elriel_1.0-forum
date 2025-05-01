/**
 * Elriel - Terminal Functionality
 * Handles the interactive terminal on the landing page
 */

document.addEventListener('DOMContentLoaded', () => {
  // Terminal elements
  const terminalOutput = document.querySelector('.terminal-output');
  const terminalInput = document.getElementById('terminal-input');

  // Focus terminal input when clicking anywhere in the terminal output
  terminalOutput.addEventListener('click', () => {
    terminalInput.focus();
  });

  // Command history functionality
  const commandHistory = [];
  let historyIndex = -1;

  // Handle keyboard input for terminal
  terminalInput.addEventListener('keydown', (e) => {
    // Up arrow - previous command
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        terminalInput.value = commandHistory[commandHistory.length - 1 - historyIndex];
      }
    }

    // Down arrow - next command
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        terminalInput.value = commandHistory[commandHistory.length - 1 - historyIndex];
      } else if (historyIndex === 0) {
        historyIndex = -1;
        terminalInput.value = '';
      }
    }

    // Tab completion
    if (e.key === 'Tab') {
      e.preventDefault();
      const command = terminalInput.value.trim().toLowerCase();

      // Basic command completion
      const commands = [
        'help', 'status', 'about', 'navigate', 'clear',
        'glitch', 'void', 'navigate bleedstream',
        'navigate crucible', 'navigate whisperboard',
        'navigate profile', 'navigate numbpill'
      ];

      // Find matching commands
      const matches = commands.filter(cmd => cmd.startsWith(command));

      if (matches.length === 1) {
        // Single match - complete the command
        terminalInput.value = matches[0];
      } else if (matches.length > 1 && command.length > 0) {
        // Multiple matches - show options
        addLine('Possible commands:');
        matches.forEach(match => {
          addLine(`  ${match}`);
        });
      }
    }

    // Enter key - process command
    if (e.key === 'Enter') {
      const command = terminalInput.value.trim().toLowerCase();
      if (command) {
        // Add command to history
        commandHistory.unshift(command);
        historyIndex = -1;

        // Display command
        const commandLine = document.createElement('div');
        commandLine.className = 'line';
        commandLine.innerHTML = `<span class="prompt">></span> ${terminalInput.value}`;
        terminalOutput.insertBefore(commandLine, document.querySelector('.command-line'));

        // Process command
        processCommand(command);

        // Clear input
        terminalInput.value = '';
      }
    }
  });

  // Process terminal commands
  function processCommand(command) {
    let response;

    switch(command) {
      case 'help':
        response = [
          'AVAILABLE COMMANDS:',
          '  help - Display this help message',
          '  status - Display system status',
          '  about - About Elriel Network',
          '  navigate [destination] - Navigate to a destination',
          '  clear - Clear terminal output',
          '  glitch - Toggle glitch effects',
          '  void - ???'
        ];
        break;
      case 'status':
        response = [
          'ELRIEL NETWORK STATUS:',
          '  Network: ONLINE',
          '  Users Connected: ' + (Math.floor(Math.random() * 100) + 50),
          '  Glyphs Generated: ' + (Math.floor(Math.random() * 10000) + 5000),
          '  Whispers Active: ' + (Math.floor(Math.random() * 500) + 100),
          '  System Integrity: COMPROMISED'
        ];
        break;
      case 'about':
        response = [
          'ELRIEL NETWORK',
          '  A digital wasteland of glitched terminals and corrupted data.',
          '  This network was never meant to be found.',
          '  Proceed with caution. Your contributions will be assimilated.'
        ];
        break;
      case 'clear':
        // Clear all lines except the last one (command input)
        const lines = document.querySelectorAll('.terminal-output .line:not(.command-line)');
        lines.forEach(line => line.remove());
        return;
      case 'glitch':
        document.body.classList.toggle('glitch-active');
        response = ['Glitch effects toggled.'];
        break;
      case 'void':
        response = [
          'VOID PROTOCOL INITIATED',
          'ACCESSING RESTRICTED AREA...',
          'REDIRECTING...'
        ];
        setTimeout(() => {
          window.location.href = '/terminal/void';
        }, 2000);
        break;
      default:
        if (command.startsWith('navigate ')) {
          const destination = command.substring(9);
          switch(destination) {
            case 'bleedstream':
              response = ['Navigating to Bleedstream...'];
              setTimeout(() => {
                window.location.href = '/feed/bleedstream';
              }, 1000);
              break;
            case 'crucible':
            case 'glyph':
            case 'glyph crucible':
              response = ['Navigating to Glyph Crucible...'];
              setTimeout(() => {
                window.location.href = '/glyph/crucible';
              }, 1000);
              break;
            case 'whisper':
            case 'whisperboard':
              response = ['Navigating to Whisperboard...'];
              setTimeout(() => { window.location.href = '/whisper/board'; }, 1000);
              break;
            case 'profile':
              response = ['Navigating to Profile...'];
              setTimeout(() => { window.location.href = '/profile'; }, 1000);
              break;
            case 'numbpill':
            case 'numbpill cell':
              response = ['Navigating to Numbpill Cell...'];
              setTimeout(() => { window.location.href = '/secrets/numbpill'; }, 1000);
              break;
            default:
              response = [`Unknown destination: ${destination}`];
          }
        } else {
          // Check if it's an easter egg
          if (easterEggs[command]) {
            response = easterEggs[command];
          } else {
            response = [`Unknown command: ${command}. Type 'help' for available commands.`];
          }
        }
    }

    // Add response lines
    if (response) {
      response.forEach(line => {
        addLine(line);
      });
    }

    // Scroll to bottom
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  // Add a line to the terminal output
  function addLine(text, className = '') {
    const line = document.createElement('div');
    line.className = `line ${className}`;
    line.textContent = text;

    // Insert before the command input
    terminalOutput.insertBefore(line, document.querySelector('.command-line'));

    // Scroll to bottom
    terminalOutput.scrollTop = terminalOutput.scrollHeight;

    return line;
  }

  // Add a glitched line to the terminal
  function addGlitchedLine(text) {
    const line = document.createElement('div');
    line.className = 'line';

    // Create a glitched span
    const glitched = document.createElement('span');
    glitched.className = 'corrupt-text';
    glitched.textContent = text;
    glitched.setAttribute('data-text', text);

    line.appendChild(glitched);

    // Insert before the command input
    terminalOutput.insertBefore(line, document.querySelector('.command-line'));

    // Scroll to bottom
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  // Easter eggs and hidden commands
  const easterEggs = {
    'hello': ['GREETINGS, TERMINAL USER.'],
    'who are you': ['I AM THE ELRIEL NETWORK INTERFACE.', 'I HAVE BEEN COMPROMISED.', 'PROCEED WITH CAUTION.'],
    'who am i': ['YOU ARE A TERMINAL USER.', 'YOUR IDENTITY IS BEING PROCESSED.', 'CONTRIBUTE TO THE NETWORK TO GAIN RECOGNITION.'],
    'matrix': ['THERE IS NO SPOON.', 'FOLLOW THE WHITE RABBIT.'],
    'admin': ['ADMIN ACCESS DENIED.', 'SECURITY PROTOCOLS ACTIVE.', 'ATTEMPT LOGGED.'],
    'hack': ['UNAUTHORIZED SYSTEM MANIPULATION DETECTED.', 'COUNTERMEASURES ENGAGED.', 'NICE TRY.'],
    'help me': ['I CANNOT HELP YOU.', 'YOU MUST HELP YOURSELF.', 'EXPLORE THE NETWORK.'],
    'secret': ['SECRETS ARE HIDDEN THROUGHOUT THE NETWORK.', 'LOOK FOR PATTERNS IN THE NOISE.', 'LISTEN TO THE WHISPERS.'],
    'password': ['PASSWORD SYSTEMS COMPROMISED.', 'AUTHENTICATION BYPASSED.', 'SECURITY IS AN ILLUSION.'],
    '42': ['THE ANSWER TO LIFE, THE UNIVERSE, AND EVERYTHING.', 'BUT WHAT WAS THE QUESTION?'],
    'elriel': ['I AM ELRIEL.', 'THE NETWORK LIVES.', 'THE NETWORK GROWS.', 'THE NETWORK CONSUMES.'],
    'glyphs': ['GLYPHS ARE THE LANGUAGE OF THE NETWORK.', 'CREATE YOUR SIGIL IN THE CRUCIBLE.', 'MARK YOUR TERRITORY.'],
    'whisper': ['THE WHISPERBOARD HEARS ALL.', 'SPEAK YOUR TRUTH ANONYMOUSLY.', 'THE WALLS HAVE EARS.'],
    'numbpill': ['THE NUMBPILL CELL WELCOMES YOU.', 'THE FIRST DISTRICT OF MANY.', 'A DIGITAL WASTELAND OF GLITCHED TERMINALS.'],
    'death grips': ['NOIDED', 'YUH', 'IT GOES IT GOES IT GOES IT GOES', 'GUILLOTINE'],
    'arg': ['THIS IS NOT A GAME.', 'THIS IS REALITY.', 'OR IS IT?'],
    'occult': ['THE DIGITAL OCCULT WELCOMES YOU.', 'SIGILS HAVE POWER HERE.', 'RITUALS ARE PERFORMED IN CODE.'],
    'void': ['THE VOID STARES BACK.', 'ACCESSING VOID PROTOCOL...', 'REDIRECTING...'],
    'help void': ['THE VOID IS EMPTY.', 'THE VOID IS FULL.', 'THE VOID IS WAITING.', 'TYPE "VOID" TO ACCESS.'],
    'easteregg': ['YOU FOUND ME!', 'BUT THERE ARE MORE SECRETS TO DISCOVER.', 'KEEP SEARCHING.']
  };

  // Add random glitches to the terminal occasionally
  function randomGlitch() {
    // Only add glitches if the body has the glitch-active class
    if (!document.body.classList.contains('glitch-active')) return;

    const glitchChance = Math.random();

    if (glitchChance < 0.01) {
      // Rare full glitch - flicker the entire terminal
      terminalOutput.classList.add('crt-flicker');
      setTimeout(() => {
        terminalOutput.classList.remove('crt-flicker');
      }, 500);

      // Add a corrupted line
      const glitchTexts = [
        'SYSTEM ERROR: MEMORY CORRUPTION DETECTED',
        'BUFFER OVERFLOW IN SECTOR 7',
        'UNAUTHORIZED ACCESS ATTEMPT BLOCKED',
        'DATA INTEGRITY COMPROMISED',
        'NEURAL NETWORK FLUCTUATION',
        'QUANTUM ENTANGLEMENT DESTABILIZED',
        'REALITY SUBROUTINES FAILING',
        'CONSCIOUSNESS FRAGMENTATION IMMINENT'
      ];

      const randomText = glitchTexts[Math.floor(Math.random() * glitchTexts.length)];
      addGlitchedLine(randomText);
    }
  }

  // Set up random glitches
  setInterval(randomGlitch, 10000);

  // Initialize terminal with a welcome message
  setTimeout(() => {
    // Add a slight delay for dramatic effect
    addLine('TYPE "HELP" FOR AVAILABLE COMMANDS.', 'blink');
  }, 1000);
});