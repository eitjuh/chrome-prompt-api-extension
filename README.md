# 🧠 Universal AI Assistant Sidebar

A powerful Chrome Extension that brings AI assistance to every webpage through a beautiful, collapsible sidebar. Built with Chrome's cutting-edge Prompt API and Gemini Nano for fast, private, on-device AI processing.

## ✨ Features

### 🚀 Core Functionality
- **Collapsible AI Sidebar**: Elegant sidebar that works on any website
- **Contextual Intelligence**: Auto-detects content type (code, articles, forums, etc.)
- **Smart Quick Actions**: One-click summarization, explanation, and improvement
- **Selection-Aware Prompts**: Right-click any text for instant AI assistance
- **Hotkey Controls**: Quick access with Alt+A (toggle) and Ctrl+Alt+A (quick prompt)

### 🎯 Smart Content Detection
- **GitHub**: Code explanation, PR reviews, issue summaries
- **Articles**: TL;DR, key takeaways, language simplification
- **Documentation**: Examples, explanations, quick references
- **Forums**: Discussion summaries, solution extraction
- **Email**: Tone improvement, formality adjustments

### 🛡️ Privacy & Performance
- **100% Local Processing**: All AI runs on your device with Gemini Nano
- **No Data Transmission**: Your content never leaves your computer
- **Fast Response Times**: On-device processing for instant results
- **Lightweight**: Minimal impact on browser performance

## 📋 Prerequisites

⚠️ **Important**: This extension requires specific setup to function properly.

### System Requirements
- **Chrome 138+** or Chromium-based browser
- **Operating System**: Windows 10/11, macOS 13+, or Linux
- **Storage**: At least 22 GB free space on Chrome profile volume
- **Hardware**: GPU with 4+ GB VRAM
- **Internet**: Unlimited/unmetered connection (for model download)

### Required Setup
1. **Join the Early Preview Program**:
   - Visit: https://developer.chrome.com/docs/ai/join-epp
   - Sign up for Chrome Built-in AI Early Preview Program
   - Wait for approval (may take time)

2. **Enable AI Features**:
   - Go to `chrome://flags/`
   - Enable `#optimization-guide-on-device-model`
   - Enable `#prompt-api-for-gemini-nano`
   - Restart Chrome

## 🚀 Installation

### Option 1: Chrome Web Store (Coming Soon)
*Extension will be available on Chrome Web Store once out of preview*

### Option 2: Developer Mode (Current)
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (top-right toggle)
4. Click "Load unpacked" and select the extension folder
5. The extension icon should appear in your toolbar

## 🎮 Usage

### Getting Started
1. **Check AI Status**: Click the extension icon to open settings and verify AI availability
2. **First Use**: If prompted, allow the AI model to download (~2GB)
3. **Open Sidebar**: Press `Alt+A` or visit any webpage and use the extension

### Basic Usage
- **Toggle Sidebar**: Press `Alt+A` or click the extension icon
- **Quick Summarize**: Click "Summarize Page" for instant page summary
- **Text Selection**: Select any text and right-click for AI actions
- **Custom Prompts**: Type your own questions in the prompt area

### Advanced Features
- **Context Menu**: Right-click selected text for quick AI actions
- **Smart Templates**: Actions automatically adapt to content type
- **History**: Access previous AI interactions (if enabled in settings)
- **Keyboard Shortcuts**: Use `Ctrl+Alt+A` for quick prompts on selected text

## ⚙️ Settings

Access settings by clicking the extension icon in the toolbar.

### General Settings
- **Enable Extension**: Turn the extension on/off globally
- **Auto-show Sidebar**: Automatically show sidebar on new pages
- **Theme**: Choose between light, dark, or auto (system) theme

### Data Management
- **Save History**: Toggle prompt history saving
- **Clear History**: Remove all stored AI interactions
- **Export Data**: Download your settings and history as JSON

## 🔧 Technical Details

### Architecture
- **Manifest V3**: Modern Chrome extension architecture
- **Service Worker**: Background processing for context menus and shortcuts
- **Content Script**: Sidebar injection and page analysis
- **Chrome Prompt API**: Direct integration with Gemini Nano

### API Integration
The extension uses Chrome's experimental Prompt API:
- **Model**: Gemini Nano (runs locally on device)
- **Session Management**: Efficient session creation and reuse
- **Error Handling**: Graceful degradation when AI unavailable
- **Performance**: Optimized for minimal resource usage

### Privacy & Security
- **Local Processing**: All AI processing happens on your device
- **No External Servers**: No data sent to external AI services
- **Secure Storage**: Settings and history stored locally in Chrome
- **Minimal Permissions**: Only necessary permissions requested

## 🐛 Troubleshooting

### AI Not Available
- **Check EPP Status**: Ensure you're enrolled in Early Preview Program
- **Verify Chrome Version**: Must be Chrome 138 or later
- **Check Hardware**: Ensure GPU meets minimum requirements
- **Storage Space**: Verify 22+ GB free space for model download

### Extension Not Working
- **Reload Extension**: Go to `chrome://extensions/` and reload
- **Check Permissions**: Ensure all required permissions are granted
- **Clear Cache**: Clear browser cache and restart Chrome
- **Developer Console**: Check browser console for error messages

### Performance Issues
- **Close Unused Tabs**: AI model uses device resources
- **Check Memory**: Ensure sufficient RAM available
- **Restart Chrome**: Fresh start can resolve resource conflicts

## 📊 Compatibility

### Supported Websites
- ✅ **GitHub**: Code repositories, issues, PRs
- ✅ **Stack Overflow**: Q&A, code solutions
- ✅ **Medium/Blogs**: Articles, tutorials
- ✅ **Documentation Sites**: Technical docs, guides
- ✅ **News Sites**: Articles, reports
- ✅ **Reddit**: Discussions, threads
- ✅ **Gmail**: Email composition (basic)
- ✅ **General Web**: Any HTML content

### Browser Support
- ✅ **Chrome 138+**: Full support
- ✅ **Chromium-based**: Edge, Brave, Opera (with EPP)
- ❌ **Firefox**: Not supported (no Prompt API)
- ❌ **Safari**: Not supported (no Prompt API)

## 🔄 Updates & Roadmap

### Current Version: 1.0.0
- ✅ Basic sidebar functionality
- ✅ Content type detection
- ✅ Quick actions (summarize, explain, improve)
- ✅ Context menu integration
- ✅ Settings page
- ✅ Chrome Prompt API integration

### Upcoming Features
- 🔄 **History Management**: Advanced history search and organization
- 🔄 **Custom Templates**: User-defined prompt templates
- 🔄 **Multimodal Support**: Audio and image inputs
- 🔄 **Floating Actions**: Contextual action buttons for selections
- 🔄 **Smart Autocomplete**: AI-powered text completion in forms

## 🤝 Contributing

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Development Setup
1. Clone the repository
2. Load as unpacked extension in Chrome
3. Make changes to source files
4. Reload extension to test changes

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Chrome Team**: For the innovative Prompt API and Gemini Nano
- **Google**: For making on-device AI accessible to developers
- **Community**: For testing and feedback during development

## 📞 Support

- **Issues**: Report bugs on GitHub Issues
- **Documentation**: Chrome Prompt API docs
- **Community**: Join discussions in GitHub Discussions

---

**Note**: This extension is experimental and requires Chrome's Early Preview Program enrollment. Features may change as the Prompt API evolves from preview to stable release.

Built with ❤️ for the AI-powered web.