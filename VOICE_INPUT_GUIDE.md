# Voice Input Feature - User Guide

## 🎤 Voice Input for Issue Reporting

The voice input feature allows you to dictate your issue description hands-free using speech recognition technology.

---

## ✨ Features

- **Real-time Speech-to-Text**: Speak naturally and see your words appear instantly
- **Continuous Recording**: The system will keep listening as long as you're speaking
- **Visual Feedback**: See live transcription while you speak
- **Error Handling**: Clear error messages if something goes wrong
- **Easy Controls**: Simple start/stop buttons

---

## 🚀 How to Use

### 1. Start Recording

1. Navigate to the **Report Issue** page (`/report`)
2. Scroll to the **Description** field
3. Click the **"Voice Input"** button (microphone icon)
4. **Allow microphone access** when prompted by your browser

### 2. While Recording

- Speak clearly and naturally into your microphone
- You'll see a blue overlay showing "Listening..." with a pulsing microphone icon
- Your speech will be transcribed in real-time
- The text automatically appears in the description field

### 3. Stop Recording

- Click the **"Stop Recording"** button (red with microphone-off icon)
- The transcription will stop and your text will remain in the description field

### 4. Clear Voice Input (Optional)

- After stopping, you can click **"Clear Voice Input"** to remove the transcribed text
- This allows you to start fresh if needed

---

## 🌐 Browser Compatibility

Voice input works in the following browsers:

✅ **Google Chrome** (Recommended)
✅ **Microsoft Edge**
✅ **Safari** (macOS/iOS)
✅ **Opera**

❌ **Firefox** - Limited support
❌ **Internet Explorer** - Not supported

**Note**: Voice recognition requires an **active internet connection** as it uses cloud-based speech recognition services.

---

## 🔧 Technical Details

### Requirements

- Modern web browser with Web Speech API support
- Microphone access permissions
- Active internet connection
- HTTPS connection (required for microphone access)

### How It Works

1. **Browser API**: Uses the Web Speech API (SpeechRecognition)
2. **Language**: Configured for English (en-US)
3. **Mode**: Non-continuous with auto-restart for stability
4. **Interim Results**: Shows live transcription as you speak
5. **Final Results**: Appends finalized text to your description

---

## 🐛 Troubleshooting

### Problem: "Microphone access denied"

**Solution**: 
1. Click the lock icon in your browser's address bar
2. Enable microphone permissions
3. Refresh the page and try again

### Problem: "Network error"

**Solution**:
- Check your internet connection
- Speech recognition requires cloud services
- Try refreshing the page

### Problem: "No speech detected"

**Solution**:
- Speak closer to your microphone
- Ensure your microphone is working
- Check if your microphone is muted
- Increase microphone volume in system settings

### Problem: Voice input not available

**Solution**:
- Switch to Google Chrome or Microsoft Edge
- Ensure you're using HTTPS (not HTTP)
- Update your browser to the latest version

### Problem: Recording stops unexpectedly

**Solution**:
- This is normal if there's a pause in speech
- The system auto-restarts to continue listening
- Just keep speaking naturally

---

## 💡 Tips for Best Results

1. **Speak Clearly**: Enunciate words for better accuracy
2. **Minimize Background Noise**: Find a quiet environment
3. **Use Good Microphone**: Built-in laptop mics work, but external mics are better
4. **Pause Between Thoughts**: Short pauses help the system process
5. **Review and Edit**: Always review the transcription for accuracy
6. **Punctuation**: Say "period", "comma", "question mark" for punctuation

---

## 🎯 Example Usage Workflow

### Reporting a Pothole Issue:

1. Click **Voice Input** button
2. Allow microphone access
3. Speak: "I want to report a large pothole on Main Street near the traffic light. The pothole is approximately two feet wide and six inches deep. It's causing vehicles to swerve dangerously. I first noticed it three days ago after the heavy rain."
4. Click **Stop Recording**
5. Review the transcribed text in the description field
6. Make any necessary edits
7. Complete the rest of the form and submit

---

## 🔒 Privacy & Security

- **No Recording Storage**: Your voice is not stored anywhere
- **Real-time Processing**: Speech is converted to text immediately
- **Cloud Processing**: Uses browser's built-in speech recognition (Google/Apple services)
- **Secure Connection**: Requires HTTPS for security
- **Permission Based**: Only works after you explicitly grant microphone access

---

## 📱 Mobile Support

Voice input works on mobile devices:

- **iOS Safari**: Full support
- **Android Chrome**: Full support
- **Mobile browsers**: Check compatibility with Web Speech API

**Tip**: Use voice input on mobile to avoid typing on small screens!

---

## 🆘 Support

If you continue to experience issues:

1. Check the browser console for detailed error messages
2. Ensure your browser is up to date
3. Try using Google Chrome for best compatibility
4. Contact support if problems persist

---

## 🎨 Visual Indicators

### Blue Overlay - Listening
```
🎤 Listening...
[Your transcribed text appears here]
```

### Red Overlay - Error
```
⚠️ [Error message]
```

### Button States
- **Default**: Gray "Voice Input" button with microphone icon
- **Recording**: Red "Stop Recording" button with microphone-off icon

---

## ⚙️ Advanced Features

### Auto-Restart
The system automatically restarts listening after brief pauses, creating a seamless continuous experience without the instability of truly continuous mode.

### Interim Results
See your words appear in real-time as you speak, even before they're finalized.

### Error Recovery
The system gracefully handles network issues, permission problems, and other errors with helpful messages.

---

## 📊 Supported Languages

Currently configured for:
- **English (US)** - en-US

Future updates may include additional language support.

---

## 🔄 Version Information

- **Feature Version**: 1.0.0
- **Last Updated**: January 2025
- **Browser API**: Web Speech API (SpeechRecognition)

---

## 📝 Notes

- Voice input is a **convenience feature** - you can always type manually
- The transcription may not be 100% accurate - always review your text
- Punctuation and formatting may require manual editing
- Works best in quiet environments with clear speech

---

**Happy Reporting! 🎉**

Use voice input to make reporting civic issues faster and more convenient!