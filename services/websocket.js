// Elriel - WebSocket Service
// Handles real-time connections and message broadcasting for Bleedstream

const WebSocket = require('ws');
const url = require('url');

// Store for connected clients
const clients = new Map();
// User ID to WebSocket mapping for personalized updates
const userSockets = new Map();

/**
 * Initialize WebSocket server with an HTTP server
 * @param {Object} server - HTTP server instance
 */
function init(server) {
  const wss = new WebSocket.Server({ 
    server,
    path: '/ws'
  });

  console.log('WebSocket server initialized');

  wss.on('connection', (ws, req) => {
    // Parse URL to get query parameters
    const parameters = url.parse(req.url, true).query;
    const clientId = parameters.clientId || `anon-${Date.now()}`;
    const userId = parameters.userId || null;
    
    // Store client connection
    clients.set(clientId, ws);
    
    // Store user mapping if authenticated
    if (userId) {
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(clientId);
      console.log(`User ${userId} connected with client ${clientId}`);
    } else {
      console.log(`Anonymous client ${clientId} connected`);
    }

    // Send welcome message with connection info
    ws.send(JSON.stringify({
      type: 'connection',
      clientId,
      timestamp: new Date().toISOString(),
      message: 'Connected to Bleedstream real-time network'
    }));

    // Handle incoming messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        console.log(`Received message from ${clientId}:`, data);
        
        // Handle specific message types
        switch (data.type) {
          case 'ping':
            ws.send(JSON.stringify({
              type: 'pong',
              timestamp: new Date().toISOString()
            }));
            break;
          // Additional message handlers can be added here
        }
      } catch (err) {
        console.error(`Error processing message from ${clientId}:`, err);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      clients.delete(clientId);
      
      // Clean up user mapping
      if (userId && userSockets.has(userId)) {
        userSockets.get(userId).delete(clientId);
        if (userSockets.get(userId).size === 0) {
          userSockets.delete(userId);
        }
      }
      
      console.log(`Client ${clientId} disconnected`);
    });
  });

  return wss;
}

/**
 * Broadcast a message to all connected clients
 * @param {Object} data - Message to broadcast
 */
function broadcast(data) {
  const message = JSON.stringify({
    ...data,
    timestamp: new Date().toISOString()
  });
  
  clients.forEach((client, id) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

/**
 * Send a message to a specific user across all their connected devices
 * @param {string} userId - User ID to send to
 * @param {Object} data - Message to send
 */
function sendToUser(userId, data) {
  if (!userSockets.has(userId)) return;
  
  const message = JSON.stringify({
    ...data,
    timestamp: new Date().toISOString()
  });
  
  userSockets.get(userId).forEach(clientId => {
    const client = clients.get(clientId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

/**
 * Broadcast activity to interested users based on their preferences
 * @param {Object} activity - Activity data
 * @param {Array} interestedUsers - List of user IDs interested in this activity
 */
function broadcastActivity(activity, interestedUsers = []) {
  const message = JSON.stringify({
    type: 'activity',
    data: activity,
    timestamp: new Date().toISOString()
  });
  
  // If no specific users are targeted, send to everyone
  if (!interestedUsers.length) {
    broadcast({ type: 'activity', data: activity });
    return;
  }
  
  // Send only to interested users
  interestedUsers.forEach(userId => {
    if (userSockets.has(userId)) {
      userSockets.get(userId).forEach(clientId => {
        const client = clients.get(clientId);
        if (client && client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  });
}

module.exports = {
  init,
  broadcast,
  sendToUser,
  broadcastActivity,
  // Expose for testing and monitoring
  getConnectedClientsCount: () => clients.size,
  getConnectedUsersCount: () => userSockets.size
};