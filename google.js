// Google Images Deploy Integration for J7 Image Extension
// Adds deploy buttons to Google Images search results
// Utility function for timestamp formatting
function formatTimestamp() {
    const now = new Date();
    return now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
}
// Get latestCopied from storage
async function getLatestCopied() {
    try {
        const result = await chrome.storage.local.get(['latestCopied']);
        return result.latestCopied || null;
    } catch (error) {
        return null;
    }
}
// Get latestLink from storage
async function getLatestLink() {
    try {
        const result = await chrome.storage.local.get(['latestLink']);
        return result.latestLink || null;
    } catch (error) {
        return null;
    }
}
// Get deploy settings from storage
async function getDeploySettings() {
    try {
        const result = await chrome.storage.local.get([
            'deployApiKey',
            'deployBuyAmount',
            'bnbApiKey',
            'bnbBuyAmount',
            'cashbackMode',
            'bonkersMode'
        ]);
        return {
            apiKey: result.deployApiKey || '',
            buyAmount: parseFloat(result.deployBuyAmount) || 5,
            bnbApiKey: result.bnbApiKey || '',
            bnbBuyAmount: parseFloat(result.bnbBuyAmount) || 1.5,
            cashbackMode: result.cashbackMode || false,
            bonkersMode: result.bonkersMode || false
        };
    } catch (error) {
        return { apiKey: '', buyAmount: 5, bnbApiKey: '', bnbBuyAmount: 1.5, cashbackMode: false, bonkersMode: false };
    }
}
// Ticker generation from token name (same logic as Axiom deploy)
function generateTickerFromName(name) {
    if (!name || !name.trim()) {
        return 'TOKEN';
    }
    const trimmedName = name.trim();
    const cleanedName = trimmedName.replace(/\s+/g, ' ');
    const words = cleanedName.split(' ');
    if (!words.length) {
        return 'TOKEN';
    }
    // Process words and separate text from numbers
    const cleanWords = [];
    for (const word of words) {
        if (/\d/.test(word)) {
            const parts = word.match(/[a-zA-Z]+|[\d.\-+]+/g) || [];
            for (const part of parts) {
                if (/\d/.test(part)) {
                    cleanWords.push({ type: 'number', value: part.toUpperCase() });
                } else {
                    if (part) cleanWords.push({ type: 'text', value: part });
                }
            }
        } else {
            if (word) cleanWords.push({ type: 'text', value: word });
        }
    }
    if (!cleanWords.length) {
        return 'TOKEN';
    }
    const textWords = cleanWords.filter(w => w.type === 'text').map(w => w.value);
    const numberWordsLength = cleanWords.filter(w => w.type === 'number').reduce((sum, w) => sum + w.value.length, 0);
    let textRule = 'none';
    if (textWords.length >= 3) {
        textRule = 'first_letter';
    } else if (textWords.length === 1) {
        const fullWordLength = textWords[0].length + numberWordsLength;
        textRule = fullWordLength <= 10 ? 'full_word' : 'trim_word';
    } else if (textWords.length === 2) {
        const [word1, word2] = textWords;
        if (word2.toLowerCase() === 'token' || word2.toLowerCase() === 'coin') {
            const firstWordLength = word1.length + numberWordsLength;
            if (firstWordLength <= 10) {
                textRule = 'first_word_only';
            }
        } else {
            const combinedLength = word1.length + word2.length + numberWordsLength;
            const combinedWithSpaceLength = word1.length + 1 + word2.length;
            if (combinedWithSpaceLength <= 11 && combinedLength <= 10) {
                textRule = 'combine_words';
            } else {
                textRule = 'first_letter';
            }
        }
    }
    const resultParts = [];
    let textWordIndex = 0;
    for (const wordObj of cleanWords) {
        if (wordObj.type === 'number') {
            resultParts.push(wordObj.value);
        } else {
            const word = wordObj.value;
            switch (textRule) {
                case 'first_letter':
                    resultParts.push(word[0].toUpperCase());
                    break;
                case 'full_word':
                    resultParts.push(word.toUpperCase());
                    break;
                case 'trim_word':
                    const availableChars = 10 - numberWordsLength;
                    const trimmedWord = word.substring(0, availableChars);
                    resultParts.push(trimmedWord.toUpperCase());
                    break;
                case 'first_word_only':
                    if (textWordIndex === 0) {
                        resultParts.push(word.toUpperCase());
                    }
                    break;
                case 'combine_words':
                    if (textWordIndex === 0) {
                        resultParts.push(word.toUpperCase());
                    } else if (textWordIndex === 1) {
                        if (resultParts.length > 0) {
                            const lastIndex = resultParts.length - 1;
                            resultParts[lastIndex] = resultParts[lastIndex] + word.toUpperCase();
                        }
                    }
                    break;
            }
            textWordIndex++;
        }
    }
    let result = resultParts.join('').substring(0, 10);
    if (!result) {
        result = 'TOKEN';
    }
    // Remove any spaces from the final result (tickers shouldn't have spaces)
    result = result.replace(/\s/g, '');
    return result;
}
// Download image from URL and convert to base64
async function downloadAndConvertImage(imageUrl) {
    try {
        const response = await fetch(imageUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        throw error;
    }
}
// Deploy token using J7Tracker External API
async function deployToken(name, ticker, imageData, twitterUrl, chain) {
    const settings = await getDeploySettings();
    // Determine which API key and buy amount to use
    const isBNB = chain === 'bnb';
    const apiKey = isBNB ? settings.bnbApiKey : settings.apiKey;
    const buyAmount = isBNB ? settings.bnbBuyAmount : settings.buyAmount;
    if (!apiKey) {
        throw new Error(`No API key configured for ${isBNB ? 'BNB' : 'Solana'} deploys`);
    }
    // Construct deploy request
    const deployRequest = {
        api_key: apiKey,
        type: chain,
        name: name,
        ticker: ticker,
        image_data: imageData,
        buy_amount: buyAmount
    };
    // Add Twitter URL if available
    if (twitterUrl) {
        let url = twitterUrl;
        // Extract URL if latestLink is an object
        if (typeof twitterUrl === 'object' && twitterUrl.url) {
            url = twitterUrl.url;
        }
        deployRequest.twitter = url;
    }
    // Add cashback_mode for pump.fun deploys
    if (chain === 'pump' && settings.cashbackMode) {
        deployRequest.cashback_mode = true;
    }
    // Add bonkers_mode for bonk/usd1 deploys
    if ((chain === 'bonk' || chain === 'usd1') && settings.bonkersMode) {
        deployRequest.bonkers_mode = true;
    }
    const deployUrl = await getDeployUrl();
    const response = await fetch(deployUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(deployRequest)
    });
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error || 'Deploy failed');
    }
    return result;
}
// Track processed images
let processedImages = new WeakSet();
// Settings cache - use window properties to avoid redeclaration errors
if (typeof window.j7GoogleDeploySettings === 'undefined') {
    window.j7GoogleDeploySettings = {
        insertImageButtonEnabled: true,
        deployButtonsEnabled: false,
        bonkersMode: false
    };
}
// Load settings
async function loadGoogleDeploySettings() {
    try {
        const result = await chrome.storage.local.get(['insertImageButtonEnabled', 'deployButtonsEnabled', 'bonkersMode']);
        window.j7GoogleDeploySettings.insertImageButtonEnabled = result.insertImageButtonEnabled !== undefined ? result.insertImageButtonEnabled : true;
        window.j7GoogleDeploySettings.deployButtonsEnabled = result.deployButtonsEnabled !== undefined ? result.deployButtonsEnabled : false;
        window.j7GoogleDeploySettings.bonkersMode = result.bonkersMode || false;
    } catch (error) {
        window.j7GoogleDeploySettings.insertImageButtonEnabled = true;
        window.j7GoogleDeploySettings.deployButtonsEnabled = false;
        window.j7GoogleDeploySettings.bonkersMode = false;
    }
}
// Add deploy buttons to a single image
async function addDeployButtonToImage(img) {
    try {
        // Skip if both features are disabled
        if (!window.j7GoogleDeploySettings.insertImageButtonEnabled && !window.j7GoogleDeploySettings.deployButtonsEnabled) {
            return;
        }
        
        // Skip if already processed (check attribute first for reliability)
        if (img.hasAttribute('data-j7-deploy-added')) {
            return;
        }
        // Skip if already processed (WeakSet backup)
        if (processedImages.has(img)) {
            return;
        }
        // Skip if no parent or image is invalid
        if (!img || !img.parentElement) {
            return;
        }
        // Skip tiny images
        if (img.naturalWidth > 0 && img.naturalWidth < 100) {
            return;
        }
        // Mark as processed IMMEDIATELY (both methods)
        img.setAttribute('data-j7-deploy-added', 'true');
        processedImages.add(img);
    // Ensure parent has relative positioning
    const parent = img.parentElement;
    if (parent && getComputedStyle(parent).position === 'static') {
        parent.style.position = 'relative';
    }
    // Add "INSERT IMAGE" button at the top (if enabled)
    if (window.j7GoogleDeploySettings.insertImageButtonEnabled) {
        const insertImageBtn = document.createElement('button');
    insertImageBtn.setAttribute('data-j7-insert-image-btn', 'true');
    insertImageBtn.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        width: 80px;
        height: 32px;
        background: rgb(59, 130, 246);
        border: 1px solid rgb(37, 99, 235);
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4px 8px;
        transition: all 0.2s;
        font-size: 11px;
        font-weight: 600;
        color: white;
        z-index: 1000;
    `;
    insertImageBtn.textContent = 'INSERT IMAGE';
    insertImageBtn.title = 'Insert image into J7Tracker deploy panel';
    insertImageBtn.addEventListener('mouseenter', () => {
        insertImageBtn.style.background = 'rgb(37, 99, 235)';
        insertImageBtn.style.borderColor = 'rgb(29, 78, 216)';
    });
    insertImageBtn.addEventListener('mouseleave', () => {
        insertImageBtn.style.background = 'rgb(59, 130, 246)';
        insertImageBtn.style.borderColor = 'rgb(37, 99, 235)';
    });
    insertImageBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        // Show loading state
        insertImageBtn.style.background = 'rgb(59, 130, 246)';
        insertImageBtn.textContent = '...';
        try {
            // Convert image to data URL if needed
            let imageData;
            if (img.src.startsWith('data:')) {
                imageData = img.src;
            } else if (img.src.startsWith('blob:')) {
                const response = await fetch(img.src);
                const blob = await response.blob();
                imageData = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
            } else {
                imageData = await downloadAndConvertImage(img.src);
            }
            // Send VAMP UPDATE request with just the image
            const result = await vampUpdate({ image_url: imageData });
            if (result.success) {
                // Show success state
                insertImageBtn.style.background = 'rgb(16, 185, 129)';
                insertImageBtn.textContent = '✓';
                setTimeout(() => {
                    insertImageBtn.style.background = 'rgb(59, 130, 246)';
                    insertImageBtn.textContent = 'INSERT IMAGE';
                }, 2000);
            } else {
                insertImageBtn.style.background = 'rgb(239, 68, 68)';
                insertImageBtn.textContent = '✗';
                setTimeout(() => {
                    insertImageBtn.style.background = 'rgb(59, 130, 246)';
                    insertImageBtn.textContent = 'INSERT IMAGE';
                }, 2000);
            }
        } catch (error) {
            insertImageBtn.style.background = 'rgb(239, 68, 68)';
            insertImageBtn.textContent = '✗';
            setTimeout(() => {
                insertImageBtn.style.background = 'rgb(59, 130, 246)';
                insertImageBtn.textContent = 'INSERT IMAGE';
            }, 2000);
        }
    });
    // Add INSERT IMAGE button to parent
    if (parent) {
        parent.appendChild(insertImageBtn);
    }
    }
    // Create container for deploy buttons (2x2 grid) below INSERT IMAGE (if enabled)
    if (window.j7GoogleDeploySettings.deployButtonsEnabled) {
    const buttonContainer = document.createElement('div');
    buttonContainer.setAttribute('data-j7-deploy-buttons', 'true');
    buttonContainer.style.cssText = `
        position: absolute;
        top: ${window.j7GoogleDeploySettings.insertImageButtonEnabled ? '48px' : '8px'};
        right: 8px;
        display: grid;
        grid-template-columns: 32px 32px;
        grid-template-rows: 32px 32px;
        gap: 4px;
        z-index: 1000;
    `;
    // Define deploy chains (matching Axiom deploy buttons)
    const isBonkers = window.j7GoogleDeploySettings.bonkersMode;
    const chains = [
        { type: 'usd1', icon: 'usd1-logo.png', name: 'USD1' },
        { type: 'bonk', icon: isBonkers ? 'bonkers-logo.svg' : 'bonk-logo.png', name: isBonkers ? 'BONKERS' : 'BONK' },
        { type: 'bnb', icon: 'bnb-logo.png', name: 'BNB' },
        { type: 'pump', icon: 'pump-logo.png', name: 'PUMP' }
    ];
    // Create buttons for each chain
    chains.forEach(chain => {
        const isBonkersChain = isBonkers && (chain.type === 'usd1' || chain.type === 'bonk');
        const defaultBorder = isBonkersChain ? 'rgba(239, 68, 68, 0.5)' : 'rgb(64, 64, 64)';
        const hoverBorder = isBonkersChain ? 'rgba(239, 68, 68, 0.8)' : 'rgb(80, 80, 80)';
        const button = document.createElement('button');
        button.style.cssText = `
            width: 32px;
            height: 32px;
            background: rgb(26, 26, 26);
            border: 1px solid ${defaultBorder};
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 6px;
            transition: all 0.2s;
        `;
        button.addEventListener('mouseenter', () => {
            button.style.background = 'rgb(40, 40, 40)';
            button.style.borderColor = hoverBorder;
        });
        button.addEventListener('mouseleave', () => {
            button.style.background = 'rgb(26, 26, 26)';
            button.style.borderColor = defaultBorder;
        });
        // Add icon
        const icon = document.createElement('img');
        icon.src = chrome.runtime.getURL(`icons/${chain.icon}`);
        icon.style.cssText = 'width: 100%; height: 100%; object-fit: contain;';
        button.appendChild(icon);
        // Add tooltip
        button.title = `Deploy on ${chain.name}`;
        // Add click handler
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            // Get latestCopied for name
            const latestCopied = await getLatestCopied();
            if (!latestCopied) {
                button.style.background = 'rgb(239, 68, 68)';
                button.innerHTML = '<span style="font-size: 10px; color: white;">NO TEXT</span>';
                setTimeout(() => {
                    button.innerHTML = '';
                    button.appendChild(icon.cloneNode(true));
                    button.style.background = 'rgb(26, 26, 26)';
                }, 2000);
                return;
            }
            // Get latestLink for Twitter URL
            const latestLink = await getLatestLink();
            // Generate ticker from name
            const name = latestCopied.substring(0, 32);
            const ticker = generateTickerFromName(latestCopied);
            // Show loading state
            button.style.background = 'rgb(59, 130, 246)';
            button.innerHTML = '<span style="font-size: 10px; color: white;">...</span>';
            try {
                // Convert image to data URL
                let imageData;
                if (img.src.startsWith('data:')) {
                    imageData = img.src;
                } else if (img.src.startsWith('blob:')) {
                    const response = await fetch(img.src);
                    const blob = await response.blob();
                    imageData = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                    });
                } else {
                    imageData = await downloadAndConvertImage(img.src);
                }
                // Deploy token
                await deployToken(name, ticker, imageData, latestLink, chain.type);
                // Show success state
                button.style.background = 'rgb(16, 185, 129)';
                button.innerHTML = '<span style="font-size: 14px; color: white;">✓</span>';
                setTimeout(() => {
                    button.style.background = 'rgb(26, 26, 26)';
                    button.innerHTML = '';
                    button.appendChild(icon.cloneNode(true));
                }, 2000);
            } catch (error) {
                button.style.background = 'rgb(239, 68, 68)';
                button.innerHTML = '<span style="font-size: 14px; color: white;">✗</span>';
                setTimeout(() => {
                    button.style.background = 'rgb(26, 26, 26)';
                    button.innerHTML = '';
                    button.appendChild(icon.cloneNode(true));
                }, 2000);
            }
        });
        buttonContainer.appendChild(button);
    });
    // Add container to parent
    if (parent) {
        parent.appendChild(buttonContainer);
    }
    }
    } catch (error) {
    }
}
// Add deploy buttons to all images on the page
async function addDeployButtonsToImages() {
    try {
        // Only target Google Images result images, not all images on the page
        const images = document.querySelectorAll('div[data-ri] img, div[jsname] img[src*="image"], img[data-iml]');
        for (const img of images) {
            // Skip if already has buttons
            if (img.hasAttribute('data-j7-deploy-added')) continue;
            // Skip if too small (likely icons/UI elements)
            if (img.width < 100 || img.height < 100) continue;
            await addDeployButtonToImage(img);
        }
    } catch (error) {
    }
}
// Initialize on Google Images
async function initGoogleDeploy() {
    try {
        // Only run on Google search pages
        if (!window.location.hostname.includes('google.') || !window.location.pathname.startsWith('/search')) {
            return;
        }
        
        // Load settings first (even if not on images tab, for the listener)
        await loadGoogleDeploySettings();
        
        // Listen for settings reload messages (register BEFORE the images tab check)
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.type === 'reloadInsertImageButton' || request.type === 'reloadDeployButtons' || request.type === 'reloadDeploySettings') {
                const oldBonkersMode = window.j7GoogleDeploySettings.bonkersMode;
                loadGoogleDeploySettings().then(() => {
                    // Update visibility of all buttons based on new settings
                    document.querySelectorAll('[data-j7-insert-image-btn]').forEach(btn => {
                        btn.style.display = window.j7GoogleDeploySettings.insertImageButtonEnabled ? 'flex' : 'none';
                    });
                    document.querySelectorAll('[data-j7-deploy-buttons]').forEach(container => {
                        const hasInsertBtn = window.j7GoogleDeploySettings.insertImageButtonEnabled;
                        container.style.display = window.j7GoogleDeploySettings.deployButtonsEnabled ? 'grid' : 'none';
                        container.style.top = hasInsertBtn ? '48px' : '8px';
                    });
                    if (window.j7GoogleDeploySettings.bonkersMode !== oldBonkersMode) {
                        document.querySelectorAll('[data-j7-deploy-buttons]').forEach(c => c.remove());
                        document.querySelectorAll('[data-j7-insert-image-btn]').forEach(b => b.remove());
                        document.querySelectorAll('[data-j7-deploy-added]').forEach(img => {
                            img.removeAttribute('data-j7-deploy-added');
                        });
                        processedImages = new WeakSet();
                        addDeployButtonsToImages();
                    }
                });
                sendResponse({ success: true });
            }
        });
        
        // Check if it's Google Images (has tbm=isch OR udm=2 parameter)
        const urlParams = new URLSearchParams(window.location.search);
        const isImagesTab = urlParams.get('tbm') === 'isch' || urlParams.get('udm') === '2';
        if (!isImagesTab) {
            return;
        }
        // INSTANT: Add buttons to any existing images right now
        addDeployButtonsToImages();
        // AGGRESSIVE: Run again very soon in case images are still loading
        setTimeout(() => addDeployButtonsToImages(), 100);
        setTimeout(() => addDeployButtonsToImages(), 300);
        setTimeout(() => addDeployButtonsToImages(), 600);
        setTimeout(() => addDeployButtonsToImages(), 1000);
        setTimeout(() => addDeployButtonsToImages(), 2000);
        // Watch for new images (debounced)
        let observerTimeout = null;
        const observer = new MutationObserver(() => {
            if (observerTimeout) clearTimeout(observerTimeout);
            observerTimeout = setTimeout(() => {
                addDeployButtonsToImages();
            }, 500);
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        // Re-check on scroll (debounced)
        let scrollTimeout = null;
        window.addEventListener('scroll', () => {
            if (scrollTimeout) clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                addDeployButtonsToImages();
            }, 300);
        }, { passive: true });
    } catch (error) {
    }
}
// Run on page load (with error handling)
try {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGoogleDeploy);
    } else {
        initGoogleDeploy();
    }
} catch (error) {
}
