# SofAi Command Agent - Quick Start Guide

## What You're Getting

A **one-click browser-based installation** for the SofAi Command Agent that enables:
- ✅ Voice command support ("open notepad", "open chrome", etc.)
- ✅ Text commands
- ✅ System app launching
- ✅ Automatic startup with Windows
- ✅ System tray integration

## Installation Flow

```
User clicks "Install" button in browser
         ↓
Installation API starts (Flask on port 5050)
         ↓
Installation worker thread begins:
  • Creates C:\Program Files\SofAi\CommandAgent\
  • Copies backend files
  • Installs Python dependencies
  • Sets up Windows autostart
  • Launches the agent
         ↓
Progress bar updates: 0% → 100%
         ↓
Agent is running and ready to use!
```

## Quick Setup (2 Steps)

### Step 1: Start Both Services

Run this script in Windows Explorer:
```
C:\Users\Cyril Sofdev\Desktop\SofAi\SofAI\setup.bat
```

This automatically:
- Starts the Installation API (backend, port 5050)
- Starts the Frontend dev server (port 3002)
- Opens two Command windows - **keep both running**

### Step 2: Open Browser and Install

1. Open browser to: **http://localhost:3002**
2. Look for the "⬇️ Install SofAi Command Agent" button
3. Click it
4. Watch the progress bar (0% to 100%)
5. Installation complete!

## What Gets Created

After installation, you'll have:

**Installation Directory:**
```
C:\Program Files\SofAi\CommandAgent\
├── backend/
│   ├── system_commander.py
│   ├── main.py
│   └── requirements.txt
└── config.json
```

**User Configuration:**
- `%APPDATA%\SofAi\config.json` - Installation config
- Windows Startup folder shortcut for autostart

## Using the Agent

Once installed, the agent:

1. **Starts automatically** with Windows
2. **Runs in system tray** (accessible from tray icons)
3. **Accepts voice commands** via the browser interface
4. **Responds to voice commands** like:
   - "open notepad"
   - "open calculator"
   - "open chrome"
   - "open vs code"
   - "open firefox"
   - etc.

## File Structure

```
SofAI/
├── backend/
│   ├── installation_api.py          ← Installation API
│   ├── system_commander.py          ← System command executor
│   ├── main.py                      ← Backend entry point
│   ├── requirements.txt
│   └── start_installation_api.bat   ← Starts API
│
├── frontend/
│   ├── src/
│   │   ├── CommandControl.jsx       ← Install button UI
│   │   ├── CommandControl.css       ← Styling
│   │   └── Chat.jsx                 ← Main chat interface
│   └── package.json
│
├── setup.bat                         ← Run this to start everything!
└── INSTALLATION_GUIDE.md             ← Detailed guide

```

## Troubleshooting

### "Installation API not available" Error
- Make sure both windows from `setup.bat` are running
- Check that port 5050 is accessible
- If port in use: `netstat -ano | findstr :5050`

### Installation Stuck at X%
- Check the command window running the API
- Look for error messages
- Restart by closing both windows and running setup.bat again

### Agent Won't Start
- Ensure Python is installed: `python --version`
- Check C:\Program Files\ is writable
- Run as Administrator if needed

### Voice Commands Not Working
- Browser needs permission to use microphone
- Grant permission when browser asks
- Check browser console for errors (F12)
- Make sure agent is "Online" (green indicator)

## Port Requirements

The system uses these ports:
- **3002** - Frontend development server (browser access)
- **5000** - System command executor (after agent starts)
- **5001** - WebSocket for agent communication
- **5050** - Installation API

Make sure these ports are available (not used by other apps).

## Next Steps

1. ✅ Run `setup.bat`
2. ✅ Click the install button in browser
3. ✅ Agent starts automatically
4. ✅ Use voice commands!

Enjoy your new voice-controlled assistant! 🎉

---

**For detailed technical information, see INSTALLATION_GUIDE.md**
