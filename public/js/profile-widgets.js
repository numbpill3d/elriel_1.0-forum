/**
 * Elriel - Profile Widgets System
 * Provides functionality for creating and managing profile widgets/containers
 */

document.addEventListener('DOMContentLoaded', function() {
  const widgetTypeSelect = document.getElementById('widget-type');
  const addWidgetBtn = document.getElementById('add-widget-btn');
  const widgetsContainer = document.getElementById('widgets-container');
  
  if (!widgetTypeSelect || !addWidgetBtn || !widgetsContainer) {
    // Not on the widgets page
    return;
  }
  
  // Keep track of widget IDs for form submissions
  let widgetCounter = 0;
  let widgets = [];
  
  // Load existing widgets if available
  try {
    if (window.profile && window.profile.widgets_data) {
      try {
        widgets = JSON.parse(window.profile.widgets_data);
        renderWidgets();
      } catch (e) {
        console.error('Error parsing widgets data:', e);
      }
    }
  } catch (e) {
    console.error('Error loading widgets:', e);
  }
  
  // Add widget button handler
  addWidgetBtn.addEventListener('click', function() {
    const widgetType = widgetTypeSelect.value;
    if (!widgetType) {
      alert('Please select a widget type');
      return;
    }
    
    const widgetId = 'widget_' + Date.now() + '_' + widgetCounter++;
    const widget = {
      id: widgetId,
      type: widgetType,
      title: getDefaultTitleForType(widgetType),
      content: '',
      settings: {}
    };
    
    widgets.push(widget);
    renderWidgets();
  });
  
  // Handle widget events using delegation
  widgetsContainer.addEventListener('click', function(e) {
    // Handle delete button
    if (e.target.classList.contains('widget-delete') || e.target.parentElement.classList.contains('widget-delete')) {
      const widgetEl = getWidgetElementFromEvent(e);
      if (widgetEl) {
        const widgetId = widgetEl.dataset.widgetId;
        deleteWidget(widgetId);
      }
    }
    
    // Handle move up button
    if (e.target.classList.contains('widget-move-up') || e.target.parentElement.classList.contains('widget-move-up')) {
      const widgetEl = getWidgetElementFromEvent(e);
      if (widgetEl) {
        const widgetId = widgetEl.dataset.widgetId;
        moveWidgetUp(widgetId);
      }
    }
    
    // Handle move down button
    if (e.target.classList.contains('widget-move-down') || e.target.parentElement.classList.contains('widget-move-down')) {
      const widgetEl = getWidgetElementFromEvent(e);
      if (widgetEl) {
        const widgetId = widgetEl.dataset.widgetId;
        moveWidgetDown(widgetId);
      }
    }
  });
  
  // Handle input changes using delegation
  widgetsContainer.addEventListener('input', function(e) {
    const widgetEl = getWidgetElementFromEvent(e);
    if (!widgetEl) return;
    
    const widgetId = widgetEl.dataset.widgetId;
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;
    
    if (e.target.name === `${widgetId}_title`) {
      widget.title = e.target.value;
    } else if (e.target.name === `${widgetId}_content`) {
      widget.content = e.target.value;
    } else if (e.target.name.startsWith(`${widgetId}_setting_`)) {
      const settingName = e.target.name.replace(`${widgetId}_setting_`, '');
      widget.settings[settingName] = e.target.value;
    }
    
    // Update the widgets in local storage
    updateWidgetsData();
  });
  
  // Add form submit interceptor to include widgets
  const formElement = document.getElementById('profile-edit-form');
  if (formElement) {
    formElement.addEventListener('submit', function(e) {
      // Add widgets data as hidden input
      const widgetsInput = document.createElement('input');
      widgetsInput.type = 'hidden';
      widgetsInput.name = 'widgets';
      widgetsInput.value = JSON.stringify(widgets);
      formElement.appendChild(widgetsInput);
    });
  }
  
  // Helper functions
  function getDefaultTitleForType(type) {
    switch(type) {
      case 'text': return 'Text Block';
      case 'image': return 'Image Gallery';
      case 'video': return 'Video Embed';
      case 'iframe': return 'Embedded Content';
      default: return 'Custom Widget';
    }
  }
  
  function getWidgetElementFromEvent(e) {
    let currentElement = e.target;
    while (currentElement && !currentElement.classList.contains('widget-item')) {
      currentElement = currentElement.parentElement;
    }
    return currentElement;
  }
  
  function deleteWidget(widgetId) {
    if (confirm('Are you sure you want to delete this widget?')) {
      widgets = widgets.filter(w => w.id !== widgetId);
      renderWidgets();
    }
  }
  
  function moveWidgetUp(widgetId) {
    const index = widgets.findIndex(w => w.id === widgetId);
    if (index > 0) {
      const temp = widgets[index];
      widgets[index] = widgets[index - 1];
      widgets[index - 1] = temp;
      renderWidgets();
    }
  }
  
  function moveWidgetDown(widgetId) {
    const index = widgets.findIndex(w => w.id === widgetId);
    if (index < widgets.length - 1) {
      const temp = widgets[index];
      widgets[index] = widgets[index + 1];
      widgets[index + 1] = temp;
      renderWidgets();
    }
  }
  
  function updateWidgetsData() {
    // Store widgets data in a global variable for form submission
    window.profileWidgets = widgets;
  }
  
  function renderWidgets() {
    widgetsContainer.innerHTML = '';
    
    if (widgets.length === 0) {
      widgetsContainer.innerHTML = '<div class="empty-widget-message">No widgets added yet. Use the controls above to add widgets to your profile.</div>';
      return;
    }
    
    widgets.forEach(widget => {
      const widgetEl = document.createElement('div');
      widgetEl.className = 'widget-item';
      widgetEl.dataset.widgetId = widget.id;
      
      widgetEl.innerHTML = `
        <div class="widget-header">
          <div class="widget-title">${widget.title || 'Untitled Widget'}</div>
          <div class="widget-controls">
            <button type="button" class="widget-control widget-move-up" title="Move Up">▲</button>
            <button type="button" class="widget-control widget-move-down" title="Move Down">▼</button>
            <button type="button" class="widget-control widget-delete" title="Delete">×</button>
          </div>
        </div>
        <div class="widget-content">
          <div class="widget-input-group">
            <label for="${widget.id}_title">Widget Title:</label>
            <input type="text" id="${widget.id}_title" name="${widget.id}_title" value="${widget.title || ''}" placeholder="Enter a title for this widget">
          </div>
          
          ${getWidgetContentHtml(widget)}
        </div>
      `;
      
      widgetsContainer.appendChild(widgetEl);
    });
    
    updateWidgetsData();
  }
  
  function getWidgetContentHtml(widget) {
    switch(widget.type) {
      case 'text':
        return `
          <div class="widget-input-group">
            <label for="${widget.id}_content">Text Content:</label>
            <textarea id="${widget.id}_content" name="${widget.id}_content" placeholder="Enter text content here (supports HTML)">${widget.content || ''}</textarea>
          </div>
        `;
      
      case 'image':
        return `
          <div class="widget-input-group">
            <label for="${widget.id}_content">Image URLs (one per line):</label>
            <textarea id="${widget.id}_content" name="${widget.id}_content" placeholder="Enter image URLs, one per line">${widget.content || ''}</textarea>
          </div>
          <div class="widget-input-group">
            <label for="${widget.id}_setting_display">Display Style:</label>
            <select id="${widget.id}_setting_display" name="${widget.id}_setting_display">
              <option value="grid" ${widget.settings?.display === 'grid' ? 'selected' : ''}>Grid</option>
              <option value="slideshow" ${widget.settings?.display === 'slideshow' ? 'selected' : ''}>Slideshow</option>
            </select>
          </div>
        `;
      
      case 'video':
        return `
          <div class="widget-input-group">
            <label for="${widget.id}_content">Video URL (YouTube, Vimeo, etc.):</label>
            <input type="text" id="${widget.id}_content" name="${widget.id}_content" value="${widget.content || ''}" placeholder="Enter video URL">
          </div>
          <div class="widget-input-group">
            <label for="${widget.id}_setting_autoplay">Autoplay:</label>
            <select id="${widget.id}_setting_autoplay" name="${widget.id}_setting_autoplay">
              <option value="0" ${widget.settings?.autoplay === '0' ? 'selected' : ''}>No</option>
              <option value="1" ${widget.settings?.autoplay === '1' ? 'selected' : ''}>Yes</option>
            </select>
          </div>
        `;
      
      case 'iframe':
        return `
          <div class="widget-input-group">
            <label for="${widget.id}_content">Iframe URL or Embed Code:</label>
            <textarea id="${widget.id}_content" name="${widget.id}_content" placeholder="Enter iframe URL or full embed code">${widget.content || ''}</textarea>
          </div>
          <div class="widget-input-group">
            <label for="${widget.id}_setting_height">Height (px):</label>
            <input type="number" id="${widget.id}_setting_height" name="${widget.id}_setting_height" value="${widget.settings?.height || '300'}" placeholder="Height in pixels">
          </div>
        `;
      
      default:
        return `
          <div class="widget-input-group">
            <label for="${widget.id}_content">Content:</label>
            <textarea id="${widget.id}_content" name="${widget.id}_content" placeholder="Enter content here">${widget.content || ''}</textarea>
          </div>
        `;
    }
  }
  // Enhancements for profile layout and widgets

  // Parse groupedContainers on load
  let groupedContainers = [];
  if (window.profile && window.profile.groupedContainers) {
    try {
      groupedContainers = JSON.parse(window.profile.groupedContainers);
    } catch (e) {
      console.error('Error parsing groupedContainers:', e);
    }
  }

  // Toggle editors based on layout_type
  function toggleEditors() {
    const layoutSelect = document.querySelector('select[name="layout_type"]');
    if (!layoutSelect) return;
    const layoutType = layoutSelect.value;
    const oneColumnEditors = document.querySelectorAll('.one-column-editor');
    const twoColumnEditors = document.querySelectorAll('.two-column-editor');
    const mainContentInput = document.querySelector('input[name="main_content"], textarea[name="main_content"]');
    oneColumnEditors.forEach(el => el.style.display = layoutType === 'one' ? 'block' : 'none');
    twoColumnEditors.forEach(el => el.style.display = layoutType === 'two' ? 'block' : 'none');
    if (mainContentInput && layoutType === 'one') {
      // Serialize widgets to main_content JSON for one-column
      mainContentInput.value = JSON.stringify({ widgets: widgets });
    }
  }

  // Event listener for layout change
  const layoutSelect = document.querySelector('select[name="layout_type"]');
  if (layoutSelect) {
    layoutSelect.addEventListener('change', toggleEditors);
    toggleEditors(); // Initial call
  }

  // AddWidget function
  function AddWidget(type, zone) {
    const container = document.getElementById(`${zone}-widgets-container`) || document.querySelector(`.${zone} .widgets-container`);
    if (!container) return;
    const widgetId = `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const widget = {
      id: widgetId,
      type: type,
      title: getDefaultTitleForType(type),
      content: '',
      zone: zone
    };
    widgets.push(widget);
    renderWidgets(); // Re-render to include new widget in zone
    attachWidgetListeners(widgetId, zone);
  }

  // Enhanced attach listeners
  function attachWidgetListeners(widgetId, zone) {
    const widgetEl = document.querySelector(`[data-widget-id="${widgetId}"]`);
    if (!widgetEl) return;
    const deleteBtn = widgetEl.querySelector('.widget-delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => deleteWidget(widgetId));
    }
    // Add zone-specific listeners
    widgetEl.dataset.zone = zone;
  }

  // Serialize sidebar_config
  function serializeSidebar() {
    return widgets.filter(w => w.zone === 'sidebar').map(w => ({
      id: w.id,
      type: w.type,
      title: w.title,
      content: w.content,
      settings: w.settings
    }));
  }

  // Serialize main_content
  function serializeMain() {
    return {
      left: widgets.filter(w => w.zone === 'main-left').map(w => ({ id: w.id, type: w.type, title: w.title, content: w.content, settings: w.settings })),
      right: widgets.filter(w => w.zone === 'main-right').map(w => ({ id: w.id, type: w.type, title: w.title, content: w.content, settings: w.settings }))
    };
  }

  // Update form submit to include configs
  const profileForm = document.getElementById('profile-edit-form');
  if (profileForm) {
    profileForm.addEventListener('submit', function(e) {
      const sidebarInput = this.querySelector('input[name="sidebar_config"]') || document.createElement('input');
      if (!sidebarInput.name) {
        sidebarInput.type = 'hidden';
        sidebarInput.name = 'sidebar_config';
        this.appendChild(sidebarInput);
      }
      sidebarInput.value = JSON.stringify(serializeSidebar());

      const mainInput = this.querySelector('input[name="main_content"]') || document.createElement('input');
      if (!mainInput.name) {
        mainInput.type = 'hidden';
        mainInput.name = 'main_content';
        this.appendChild(mainInput);
      }
      mainInput.value = JSON.stringify(serializeMain());

      // Existing widgets handling remains
      const existingWidgetsInput = this.querySelector('input[name="widgets"]');
      if (existingWidgetsInput) {
        existingWidgetsInput.value = JSON.stringify(widgets);
      }
    });
  }

  // Basic drag and drop init
  function dragDropInit() {
    const widgets = document.querySelectorAll('.widget-item');
    widgets.forEach(widget => {
      widget.draggable = true;
      widget.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', widget.dataset.widgetId);
        widget.classList.add('dragging');
      });
      widget.addEventListener('dragend', () => widget.classList.remove('dragging'));
    });

    const zones = document.querySelectorAll('.drop-zone, .sidebar .widgets-container, .main-left .widgets-container, .main-right .widgets-container');
    zones.forEach(zone => {
      zone.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        zone.classList.add('drag-over');
      });
      zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
      zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        const widgetId = e.dataTransfer.getData('text/plain');
        const widget = document.querySelector(`[data-widget-id="${widgetId}"]`);
        if (widget && zone.parentElement !== widget.parentElement) {
          zone.appendChild(widget);
          const newZone = zone.closest('.sidebar') ? 'sidebar' : zone.closest('.main-left') ? 'main-left' : 'main-right';
          const widgetObj = widgets.find(w => w.id === widgetId);
          if (widgetObj) widgetObj.zone = newZone;
          widget.dataset.zone = newZone;
          // Trigger serialize if form exists
          if (profileForm) {
            const submitEvent = new Event('submit');
            profileForm.dispatchEvent(submitEvent);
          }
        }
      });
    });
  }

  // Markdown preview (simple)
  function MarkdownPreview(textareaSelector) {
    const textarea = typeof textareaSelector === 'string' ? document.querySelector(textareaSelector) : textareaSelector;
    if (!textarea) return;
    const preview = textarea.nextElementSibling && textarea.nextElementSibling.classList.contains('preview') ? textarea.nextElementSibling : null;
    if (!preview) return;
    textarea.addEventListener('input', () => {
      let text = textarea.value;
      text = text.replace(/\n/g, '<br>');
      preview.innerHTML = text;
    });
  }

  // Init previews for markdown textareas
  document.querySelectorAll('.markdown-textarea').forEach(ta => MarkdownPreview(ta));

  // Avatar upload
  function AvatarUpload(formSelector) {
    const form = document.querySelector(formSelector);
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const formData = new FormData(form);
      fetch('/profile/avatar', { method: 'POST', body: formData })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.url) {
            const avatarImg = document.querySelector('.avatar-upload, #profile-avatar');
            if (avatarImg) avatarImg.src = data.url;
          } else {
            console.error('Avatar upload failed:', data.error);
          }
        })
        .catch(err => console.error('Upload error:', err));
    });
  }

  // Init avatar upload if present
  if (document.querySelector('#avatar-upload-form')) {
    AvatarUpload('#avatar-upload-form');
  }

  // Theme apply hook (minimal extension to profile-themes.js)
  function ThemeApply() {
    const root = document.documentElement;
    const primary = getComputedStyle(root).getPropertyValue('--terminal-green'); // Use existing theme var
    document.querySelectorAll('.sidebar, .widget, .bio-render, .avatar-upload').forEach(el => {
      if (el.classList.contains('sidebar')) el.style.backgroundColor = `var(--sidebar-bg, rgba(0,0,0,0.8))`;
      if (el.classList.contains('widget')) el.style.borderColor = `var(--border, ${primary})`;
      if (el.classList.contains('bio-render')) el.style.color = primary;
      if (el.classList.contains('avatar-upload')) el.style.borderColor = primary;
    });
  }

  // Listen for theme changes (assuming profile-themes.js dispatches event)
  document.addEventListener('themeChanged', ThemeApply);
  // Initial apply
  ThemeApply();

  // Init drag drop on edit pages
  if (document.body.classList.contains('profile-edit') || document.querySelector('.profile-container')) {
    dragDropInit();
  }

});