"""
SofAi Agent Installer - One-click installation script
Downloads and installs SofAi Command Agent as a Windows service
"""

import os
import sys
import subprocess
import json
import shutil
import requests
from pathlib import Path
import winreg
import ctypes

class SofAiInstaller:
    def __init__(self):
        self.install_path = Path(os.environ['PROGRAMFILES']) / 'SofAi' / 'CommandAgent'
        self.data_path = Path(os.environ['APPDATA']) / 'SofAi'
        self.service_name = 'SofAiCommandAgent'
        
    def is_admin(self):
        """Check if running as administrator"""
        try:
            return ctypes.windll.shell.IsUserAnAdmin()
        except:
            return False
    
    def run_as_admin(self):
        """Re-run script as administrator"""
        if not self.is_admin():
            ctypes.windll.shell.ShellExecuteEx(
                lpVerb='runas',
                lpFile=sys.executable,
                lpParameters=' '.join(sys.argv),
                nShow=1
            )
            sys.exit()
    
    def log(self, message):
        """Log installation progress"""
        print(f"[SofAi Installer] {message}")
        with open(self.data_path / 'install.log', 'a') as f:
            f.write(f"{message}\n")
    
    def create_directories(self):
        """Create necessary directories"""
        self.log(f"Creating directories at {self.install_path}")
        self.install_path.mkdir(parents=True, exist_ok=True)
        self.data_path.mkdir(parents=True, exist_ok=True)
    
    def download_backend(self):
        """Download backend files"""
        self.log("Downloading SofAi backend files...")
        
        # Copy local system_commander.py to install path
        backend_file = Path(__file__).parent / 'system_commander.py'
        if backend_file.exists():
            shutil.copy2(backend_file, self.install_path / 'system_commander.py')
            self.log("Backend files ready")
        else:
            self.log("Warning: system_commander.py not found, will use default")
    
    def install_python_deps(self):
        """Install Python dependencies"""
        self.log("Installing Python dependencies...")
        try:
            subprocess.run([sys.executable, '-m', 'pip', 'install', 'flask', '-q'], check=True)
            self.log("Dependencies installed")
        except subprocess.CalledProcessError as e:
            self.log(f"Error installing dependencies: {e}")
    
    def create_windows_service(self):
        """Create Windows service entry"""
        self.log("Setting up Windows service...")
        
        # Create service launcher script
        launcher = self.install_path / 'service_launcher.py'
        launcher.write_text(f'''
import subprocess
import sys
from pathlib import Path

# Run system_commander.py
backend = Path(__file__).parent / 'system_commander.py'
subprocess.run([sys.executable, str(backend)], check=False)
''')
        
        # Register in Windows Registry for auto-start
        try:
            reg_path = r'Software\\Microsoft\\Windows\\CurrentVersion\\Run'
            reg_key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, reg_path, 0, winreg.KEY_WRITE)
            
            startup_cmd = f'"{sys.executable}" "{self.install_path / "service_launcher.py"}"'
            winreg.SetValueEx(reg_key, self.service_name, 0, winreg.REG_SZ, startup_cmd)
            winreg.CloseKey(reg_key)
            
            self.log("Windows startup registry updated")
        except Exception as e:
            self.log(f"Error setting up service: {e}")
    
    def create_shortcuts(self):
        """Create desktop and Start Menu shortcuts"""
        self.log("Creating shortcuts...")
        
        # Desktop shortcut
        desktop = Path.home() / 'Desktop'
        app_launcher = self.install_path / 'run.bat'
        app_launcher.write_text(f'@echo off\ncd /d "{self.install_path}"\npython system_commander.py')
        
        # Create shortcut using PowerShell (Windows)
        ps_cmd = f'''
$shell = New-Object -ComObject WScript.Shell
$desktop = [System.Environment]::GetFolderPath('Desktop')
$link = $shell.CreateShortcut("$desktop\\SofAi Command Agent.lnk")
$link.TargetPath = '{app_launcher}'
$link.WorkingDirectory = '{self.install_path}'
$link.Description = 'SofAi Command Agent'
$link.Save()
'''
        try:
            subprocess.run(['powershell', '-Command', ps_cmd], check=True, capture_output=True)
            self.log("Desktop shortcut created")
        except Exception as e:
            self.log(f"Warning: Could not create shortcut: {e}")
    
    def start_service(self):
        """Start the service"""
        self.log("Starting SofAi Command Agent...")
        
        try:
            launcher = self.install_path / 'service_launcher.py'
            # Start in background
            subprocess.Popen(
                [sys.executable, str(launcher)],
                cwd=str(self.install_path),
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
            self.log("Service started successfully")
            return True
        except Exception as e:
            self.log(f"Error starting service: {e}")
            return False
    
    def save_config(self):
        """Save installation config"""
        config = {
            'installed': True,
            'version': '1.0.0',
            'install_path': str(self.install_path),
            'install_date': str(Path.ctime(self.install_path))
        }
        config_file = self.data_path / 'config.json'
        with open(config_file, 'w') as f:
            json.dump(config, f, indent=2)
        self.log("Configuration saved")
    
    def install(self):
        """Run full installation"""
        self.log("=== SofAi Command Agent Installation Started ===")
        
        if not self.is_admin():
            self.log("Requesting administrator privileges...")
            self.run_as_admin()
            return
        
        try:
            self.create_directories()
            self.download_backend()
            self.install_python_deps()
            self.create_windows_service()
            self.create_shortcuts()
            self.save_config()
            success = self.start_service()
            
            if success:
                self.log("=== Installation Completed Successfully ===")
                print("\n✅ SofAi Command Agent installed successfully!")
                print("🚀 The service is now running in the background")
                print("🌐 Open http://localhost:3000 in your browser")
                return True
            else:
                self.log("=== Installation Completed with Errors ===")
                return False
        except Exception as e:
            self.log(f"Fatal error: {e}")
            return False

def main():
    installer = SofAiInstaller()
    success = installer.install()
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
