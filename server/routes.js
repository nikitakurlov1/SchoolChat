const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('./models/User');
const Post = require('./models/Post');
const Message = require('./models/Message');
const Comment = require('./models/Comment');

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// POST /api/auth/register: Register a new user
router.post('/api/auth/register', async (req, res) => {
  try {
    const { firstName, lastName, grade, login, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ login });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this login already exists' });
    }
    
    // Create new user
    const user = new User({
      firstName,
      lastName,
      grade,
      login,
      password
    });
    
    await user.save();
    
    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, login: user.login, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        grade: user.grade,
        login: user.login,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// POST /api/auth/login: Login user
router.post('/api/auth/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    
    // Find user by login
    const user = await User.findOne({ login });
    if (!user) {
      return res.status(400).json({ message: 'Invalid login or password' });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid login or password' });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, login: user.login, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        grade: user.grade,
        login: user.login,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// POST /api/posts: Create a new post (protected route)
router.post('/api/posts', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { text, type, surveyOptions } = req.body;
    
    const postData = {
      text,
      type,
      author: req.user.userId
    };
    
    // Add image path if file was uploaded
    if (req.file) {
      postData.image = `uploads/${req.file.filename}`;
    }
    
    // Add survey options if provided
    if (type === 'survey' && surveyOptions) {
      try {
        const options = JSON.parse(surveyOptions);
        postData.surveyOptions = options.map(option => ({
          text: option,
          votes: 0
        }));
      } catch (e) {
        // If parsing fails, treat as regular post
        console.error('Failed to parse survey options:', e);
      }
    }
    
    const post = new Post(postData);
    
    await post.save();
    
    // Add points for creating a post (10 points)
    await User.findByIdAndUpdate(req.user.userId, {
      $inc: { points: 10 }
    });
    
    // Populate author info
    await post.populate('author', 'firstName lastName grade avatar');
    
    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating post', error: error.message });
  }
});

// GET /api/posts/search: Search posts by text content
router.get('/api/posts/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    // Use regex for case-insensitive search
    const searchRegex = new RegExp(q.trim(), 'i');
    
    const posts = await Post.find({
      text: { $regex: searchRegex }
    })
      .populate('author', 'firstName lastName grade avatar')
      .sort({ createdAt: -1 });
    
    res.json({
      posts
    });
  } catch (error) {
    res.status(500).json({ message: 'Error searching posts', error: error.message });
  }
});

// GET /api/posts: Get all posts with author info
router.get('/api/posts', async (req, res) => {
  try {
    // Get the type parameter from query string
    const { type } = req.query;
    
    // Build query filter
    const filter = {};
    if (type && type !== 'all') {
      filter.type = type;
    }
    
    const posts = await Post.find(filter)
      .populate('author', 'firstName lastName grade avatar')
      .sort({ createdAt: -1 });
    
    res.json({
      posts
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching posts', error: error.message });
  }
});

// POST /api/posts/:postId/like: Like a post and update author points
router.post('/api/posts/:postId/like', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Increment likes
    post.likes += 1;
    await post.save();
    
    // Update author points (add 1 point for each like)
    await User.findByIdAndUpdate(post.author, { $inc: { points: 1 } });
    
    // Update liker points (add 0.2 points for liking)
    await User.findByIdAndUpdate(req.user.userId, { $inc: { points: 0.2 } });
    
    res.json({
      message: 'Post liked successfully',
      likes: post.likes
    });
  } catch (error) {
    res.status(500).json({ message: 'Error liking post', error: error.message });
  }
});

// POST /api/posts/:postId/unlike: Unlike a post
router.post('/api/posts/:postId/unlike', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Decrement likes (but not below 0)
    if (post.likes > 0) {
      post.likes -= 1;
      await post.save();
      
      // Update author points (remove 1 point for unlike)
      await User.findByIdAndUpdate(post.author, { $inc: { points: -1 } });
      
      // Update unliker points (remove 0.2 points for unliking)
      await User.findByIdAndUpdate(req.user.userId, { $inc: { points: -0.2 } });
    }
    
    res.json({
      message: 'Post unliked successfully',
      likes: post.likes
    });
  } catch (error) {
    res.status(500).json({ message: 'Error unliking post', error: error.message });
  }
});

// POST /api/posts/:postId/comment: Add a comment to a post
router.post('/api/posts/:postId/comment', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    
    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Create new comment
    const comment = new Comment({
      text,
      author: req.user.userId,
      post: postId
    });
    
    await comment.save();
    
    // Add comment to post
    post.comments.push(comment._id);
    await post.save();
    
    // Update post author points (add 2 points for each comment)
    await User.findByIdAndUpdate(post.author, { $inc: { points: 2 } });
    
    // Update commenter points (add 0.5 points for commenting)
    await User.findByIdAndUpdate(req.user.userId, { $inc: { points: 0.5 } });
    
    // Populate author info
    await comment.populate('author', 'firstName lastName grade avatar');
    
    res.status(201).json({
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
});

// GET /api/posts/:postId/comments: Get comments for a post
router.get('/api/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    
    const comments = await Comment.find({ post: postId })
      .populate('author', 'firstName lastName grade avatar')
      .sort({ createdAt: -1 });
    
    res.json({
      comments
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching comments', error: error.message });
  }
});

// GET /api/profile: Get user profile data
router.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password'); // Exclude password from response
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// GET /api/chat/messages/:userId: Get chat history with a specific user
router.get('/api/chat/messages/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find messages between current user and specified user
    const messages = await Message.find({
      $or: [
        { sender: req.user.userId, recipient: userId },
        { sender: userId, recipient: req.user.userId }
      ]
    })
    .populate('sender', 'firstName lastName')
    .populate('recipient', 'firstName lastName')
    .sort({ timestamp: 1 });
    
    res.json({
      messages
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});

// GET /api/chat/unread: Get list of users with unread messages (director only)
router.get('/api/chat/unread', authenticateToken, async (req, res) => {
  try {
    // Check if user is director
    if (req.user.role !== 'director') {
      return res.status(403).json({ message: 'Access denied. Director only.' });
    }
    
    // Find unread messages
    const unreadMessages = await Message.find({ status: 'sent' })
      .populate('sender', 'firstName lastName')
      .populate('recipient', 'firstName lastName');
    
    // Extract unique senders of unread messages
    const senders = {};
    unreadMessages.forEach(msg => {
      const senderId = msg.sender._id.toString();
      if (!senders[senderId]) {
        senders[senderId] = {
          id: msg.sender._id,
          firstName: msg.sender.firstName,
          lastName: msg.sender.lastName
        };
      }
    });
    
    const usersWithUnread = Object.values(senders);
    
    res.json({
      users: usersWithUnread
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching unread messages', error: error.message });
  }
});

// POST /api/profile/avatar: Upload user avatar
router.post('/api/profile/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No avatar file provided' });
    }
    
    // Update user avatar
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { avatar: req.file.filename },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: 'Avatar updated successfully',
      avatar: user.avatar
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating avatar', error: error.message });
  }
});

// GET /api/profile/stats: Get user statistics
router.get('/api/profile/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get posts count
    const postsCount = await Post.countDocuments({ author: userId });
    
    // Get comments count
    const commentsCount = await Comment.countDocuments({ author: userId });
    
    // Get total likes on user's posts
    const userPosts = await Post.find({ author: userId });
    const likesCount = userPosts.reduce((total, post) => total + (post.likes || 0), 0);
    
    res.json({
      stats: {
        postsCount,
        commentsCount,
        likesCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

// GET /api/comments/user: Get user's comments with post info
router.get('/api/comments/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const comments = await Comment.find({ author: userId })
      .populate({
        path: 'post',
        populate: {
          path: 'author',
          select: 'firstName lastName grade avatar'
        }
      })
      .sort({ createdAt: -1 });
    
    res.json({
      comments
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user comments', error: error.message });
  }
});

// POST /api/posts/:postId/survey/vote: Vote in a survey
router.post('/api/posts/:postId/survey/vote', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { optionIndex } = req.body;
    
    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if it's a survey post
    if (!post.surveyOptions || post.surveyOptions.length === 0) {
      return res.status(400).json({ message: 'This post is not a survey' });
    }
    
    // Check if user has already voted
    const existingVote = post.surveyVotes.find(vote => 
      vote.user.toString() === req.user.userId
    );
    
    if (existingVote) {
      return res.status(400).json({ message: 'You have already voted in this survey' });
    }
    
    // Validate option index
    if (optionIndex < 0 || optionIndex >= post.surveyOptions.length) {
      return res.status(400).json({ message: 'Invalid option selected' });
    }
    
    // Add the vote
    post.surveyVotes.push({
      user: req.user.userId,
      option: optionIndex
    });
    
    // Increment vote count for the selected option
    post.surveyOptions[optionIndex].votes += 1;
    
    await post.save();
    
    res.json({
      message: 'Vote recorded successfully',
      surveyOptions: post.surveyOptions
    });
  } catch (error) {
    res.status(500).json({ message: 'Error recording vote', error: error.message });
  }
});

module.exports = router;