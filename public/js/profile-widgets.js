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
});