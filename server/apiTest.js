// Simple API test script
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

// Import routes
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_db';

mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('Connected to MongoDB for testing');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Use routes
app.use(routes);

app.listen(PORT, () => {
  console.log(`API Test server running on port ${PORT}`);
  console.log('Available endpoints:');
  console.log('- POST /api/auth/register');
  console.log('- POST /api/auth/login');
  console.log('- POST /api/posts (protected)');
  console.log('- GET /api/posts');
  console.log('- POST /api/posts/:postId/like (protected)');
  console.log('- POST /api/posts/:postId/comment (protected)');
  console.log('- GET /api/profile (protected)');
  console.log('- GET /api/chat/messages/:userId (protected)');
  console.log('- GET /api/chat/unread (director only, protected)');
});