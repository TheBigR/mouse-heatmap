import { WebSocketServer, WebSocket } from 'ws';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HTTP_PORT = 3000;
const PYTHON_WS = 'ws://localhost:5000';

const app = express();
app.use(express.static(path.join(__dirname, '../public')));

app.listen(HTTP_PORT, () => {
  console.log(`HTTP server on http://localhost:${HTTP_PORT}`);
});

const wss = new WebSocketServer({ port: 3001 });
let pythonSocket = null;
let browserClients = new Set();
let isRecording = false;
let pythonConnectionStatus = 'disconnected'; // Track Python connection status

// Function to broadcast status to all browser clients
function broadcastPythonStatus(status) {
  const message = JSON.stringify({
    type: 'python-status',
    status: status
  });
  browserClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Function to connect to Python WebSocket
function connectToPython() {
  pythonConnectionStatus = 'connecting';
  broadcastPythonStatus('connecting');
  pythonSocket = new WebSocket(PYTHON_WS);

  pythonSocket.on('open', () => {
    console.log('✅ Connected to Python WebSocket server');
    pythonConnectionStatus = 'connected';
    broadcastPythonStatus('connected');
  });

  pythonSocket.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📥 Received from Python:', message.type);
      // Forward Python server messages to all browser clients
      if (message.type === 'heatmap-generated' || 
          message.type === 'recording-status' || 
          message.type === 'error') {
        console.log(`📤 Broadcasting ${message.type} to ${browserClients.size} client(s)`);
        broadcastToClients(message);
      }
    } catch (e) {
      console.log('⚠️ Failed to parse Python message:', e.message);
      // Not a JSON message, ignore
    }
  });

  pythonSocket.on('close', () => {
    console.log('❌ Disconnected from Python WebSocket server');
    pythonConnectionStatus = 'disconnected';
    broadcastPythonStatus('disconnected');
    // Attempt to reconnect after 3 seconds
    setTimeout(() => {
      console.log('🔄 Attempting to reconnect to Python server...');
      pythonConnectionStatus = 'connecting';
      broadcastPythonStatus('connecting');
      connectToPython();
    }, 3000);
  });

  pythonSocket.on('error', (error) => {
    console.log('⚠️ Python WebSocket error:', error.message);
    pythonConnectionStatus = 'error';
    broadcastPythonStatus('error');
  });
}

// Handle control commands
function handleCommand(command, client) {
  console.log(`📋 Received command: ${command}`);
  
  switch (command) {
    case 'start-recording':
      isRecording = true;
      broadcastToClients({ type: 'recording-status', recording: true });
      if (pythonSocket && pythonSocket.readyState === WebSocket.OPEN) {
        pythonSocket.send(JSON.stringify({ type: 'command', command: 'start-recording' }));
      }
      break;
      
    case 'stop-recording':
      isRecording = false;
      broadcastToClients({ type: 'recording-status', recording: false });
      if (pythonSocket && pythonSocket.readyState === WebSocket.OPEN) {
        pythonSocket.send(JSON.stringify({ type: 'command', command: 'stop-recording' }));
      }
      break;
      
    case 'generate-heatmap':
      console.log('🔥 Generate heatmap command received');
      if (pythonSocket && pythonSocket.readyState === WebSocket.OPEN) {
        console.log('📤 Sending generate-heatmap command to Python');
        pythonSocket.send(JSON.stringify({ type: 'command', command: 'generate-heatmap' }));
      } else {
        const errorMsg = 'Python server not connected';
        console.log('❌', errorMsg);
        client.send(JSON.stringify({ 
          type: 'error', 
          message: errorMsg
        }));
      }
      break;
  }
}

// Broadcast message to all browser clients
function broadcastToClients(message) {
  const data = JSON.stringify(message);
  browserClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Connect to Python server
connectToPython();

wss.on('connection', (client) => {
  browserClients.add(client);
  console.log(`📱 Browser client connected (${browserClients.size} total)`);
  
  // Send current Python status to new client after a small delay
  // to ensure the client's message handler is ready
  setTimeout(() => {
    // Always send current Python status to new client
    // Determine status from pythonSocket if it exists, otherwise use tracked status
    let status = pythonConnectionStatus;
    if (pythonSocket) {
      if (pythonSocket.readyState === WebSocket.OPEN) {
        status = 'connected';
      } else if (pythonSocket.readyState === WebSocket.CONNECTING) {
        status = 'connecting';
      } else {
        status = 'disconnected';
      }
      pythonConnectionStatus = status; // Update tracked status
    }
    
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'python-status',
        status: status
      }));
      console.log(`📤 Sent Python status to client: ${status}`);
    }
  }, 100);

  client.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      // Handle status request
      if (message.type === 'get-status') {
        let status = pythonConnectionStatus;
        if (pythonSocket) {
          if (pythonSocket.readyState === WebSocket.OPEN) {
            status = 'connected';
          } else if (pythonSocket.readyState === WebSocket.CONNECTING) {
            status = 'connecting';
          } else {
            status = 'disconnected';
          }
        }
        client.send(JSON.stringify({
          type: 'python-status',
          status: status
        }));
        return;
      }
      
      // Handle control commands
      if (message.type === 'command') {
        handleCommand(message.command, client);
        return;
      }
      
      // Forward mouse movement data only if recording
      if (message.type === 'mouse-move' && isRecording) {
        if (pythonSocket && pythonSocket.readyState === WebSocket.OPEN) {
          // Send to Python in the format it expects
          pythonSocket.send(JSON.stringify({
            x: message.x,
            y: message.y,
            t: message.t
          }));
        }
      }
    } catch (e) {
      // If not JSON, forward as-is (backward compatibility)
      if (pythonSocket && pythonSocket.readyState === WebSocket.OPEN && isRecording) {
        pythonSocket.send(data);
      }
    }
  });

  client.on('close', () => {
    browserClients.delete(client);
    console.log(`📱 Browser client disconnected (${browserClients.size} remaining)`);
  });
});

console.log('Browser WS on ws://localhost:3001');