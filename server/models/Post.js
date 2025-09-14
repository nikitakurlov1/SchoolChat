const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true
  },
  image: {
    type: String, // Path to uploaded image
    default: null
  },
  likes: {
    type: Number,
    default: 0
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  // Survey fields
  surveyOptions: [{
    text: String,
    votes: {
      type: Number,
      default: 0
    }
  }],
  surveyVotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    option: Number // Index of the selected option
  }]
}, {
  timestamps: true
});

// Add text index for search functionality
postSchema.index({ text: 'text' });

module.exports = mongoose.model('Post', postSchema);