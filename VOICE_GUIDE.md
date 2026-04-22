# Voice Detection & Input Guide

## Overview

SofAI now includes professional-grade voice detection and text-to-speech capabilities, similar to ChatGPT.

## Features

### 🎤 Voice Input
- **Real-time Speech Recognition**: Automatically converts your speech to text as you speak
- **Interim Results**: See your words appearing in real-time before finalization
- **Confidence Scoring**: Visual indicator showing how confident the system is in the transcription
- **Auto-stop**: Automatically stops listening after 3 seconds of silence
- **Multi-language Support**: Set language preference (default: English US)

### 🔊 Text-to-Speech
- **Auto Voice Output**: Responses can be automatically spoken aloud
- **Customizable Voice Settings**:
  - Speech Rate (0.5x - 2x)
  - Pitch (0.5 - 2.0)
  - Volume (0 - 1.0)
- **Voice Selection**: Choose from available system voices

### 🎯 Wake Word Detection (Coming Soon)
- Listen for "Hey SofAi" to automatically start recording
- Continuous listening in background
- Smart command processing

## How to Use

### Basic Voice Input

1. **Click the microphone button** 🎤 in the chat interface
2. **Speak clearly** into your microphone
3. **Watch the waveform** animate as you speak
4. **Stop automatically** after 3 seconds of silence, or click 🎙️ to stop manually

### Visual Feedback

- **🎤 → 🎙️**: Button changes when listening is active
- **Listening indicator**: Shows "Listening..." with blinking dot when recording
- **Waveform visualization**: Animated bars showing audio levels
- **Confidence bar**: Green bar showing accuracy of transcription
- **Real-time transcript**: See your words appear as you speak

### Using with Chat

```javascript
import VoiceInput from './VoiceInput';

// In your component
<VoiceInput 
  onTranscript={(text) => {
    // This is called when speech is finalized
    setInput(text);
  }}
  autoSpeak={true}  // Auto-speak responses
/>
```

## Voice Service API

### Initialize
```javascript
import VoiceService from './voiceService';

const voiceService = new VoiceService();
voiceService.initialize();
```

### Start Listening
```javascript
voiceService.start();
```

### Stop Listening
```javascript
voiceService.stop();
```

### Get Transcript
```javascript
const transcript = voiceService.getTranscript();
console.log(transcript.final);      // Final recognized text
console.log(transcript.interim);    // Real-time interim text
console.log(transcript.confidence); // Confidence score (0-1)
```

### Text-to-Speech
```javascript
voiceService.speak("Hello, how can I help you?", {
  rate: 1.0,    // Speech speed
  pitch: 1.0,   // Voice pitch
  volume: 1.0   // Volume level
});

// Stop speaking
voiceService.stopSpeaking();
```

### Event Callbacks
```javascript
voiceService.on('start', () => {
  console.log('Started listening');
});

voiceService.on('interim', (data) => {
  console.log('Interim:', data.transcript);
});

voiceService.on('finalResult', (data) => {
  console.log('Final:', data.transcript, 'Confidence:', data.confidence);
});

voiceService.on('end', () => {
  console.log('Stopped listening');
});

voiceService.on('error', (error) => {
  console.error('Error:', error);
});
```

## Configuration

```javascript
voiceService.setConfig({
  language: 'en-US',           // Language code
  continuous: true,            // Keep listening
  interimResults: true,        // Show interim results
  silenceTimeout: 3000,        // Auto-stop after silence (ms)
  confidenceThreshold: 0.5,    // Minimum confidence (0-1)
  autoRestart: true           // Auto-restart on errors
});
```

## Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Best support |
| Edge | ✅ Full | Best support |
| Safari | ✅ Full | iOS 14.5+ |
| Firefox | ⚠️ Limited | webkitSpeechRecognition |
| Opera | ✅ Full | Based on Chrome |

## Troubleshooting

### No Sound / Microphone Not Working
- Check browser microphone permissions
- Ensure microphone is connected and working
- Try refreshing the page

### Poor Recognition Accuracy
- Speak more clearly and at normal pace
- Reduce background noise
- Check microphone volume levels
- Ensure "English US" is selected if speaking English

### Not Supported Message
- Use Chrome, Edge, or Safari browser
- Update your browser to the latest version
- Check if another app is using the microphone

## Tips for Best Results

1. **Position microphone** 6-8 inches from your mouth
2. **Speak naturally** - Don't rush or over-enunciate
3. **Minimize background noise** - Close windows, turn off fans
4. **Use a quality microphone** - Built-in mics work but external are better
5. **Pause briefly** between sentences
6. **Test first** - Try simple commands like numbers or dates

## Performance Optimization

- Interim results update in real-time (no lag)
- Automatic silence detection (saves bandwidth)
- Efficient transcript concatenation
- Error recovery with auto-restart
- Memory cleanup on component unmount

## Future Enhancements

- [ ] Custom wake word support
- [ ] Multi-language switching
- [ ] Voice sample recording/playback
- [ ] Speaker identification
- [ ] Emotion detection
- [ ] Command history/analytics
- [ ] Offline speech recognition

## Security & Privacy

- Voice data is **not stored** on SofAI servers
- Speech recognition happens **in your browser**
- Browser sends text transcript to API, not audio
- Full compliance with privacy regulations

---

**Questions or Issues?** Check the [GitHub Issues](https://github.com/cyrilsofdevpro/SofAi/issues) or create a new issue!