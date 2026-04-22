#!/usr/bin/env python3
"""
Quick test script to verify the database system works correctly
Run this from the backend directory: python test_auth.py
"""

import sys
import json
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent))

from database import db

def test_auth_system():
    """Test the authentication system"""
    
    print("=" * 60)
    print("SofAI Authentication System Test")
    print("=" * 60)
    
    # Test 1: Create a user
    print("\n[TEST 1] Creating a new user...")
    result = db.create_user(
        email="testuser@example.com",
        password="SecurePass123",
        username="testuser",
        gender="male"
    )
    print(f"Result: {json.dumps(result, indent=2)}")
    assert result["success"], "Failed to create user"
    print("✓ User created successfully")
    
    # Test 2: Try to create duplicate user
    print("\n[TEST 2] Attempting to create duplicate user...")
    result = db.create_user(
        email="testuser@example.com",
        password="SecurePass123",
        username="testuser",
        gender="male"
    )
    print(f"Result: {json.dumps(result, indent=2)}")
    assert not result["success"], "Should reject duplicate user"
    assert "already exists" in result["error"].lower()
    print("✓ Duplicate user correctly rejected")
    
    # Test 3: Successful login
    print("\n[TEST 3] Testing successful login...")
    result = db.authenticate_user(
        email="testuser@example.com",
        password="SecurePass123"
    )
    print(f"Result: {json.dumps(result, indent=2)}")
    assert result["success"], "Login should succeed"
    assert result["user"]["email"] == "testuser@example.com"
    print("✓ Login successful")
    
    # Test 4: Login with wrong password
    print("\n[TEST 4] Testing login with wrong password...")
    result = db.authenticate_user(
        email="testuser@example.com",
        password="WrongPassword123"
    )
    print(f"Result: {json.dumps(result, indent=2)}")
    assert not result["success"], "Login should fail"
    assert "Invalid password" in result["error"]
    print("✓ Wrong password correctly rejected")
    
    # Test 5: Login with non-existent email
    print("\n[TEST 5] Testing login with non-existent email...")
    result = db.authenticate_user(
        email="nonexistent@example.com",
        password="SecurePass123"
    )
    print(f"Result: {json.dumps(result, indent=2)}")
    assert not result["success"], "Login should fail"
    assert "User not found" in result["error"]
    print("✓ Non-existent user correctly rejected")
    
    # Test 6: Test user existence check
    print("\n[TEST 6] Testing user existence check...")
    exists = db.user_exists("testuser@example.com")
    print(f"User exists: {exists}")
    assert exists, "User should exist"
    print("✓ User existence check works")
    
    # Test 7: Test email validation
    print("\n[TEST 7] Testing invalid email format...")
    result = db.create_user(
        email="invalid-email",
        password="SecurePass123",
        username="testuser2",
        gender="female"
    )
    print(f"Result: {json.dumps(result, indent=2)}")
    assert not result["success"], "Should reject invalid email"
    print("✓ Invalid email correctly rejected")
    
    # Test 8: Test weak password
    print("\n[TEST 8] Testing weak password...")
    result = db.create_user(
        email="test2@example.com",
        password="weak",
        username="testuser2",
        gender="female"
    )
    print(f"Result: {json.dumps(result, indent=2)}")
    assert not result["success"], "Should reject weak password"
    assert "6 characters" in result["error"]
    print("✓ Weak password correctly rejected")
    
    # Test 9: Test password without uppercase
    print("\n[TEST 9] Testing password without uppercase...")
    result = db.create_user(
        email="test3@example.com",
        password="lowercase123",
        username="testuser3",
        gender="male"
    )
    print(f"Result: {json.dumps(result, indent=2)}")
    assert not result["success"], "Should reject password without uppercase"
    assert "uppercase" in result["error"].lower()
    print("✓ Password without uppercase correctly rejected")
    
    # Test 10: Test password without digit
    print("\n[TEST 10] Testing password without digit...")
    result = db.create_user(
        email="test4@example.com",
        password="NoDigitPassword",
        username="testuser4",
        gender="female"
    )
    print(f"Result: {json.dumps(result, indent=2)}")
    assert not result["success"], "Should reject password without digit"
    assert "digit" in result["error"].lower()
    print("✓ Password without digit correctly rejected")
    
    print("\n" + "=" * 60)
    print("✅ All tests passed!")
    print("=" * 60)
    
    # Display database content
    print("\n[DATABASE CONTENT]")
    if db.db_file.exists():
        with open(db.db_file, 'r') as f:
            data = json.load(f)
            print(json.dumps(data, indent=2))
    
    print("\nDatabase file location:", db.db_file)

if __name__ == "__main__":
    try:
        test_auth_system()
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
