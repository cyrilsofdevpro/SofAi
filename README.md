# SofAi - AI-Powered Voice Command Assistant

A modern, full-featured AI chatbot with voice commands, system automation, educational content, and trading analysis - all with a sleek browser interface and one-click Windows installation.

## 🌟 Features

### Core Chat Features
- ✅ **Smart Conversations** - Multi-turn chat with memory persistence
- ✅ **Voice Input/Output** - Web Speech API for natural interaction
- ✅ **Markdown Rendering** - Beautiful formatted responses
- ✅ **Dark/Light Mode** - Eye-friendly themes
- ✅ **Message Actions** - Copy, like, delete, regenerate
- ✅ **Login System** - Per-user conversation history

### Advanced Features
- 🎤 **Voice Commands** - Control your PC with speech
- 📚 **Africa Education** - WAEC/NECO/JAMB exam prep
- 📊 **Trading & Finance** - Market analysis and risk management
- 🎯 **AI Tutor** - Multiple learning difficulty levels
- 🏠 **System Automation** - Launch apps with voice commands

### Desktop Integration
- 💻 **One-Click Installation** - Install directly from browser
- 🚀 **Auto-Start** - Runs automatically with Windows
- 🎯 **System Tray** - Runs in background
- 🔊 **WebSocket Communication** - Real-time command execution

## 🚀 Quick Start

### Prerequisites
- Windows 10/11
- Python 3.8+
- Node.js 14+
- Modern web browser (Chrome, Firefox, Edge)

### Installation

#### Option 1: Automated Setup (Recommended)
```bash
# Navigate to project directory
cd C:\Users\Cyril Sofdev\Desktop\SofAi\SofAI

# Run the setup script (starts everything automatically)
setup.bat
```

Then open your browser to: **http://localhost:3002**

#### Option 2: Manual Setup
```bash
# Terminal 1: Start Installation API
cd backend
start_installation_api.bat

# Terminal 2: Start Frontend
cd frontend
npm install
npm run dev
```

Then open your browser to: **http://localhost:3002**

### First Use
1. Click the **"⬇️ Install SofAi Command Agent"** button
2. Watch the progress bar (0% to 100%)
3. Installation complete! Start chatting

## 📁 Project Structure

```
SofAI/
├── backend/
│   ├── installation_api.py           # Installation API server
│   ├── system_commander.py           # System command executor
│   ├── main.py                       # Backend entry point
│   ├── requirements.txt
│   ├── start_installation_api.bat    # API launcher
│   └── storage.py                    # Data persistence
│
├── frontend/
│   ├── src/
│   │   ├── Chat.jsx                  # Main chat interface
│   │   ├── Chat.css                  # Chat styling
│   │   ├── CommandControl.jsx        # Installation UI
│   │   ├── CommandControl.css        # Installation styling
│   │   ├── api.js                    # API communication
│   │   └── App.jsx                   # App root
│   ├── package.json
│   └── vite.config.js
│
├── notebooks/                         # Jupyter notebooks
├── data/                              # Training data
├── models/                            # Model files
├── scripts/                           # Training scripts
│
├── setup.bat                          # Main setup script
├── test_installation.html             # Installation tester
├── QUICK_START.md                     # Quick start guide
├── INSTALLATION_GUIDE.md              # Detailed guide
└── README.md                          # This file
```

## 🔧 Technology Stack

### Frontend
- **React 18.2.0** - UI framework
- **Vite 4.5.14** - Build tool
- **React Markdown** - Markdown rendering
- **Web Speech API** - Voice recognition

### Backend
- **Python 3.8+** - Runtime
- **Flask** - Web framework
- **Flask-CORS** - Cross-origin support
- **WebSocket** - Real-time communication

### AI/ML (Optional)
- **Transformers** - LLM models
- **Torch** - Deep learning
- **PEFT** - Fine-tuning

## 📖 API Endpoints

### Installation API (Port 5050)

#### Check Agent Status
```
GET /api/check-agent
Response: { installed: bool, path: str, version: str }
```

#### Start Installation
```
POST /api/install-agent
Response: { status: string, message: string }
```

#### Get Installation Progress
```
GET /api/install-status
Response: { status, progress, message, log }
```

#### Open Installed App
```
POST /api/open-app
Response: { status: string }
```

### System Command API (Port 5000)

#### Execute System Command
```
POST /execute-command
Body: { command: string }
Response: { success: bool, output: string }
```

## 🎮 Usage Examples

### Voice Commands
Once installed, you can use voice commands like:
- "open notepad"
- "open calculator"
- "open chrome"
- "open vs code"
- And many more...

### Chat Features
- **Login** - Create account to save conversations
- **Dark Mode** - Toggle with 🌙 button
- **Message Actions** - Copy, like, delete, regenerate
- **Voice Input** - Click 🎤 button to speak
- **Sidebar Navigation** - Switch between chat types

## 🛠️ Development

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

Access at http://localhost:5173 (HMR enabled)

### Backend Development
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### Running Installation API
```bash
cd backend
python installation_api.py
```

## 🐛 Troubleshooting

### Installation Issues
- **"Installation API not available"**: Ensure `start_installation_api.bat` is running
- **Port 5050 in use**: `netstat -ano | findstr :5050`
- **Permission denied**: Run as Administrator

### Frontend Issues
- **Port 3002 in use**: Kill process or use different port
- **Node modules error**: Delete `node_modules` and run `npm install`
- **Hot reload not working**: Check Vite config

### Agent Communication
- **"Agent not connected"**: Ensure agent is installed and running
- **Voice commands not working**: Grant microphone permission in browser
- **WebSocket errors**: Check firewall, ensure port 5001 is open

## 📚 Documentation

- [QUICK_START.md](QUICK_START.md) - Quick start guide
- [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md) - Detailed installation guide

## 🔒 Security & Permissions

- Installation requires write access to `C:\Program Files\`
- System commands are whitelisted for safety
- Voice recognition data is processed locally
- User data stored in AppData directory

## 📦 Installation Locations

| Component | Location |
|-----------|----------|
| Agent | `C:\Program Files\SofAi\CommandAgent\` |
| Config | `%APPDATA%\SofAi\config.json` |
| Startup | `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\` |

## 🤝 Contributing

To add new features:

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📝 License

[Specify your license here]

## 👨‍💻 Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)
3. Check browser console for errors (F12)

## 🎉 What's Next?

After installation, you can:
1. ✅ Use voice commands to control your PC
2. ✅ Chat with the AI assistant
3. ✅ Learn from the educational sections
4. ✅ Analyze trading/finance content
5. ✅ Save and manage conversations

Enjoy your new AI assistant! 🚀

---

**Version 1.0.0** | Last Updated: 2024

Project layout:
- `backend/` — FastAPI server, model loader, utils
- `frontend/` — React chat UI
- `data/` — datasets and KBs
- `scripts/` — preprocessing and training helpers
- `notebooks/` — experiments and quick tests

Next steps:
- Add auth and chat history storage
- Add RAG with FAISS or ChromaDB
- Implement LoRA fine-tuning pipeline
- Add deployment guides (Railway / Render / HuggingFace Spaces)

