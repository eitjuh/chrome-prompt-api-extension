// Form Helper module for intelligent form assistance
class FormHelperManager {
  constructor() {
    this.detectedForms = [];
    this.activeFormElements = new Set();
    this.formOverlays = new Map();
  }

  // Initialize form detection and monitoring
  initialize() {
    console.log('🚀 FormHelper initialize() called');
    this.detectForms();
    this.setupFormEventListeners();
    this.setupDynamicFormObserver();
    console.log('🔧 Form Helper initialized with', this.detectedForms.length, 'forms');
    console.log('🔧 FormHelper instance added to window.aiAssistant?.formHelper');
    
    // Re-scan for ChatGPT elements after a delay since they might load dynamically
    setTimeout(() => {
      console.log('🔄 Re-scanning for ChatGPT elements after delay...');
      this.detectForms();
      
      // Check again for ChatGPT elements
      const proseMirrorElements = document.querySelectorAll('.ProseMirror');
      const promptTextareas = document.querySelectorAll('#prompt-textarea');
      console.log('🔍 Delayed scan found:');
      console.log('  - .ProseMirror:', proseMirrorElements.length);
      console.log('  - #prompt-textarea:', promptTextareas.length);
      
      if (proseMirrorElements.length > 0 || promptTextareas.length > 0) {
        console.log('✅ ChatGPT elements found on delayed scan!');
      }
    }, 2000); // Wait 2 seconds for ChatGPT to fully load
  }

  // Detect all forms on the page
  detectForms() {
    console.log('🔍 detectForms() called');
    const forms = document.querySelectorAll('form');
    console.log('📋 Found', forms.length, 'forms');
    // Include contenteditable divs (used by Twitter, Facebook, LinkedIn, ChatGPT, etc.)
    // Expanded query to catch more modern input patterns
    const standaloneInputs = document.querySelectorAll(`
      input:not([type="hidden"]):not([type="submit"]):not([type="button"]), 
      textarea, 
      select, 
      [contenteditable="true"], 
      [contenteditable=""], 
      [role="textbox"],
      [data-placeholder],
      .msg-form__contenteditable,
      .msg-form__placeholder,
      .ql-editor,
      .public-DraftEditor-content,
      .editor-content,
      .ProseMirror,
      .prosemirror,
      [class*="message-editor"],
      [class*="compose-text"],
      [class*="messaging-text"],
      #prompt-textarea,
      [id*="prompt-textarea"],
      [data-type="unified-composer"] [contenteditable],
      div[aria-label*="message" i],
      div[aria-label*="reply" i],
      div[aria-label*="write" i],
      div[aria-label*="compose" i]
    `.split(',').map(s => s.trim()).join(', '));
    
    console.log('📝 Found', standaloneInputs.length, 'standalone inputs');
    console.log('📝 ChatGPT specific elements found:');
    console.log('  - .ProseMirror:', document.querySelectorAll('.ProseMirror').length);
    console.log('  - #prompt-textarea:', document.querySelectorAll('#prompt-textarea').length);
    console.log('  - .ProseMirror[contenteditable="true"]:', document.querySelectorAll('.ProseMirror[contenteditable="true"]').length);
    
    // Form detection started
    
    this.detectedForms = [];
    
    // Process actual forms
    forms.forEach((form, index) => {
      const formData = this.analyzeForm(form, `form-${index}`);
      console.log(`- Form ${index} relevant:`, formData.isRelevant);
      if (formData.isRelevant) {
        this.detectedForms.push(formData);
        console.log('📝 Detected form:', formData.type, formData.purpose);
      }
    });

    // Process standalone inputs (like search boxes, comment fields)
    standaloneInputs.forEach((input, index) => {
      if (!input.closest('form')) {
        const inputData = this.analyzeStandaloneInput(input, `standalone-${index}`);
        console.log(`- Standalone ${index} (${input.tagName}) relevant:`, inputData.isRelevant);
        if (input.classList.contains('ProseMirror') || input.id === 'prompt-textarea') {
          console.log('🎯 ChatGPT input found in standalone processing:', input);
        }
        if (inputData.isRelevant) {
          this.detectedForms.push(inputData);
          console.log('📝 Detected standalone input:', inputData.type, inputData.purpose, input);
        }
      }
    });

    return this.detectedForms;
  }

  // Analyze a form to determine its type and purpose
  analyzeForm(form, id) {
    const inputs = form.querySelectorAll('input, textarea, select');
    const textareas = form.querySelectorAll('textarea');
    const action = form.action || '';
    const method = form.method || 'GET';
    
    const analysis = {
      id,
      element: form,
      type: this.detectFormType(form, inputs),
      purpose: this.detectFormPurpose(form, inputs),
      inputs: Array.from(inputs),
      textareas: Array.from(textareas),
      hasLongText: textareas.length > 0,
      action,
      method,
      isRelevant: this.isFormRelevant(form, inputs)
    };

    return analysis;
  }

  // Analyze standalone input elements
  analyzeStandaloneInput(input, id) {
    const type = input.type || input.tagName.toLowerCase();
    const purpose = this.detectInputPurpose(input);
    const isContentEditable = this.isContentEditable(input);
    const isTextarea = type === 'textarea' || isContentEditable;
    
    // Special handling for LinkedIn and other messaging inputs
    const isMessagingInput = input.classList.contains('msg-form__contenteditable') ||
                            input.getAttribute('role') === 'textbox' ||
                            input.getAttribute('aria-label')?.toLowerCase().includes('message');
    
    const result = {
      id,
      element: input,
      type: 'standalone',
      purpose,
      inputs: [input],
      textareas: isTextarea ? [input] : [],
      hasLongText: isTextarea,
      isRelevant: this.isInputRelevant(input) || isMessagingInput // Force relevance for messaging inputs
    };
    
    console.log('📋 Analyzed standalone input:', result);
    return result;
  }

  // Detect form type based on structure and attributes
  detectFormType(form, inputs) {
    const action = form.action?.toLowerCase() || '';
    const className = form.className?.toLowerCase() || '';
    const id = form.id?.toLowerCase() || '';
    
    // Check for specific patterns
    if (action.includes('login') || id.includes('login') || className.includes('login')) return 'login';
    if (action.includes('register') || action.includes('signup') || id.includes('signup')) return 'registration';
    if (action.includes('contact') || id.includes('contact') || className.includes('contact')) return 'contact';
    if (action.includes('search') || id.includes('search') || className.includes('search')) return 'search';
    if (action.includes('comment') || id.includes('comment') || className.includes('comment')) return 'comment';
    if (action.includes('review') || id.includes('review') || className.includes('review')) return 'review';
    if (action.includes('checkout') || action.includes('payment')) return 'checkout';
    
    // Check input types
    const inputTypes = Array.from(inputs).map(input => input.type || input.tagName.toLowerCase());
    if (inputTypes.includes('email') && inputTypes.includes('password')) return 'login';
    if (inputTypes.includes('email') && inputs.length > 3) return 'registration';
    if (inputs.length === 1 && inputTypes.includes('search')) return 'search';
    
    return 'general';
  }

  // Detect form purpose for AI assistance
  detectFormPurpose(form, inputs) {
    const labels = Array.from(form.querySelectorAll('label')).map(l => l.textContent?.toLowerCase() || '');
    const placeholders = Array.from(inputs).map(i => i.placeholder?.toLowerCase() || '');
    const allText = [...labels, ...placeholders].join(' ');
    
    if (allText.includes('message') || allText.includes('comment') || allText.includes('feedback')) {
      return 'message_composition';
    }
    if (allText.includes('review') || allText.includes('rating')) {
      return 'review_writing';
    }
    if (allText.includes('bio') || allText.includes('about') || allText.includes('description')) {
      return 'profile_description';
    }
    if (allText.includes('job') || allText.includes('application') || allText.includes('cover letter')) {
      return 'job_application';
    }
    if (allText.includes('support') || allText.includes('help') || allText.includes('issue')) {
      return 'support_request';
    }
    
    return 'general_text';
  }

  // Detect purpose for standalone inputs
  detectInputPurpose(input) {
    const placeholder = input.placeholder?.toLowerCase() || '';
    const dataPlaceholder = input.getAttribute('data-placeholder')?.toLowerCase() || '';
    const name = input.name?.toLowerCase() || '';
    const id = input.id?.toLowerCase() || '';
    const label = input.labels?.[0]?.textContent?.toLowerCase() || '';
    const ariaLabel = input.getAttribute('aria-label')?.toLowerCase() || '';
    const dataTestId = input.getAttribute('data-testid')?.toLowerCase() || '';
    const className = input.className?.toLowerCase() || '';
    
    // Check parent elements for additional context
    const parentText = input.closest('[class*="message"], [class*="msg-"], [class*="compose"]')?.className?.toLowerCase() || '';
    
    const allText = [placeholder, dataPlaceholder, name, id, label, ariaLabel, dataTestId, className, parentText].join(' ');
    
    // LinkedIn specific patterns
    if (className.includes('msg-form') || parentText.includes('msg-') || 
        allText.includes('write a message') || allText.includes('type a message')) return 'message';
    
    // ChatGPT specific
    if (allText.includes('ask anything') || allText.includes('message chatgpt') || 
        className.includes('prosemirror') || input.classList.contains('ProseMirror') ||
        input.id === 'prompt-textarea' || parentText.includes('unified-composer')) return 'ai_chat';
    
    // Twitter specific
    if (allText.includes('tweet') || allText.includes('what\'s happening') || 
        allText.includes('post your reply') || dataTestId.includes('tweettext')) return 'social_post';
    
    if (allText.includes('search')) return 'search';
    if (allText.includes('comment') || allText.includes('reply')) return 'comment';
    if (allText.includes('message') || allText.includes('chat')) return 'message';
    if (allText.includes('review')) return 'review';
    if (allText.includes('bio') || allText.includes('about')) return 'bio';
    
    return 'general_text';
  }

  // Check if form is relevant for AI assistance
  isFormRelevant(form, inputs) {
    // Skip if no inputs or only hidden/submit inputs
    const relevantInputs = Array.from(inputs).filter(input => 
      input.type !== 'hidden' && 
      input.type !== 'submit' && 
      input.type !== 'button'
    );
    
    if (relevantInputs.length === 0) return false;
    
    // Always include if has textarea
    if (form.querySelector('textarea')) return true;
    
    // Skip if form is too small (login forms, etc.) UNLESS it's a search form
    if (relevantInputs.length === 1) {
      const firstInput = relevantInputs[0];
      return firstInput.type === 'search' || 
             firstInput.placeholder?.toLowerCase().includes('search') ||
             firstInput.placeholder?.toLowerCase().includes('message');
    }
    
    // Include if has multiple text inputs
    return relevantInputs.length >= 2;
  }

  // Check if standalone input is relevant
  isInputRelevant(input) {
    const type = input.type || input.tagName.toLowerCase();
    
    // Always include textareas and contenteditable
    if (type === 'textarea' || this.isContentEditable(input)) return true;
    
    // Include ALL search inputs (they're usually important)
    if (type === 'search') return true;
    
    // LinkedIn, ChatGPT and messaging-specific checks
    if (input.classList.contains('msg-form__contenteditable') ||
        input.getAttribute('role') === 'textbox' ||
        input.getAttribute('aria-label')?.toLowerCase().includes('message') ||
        input.classList.contains('ProseMirror') ||
        input.id === 'prompt-textarea' ||
        input.closest('[data-type="unified-composer"]')) {
      console.log('✅ LinkedIn/ChatGPT/messaging input detected as relevant');
      return true;
    }
    
    // Include text inputs that seem to be for longer content
    if (type === 'text' || type === 'email') {
      const placeholder = input.placeholder?.toLowerCase() || '';
      const name = input.name?.toLowerCase() || '';
      const size = input.size || 20;
      
      // Include if it looks like a message/comment field or is large
      return size > 30 ||
             placeholder.includes('comment') || 
             placeholder.includes('message') ||
             placeholder.includes('tweet') ||
             placeholder.includes('post') ||
             placeholder.includes('write') ||
             placeholder.includes('type') ||
             name.includes('comment') ||
             name.includes('message');
    }
    
    return false;
  }

  // Setup event listeners for form interactions
  setupFormEventListeners() {
    console.log('🎧 Setting up form event listeners');
    
    // Listen for focus on text inputs and textareas
    document.addEventListener('focusin', (e) => {
      console.log('👀 Focusin event:', e.target);
      console.log('   - TagName:', e.target.tagName);
      console.log('   - ContentEditable:', e.target.contentEditable);
      console.log('   - Role:', e.target.getAttribute('role'));
      console.log('   - Classes:', e.target.className);
      console.log('   - ID:', e.target.id);
      
      // Special case for ChatGPT inputs - force handle them
      if (e.target.classList.contains('ProseMirror') || e.target.id === 'prompt-textarea') {
        console.log('🎯 ChatGPT input focused - forcing handleInputFocus');
        this.handleInputFocus(e.target);
        return;
      }
      
      if (this.isTextInput(e.target)) {
        console.log('✅ Is text input, handling focus');
        this.handleInputFocus(e.target);
      } else {
        console.log('❌ Not a text input we care about');
        console.log('   - isContentEditable result:', this.isContentEditable(e.target));
      }
    }, true); // Use capture phase

    // Listen for focus out to hide overlays
    document.addEventListener('focusout', (e) => {
      if (this.isTextInput(e.target)) {
        setTimeout(() => this.handleInputBlur(e.target), 100);
      }
    }, true);

    // Listen for input changes to show/hide assistance
    document.addEventListener('input', (e) => {
      if (this.isTextInput(e.target)) {
        this.handleInputChange(e.target);
      }
    }, true);
    
    // Also listen for click events on contenteditable elements
    document.addEventListener('click', (e) => {
      console.log('🖱️ Click event:', e.target);
      console.log('🖱️ Target details:', {
        tagName: e.target.tagName,
        className: e.target.className,
        id: e.target.id,
        contentEditable: e.target.contentEditable,
        hasProseMirror: e.target.classList.contains('ProseMirror'),
        hasPromptId: e.target.id === 'prompt-textarea'
      });
      
      // Check for ChatGPT ProseMirror inputs specifically
      if (e.target.classList.contains('ProseMirror') || e.target.id === 'prompt-textarea') {
        console.log('🖱️ ChatGPT ProseMirror input detected');
        this.handleInputFocus(e.target);
        return;
      }
      
      // Check for LinkedIn message inputs specifically
      if (e.target.classList.contains('msg-form__contenteditable') || 
          (e.target.contentEditable === 'true' && e.target.getAttribute('role') === 'textbox')) {
        console.log('🖱️ LinkedIn message input detected');
        this.handleInputFocus(e.target);
        return;
      }
      
      if (this.isContentEditable(e.target) && this.isTextInput(e.target)) {
        console.log('🖱️ Click on contenteditable element');
        this.handleInputFocus(e.target);
      }
      // Removed click-outside hiding - let focus/blur handle it instead
    }, true);
  }

  // Check if element is a text input we care about
  isTextInput(element) {
    // Skip if it's part of our own overlay
    if (element.closest('.ai-form-overlay')) {
      return false;
    }
    
    // Debug ChatGPT inputs specifically
    if (element.classList.contains('ProseMirror') || element.id === 'prompt-textarea') {
      console.log('🔍 ChatGPT input detected in isTextInput:', element);
      return true;
    }
    
    const tag = element.tagName.toLowerCase();
    const type = element.type?.toLowerCase();
    const className = element.className?.toLowerCase() || '';
    
    // Check for contenteditable or role="textbox" (modern web apps)
    const isContentEditable = element.contentEditable === 'true' || 
                             element.getAttribute('contenteditable') === 'true' ||
                             element.getAttribute('contenteditable') === '' ||
                             element.getAttribute('role') === 'textbox';
    
    // Check for specific class patterns used by LinkedIn, ChatGPT and other platforms
    const hasMessageClass = className.includes('msg-form') || 
                           className.includes('message-editor') ||
                           className.includes('ql-editor') ||
                           className.includes('compose') ||
                           className.includes('editor-content') ||
                           className.includes('prosemirror') ||
                           element.classList.contains('ProseMirror');
    
    // Check for data-placeholder attribute (often used in modern editors)
    const hasDataPlaceholder = element.hasAttribute('data-placeholder');
    
    // Check for ChatGPT-specific patterns
    const isChatGPTInput = element.id === 'prompt-textarea' || 
                          element.id?.includes('prompt-textarea') ||
                          element.closest('[data-type="unified-composer"]') ||
                          (element.classList.contains('ProseMirror') && element.contentEditable === 'true');
    
    // Check parent elements for messaging context
    const isInMessageContainer = !!element.closest('[class*="message"], [class*="msg-"], [class*="compose"], [data-type="unified-composer"]');
    
    return (tag === 'textarea') || 
           (tag === 'input' && (type === 'text' || type === 'search' || type === 'email')) ||
           isContentEditable ||
           hasMessageClass ||
           hasDataPlaceholder ||
           isChatGPTInput ||
           isInMessageContainer;
  }

  // Handle when user focuses on an input
  handleInputFocus(input) {
    console.log('🎯 Form Helper: Input focused', input);
    console.log('- Type:', input.type || input.tagName);
    console.log('- Classes:', input.className);
    console.log('- ContentEditable:', this.isContentEditable(input));
    console.log('- Value:', this.getInputValue(input).substring(0, 50));
    console.log('- Attributes:', {
      contenteditable: input.getAttribute('contenteditable'),
      role: input.getAttribute('role'),
      'data-placeholder': input.getAttribute('data-placeholder'),
      'aria-label': input.getAttribute('aria-label')
    });
    
    // Special handling for ChatGPT ProseMirror inputs
    if (input.classList.contains('ProseMirror') || input.id === 'prompt-textarea') {
      console.log('🔧 ChatGPT ProseMirror input detected - creating forced form data');
      const chatGPTFormData = {
        id: `chatgpt-prompt-${Date.now()}`,
        element: input,
        type: 'standalone',
        purpose: 'ai_chat',
        inputs: [input],
        textareas: [input],
        hasLongText: true,
        isRelevant: true
      };
      
      this.activeFormElements.add(input);
      this.showFormAssistance(input, chatGPTFormData);
      return;
    }
    
    // Special handling for LinkedIn message inputs
    if (input.classList.contains('msg-form__contenteditable')) {
      console.log('🔧 LinkedIn input detected - creating forced form data');
      const linkedinFormData = {
        id: `linkedin-msg-${Date.now()}`,
        element: input,
        type: 'standalone',
        purpose: 'message_composition',
        inputs: [input],
        textareas: [input],
        hasLongText: true,
        isRelevant: true
      };
      
      this.activeFormElements.add(input);
      this.showFormAssistance(input, linkedinFormData);
      return;
    }
    
    const formData = this.findFormForInput(input);
    console.log('- Form data found:', !!formData, formData);
    
    if (!formData) {
      console.log('❌ No form data found for this input');
      return;
    }

    this.activeFormElements.add(input);
    this.showFormAssistance(input, formData);
  }

  // Handle when user leaves an input
  handleInputBlur(input) {
    // Always hide when input loses focus, but with a small delay to allow clicking overlay
    setTimeout(() => {
      const activeElement = document.activeElement;
      const overlay = this.formOverlays.get(input);
      const isOverlayHovered = overlay?.dataset.isHovered === 'true';
      const isCustomInputFocused = overlay?.dataset.customInputFocused === 'true' || 
                                   activeElement?.closest('.ai-form-overlay-custom');
      
      // Only hide if focus has moved outside our control and overlay is not hovered
      if ((!this.isTextInput(activeElement) || activeElement !== input) && 
          !isOverlayHovered && 
          !isCustomInputFocused) {
        this.hideFormAssistance(input);
        this.activeFormElements.delete(input);
      }
    }, 150); // Small delay to allow overlay interactions
  }

  // Handle input content changes
  handleInputChange(input) {
    const text = this.getInputValue(input).trim();
    const overlay = this.formOverlays.get(input);
    
    // Show assistance for longer text in textareas or contenteditable
    if (text.length > 50 && (input.tagName.toLowerCase() === 'textarea' || this.isContentEditable(input))) {
      this.updateFormAssistance(input, 'improve');
    }
    
    if (overlay) {
      // Reposition overlay as content changes (for textareas)
      if (input.tagName.toLowerCase() === 'textarea' || this.isContentEditable(input)) {
        this.positionFormOverlay(overlay, input);
      }
      
      // Reset auto-hide timer when typing
      if (overlay.autoHideTimeout) {
        clearTimeout(overlay.autoHideTimeout);
        overlay.autoHideTimeout = setTimeout(() => {
          if (!input.matches(':focus') && overlay.dataset.isHovered !== 'true') {
            this.hideFormAssistance(input);
          }
        }, 30000); // Reset to 30 seconds when typing
      }
    }
  }

  // Find which form data corresponds to an input
  findFormForInput(input) {
    let formData = this.detectedForms.find(formData => 
      formData.inputs.includes(input) || 
      formData.element === input
    );
    
    // If not found, try to detect it dynamically
    if (!formData) {
      console.log('🔄 Dynamically analyzing input...');
      const form = input.closest('form');
      
      if (form) {
        console.log('📝 Found parent form, analyzing...');
        // It's part of a form
        const dynamicFormData = this.analyzeForm(form, `dynamic-form-${Date.now()}`);
        if (dynamicFormData.inputs.includes(input)) {
          formData = dynamicFormData;
          // Add to detected forms for future reference
          this.detectedForms.push(formData);
        }
      } else {
        console.log('📝 No parent form, treating as standalone input...');
        // It's a standalone input
        formData = this.analyzeStandaloneInput(input, `dynamic-input-${Date.now()}`);
        console.log('📋 Dynamic form data created:', formData);
        
        // Always add to detected forms - force relevance for LinkedIn inputs
        if (!formData.isRelevant) {
          console.log('⚡ Forcing relevance for messaging input');
          formData.isRelevant = true;
        }
        this.detectedForms.push(formData);
      }
    }
    
    console.log('📊 Final form data:', formData);
    return formData;
  }

  // Show form assistance overlay
  showFormAssistance(input, formData) {
    console.log('✨ Showing form assistance for:', input);
    
    // Hide any existing overlays for other inputs first
    this.hideAllOverlaysExcept(input);
    
    if (this.formOverlays.has(input)) {
      console.log('⚠️ Overlay already exists for this input');
      return;
    }

    const overlay = this.createFormOverlay(input, formData);
    this.positionFormOverlay(overlay, input);
    
    document.body.appendChild(overlay);
    this.formOverlays.set(input, overlay);

    console.log('📍 Overlay added to DOM:', overlay);

    // Force immediate visibility with direct style override
    setTimeout(() => {
      overlay.classList.add('ai-form-overlay-visible');
      // Force opacity and transform to ensure visibility
      overlay.style.opacity = '1';
      overlay.style.transform = 'translateY(0)';
      console.log('✅ Overlay visibility forced');
    }, 10);
  }

  // Create form assistance overlay
  createFormOverlay(input, formData) {
    const overlay = document.createElement('div');
    overlay.className = 'ai-form-overlay';
    overlay.id = `ai-form-overlay-${Date.now()}`; // Unique ID for debugging
    
    const actions = this.getActionsForForm(formData, input);
    
    overlay.innerHTML = `
      <div class="ai-form-overlay-content">
        <div class="ai-form-overlay-header">
          <span class="ai-form-overlay-icon">✨</span>
          <span class="ai-form-overlay-title">AI Assistant</span>
          <button class="ai-form-overlay-close" title="Close">×</button>
        </div>
        <div class="ai-form-overlay-actions">
          ${actions.map(action => `
            <button class="ai-form-overlay-btn" data-action="${action.action}" data-purpose="${formData.purpose}">
              <span class="ai-form-btn-icon">${action.icon}</span>
              ${action.text}
            </button>
          `).join('')}
        </div>
        <div class="ai-form-overlay-custom">
          <input type="text" 
                 class="ai-form-custom-prompt" 
                 placeholder="Custom instruction (e.g., 'make it formal')"
                 title="Press Enter to apply">
          <button class="ai-form-custom-btn" title="Apply custom instruction">
            <span class="ai-form-btn-icon">🎯</span>
          </button>
        </div>
      </div>
    `;

    this.setupFormOverlayListeners(overlay, input);
    return overlay;
  }

  // Get appropriate actions based on form type and purpose
  getActionsForForm(formData, input) {
    const isTextarea = input.tagName.toLowerCase() === 'textarea' || this.isContentEditable(input);
    const hasContent = this.getInputValue(input).trim().length > 0;
    
    const baseActions = [];
    
    // Content generation actions
    switch (formData.purpose) {
      case 'search':
        baseActions.push(
          { icon: '🔍', text: 'Better Search', action: 'improve_search' },
          { icon: '💡', text: 'Suggest Terms', action: 'suggest_search' },
          { icon: '🎯', text: 'Advanced Query', action: 'advanced_search' }
        );
        break;
      case 'social_post':
        baseActions.push(
          { icon: '🐦', text: 'Draft Tweet', action: 'draft_tweet' },
          { icon: '🔥', text: 'Make Engaging', action: 'make_engaging' },
          { icon: '#️⃣', text: 'Add Hashtags', action: 'add_hashtags' }
        );
        break;
      case 'message_composition':
        baseActions.push(
          { icon: '✍️', text: 'Draft Message', action: 'draft_message' },
          { icon: '🎭', text: 'Adjust Tone', action: 'adjust_tone' }
        );
        break;
      case 'ai_chat':
        baseActions.push(
          { icon: '💬', text: 'Improve Question', action: 'improve_question' },
          { icon: '🎯', text: 'Make Specific', action: 'make_specific' },
          { icon: '🔍', text: 'Add Context', action: 'add_context' }
        );
        break;
      case 'review_writing':
        baseActions.push(
          { icon: '⭐', text: 'Write Review', action: 'write_review' },
          { icon: '🎯', text: 'Structure Review', action: 'structure_review' }
        );
        break;
      case 'job_application':
        baseActions.push(
          { icon: '💼', text: 'Professional Tone', action: 'professional_tone' },
          { icon: '🎯', text: 'Tailor Application', action: 'tailor_application' }
        );
        break;
      case 'support_request':
        baseActions.push(
          { icon: '🆘', text: 'Describe Issue', action: 'describe_issue' },
          { icon: '📋', text: 'Add Details', action: 'add_details' }
        );
        break;
      default:
        if (isTextarea) {
          baseActions.push(
            { icon: '✨', text: 'Improve Text', action: 'improve_text' },
            { icon: '📝', text: 'Expand Ideas', action: 'expand_ideas' }
          );
        }
    }

    // Content improvement actions (for existing text)
    if (hasContent && isTextarea) {
      baseActions.push(
        { icon: '🔧', text: 'Polish Text', action: 'polish_text' },
        { icon: '📏', text: 'Check Grammar', action: 'check_grammar' }
      );
    }

    // General actions
    if (!baseActions.length) {
      baseActions.push(
        { icon: '💡', text: 'Get Suggestions', action: 'get_suggestions' },
        { icon: '📝', text: 'Help Write', action: 'help_write' }
      );
    }

    return baseActions.slice(0, 3); // Limit to 3 actions
  }

  // Position the overlay near the input
  positionFormOverlay(overlay, input) {
    const rect = input.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Calculate overlay dimensions (estimated)
    const overlayWidth = 280;
    const overlayHeight = 150; // Increased for custom input
    
    // Calculate input area for positioning logic
    const inputArea = rect.width * rect.height;
    const isLargeInput = inputArea > (viewportWidth * viewportHeight * 0.2); // More than 20% of viewport
    
    let left, top;
    
    // For large inputs (like Gmail compose), always position in top-right
    if (isLargeInput || rect.height > viewportHeight * 0.5) {
      left = viewportWidth - overlayWidth - 20;
      top = 20;
      // Store that this is a repositioned overlay
      overlay.dataset.repositioned = 'true';
    }
    // For small inputs (single line), prefer positioning to the far right
    else if (rect.height < 60) {
      // Single line input - position far to the right
      if (rect.right + overlayWidth + 30 < viewportWidth) {
        left = rect.right + 30;
        top = Math.max(10, rect.top - 10); // Align with top of input
      } else if (rect.left - overlayWidth - 30 > 0) {
        left = rect.left - overlayWidth - 30;
        top = Math.max(10, rect.top - 10);
      } else {
        // Fall back to top-right for single line
        left = viewportWidth - overlayWidth - 20;
        top = 20;
        overlay.dataset.repositioned = 'true';
      }
    } else {
      // Multi-line input (textarea) - try smart positioning first
      // Try to position to the right
      if (rect.right + overlayWidth + 30 < viewportWidth && rect.top + overlayHeight < viewportHeight) {
        left = rect.right + 30;
        top = Math.max(10, rect.top);
      } 
      // Try far left if no space on right
      else if (rect.left - overlayWidth - 30 > 0 && rect.top + overlayHeight < viewportHeight) {
        left = rect.left - overlayWidth - 30;
        top = Math.max(10, rect.top);
      }
      // Default to top-right corner for medium textareas
      else {
        left = viewportWidth - overlayWidth - 20;
        top = 20;
        overlay.dataset.repositioned = 'true';
      }
    }
    
    // Store initial position for drag calculations
    overlay.dataset.initialLeft = left;
    overlay.dataset.initialTop = top;
    
    // Force inline styles to override any CSS issues
    overlay.style.cssText = `
      position: fixed !important;
      z-index: 2147483647 !important;
      opacity: 0 !important;
      transform: translateY(-10px) !important;
      transition: all 0.3s ease !important;
      pointer-events: auto !important;
      left: ${left}px !important;
      top: ${top}px !important;
      display: block !important;
      visibility: visible !important;
      background: rgba(255, 255, 255, 0.95) !important;
      backdrop-filter: blur(10px) !important;
      border: 1px solid rgba(0, 0, 0, 0.1) !important;
      border-radius: 10px !important;
      box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2) !important;
      padding: 12px !important;
      min-width: 220px !important;
      max-width: 280px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    `;
    
    console.log('📍 Overlay positioned at:', left, top);
    if (overlay.dataset.repositioned === 'true') {
      console.log('⚠️ Large input detected - positioned in top-right corner');
    }
  }

  // Setup event listeners for overlay
  setupFormOverlayListeners(overlay, input) {
    // Close button
    const closeBtn = overlay.querySelector('.ai-form-overlay-close');
    closeBtn?.addEventListener('click', () => this.hideFormAssistance(input));

    // Drag functionality
    this.setupDragFunctionality(overlay);

    // Action buttons
    const actionBtns = overlay.querySelectorAll('.ai-form-overlay-btn');
    actionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        const purpose = e.currentTarget.dataset.purpose;
        this.handleFormAction(action, purpose, input);
      });
    });

    // Custom prompt handling
    const customInput = overlay.querySelector('.ai-form-custom-prompt');
    const customBtn = overlay.querySelector('.ai-form-custom-btn');
    
    const handleCustomPrompt = () => {
      const customPrompt = customInput.value.trim();
      if (customPrompt) {
        this.handleFormAction('custom_prompt', 'custom', input, customPrompt);
        customInput.value = ''; // Clear after use
      }
    };

    customBtn?.addEventListener('click', handleCustomPrompt);
    customInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCustomPrompt();
      }
    });

    // Handle custom input interactions
    if (customInput) {
      customInput.addEventListener('click', (e) => {
        e.stopPropagation();
        clearTimeout(autoHideTimeout);
      });
      
      customInput.addEventListener('focus', (e) => {
        overlay.dataset.customInputFocused = 'true';
        clearTimeout(autoHideTimeout);
      });
      
      customInput.addEventListener('blur', (e) => {
        overlay.dataset.customInputFocused = 'false';
      });
    }
    
    if (customBtn) {
      customBtn.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Only prevent default on button click
      });
    }

    // Auto-hide after 30 seconds if not interacted with
    let autoHideTimeout = setTimeout(() => {
      // Only hide if input is not focused and overlay is not hovered
      if (!input.matches(':focus') && overlay.dataset.isHovered !== 'true') {
        this.hideFormAssistance(input);
      }
    }, 30000); // Increased to 30 seconds
    
    // Store timeout reference on overlay for access in other methods
    overlay.autoHideTimeout = autoHideTimeout;

    // Clear auto-hide on hover and prevent blur hiding
    overlay.addEventListener('mouseenter', () => {
      clearTimeout(autoHideTimeout);
      overlay.dataset.isHovered = 'true';
    });

    // Restart auto-hide on leave
    overlay.addEventListener('mouseleave', () => {
      overlay.dataset.isHovered = 'false';
      autoHideTimeout = setTimeout(() => {
        if (!input.matches(':focus')) {
          this.hideFormAssistance(input);
        }
      }, 10000); // 10 seconds after mouse leaves overlay
      overlay.autoHideTimeout = autoHideTimeout;
    });

    // Prevent hiding when clicking on overlay buttons (but not the input)
    overlay.addEventListener('mousedown', (e) => {
      // Only prevent default for non-input elements
      if (!e.target.matches('input')) {
        e.preventDefault(); // Prevent input from losing focus
      }
    });
  }

  // Handle form action button clicks
  async handleFormAction(action, purpose, input, customPrompt = null) {
    console.log('Form action:', action, 'for purpose:', purpose, 'custom:', customPrompt);
    
    // Show the sidebar for AI processing
    window.aiAssistant?.sidebar.showSidebar();
    
    const currentText = this.getInputValue(input).trim();
    const context = this.getInputContext(input);
    
    let prompt = this.generatePromptForAction(action, purpose, currentText, context, customPrompt);
    
    if (prompt) {
      try {
        // Process with AI
        const response = await window.aiAssistant?.aiSession.sendPromptToAI(prompt);
        
        // If the response is meant to replace/fill the input, do so
        if (this.shouldFillInput(action) && response) {
          this.fillInputWithResponse(input, response);
        }
      } catch (error) {
        console.error('Form assistance failed:', error);
      }
    }
    
    // Hide overlay after action
    setTimeout(() => {
      this.hideFormAssistance(input);
    }, 500);
  }

  // Generate AI prompt based on action and context
  generatePromptForAction(action, _purpose, currentText, context, customPrompt = null) {
    const baseContext = `Context: ${context.pageTitle} - ${context.inputLabel || 'text input'}`;
    
    // Build conversation context string
    const conversationContext = this.buildConversationContextString(context.conversationContext);
    
    // Build page context string
    const pageContext = this.buildPageContextString(context.pageContext);
    
    // Handle custom prompt
    if (action === 'custom_prompt' && customPrompt) {
      // Provide context-aware instruction clarification
      let clarification = '';
      if (context.conversationContext?.conversationType === 'recruitment') {
        clarification = 'This is a professional business communication context. ';
      } else if (context.conversationContext?.platform === 'linkedin') {
        clarification = 'This is a professional LinkedIn message. ';
      }
      
      if (currentText) {
        return `${baseContext}\n\n${conversationContext}${pageContext}\n\nTask: You are helping write a professional response message. ${clarification}Modify this text: "${currentText}"\n\nUser instruction: ${customPrompt}\n\nWrite a polite, professional message that fulfills the user's request. Return ONLY the final message text that can be sent directly. No explanations, no quotes, no introductions - just the message itself.`;
      } else {
        // Add common business communication examples to help AI understand
        let examples = '';
        if (customPrompt.toLowerCase().includes('reject') || customPrompt.toLowerCase().includes('decline')) {
          examples = '\n\nCommon professional responses include politely declining job offers, meeting requests, proposals, or invitations while maintaining good relationships.';
        } else if (customPrompt.toLowerCase().includes('accept') || customPrompt.toLowerCase().includes('agree')) {
          examples = '\n\nCommon professional responses include accepting offers, confirming meetings, or agreeing to proposals.';
        } else if (customPrompt.toLowerCase().includes('reschedule') || customPrompt.toLowerCase().includes('postpone')) {
          examples = '\n\nCommon professional responses include requesting to reschedule meetings or calls due to conflicts.';
        }
        
        return `${baseContext}\n\n${conversationContext}${pageContext}\n\nTask: You are helping write a professional response message. ${clarification}Create a message that responds appropriately to the conversation above.\n\nUser instruction: ${customPrompt}${examples}\n\nWrite a polite, professional message that fulfills the user's request. Return ONLY the final message text that can be sent directly. No explanations, no quotes, no introductions - just the message itself.`;
      }
    }
    
    switch (action) {
      case 'improve_search':
        return `${baseContext}\n\nPlease improve this search query to get better results:\n\n"${currentText}"\n\nSuggest a more effective search query.`;
        
      case 'suggest_search':
        return `${baseContext}\n\nBased on this search intent: "${currentText || 'general search'}"\n\nSuggest 3-5 alternative search terms or queries that might help find what I'm looking for.`;
        
      case 'advanced_search':
        return `${baseContext}\n\nConvert this search into an advanced query with operators:\n\n"${currentText}"\n\nInclude tips for using quotes, minus signs, OR, and other search operators.`;
        
      case 'draft_tweet':
        return `${baseContext}\n\nPlease help draft an engaging tweet. ${currentText ? `Topic/idea: "${currentText}"\n\nCreate a compelling tweet based on this.` : 'Create an engaging tweet that could spark conversation.'} Keep it under 280 characters.`;
        
      case 'make_engaging':
        return `${baseContext}\n\nPlease rewrite this to be more engaging and likely to get interaction:\n\n"${currentText}"\n\nKeep it under 280 characters.`;
        
      case 'add_hashtags':
        return `${baseContext}\n\nPlease add relevant hashtags to this tweet:\n\n"${currentText}"\n\nSuggest 2-3 popular and relevant hashtags.`;
        
      case 'draft_message':
        return `${baseContext}\n\n${conversationContext}\n\n${currentText ? `Improve this message: "${currentText}"` : 'Create a professional message.'}\n\nReturn ONLY the final message text, no explanations.`;
        
      case 'improve_text':
        return `${baseContext}\n\nImprove this text for clarity, grammar, and flow:\n\n"${currentText}"\n\nReturn ONLY the improved text, no explanations.`;
        
      case 'adjust_tone':
        return `${baseContext}\n\nRewrite this text with a more professional and friendly tone:\n\n"${currentText}"\n\nReturn ONLY the rewritten text, no explanations.`;
        
      case 'write_review':
        return `${baseContext}\n\nPlease help write a balanced, helpful review. ${currentText ? `Current thoughts: "${currentText}"\n\nExpand this into a well-structured review.` : 'Create a review template with pros, cons, and overall thoughts.'}`;
        
      case 'professional_tone':
        return `${baseContext}\n\nRewrite this text with a professional, business-appropriate tone:\n\n"${currentText}"\n\nReturn ONLY the rewritten text, no explanations.`;
        
      case 'polish_text':
        return `${baseContext}\n\nPolish this text for grammar, clarity, and readability:\n\n"${currentText}"\n\nReturn ONLY the polished text, no explanations.`;
        
      case 'expand_ideas':
        return `${baseContext}\n\nExpand on these ideas with more detail and examples:\n\n"${currentText}"\n\nReturn ONLY the expanded text, no explanations.`;
        
      case 'improve_question':
        return `${baseContext}\n\nImprove this question to get a better AI response:\n\n"${currentText}"\n\nMake it more specific, clear, and likely to get a helpful answer. Return ONLY the improved question, no explanations.`;
        
      case 'make_specific':
        return `${baseContext}\n\nMake this question more specific and detailed:\n\n"${currentText}"\n\nAdd relevant context and specifics that will help get a better answer. Return ONLY the improved question, no explanations.`;
        
      case 'add_context':
        return `${baseContext}\n\nAdd helpful context to this question:\n\n"${currentText}"\n\nInclude background information that would help an AI provide a better response. Return ONLY the question with added context, no explanations.`;
        
      case 'get_suggestions':
        return `${baseContext}\n\nWhat are some helpful suggestions for writing effective content for this type of form field?`;
        
      default:
        return `${baseContext}\n\nPlease provide helpful assistance for this form field. ${currentText ? `Current content: "${currentText}"` : ''}`;
    }
  }

  // Get context about the input for better AI assistance
  getInputContext(input) {
    const form = input.closest('form');
    const label = input.labels?.[0]?.textContent || input.placeholder || input.name || '';
    
    // Get conversation context for messaging platforms
    const conversationContext = this.getConversationContext(input);
    
    // Get broader page context
    const pageContext = this.getPageContext();
    
    return {
      pageTitle: document.title,
      pageUrl: window.location.href,
      inputLabel: label,
      formAction: form?.action || '',
      inputType: input.type || input.tagName.toLowerCase(),
      conversationContext: conversationContext,
      pageContext: pageContext
    };
  }

  // Extract broader page context for AI understanding
  getPageContext() {
    const context = {
      mainContent: '',
      headings: [],
      links: [],
      visibleText: '',
      pageType: '',
      metadata: {}
    };

    try {
      // Get main content area
      const mainContentSelectors = [
        'main', 
        '.main-content', 
        '#main', 
        '.content', 
        'article',
        '.post',
        '.page-content',
        // LinkedIn specific
        '.artdeco-card',
        '.msg-overlay-conversation-bubble',
        // Twitter specific
        '[data-testid="primaryColumn"]',
        // Gmail specific
        '.ii.gt'
      ];

      let mainContent = '';
      for (const selector of mainContentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          mainContent = element.textContent?.trim() || '';
          if (mainContent.length > 100) break; // Found substantial content
        }
      }

      // Get headings for structure
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'))
        .map(h => h.textContent?.trim())
        .filter(Boolean)
        .slice(0, 10); // Limit to first 10 headings

      // Get page type based on URL and content
      const pageType = this.detectPageType();

      // Get metadata
      const metadata = this.extractPageMetadata();

      // Get visible text (limited to avoid token overflow)
      const visibleText = this.getVisiblePageText();

      context.mainContent = mainContent.substring(0, 2000); // Limit length
      context.headings = headings;
      context.pageType = pageType;
      context.metadata = metadata;
      context.visibleText = visibleText.substring(0, 3000); // Limit visible text

    } catch (error) {
      console.warn('Error extracting page context:', error);
    }

    return context;
  }

  // Detect what type of page this is
  detectPageType() {
    const url = window.location.href.toLowerCase();
    const hostname = window.location.hostname.toLowerCase();
    
    // Platform-specific page types
    if (hostname.includes('linkedin.com')) {
      if (url.includes('/messaging/')) return 'linkedin-messaging';
      if (url.includes('/in/')) return 'linkedin-profile';
      if (url.includes('/jobs/')) return 'linkedin-jobs';
      if (url.includes('/feed/')) return 'linkedin-feed';
      return 'linkedin-general';
    }
    
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      if (url.includes('/messages/')) return 'twitter-messages';
      if (url.includes('/compose/')) return 'twitter-compose';
      return 'twitter-feed';
    }
    
    if (hostname.includes('gmail.com')) {
      if (url.includes('#compose')) return 'gmail-compose';
      if (url.includes('#inbox')) return 'gmail-inbox';
      return 'gmail-general';
    }
    
    // Generic page types
    if (document.querySelector('form[action*="login"]')) return 'login-page';
    if (document.querySelector('form[action*="contact"]')) return 'contact-page';
    if (document.querySelector('article, .article, .post')) return 'article-page';
    if (document.querySelector('.product, .item, .listing')) return 'product-page';
    
    return 'general-page';
  }

  // Extract page metadata
  extractPageMetadata() {
    const metadata = {};
    
    // Meta tags
    const metaTags = document.querySelectorAll('meta[name], meta[property]');
    metaTags.forEach(meta => {
      const name = meta.getAttribute('name') || meta.getAttribute('property');
      const content = meta.getAttribute('content');
      if (name && content && ['description', 'og:title', 'og:description', 'twitter:description'].includes(name)) {
        metadata[name] = content;
      }
    });
    
    // Title
    metadata.title = document.title;
    
    return metadata;
  }

  // Get visible text from the page (excluding navigation, ads, etc.)
  getVisiblePageText() {
    const elementsToExclude = [
      'script', 'style', 'nav', 'header', 'footer', 
      '.ad', '.advertisement', '.sidebar', '.menu',
      // FormHelper elements
      '.ai-form-overlay', '.ai-assistant-sidebar'
    ];
    
    // Clone the body to avoid modifying the actual page
    const bodyClone = document.body.cloneNode(true);
    
    // Remove excluded elements
    elementsToExclude.forEach(selector => {
      const elements = bodyClone.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
    
    // Get text content
    let text = bodyClone.textContent || '';
    
    // Clean up text
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  }

  // Extract conversation context from the page
  getConversationContext(input) {
    const context = {
      messages: [],
      participants: [],
      subject: '',
      platform: this.detectPlatform()
    };

    // LinkedIn messaging context
    if (context.platform === 'linkedin') {
      return this.getLinkedInContext(input);
    }
    
    // Twitter context
    if (context.platform === 'twitter') {
      return this.getTwitterContext(input);
    }
    
    // Gmail context
    if (context.platform === 'gmail') {
      return this.getGmailContext(input);
    }
    
    // Generic messaging context
    return this.getGenericMessagingContext(input);
  }

  // Detect which platform we're on
  detectPlatform() {
    const hostname = window.location.hostname.toLowerCase();
    if (hostname.includes('linkedin.com')) return 'linkedin';
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'twitter';
    if (hostname.includes('gmail.com') || hostname.includes('mail.google.com')) return 'gmail';
    if (hostname.includes('facebook.com') || hostname.includes('messenger.com')) return 'facebook';
    return 'generic';
  }

  // Get LinkedIn conversation context
  getLinkedInContext(input) {
    const context = {
      platform: 'linkedin',
      messages: [],
      participants: [],
      subject: '',
      conversationType: ''
    };

    try {
      // Get conversation thread
      const messageThread = input.closest('.msg-thread, .conversation-view');
      if (messageThread) {
        // Extract recent messages (last 3-5 for context)
        const messageElements = messageThread.querySelectorAll('.msg-s-message-list__event, .message-event');
        const recentMessages = Array.from(messageElements).slice(-5);
        
        recentMessages.forEach(msgEl => {
          const senderEl = msgEl.querySelector('.msg-s-message-list__name, .message-event__name');
          const contentEl = msgEl.querySelector('.msg-s-event-listitem__body, .message-event__body');
          const timeEl = msgEl.querySelector('.msg-s-message-list__time-heading, .message-event__time');
          
          if (senderEl && contentEl) {
            context.messages.push({
              sender: senderEl.textContent?.trim() || 'Unknown',
              content: contentEl.textContent?.trim() || '',
              time: timeEl?.textContent?.trim() || ''
            });
          }
        });

        // Get participant names
        const participantElements = messageThread.querySelectorAll('.msg-entity-lockup__entity-title, .conversation-participant');
        context.participants = Array.from(participantElements).map(el => el.textContent?.trim()).filter(Boolean);
      }

      // Get conversation header/subject if available
      const headerEl = document.querySelector('.msg-overlay-conversation-bubble__details-title, .conversation-header');
      if (headerEl) {
        context.subject = headerEl.textContent?.trim() || '';
      }

      // Determine conversation type
      if (context.messages.some(msg => msg.content.toLowerCase().includes('opportunity') || 
                                     msg.content.toLowerCase().includes('position') ||
                                     msg.content.toLowerCase().includes('role'))) {
        context.conversationType = 'recruitment';
      } else if (context.messages.some(msg => msg.content.toLowerCase().includes('connect') ||
                                             msg.content.toLowerCase().includes('network'))) {
        context.conversationType = 'networking';
      } else {
        context.conversationType = 'general';
      }

    } catch (error) {
      console.warn('Error extracting LinkedIn context:', error);
    }

    return context;
  }

  // Get Twitter conversation context
  getTwitterContext(input) {
    const context = {
      platform: 'twitter',
      messages: [],
      participants: [],
      subject: '',
      isReply: false,
      originalTweet: ''
    };

    try {
      // Check if this is a reply
      const tweetComposer = input.closest('[data-testid="tweetTextarea_0"], .tweet-compose');
      if (tweetComposer) {
        // Look for original tweet being replied to
        const originalTweet = document.querySelector('[data-testid="tweet"] .tweet-text, .original-tweet');
        if (originalTweet) {
          context.isReply = true;
          context.originalTweet = originalTweet.textContent?.trim() || '';
        }
      }
    } catch (error) {
      console.warn('Error extracting Twitter context:', error);
    }

    return context;
  }

  // Get Gmail conversation context
  getGmailContext(input) {
    const context = {
      platform: 'gmail',
      messages: [],
      participants: [],
      subject: ''
    };

    try {
      // Get email subject
      const subjectEl = document.querySelector('.hP, [data-legacy-thread-id] .bog');
      if (subjectEl) {
        context.subject = subjectEl.textContent?.trim() || '';
      }

      // Get conversation thread
      const conversationEl = input.closest('.if, .conversation');
      if (conversationEl) {
        const messageElements = conversationEl.querySelectorAll('.ii.gt .a3s, .message-content');
        const recentMessages = Array.from(messageElements).slice(-3);
        
        recentMessages.forEach(msgEl => {
          const content = msgEl.textContent?.trim() || '';
          if (content && content.length > 20) {
            context.messages.push({
              content: content.substring(0, 500) // Limit length
            });
          }
        });
      }
    } catch (error) {
      console.warn('Error extracting Gmail context:', error);
    }

    return context;
  }

  // Get generic messaging context
  getGenericMessagingContext(input) {
    const context = {
      platform: 'generic',
      messages: [],
      participants: [],
      subject: ''
    };

    try {
      // Look for common message patterns
      const messageContainer = input.closest('.chat, .conversation, .messages, .thread');
      if (messageContainer) {
        const messageElements = messageContainer.querySelectorAll('.message, .chat-message, .msg');
        const recentMessages = Array.from(messageElements).slice(-3);
        
        recentMessages.forEach(msgEl => {
          const content = msgEl.textContent?.trim() || '';
          if (content && content.length > 10) {
            context.messages.push({
              content: content.substring(0, 300)
            });
          }
        });
      }
    } catch (error) {
      console.warn('Error extracting generic context:', error);
    }

    return context;
  }

  // Build conversation context string for AI prompts
  buildConversationContextString(conversationContext) {
    if (!conversationContext || !conversationContext.platform) {
      return '';
    }

    let contextStr = `Platform: ${conversationContext.platform}\n`;

    // Add conversation type for LinkedIn
    if (conversationContext.conversationType) {
      contextStr += `Conversation type: ${conversationContext.conversationType}\n`;
    }

    // Add participants
    if (conversationContext.participants && conversationContext.participants.length > 0) {
      contextStr += `Participants: ${conversationContext.participants.join(', ')}\n`;
    }

    // Add subject/topic
    if (conversationContext.subject) {
      contextStr += `Subject: ${conversationContext.subject}\n`;
    }

    // Add recent messages for context
    if (conversationContext.messages && conversationContext.messages.length > 0) {
      contextStr += `\nRecent conversation:\n`;
      conversationContext.messages.forEach((msg) => {
        const sender = msg.sender || 'Unknown';
        const content = msg.content || '';
        if (content.trim()) {
          contextStr += `${sender}: ${content.substring(0, 200)}${content.length > 200 ? '...' : ''}\n`;
        }
      });
    }

    // Special context for Twitter replies
    if (conversationContext.isReply && conversationContext.originalTweet) {
      contextStr += `\nReplying to tweet: ${conversationContext.originalTweet.substring(0, 200)}\n`;
    }

    return contextStr ? `\nConversation Context:\n${contextStr}` : '';
  }

  // Build page context string for AI prompts
  buildPageContextString(pageContext) {
    if (!pageContext) {
      return '';
    }

    let contextStr = '';

    // Add page type
    if (pageContext.pageType) {
      contextStr += `Page type: ${pageContext.pageType}\n`;
    }

    // Add page metadata
    if (pageContext.metadata && pageContext.metadata.description) {
      contextStr += `Page description: ${pageContext.metadata.description.substring(0, 200)}\n`;
    }

    // Add headings for structure
    if (pageContext.headings && pageContext.headings.length > 0) {
      contextStr += `Page headings: ${pageContext.headings.slice(0, 5).join(', ')}\n`;
    }

    // Add main content or visible text
    if (pageContext.mainContent && pageContext.mainContent.length > 100) {
      contextStr += `\nMain page content:\n${pageContext.mainContent.substring(0, 1500)}\n`;
    } else if (pageContext.visibleText && pageContext.visibleText.length > 100) {
      contextStr += `\nPage content:\n${pageContext.visibleText.substring(0, 1500)}\n`;
    }

    return contextStr ? `\nPage Context:\n${contextStr}` : '';
  }

  // Check if action should fill the input automatically
  shouldFillInput(action) {
    return [
      'improve_search',
      'suggest_search',
      'advanced_search',
      'draft_tweet',
      'make_engaging',
      'add_hashtags',
      'draft_message',
      'improve_text', 
      'adjust_tone',
      'professional_tone',
      'polish_text',
      'expand_ideas',
      'improve_question',
      'make_specific', 
      'add_context',
      'custom_prompt'
    ].includes(action);
  }

  // Helper methods for contenteditable support
  isContentEditable(element) {
    // More comprehensive contenteditable detection
    const isExplicitlyEditable = element.contentEditable === 'true' || 
                                 element.getAttribute('contenteditable') === 'true' ||
                                 element.getAttribute('contenteditable') === '' ||
                                 element.isContentEditable === true;
    
    // Check for role attributes
    const hasEditableRole = element.getAttribute('role') === 'textbox' ||
                           element.getAttribute('role') === 'combobox';
    
    // Check for specific LinkedIn/ChatGPT/modern editor patterns
    const className = element.className?.toLowerCase() || '';
    const isModernEditor = className.includes('ql-editor') ||
                          className.includes('msg-form__contenteditable') ||
                          className.includes('public-DraftEditor') ||
                          className.includes('prosemirror') ||
                          element.classList.contains('ProseMirror') ||
                          element.hasAttribute('data-placeholder');
    
    return isExplicitlyEditable || hasEditableRole || isModernEditor;
  }

  getInputValue(input) {
    if (this.isContentEditable(input)) {
      // For ChatGPT ProseMirror, check for placeholder state
      if (input.classList.contains('ProseMirror')) {
        const placeholderP = input.querySelector('p[data-placeholder]');
        if (placeholderP && placeholderP.querySelector('.ProseMirror-trailingBreak')) {
          return ''; // Empty state with just placeholder
        }
      }
      return input.innerText || input.textContent || '';
    }
    return input.value || '';
  }

  setInputValue(input, value) {
    if (this.isContentEditable(input)) {
      // Special handling for ChatGPT ProseMirror editor
      if (input.classList.contains('ProseMirror')) {
        // Clear existing content
        input.innerHTML = '';
        
        // Create a new paragraph with the content
        const p = document.createElement('p');
        p.textContent = value;
        input.appendChild(p);
        
        // Trigger ProseMirror events
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Try to trigger focus and selection
        const range = document.createRange();
        range.selectNodeContents(p);
        range.collapse(false); // Move cursor to end
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        input.innerText = value;
        // For contenteditable, we need to trigger different events
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  // Fill input with AI response
  fillInputWithResponse(input, response) {
    if (!response || !input) return;
    
    // Clean up the response (remove quotes, extra whitespace)
    let cleanResponse = response.trim();
    if (cleanResponse.startsWith('"') && cleanResponse.endsWith('"')) {
      cleanResponse = cleanResponse.slice(1, -1);
    }
    
    // Set the value
    this.setInputValue(input, cleanResponse);
    
    // Focus and select the text for easy editing
    input.focus();
    
    if (this.isContentEditable(input)) {
      // For ChatGPT ProseMirror, focus and select all
      if (input.classList.contains('ProseMirror')) {
        const p = input.querySelector('p');
        if (p) {
          const range = document.createRange();
          range.selectNodeContents(p);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } else {
        // For other contenteditable, select all text
        const range = document.createRange();
        range.selectNodeContents(input);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } else if (input.tagName.toLowerCase() === 'textarea') {
      // For textareas, put cursor at the end
      input.setSelectionRange(cleanResponse.length, cleanResponse.length);
    } else {
      // For inputs, select all text
      input.select();
    }
    
    console.log('✅ Form field updated with AI response');
  }

  // Update form assistance for existing overlay
  updateFormAssistance(input, _suggestedAction) {
    const overlay = this.formOverlays.get(input);
    if (!overlay) return;

    // Add visual indication that improvement is suggested
    overlay.classList.add('ai-form-overlay-suggested');
  }

  // Hide all overlays except for the specified input
  hideAllOverlaysExcept(exceptInput) {
    this.formOverlays.forEach((_overlay, input) => {
      if (input !== exceptInput) {
        this.hideFormAssistance(input);
      }
    });
  }

  // Hide form assistance overlay
  hideFormAssistance(input) {
    const overlay = this.formOverlays.get(input);
    if (!overlay) return;

    overlay.style.opacity = '0';
    overlay.style.transform = 'translateY(-10px)';
    
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      this.formOverlays.delete(input);
    }, 300);
  }

  // Clean up all overlays
  cleanup() {
    this.formOverlays.forEach((_overlay, input) => {
      this.hideFormAssistance(input);
    });
    this.activeFormElements.clear();
  }

  // Re-scan for forms (useful for dynamic content)
  refresh() {
    this.cleanup();
    this.detectForms();
  }
  
  // Setup observer for dynamically added form elements
  setupDynamicFormObserver() {
    console.log('👀 Setting up dynamic form observer');
    
    // Debounce function to prevent excessive scanning
    let debounceTimer;
    const debouncedDetect = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        console.log('🔄 Re-scanning for new form elements');
        this.detectForms();
      }, 500);
    };
    
    // Create observer for added nodes
    const observer = new MutationObserver((mutations) => {
      let shouldRescan = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          // Check if any added nodes might contain form elements
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if the node itself or its children might be form inputs
              const hasFormElements = node.matches && (
                node.matches('input, textarea, [contenteditable], [role="textbox"], [class*="message"], [class*="msg-"], [class*="compose"]') ||
                node.querySelector('input, textarea, [contenteditable], [role="textbox"], [class*="message"], [class*="msg-"], [class*="compose"]')
              );
              
              if (hasFormElements) {
                shouldRescan = true;
                break;
              }
            }
          }
        } else if (mutation.type === 'attributes') {
          // Check if contenteditable or role was added
          if (['contenteditable', 'role', 'data-placeholder'].includes(mutation.attributeName)) {
            shouldRescan = true;
          }
        }
        
        if (shouldRescan) break;
      }
      
      if (shouldRescan) {
        debouncedDetect();
      }
    });
    
    // Observe the entire document for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['contenteditable', 'role', 'data-placeholder']
    });
    
    console.log('✅ Dynamic form observer active');
  }
  
  // Setup drag functionality for overlay
  setupDragFunctionality(overlay) {
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    
    const header = overlay.querySelector('.ai-form-overlay-header');
    if (!header) return;
    
    // Change cursor for header
    header.style.cursor = 'move';
    
    const startDrag = (e) => {
      // Don't start drag on close button
      if (e.target.classList.contains('ai-form-overlay-close')) return;
      
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      
      // Get current position
      const computedStyle = window.getComputedStyle(overlay);
      initialLeft = parseInt(computedStyle.left);
      initialTop = parseInt(computedStyle.top);
      
      // Disable transitions during drag
      overlay.style.transition = 'none !important';
      
      // Prevent text selection
      e.preventDefault();
    };
    
    const drag = (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      const newLeft = initialLeft + deltaX;
      const newTop = initialTop + deltaY;
      
      // Keep overlay within viewport bounds
      const maxLeft = window.innerWidth - overlay.offsetWidth - 10;
      const maxTop = window.innerHeight - overlay.offsetHeight - 10;
      
      overlay.style.left = `${Math.max(10, Math.min(newLeft, maxLeft))}px`;
      overlay.style.top = `${Math.max(10, Math.min(newTop, maxTop))}px`;
    };
    
    const endDrag = () => {
      if (!isDragging) return;
      
      isDragging = false;
      // Re-enable transitions
      overlay.style.transition = 'all 0.3s ease !important';
    };
    
    // Add event listeners
    header.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);
    
    // Clean up on overlay removal
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.removedNodes.length > 0) {
          Array.from(mutation.removedNodes).forEach((node) => {
            if (node === overlay) {
              document.removeEventListener('mousemove', drag);
              document.removeEventListener('mouseup', endDrag);
              observer.disconnect();
            }
          });
        }
      });
    });
    
    observer.observe(overlay.parentNode || document.body, { childList: true });
  }

  // Test ChatGPT inputs specifically
  testChatGPTInputs() {
    console.log('🔍 Testing ChatGPT input detection...');
    
    // Find ChatGPT ProseMirror inputs
    const chatGPTInputs = document.querySelectorAll('.ProseMirror, #prompt-textarea');
    console.log('Found ChatGPT inputs:', chatGPTInputs.length);
    
    chatGPTInputs.forEach((input, index) => {
      console.log(`ChatGPT input ${index}:`, {
        tagName: input.tagName,
        contentEditable: input.contentEditable,
        role: input.getAttribute('role'),
        classes: input.className,
        id: input.id,
        isTextInput: this.isTextInput(input),
        isContentEditable: this.isContentEditable(input)
      });
      
      // Force trigger FormHelper
      if (index === 0) {
        console.log('Forcing FormHelper on first ChatGPT input...');
        this.testOnElement(input);
      }
    });
    
    if (chatGPTInputs.length === 0) {
      console.log('❌ No ChatGPT inputs found. Try clicking on the ChatGPT message field first.');
    }
  }
  
  // Test LinkedIn message inputs specifically
  testLinkedInMessages() {
    console.log('🔍 Testing LinkedIn message detection...');
    
    // Find LinkedIn message inputs
    const linkedinInputs = document.querySelectorAll('.msg-form__contenteditable');
    console.log('Found LinkedIn inputs:', linkedinInputs.length);
    
    linkedinInputs.forEach((input, index) => {
      console.log(`LinkedIn input ${index}:`, {
        tagName: input.tagName,
        contentEditable: input.contentEditable,
        role: input.getAttribute('role'),
        classes: input.className,
        isTextInput: this.isTextInput(input),
        isContentEditable: this.isContentEditable(input)
      });
      
      // Force trigger FormHelper
      if (index === 0) {
        console.log('Forcing FormHelper on first LinkedIn input...');
        this.testOnElement(input);
      }
    });
    
    if (linkedinInputs.length === 0) {
      console.log('❌ No LinkedIn message inputs found. Try clicking on a message field first.');
    }
  }

  // Manual trigger for testing
  testOnElement(element) {
    console.log('🧪 Testing Form Helper on element:', element);
    if (!element) {
      console.log('❌ No element provided');
      return;
    }
    
    // Create fake form data for testing
    const testFormData = {
      id: 'test-form',
      element: element,
      type: 'standalone',
      purpose: this.detectInputPurpose(element),
      inputs: [element],
      textareas: [element],
      hasLongText: true,
      isRelevant: true
    };
    
    console.log('📋 Test form data:', testFormData);
    this.showFormAssistance(element, testFormData);
  }
  
  // Global test function for ChatGPT
  testChatGPT() {
    console.log('🧪 Testing ChatGPT FormHelper integration...');
    this.testChatGPTInputs();
    
    // Also try to force detection on the current page
    setTimeout(() => {
      console.log('🔄 Re-running form detection...');
      this.detectForms();
      
      // Try to find and test the actual ChatGPT input
      const chatGPTInput = document.querySelector('#prompt-textarea.ProseMirror');
      if (chatGPTInput) {
        console.log('🎯 Found ChatGPT input, testing directly...');
        this.testOnElement(chatGPTInput);
      } else {
        console.log('❌ ChatGPT input not found with selector #prompt-textarea.ProseMirror');
        // Try alternative selectors
        const proseMirrorDivs = document.querySelectorAll('.ProseMirror[contenteditable="true"]');
        console.log('🔍 Found ProseMirror divs:', proseMirrorDivs.length);
        proseMirrorDivs.forEach((div, i) => {
          console.log(`  ProseMirror ${i}:`, div.id, div.className);
        });
      }
    }, 1000);
  }
}

// Export for use in content script
window.FormHelperManager = FormHelperManager;

// Log that FormHelper module is loaded
console.log('📦 FormHelper module loaded');
console.log('  - window.FormHelperManager available:', !!window.FormHelperManager);

// Global test functions for debugging
window.testChatGPTFormHelper = function() {
  console.log('🧪 testChatGPTFormHelper called');
  console.log('  - window.aiAssistant exists:', !!window.aiAssistant);
  console.log('  - window.aiAssistant.formHelper exists:', !!window.aiAssistant?.formHelper);
  console.log('  - window.FormHelperManager exists:', !!window.FormHelperManager);
  
  if (window.aiAssistant?.formHelper) {
    console.log('✅ Using aiAssistant.formHelper');
    window.aiAssistant.formHelper.testChatGPT();
  } else if (window.FormHelperManager) {
    console.log('⚠️ aiAssistant not available, creating temporary FormHelper');
    const tempHelper = new window.FormHelperManager();
    tempHelper.testChatGPT();
  } else {
    console.log('❌ FormHelper not available. Extension may not be loaded.');
    console.log('Available window properties:', Object.keys(window).filter(k => k.includes('ai') || k.includes('form') || k.includes('Form')));
  }
};

window.testLinkedInFormHelper = function() {
  if (window.aiAssistant?.formHelper) {
    window.aiAssistant.formHelper.testLinkedInMessages();
  } else {
    console.log('❌ FormHelper not available. Make sure the extension is loaded.');
  }
};

// Log that test functions are available
console.log('🧪 Global test functions available:');
console.log('  - window.testChatGPTFormHelper:', typeof window.testChatGPTFormHelper);
console.log('  - window.testLinkedInFormHelper:', typeof window.testLinkedInFormHelper);