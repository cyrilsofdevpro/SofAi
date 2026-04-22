"""
SofAi Command Agent
HTTP Server for voice/text commands with system integration
"""

import json
import logging
import subprocess
import sys
import os
from pathlib import Path
from datetime import datetime

try:
    from flask import Flask, request, jsonify
    from flask_cors import CORS
except ImportError:
    print("Installing Flask...")
    subprocess.run([sys.executable, '-m', 'pip', 'install', 'flask', 'flask-cors'], check=True)
    from flask import Flask, request, jsonify
    from flask_cors import CORS

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Command processing
class CommandProcessor:
    """Process and execute system commands"""
    
    COMMAND_MAP = {
        'open notepad': 'notepad.exe',
        'open calc': 'calc.exe',
        'open calculator': 'calc.exe',
        'open chrome': 'chrome.exe',
        'open edge': 'msedge.exe',
        'open firefox': 'firefox.exe',
        'open vs code': 'code.exe',
        'open vscode': 'code.exe',
        'open excel': 'excel.exe',
        'open word': 'winword.exe',
        'open powerpoint': 'powerpnt.exe',
        'open explorer': 'explorer.exe',
        'open file explorer': 'explorer.exe',
    }
    
    @staticmethod
    def process_command(command: str) -> dict:
        """
        Process command and return result
        
        Args:
            command: Command string from user
            
        Returns:
            dict with 'success', 'message', and 'timestamp'
        """
        try:
            command_lower = command.lower().strip()
            
            logger.info(f"Processing command: {command}")
            
            # Check for exact matches first
            if command_lower in CommandProcessor.COMMAND_MAP:
                app = CommandProcessor.COMMAND_MAP[command_lower]
                subprocess.Popen(app)
                return {
                    'success': True,
                    'message': f'✓ Opened {app}',
                    'timestamp': datetime.now().isoformat()
                }
            
            # Check for "open [app]" pattern
            if command_lower.startswith('open '):
                app_name = command_lower.replace('open ', '').strip()
                # Try to execute directly
                try:
                    subprocess.Popen(app_name)
                    return {
                        'success': True,
                        'message': f'✓ Opened {app_name}',
                        'timestamp': datetime.now().isoformat()
                    }
                except FileNotFoundError:
                    return {
                        'success': False,
                        'message': f'✗ Could not find application: {app_name}',
                        'timestamp': datetime.now().isoformat()
                    }
            
            # Check for system commands
            if command_lower in ['shutdown', 'restart', 'lock', 'sleep']:
                return CommandProcessor.execute_system_command(command_lower)
            
            # Unknown command
            return {
                'success': False,
                'message': f'⚠️ Unknown command: {command}. Try "open [app name]"',
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error processing command: {e}")
            return {
                'success': False,
                'message': f'✗ Error: {str(e)}',
                'timestamp': datetime.now().isoformat()
            }
    
    @staticmethod
    def execute_system_command(cmd: str) -> dict:
        """Execute system commands like shutdown, restart, etc."""
        try:
            if cmd == 'shutdown':
                os.system('shutdown /s /t 10')
                return {'success': True, 'message': '⏹️ Shutting down in 10 seconds...', 'timestamp': datetime.now().isoformat()}
            elif cmd == 'restart':
                os.system('shutdown /r /t 10')
                return {'success': True, 'message': '🔄 Restarting in 10 seconds...', 'timestamp': datetime.now().isoformat()}
            elif cmd == 'lock':
                os.system('rundll32.exe user32.dll,LockWorkStation')
                return {'success': True, 'message': '🔒 Computer locked', 'timestamp': datetime.now().isoformat()}
            elif cmd == 'sleep':
                os.system('rundll32.exe PowrProf.dll,SetSuspendState 0,1,0')
                return {'success': True, 'message': '😴 Going to sleep...', 'timestamp': datetime.now().isoformat()}
        except Exception as e:
            logger.error(f"System command error: {e}")
            return {'success': False, 'message': f'✗ Error: {str(e)}', 'timestamp': datetime.now().isoformat()}


# Create Flask app
app = Flask(__name__)
CORS(app)

# Store for command history
commands_history = []
MAX_HISTORY = 100


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'agent': 'Command Agent v1.0'})


@app.route('/api/command', methods=['POST'])
def execute_command():
    """Execute a command"""
    try:
        data = request.json or {}
        command = data.get('command', '').strip()
        
        if not command:
            return jsonify({'success': False, 'message': 'Empty command'}), 400
        
        result = CommandProcessor.process_command(command)
        
        # Store in history
        commands_history.append(result)
        if len(commands_history) > MAX_HISTORY:
            commands_history.pop(0)
        
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error executing command: {e}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@app.route('/api/history', methods=['GET'])
def get_history():
    """Get command history"""
    return jsonify({'history': commands_history})


@app.route('/ping', methods=['GET'])
def ping():
    """Ping endpoint for connectivity check"""
    return jsonify({'status': 'pong', 'timestamp': datetime.now().isoformat()})


def main():
    """Main entry point"""
    host = os.getenv('AGENT_HOST', '0.0.0.0')  # Listen on all interfaces
    port = int(os.getenv('AGENT_PORT', '5001'))
    
    logger.info(f"🚀 Command Agent starting on http://{host}:{port}")
    logger.info("Ready for commands...")
    
    try:
        app.run(host=host, port=port, debug=False, threaded=True, use_reloader=False)
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()
