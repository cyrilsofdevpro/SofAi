// Backend API URL - Use local backend on port 3001
// For Colab/remote access, change to: 'https://your-ngrok-url.ngrok-free.dev'
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// ============= Chat API =============

// Chat endpoint with web search integration
export async function sendMessage(message, model = 'qwen', history = []) {
  // Use the /chat endpoint which includes web search
  const url = `${API_BASE}/chat`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, model, history })
    });

    if (!res.ok) {
      throw new Error(`Backend error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    
    // Handle new response format: { response, sources }
    if (data && typeof data.response === 'string') {
      return { 
        reply: data.response, 
        model_used: model,
        sources: data.sources || []
      };
    }
    
    throw new Error('Invalid response format from backend');
  } catch (error) {
    console.error('❌ Backend error:', error.message);
    throw error;
  }
}

// Keep a minimal getHistory/getApiBase in case other parts expect them. They now return defaults.
export async function getHistory(){
  return { session_id: 'local', messages: [] };
}

export function getApiBase(){ return API_BASE; }

// ============= Authentication API =============

/**
 * Register a new user account
 * @param {Object} userData - User data
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password
 * @param {string} userData.username - User username
 * @param {string} userData.gender - User gender (optional)
 * @returns {Promise<Object>} - Response with success status and user data
 */
export async function signup(userData) {
  try {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        username: userData.username,
        gender: userData.gender || 'not-specified'
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.detail || 'Signup failed'
      };
    }

    return {
      success: true,
      message: data.message,
      user: data.user
    };
  } catch (error) {
    console.error('Signup error:', error);
    return {
      success: false,
      error: error.message || 'Network error during signup'
    };
  }
}

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} - Response with success status and user data
 */
export async function login(email, password) {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.detail || 'Login failed'
      };
    }

    return {
      success: true,
      message: data.message,
      user: data.user
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error.message || 'Network error during login'
    };
  }
}

/**
 * Check if email is already registered
 * @param {string} email - Email to check
 * @returns {Promise<Object>} - Response with email availability status
 */
export async function checkEmail(email) {
  try {
    const response = await fetch(`${API_BASE}/auth/check-email?email=${encodeURIComponent(email)}`);
    return await response.json();
  } catch (error) {
    console.error('Email check error:', error);
    return {
      error: error.message || 'Network error'
    };
  }
}

