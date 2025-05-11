# Enhanced Bleedstream Implementation

This document details the architecture and implementation of the enhanced Bleedstream for 2133.lol - a dynamic, real-time social feed with personalization, reactions, and customization features.

## Architecture Overview

The enhanced Bleedstream implementation extends the existing codebase with several key components:

1. **Database Changes** - New tables and columns to support activity logging, user interests and customization
2. **WebSocket Server** - Real-time communication for live updates
3. **Activity Logging** - System to track and display user activities
4. **Personalization Engine** - Algorithm for customizing content based on user interests
5. **UI Enhancements** - Visual improvements and customization options

## Implementation Files

The enhancement consists of the following new/modified files:

### Database
- `db/update_bleedstream.js` - Script to update the database schema

### Backend
- `app_enhanced.js` - Enhanced application entry point with WebSocket support
- `services/websocket.js` - WebSocket server implementation
- `routes/activity.js` - Activity logging and retrieval endpoints
- `routes/preferences.js` - User preferences and interests management
- `routes/feed_enhanced.js` - Enhanced feed routes with personalization

### Frontend
- `views/feed/enhanced-bleedstream.html` - Enhanced Bleedstream UI
- `public/css/bleedstream-enhanced.css` - CSS for enhanced features
- `public/js/bleedstream-realtime.js` - Client-side real-time functionality

## Database Schema Changes

### New Tables
- **activity_log**: Tracks user activities (posts, profile updates, etc.)
- **user_interests**: Stores user interests for personalization

### Modified Tables
- **users**: Added columns for theme, background_image, font_size, and font_color

## Features

### 1. Real-time Activity Feed
- WebSocket-based live updates
- Visual notifications for new content
- Connection status indicator

### 2. Content Personalization 
- Personalized feeds based on user interests (tags, districts, glyphs)
- Scoring algorithm to prioritize relevant content
- Global/Personalized view toggle

### 3. UI Customization
- Theme selection (Default, Cyberpunk, Win98, Glitch, Vaporwave)
- Font size and color adjustments
- Custom background images

### 4. Activity Tracking
- Log and display user activities
- Filtering and organization of activity types
- Real-time activity notifications

## How to Activate

1. **Update the database**:
   ```
   node db/update_bleedstream.js
   ```

2. **Install required packages**:
   ```
   npm install ws --save
   ```

3. **Use the enhanced application**:
   - Rename `app_enhanced.js` to `app.js` 
   - OR run with `node app_enhanced.js`

4. **Access the enhanced Bleedstream**:
   Navigate to `/feed/bleedstream/enhanced` in the browser

## Technical Details

### WebSocket Communication

The WebSocket server establishes connections with clients and maintains a registry of connected users. It handles:

- Real-time feed updates
- Activity notifications
- Connection management
- Personalized content delivery

Message format:
```javascript
{
  type: 'message_type',  // e.g., 'activity', 'personalized_feed', etc.
  data: {}, // Message-specific data
  timestamp: 'ISO timestamp'
}
```

### Personalization Algorithm

The personalization engine uses a weighted scoring system:
- 100 points for user's own content
- 50 points for matching tags
- 40 points for matching districts 
- 30 points for matching glyphs
- 10 points base score for all content

The algorithm combines these scores with recency to create a personalized feed that balances relevance and freshness.

### Cyberpunk Aesthetic Customization

The enhanced UI provides several cyberpunk-inspired themes:
- **Default Terminal**: Classic green-on-black terminal style
- **Cyberpunk Neon**: High-contrast neon colors with dark background
- **Glitch**: Distorted visual effects with scan lines
- **Win98**: Retro computing aesthetic
- **Vaporwave**: Pastel colors with 90s internet aesthetics

## Performance Considerations

- Real-time updates are selective to minimize bandwidth
- Personalization calculations run server-side to reduce client load
- Connection management includes auto-reconnect with exponential backoff
- Assets are optimized for minimal load times even with aesthetic enhancements

## Security Considerations

- WebSocket messages are validated on both client and server
- User preferences are properly sanitized before storage
- Activity logging respects privacy (encrypted posts are not logged)
- Background image uploads are validated and size-restricted

## Future Enhancements

- Reaction system with cyberpunk-themed emotes
- Enhanced encryption options with visual cues
- Ephemeral messages that degrade/glitch over time
- Neural network simulation for pseudo-AI content recommendations