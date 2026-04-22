const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = 5050;

// Middleware
app.use(cors());
app.use(express.json());

// Global installation status
let INSTALL_STATUS = {
    status: 'idle', // idle, installing, completed, error
    progress: 0,
    message: 'Ready to install',
    log: []
};

// Installation paths (simplified for demo)
const INSTALL_ROOT = path.join(require('os').homedir(), 'AppData', 'Local', 'SofAi', 'CommandAgent');

function logInstall(message) {
    console.log(message);
    INSTALL_STATUS.log.push(message);
    if (INSTALL_STATUS.log.length > 100) {
        INSTALL_STATUS.log = INSTALL_STATUS.log.slice(-100);
    }
}

function updateStatus(status, progress, message) {
    INSTALL_STATUS.status = status;
    INSTALL_STATUS.progress = progress;
    INSTALL_STATUS.message = message;
    logInstall(`[${status.toUpperCase()}] ${progress}% - ${message}`);
}

function installAgentWorker() {
    return new Promise((resolve, reject) => {
        try {
            updateStatus('installing', 5, 'Creating installation directory...');

            // Create installation directory
            if (!fs.existsSync(INSTALL_ROOT)) {
                fs.mkdirSync(INSTALL_ROOT, { recursive: true });
            }
            updateStatus('installing', 15, 'Directory created');

            // Copy necessary files (simplified - just create a placeholder)
            updateStatus('installing', 25, 'Setting up command agent...');

            const agentDir = path.join(INSTALL_ROOT, 'agent');
            if (!fs.existsSync(agentDir)) {
                fs.mkdirSync(agentDir, { recursive: true });
            }

            // Create a simple batch file for the agent
            const batchContent = `@echo off
echo SofAi Command Agent is running...
echo This is a demo installation.
pause
`;

            fs.writeFileSync(path.join(agentDir, 'run_agent.bat'), batchContent);
            updateStatus('installing', 45, 'Agent files created');

            // Create startup entry (simplified)
            updateStatus('installing', 65, 'Setting up autostart...');

            const startupDir = path.join(require('os').homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
            const startupBatch = path.join(startupDir, 'SofAiCommandAgent.bat');

            const startupContent = `@echo off
cd /d "${agentDir}"
start "" "${path.join(agentDir, 'run_agent.bat')}"
exit /b 0
`;

            fs.writeFileSync(startupBatch, startupContent);
            updateStatus('installing', 85, 'Autostart configured');

            // Create configuration file
            updateStatus('installing', 95, 'Finalizing installation...');

            const configDir = path.join(require('os').homedir(), 'AppData', 'Roaming', 'SofAi');
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }

            const config = {
                install_path: INSTALL_ROOT,
                installed: true,
                version: '1.0.0',
                type: 'demo'
            };

            fs.writeFileSync(path.join(configDir, 'config.json'), JSON.stringify(config, null, 2));

            updateStatus('completed', 100, 'Installation complete! Agent is ready.');
            logInstall("✓ Installation successful");

            resolve();

        } catch (error) {
            updateStatus('error', 0, `Installation failed: ${error.message}`);
            logInstall(`✗ Installation error: ${error.message}`);
            reject(error);
        }
    });
}

// Routes
app.get('/api/check-agent', (req, res) => {
    try {
        const configPath = path.join(require('os').homedir(), 'AppData', 'Roaming', 'SofAi', 'config.json');

        if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            return res.json({
                installed: config.installed || false,
                path: config.install_path || INSTALL_ROOT,
                version: config.version || 'unknown'
            });
        }

        return res.json({
            installed: false,
            path: INSTALL_ROOT,
            version: null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/install-agent', (req, res) => {
    if (INSTALL_STATUS.status === 'installing') {
        return res.status(409).json({ error: 'Installation already in progress' });
    }

    // Start installation
    updateStatus('installing', 0, 'Starting installation...');

    installAgentWorker()
        .then(() => {
            res.json({
                status: 'started',
                message: 'Installation started in background'
            });
        })
        .catch((error) => {
            res.status(500).json({ error: error.message });
        });
});

app.get('/api/install-status', (req, res) => {
    res.json({
        status: INSTALL_STATUS.status,
        progress: INSTALL_STATUS.progress,
        message: INSTALL_STATUS.message,
        log: INSTALL_STATUS.log.slice(-20) // Last 20 log entries
    });
});

app.post('/api/open-app', (req, res) => {
    try {
        const agentPath = path.join(INSTALL_ROOT, 'agent', 'run_agent.bat');

        if (fs.existsSync(agentPath)) {
            exec(`start "" "${agentPath}"`, (error) => {
                if (error) {
                    return res.status(500).json({ error: error.message });
                }
                res.json({ status: 'opened' });
            });
        } else {
            res.status(404).json({ error: 'Agent not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`SofAi Installation API running on http://localhost:${PORT}`);
});