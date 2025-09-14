// Test file to verify Socket.IO integration
const { createServer } = require('http');
const { Server } = require('socket.io');

console.log('Socket.IO imported successfully!');
console.log('createServer type:', typeof createServer);
console.log('Server type:', typeof Server);