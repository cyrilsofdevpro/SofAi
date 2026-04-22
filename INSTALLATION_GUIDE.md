# SofAi Command Agent - One-Click Installation Guide

## Overview
SofAi Command Agent is a desktop application that enables voice and text command execution on Windows. Users can install it with a single click from the browser UI.

## Installation Process Flow

### User Experience
1. User navigates to `http://localhost:3002` in browser
2. User clicks the "Install SofAi Command Agent" button
3. Browser makes API call to installation service
4. Progress bar shows installation status
5. Once complete, user can start using voice commands

### Technical Architecture

```
Browser (React)
    ↓
Installation API (Flask on port 5050)
    ↓
Installation Worker Thread
    ├─ Create directories (C:\Program Files\SofAi\CommandAgent)
    ├─ Copy backend files
    ├─ Install Python dependencies
    ├─ Setup Windows autostart
    ├─ Create desktop shortcut
    └─ Launch agent
    ↓
SofAi Command Agent (Running)
    ├─ Python backend on port 5000
    ├─ WebSocket server on port 5001
    └─ System tray integration
```

## Setup Instructions

### 1. Start the Installation API

Open Command Prompt and run:
```bash
cd C:\Users\Cyril Sofdev\Desktop\SofAi\SofAI\backend
start_installation_api.bat
```

Or manually:
```bash
python installation_api.py
```

The API will start on `http://localhost:5050`

### 2. Start the Frontend

In another terminal:
```bash
cd C:\Users\Cyril Sofdev\Desktop\SofAi\SofAI\frontend
npm run dev
```

The frontend will be available at `http://localhost:3002`

### 3. Test Installation Button

1. Open browser to `http://localhost:3002`
2. Look for the "Install SofAi Command Agent" button
3. Click it to start installation
4. Watch the progress bar update
5. Once complete, the agent will automatically launch

## API Endpoints

### GET `/api/check-agent`
Checks if the agent is already installed.

**Response:**
```json
{
  "installed": true,
  "path": "C:\\Program Files\\SofAi\\CommandAgent",
  "version": "1.0.0"
}
```

### POST `/api/install-agent`
Triggers installation in the background.

**Response:**
```json
{
  "status": "started",
  "message": "Installation started in background"
}
```

### GET `/api/install-status`
Gets current installation progress.

**Response:**
```json
{
  "status": "installing",
  "progress": 45,
  "message": "Copying backend files...",
  "log": [
    "Creating installation directory...",
    "Directory created",
    ...
  ]
}
```

### POST `/api/open-app`
Opens the installed SofAi application.

**Response:**
```json
{
  "status": "opened"
}
```

## Installation Directory Structure

After installation, the following directory is created:

```
C:\Program Files\SofAi\CommandAgent\
├── backend/
│   ├── system_commander.py
│   ├── main.py
│   └── requirements.txt
├── config.json
└── install.log
```

Additionally:
- Startup batch: `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\SofAiCommandAgent.bat`
- Config: `%APPDATA%\SofAi\config.json`

## Troubleshooting

### Installation API Not Starting
- Check if port 5050 is already in use: `netstat -ano | findstr :5050`
- Ensure Python is in PATH: `python --version`
- Install Flask: `pip install flask flask-cors`

### Installation Fails
- Check Windows User Account Control (UAC) - may need admin privileges
- Ensure C:\Program Files\ is writable
- Check installation logs in `%APPDATA%\SofAi\`

### Agent Not Starting After Installation
- Check if Python process is running: `tasklist | findstr python`
- Check for errors in the Windows Event Viewer
- Try running manually: `python C:\Program Files\SofAi\CommandAgent\backend\main.py`

## File Locations

| Component | Location |
|-----------|----------|
| Installation API | `backend/installation_api.py` |
| Backend System Commander | `backend/system_commander.py` |
| Frontend Components | `frontend/src/CommandControl.jsx` |
| Styling | `frontend/src/CommandControl.css` |
| Launcher Batch | `backend/start_installation_api.bat` |

## Environment Variables

The installation API respects these environment variables:
- `SOFAI_INSTALL_PATH`: Override default installation path (default: `C:\Program Files\SofAi\CommandAgent`)
- `SOFAI_DEBUG`: Enable debug logging (set to `1` to enable)

## Security Notes

- Installation requires write access to `C:\Program Files\`
- Batch file is created in Startup folder for autostart
- Configuration is stored in user's AppData directory
- Python dependencies are installed from PyPI

## Next Steps After Installation

After successful installation:
1. User can close the browser
2. Agent runs in system tray
3. Open browser to `http://localhost:3002` again
4. CommandControl component will show agent as "Online"
5. Use voice commands: "🎤 Voice Command" button
6. Quick command buttons: "open notepad", "open calculator", etc.
