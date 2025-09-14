const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Post = require('./models/Post');
const Message = require('./models/Message');
const Comment = require('./models/Comment');

// Import routes
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5001; // Changed to 5001 to avoid conflicts

// Create HTTP server and Socket.IO instance
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust this in production to your frontend URL
    methods: ["GET", "POST"]
  }
});


// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve favicon
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/school_db';

mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('Connected to MongoDB');
  // Create director account if it doesn't exist
  createDirectorAccount();
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Use routes with upload middleware
app.use(routes);

// Serve index.html for the root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Function to create director account
async function createDirectorAccount() {
  try {
    const directorExists = await User.findOne({ login: '0996055020' });
    if (directorExists) {
      console.log('Director account already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash('Zxcv1236', 10);
    
    const director = new User({
      firstName: 'Director',
      lastName: 'Admin',
      grade: 'Administration',
      login: '0996055020',
      password: hashedPassword,
      role: 'director'
    });

    await director.save();
    console.log('Director account created successfully');
  } catch (error) {
    console.error('Error creating director account:', error);
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  // Authenticate user on connection
  socket.on('authenticate', async (token) => {
    try {
      if (!token) {
        socket.emit('auth_error', 'No token provided');
        return;
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      
      // Get user info
      const user = await User.findById(socket.userId);
      if (!user) {
        socket.emit('auth_error', 'User not found');
        return;
      }
      
      socket.userName = `${user.firstName} ${user.lastName}`;
      
      console.log(`User authenticated: ${socket.userName} (${socket.userRole})`);
      
      // Handle student connection
      if (socket.userRole === 'student') {
        // Find director
        const director = await User.findOne({ role: 'director' });
        if (director) {
          socket.directorId = director._id.toString();
          socket.join(`user_${socket.directorId}`);
          console.log(`Student ${socket.userName} connected to director`);
        }
      }
      
      // Handle director connection
      if (socket.userRole === 'director') {
        // Get list of students with unread messages
        const unreadMessages = await Message.find({ 
          status: 'sent',
          recipient: socket.userId
        }).populate('sender', 'firstName lastName');
        
        // Extract unique senders
        const studentsWithUnread = {};
        unreadMessages.forEach(msg => {
          const senderId = msg.sender._id.toString();
          if (!studentsWithUnread[senderId]) {
            studentsWithUnread[senderId] = {
              id: senderId,
              firstName: msg.sender.firstName,
              lastName: msg.sender.lastName
            };
          }
        });
        
        const studentsList = Object.values(studentsWithUnread);
        socket.emit('unread_students', studentsList);
        console.log(`Director connected. Unread messages from ${studentsList.length} students`);
      }
      
      socket.emit('authenticated', { userId: socket.userId, role: socket.userRole });
    } catch (error) {
      console.error('Authentication error:', error);
      socket.emit('auth_error', 'Invalid token');
    }
  });
  
  // Handle sending messages
  socket.on('send_message', async (data) => {
    try {
      if (!socket.userId) {
        socket.emit('message_error', 'Not authenticated');
        return;
      }
      
      const { recipientId, text } = data;
      
      // Validate recipientId
      if (!mongoose.Types.ObjectId.isValid(recipientId)) {
        socket.emit('message_error', 'Invalid recipient ID');
        return;
      }
      
      // Save message to database
      const message = new Message({
        text,
        sender: socket.userId,
        recipient: recipientId,
        status: 'sent'
      });
      
      await message.save();
      
      // Populate sender and recipient info
      await message.populate([
        { path: 'sender', select: 'firstName lastName' },
        { path: 'recipient', select: 'firstName lastName' }
      ]);
      
      console.log(`Message sent from ${socket.userName} to user ${recipientId}`);
      
      // Send message to recipient
      const recipientSocket = Array.from(io.sockets.sockets.values())
        .find(s => s.userId === recipientId);
        
      if (recipientSocket) {
        recipientSocket.emit('receive_message', message);
        console.log(`Message delivered to ${recipientSocket.userName}`);
      }
      
      // Send confirmation to sender
      socket.emit('message_sent', message);
      
      // If recipient is director, update their unread students list
      const recipient = await User.findById(recipientId);
      if (recipient && recipient.role === 'director') {
        // Notify director of new unread message
        io.to(`user_${recipientId}`).emit('new_unread_student', {
          id: socket.userId,
          firstName: message.sender.firstName,
          lastName: message.sender.lastName
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message_error', 'Failed to send message');
    }
  });
  
  // Handle message read status
  socket.on('mark_as_read', async (messageId) => {
    try {
      if (!socket.userId) {
        socket.emit('message_error', 'Not authenticated');
        return;
      }
      
      // Update message status to 'read'
      const message = await Message.findByIdAndUpdate(
        messageId,
        { status: 'read' },
        { new: true }
      );
      
      if (message) {
        // Notify sender that their message was read
        const senderSocket = Array.from(io.sockets.sockets.values())
          .find(s => s.userId === message.sender.toString());
          
        if (senderSocket) {
          senderSocket.emit('message_read', { messageId });
        }
        
        socket.emit('message_marked_as_read', { messageId });
        console.log(`Message ${messageId} marked as read by ${socket.userName}`);
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
      socket.emit('message_error', 'Failed to mark message as read');
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});