# SofAi Command Agent - Desktop Distribution Setup

## Overview

This setup converts SofAi's command system from a manual backend service into a **one-click installer** that:
- ✅ Installs a Windows desktop application
- ✅ Runs a WebSocket server on `ws://localhost:5001`
- ✅ Automatically starts on system boot
- ✅ Provides a command control page in the browser
- ✅ Never requires manual terminal commands

## Architecture

```
User Browser (http://localhost:3000)
         ↓
  CommandControl.jsx
         ↓
  WebSocket Client (ws://localhost:5001)
         ↓
  Electron App (SofAi Command Agent)
         ↓
  Python Backend (system_commander.py)
         ↓
  System Command Execution
```

## Build & Distribution Process

### Step 1: Build the Electron App

```bash
cd C:\Users\Cyril Sofdev\Desktop\SofAi\SofAI\sofai-command-agent

# Install dependencies
npm install

# Build for Windows (creates .exe)
npm run build:win
```

This generates:
- `dist/SofAiCommandAgent-1.0.0.exe` (portable)
- `dist/SofAiCommandAgent-Setup.exe` (installer with NSIS)

### Step 2: Create the Inno Setup Installer (Optional, for advanced branding)

```
1. Download Inno Setup from: https://jrsoftware.org/isdl.php
2. Open installer.iss in Inno Setup
3. Compile to create: SofAiCommandAgent-Setup.exe
```

### Step 3: Distribute to Users

**Users only need to:**
1. Download `SofAiCommandAgent-Setup.exe`
2. Run the installer
3. Check "Start at system startup" (optional)
4. Refresh http://localhost:3000

## Installation Verification

The `CommandControl.jsx` component will:
- ✅ Detect if the app is installed
- ✅ Show installation guide if not
- ✅ Provide download link
- ✅ Check WebSocket connection status
- ✅ Enable command mode when ready

## How It Works

### For Users:

1. **First Time:**
   - Visit http://localhost:3000
   - See "Agent Not Installed" message
   - Click download link
   - Run installer
   - Refresh page
   - Start using commands!

2. **Subsequent Times:**
   - SofAi Command Agent runs automatically
   - Browser connects to WebSocket
   - Send commands via voice or text

### For Developers:

**Frontend:**
- `CommandControl.jsx` - Agent detection & UI
- WebSocket client connects to `ws://localhost:5001`
- Sends: `{type: 'command', command: 'open chrome'}`
- Receives: `{success: true, message: '...', timestamp: '...'}`

**Backend:**
- Electron app (main.js) starts Python backend
- Python system_commander.py handles commands
- WebSocket server broadcasts responses
- All CORS-enabled for local browser

## Files Included

```
sofai-command-agent/
├── package.json           # Electron app config & build settings
├── src/
│   ├── main.js           # Electron entry point
│   ├── preload.js        # Security bridge
│   └── status.html       # Tray window UI
├── installer.iss         # Inno Setup script
└── README.md             # This file

frontend/
├── src/
│   ├── CommandControl.jsx    # Browser command page
│   └── CommandControl.css    # Styles
```

## Technical Details

### Electron Features
- **Tray icon** - minimize to system tray
- **Auto-start** - registered with Windows startup
- **WebSocket server** - real-time bidirectional communication
- **IPC communication** - secure electron ↔ renderer process
- **Python integration** - spawns backend process

### Installedner Behavior
- **Admin privileges** - required for service registration
- **System startup** - creates shortcut in %USERPROFILE%\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup
- **Uninstall cleanup** - removes startup shortcut & app

## Troubleshooting

### "Agent Not Installed" stays after download

**Solution:** Check if installation completed:
- Look for "SofAi Command Agent" in Start Menu
- Check system tray for the app icon

### Commands not working

**Check:** WebSocket connection status in CommandControl
- Should show "✓ Connected" in green
- If disconnected, restart the Electron app

### App won't start

**Solution:**
1. Ensure Python 3.8+ is installed
2. Check that port 5001 is not in use: `netstat -ano | findstr :5001`
3. Restart your computer

## Distribution

### For Public Release:
1. Sign the executable with a code certificate
2. Host on a CDN or website
3. Update download link in CommandControl.jsx
4. Add version checking for updates

### For Development:
```bash
# Run without building
npm run dev

# Build and package
npm run build:win

# Test installer
.\dist\SofAiCommandAgent-Setup.exe /S  # Silent install
```

## Security Considerations

✅ **What's Secure:**
- Local WebSocket only (no internet)
- Commands whitelisted (no arbitrary execution)
- IPC sandboxed between Electron processes
- User consent for all commands

⚠️ **Future Enhancements:**
- Add API token authentication
- Log all command execution
- Implement rate limiting
- Add command history

## Next Steps

1. **Build the installer:**
   ```bash
   npm run build:win
   ```

2. **Test locally:**
   - Run setup.exe
   - Visit http://localhost:3000/command-control
   - Test voice/text commands

3. **Distribute:**
   - Upload to cloud storage
   - Share download link with users
   - Monitor for support requests

4. **Monitor:**
   - Track installation errors
   - Collect usage telemetry
   - Plan updates

---

**SofAi Command Agent is ready for end-user distribution! 🚀**
