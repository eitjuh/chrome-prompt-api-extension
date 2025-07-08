# 🧠 Universal AI Assistant Sidebar - Implementation Plan

## Project Overview
A powerful MV3 Chrome Extension that provides AI assistance on any webpage through a collapsible sidebar using the Chrome Prompt API with Gemini Nano.

## ⚠️ Important Prerequisites
- **Early Preview Program**: Users must join the [Chrome Built-in AI Early Preview Program](https://developer.chrome.com/docs/ai/join-epp) to access these APIs
- **Hardware Requirements**:
  - Windows 10/11, macOS 13+, or Linux (no mobile support yet)
  - At least 22 GB storage on Chrome profile volume
  - GPU with >4 GB VRAM
  - Unlimited/unmetered internet connection
- **Chrome Version**: Chrome 138+ for full feature support
- **Model Download**: Gemini Nano downloads separately (~2GB) on first use

## Core Features

### 🎯 Main Functionality
- [ ] **Collapsible AI Sidebar**: Toggleable sidebar on any webpage
- [ ] **Hotkey Toggle**: Keyboard shortcut to show/hide sidebar (Alt+A)
- [ ] **Contextual Page Analysis**: Auto-detect content type and suggest relevant AI actions
- [ ] **Selection-Aware Prompts**: Right-click or hotkey actions for selected text
- [ ] **Prompt History**: Remember and revisit previous AI interactions
- [ ] **Smart Templates**: Pre-built prompt templates for common tasks

### 🔧 Technical Implementation

#### Phase 1: Core Extension Setup
- [x] **Manifest V3 Configuration**
  - [x] Basic manifest.json with required permissions
  - [x] Service worker registration
  - [x] Content script injection
  - [x] Host permissions for all websites

- [x] **Extension Architecture**
  - [x] Background service worker (`background.js`)
  - [x] Content script for sidebar injection (`content.js`)
  - [x] Sidebar HTML/CSS/JS (`sidebar.html`, `sidebar.css`, `sidebar.js`)
  - [x] Options page for settings (`options.html`)

#### Phase 2: UI/UX Implementation
- [x] **Sidebar Design**
  - [x] Responsive, collapsible sidebar
  - [x] Modern, clean interface
  - [x] Dark/light theme support
  - [x] Smooth animations and transitions
  - [x] Mobile-friendly responsive design

- [x] **Sidebar Components**
  - [x] Header with close/minimize buttons
  - [x] Context detection display
  - [x] Prompt input area with smart suggestions
  - [x] Action buttons (Summarize, Explain, etc.)
  - [x] History panel
  - [x] Settings toggle

#### Phase 3: AI Integration
- [x] **Chrome Prompt API Integration**
  - [x] Model availability detection (`unavailable`, `downloadable`, `downloading`, `available`)
  - [x] Handle model download process with user consent
  - [x] Session creation and management with proper lifecycle
  - [x] Session cloning for performance optimization
  - [x] Error handling for quota limits and API failures
  - [x] Graceful degradation when API unavailable
  - [ ] Multimodal support (text + audio/image inputs) - future enhancement

- [x] **Model State Management**
  - [x] Monitor model availability state changes
  - [x] Handle automatic model updates
  - [x] Provide user feedback during model download
  - [x] Cache session capabilities for performance

- [x] **Content Analysis**
  - [x] Page content extraction with size limits
  - [x] Content type detection (article, code, forum, email, etc.)
  - [x] Selected text handling with context preservation
  - [x] Context-aware prompt suggestions based on content type

#### Phase 4: Smart Features
- [x] **Content Type Detection**
  - [x] Article/blog detection → "Summarize", "TL;DR", "Key Points"
  - [x] Code detection → "Explain code", "Find bugs", "Add comments"
  - [x] Forum/discussion → "Summarize thread", "Key arguments"
  - [x] Email → "Improve tone", "Make formal/casual"
  - [x] Documentation → "Simplify", "Examples", "Quick reference"

- [x] **Selection-Aware Actions**
  - [x] Right-click context menu integration
  - [x] Hotkey shortcuts for selected text
  - [x] Smart action suggestions based on selection
  - [x] Multi-selection support

#### Phase 5: Advanced Features
- [ ] **Prompt Templates & History**
  - [ ] Built-in prompt templates library
  - [ ] Custom template creation
  - [ ] Per-domain history storage
  - [ ] Search through history
  - [ ] Export/import history

- [ ] **Smart Autocomplete (Optional)**
  - [ ] Textarea detection and enhancement
  - [ ] Context-aware suggestions
  - [ ] User prompt templates integration
  - [ ] Toggle-able feature

#### Phase 6: Performance & Polish
- [ ] **Performance Optimization**
  - [ ] Lazy loading of sidebar components
  - [ ] Efficient content extraction
  - [ ] Caching strategies
  - [ ] Memory management

- [ ] **Error Handling & Fallbacks**
  - [ ] Graceful degradation when API unavailable
  - [ ] User-friendly error messages
  - [ ] Retry mechanisms
  - [ ] Offline capability indicators

## File Structure
```
chrome-prompt-api-extension/
├── manifest.json              # MV3 manifest
├── background.js              # Service worker
├── content.js                 # Content script
├── sidebar/
│   ├── sidebar.html          # Sidebar UI
│   ├── sidebar.css           # Sidebar styling
│   └── sidebar.js            # Sidebar logic
├── options/
│   ├── options.html          # Settings page
│   ├── options.css           # Settings styling
│   └── options.js            # Settings logic
├── assets/
│   ├── icons/               # Extension icons
│   └── templates/           # Prompt templates
├── utils/
│   ├── content-detector.js  # Content type detection
│   ├── prompt-api.js        # Prompt API wrapper
│   └── storage.js           # Storage utilities
└── README.md                # Documentation
```

## Key User Interactions

### 🔥 Primary Actions
1. **Alt+A** → Toggle sidebar
2. **Select text + Right-click** → Context menu with AI actions
3. **Select text + Ctrl+Alt+A** → Quick AI prompt
4. **Double-click sidebar icon** → Page summary
5. **Type in prompt area** → Smart suggestions appear

### 🎨 Smart Action Examples
- **On GitHub**: "Explain this code", "Review PR", "Summarize issue"
- **On Articles**: "TL;DR", "Key takeaways", "Simplify language"
- **On Documentation**: "Show examples", "Explain simply", "Create cheat sheet"
- **On Forums**: "Summarize discussion", "Extract solutions", "Find consensus"
- **On Email**: "Improve tone", "Make professional", "Shorten"

## Success Metrics
- [ ] **Functionality**: All core features working smoothly
- [ ] **Performance**: Sidebar loads in <500ms
- [ ] **Usability**: Intuitive UX with minimal learning curve
- [ ] **Reliability**: Proper error handling and fallbacks
- [ ] **Compatibility**: Works across major websites

## Development Priorities
1. **MVP (Minimum Viable Product)**: Basic sidebar with summarization
2. **Core Features**: Selection-aware prompts and templates
3. **Advanced Features**: Smart autocomplete and history
4. **Polish**: Performance optimization and error handling

## Technical Considerations

### Chrome Prompt API Specific
- **Model Availability**: Handle all states (`unavailable`, `downloadable`, `downloading`, `available`)
- **Session Management**: Create sessions responsibly, use cloning for performance
- **Quota Limits**: Handle rate limiting and quota exceeded errors gracefully
- **Context Length**: Respect maximum context length limits (varies by model)
- **Performance**: Sessions run on-device but can be resource-intensive
- **Privacy**: All processing happens locally on-device (no data sent to servers)

### General Extension Considerations
- **Permissions**: Balance functionality with privacy
- **Performance**: Minimize impact on page load times
- **Compatibility**: Test across various website layouts
- **Security**: Secure handling of user data and AI responses
- **Accessibility**: Ensure keyboard navigation and screen reader support
- **Storage**: Manage local storage for history and preferences efficiently

---

**Next Steps**: Start with Phase 1 (Core Extension Setup) and build incrementally, testing each feature thoroughly before moving to the next phase.