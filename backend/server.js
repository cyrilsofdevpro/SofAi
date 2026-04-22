const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for demo purposes (replace with proper database in production)
let users = [];
let sessions = {};

// Helper function to generate session ID
function generateSessionId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Signup endpoint
app.post('/auth/signup', (req, res) => {
  try {
    const { email, password, username, gender } = req.body;

    // Check if user already exists
    if (users.find(user => user.email === email)) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Create new user
    const newUser = {
      id: Date.now(),
      email,
      password, // In production, hash this!
      username,
      gender: gender || 'not-specified',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    res.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        gender: newUser.gender
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Login endpoint
app.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Create session
    const sessionId = generateSessionId();
    sessions[sessionId] = {
      userId: user.id,
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        gender: user.gender
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Check email endpoint
app.post('/auth/check-email', (req, res) => {
  try {
    const { email } = req.body;
    const exists = users.some(user => user.email === email);

    res.json({
      email,
      exists,
      message: exists ? 'User found' : 'Email available for registration'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Chat endpoint (dummy implementation)
app.post('/chat', (req, res) => {
  try {
    const { message, max_tokens, model } = req.body;

    // Simple dummy response
    const responses = [
      "Hello! I'm SofAi, your AI assistant. How can I help you today?",
      "That's an interesting question. Let me think about that for you.",
      "I'm here to assist you with various tasks. What would you like to know?",
      "Thanks for your message! I'm processing your request.",
      "I understand. Let me provide you with some helpful information."
    ];

    const reply = responses[Math.floor(Math.random() * responses.length)];

    res.json({
      reply: reply
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Predict endpoint (for compatibility)
app.post('/predict', (req, res) => {
  try {
    const { message } = req.body;

    const reply = `I received your message: "${message}". This is a demo response from the Node.js backend.`;

    res.json({
      reply: reply,
      model_used: 'demo'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`SofAi Node.js backend server running on http://localhost:${PORT}`);
});