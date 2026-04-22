/**
 * Enhanced Voice Recognition Service
 * Provides ChatGPT-like voice detection and text-to-speech functionality
 */

class VoiceService {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.isSpeaking = false;
    this.transcript = '';
    this.interimTranscript = '';
    this.confidence = 0;
    this.callbacks = {
      onStart: null,
      onEnd: null,
      onResult: null,
      onError: null,
      onInterim: null,
      onFinalResult: null
    };
    this.config = {
      language: 'en-US',
      continuous: true,
      interimResults: true,
      maxAlternatives: 1,
      autoRestart: true,
      silenceTimeout: 3000,
      confidenceThreshold: 0.5
    };
    this.silenceTimer = null;
  }

  /**
   * Initialize Voice Recognition
   */
  initialize() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Speech Recognition API not supported');
      return false;
    }

    this.recognition = new SpeechRecognition();
    this.setupRecognitionHandlers();
    return true;
  }

  /**
   * Setup all event handlers for speech recognition
   */
  setupRecognitionHandlers() {
    const r = this.recognition;

    r.continuous = this.config.continuous;
    r.interimResults = this.config.interimResults;
    r.maxAlternatives = this.config.maxAlternatives;
    r.lang = this.config.language;

    // Start listening
    r.onstart = () => {
      this.isListening = true;
      this.clearSilenceTimer();
      this.callbacks.onStart?.();
    };

    // Handle results in real-time
    r.onresult = (event) => {
      this.interimTranscript = '';
      let interimConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence;

        if (event.results[i].isFinal) {
          this.transcript += transcript + ' ';
          this.confidence = confidence;
          this.callbacks.onFinalResult?.({
            transcript: this.transcript.trim(),
            confidence,
            isFinal: true
          });
        } else {
          this.interimTranscript += transcript;
          interimConfidence = confidence;
        }
      }

      // Callback for interim results
      if (this.interimTranscript) {
        this.callbacks.onInterim?.({
          transcript: this.interimTranscript,
          confidence: interimConfidence,
          isFinal: false
        });
      }

      // Reset silence timer on result
      this.resetSilenceTimer();

      // Combined result callback
      this.callbacks.onResult?.({
        interim: this.interimTranscript,
        final: this.transcript.trim(),
        confidence: this.confidence,
        isFinal: this.interimTranscript === ''
      });
    };

    // Handle errors
    r.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.callbacks.onError?.(event.error);

      // Auto-restart on recoverable errors
      if (
        this.config.autoRestart &&
        (event.error === 'no-speech' || event.error === 'audio-capture')
      ) {
        setTimeout(() => {
          if (this.isListening) {
            this.start();
          }
        }, 1000);
      }
    };

    // Stop listening
    r.onend = () => {
      this.isListening = false;
      this.clearSilenceTimer();
      this.callbacks.onEnd?.();
    };
  }

  /**
   * Start listening for voice input
   */
  start() {
    if (!this.recognition) {
      this.initialize();
    }

    if (this.isListening) return;

    this.transcript = '';
    this.interimTranscript = '';
    this.confidence = 0;

    try {
      this.recognition.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
    }
  }

  /**
   * Stop listening
   */
  stop() {
    if (!this.isListening) return;

    this.clearSilenceTimer();
    try {
      this.recognition.stop();
    } catch (error) {
      console.error('Error stopping recognition:', error);
    }
  }

  /**
   * Abort listening immediately
   */
  abort() {
    this.clearSilenceTimer();
    try {
      this.recognition?.abort();
    } catch (error) {
      console.error('Error aborting recognition:', error);
    }
  }

  /**
   * Reset silence timer for auto-stop
   */
  resetSilenceTimer() {
    this.clearSilenceTimer();
    this.silenceTimer = setTimeout(() => {
      if (this.isListening) {
        this.stop();
      }
    }, this.config.silenceTimeout);
  }

  /**
   * Clear silence timer
   */
  clearSilenceTimer() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  /**
   * Get current transcript
   */
  getTranscript() {
    return {
      final: this.transcript.trim(),
      interim: this.interimTranscript,
      combined: (this.transcript + this.interimTranscript).trim(),
      confidence: this.confidence
    };
  }

  /**
   * Clear transcript
   */
  clearTranscript() {
    this.transcript = '';
    this.interimTranscript = '';
  }

  /**
   * Text-to-Speech functionality (ChatGPT-like)
   */
  speak(text, options = {}) {
    const defaultOptions = {
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      language: this.config.language
    };

    const settings = { ...defaultOptions, ...options };

    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;
    utterance.lang = settings.language;

    utterance.onstart = () => {
      this.isSpeaking = true;
    };

    utterance.onend = () => {
      this.isSpeaking = false;
    };

    utterance.onerror = (error) => {
      console.error('Speech synthesis error:', error);
      this.isSpeaking = false;
    };

    this.synthesis.speak(utterance);
  }

  /**
   * Stop speaking
   */
  stopSpeaking() {
    this.synthesis.cancel();
    this.isSpeaking = false;
  }

  /**
   * Get available voices
   */
  getAvailableVoices() {
    return this.synthesis.getVoices();
  }

  /**
   * Set voice for text-to-speech
   */
  setVoice(voiceIndex) {
    const voices = this.getAvailableVoices();
    if (voiceIndex >= 0 && voiceIndex < voices.length) {
      return voices[voiceIndex];
    }
    return voices[0];
  }

  /**
   * Register callback handlers
   */
  on(event, callback) {
    if (this.callbacks.hasOwnProperty(`on${event.charAt(0).toUpperCase() + event.slice(1)}`)) {
      this.callbacks[`on${event.charAt(0).toUpperCase() + event.slice(1)}`] = callback;
    }
  }

  /**
   * Unregister callback
   */
  off(event) {
    if (this.callbacks.hasOwnProperty(`on${event.charAt(0).toUpperCase() + event.slice(1)}`)) {
      this.callbacks[`on${event.charAt(0).toUpperCase() + event.slice(1)}`] = null;
    }
  }

  /**
   * Update configuration
   */
  setConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    if (this.recognition) {
      this.setupRecognitionHandlers();
    }
  }

  /**
   * Check if browser supports speech recognition
   */
  static isSupported() {
    return !!(
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      window.mozSpeechRecognition ||
      window.msSpeechRecognition
    );
  }

  /**
   * Check if browser supports speech synthesis
   */
  static isSynthesisSupported() {
    return !!window.speechSynthesis;
  }
}

export default VoiceService;