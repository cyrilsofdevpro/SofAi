# SofAi Installation Flow & Architecture

## 🎯 User Installation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    USER OPENS BROWSER                               │
│              http://localhost:3002                                   │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │  CommandControl Component Loads   │
         │  - Checks if agent installed      │
         │  - Shows install button           │
         └───────────────┬───────────────────┘
                         │
                         ▼
             ┌────────────────────────────────┐
             │   USER CLICKS INSTALL BUTTON   │
             └────────────┬───────────────────┘
                         │
                         ▼
    ┌──────────────────────────────────────────────────┐
    │  Browser sends POST /api/install-agent          │
    │  to http://localhost:5050                        │
    └──────────────────────┬───────────────────────────┘
                           │
                           ▼
      ┌────────────────────────────────────────┐
      │  Installation API receives request     │
      │  Starts background thread              │
      │  Returns: { status: 'started' }        │
      └────────────────┬───────────────────────┘
                       │
                       ▼
    ┌──────────────────────────────────────────────────┐
    │  Installation Worker Thread Starts:              │
    │                                                   │
    │  1. Create C:\Program Files\SofAi\CommandAgent   │
    │  2. Copy backend files                           │
    │  3. Install Python dependencies (Flask)          │
    │  4. Create Windows registry entry                │
    │  5. Create startup batch file                    │
    │  6. Launch the agent                             │
    │  7. Save config.json                             │
    └──────────────────┬───────────────────────────────┘
                       │
                       ▼
    ┌──────────────────────────────────────────────────┐
    │  Browser polls GET /api/install-status          │
    │  Every 1 second:                                 │
    │  - Progress: 0% → 100%                           │
    │  - Message updates (creating dirs, installing...) │
    │  - Progress bar fills up in UI                   │
    └────────────────────────────────────────────────┘
                       │
                       ▼
    ┌──────────────────────────────────────────────────┐
    │  Installation Complete                          │
    │  - status: 'completed'                           │
    │  - progress: 100%                                │
    │  - Agent is now running                          │
    └──────────────────┬───────────────────────────────┘
                       │
                       ▼
    ┌──────────────────────────────────────────────────┐
    │  Browser detects completion                      │
    │  - Rechecks agent status                         │
    │  - Shows "Agent Online" indicator                │
    │  - Enables voice command buttons                 │
    │  - User can now use voice commands!              │
    └──────────────────────────────────────────────────┘
```

## 🏗️ System Architecture

```
                    ┌─────────────────────────┐
                    │    USER'S BROWSER       │
                    │  (http://localhost:3002)│
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
            ┌──────────────────┐     ┌──────────────────┐
            │  React Frontend  │     │ React Components │
            │  (Vite Dev Serv.)│────▶│ - CommandControl │
            │  Port 3002       │     │ - Chat.jsx       │
            └──────────────────┘     └──────────────────┘
                    │
                    │ HTTP Requests
                    │
    ┌───────────────┴────────────────────────────────────┐
    │                                                     │
    ▼                                                     ▼
┌──────────────────────┐                    ┌──────────────────────────┐
│Installation API      │                    │ System Commander API     │
│(Flask)               │                    │ (Flask)                  │
│Port 5050             │                    │ Port 5000                │
│                      │                    │                          │
│Endpoints:            │                    │ Endpoints:               │
│- /check-agent        │                    │ - /execute-command       │
│- /install-agent      │                    │ - /health                │
│- /install-status     │◄─── Installed ────▶│                          │
│- /open-app           │    Agent            │                          │
│- /health             │    Starts it        │                          │
└──────────┬───────────┘                    └──────────────────────────┘
           │
           │ Starts background
           │ installation thread
           │
           ▼
    ┌──────────────────────────────┐
    │  Installation Worker Thread  │
    │                              │
    │  Creates directory           │
    │  Copies files                │
    │  Installs dependencies       │
    │  Updates registry            │
    │  Launches agent              │
    └──────────────────────────────┘
           │
           │ Completion
           │
           ▼
    ┌──────────────────────────────────────────┐
    │  Agent Running (After Installation)      │
    │                                           │
    │  - Main app (main.py)                    │
    │  - System command executor               │
    │  - WebSocket server (Port 5001)          │
    │  - System tray integration                │
    └────────────────────────────────────────┘
```

## 📊 File Flow During Installation

```
Installation API (Flask)
         │
         ├─► /api/check-agent
         │   └─► Checks: C:\Program Files\SofAi\CommandAgent\
         │
         ├─► /api/install-agent (POST)
         │   └─► Starts background thread
         │       │
         │       └─► Worker creates directory
         │           │
         │           ├─ C:\Program Files\SofAi\CommandAgent\
         │           │
         │           ├─ Copy backend files
         │           │  ├─ system_commander.py
         │           │  ├─ main.py
         │           │  └─ requirements.txt
         │           │
         │           ├─ Install dependencies
         │           │  └─ pip install -r requirements.txt
         │           │
         │           ├─ Create startup batch
         │           │  └─ %APPDATA%\...\Startup\SofAiCommandAgent.bat
         │           │
         │           ├─ Create config
         │           │  └─ %APPDATA%\SofAi\config.json
         │           │
         │           └─ Launch agent
         │              └─ subprocess.Popen(python main.py)
         │
         └─► /api/install-status (GET)
             └─► Returns current progress
                 ├─ status: 'installing'
                 ├─ progress: 45
                 ├─ message: 'Copying files...'
                 └─ log: [array of log messages]
```

## 🔄 Component Communication

```
┌─────────────────────────────────────┐
│   CommandControl.jsx (React)        │
│                                     │
│  State:                             │
│  - installed (boolean)              │
│  - installing (boolean)             │
│  - installProgress (0-100)          │
│  - installMessage (string)          │
│  - agentStatus (online/offline)     │
└──────────┬──────────────────────────┘
           │
           │ handleInstall()
           │ onClick of button
           │
           ▼
    setInstalling(true)
           │
           ▼
    fetch POST /api/install-agent
           │
           ├─► success: start monitoring
           │
           ▼
    useEffect(interval every 1s)
           │
           ├─► fetch GET /api/install-status
           │
           ├─► setInstallProgress(data.progress)
           │
           ├─► setInstallMessage(data.message)
           │
           └─► if completed → checkAgentStatus()
                              → connectWebSocket()
```

## 🎨 UI State Machine

```
┌─────────────────┐
│  STARTUP STATE  │
│  agentStatus:   │
│  'checking'     │
└────────┬────────┘
         │
         ├─ Agent NOT installed
         │
         ▼
    ┌────────────────────────────┐
    │   INSTALL SCREEN           │
    │   - Large install button   │
    │   - Features list          │
    │   - Progress hidden        │
    └─────────┬──────────────────┘
              │
              └─ User clicks button
                 │
                 ▼
         ┌──────────────────────────┐
         │  INSTALLING SCREEN       │
         │  - Button disabled       │
         │  - Progress bar visible  │
         │  - Status messages       │
         │  - Percent display       │
         └────────────┬─────────────┘
                      │
                      └─ Installation completes
                         │
                         ▼
         ┌──────────────────────────────┐
         │  COMMAND SCREEN (SUCCESS)    │
         │  - Connection status         │
         │  - Voice button (enabled)    │
         │  - Quick commands            │
         │  - Last command display      │
         └──────────────────────────────┘
```

## 📋 Installation Checklist

```
Installation Process Steps:

□ Create installation directory
  └─ C:\Program Files\SofAi\CommandAgent\
  
□ Copy backend files
  ├─ system_commander.py
  ├─ main.py
  └─ requirements.txt
  
□ Install Python dependencies
  └─ pip install flask flask-cors
  
□ Create Windows startup batch
  └─ %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\
     SofAiCommandAgent.bat
  
□ Create configuration
  └─ %APPDATA%\SofAi\config.json
     {
       "install_path": "C:\\Program Files\\SofAi\\CommandAgent",
       "installed": true,
       "version": "1.0.0"
     }
  
□ Launch agent process
  └─ python C:\Program Files\SofAi\CommandAgent\backend\main.py
  
□ Verify installation
  └─ Check config.json exists
  └─ Check agent is running
```

## 🔐 Security Flow

```
Browser Request
    │
    ├─ Only accepts localhost (127.0.0.1)
    │
    ├─ CORS enabled for local access only
    │
    ├─ Installation directory writable check
    │
    ├─ System commands whitelisted
    │  (nodepad, chrome, firefox, etc.)
    │
    └─ User data isolated in AppData
```

---

**Visual Guide Created:** Shows complete flow from user click to working agent!
