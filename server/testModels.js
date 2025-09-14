// Test file to verify models can be imported correctly
const User = require('./models/User');
const Post = require('./models/Post');
const Message = require('./models/Message');
const Comment = require('./models/Comment');

console.log('All models imported successfully!');
console.log('User model:', User.modelName);
console.log('Post model:', Post.modelName);
console.log('Message model:', Message.modelName);
console.log('Comment model:', Comment.modelName);