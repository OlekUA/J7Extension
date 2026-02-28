// Google Images + Axiom Search Extension - Content Script
// Helper function to format timestamps consistently
function formatTimestamp() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}
// Get selected text from the page with preserved line breaks
function getSelectedText() {
    let selectedText = '';
    // First, check if we're in an input field or textarea
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        // Get selected text from input/textarea
        const start = activeElement.selectionStart;
        const end = activeElement.selectionEnd;
        if (start !== end) {
            selectedText = activeElement.value.substring(start, end);
            return selectedText.trim();
        }
    }
    // Otherwise, get regular page selection
    if (window.getSelection) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const container = document.createElement('div');
            container.appendChild(range.cloneContents());
            // Convert HTML to text while preserving line breaks
            selectedText = container.innerHTML
                .replace(/<br\s*\/?>/gi, '\n')           // <br> tags to newlines
                .replace(/<\/p>/gi, '\n')                // </p> tags to newlines
                .replace(/<\/div>/gi, '\n')              // </div> tags to newlines
                .replace(/<\/li>/gi, '\n')               // </li> tags to newlines
                .replace(/<\/h[1-6]>/gi, '\n')           // header closing tags to newlines
                .replace(/<[^>]*>/g, '')                 // Remove all remaining HTML tags
                .replace(/&nbsp;/g, ' ')                 // Convert &nbsp; to spaces
                .replace(/&lt;/g, '<')                   // Decode HTML entities
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&');
        } else {
            selectedText = selection.toString();
        }
    } else if (document.selection && document.selection.createRange) {
        selectedText = document.selection.createRange().text;
    }
    return selectedText.trim();
}
// Load keybinds from storage
let activeKeybinds = [];
let deployButtonsEnabled = false; // Default to disabled
var insertImageButtonEnabled = true; // Use var to allow redeclaration in axiom.js
let autoSearchEnabled = true; // Auto-search feature toggle
let deploySettings = { 
    apiKey: '', 
    buyAmount: 5,
    bnbApiKey: '',
    bnbBuyAmount: 1.5,
    cashbackMode: false,
    bonkersMode: false
}; // Deploy settings
async function loadKeybinds() {
    try {
        const result = await chrome.storage.local.get(['keybinds']);
        if (result.keybinds && result.keybinds.length > 0) {
            activeKeybinds = result.keybinds;
        }
    } catch (error) {
    }
}
// Load deploy buttons setting
async function loadDeployButtonsSetting() {
    try {
        const result = await chrome.storage.local.get(['deployButtonsEnabled']);
        deployButtonsEnabled = result.deployButtonsEnabled !== undefined ? result.deployButtonsEnabled : false;
    } catch (error) {
        deployButtonsEnabled = false; // Default to disabled
    }
}
// Load insert image button setting
async function loadInsertImageButtonSetting() {
    try {
        const result = await chrome.storage.local.get(['insertImageButtonEnabled']);
        insertImageButtonEnabled = result.insertImageButtonEnabled !== undefined ? result.insertImageButtonEnabled : true;
    } catch (error) {
        insertImageButtonEnabled = true; // Default to enabled
    }
}

// Load auto-search setting
async function loadAutoSearchSetting() {
    try {
        const result = await chrome.storage.local.get(['autoSearchEnabled']);
        autoSearchEnabled = result.autoSearchEnabled !== undefined ? result.autoSearchEnabled : true;
    } catch (error) {
        autoSearchEnabled = true; // Default to enabled
    }
}
// Load deploy settings (API key and buy amount)
async function loadDeploySettings() {
    try {
        const result = await chrome.storage.local.get([
            'deployApiKey', 
            'deployBuyAmount',
            'bnbApiKey',
            'bnbBuyAmount',
            'cashbackMode',
            'bonkersMode'
        ]);
        deploySettings = {
            apiKey: result.deployApiKey || '',
            buyAmount: result.deployBuyAmount || 5,
            bnbApiKey: result.bnbApiKey || '',
            bnbBuyAmount: result.bnbBuyAmount || 1.5,
            cashbackMode: result.cashbackMode || false,
            bonkersMode: result.bonkersMode || false
        };
    } catch (error) {
        deploySettings = { 
            apiKey: '', 
            buyAmount: 5,
            bnbApiKey: '',
            bnbBuyAmount: 1.5,
            cashbackMode: false,
            bonkersMode: false
        };
    }
}
function checkKeybindMatch(event) {
    return activeKeybinds.some(keybind => {
        if (keybind.key === 'doubleclick') return false; // Handle separately
        if (keybind.enabled === false) return false; // Skip disabled keybinds
        const ctrlMatch = keybind.ctrl === (event.ctrlKey || event.metaKey);
        const shiftMatch = keybind.shift === event.shiftKey;
        const altMatch = keybind.alt === event.altKey;
        const keyMatch = keybind.key.toLowerCase() === event.key.toLowerCase();
        return ctrlMatch && shiftMatch && altMatch && keyMatch;
    });
}
// Show notification to user
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.search-extension-notification');
    existingNotifications.forEach(notification => notification.remove());
    // Create new notification
    const notification = document.createElement('div');
    notification.className = 'search-extension-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-family: Arial, sans-serif;
        font-size: 14px;
        font-weight: 500;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
        transform: translateX(400px);
    `;
    // Set color based on type
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#10b981';
            break;
        case 'error':
            notification.style.backgroundColor = '#ef4444';
            break;
        case 'warning':
            notification.style.backgroundColor = '#f59e0b';
            break;
        default:
            notification.style.backgroundColor = '#3b82f6';
    }
    notification.textContent = message;
    document.body.appendChild(notification);
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}
// Handle keyboard shortcuts for Google Images + Axiom search
async function handleKeyPress(event) {
    try {
        const result = await chrome.storage.local.get(['autoSearchEnabled', 'tokenFilterSearchEnabled']);
        const autoSearchOn = result.autoSearchEnabled !== false;
        const tokenFilterOn = result.tokenFilterSearchEnabled === true;
        if (!autoSearchOn && !tokenFilterOn) return;
    } catch (e) {}
    
    // Check if this keypress matches any active keybind
    if (checkKeybindMatch(event)) {
        const selectedText = getSelectedText();
        if (selectedText && selectedText.length > 0) {
            // Save to latestCopied
            copyToClipboard(selectedText);
            // Open Google Images + Axiom tabs
            setTimeout(() => {
                // Send message to background script to open tabs
                chrome.runtime.sendMessage({
                    action: 'openSearchTabs',
                    query: selectedText
                });
            }, 10);
        } else {
        }
    }
}
// Double-click detection with proper click counting
let clickCount = 0;
let clickTimer = null;
let isWaitingForSecondRelease = false;
function handleMouseDown(event) {
    // Only handle left mouse button
    if (event.button !== 0) return;
    clickCount++;
    // Clear existing timer
    if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
    }
    // If this is the second click, set flag to wait for release
    if (clickCount === 2) {
        isWaitingForSecondRelease = true;
    }
    // Reset click count after 1000ms if no second click
    clickTimer = setTimeout(() => {
        clickCount = 0;
        isWaitingForSecondRelease = false;
    }, 1000);
}
async function handleMouseUp(event) {
    // Only handle left mouse button
    if (event.button !== 0) return;
    
    try {
        const result = await chrome.storage.local.get(['autoSearchEnabled', 'tokenFilterSearchEnabled']);
        const autoSearchOn = result.autoSearchEnabled !== false;
        const tokenFilterOn = result.tokenFilterSearchEnabled === true;
        if (!autoSearchOn && !tokenFilterOn) return;
    } catch (e) {}
    
    // Only trigger search if we're waiting for the second release
    if (isWaitingForSecondRelease && clickCount === 2) {
        isWaitingForSecondRelease = false;
        clickCount = 0;
        if (clickTimer) {
            clearTimeout(clickTimer);
            clickTimer = null;
        }
        // Check if double-click keybind is enabled
        const doubleClickKeybind = activeKeybinds.find(kb => kb.key === 'doubleclick');
        if (!doubleClickKeybind || doubleClickKeybind.enabled === false) {
            return;
        }
        // Wait for text selection to complete after mouse release
        setTimeout(() => {
            const selectedText = getSelectedText();
            if (selectedText && selectedText.length > 0) {
                // Copy to clipboard using modern API
                copyToClipboard(selectedText);
                // Execute search immediately
                chrome.runtime.sendMessage({
                    action: 'openSearchTabs',
                    query: selectedText
                });
            } else {
                // Retry once more with longer delay
                setTimeout(() => {
                    const retrySelectedText = getSelectedText();
                    if (retrySelectedText && retrySelectedText.length > 0) {
                        copyToClipboard(retrySelectedText);
                        chrome.runtime.sendMessage({
                            action: 'openSearchTabs',
                            query: retrySelectedText
                        });
                    }
                }, 100);
            }
        }, 50);
    }
}
// Storage functions for latest copied text
async function saveLatestCopied(text) {
    try {
        const timestamp = new Date().toISOString();
        const data = {
            latestCopied: text,
            copiedAt: timestamp
        };
        await chrome.storage.local.set(data);
    } catch (error) {
    }
}
async function getLatestCopied() {
    try {
        const result = await chrome.storage.local.get(['latestCopied', 'copiedAt']);
        if (result.latestCopied) {
            return {
                text: result.latestCopied,
                timestamp: result.copiedAt
            };
        }
        return null;
    } catch (error) {
        return null;
    }
}
// Storage functions for latest context link (exactly like Google Deploy Extension)
async function saveLatestLink(url) {
    try {
        const timestamp = new Date().toISOString();
        const data = {
            latestLink: url,
            linkSavedAt: timestamp
        };
        await chrome.storage.local.set(data);
    } catch (error) {
    }
}
async function getLatestLink() {
    try {
        const result = await chrome.storage.local.get(['latestLink', 'linkSavedAt']);
        if (result.latestLink) {
            return {
                url: result.latestLink,
                timestamp: result.linkSavedAt
            };
        }
        return null;
    } catch (error) {
        return null;
    }
}
// Save to storage (clipboard removed)
async function copyToClipboard(text) {
    try {
        // Save to storage
        await saveLatestCopied(text);
    } catch (error) {
    }
}
// Context link monitoring functions (exactly like Google Deploy Extension)
function monitorContextLinks() {
    // Monitor for tracker site Twitter card clicks
    if (window.location.hostname.includes('j7tracker.io') || window.location.hostname.includes('j7tracker.com')) {
        // Add mousedown handlers to all tweet cards (same logic as Google Deploy Extension)
        const tweetCards = document.querySelectorAll('.tweet-embed');
        tweetCards.forEach(tweetCard => {
            // Add mousedown handler if not already added
            if (!tweetCard.hasAttribute('data-axiom-search-handler')) {
                tweetCard.setAttribute('data-axiom-search-handler', 'true');
                tweetCard.addEventListener('mousedown', (e) => {
                    if (e.button === 0) { // Left click only
                        // Use exact same logic as Google Deploy Extension
                        const contextLink = tweetCard.querySelector('.context-link');
                        const postUrl = contextLink?.href || 'unknown';
                        if (postUrl !== 'unknown' && (postUrl.includes('twitter.com') || postUrl.includes('x.com') || 
                                                        postUrl.includes('truthsocial.com') || postUrl.includes('instagram.com'))) {
                            // Store context URL
                            chrome.runtime.sendMessage({
                                type: 'setContextUrl',
                                url: postUrl
                            });
                            // Also save to local storage
                            saveLatestLink(postUrl);
                        } else {
                        }
                    }
                });
            }
        });
        // Also watch for dynamically loaded cards
        const observer = new MutationObserver(() => {
            const newTweetCards = document.querySelectorAll('.tweet-embed:not([data-axiom-search-handler])');
            if (newTweetCards.length > 0) {
                newTweetCards.forEach(tweetCard => {
                    tweetCard.setAttribute('data-axiom-search-handler', 'true');
                    tweetCard.addEventListener('mousedown', (e) => {
                        if (e.button === 0) { // Left click only
                            // Use exact same logic as Google Deploy Extension
                            const contextLink = tweetCard.querySelector('.context-link');
                            const postUrl = contextLink?.href || 'unknown';
                            if (postUrl !== 'unknown' && (postUrl.includes('twitter.com') || postUrl.includes('x.com') || 
                                                                postUrl.includes('truthsocial.com') || postUrl.includes('instagram.com'))) {
                                // Store context URL
                                chrome.runtime.sendMessage({
                                    type: 'setContextUrl',
                                    url: postUrl
                                });
                                // Also save to local storage
                                saveLatestLink(postUrl);
                            } else {
                            }
                        }
                    });
                });
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    // Monitor for social media URL changes on social media sites
    if (window.location.hostname.includes('twitter.com') || window.location.hostname.includes('x.com') || 
        window.location.hostname.includes('truthsocial.com') || window.location.hostname.includes('instagram.com')) {
        // Store current URL as active social media URL
        chrome.runtime.sendMessage({
            type: 'setContextUrl',
            url: window.location.href
        });
        // Also save to local storage
        saveLatestLink(window.location.href);
        // Monitor for URL changes (SPA navigation)
        let lastUrl = window.location.href;
        const observer = new MutationObserver(() => {
            if (window.location.href !== lastUrl) {
                lastUrl = window.location.href;
                chrome.runtime.sendMessage({
                    type: 'setContextUrl',
                    url: lastUrl
                });
                // Also save to local storage
                saveLatestLink(lastUrl);
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
}
// Initialize the extension
async function init() {
    // Load keybinds and deploy buttons setting first
    await loadKeybinds();
    await loadDeployButtonsSetting();
    await loadInsertImageButtonSetting();
    await loadAutoSearchSetting();
    await loadDeploySettings();
    // Add event listener for keypress - NON-BLOCKING MODE
    document.addEventListener('keydown', handleKeyPress, { passive: true, capture: false });
    // Add event listeners for proper double-click detection
    document.addEventListener('mousedown', handleMouseDown, { passive: true, capture: false });
    document.addEventListener('mouseup', handleMouseUp, { passive: true, capture: false });
    // Initialize context link monitoring
    monitorContextLinks();
    // Listen for keybind reload and deploy buttons reload requests
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === 'reloadKeybinds') {
            loadKeybinds().then(() => {
                sendResponse({ success: true });
            });
            return true; // Keep message channel open for async response
        } else if (request.type === 'reloadDeployButtons' || request.type === 'reloadInsertImageButton') {
            Promise.all([loadDeployButtonsSetting(), loadInsertImageButtonSetting()]).then(() => {
                // Update visibility dynamically without page reload
                document.querySelectorAll('[data-j7-insert-image-btn]').forEach(btn => {
                    btn.style.display = insertImageButtonEnabled ? 'block' : 'none';
                });
                document.querySelectorAll('[data-j7-chain-buttons]').forEach(grid => {
                    grid.style.display = deployButtonsEnabled ? 'grid' : 'none';
                });
            });
            sendResponse({ success: true });
        } else if (request.type === 'reloadDeploySettings') {
            const oldBonkersMode = deploySettings.bonkersMode;
            loadDeploySettings().then(() => {
                if (deploySettings.bonkersMode !== oldBonkersMode) {
                    document.querySelectorAll('.chain-buttons-container').forEach(c => c.remove());
                }
                sendResponse({ success: true });
            });
            return true; // Keep message channel open for async response
        }
    });
    // Show initial status
    setTimeout(() => {
    }, 1000);
}
// Auto-enhance modal whenever it appears on axiom.trade
function startModalWatcher() {
    if (!window.location.hostname.includes('axiom.trade')) return;
    // Check for modal every 100ms for faster detection
    setInterval(() => {
        // ONLY target the SEARCH modal - must have the search input with specific placeholder
        const searchInput = document.querySelector('input[placeholder*="Search by name, ticker, or CA"]');
        if (!searchInput) return;
        
        // Find the modal container that contains this search input
        const modal = searchInput.closest('.bg-backgroundTertiary');
        if (!modal) return;
        
        if (!modal.hasAttribute('data-enhanced')) {
            // Mark as enhanced to avoid repeated processing
            modal.setAttribute('data-enhanced', 'true');
            // Apply enhancements (only to search modal now, not Import Wallet etc)
            enhanceModalSize();
            // Add chain buttons immediately
            addChainButtons(modal);
            // Also check again after a delay to catch dynamically loaded content
            setTimeout(() => addChainButtons(modal), 100);
            setTimeout(() => addChainButtons(modal), 300);
            setTimeout(() => addChainButtons(modal), 500);
            setTimeout(() => addChainButtons(modal), 1000);
        }
        // Also try to add buttons to any modal we find, even if it's already enhanced
        if (modal) {
            addChainButtons(modal);
        }
    }, 100);
    // Also use MutationObserver for instant detection
    let modalObserver = null; // Observer for modal content changes
    const bodyObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // ONLY look for the search modal with the specific search input
                    const searchInput = node.querySelector ? node.querySelector('input[placeholder*="Search by name, ticker, or CA"]') : null;
                    if (searchInput) {
                        const modal = searchInput.closest('.bg-backgroundTertiary');
                        if (modal) {
                            setTimeout(() => addChainButtons(modal), 50);
                            setTimeout(() => addChainButtons(modal), 200);
                            setTimeout(() => addChainButtons(modal), 500);
                            // Start observing ONLY the modal for changes
                            if (modalObserver) {
                                modalObserver.disconnect();
                            }
                            modalObserver = new MutationObserver((modalMutations) => {
                                // Debounce: clear previous timer and set new one
                                clearTimeout(addChainButtonsTimer);
                                addChainButtonsTimer = setTimeout(() => {
                                    // Check if modal still exists
                                    if (document.body.contains(modal)) {
                                        addChainButtons(modal);
                                    } else {
                                        // Modal was removed, disconnect this observer
                                        if (modalObserver) {
                                            modalObserver.disconnect();
                                            modalObserver = null;
                                        }
                                    }
                                }, 300);
                            });
                            // Observe only the modal, not the whole body
                            modalObserver.observe(modal, {
                                childList: true,
                                subtree: true
                            });
                        }
                    }
                }
            });
        });
    });
    bodyObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
}
// Extract token details from a token section (using Axiom Deploy's logic)
function extractTokenDetails(tokenSection) {
    try {
        // Get token symbol/ticker and full name from the flex column structure
        let symbol = '';
        let fullName = '';
        
        // Try new structure first: span.text-textPrimary with sm:text-[16px] containing a div with the ticker
        const tickerSpanNew = tokenSection.querySelector('span.text-textPrimary[class*="sm:text-[16px]"][class*="font-medium"]');
        if (tickerSpanNew) {
            const innerDiv = tickerSpanNew.querySelector('div.truncate, div[class*="whitespace-nowrap"]');
            if (innerDiv && innerDiv.textContent.trim()) {
                const text = innerDiv.textContent.trim();
                if (text.length >= 1 && text.length <= 30 && !text.includes(' ')) {
                    symbol = text;
                }
            }
            if (!symbol && tickerSpanNew.textContent.trim()) {
                const text = tickerSpanNew.textContent.trim();
                if (text.length >= 1 && text.length <= 30 && !text.includes(' ')) {
                    symbol = text;
                }
            }
        }
        
        // Try to get full name from new structure
        const nameSpanNew = tokenSection.querySelector('span.text-textTertiary span[class*="font-medium"][class*="truncate"]');
        if (nameSpanNew) {
            const innerDiv = nameSpanNew.querySelector('div.truncate, div[class*="whitespace-nowrap"]');
            if (innerDiv) {
                fullName = innerDiv.textContent.trim();
            } else {
                fullName = nameSpanNew.textContent.trim();
            }
        }
        
        // Find the main flex column that contains both ticker and name (old structure)
        if (!symbol) {
            const tokenInfoDiv = tokenSection.querySelector('div.flex.flex-col.gap-\\[4px\\]');
            if (tokenInfoDiv) {
                // Get the first flex-row div which contains ticker and name
                const nameRow = tokenInfoDiv.querySelector('div.flex.flex-row.gap-\\[4px\\]');
                if (nameRow) {
                    // First span contains the ticker (short version)
                    const tickerSpan = nameRow.querySelector('span.text-textPrimary');
                    if (tickerSpan) {
                        const tickerDiv = tickerSpan.querySelector('div');
                        if (tickerDiv) {
                            symbol = tickerDiv.textContent.trim();
                        }
                    }
                    // Button contains the full name
                    if (!fullName) {
                        const nameButton = nameRow.querySelector('button span[class*="truncate"]');
                        if (nameButton) {
                            const nameDiv = nameButton.querySelector('div');
                            if (nameDiv) {
                                fullName = nameDiv.textContent.trim();
                            }
                        }
                    }
                }
            }
        }
        
        // Fallback: try the old method if new structure didn't work
        if (!symbol) {
            const allTickerSpans = tokenSection.querySelectorAll('span.text-textPrimary');
            for (let i = 0; i < allTickerSpans.length; i++) {
                const span = allTickerSpans[i];
                const text = span.textContent.trim();
                if (span.querySelector('span') || span.querySelector('div')) {
                    const childElements = span.querySelectorAll('span, div');
                    for (let j = 0; j < childElements.length; j++) {
                        const childEl = childElements[j];
                        const childText = childEl.textContent.trim();
                        if (childText.length >= 1 && childText.length <= 15) {
                            symbol = childText;
                            break;
                        }
                    }
                    if (symbol) break;
                    continue;
                }
                if (text.length >= 1 && text.length <= 15 && text.length < 20) {
                    symbol = text;
                    break;
                }
            }
        }
        // Fallback for full name
        if (!fullName) {
            // Try to get from the clickable token name span (most accurate)
            const nameSpan = tokenSection.querySelector('span.text-inherit[class*="font-medium"][class*="truncate"]');
            if (nameSpan) {
                fullName = nameSpan.textContent.trim();
            }
        }
        // Get image element (needed for both name fallback and image URL)
        let imageElement = tokenSection.querySelector('img[src*="axiomtrading"]');
        // Try other common image selectors if axiomtrading not found
        if (!imageElement) {
            imageElement = tokenSection.querySelector('img[src*="token"], img[src*="coin"], img[alt*="token"], img[alt*="coin"]');
        }
        // Generic image fallback
        if (!imageElement) {
            imageElement = tokenSection.querySelector('img');
        }
        // Fallback: get from image alt attribute
        if (!fullName && imageElement && imageElement.alt) {
            fullName = imageElement.alt.trim();
        }
        // Use symbol as final fallback if no full name found
        if (!fullName && symbol) {
            fullName = symbol;
        }
        // Get image URL
        const imageUrl = imageElement ? imageElement.src : '';
        return {
            symbol: symbol || 'Unknown',
            fullName: fullName || symbol || 'Unknown',
            imageUrl: imageUrl
        };
    } catch (error) {
        return null;
    }
}
// Add chain buttons to token cards in the modal
// Debounce timer for addChainButtons
let addChainButtonsTimer = null;
function addChainButtons(modal) {
    // Check if at least one feature is enabled
    if (!deployButtonsEnabled && !insertImageButtonEnabled) {
        return;
    }
    
    // ONLY work on the search modal - must have the specific search input
    const hasSearchInput = modal.querySelector('input[placeholder*="Search by name, ticker, or CA"]');
    if (!hasSearchInput) {
        return;
    }
    
    // Find all clickable token items in the search results
    // Old structure: a[href^="/meme/"] with flex-row and px-[16px]
    // New structure: div.group.relative with nested <a> link
    let tokenItems = modal.querySelectorAll('a[href^="/meme/"][class*="flex-row"][class*="px-\\[16px\\]"]');
    
    // If no old structure found, try new structure
    if (tokenItems.length === 0) {
        tokenItems = modal.querySelectorAll('div.group.relative[class*="flex-row"][class*="px-\\[16px\\]"]');
    }
    
    // Also try matching by height classes (new modal structure)
    if (tokenItems.length === 0) {
        tokenItems = modal.querySelectorAll('div.group.relative[class*="sm:h-\\[88px\\]"], div.group.relative[class*="h-\\[64px\\]"]');
    }
    
    if (tokenItems.length === 0) {
        return;
    }
    tokenItems.forEach((tokenItem, index) => {
        // Skip if already has buttons
        if (tokenItem.querySelector('.chain-buttons-container')) {
            return;
        }
        // Extract token details using Axiom Deploy's logic
        const tokenDetails = extractTokenDetails(tokenItem);
        if (!tokenDetails) {
            return;
        }
        const tokenName = tokenDetails.fullName;
        // Make token item position relative for absolute positioning
        tokenItem.style.position = 'relative';
        // Create button container with absolute positioning - 2x2 grid + INSERT IMAGE button
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'chain-buttons-container';
        buttonContainer.style.cssText = `
            position: absolute;
            right: 180px;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            flex-direction: row;
            gap: 6px;
            align-items: center;
            z-index: 10;
            pointer-events: auto;
        `;
        // Create the 2x2 grid for chain buttons (if enabled)
        if (deployButtonsEnabled) {
        const chainGrid = document.createElement('div');
        chainGrid.setAttribute('data-j7-chain-buttons', 'true');
        chainGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(2, 1fr);
            gap: 3px;
        `;
            // Button configurations - 4 buttons in 2x2 grid
            const isBonkers = deploySettings.bonkersMode;
            const chains = [
                { name: 'USD1', icon: 'usd1-logo.png', type: 'usd1' },
                { name: isBonkers ? 'BONKERS' : 'BONK', icon: isBonkers ? 'bonkers-logo.svg' : 'bonk-logo.png', type: 'bonk' },
                { name: 'BNB', icon: 'bnb-logo.png', type: 'bnb' },
                { name: 'PUMP', icon: 'pump-logo.png', type: 'pump' }
            ];
        chains.forEach((chain) => {
            const isBonkersChain = isBonkers && (chain.type === 'usd1' || chain.type === 'bonk');
            const defaultBorder = isBonkersChain ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.2)';
            const hoverBorder = isBonkersChain ? 'rgba(239, 68, 68, 0.8)' : 'rgba(255, 255, 255, 0.4)';
            const button = document.createElement('button');
            button.className = 'chain-button';
            button.title = `Deploy ${tokenName} on ${chain.name}`;
            button.style.cssText = `
                width: 32px;
                height: 32px;
                border-radius: 6px;
                background: rgba(26, 26, 26, 0.9);
                border: 1px solid ${defaultBorder};
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s;
                flex-shrink: 0;
            `;
            // Add icon
            const icon = document.createElement('img');
            icon.src = chrome.runtime.getURL(`icons/${chain.icon}`);
            icon.style.cssText = `
                width: 20px;
                height: 20px;
                object-fit: contain;
            `;
            button.appendChild(icon);
            // Add hover effect
            button.addEventListener('mouseenter', () => {
                button.style.background = 'rgba(255, 255, 255, 0.2)';
                button.style.transform = 'scale(1.1)';
                button.style.borderColor = hoverBorder;
            });
            button.addEventListener('mouseleave', () => {
                button.style.background = 'rgba(26, 26, 26, 0.9)';
                button.style.transform = 'scale(1)';
                button.style.borderColor = defaultBorder;
            });
            // Add click handler - Deploy token using J7Tracker External API
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                // Determine which API key and buy amount to use
                const isBNB = chain.type === 'bnb';
                const apiKey = isBNB ? deploySettings.bnbApiKey : deploySettings.apiKey;
                const buyAmount = isBNB ? deploySettings.bnbBuyAmount : deploySettings.buyAmount;
                // Check if API key is configured
                if (!apiKey) {
                    button.innerHTML = '<span style="font-size: 10px;">NO KEY</span>';
                    setTimeout(() => {
                        button.innerHTML = '';
                        button.appendChild(icon.cloneNode(true));
                    }, 2000);
                    return;
                }
                // Get latest link for Twitter URL
                const latestLink = await getLatestLink();
                // Extract URL if latestLink is an object
                let twitterUrl = null;
                if (latestLink) {
                    if (typeof latestLink === 'object' && latestLink.url) {
                        twitterUrl = latestLink.url;
                    } else if (typeof latestLink === 'string') {
                        twitterUrl = latestLink;
                    }
                }
                // Prepare deploy request
                const deployRequest = {
                    api_key: apiKey,
                    type: chain.type,
                    name: tokenDetails.fullName,
                    ticker: tokenDetails.symbol,
                    image_data: tokenDetails.imageUrl,
                    buy_amount: buyAmount
                };
                // Add Twitter URL if we have a latest link
                if (twitterUrl) {
                    deployRequest.twitter = twitterUrl;
                }
                // Add cashback_mode for pump.fun deploys
                if (chain.type === 'pump' && deploySettings.cashbackMode) {
                    deployRequest.cashback_mode = true;
                }
                // Add bonkers_mode for bonk/usd1 deploys
                if ((chain.type === 'bonk' || chain.type === 'usd1') && deploySettings.bonkersMode) {
                    deployRequest.bonkers_mode = true;
                }
                // Show loading state
                button.style.background = 'rgba(59, 130, 246, 0.9)';
                button.innerHTML = '<span style="font-size: 10px;">...</span>';
                try {
                    const deployUrl = await getDeployUrl();
                    const response = await fetch(deployUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(deployRequest)
                    });
                    const result = await response.json();
                    if (result.success) {
                        // Show success state
                        button.style.background = 'rgb(16, 185, 129)';
                        button.innerHTML = '<span style="font-size: 14px;">✓</span>';
                        setTimeout(() => {
                            button.style.background = 'rgba(26, 26, 26, 0.9)';
                            button.innerHTML = '';
                            button.appendChild(icon.cloneNode(true));
                        }, 2000);
                    } else {
                        button.style.background = 'rgb(239, 68, 68)';
                        button.innerHTML = '<span style="font-size: 14px;">✗</span>';
                        setTimeout(() => {
                            button.style.background = 'rgba(26, 26, 26, 0.9)';
                            button.innerHTML = '';
                            button.appendChild(icon.cloneNode(true));
                        }, 2000);
                    }
                } catch (error) {
                    button.style.background = 'rgb(239, 68, 68)';
                    button.innerHTML = '<span style="font-size: 10px;">ERROR</span>';
                    setTimeout(() => {
                        button.style.background = 'rgba(26, 26, 26, 0.9)';
                        button.innerHTML = '';
                        button.appendChild(icon.cloneNode(true));
                    }, 2000);
                }
            });
            chainGrid.appendChild(button);
        });
        // Add chain grid to container
        buttonContainer.appendChild(chainGrid);
        }
        // Create INSERT IMAGE button (if enabled)
        if (insertImageButtonEnabled) {
        const insertImageButton = document.createElement('button');
        insertImageButton.setAttribute('data-j7-insert-image-btn', 'true');
        insertImageButton.className = 'insert-image-button';
        insertImageButton.title = 'Insert Image to Deploy GUI';
        
        // Use token image as background if available - no overlay, just the image
        const hasImage = tokenDetails.imageUrl && tokenDetails.imageUrl.length > 0;
        const imageBackground = hasImage 
            ? `url('${tokenDetails.imageUrl}')`
            : 'rgb(59, 130, 246)';
        
        insertImageButton.style.cssText = `
            width: 67px;
            height: 67px;
            padding: 0;
            border-radius: 6px;
            background: ${imageBackground};
            background-size: cover;
            background-position: center;
            border: 2px solid rgba(255, 255, 255, 0.3);
            cursor: pointer;
            transition: all 0.2s;
            flex-shrink: 0;
        `;
        
        const defaultBackground = imageBackground;
        
        insertImageButton.addEventListener('mouseenter', () => {
            insertImageButton.style.transform = 'scale(1.8)';
            insertImageButton.style.borderColor = 'rgba(255, 255, 255, 0.9)';
            insertImageButton.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.5)';
            insertImageButton.style.zIndex = '9999';
            insertImageButton.style.borderRadius = '8px';
        });
        insertImageButton.addEventListener('mouseleave', () => {
            insertImageButton.style.transform = 'scale(1)';
            insertImageButton.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            insertImageButton.style.boxShadow = 'none';
            insertImageButton.style.zIndex = 'auto';
            insertImageButton.style.borderRadius = '6px';
        });
        // Add click handler for INSERT IMAGE button
        insertImageButton.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            // Send VAMP UPDATE request with only the image
            try {
                const result = await vampUpdate({ image_url: tokenDetails.imageUrl });
                if (result.success) {
                    // Show success feedback - green border
                    insertImageButton.style.borderColor = 'rgb(16, 185, 129)';
                    insertImageButton.style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.6)';
                    setTimeout(() => {
                        insertImageButton.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                        insertImageButton.style.boxShadow = 'none';
                    }, 1500);
                } else {
                    // Show error feedback - red border
                    insertImageButton.style.borderColor = 'rgb(239, 68, 68)';
                    insertImageButton.style.boxShadow = '0 0 12px rgba(239, 68, 68, 0.6)';
                    setTimeout(() => {
                        insertImageButton.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                        insertImageButton.style.boxShadow = 'none';
                    }, 1500);
                }
            } catch (error) {
                // Show error feedback - red border
                insertImageButton.style.borderColor = 'rgb(239, 68, 68)';
                insertImageButton.style.boxShadow = '0 0 12px rgba(239, 68, 68, 0.6)';
                setTimeout(() => {
                    insertImageButton.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    insertImageButton.style.boxShadow = 'none';
                }, 1500);
            }
        });
        // Add INSERT IMAGE button to container
        buttonContainer.appendChild(insertImageButton);
        }
        // Append to token item
        tokenItem.appendChild(buttonContainer);
    });
}
// Enhanced modal size function
// Only expands the SEARCH modal (where VAMP buttons are), not other modals like Import Wallet
function enhanceModalSize() {
    // ONLY target the SEARCH modal - must have the specific search input
    const searchInput = document.querySelector('input[placeholder*="Search by name, ticker, or CA"]');
    if (!searchInput) return;
    
    // Find the modal container that contains this search input
    const modal = searchInput.closest('.bg-backgroundTertiary');
    if (!modal) return;
    
    // Apply enhanced styles to the SEARCH modal only
    modal.style.cssText += `
        height: 85vh !important;
        max-height: 85vh !important;
        min-height: 700px !important;
    `;
    
    // Find the results container
    const resultsContainer = modal.querySelector('div[class*="overflow-y-auto"]') ||
                           modal.querySelector('.flex.flex-col.flex-1') ||
                           modal.querySelector('div[class*="h-[352px]"]');
    if (resultsContainer) {
        resultsContainer.style.cssText += `
            height: 60vh !important;
            max-height: 60vh !important;
            min-height: 500px !important;
            overflow-y: auto !important;
        `;
    }
    
    // Enhance fixed height containers
    const fixedHeightContainers = modal.querySelectorAll('div[class*="h-["]');
    fixedHeightContainers.forEach((container) => {
        if (container.classList.toString().includes('h-[352px]') || 
            container.classList.toString().includes('h-[600px]') ||
            container.classList.toString().includes('h-[480px]')) {
            container.style.cssText += `
                height: auto !important;
                min-height: 500px !important;
                max-height: 70vh !important;
            `;
        }
    });
}
// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        init();
        startModalWatcher();
    });
} else {
    init();
    startModalWatcher();
} 
