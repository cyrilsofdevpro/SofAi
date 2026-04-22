# User Authentication & Database System

This document describes the database and authentication system for SofAI.

## Overview

The system now includes:
- **User Registration**: Create accounts with email, password, username, and optional gender
- **User Authentication**: Login with email and password verification
- **User Database**: JSON-based local database (can be upgraded to MongoDB/PostgreSQL)
- **Password Security**: SHA256 hashing for password storage
- **Input Validation**: Email format, password strength, and field validation

## Database Structure

### Database File Location
`backend/data/users.json`

### User Object Structure
```json
{
  "users": {
    "email@example.com": {
      "email": "email@example.com",
      "username": "username",
      "password_hash": "sha256_hash",
      "gender": "not-specified|male|female|other",
      "created_at": "2026-01-24T12:00:00",
      "last_login": "2026-01-24T12:05:00",
      "conversations": []
    }
  }
}
```

## Backend API Endpoints

### 1. User Signup
**Endpoint**: `POST /auth/signup`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "username": "john_doe",
  "gender": "male"
}
```

**Response Success**:
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "email": "user@example.com",
    "username": "john_doe",
    "gender": "male"
  }
}
```

**Response Error**:
```json
{
  "detail": "User already exists. Please login or use a different email."
}
```

**Validation Rules**:
- Email must be valid format
- Password must be at least 6 characters
- Password must contain at least one uppercase letter
- Password must contain at least one digit
- Username must be at least 2 characters

### 2. User Login
**Endpoint**: `POST /auth/login`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response Success**:
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "email": "user@example.com",
    "username": "john_doe",
    "gender": "male"
  }
}
```

**Response Error**:
```json
{
  "detail": "User not found. Please create an account."
}
```

OR

```json
{
  "detail": "Invalid password. Please try again."
}
```

### 3. Check Email Availability
**Endpoint**: `GET /auth/check-email?email=user@example.com`

**Response**:
```json
{
  "email": "user@example.com",
  "exists": false,
  "message": "Email available for registration"
}
```

## Frontend Functions (api.js)

### 1. Signup Function
```javascript
import { signup } from './api.js';

const result = await signup({
  email: 'user@example.com',
  password: 'SecurePass123',
  username: 'john_doe',
  gender: 'male'
});

if (result.success) {
  console.log('Account created:', result.user);
} else {
  console.error('Signup failed:', result.error);
}
```

### 2. Login Function
```javascript
import { login } from './api.js';

const result = await login('user@example.com', 'SecurePass123');

if (result.success) {
  console.log('Logged in:', result.user);
} else {
  console.error('Login failed:', result.error);
}
```

### 3. Check Email Function
```javascript
import { checkEmail } from './api.js';

const result = await checkEmail('user@example.com');

if (result.exists) {
  console.log('Email already registered');
} else {
  console.log('Email available');
}
```

## Frontend UI Updates

The Chat component now includes:
- **Login Tab**: Email and password fields with login button
- **Signup Tab**: Email, password, username, gender dropdown, terms checkbox
- **Error Handling**: Displays user-friendly error messages
- **User Session**: Stores user info in localStorage
- **Logout**: Clears user session and data

### Updated handleLogin()
```javascript
const handleLogin = async () => {
  try {
    const result = await login(loginData.email, loginData.password);
    if (result.success) {
      setUser(result.user);
      setIsLoggedIn(true);
      // ... rest of logic
    } else {
      alert(result.error);
    }
  } catch (error) {
    alert('Login error: ' + error.message);
  }
};
```

### Updated handleSignup()
```javascript
const handleSignup = async () => {
  try {
    const result = await signup({
      email: signupData.email,
      password: signupData.password,
      username: signupData.username,
      gender: signupData.gender
    });
    if (result.success) {
      setUser(result.user);
      setIsLoggedIn(true);
      // ... rest of logic
    } else {
      alert(result.error);
    }
  } catch (error) {
    alert('Signup error: ' + error.message);
  }
};
```

## Running the System

### Backend
```bash
cd SofAI/backend
python main.py
# Server runs on http://localhost:8000
```

### Frontend
```bash
cd SofAI/frontend
npm run dev
# Frontend runs on http://localhost:5173
```

## Password Strength Requirements

- **Minimum Length**: 6 characters
- **Uppercase Letters**: At least 1 (A-Z)
- **Digits**: At least 1 (0-9)

Example valid passwords:
- `SecurePass123`
- `MyPassword1`
- `Test@Pass2`

## Future Enhancements

1. **Database Upgrade**: Replace JSON with MongoDB/PostgreSQL
2. **JWT Tokens**: Add token-based authentication
3. **Email Verification**: Send verification emails to confirm email addresses
4. **Password Reset**: Add forgot password functionality
5. **User Profile**: Add profile management endpoints
6. **Session Management**: Add session timeout and refresh tokens
7. **Rate Limiting**: Add rate limiting to prevent brute force attacks
8. **Two-Factor Authentication**: Add 2FA support
9. **Social Login**: Add Google/GitHub login options

## Security Notes

- Passwords are hashed using SHA256 (upgrade to bcrypt in production)
- CORS is enabled for development (restrict in production)
- No HTTPS is used in development (use HTTPS in production)
- Database file should not be committed to version control
- Add `.gitignore` entry: `backend/data/`

## Troubleshooting

### Backend Not Running
- Make sure FastAPI and dependencies are installed
- Check if port 8000 is available
- Run `pip install -r requirements.txt`

### Frontend Can't Connect to Backend
- Check if backend is running on localhost:8000
- Update `API_BASE` in `frontend/src/api.js` if using different port
- Check browser console for CORS errors

### Login/Signup Errors
- Check browser console for specific error messages
- Verify email format is correct
- Check password meets strength requirements
- Check if database file exists at `backend/data/users.json`

## Testing

### Test Signup
1. Navigate to frontend
2. Go to "Sign Up" tab
3. Enter valid email, password (6+ chars, 1 uppercase, 1 digit), username, gender
4. Accept terms
5. Click "Sign Up"
6. Should see success message and redirect to chat

### Test Login
1. Go to "Log In" tab
2. Enter email and password from signup
3. Click "Log In"
4. Should see success message and user info

### Test Invalid Login
1. Try login with non-existent email
2. Should see: "User not found. Please create an account."
3. Try login with wrong password
4. Should see: "Invalid password. Please try again."
