import { useState, useEffect, useRef } from 'react';
import VoiceService from './voiceService';
import './VoiceInput.css';

export default function VoiceInput({ onTranscript, autoSpeak = true }) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [listening, setListening] = useState(false);
  const voiceServiceRef = useRef(null);
  const [waveformActive, setWaveformActive] = useState(false);

  useEffect(() => {
    // Initialize voice service
    if (VoiceService.isSupported()) {
      voiceServiceRef.current = new VoiceService();

      // Setup callbacks
      voiceServiceRef.current.on('start', () => {
        setIsListening(true);
        setWaveformActive(true);
      });

      voiceServiceRef.current.on('end', () => {
        setIsListening(false);
        setWaveformActive(false);
      });

      voiceServiceRef.current.on('interim', (data) => {
        setInterimTranscript(data.transcript);
      });

      voiceServiceRef.current.on('finalResult', (data) => {
        setTranscript(data.transcript);
        setConfidence(data.confidence);
      });

      voiceServiceRef.current.on('result', (data) => {
        if (data.isFinal && data.final) {
          onTranscript?.(data.final);
        }
      });

      voiceServiceRef.current.on('error', (error) => {
        console.error('Voice error:', error);
      });
    }

    return () => {
      if (voiceServiceRef.current) {
        voiceServiceRef.current.stop();
      }
    };
  }, [onTranscript]);

  const toggleListening = () => {
    if (isListening) {
      voiceServiceRef.current?.stop();
    } else {
      setTranscript('');
      setInterimTranscript('');
      voiceServiceRef.current?.start();
    }
  };

  const speakText = (text) => {
    if (VoiceService.isSynthesisSupported() && text) {
      setIsSpeaking(true);
      voiceServiceRef.current?.speak(text, {
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0
      });
      setTimeout(() => setIsSpeaking(false), 3000);
    }
  };

  const combinedTranscript = (transcript + interimTranscript).trim();

  return (
    <div className="voice-input-container">
      {/* Listening Indicator */}
      {isListening && (
        <div className="listening-indicator">
          <div className="listening-dot"></div>
          <span>Listening...</span>
        </div>
      )}

      {/* Waveform Visualization */}
      {waveformActive && (
        <div className="waveform-container">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="waveform-bar" style={{
              animationDelay: `${i * 0.1}s`
            }}></div>
          ))}
        </div>
      )}

      {/* Transcript Display */}
      {combinedTranscript && (
        <div className="transcript-display">
          <div className="transcript-text">
            <span className="final-text">{transcript}</span>
            {interimTranscript && (
              <span className="interim-text">{interimTranscript}</span>
            )}
          </div>
          {confidence > 0 && (
            <div className="confidence-bar">
              <div 
                className="confidence-fill" 
                style={{ width: `${confidence * 100}%` }}
              ></div>
            </div>
          )}
        </div>
      )}

      {/* Control Buttons */}
      <div className="voice-controls">
        <button
          className={`voice-btn main-btn ${isListening ? 'active' : ''}`}
          onClick={toggleListening}
          title={isListening ? 'Stop listening' : 'Start listening'}
        >
          {isListening ? '🎙️' : '🎤'}
          <span>{isListening ? 'Listening' : 'Click to speak'}</span>
        </button>

        {combinedTranscript && (
          <button
            className={`voice-btn speak-btn ${isSpeaking ? 'active' : ''}`}
            onClick={() => speakText(combinedTranscript)}
            disabled={isSpeaking}
            title="Speak the text"
          >
            🔊
            <span>{isSpeaking ? 'Speaking' : 'Speak'}</span>
          </button>
        )}

        {combinedTranscript && (
          <button
            className="voice-btn clear-btn"
            onClick={() => {
              setTranscript('');
              setInterimTranscript('');
              onTranscript?.('');
            }}
            title="Clear transcript"
          >
            ✕
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Support Message */}
      {!VoiceService.isSupported() && (
        <div className="voice-warning">
          ⚠️ Voice input not supported in your browser. Please use Chrome, Edge, or Safari.
        </div>
      )}
    </div>
  );
}