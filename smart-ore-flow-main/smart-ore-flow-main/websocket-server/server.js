/**
 * WebSocket Server for Unity Digital Twin Integration
 * 
 * This server bridges communication between Unity and React website.
 * It receives data from Unity and broadcasts it to all connected React clients.
 * It also receives commands from React and forwards them to Unity.
 * 
 * Usage:
 *   1. Install dependencies: npm install ws
 *   2. Run server: node server.js
 *   3. Server will listen on ws://localhost:3001
 */

const WebSocket = require('ws');

// Create WebSocket server on port 3001
const wss = new WebSocket.Server({ 
  port: 3001,
  perMessageDeflate: false // Disable compression for better compatibility
});

console.log('🚀 WebSocket Server Starting...');
console.log('📡 Listening on ws://localhost:3001');
console.log('');

// Track connected clients
const clients = new Set();
let unityClient = null;
let reactClients = new Set();

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`✅ New client connected from ${clientIp}`);
  clients.add(ws);

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection',
    status: 'connected',
    message: 'Connected to Smart Ore Flow WebSocket server',
    timestamp: new Date().toISOString()
  }));

  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      // Identify client type
      if (data.deviceId && data.deviceId.startsWith('unity-')) {
        // This is from Unity
        if (!unityClient) {
          unityClient = ws;
          console.log('🎮 Unity client identified');
        }
        
        // Broadcast Unity data to all React clients
        reactClients.forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(message.toString());
          }
        });
        
        console.log(`📤 [Unity → React] Forwarded data from ${data.deviceId}`);
      } else if (data.type === 'command' || data.command) {
        // This is a command from React
        if (unityClient && unityClient.readyState === WebSocket.OPEN) {
          // Forward command to Unity
          unityClient.send(message.toString());
          console.log(`📤 [React → Unity] Forwarded command: ${data.command} to ${data.deviceId}`);
        } else {
          console.warn(`⚠️  Command received but Unity client not connected: ${data.command}`);
          // Send error back to React client
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Unity client not connected',
            timestamp: new Date().toISOString()
          }));
        }
      } else {
        // This might be from React (data subscription or other)
        // Store as React client if not already identified
        if (!reactClients.has(ws) && ws !== unityClient) {
          reactClients.add(ws);
          console.log('⚛️  React client identified');
        }
        
        // If Unity is connected, forward to Unity
        if (unityClient && unityClient.readyState === WebSocket.OPEN && ws !== unityClient) {
          unityClient.send(message.toString());
        }
      }
    } catch (error) {
      console.error('❌ Error processing message:', error.message);
    }
  });

  // Handle client disconnection
  ws.on('close', () => {
    clients.delete(ws);
    reactClients.delete(ws);
    
    if (ws === unityClient) {
      unityClient = null;
      console.log('🎮 Unity client disconnected');
    } else {
      console.log('⚛️  React client disconnected');
    }
    
    console.log(`📊 Active connections: ${clients.size} (Unity: ${unityClient ? 'Connected' : 'Disconnected'}, React: ${reactClients.size})`);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
  });

  console.log(`📊 Active connections: ${clients.size} (Unity: ${unityClient ? 'Connected' : 'Disconnected'}, React: ${reactClients.size})`);
});

// Handle server errors
wss.on('error', (error) => {
  console.error('❌ Server error:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  wss.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

console.log('✅ WebSocket server is ready!');
console.log('');
console.log('📋 Client Types:');
console.log('   🎮 Unity: Sends machine data (deviceId starts with "unity-")');
console.log('   ⚛️  React: Receives data and sends commands');
console.log('');
console.log('💡 Press Ctrl+C to stop the server');
console.log('');

