"""
Installation API for SofAi Command Agent
Provides endpoints for browser-based one-click installation
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import threading
import subprocess
import os
import json
import logging
from pathlib import Path
import shutil
import sys

app = Flask(__name__)
CORS(app)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global installation status
INSTALL_STATUS = {
    'status': 'idle',  # idle, installing, completed, error
    'progress': 0,
    'message': 'Ready to install',
    'log': []
}

INSTALL_LOCK = threading.Lock()

# Installation paths
INSTALL_ROOT = Path.home() / "AppData" / "Local" / "SofAi" / "CommandAgent"
BACKEND_DIR = Path(__file__).parent
FRONTEND_DIR = BACKEND_DIR.parent / "frontend"


def log_install(message):
    """Log installation message"""
    logger.info(message)
    INSTALL_STATUS['log'].append(message)
    if len(INSTALL_STATUS['log']) > 100:
        INSTALL_STATUS['log'] = INSTALL_STATUS['log'][-100:]


def update_status(status, progress, message):
    """Update installation status"""
    with INSTALL_LOCK:
        INSTALL_STATUS['status'] = status
        INSTALL_STATUS['progress'] = progress
        INSTALL_STATUS['message'] = message
    log_install(f"[{status.upper()}] {progress}% - {message}")


def install_agent_worker():
    """Worker thread for installation"""
    try:
        update_status('installing', 5, 'Creating installation directory...')
        
        # Create installation directory
        INSTALL_ROOT.mkdir(parents=True, exist_ok=True)
        update_status('installing', 15, 'Directory created')
        
        # Copy backend files
        update_status('installing', 25, 'Copying backend files...')
        backend_dest = INSTALL_ROOT / 'backend'
        if backend_dest.exists():
            shutil.rmtree(backend_dest)
        
        # Copy only necessary backend files
        files_to_copy = [
            'command_agent.py',
            'requirements.txt'
        ]
        
        backend_dest.mkdir(exist_ok=True)
        for file in files_to_copy:
            src = BACKEND_DIR / file
            if src.exists():
                shutil.copy2(src, backend_dest / file)
        
        update_status('installing', 45, 'Backend files copied')
        
        # Install Python dependencies
        update_status('installing', 55, 'Installing dependencies...')
        requirements_file = backend_dest / 'requirements.txt'
        if requirements_file.exists():
            try:
                subprocess.run(
                    [sys.executable, '-m', 'pip', 'install', '-r', str(requirements_file)],
                    capture_output=True,
                    timeout=60
                )
                update_status('installing', 70, 'Dependencies installed')
            except Exception as e:
                log_install(f"Warning: Could not install requirements: {e}")
        
        # Create Windows startup batch file
        update_status('installing', 75, 'Setting up autostart...')
        startup_dir = Path.home() / 'AppData/Roaming/Microsoft/Windows/Start Menu/Programs/Startup'
        startup_batch = startup_dir / 'SofAiCommandAgent.bat'
        
        batch_content = f'''@echo off
cd /d "{INSTALL_ROOT.as_posix()}"
python "{(INSTALL_ROOT / 'backend' / 'command_agent.py').as_posix()}" > nul 2>&1
exit /b 0
'''
        
        with open(startup_batch, 'w') as f:
            f.write(batch_content)
        
        update_status('installing', 85, 'Autostart configured')
        
        # Create configuration file
        update_status('installing', 90, 'Finalizing installation...')
        config = {
            'install_path': str(INSTALL_ROOT),
            'installed': True,
            'version': '1.0.0'
        }
        
        config_dir = Path.home() / 'AppData/Roaming/SofAi'
        config_dir.mkdir(exist_ok=True)
        config_file = config_dir / 'config.json'
        
        with open(config_file, 'w') as f:
            json.dump(config, f, indent=2)
        
        update_status('installing', 95, 'Almost done...')
        
        # Try to launch the agent
        try:
            if (INSTALL_ROOT / 'backend' / 'command_agent.py').exists():
                subprocess.Popen(
                    [sys.executable, str(INSTALL_ROOT / 'backend' / 'command_agent.py')],
                    cwd=str(INSTALL_ROOT),
                    creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == 'win32' else 0
                )
        except Exception as e:
            log_install(f"Note: Could not auto-launch agent: {e}")
        
        update_status('completed', 100, 'Installation complete! Agent is ready.')
        log_install("✓ Installation successful")
        
    except Exception as e:
        update_status('error', 0, f'Installation failed: {str(e)}')
        log_install(f"✗ Installation error: {str(e)}")
        import traceback
        log_install(traceback.format_exc())


@app.route('/api/check-agent', methods=['GET'])
def check_agent():
    """Check if agent is installed"""
    config_file = Path.home() / 'AppData/Roaming/SofAi/config.json'
    
    if config_file.exists():
        try:
            with open(config_file, 'r') as f:
                config = json.load(f)
            return jsonify({
                'installed': config.get('installed', False),
                'path': config.get('install_path', str(INSTALL_ROOT)),
                'version': config.get('version', 'unknown')
            })
        except:
            pass
    
    return jsonify({
        'installed': False,
        'path': str(INSTALL_ROOT),
        'version': None
    })


@app.route('/api/install-agent', methods=['POST'])
def install_agent():
    """Trigger agent installation"""
    with INSTALL_LOCK:
        if INSTALL_STATUS['status'] == 'installing':
            return jsonify({'error': 'Installation already in progress'}), 409
    
    # Start installation in background thread
    update_status('installing', 0, 'Starting installation...')
    thread = threading.Thread(target=install_agent_worker, daemon=True)
    thread.start()
    
    return jsonify({
        'status': 'started',
        'message': 'Installation started in background'
    })


@app.route('/api/install-status', methods=['GET'])
def install_status():
    """Get current installation status"""
    with INSTALL_LOCK:
        return jsonify({
            'status': INSTALL_STATUS['status'],
            'progress': INSTALL_STATUS['progress'],
            'message': INSTALL_STATUS['message'],
            'log': INSTALL_STATUS['log'][-20:]  # Last 20 log entries
        })


@app.route('/api/open-app', methods=['POST'])
def open_app():
    """Open the installed SofAi Command Agent"""
    try:
        agent_file = INSTALL_ROOT / 'backend' / 'command_agent.py'
        if agent_file.exists():
            subprocess.Popen(
                [sys.executable, str(agent_file)],
                cwd=str(INSTALL_ROOT),
                creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == 'win32' else 0
            )
            return jsonify({'status': 'opened'})
        else:
            return jsonify({'error': 'Agent not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    logger.info("Starting Installation API on port 5050...")
    app.run(host='127.0.0.1', port=5050, debug=False)
