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

// ============= Web Search Functions =============
/**
 * Check if a query needs web search
 */
function needsSearch(query) {
  const searchKeywords = [
    "latest", "news", "current", "today", "price", "stock",
    "weather", "who is", "what is", "how much", "when is",
    "trending", "new", "update", "breaking", "recent"
  ];
  
  const queryLower = query.toLowerCase();
  return searchKeywords.some(keyword => queryLower.includes(keyword));
}

/**
 * Dummy web search function
 * In production, integrate with SerpAPI or similar
 */
async function performWebSearch(query, numResults = 5) {
  try {
    // For demo purposes, return mock search results
    // In production, call actual search API
    const mockResults = [
      {
        title: "Search Result 1",
        snippet: `Information about "${query}" from the web. This is a placeholder result.`,
        link: `https://google.com/search?q=${encodeURIComponent(query)}`,
        source: "Demo"
      },
      {
        title: "Search Result 2",
        snippet: `More information about "${query}". This demonstrates web search integration.`,
        link: `https://google.com/search?q=${encodeURIComponent(query)}`,
        source: "Demo"
      }
    ];
    
    return mockResults.slice(0, numResults);
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
}

/**
 * Format search results into context string
 */
function formatSearchContext(results) {
  if (!results || results.length === 0) {
    return "";
  }
  
  let context = "Here is real-time web information:\n\n";
  
  results.forEach((result, i) => {
    context += `[Source ${i + 1}] ${result.title || 'No title'}\n`;
    let snippet = result.snippet || 'No snippet available';
    if (snippet.length > 200) {
      snippet = snippet.substring(0, 200) + "...";
    }
    context += `${snippet}\n`;
    context += `Link: ${result.link || 'No link'}\n\n`;
  });
  
  return context;
}

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

    // Check if web search is needed
    let searchResults = [];
    let usedSearch = false;
    
    if (needsSearch(message)) {
      searchResults = performWebSearch(message, 5);
      usedSearch = searchResults.length > 0;
    }

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
      reply: reply,
      sources: usedSearch ? searchResults : null,
      used_search: usedSearch
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

    // Check if web search is needed
    let searchResults = [];
    let usedSearch = false;
    
    if (needsSearch(message)) {
      searchResults = performWebSearch(message, 5);
      usedSearch = searchResults.length > 0;
    }

    const reply = `I received your message: "${message}". This is a demo response from the Node.js backend.`;

    res.json({
      reply: reply,
      model_used: 'demo',
      sources: usedSearch ? searchResults : null,
      used_search: usedSearch
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