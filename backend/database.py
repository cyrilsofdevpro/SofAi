import json
import os
from pathlib import Path
from datetime import datetime
import hashlib
import re

# Database file path
DB_DIR = Path(__file__).parent / "data"
DB_DIR.mkdir(exist_ok=True)
DB_FILE = DB_DIR / "users.json"

class Database:
    """Simple JSON-based user database for authentication"""
    
    def __init__(self):
        self.db_file = DB_FILE
        self._load_database()
    
    def _load_database(self):
        """Load users from JSON file"""
        if self.db_file.exists():
            try:
                with open(self.db_file, 'r', encoding='utf-8') as f:
                    self.data = json.load(f)
            except (json.JSONDecodeError, IOError):
                self.data = {"users": {}}
        else:
            self.data = {"users": {}}
    
    def _save_database(self):
        """Save users to JSON file"""
        try:
            with open(self.db_file, 'w', encoding='utf-8') as f:
                json.dump(self.data, f, indent=2, ensure_ascii=False)
        except IOError as e:
            raise Exception(f"Error saving database: {str(e)}")
    
    @staticmethod
    def _hash_password(password: str) -> str:
        """Hash password using SHA256"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    @staticmethod
    def _validate_email(email: str) -> bool:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def _validate_password(password: str) -> tuple[bool, str]:
        """Validate password strength"""
        if len(password) < 6:
            return False, "Password must be at least 6 characters long"
        if not any(c.isupper() for c in password):
            return False, "Password must contain at least one uppercase letter"
        if not any(c.isdigit() for c in password):
            return False, "Password must contain at least one digit"
        return True, "Password is valid"
    
    def user_exists(self, email: str) -> bool:
        """Check if user exists by email"""
        return email.lower() in self.data.get("users", {})
    
    def create_user(self, email: str, password: str, username: str, gender: str = "not-specified") -> dict:
        """Create a new user account"""
        # Validate email
        if not self._validate_email(email):
            return {"success": False, "error": "Invalid email format"}
        
        # Check if user already exists
        if self.user_exists(email):
            return {"success": False, "error": "User already exists. Please login or use a different email."}
        
        # Validate password
        is_valid, message = self._validate_password(password)
        if not is_valid:
            return {"success": False, "error": message}
        
        # Validate username
        if not username or len(username) < 2:
            return {"success": False, "error": "Username must be at least 2 characters long"}
        
        # Create user
        user_data = {
            "email": email.lower(),
            "username": username,
            "password_hash": self._hash_password(password),
            "gender": gender,
            "created_at": datetime.now().isoformat(),
            "last_login": None,
            "conversations": []
        }
        
        self.data["users"][email.lower()] = user_data
        self._save_database()
        
        return {
            "success": True,
            "message": "Account created successfully",
            "user": {
                "email": user_data["email"],
                "username": user_data["username"],
                "gender": user_data["gender"]
            }
        }
    
    def authenticate_user(self, email: str, password: str) -> dict:
        """Authenticate user and return user data"""
        email_lower = email.lower()
        
        # Check if user exists
        if not self.user_exists(email):
            return {"success": False, "error": "User not found. Please create an account."}
        
        user = self.data["users"][email_lower]
        
        # Verify password
        if user["password_hash"] != self._hash_password(password):
            return {"success": False, "error": "Invalid password. Please try again."}
        
        # Update last login
        user["last_login"] = datetime.now().isoformat()
        self._save_database()
        
        return {
            "success": True,
            "message": "Login successful",
            "user": {
                "email": user["email"],
                "username": user["username"],
                "gender": user["gender"]
            }
        }
    
    def get_user(self, email: str) -> dict:
        """Get user by email"""
        email_lower = email.lower()
        if not self.user_exists(email):
            return None
        return self.data["users"][email_lower]
    
    def update_user_conversations(self, email: str, conversations: list) -> bool:
        """Update user's conversations"""
        email_lower = email.lower()
        if not self.user_exists(email):
            return False
        
        self.data["users"][email_lower]["conversations"] = conversations
        self._save_database()
        return True
    
    def get_user_conversations(self, email: str) -> list:
        """Get user's conversations"""
        user = self.get_user(email)
        if user:
            return user.get("conversations", [])
        return []

# Global database instance
db = Database()
