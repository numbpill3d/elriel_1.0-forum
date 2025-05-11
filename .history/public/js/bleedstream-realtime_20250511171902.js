// Elriel - Bleedstream Real-time Features
// Handles WebSocket connections and real-time updates for the enhanced Bleedstream

(function() {
  // Store WebSocket connection
  let socket = null;
  let reconnectAttempts = 0;
  let maxReconnectAttempts = 5;
  let reconnectTimeout = null;
  let clientId = generateClientId();
  
  // Track if we should try to maintain connection
  let isConnectionActive = false;
  
  // Cache DOM elements
  const statusIndicator = document.getElementById('realtime-status');
  const postList = document.getElementById('post-list');
  const activityList = document.getElementById('activity-list');
  
  // Initialize after page loads
  window.addEventListener('DOMContentLoaded', () => {
    // Keep ref for functions that might be called by external code
    window.bleedstreamSocket = {
      connect,
      disconnect,
      requestPersonalizedFeed
    };
    
    // Set up rendering functions
    window.renderPost = renderPost;
    window.renderActivity = renderActivity;
    window.saveUserPreferences = saveUserPreferences;
    window.saveUserInterests = saveUserInterests;
    window.uploadBackgroundImage = uploadBackgroundImage;
    window.loadUserPreferencesForm = loadUserPreferencesForm;
    
    // Auto-connect if user is logged in
    const user = window.user;
    if (user) {
      connect();
    }
  });
  
  /**
   * Generate a unique client ID for this session
   */
  function generateClientId() {
    return 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  /**
   * Connect to the WebSocket server
   */
  function connect() {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return; // Already connected or connecting
    }
    
    isConnectionActive = true;
    updateConnectionStatus('connecting');
    
    // Get the current protocol and host for WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const user = window.user || {};
    
    let wsUrl = `${protocol}//${host}/ws?clientId=${clientId}`;
    if (user.id) {
      wsUrl += `&userId=${user.id}`;
    }
    
    try {
      socket = new WebSocket(wsUrl);
      
      // Connection opened
      socket.addEventListener('open', (event) => {
        console.log('Connected to Bleedstream real-time network');
        updateConnectionStatus('online');
        reconnectAttempts = 0;
        
        // Request initial personalized feed
        requestPersonalizedFeed();
      });
      
      // Listen for messages
      socket.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data);
          handleIncomingMessage(message);
        } catch (err) {
          console.error('Error processing WebSocket message:', err);
        }
      });
      
      // Connection closed
      socket.addEventListener('close', (event) => {
        console.log('Disconnected from Bleedstream network:', event.code, event.reason);
        updateConnectionStatus('offline');
        
        // Attempt to reconnect if the connection should be active
        if (isConnectionActive) {
          attemptReconnect();
        }
      });
      
      // Connection error
      socket.addEventListener('error', (event) => {
        console.error('WebSocket error:', event);
        updateConnectionStatus('offline');
      });
      
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      updateConnectionStatus('offline');
      
      if (isConnectionActive) {
        attemptReconnect();
      }
    }
  }
  
  /**
   * Disconnect from the WebSocket server
   */
  function disconnect() {
    isConnectionActive = false;
    
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    
    if (socket) {
      socket.close(1000, 'User disconnected');
      socket = null;
    }
    
    updateConnectionStatus('offline');
  }
  
  /**
   * Attempt to reconnect after connection failure
   */
  function attemptReconnect() {
    if (reconnectAttempts >= maxReconnectAttempts || !isConnectionActive) {
      console.log('Max reconnection attempts reached or connection no longer active');
      return;
    }
    
    reconnectAttempts++;
    
    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
    
    reconnectTimeout = setTimeout(() => {
      if (isConnectionActive) {
        connect();
      }
    }, delay);
  }
  
  /**
   * Update the connection status indicator
   */
  function updateConnectionStatus(status) {
    if (!statusIndicator) return;
    
    statusIndicator.className = 'realtime-status ' + status;
    
    const statusText = statusIndicator.querySelector('.status-text');
    if (statusText) {
      switch (status) {
        case 'online':
          statusText.textContent = 'CONNECTED';
          break;
        case 'connecting':
          statusText.textContent = 'CONNECTING';
          break;
        case 'offline':
          statusText.textContent = 'DISCONNECTED';
          break;
      }
    }
  }
  
  /**
   * Handle incoming WebSocket messages
   */
  function handleIncomingMessage(message) {
    console.log('Received message:', message.type);
    
    switch (message.type) {
      case 'connection':
        // Connection confirmation, nothing to do
        break;
        
      case 'activity':
        // New activity received
        handleNewActivity(message.data);
        break;
        
      case 'personalized_feed':
        // Personalized feed data
        if (message.data && Array.isArray(message.data.posts)) {
          displayPosts(message.data.posts);
        }
        break;
        
      case 'preferences_updated':
        // Preferences were updated
        handlePreferencesUpdated(message.data);
        break;
        
      case 'error':
        console.error('Server error:', message.message);
        // Could display an error notification here
        break;
    }
  }
  
  /**
   * Request personalized feed from the server
   */
  function requestPersonalizedFeed() {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      connect(); // Ensure connection is open
      return;
    }
    
    socket.send(JSON.stringify({
      type: 'request_personalized_feed'
    }));
  }
  
  /**
   * Handle new activity notification
   */
  function handleNewActivity(activity) {
    // Add to the activity list if visible
    if (activityList && document.getElementById('activity-feed').style.display !== 'none') {
      renderActivity(activity, activityList, true);
    }
    
    // If it's a post activity, refresh the feed
    if (activity.type === 'new_post' && postList && document.getElementById('post-list').style.display !== 'none') {
      // Could request updated feed or just prepend the new post
      requestPersonalizedFeed();
    }
  }
  
  /**
   * Handle preferences updated notification
   */
  function handlePreferencesUpdated(preferences) {
    // Update local preferences cache
    window.preferences = preferences;
    
    // Apply theme if changed
    if (preferences.theme) {
      document.body.dataset.theme = preferences.theme;
      document.body.className = 'terminal';
      document.body.classList.add(`theme-${preferences.theme}`);
    }
    
    // Apply other visual preferences
    if (preferences.fontSize) {
      document.body.style.fontSize = preferences.fontSize;
    }
    
    if (preferences.fontColor) {
      document.documentElement.style.setProperty('--primary-text-color', preferences.fontColor);
    }
    
    if (preferences.backgroundImage) {
      document.body.style.backgroundImage = `url(${preferences.backgroundImage})`;
    }
  }
  
  /**
   * Save user preferences via API
   */
  function saveUserPreferences(preferences) {
    fetch('/user/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        theme: preferences.theme,
        fontSize: preferences.fontSize,
        fontColor: preferences.fontColor
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('Preferences saved successfully');
        // Apply preferences immediately
        handlePreferencesUpdated(preferences);
      } else {
        console.error('Failed to save preferences:', data.message);
      }
    })
    .catch(err => {
      console.error('Error saving preferences:', err);
    });
  }
  
  /**
   * Save user interests via API
   */
  function saveUserInterests(interests) {
    fetch('/user/preferences/interests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tags: interests.tags,
        districtId: interests.districtId,
        glyphId: interests.glyphId
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('Interests saved successfully');
        // Request updated personalized feed
        requestPersonalizedFeed();
      } else {
        console.error('Failed to save interests:', data.message);
      }
    })
    .catch(err => {
      console.error('Error saving interests:', err);
    });
  }
  
  /**
   * Upload background image
   */
  function uploadBackgroundImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    fetch('/user/preferences/background', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('Background image uploaded successfully');
        document.body.style.backgroundImage = `url(${data.backgroundImage})`;
      } else {
        console.error('Failed to upload background image:', data.message);
      }
    })
    .catch(err => {
      console.error('Error uploading background image:', err);
    });
  }
  
  /**
   * Load user preferences into customization form
   */
  function loadUserPreferencesForm(preferences) {
    // Get form elements
    const themeSelect = document.getElementById('theme-select');
    const fontSizeSelect = document.getElementById('font-size');
    const fontColorInput = document.getElementById('font-color');
    
    // Set values if elements exist
    if (themeSelect && preferences.theme) {
      themeSelect.value = preferences.theme;
    }
    
    if (fontSizeSelect && preferences.fontSize) {
      fontSizeSelect.value = preferences.fontSize;
    }
    
    if (fontColorInput && preferences.fontColor) {
      fontColorInput.value = preferences.fontColor;
    }
    
    // Load interests
    loadUserInterests();
  }
  
  /**
   * Load user interests into customization form
   */
  function loadUserInterests() {
    fetch('/user/preferences/interests')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Populate tag checkboxes
          const tagCheckboxes = document.getElementById('tag-checkboxes');
          if (tagCheckboxes) {
            tagCheckboxes.innerHTML = '';
            
            data.options.tags.forEach(tag => {
              const isSelected = data.interests.some(interest => interest.tag === tag);
              
              const tagOption = document.createElement('div');
              tagOption.className = 'tag-option';
              tagOption.innerHTML = `
                <input type="checkbox" id="tag-${tag}" value="${tag}" ${isSelected ? 'checked' : ''}>
                <label for="tag-${tag}">${tag.toUpperCase()}</label>
              `;
              
              tagCheckboxes.appendChild(tagOption);
            });
          }
          
          // Populate district select
          const districtSelect = document.getElementById('district-select');
          if (districtSelect) {
            districtSelect.innerHTML = '<option value="">NO PREFERENCE</option>';
            
            data.options.districts.forEach(district => {
              const isSelected = data.interests.some(interest => 
                interest.district_id === district.id);
              
              const option = document.createElement('option');
              option.value = district.id;
              option.textContent = district.name;
              option.selected = isSelected;
              
              districtSelect.appendChild(option);
            });
          }
          
          // Populate glyph select
          const glyphSelect = document.getElementById('glyph-select');
          if (glyphSelect) {
            glyphSelect.innerHTML = '<option value="">NO PREFERENCE</option>';
            
            data.options.glyphs.forEach(glyph => {
              const isSelected = data.interests.some(interest => 
                interest.glyph_id === glyph.id);
              
              const option = document.createElement('option');
              option.value = glyph.id;
              option.textContent = `Glyph #${glyph.id} (${glyph.seed.substring(0, 8)}...)`;
              option.selected = isSelected;
              
              glyphSelect.appendChild(option);
            });
          }
        } else {
          console.error('Failed to load user interests:', data.message);
        }
      })
      .catch(err => {
        console.error('Error loading user interests:', err);
      });
  }
  
  /**
   * Display posts in the UI
   */
  function displayPosts(postsToDisplay) {
    if (!postList) return;
    
    // Clear current posts
    postList.innerHTML = '';
    
    if (postsToDisplay.length === 0) {
      postList.innerHTML = '<div class="no-posts-message">NO POSTS FOUND IN THE BLEEDSTREAM.</div>';
      return;
    }
    
    // Render each post
    postsToDisplay.forEach(post => {
      renderPost(post, postList);
    });
  }
  
  /**
   * Render a single post to the DOM
   */
  function renderPost(post, container, isNew = false) {
    if (!post || !container) return;
    
    const postEl = document.createElement('div');
    postEl.className = 'bleedstream-item';
    if (isNew) postEl.classList.add('new');
    
    // Create background element if there's a glyph
    let backgroundStyle = '';
    if (post.glyph_svg) {
      try {
        backgroundStyle = `style="background-image: url('data:image/svg+xml;base64,${btoa(post.glyph_svg)}');"`;
      } catch (e) {
        console.error('Error encoding SVG:', e);
      }
    }
    
    // Process tags safely
    let tagsHtml = '';
    if (post.tags) {
      try {
        tagsHtml = post.tags.split(',')
          .filter(tag => tag && tag.trim())
          .map(tag => {
            const cleanTag = tag.trim();
            return `<a href="/feed/bleedstream?tag=${encodeURIComponent(cleanTag)}" class="bleedstream-tag">${cleanTag.toUpperCase()}</a>`;
          })
          .join('');
      } catch (e) {
        console.error('Error processing tags:', e);
      }
    }
    
    // Create post content with proper escaping
    const title = post.title || 'Untitled Post';
    const username = post.username || 'Anonymous';
    const content = post.content ? post.content.substring(0, 150) + '...' : 'No content available';
    const createdAt = post.created_at ? new Date(post.created_at).toLocaleString() : 'Unknown date';
    const postId = post.id || '0';
    const isEncrypted = post.is_encrypted ? '<span class="post-encrypted">ENCRYPTED</span>' : '';
    
    postEl.innerHTML = `
      <div class="bleedstream-background" ${backgroundStyle}></div>
      <div class="bleedstream-content">
        <div class="bleedstream-title"><a href="/feed/post/${postId}">${title}</a></div>
        <div class="bleedstream-author">BY: <a href="/profile/user/${username}">${username}</a></div>
        <div class="bleedstream-text">${content}</div>
        <div class="bleedstream-tags">${tagsHtml}</div>
      </div>
      <div class="bleedstream-footer">
        <div class="bleedstream-time">${createdAt}</div>
        <div class="bleedstream-actions">
          <a href="/feed/post/${postId}" class="bleedstream-action">VIEW</a>
          ${isEncrypted}
        </div>
      </div>
    `;
    
    // Add to container (prepend if new, append if existing)
    if (isNew) {
      container.prepend(postEl);
    } else {
      container.appendChild(postEl);
    }
    
    // Optional: Add entrance animation for new posts
    if (isNew) {
      setTimeout(() => {
        postEl.classList.remove('new');
      }, 2000);
    }
  }
  
  /**
   * Render a single activity to the DOM
   */
  function renderActivity(activity, container, isNew = false) {
    if (!activity || !container) return;
    
    const activityEl = document.createElement('div');
    activityEl.className = 'activity-item';
    if (isNew) activityEl.classList.add('new');
    
    // Set icon based on activity type
    let iconClass = 'fas fa-bolt';
    switch (activity.type) {
      case 'new_post':
        iconClass = 'fas fa-file-alt';
        break;
      case 'profile_update':
        iconClass = 'fas fa-user-edit';
        break;
      case 'update_preferences':
        iconClass = 'fas fa-sliders-h';
        break;
      case 'update_interests':
        iconClass = 'fas fa-tags';
        break;
      case 'update_background':
        iconClass = 'fas fa-image';
        break;
    }
    
    // Format the activity message
    let message = 'Unknown activity';
    switch (activity.type) {
      case 'new_post':
        message = `<a href="/profile/user/${activity.username}">${activity.username}</a> transmitted a new post: <a href="/feed/post/${activity.data.postId}">${activity.data.title || 'Untitled'}</a>`;
        break;
      case 'profile_update':
        message = `<a href="/profile/user/${activity.username}">${activity.username}</a> updated their neural profile`;
        break;
      case 'update_preferences':
        message = `<a href="/profile/user/${activity.username}">${activity.username}</a> modified their terminal interface`;
        break;
      case 'update_interests':
        message = `<a href="/profile/user/${activity.username}">${activity.username}</a> recalibrated their network interests`;
        break;
      case 'update_background':
        message = `<a href="/profile/user/${activity.username}">${activity.username}</a> installed a new visual interface`;
        break;
    }
    
    const createdAt = activity.createdAt ? new Date(activity.createdAt).toLocaleString() : 'Unknown time';
    
    activityEl.innerHTML = `
      <div class="activity-icon"><i class="${iconClass}"></i></div>
      <div class="activity-content">
        <div class="activity-message">${message}</div>
        <div class="activity-meta">
          <span class="activity-time">${createdAt}</span>
          <span class="activity-type">${activity.type.replace('_', ' ').toUpperCase()}</span>
        </div>
      </div>
    `;
    
    // Add to container (prepend if new)
    if (isNew) {
      container.prepend(activityEl);
    } else {
      container.appendChild(activityEl);
    }
    
    // Remove 'new' class after animation
    if (isNew) {
      setTimeout(() => {
        activityEl.classList.remove('new');
      }, 2000);
    }
  }
})();