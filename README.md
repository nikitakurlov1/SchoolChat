# School Backend Server

This is a Node.js backend server for a school management system with MongoDB integration.

## Project Structure

```
.
├── server/
│   ├── server.js       # Main server file
│   ├── routes.js       # API routes
│   └── models/
│       ├── User.js     # User model
│       ├── Post.js     # Post model
│       ├── Message.js  # Message model
│       └── Comment.js  # Comment model
├── public/             # Frontend files
│   ├── index.html      # Login/registration page
│   ├── feed.html       # News feed page
│   ├── create.html     # Create post page
│   ├── chat.html       # Chat page
│   ├── profile.html    # User profile page
│   ├── css/
│   │   └── style.css   # Stylesheet with dark theme and glassmorphism
│   └── js/             # JavaScript files
│       ├── auth.js     # Authentication functionality
│       ├── feed.js     # Feed page functionality
│       ├── create.js   # Create post functionality
│       ├── chat.js     # Chat functionality
│       ├── profile.js  # Profile page functionality
│       └── navbar.js   # Navigation functionality
├── .env                # Environment variables
├── .gitignore          # Git ignore file
└── package.json        # Project dependencies and scripts
```

## Setup Instructions

1. Install dependencies:
   ```
   npm install
   ```

2. Make sure MongoDB is running on your system.

3. Start the development server:
   ```
   npm run dev
   ```

   Or start the production server:
   ```
   npm start
   ```

## Director Account

A director account is automatically created when the server starts:
- Login: `0996055020`
- Password: `Zxcv1236`
- Role: `director`

## API Routes

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Posts
- `POST /api/posts` - Create a new post (protected)
- `GET /api/posts` - Get all posts
- `POST /api/posts/:postId/like` - Like a post (protected)
- `POST /api/posts/:postId/comment` - Add a comment to a post (protected)

### Profile
- `GET /api/profile` - Get user profile data (protected)

### Chat
- `GET /api/chat/messages/:userId` - Get chat history with a user (protected)
- `GET /api/chat/unread` - Get users with unread messages (director only, protected)

## WebSocket Events

### Connection
- `authenticate` - Authenticate user with JWT token
- `authenticated` - Confirmation of successful authentication
- `auth_error` - Authentication error

### Messaging
- `send_message` - Send a message to another user
- `receive_message` - Receive a message from another user
- `message_sent` - Confirmation that message was sent
- `message_error` - Error in message sending
- `mark_as_read` - Mark a message as read
- `message_read` - Notification that a message was read
- `message_marked_as_read` - Confirmation that message was marked as read

### Director Specific Events
- `unread_students` - List of students with unread messages (sent on director connection)
- `new_unread_student` - Notification of a new student with unread message

## Frontend Pages

### index.html
Login and registration page with forms for both actions.

### feed.html
News feed displaying posts from users with like and comment functionality.

### create.html
Page for creating new posts with text content and type selection.

### chat.html
Real-time chat interface for communication between students and director.

### profile.html
User profile page showing personal information, statistics, and actions.

## JavaScript Functionality

### auth.js
Handles user authentication including login and registration forms, token storage, and redirection.

### feed.js
Manages the news feed including fetching posts, displaying them, and handling like functionality.

### create.js
Handles post creation form submission and API communication.

### chat.js
Manages real-time chat functionality using Socket.IO, including message sending and receiving.

### profile.js
Fetches and displays user profile information.

### navbar.js
Manages navigation highlighting, authentication checks for protected pages, and token validation.

## Design Features

### Dark Theme
- Deep, eye-friendly background (#121212)
- Light text for readability (#e0e0e0)
- CSS variables for consistent color scheme

### Glassmorphism Effects
- Frosted glass effect on all containers using `backdrop-filter: blur()`
- Semi-transparent backgrounds with rgba values
- Subtle borders and shadows for depth

### SVG Icons
- Custom SVG icons for all navigation and action buttons
- Consistent styling that works well on dark backgrounds
- Responsive icons that scale with text

### Responsive Design
- Mobile-friendly layout using flexbox
- Adaptive components for different screen sizes
- Touch-friendly navigation elements

## Security Features

- JWT token-based authentication
- Token validation on all protected pages
- Automatic redirection to login page when token is missing or expired
- Secure password hashing with bcrypt

## Models

### User
- firstName (String)
- lastName (String)
- grade (String)
- login (String) - Phone number
- password (String) - Hashed
- points (Number)
- role (String) - 'student' or 'director'

### Post
- text (String)
- author (ObjectId) - Reference to User
- type (String)
- likes (Number)
- comments (Array) - References to Comment

### Message
- text (String)
- sender (ObjectId) - Reference to User
- recipient (ObjectId) - Reference to User
- status (String) - 'sent', 'delivered', or 'read'
- timestamp (Date)

### Comment
- text (String)
- author (ObjectId) - Reference to User
- post (ObjectId) - Reference to Post

## Environment Variables

Create a `.env` file with the following variables:
- PORT - Server port (default: 5001)
- MONGODB_URI - MongoDB connection string (default: mongodb://localhost:27017/school_db)
- JWT_SECRET - Secret for JWT token generation