"""
SofAi Installation API - Handles agent installation from frontend
"""

from flask import Flask, jsonify, request
import subprocess
import json
from pathlib import Path
import threading
import sys

app = Flask(__name__)

INSTALL_STATUS = {
    'status': 'idle',  # idle, installing, completed, error
    'progress': 0,
    'message': '',
    'log': []
}

@app.route('/api/install-status', methods=['GET'])
def get_install_status():
    """Get installation status"""
    return jsonify(INSTALL_STATUS)

@app.route('/api/check-agent', methods=['GET'])
def check_agent():
    """Check if agent is installed"""
    config_path = Path.home() / 'AppData' / 'Roaming' / 'SofAi' / 'config.json'
    installed = config_path.exists()
    
    return jsonify({
        'installed': installed,
        'path': str(config_path.parent) if installed else None
    })

@app.route('/api/install-agent', methods=['POST'])
def install_agent():
    """Start agent installation"""
    
    if INSTALL_STATUS['status'] == 'installing':
        return jsonify({'error': 'Installation already in progress'}), 400
    
    def run_installation():
        INSTALL_STATUS['status'] = 'installing'
        INSTALL_STATUS['progress'] = 0
        INSTALL_STATUS['message'] = 'Starting installation...'
        
        try:
            # Get the installer script path
            installer_script = Path(__file__).parent / 'install_agent.py'
            
            # Run installer with admin privileges
            process = subprocess.Popen(
                [sys.executable, str(installer_script)],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            # Read output
            for line in process.stdout:
                line = line.strip()
                if line:
                    INSTALL_STATUS['log'].append(line)
                    INSTALL_STATUS['progress'] = min(100, INSTALL_STATUS['progress'] + 10)
                    INSTALL_STATUS['message'] = line
            
            returncode = process.wait()
            
            if returncode == 0:
                INSTALL_STATUS['status'] = 'completed'
                INSTALL_STATUS['progress'] = 100
                INSTALL_STATUS['message'] = 'Installation completed successfully!'
            else:
                INSTALL_STATUS['status'] = 'error'
                INSTALL_STATUS['message'] = 'Installation failed'
                
        except Exception as e:
            INSTALL_STATUS['status'] = 'error'
            INSTALL_STATUS['message'] = f'Error: {str(e)}'
    
    # Run installation in background thread
    thread = threading.Thread(target=run_installation)
    thread.daemon = True
    thread.start()
    
    return jsonify({
        'status': 'started',
        'message': 'Installation process started'
    })

@app.route('/api/open-app', methods=['POST'])
def open_app():
    """Open SofAi Command Agent app"""
    try:
        app_path = Path.home() / 'AppData' / 'Roaming' / 'SofAi' / 'service_launcher.py'
        if app_path.exists():
            subprocess.Popen([sys.executable, str(app_path)])
            return jsonify({'success': True, 'message': 'App opened'})
        else:
            return jsonify({'success': False, 'error': 'App not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='localhost', port=5050, debug=False)
