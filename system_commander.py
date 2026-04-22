"""
SofAi System Commander - Local service for system commands
Runs on localhost:5000 to execute system commands safely
"""

from flask import Flask, request, jsonify, make_response
import subprocess
import os
import platform
import re

app = Flask(__name__)

# Add CORS headers manually
@app.before_request
def before_request():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        response.headers.add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        return response

@app.after_request
def after_request(response):
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type")
    response.headers.add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    return response

# Whitelist of allowed applications
ALLOWED_APPS = {
    'notepad': 'notepad.exe',
    'chrome': 'chrome.exe',
    'firefox': 'firefox.exe',
    'edge': 'msedge.exe',
    'vs code': 'code',
    'vscode': 'code',
    'calculator': 'calc.exe',
    'paint': 'mspaint.exe',
    'cmd': 'cmd.exe',
    'powershell': 'powershell.exe',
    'word': 'winword.exe',
    'excel': 'excel.exe',
    'vlc': 'vlc.exe',
    'spotify': 'spotify.exe',
    'youtube': 'https://youtube.com',
    'google': 'https://google.com',
    'gmail': 'https://gmail.com',
}

def extract_app_name(command_text):
    """Extract app name from voice command"""
    # Remove common phrases
    cleaned = re.sub(r'^(hey sofai|sofai|open|launch|start)\s+', '', command_text.lower().strip())
    
    # Check against whitelist
    for key, value in ALLOWED_APPS.items():
        if key in cleaned:
            return key, value
    
    return None, None

def execute_command(app_name, app_path):
    """Safely execute system command"""
    try:
        if platform.system() == 'Windows':
            if app_path.startswith('http'):
                # Open URL in default browser
                os.startfile(app_path)
            else:
                # Open application
                subprocess.Popen(app_path)
            return True, f"Opening {app_name}..."
        else:
            subprocess.Popen([app_path])
            return True, f"Opening {app_name}..."
    except Exception as e:
        return False, f"Error opening {app_name}: {str(e)}"

@app.route('/execute-command', methods=['POST'])
def handle_command():
    """Handle voice command execution"""
    try:
        data = request.json
        command_text = data.get('command', '').strip()
        
        if not command_text:
            return jsonify({'success': False, 'message': 'No command provided'}), 400
        
        app_name, app_path = extract_app_name(command_text)
        
        if not app_name or not app_path:
            return jsonify({
                'success': False, 
                'message': f"Unknown command: {command_text}. Allowed apps: {', '.join(ALLOWED_APPS.keys())}"
            }), 400
        
        success, message = execute_command(app_name, app_path)
        
        return jsonify({
            'success': success,
            'message': message,
            'app': app_name
        }), 200 if success else 400
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'service': 'SofAi System Commander'}), 200

@app.route('/allowed-apps', methods=['GET'])
def get_allowed_apps():
    """Get list of allowed apps"""
    return jsonify({'apps': list(ALLOWED_APPS.keys())}), 200

if __name__ == '__main__':
    print("🚀 SofAi System Commander starting on http://localhost:5000")
    print(f"✅ Allowed apps: {', '.join(ALLOWED_APPS.keys())}")
    print("Press Ctrl+C to stop")
    app.run(host='localhost', port=5000, debug=False)
