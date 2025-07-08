// Universal AI Assistant - Options Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('Options page loaded');

    // Initialize options page
    loadSettings();
    checkAIStatus();
    setupEventListeners();
});

// Load saved settings
async function loadSettings() {
    try {
        const settings = await chrome.storage.sync.get([
            'enableExtension',
            'autoShowSidebar',
            'themeMode',
            'saveHistory'
        ]);

        // Set toggle switches
        document.getElementById('enable-extension').checked = settings.enableExtension !== false;
        document.getElementById('auto-show-sidebar').checked = settings.autoShowSidebar === true;
        document.getElementById('save-history').checked = settings.saveHistory !== false;

        // Set theme
        document.getElementById('theme-mode').value = settings.themeMode || 'auto';

        console.log('Settings loaded:', settings);
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

// Save settings
async function saveSettings() {
    try {
        const settings = {
            enableExtension: document.getElementById('enable-extension').checked,
            autoShowSidebar: document.getElementById('auto-show-sidebar').checked,
            themeMode: document.getElementById('theme-mode').value,
            saveHistory: document.getElementById('save-history').checked
        };

        await chrome.storage.sync.set(settings);
        console.log('Settings saved:', settings);

        // Notify content scripts about settings change
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'settingsChanged',
                    settings: settings
                }).catch(() => {
                    // Ignore errors for tabs that don't have our content script
                });
            });
        });
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}

// Check AI status
async function checkAIStatus() {
    const statusDisplay = document.getElementById('ai-status-display');
    const statusIndicator = statusDisplay.querySelector('.status-indicator');
    const statusText = statusDisplay.querySelector('.status-text');

    try {
        // Show loading state
        statusIndicator.textContent = '⏳';
        statusText.textContent = 'Checking AI availability...';

        // Check with background script
        const response = await chrome.runtime.sendMessage({
            action: 'checkPromptAPI'
        });

        console.log('AI status response:', response);

        if (response.available) {
            switch (response.state) {
                case 'ready':
                    statusIndicator.textContent = '✅';
                    statusText.textContent = 'AI is ready and available';
                    break;

                case 'download-required':
                    statusIndicator.textContent = '📥';
                    statusText.textContent = 'AI model download required (~2GB)';
                    break;

                default:
                    statusIndicator.textContent = '✅';
                    statusText.textContent = 'AI is available';
                    break;
            }
        } else {
            statusIndicator.textContent = '❌';
            statusText.textContent = `AI unavailable: ${response.error || 'Unknown error'}`;

            // Show additional help for common issues
            if (response.error && response.error.includes('Early Preview Program')) {
                statusText.textContent += ' (Join EPP required)';
            }
        }
    } catch (error) {
        console.error('Failed to check AI status:', error);
        statusIndicator.textContent = '⚠️';
        statusText.textContent = 'Failed to check AI status';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Setting changes
    document.getElementById('enable-extension').addEventListener('change', saveSettings);
    document.getElementById('auto-show-sidebar').addEventListener('change', saveSettings);
    document.getElementById('theme-mode').addEventListener('change', saveSettings);
    document.getElementById('save-history').addEventListener('change', saveSettings);

    // Check AI button
    document.getElementById('check-ai-btn').addEventListener('click', checkAIStatus);

    // Data management buttons
    document.getElementById('clear-history-btn').addEventListener('click', clearHistory);
    document.getElementById('export-data-btn').addEventListener('click', exportData);
}

// Clear history
async function clearHistory() {
    if (!confirm('Are you sure you want to clear all prompt history? This action cannot be undone.')) {
        return;
    }

    try {
        await chrome.storage.local.clear();
        console.log('History cleared');

        // Show success message
        showNotification('History cleared successfully', 'success');
    } catch (error) {
        console.error('Failed to clear history:', error);
        showNotification('Failed to clear history', 'error');
    }
}

// Export data
async function exportData() {
    try {
        const data = await chrome.storage.local.get(null);
        const settings = await chrome.storage.sync.get(null);

        const exportData = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            settings: settings,
            data: data
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-assistant-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        URL.revokeObjectURL(url);

        console.log('Data exported');
        showNotification('Data exported successfully', 'success');
    } catch (error) {
        console.error('Failed to export data:', error);
        showNotification('Failed to export data', 'error');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        opacity: 0;
        transform: translateY(-10px);
        transition: all 0.3s ease;
    `;

    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.background = '#10b981';
            break;
        case 'error':
            notification.style.background = '#ef4444';
            break;
        default:
            notification.style.background = '#3b82f6';
            break;
    }

    // Add to page
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Listen for messages from other parts of the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Options page received message:', message);

    switch (message.action) {
        case 'settingsChanged':
            loadSettings();
            break;

        case 'aiStatusChanged':
            checkAIStatus();
            break;
    }
});

// Make startModelDownload available globally for the download button
window.startModelDownload = async function() {
    const statusDisplay = document.getElementById('ai-status-display');
    const statusIndicator = statusDisplay.querySelector('.status-indicator');
    const statusText = statusDisplay.querySelector('.status-text');

    try {
        statusIndicator.textContent = '⏳';
        statusText.textContent = 'Downloading AI model...';

        // Send message to background script to start download
        const response = await chrome.runtime.sendMessage({
            action: 'startModelDownload'
        });

        if (response.success) {
            statusIndicator.textContent = '✅';
            statusText.textContent = 'AI model downloaded successfully';
        } else {
            statusIndicator.textContent = '❌';
            statusText.textContent = `Download failed: ${response.error}`;
        }
    } catch (error) {
        console.error('Model download failed:', error);
        statusIndicator.textContent = '❌';
        statusText.textContent = 'Download failed';
    }
};

console.log('Options page script loaded');