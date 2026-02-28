// J7 Image Extension - Background Script

// Storage for cross-site data sharing
let copiedText = '';
let activeContextUrl = '';

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
    // Extension started
});

chrome.runtime.onInstalled.addListener(() => {
    // Extension installed
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'ping') {
        sendResponse({ status: 'pong' });
        return;
    }
    
    // Context link storage handlers
    if (request.type === 'getCopiedText') {
        sendResponse({ text: copiedText });
        return true;
    }
    
    if (request.type === 'getContextUrl') {
        sendResponse({ url: activeContextUrl });
        return true;
    }
    
    if (request.type === 'setCopiedText') {
        copiedText = request.text;
        sendResponse({ success: true });
        return true;
    }
    
    if (request.type === 'setContextUrl') {
        activeContextUrl = request.url;
        sendResponse({ success: true });
        return true;
    }
    
    // Handle search tab requests
    if (request.action === 'openSearchTabs') {
        const { query } = request;
        
        chrome.storage.local.get(['autoSearchEnabled', 'autoSearchGoogle', 'autoSearchPlatform', 'tokenFilterSearchEnabled'], (settings) => {
            const autoSearchOn = settings.autoSearchEnabled !== false;
            const googleEnabled = (settings.autoSearchGoogle !== undefined ? settings.autoSearchGoogle : false) && autoSearchOn;
            const platform = settings.autoSearchPlatform || 'axiom';
            const tokenFilterEnabled = settings.tokenFilterSearchEnabled || false;
            
            if (googleEnabled) {
                const googleImagesUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
                chrome.tabs.create({
                    url: googleImagesUrl,
                    active: false
                });
            }
            
            // Auto-search modal: only on the selected platform (creates tab if needed)
            if (autoSearchOn) {
                if (platform === 'axiom') {
                    chrome.tabs.query({ url: ['*://axiom.trade/*', '*://*.axiom.trade/*'] }, (existingTabs) => {
                        if (existingTabs && existingTabs.length > 0) {
                            injectSearchIntoTab(existingTabs[0].id, query);
                        } else {
                            chrome.tabs.create({ url: 'https://axiom.trade/pulse', active: false }, (tab) => {
                                if (tab?.id) injectSearchIntoTab(tab.id, query);
                            });
                        }
                    });
                } else if (platform === 'terminal') {
                    chrome.tabs.query({ url: ['*://padre.gg/*', '*://*.padre.gg/*', '*://trade.padre.gg/*'] }, (existingTabs) => {
                        if (existingTabs && existingTabs.length > 0) {
                            injectSearchIntoPadreTab(existingTabs[0].id, query);
                        } else {
                            chrome.tabs.create({ url: 'https://trade.padre.gg/', active: false }, (tab) => {
                                if (tab?.id) injectSearchIntoPadreTab(tab.id, query);
                            });
                        }
                    });
                } else if (platform === 'gmgn') {
                    chrome.tabs.query({ url: ['*://gmgn.ai/*', '*://*.gmgn.ai/*'] }, (existingTabs) => {
                        if (existingTabs && existingTabs.length > 0) {
                            injectSearchIntoGmgnTab(existingTabs[0].id, query);
                        } else {
                            chrome.tabs.create({ url: 'https://gmgn.ai/?chain=sol', active: false }, (tab) => {
                                if (tab?.id) injectSearchIntoGmgnTab(tab.id, query);
                            });
                        }
                    });
                }
            }

            // Token Filter Search: all platforms with existing open tabs simultaneously
            if (tokenFilterEnabled) {
                chrome.tabs.query({ url: ['*://axiom.trade/*', '*://*.axiom.trade/*'] }, (tabs) => {
                    if (tabs && tabs.length > 0) injectFilterSearchIntoTab(tabs[0].id, query);
                });
                chrome.tabs.query({ url: ['*://padre.gg/*', '*://*.padre.gg/*', '*://trade.padre.gg/*'] }, (tabs) => {
                    if (tabs && tabs.length > 0) injectFilterSearchIntoPadreTab(tabs[0].id, query);
                });
                chrome.tabs.query({ url: ['*://gmgn.ai/*', '*://*.gmgn.ai/*'] }, (tabs) => {
                    if (tabs && tabs.length > 0) injectFilterSearchIntoGmgnTab(tabs[0].id, query);
                });
            }
        });
        
        sendResponse({ success: true });
        return true; // Keep message channel open for async response
    }
});

// Helper function to inject search into a tab with multiple attempts
function injectSearchIntoTab(tabId, query) {
    // Multiple injection attempts with NO delays - immediate retries
    const delays = [0, 0, 0, 0, 0, 0];
    let injectionSucceeded = false;
    const timeouts = [];
    
    delays.forEach((delay, index) => {
        const timeoutId = setTimeout(() => {
            // Skip if already succeeded
            if (injectionSucceeded) {
                return;
            }
            
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: autoSearch,
                args: [query]
            }).then((result) => {
                injectionSucceeded = true;
                
                // Cancel remaining timeouts
                timeouts.forEach((id, idx) => {
                    if (idx > index) {
                        clearTimeout(id);
                    }
                });
            }).catch((error) => {
                // Injection failed
            });
        }, delay);
        
        timeouts.push(timeoutId);
    });
}

function axiomFilterSearch(searchQuery) {
    const all = document.querySelectorAll('input[placeholder="Search by ticker or name"], input[placeholder*="Search by ticker"]');
    const inputs = Array.from(all).filter(input => {
        const stickyHeader = input.closest('.sticky');
        if (stickyHeader) {
            const label = stickyHeader.querySelector('span.text-textPrimary');
            if (label && label.textContent.trim() === 'Migrated') return false;
        }
        return true;
    });

    if (inputs[0]) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(inputs[0], searchQuery);
        inputs[0].dispatchEvent(new InputEvent('input', {
            bubbles: true, cancelable: false, composed: true,
            inputType: 'insertText', data: searchQuery
        }));
        inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
    }
}

function injectFilterSearchIntoTab(tabId, query) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: axiomFilterSearch,
        args: [query]
    }).catch(() => {});
}

function padreFilterSearch(searchQuery) {
    const filterInput = document.querySelector('input[name="TICKERS"][placeholder="Search"]');
    if (filterInput) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(filterInput, searchQuery);
        filterInput.dispatchEvent(new InputEvent('input', {
            bubbles: true, cancelable: false, composed: true,
            inputType: 'insertText', data: searchQuery
        }));
        filterInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

function injectFilterSearchIntoPadreTab(tabId, query) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: padreFilterSearch,
        args: [query]
    }).catch(() => {});
}

function gmgnFilterSearch(searchQuery) {
    const filterInput = document.querySelector('input.pi-input[placeholder*="Keyword"]');
    if (filterInput) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(filterInput, searchQuery);
        filterInput.dispatchEvent(new InputEvent('input', {
            bubbles: true, cancelable: false, composed: true,
            inputType: 'insertText', data: searchQuery
        }));
        filterInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

function injectFilterSearchIntoGmgnTab(tabId, query) {
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: gmgnFilterSearch,
        args: [query]
    }).catch(() => {});
}

// Auto-search function for Axiom.trade
function autoSearch(searchQuery) {
    let attempts = 0;
    const maxAttempts = 10000;
    let searchCompleted = false;
    
    function tryClickButton() {
        if (searchCompleted || attempts >= maxAttempts) {
            return;
        }
        attempts++;
        
        // PRIORITY 1: Check if search input already exists (modal already open)
        let existingInput = null;
        const modalContainer = document.querySelector('[role="dialog"]') || 
                              document.querySelector('[class*="modal"]') ||
                              document.querySelector('.bg-backgroundTertiary');
        
        if (modalContainer) {
            // Only look for inputs INSIDE the modal
            existingInput = modalContainer.querySelector('input[placeholder*="Search by"]') ||
                           modalContainer.querySelector('input[placeholder*="token"]') ||
                           modalContainer.querySelector('input[placeholder*="CA"]');
            
            if (existingInput) {
                fillSearchInput(existingInput, searchQuery);
                searchCompleted = true;
                return;
            }
        }
        
        // PRIORITY 2: Check if there's an open search modal we can use
        const searchModal = document.querySelector('[role="dialog"]');
        
        if (searchModal) {
            const modalInput = searchModal.querySelector('input[placeholder*="Search by"]') || 
                              searchModal.querySelector('input[placeholder*="token"]') ||
                              searchModal.querySelector('input[placeholder*="CA"]');
            
            if (modalInput) {
                fillSearchInput(modalInput, searchQuery);
                searchCompleted = true;
                return;
            }
        }
        
        // PRIORITY 3: Look for search button to open modal
        let searchButton = null;
        
        // Strategy 1: Look for the ri-search-2-line icon
        const searchIcon = document.querySelector('i.ri-search-2-line');
        if (searchIcon) {
            searchButton = searchIcon.closest('button');
            // Check if button is visible
            if (searchButton) {
                const isVisible = searchButton.offsetWidth > 0 && searchButton.offsetHeight > 0;
                if (!isVisible) {
                    searchButton = null;
                }
            }
        }
        
        // Strategy 2: Look for any ri-search icon variant
        if (!searchButton) {
            const searchIconAlt = document.querySelector('i.ri-search-line') || 
                                 document.querySelector('i[class*="ri-search"]');
            if (searchIconAlt) {
                searchButton = searchIconAlt.closest('button');
            }
        }
        
        // Strategy 3: Look for button containing search text
        if (!searchButton) {
            const allButtons = document.querySelectorAll('button');
            for (const button of allButtons) {
                const buttonText = button.textContent || '';
                if (buttonText.includes('Search by') || buttonText.includes('token') || buttonText.includes('CA')) {
                    searchButton = button;
                    break;
                }
            }
        }
        
        // Strategy 4: Look for any button with search icon inside
        if (!searchButton) {
            const buttonsWithIcon = document.querySelectorAll('button i[class*="search"]');
            if (buttonsWithIcon.length > 0) {
                searchButton = buttonsWithIcon[0].closest('button');
            }
        }
        
        if (searchButton) {
            searchButton.click();
            
            // Check for search input with retry logic
            const checkForInput = () => {
                // Look for the search input that appears after clicking
                const searchInput = document.querySelector('input[placeholder*="Search by name, ticker, or CA"]') ||
                                  document.querySelector('input[placeholder*="Search by token"]');
                
                if (searchInput) {
                    // Make sure it's NOT the sidebar search
                    const placeholder = searchInput.getAttribute('placeholder');
                    if (placeholder && placeholder.includes('name, ticker, or CA')) {
                        fillSearchInput(searchInput, searchQuery);
                        searchCompleted = true;
                        return;
                    }
                }
                
                // Retry after a delay to avoid stack overflow
                if (attempts < maxAttempts) {
                    setTimeout(tryClickButton, 10);
                }
            };
            
            checkForInput();
        } else {
            // Continue trying to find button immediately
            tryClickButton();
        }
    }
    
    function fillSearchInput(input, query) {
        // Get native setter
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        
        // Focus and click
        input.focus();
        input.click();
        
        // Set value
        nativeInputValueSetter.call(input, query);
        
        // Dispatch InputEvent (what React listens to)
        const inputEvent = new InputEvent('input', {
            bubbles: true,
            cancelable: false,
            composed: true,
            inputType: 'insertText',
            data: query
        });
        
        input.dispatchEvent(inputEvent);
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    
    // Start the search process
    tryClickButton();
}


// Auto-search function for GMGN.ai
function gmgnAutoSearch(searchQuery) {
    let attempts = 0;
    const maxAttempts = 10000;
    let searchCompleted = false;

    function trySearch() {
        if (searchCompleted || attempts >= maxAttempts) return;
        attempts++;

        // Check if the full search input is already open (the detailed one)
        const fullInput = document.querySelector('input[name="new-search-input"]') ||
                          document.querySelector('input[placeholder*="Search by name, ticker, CA"]');
        if (fullInput) {
            fillInput(fullInput, searchQuery);
            searchCompleted = true;
            return;
        }

        // Look for the compact search bar to click and open the full search modal
        const compactInput = document.querySelector('input.pi-input[placeholder*="Search name, CA"]') ||
                             document.querySelector('input[placeholder*="Search name, CA, wallet"]');
        if (compactInput) {
            compactInput.click();
            compactInput.focus();
            // Wait for the modal to open, then retry (don't fill compact input directly)
            setTimeout(trySearch, 300);
            return;
        }

        if (attempts < maxAttempts) {
            setTimeout(trySearch, 10);
        }
    }

    function fillInput(input, query) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        input.focus();
        input.click();
        nativeInputValueSetter.call(input, query);
        const inputEvent = new InputEvent('input', {
            bubbles: true,
            cancelable: false,
            composed: true,
            inputType: 'insertText',
            data: query
        });
        input.dispatchEvent(inputEvent);
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    trySearch();
}

// Helper function to inject search into a GMGN tab
function injectSearchIntoGmgnTab(tabId, query) {
    const delays = [0, 0, 0, 0, 0, 0];
    let injectionSucceeded = false;
    const timeouts = [];

    delays.forEach((delay, index) => {
        const timeoutId = setTimeout(() => {
            if (injectionSucceeded) return;
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: gmgnAutoSearch,
                args: [query]
            }).then(() => {
                injectionSucceeded = true;
                timeouts.forEach((id, idx) => {
                    if (idx > index) clearTimeout(id);
                });
            }).catch(() => {});
        }, delay);
        timeouts.push(timeoutId);
    });
}

// Auto-search function for Padre.gg
function padreAutoSearch(searchQuery) {
    let attempts = 0;
    const maxAttempts = 10000;
    let searchCompleted = false;

    function trySearch() {
        if (searchCompleted || attempts >= maxAttempts) return;
        attempts++;

        // Check if search input already exists (modal already open)
        const existingInput = document.querySelector('input[placeholder*="Search by name"]') ||
                              document.querySelector('input[placeholder*="ticker"]') ||
                              document.querySelector('input[placeholder*="CA or dev"]');
        if (existingInput) {
            fillInput(existingInput, searchQuery);
            searchCompleted = true;
            return;
        }

        // Look for the search button to open the modal
        let searchButton = null;
        const allButtons = document.querySelectorAll('button');
        for (const btn of allButtons) {
            const text = btn.textContent || '';
            if (text.includes('Search by name or CA')) {
                searchButton = btn;
                break;
            }
        }

        if (!searchButton) {
            // Try finding button with search SVG icon
            const svgPaths = document.querySelectorAll('button svg path');
            for (const path of svgPaths) {
                const d = path.getAttribute('d') || '';
                if (d.includes('14L10.0001 10M11.3333')) {
                    searchButton = path.closest('button');
                    break;
                }
            }
        }

        if (searchButton) {
            searchButton.click();
            setTimeout(() => {
                const input = document.querySelector('input[placeholder*="Search by name"]') ||
                              document.querySelector('input[placeholder*="ticker"]') ||
                              document.querySelector('input[placeholder*="CA or dev"]');
                if (input) {
                    fillInput(input, searchQuery);
                    searchCompleted = true;
                } else if (attempts < maxAttempts) {
                    setTimeout(trySearch, 10);
                }
            }, 100);
        } else {
            trySearch();
        }
    }

    function fillInput(input, query) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        input.focus();
        input.click();
        nativeInputValueSetter.call(input, query);
        const inputEvent = new InputEvent('input', {
            bubbles: true,
            cancelable: false,
            composed: true,
            inputType: 'insertText',
            data: query
        });
        input.dispatchEvent(inputEvent);
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    trySearch();
}

// Helper function to inject search into a Padre tab
function injectSearchIntoPadreTab(tabId, query) {
    const delays = [0, 0, 0, 0, 0, 0];
    let injectionSucceeded = false;
    const timeouts = [];

    delays.forEach((delay, index) => {
        const timeoutId = setTimeout(() => {
            if (injectionSucceeded) return;
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: padreAutoSearch,
                args: [query]
            }).then(() => {
                injectionSucceeded = true;
                timeouts.forEach((id, idx) => {
                    if (idx > index) clearTimeout(id);
                });
            }).catch(() => {});
        }, delay);
        timeouts.push(timeoutId);
    });
}

// Listen for tab updates to track active URLs
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // Check if it's a social media URL
        if (tab.url.includes('twitter.com') || tab.url.includes('x.com') || 
            tab.url.includes('truthsocial.com') || tab.url.includes('instagram.com')) {
            activeContextUrl = tab.url;
        }
    }
});

// Keep the service worker alive with periodic tasks
setInterval(() => {
    // Ping to keep alive
    chrome.runtime.getPlatformInfo(() => {
        // This is just to keep the service worker active
    });
}, 25000); // Every 25 seconds
