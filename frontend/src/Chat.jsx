import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { sendMessage, login, signup, checkEmail } from './api';
import CommandControl from './CommandControl';
import './Chat.css';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('qwen');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showAuthPage, setShowAuthPage] = useState(false);
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '',
    username: '',
    gender: 'not-specified',
    acceptTerms: false
  });
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [messageFeedback, setMessageFeedback] = useState({});
  const [hoveredMessageIdx, setHoveredMessageIdx] = useState(null);
  const [activeSidebarTab, setActiveSidebarTab] = useState('chats');
  const [selectedTutorLevel, setSelectedTutorLevel] = useState('beginner');
  const [commandMode, setCommandMode] = useState(false);
  const [showCommandAgent, setShowCommandAgent] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const wakeWordRecognitionRef = useRef(null);
  const [wakeWordActive, setWakeWordActive] = useState(false);

  const getModelName = (model) => {
    const modelNames = {
      qwen: "Qwen",
      phi: "Phi-2",
      tinyllama: "TinyLlama",
      "TinyLlama/TinyLlama-1.1B-Chat-v1.0": "TinyLlama",
      canned: "System"
    };
    return modelNames[model] || model;
  };

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      alert('Please enter email and password');
      return;
    }

    try {
      const result = await login(loginData.email, loginData.password);
      
      if (result.success) {
        setUser(result.user);
        setIsLoggedIn(true);
        setShowAuthPage(false);
        setLoginData({ email: '', password: '' });
        localStorage.setItem('user', JSON.stringify(result.user));
        if (conversations.length > 0) {
          localStorage.setItem('conversations', JSON.stringify(conversations));
        }
      } else {
        alert(result.error || 'Login failed');
      }
    } catch (error) {
      alert('Login error: ' + error.message);
    }
  };

  const handleSignup = async () => {
    if (!signupData.email || !signupData.password || !signupData.confirmPassword || !signupData.username) {
      alert('Please fill all required fields');
      return;
    }

    if (signupData.password !== signupData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (!signupData.acceptTerms) {
      alert('Please accept terms & conditions');
      return;
    }

    try {
      const result = await signup({
        email: signupData.email,
        password: signupData.password,
        username: signupData.username,
        gender: signupData.gender
      });

      if (result.success) {
        setUser(result.user);
        setIsLoggedIn(true);
        setShowAuthPage(false);
        setSignupData({ 
          email: '', 
          password: '', 
          confirmPassword: '',
          username: '',
          gender: 'not-specified',
          acceptTerms: false
        });
        localStorage.setItem('user', JSON.stringify(result.user));
        if (conversations.length > 0) {
          localStorage.setItem('conversations', JSON.stringify(conversations));
        }
      } else {
        alert(result.error || 'Signup failed');
      }
    } catch (error) {
      alert('Signup error: ' + error.message);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('user');
    // Clear conversations when logging out
    setConversations([]);
    setMessages([]);
    localStorage.removeItem('conversations');
    createNewConversation();
    setShowAuthPage(true);
  };

  const createNewConversation = () => {
    const newId = Date.now().toString();
    const newConversation = {
      id: newId,
      title: 'New Conversation',
      messages: [],
      createdAt: new Date().toISOString()
    };
    
    const updatedConversations = [newConversation, ...conversations];
    setConversations(updatedConversations);
    setCurrentConversationId(newId);
    setMessages([]);
    
    // Only save to localStorage if user is logged in
    if (isLoggedIn) {
      localStorage.setItem('conversations', JSON.stringify(updatedConversations));
    }
  };

  const switchConversation = (conversationId) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setCurrentConversationId(conversationId);
      setMessages(conversation.messages);
      setSidebarOpen(false);
    }
  };

  const saveCurrentConversation = (updatedMessages) => {
    const updatedConversations = conversations.map(c => {
      if (c.id === currentConversationId) {
        const title = updatedMessages.length > 0 
          ? updatedMessages[0].text.substring(0, 30) + '...'
          : 'New Conversation';
        return { ...c, messages: updatedMessages, title };
      }
      return c;
    });
    
    setConversations(updatedConversations);
    
    // Only save to localStorage if user is logged in
    if (isLoggedIn) {
      localStorage.setItem('conversations', JSON.stringify(updatedConversations));
    }
  };

  const deleteConversation = (conversationId) => {
    const updatedConversations = conversations.filter(c => c.id !== conversationId);
    setConversations(updatedConversations);
    
    // Only save to localStorage if user is logged in
    if (isLoggedIn) {
      localStorage.setItem('conversations', JSON.stringify(updatedConversations));
    }
    
    if (currentConversationId === conversationId) {
      if (updatedConversations.length > 0) {
        switchConversation(updatedConversations[0].id);
      } else {
        createNewConversation();
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const deleteMessage = (index) => {
    const updatedMessages = messages.filter((_, i) => i !== index);
    setMessages(updatedMessages);
    saveCurrentConversation(updatedMessages);
  };

  const editMessage = (index, newText) => {
    if (!newText.trim()) return;
    const updatedMessages = [...messages];
    updatedMessages[index].text = newText;
    setMessages(updatedMessages);
    saveCurrentConversation(updatedMessages);
  };

  const regenerateResponse = async (index) => {
    if (index === 0 || messages[index - 1].role !== 'user') return;
    
    const userMessage = messages[index - 1].text;
    const history = messages.slice(0, index - 1).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text
    }));

    setLoading(true);
    try {
      const response = await sendMessage(userMessage, selectedModel, history);
      const updatedMessages = [...messages];
      updatedMessages[index] = {
        ...updatedMessages[index],
        text: response.reply,
        model_used: response.model_used
      };
      setMessages(updatedMessages);
      saveCurrentConversation(updatedMessages);
    } catch (error) {
      alert('Failed to regenerate response');
    } finally {
      setLoading(false);
    }
  };

  const toggleFeedback = (msgIndex, type) => {
    setMessageFeedback(prev => ({
      ...prev,
      [msgIndex]: prev[msgIndex] === type ? null : type
    }));
  };


  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setInput('');
      recognitionRef.current.start();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Wake Word Detection
  const initializeWakeWordDetection = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    wakeWordRecognitionRef.current = new SpeechRecognition();
    const recognition = wakeWordRecognitionRef.current;
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setWakeWordActive(true);
    };

    recognition.onresult = (event) => {
      let transcript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript.toLowerCase();
        
        // Check for wake word "hey sofai"
        if (event.results[i].isFinal) {
          if (transcript.includes('hey sofai') || transcript.includes('hey so') || transcript.includes('sofai')) {
            console.log('🎤 Wake word detected!');
            // Trigger automatic voice command mode
            handleWakeWordDetected();
          }
        }
      }
    };

    recognition.onerror = (event) => {
      console.error('Wake word recognition error:', event.error);
      // Auto-restart on errors
      setTimeout(() => {
        if (wakeWordRecognitionRef.current) {
          wakeWordRecognitionRef.current.start();
        }
      }, 1000);
    };

    recognition.onend = () => {
      setWakeWordActive(false);
      // Restart wake word detection
      setTimeout(() => {
        if (wakeWordRecognitionRef.current) {
          wakeWordRecognitionRef.current.start();
        }
      }, 500);
    };

    // Start listening for wake word
    recognition.start();
  };

  // Handle when wake word is detected
  const handleWakeWordDetected = async () => {
    setIsRecording(true);
    
    // Stop wake word recognition temporarily
    if (wakeWordRecognitionRef.current) {
      wakeWordRecognitionRef.current.stop();
    }

    // Start command recognition
    if (!recognitionRef.current) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsRecording(true);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
        // Resume wake word detection
        if (wakeWordRecognitionRef.current) {
          wakeWordRecognitionRef.current.start();
        }
      };

      recognitionRef.current.onresult = (event) => {
        let transcript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }

        if (transcript.trim()) {
          setInput(prev => prev.trim() ? prev + ' ' + transcript.trim() : transcript.trim());
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };
    }

    // Start listening for the command
    recognitionRef.current.start();
    
    // Auto-send after 5 seconds of silence or when speech ends
    setTimeout(() => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }, 8000);
  };

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        setIsLoggedIn(true);
        setShowAuthPage(false);
      } else {
        setShowAuthPage(true);
      }
      
      // Load conversations from localStorage only for logged-in users
      const savedConversations = localStorage.getItem('conversations');
      if (savedConversations && savedUser) {
        const convs = JSON.parse(savedConversations);
        setConversations(convs);
        
        // Load the most recent conversation
        if (convs.length > 0) {
          const mostRecent = convs[0];
          setCurrentConversationId(mostRecent.id);
          setMessages(mostRecent.messages);
        }
      }

      // Initialize Web Speech API with error handling
      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = true;
          recognitionRef.current.maxAlternatives = 1;
          recognitionRef.current.lang = 'en-US';

          recognitionRef.current.onstart = () => {
            setIsRecording(true);
          };

          recognitionRef.current.onend = () => {
            setIsRecording(false);
          };

          recognitionRef.current.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;
              const confidence = event.results[i][0].confidence;

              if (event.results[i].isFinal) {
                if (confidence > 0.5) {
                  finalTranscript += transcript + ' ';
                }
              } else {
                interimTranscript += transcript;
              }
            }

            if (interimTranscript && !finalTranscript) {
              setInput(prev => {
                const trimmedPrev = prev.trim();
                if (!trimmedPrev.endsWith(interimTranscript.trim())) {
                  return trimmedPrev + ' ' + interimTranscript;
                }
                return prev;
              });
            } else if (finalTranscript) {
              setInput(prev => {
                const trimmedPrev = prev.trim();
                const cleanText = trimmedPrev.replace(/\s+$/, '');
                return cleanText ? cleanText + ' ' + finalTranscript.trim() : finalTranscript.trim();
              });
            }
          };

          recognitionRef.current.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
          };
        }
      } catch (speechErr) {
        console.warn('Speech recognition not available:', speechErr);
      }
    } catch (error) {
      console.error('Chat initialization error:', error);
    }
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    // If in command mode, execute system command instead
    if (commandMode) {
      await executeSystemCommand(input);
      return;
    }

    const userMessage = input;
    const history = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text
    }));

    setInput('');
    const newMessages = [...messages, { role: 'user', text: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await sendMessage(userMessage, selectedModel, history);
      const updatedMessages = [...newMessages, {
        role: 'assistant',
        text: response.reply,
        model_used: response.model_used
      }];
      setMessages(updatedMessages);
      saveCurrentConversation(updatedMessages);
    } catch (error) {
      const updatedMessages = [...newMessages, {
        role: 'assistant',
        text: '❌ Error: Unable to connect to the backend.',
        model_used: 'error'
      }];
      setMessages(updatedMessages);
      saveCurrentConversation(updatedMessages);
    } finally {
      setLoading(false);
    }
  };

  const executeSystemCommand = async (command) => {
    const userMessage = command;
    setInput('');
    const newMessages = [...messages, { role: 'user', text: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/execute-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: userMessage })
      });

      const data = await response.json();
      const updatedMessages = [...newMessages, {
        role: 'assistant',
        text: data.message,
        model_used: 'system'
      }];
      setMessages(updatedMessages);
      saveCurrentConversation(updatedMessages);
    } catch (error) {
      const updatedMessages = [...newMessages, {
        role: 'assistant',
        text: '❌ System Commander not running. Start it with: python system_commander.py',
        model_used: 'system'
      }];
      setMessages(updatedMessages);
      saveCurrentConversation(updatedMessages);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickPrompts = [
    { icon: '🤖', text: 'What is machine learning?', label: 'Machine Learning' },
    { icon: '🗺️', text: 'What is the capital of France?', label: 'Geography' },
    { icon: '⚛️', text: 'Explain quantum computing', label: 'Quantum Computing' },
    { icon: '😄', text: 'Tell me a joke', label: 'Make me Laugh' }
  ];

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : ''}`}>
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-header-content">
            <h2>Conversations</h2>
            <button 
              onClick={() => setDarkMode(!darkMode)} 
              className="theme-toggle"
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="close-btn">×</button>
        </div>
        <div className="sidebar-content">
          {/* Sidebar Tabs */}
          <div className="sidebar-tabs">
            <button 
              className={`sidebar-tab ${activeSidebarTab === 'chats' ? 'active' : ''}`}
              onClick={() => setActiveSidebarTab('chats')}
            >
              💬 Chats
            </button>
            <button 
              className={`sidebar-tab ${activeSidebarTab === 'africa' ? 'active' : ''}`}
              onClick={() => setActiveSidebarTab('africa')}
            >
              📚 Africa
            </button>
          </div>

          {/* Chats Tab */}
          {activeSidebarTab === 'chats' && (
            <>
              <button onClick={createNewConversation} className="new-conversation-btn">
                + New Chat
              </button>
              <div className="history-section">
                <div className="history-list">
                  {conversations.map((conv) => (
                    <div key={conv.id} className={`history-item ${currentConversationId === conv.id ? 'active' : ''}`}>
                      <div 
                        className="history-item-content"
                        onClick={() => switchConversation(conv.id)}
                      >
                        {conv.title}
                      </div>
                      <button 
                        className="delete-conv-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Africa Education Tab */}
          {activeSidebarTab === 'africa' && (
            <div className="africa-section">
              <div className="africa-header">📚 Education & Learning Features</div>
              <p className="africa-subtitle">Very important for Africa & students</p>
              
              {/* Exam & Study Assistant */}
              <div className="africa-feature">
                <h3>📝 Exam & Study Assistant</h3>
                <div className="feature-items">
                  <button className="feature-item" onClick={() => {createNewConversation(); setInput('Help me study for WAEC exam'); setMessages([]); setActiveSidebarTab('chats');}}>🎓 WAEC Support</button>
                  <button className="feature-item" onClick={() => {createNewConversation(); setInput('Help me prepare for NECO'); setMessages([]); setActiveSidebarTab('chats');}}>🎓 NECO Support</button>
                  <button className="feature-item" onClick={() => {createNewConversation(); setInput('Help me prepare for JAMB UTME'); setMessages([]); setActiveSidebarTab('chats');}}>🎓 JAMB (UTME)</button>
                </div>
                <p className="feature-desc">Step-by-step explanations & past question analysis</p>
              </div>
              
              {/* Homework Solver */}
              <div className="africa-feature">
                <h3>✏️ Homework Solver</h3>
                <div className="feature-items">
                  <button className="feature-item" onClick={() => {createNewConversation(); setInput('Solve this math problem with steps'); setMessages([]); setActiveSidebarTab('chats');}}>🔢 Mathematics</button>
                  <button className="feature-item" onClick={() => {createNewConversation(); setInput('Explain this physics concept'); setMessages([]); setActiveSidebarTab('chats');}}>⚛️ Physics</button>
                  <button className="feature-item" onClick={() => {createNewConversation(); setInput('Help with chemistry'); setMessages([]); setActiveSidebarTab('chats');}}>🧪 Chemistry</button>
                  <button className="feature-item" onClick={() => {createNewConversation(); setInput('English assignment help'); setMessages([]); setActiveSidebarTab('chats');}}>📖 English</button>
                </div>
                <p className="feature-desc">Shows workings (not just answers)</p>
              </div>
              
              {/* AI Tutor Mode */}
              <div className="africa-feature">
                <h3>👨‍🏫 AI Tutor Mode</h3>
                <p className="feature-desc">Explains topics slowly like a teacher</p>
                <div className="tutor-levels">
                  <label className="level-option">
                    <input 
                      type="radio" 
                      name="tutorLevel" 
                      value="beginner"
                      checked={selectedTutorLevel === 'beginner'}
                      onChange={(e) => setSelectedTutorLevel(e.target.value)}
                    />
                    🟢 Beginner
                  </label>
                  <label className="level-option">
                    <input 
                      type="radio" 
                      name="tutorLevel" 
                      value="intermediate"
                      checked={selectedTutorLevel === 'intermediate'}
                      onChange={(e) => setSelectedTutorLevel(e.target.value)}
                    />
                    🟡 Intermediate
                  </label>
                  <label className="level-option">
                    <input 
                      type="radio" 
                      name="tutorLevel" 
                      value="advanced"
                      checked={selectedTutorLevel === 'advanced'}
                      onChange={(e) => setSelectedTutorLevel(e.target.value)}
                    />
                    🔴 Advanced
                  </label>
                </div>
                <button 
                  className="tutor-start-btn" 
                  onClick={() => {
                    createNewConversation();
                    setInput(`Act as an ${selectedTutorLevel} level AI tutor. Explain topics slowly and clearly like a teacher.`);
                    setMessages([]);
                    setActiveSidebarTab('chats');
                  }}
                >
                  Start Tutoring Session
                </button>
              </div>
              
              {/* Trading & Finance */}
              <div className="africa-feature trading-feature">
                <h3>💹 Trading & Finance (AI Decision Support)</h3>
                <p className="feature-desc">For traders seeking intelligent market insights</p>
                
                {/* AI Market Analysis */}
                <div className="trading-subsection">
                  <h4>📊 AI Market Analysis</h4>
                  <div className="feature-items">
                    <button className="feature-item" onClick={() => {createNewConversation(); setInput('Analyze current forex market trends'); setMessages([]); setActiveSidebarTab('chats');}}>💱 Forex Analysis</button>
                    <button className="feature-item" onClick={() => {createNewConversation(); setInput('What are the current crypto market trends?'); setMessages([]); setActiveSidebarTab('chats');}}>🪙 Crypto Trends</button>
                    <button className="feature-item" onClick={() => {createNewConversation(); setInput('Analyze stock indices trends'); setMessages([]); setActiveSidebarTab('chats');}}>📈 Indices</button>
                  </div>
                  <p className="feature-desc">Trend direction • Support & resistance levels</p>
                </div>
                
                {/* Session-Based Trade Assistant */}
                <div className="trading-subsection">
                  <h4>⏰ Session-Based Trade Assistant</h4>
                  <div className="feature-items">
                    <button className="feature-item" onClick={() => {createNewConversation(); setInput('What are the best trading opportunities during London session?'); setMessages([]); setActiveSidebarTab('chats');}}>🇬🇧 London Session</button>
                    <button className="feature-item" onClick={() => {createNewConversation(); setInput('Best forex pairs to trade in New York session'); setMessages([]); setActiveSidebarTab('chats');}}>🇺🇸 New York Session</button>
                    <button className="feature-item" onClick={() => {createNewConversation(); setInput('Which pairs have highest volatility now?'); setMessages([]); setActiveSidebarTab('chats');}}>📊 Volatility Guide</button>
                  </div>
                  <p className="feature-desc">Session tips • Best pairs by time & volatility</p>
                </div>
                
                {/* Risk Management Helper */}
                <div className="trading-subsection">
                  <h4>⚠️ Risk Management Helper</h4>
                  <div className="feature-items">
                    <button className="feature-item" onClick={() => {createNewConversation(); setInput('Calculate my lot size for risk management'); setMessages([]); setActiveSidebarTab('chats');}}>🧮 Lot Size Calculator</button>
                    <button className="feature-item" onClick={() => {createNewConversation(); setInput('Explain risk-to-reward ratio and position sizing'); setMessages([]); setActiveSidebarTab('chats');}}>⚖️ Risk-Reward Guide</button>
                    <button className="feature-item" onClick={() => {createNewConversation(); setInput('How do I manage trading psychology and emotions?'); setMessages([]); setActiveSidebarTab('chats');}}>🧠 Psychology Tips</button>
                  </div>
                  <p className="feature-desc">Risk management • Position sizing • Psychology</p>
                </div>
                
                <div className="trading-disclaimer">
                  <p>⚠️ <strong>Not a Signal Seller</strong> — SofAi provides AI decision support only. Always do your own research (DYOR) and consult with a financial advisor before trading.</p>
                </div>
              </div>
            </div>
          )}

          <div className="account-section">
            <div className="account-content">
              {isLoggedIn ? (
                <div>
                  <p>Welcome, {user?.username || user?.email}</p>
                  <button onClick={handleLogout} className="logout-btn">Logout</button>
                </div>
              ) : (
                <button onClick={() => setShowAuthPage(true)} className="login-btn">Login / Sign Up</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat */}
      <div className="chat-container">
        {/* Header */}
        <div className="chat-header">
          <div className="header-content">
            <button onClick={() => setSidebarOpen(true)} className="sidebar-toggle">☰</button>
            <h1>SofAi</h1>
            <div className="header-buttons">
              <button 
                className="header-agent-btn"
                onClick={() => setShowCommandAgent(true)}
                title="Open Command Agent"
              >
                🤖
              </button>
              <div className="model-selector">
                <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
                  <option value="qwen">Qwen</option>
                  <option value="phi">Phi-2</option>
                  <option value="tinyllama">TinyLlama</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="messages-container">
          {messages.length === 0 && (
            <div className="welcome-section">
              <div className="welcome-icon">✨</div>
              <h2>What can I help you with?</h2>
              <p>Ask me anything, and I'll do my best to help!</p>
              
              {/* Command Agent Button */}
              <button 
                className="command-agent-btn"
                onClick={() => setShowCommandAgent(true)}
                title="Open SofAi Command Agent"
              >
                <span className="agent-icon">🤖</span>
                <span>Open Command Agent</span>
              </button>
              
              <div className="quick-prompts">
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(prompt.text)}
                    className="prompt-btn"
                  >
                    <span className="prompt-icon">{prompt.icon}</span>
                    <span>{prompt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`message ${msg.role}`}
              onMouseEnter={() => setHoveredMessageIdx(idx)}
              onMouseLeave={() => setHoveredMessageIdx(null)}
            >
              <div className="message-content">
                <div className="message-text">
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown 
                      components={{
                        p: ({node, ...props}) => <p style={{margin: '10px 0'}} {...props} />,
                        h1: ({node, ...props}) => <h1 style={{fontSize: '24px', fontWeight: 'bold', margin: '12px 0 8px 0'}} {...props} />,
                        h2: ({node, ...props}) => <h2 style={{fontSize: '20px', fontWeight: 'bold', margin: '12px 0 8px 0'}} {...props} />,
                        h3: ({node, ...props}) => <h3 style={{fontSize: '18px', fontWeight: 'bold', margin: '10px 0 6px 0'}} {...props} />,
                        ul: ({node, ...props}) => <ul style={{margin: '10px 0', paddingLeft: '20px'}} {...props} />,
                        ol: ({node, ...props}) => <ol style={{margin: '10px 0', paddingLeft: '25px'}} {...props} />,
                        li: ({node, ...props}) => <li style={{margin: '6px 0'}} {...props} />,
                        code: ({node, ...props}) => <code style={{background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '3px', fontFamily: 'monospace'}} {...props} />,
                        pre: ({node, ...props}) => <pre style={{background: 'var(--bg-tertiary)', padding: '12px', borderRadius: '6px', overflow: 'auto', margin: '10px 0'}} {...props} />,
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  ) : (
                    msg.text
                  )}
                </div>
                {msg.role === 'assistant' && msg.model_used && (
                  <div className="model-info">Answered by {getModelName(msg.model_used)}</div>
                )}
              </div>

              {hoveredMessageIdx === idx && (
                <div className="message-actions">
                  <button 
                    className="action-btn copy-btn"
                    onClick={() => copyToClipboard(msg.text)}
                    title="Copy"
                  >
                    📋
                  </button>
                  {msg.role === 'assistant' && (
                    <>
                      <button 
                        className={`action-btn feedback-btn ${messageFeedback[idx] === 'like' ? 'active' : ''}`}
                        onClick={() => toggleFeedback(idx, 'like')}
                        title="Helpful"
                      >
                        👍
                      </button>
                      <button 
                        className={`action-btn feedback-btn ${messageFeedback[idx] === 'dislike' ? 'active' : ''}`}
                        onClick={() => toggleFeedback(idx, 'dislike')}
                        title="Not helpful"
                      >
                        👎
                      </button>
                      {idx === messages.length - 1 && (
                        <button 
                          className="action-btn regenerate-btn"
                          onClick={() => regenerateResponse(idx)}
                          disabled={loading}
                          title="Regenerate"
                        >
                          🔄
                        </button>
                      )}
                    </>
                  )}
                  <button 
                    className="action-btn delete-btn"
                    onClick={() => deleteMessage(idx)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="message assistant">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="input-section">
          <div className="input-wrapper">
            <button
              onClick={toggleVoiceRecording}
              disabled={loading}
              className={`voice-button ${isRecording ? 'recording' : ''}`}
              title={isRecording ? 'Stop recording' : 'Start voice input'}
            >
              {isRecording ? '🎙️' : '🎤'}
            </button>
            {wakeWordActive && (
              <div className="wake-word-indicator" title="Listening for 'Hey SofAi'">
                🔴 Listening...
              </div>
            )}
            <button
              onClick={() => setCommandMode(!commandMode)}
              className={`command-toggle-btn ${commandMode ? 'active' : ''}`}
              title="Toggle System Commands (open apps, etc.)"
            >
              {commandMode ? '⚙️' : '💬'}
            </button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={commandMode ? 'Say "open notepad", "open chrome"...' : 'Ask me anything...'}
              disabled={loading}
              className={`message-input ${commandMode ? 'command-mode' : ''}`}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="send-button"
            >
              {loading ? <span className="spinner">⟳</span> : <span>➤</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Auth Page - Full Screen */}
      {showAuthPage && !isLoggedIn && (
        <div className="auth-page">
          <div className="auth-container">
            {/* Left Side - Branding */}
            <div className="auth-left">
              <div className="auth-logo">
                <div className="logo-icon">✨</div>
                <h1>SofAi</h1>
              </div>
              <div className="auth-features">
                <h2>Welcome to SofAi</h2>
                <p>Your AI assistant powered by advanced language models</p>
                <ul className="features-list">
                  <li>🎯 Intelligent Conversations</li>
                  <li>🎤 Voice Command Support</li>
                  <li>📚 Learning & Tutoring</li>
                  <li>💹 Trading Insights</li>
                  <li>⚙️ System Control</li>
                </ul>
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="auth-right">
              <div className="auth-form-container">
                {/* Tabs */}
                <div className="auth-tabs">
                  <button 
                    className={`auth-tab ${isLoginTab ? 'active' : ''}`}
                    onClick={() => setIsLoginTab(true)}
                  >
                    Login
                  </button>
                  <button 
                    className={`auth-tab ${!isLoginTab ? 'active' : ''}`}
                    onClick={() => setIsLoginTab(false)}
                  >
                    Sign Up
                  </button>
                </div>

                {/* Login Form */}
                {isLoginTab ? (
                  <div className="auth-form login-form">
                    <h3>Welcome Back</h3>
                    <p>Log in to your account to continue</p>
                    
                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      />
                    </div>

                    <button 
                      className="auth-submit-btn"
                      onClick={handleLogin}
                    >
                      Sign In
                    </button>

                    <p className="auth-footer">
                      Don't have an account? <span onClick={() => setIsLoginTab(false)} style={{ cursor: 'pointer', color: '#667eea', fontWeight: '600' }}>Sign up</span>
                    </p>
                  </div>
                ) : (
                  /* Signup Form */
                  <div className="auth-form signup-form">
                    <h3>Create Account</h3>
                    <p>Join thousands of SofAi users</p>
                    
                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Username</label>
                      <input
                        type="text"
                        placeholder="Choose your username"
                        value={signupData.username}
                        onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Gender</label>
                      <select 
                        value={signupData.gender}
                        onChange={(e) => setSignupData({ ...signupData, gender: e.target.value })}
                      >
                        <option value="not-specified">Prefer not to say</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Confirm Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={signupData.confirmPassword}
                        onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                      />
                    </div>

                    <div className="terms-checkbox">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={signupData.acceptTerms}
                        onChange={(e) => setSignupData({ ...signupData, acceptTerms: e.target.checked })}
                      />
                      <label htmlFor="terms">
                        I agree to the <span className="terms-link">Terms & Conditions</span> and <span className="terms-link">Privacy Policy</span>
                      </label>
                    </div>

                    <button 
                      className="auth-submit-btn"
                      onClick={handleSignup}
                    >
                      Create Account
                    </button>

                    <p className="auth-footer">
                      Already have an account? <span onClick={() => setIsLoginTab(true)} style={{ cursor: 'pointer', color: '#667eea', fontWeight: '600' }}>Sign in</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Command Agent Modal */}
      {showCommandAgent && (
        <div className="modal-overlay" onClick={() => setShowCommandAgent(false)}>
          <div className="command-agent-modal" onClick={(e) => e.stopPropagation()}>
            <div className="command-agent-modal-header">
              <h2>🤖 SofAi Command Agent</h2>
              <button onClick={() => setShowCommandAgent(false)} className="close-btn">×</button>
            </div>
            <div className="command-agent-modal-body">
              <CommandControl />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}