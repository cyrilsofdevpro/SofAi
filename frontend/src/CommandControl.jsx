import { useState, useEffect, useRef } from 'react';
import './CommandControl.css';

export default function CommandControl() {
  const [agentStatus, setAgentStatus] = useState('checking');
  const [installed, setInstalled] = useState(false);
  const [connected, setConnected] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [installMessage, setInstallMessage] = useState('');
  const [lastCommand, setLastCommand] = useState(null);
  const [isListening, setIsListening] = useState(false);

  // Check if agent is installed/running
  useEffect(() => {
    checkAgentStatus();
    const interval = setInterval(checkAgentStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Monitor installation progress
  useEffect(() => {
    if (installing) {
      const checkInterval = setInterval(async () => {
        try {
          const response = await fetch('http://localhost:5050/api/install-status');
          const data = await response.json();
          setInstallProgress(data.progress);
          setInstallMessage(data.message);
          
          if (data.status === 'completed') {
            setInstalling(false);
            setInstallMessage('Installation complete! Checking for agent...');
            setTimeout(() => {
              checkAgentStatus();
              connectWebSocket();
            }, 3000);
          } else if (data.status === 'error') {
            setInstalling(false);
            setInstallMessage('Installation failed. Please try again.');
          }
        } catch (err) {
          // Installation API might not be running yet
          setInstallMessage('Waiting for installation API...');
        }
      }, 1000);
      
      return () => clearInterval(checkInterval);
    }
  }, [installing]);

  const checkAgentStatus = async () => {
    try {
      const response = await fetch('http://localhost:5050/api/check-agent');
      const data = await response.json();
      
      if (data.installed) {
        setAgentStatus('online');
        setInstalled(true);
        connectWebSocket();
      } else {
        setAgentStatus('offline');
        setInstalled(false);
        setConnected(false);
      }
    } catch (err) {
      // API is not running - show helpful message
      setAgentStatus('api-error');
      setInstalled(false);
      setConnected(false);
    }
  };

  const connectWebSocket = async () => {
    try {
      // Use HTTP health check instead of WebSocket
      const response = await fetch('http://localhost:5001/health');
      if (response.ok) {
        setConnected(true);
        setAgentStatus('online');
      }
    } catch (err) {
      console.error('Agent connection check failed:', err);
      setConnected(false);
      setAgentStatus('error');
    }
  };

  const sendCommand = async (command) => {
    if (!connected) {
      alert('Agent not connected. Please install SofAi Command Agent first.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      
      const result = await response.json();
      setLastCommand(result);
    } catch (err) {
      console.error('Command execution error:', err);
      alert('Failed to execute command');
    }
  };

  const handleInstall = async () => {
    setInstalling(true);
    setInstallProgress(0);
    setInstallMessage('Starting installation...');
    
    try {
      const response = await fetch('http://localhost:5050/api/install-agent', {
        method: 'POST'
      });
      
      if (!response.ok) {
        setInstalling(false);
        setInstallMessage('Failed to start installation');
      }
    } catch (err) {
      setInstalling(false);
      setInstallMessage('Installation service not available. Please try again.');
    }
  };

  const handleVoiceCommand = () => {
    if (!window.webkitSpeechRecognition && !window.SpeechRecognition) {
      alert('Speech Recognition not supported in your browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      
      sendCommand(transcript);
    };

    recognition.start();
  };

  return (
    <div className="command-control">
      {/* Status Panel */}
      <div className={`status-panel ${agentStatus}`}>
        <div className="status-header">
          <h2>SofAi Command Agent</h2>
          <div className={`status-indicator ${agentStatus}`}>
            {agentStatus === 'online' ? '🟢' : agentStatus === 'offline' ? '🔴' : '🟡'} 
            {agentStatus === 'api-error' ? 'API Error' : agentStatus.charAt(0).toUpperCase() + agentStatus.slice(1)}
          </div>
        </div>

        {/* Show API Error Message */}
        {agentStatus === 'api-error' && (
          <div className="api-error-box">
            <h3>⚠️ Installation API Not Running</h3>
            <p>The installation API is not available on port 5050.</p>
            <div className="error-instructions">
              <h4>To fix this, run in a new terminal:</h4>
              <code>cd C:\Users\Cyril Sofdev\Desktop\SofAi\SofAI\backend</code>
              <code>python installation_api.py</code>
              <p>Then refresh this page (Ctrl+R or Cmd+R)</p>
            </div>
            <button className="refresh-btn" onClick={() => window.location.reload()}>
              🔄 Refresh Page
            </button>
          </div>
        )}

        {!installed && agentStatus !== 'api-error' ? (
          <div className="installation-guide">
            <h3>One-Click Installation</h3>
            <p>Install SofAi Command Agent to your PC for voice & text commands</p>
            
            {!installing ? (
              <div className="install-button-container">
                <button className="install-button" onClick={handleInstall}>
                  <span className="install-icon">⬇️</span>
                  <span>Install SofAi Command Agent</span>
                </button>
                <p className="install-note">
                  This will install the agent to your system and enable voice commands
                </p>
              </div>
            ) : (
              <div className="installation-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${installProgress}%` }}
                  ></div>
                </div>
                <p className="progress-message">{installMessage}</p>
                <p className="progress-percent">{installProgress}%</p>
              </div>
            )}

            <div className="install-features">
              <h4>What You Get:</h4>
              <ul>
                <li>✓ Voice command support (🎤)</li>
                <li>✓ Open apps with voice ("open notepad")</li>
                <li>✓ Runs automatically on startup</li>
                <li>✓ System tray integration</li>
                <li>✓ Works with any browser</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="command-interface">
            <div className="connection-status">
              WebSocket Connection: 
              <span className={`connection-badge ${connected ? 'connected' : 'disconnected'}`}>
                {connected ? '✓ Connected' : '✗ Disconnected'}
              </span>
            </div>

            <div className="command-input-group">
              <button 
                className={`voice-btn ${isListening ? 'listening' : ''}`}
                onClick={handleVoiceCommand}
              >
                {isListening ? '🎙️ Listening...' : '🎤 Voice Command'}
              </button>
            </div>

            <div className="quick-commands">
              <h4>Quick Commands</h4>
              <div className="command-buttons">
                {['open notepad', 'open calculator', 'open chrome', 'open vs code'].map(cmd => (
                  <button 
                    key={cmd}
                    className="quick-cmd-btn"
                    onClick={() => sendCommand(cmd)}
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>

            {lastCommand && (
              <div className="last-command">
                <h4>Last Command Status</h4>
                <p className={lastCommand.success ? 'success' : 'error'}>
                  {lastCommand.message}
                </p>
                <small>{new Date(lastCommand.timestamp).toLocaleTimeString()}</small>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
