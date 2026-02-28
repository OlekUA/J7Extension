// Uses VAMP_CONFIG from vamp-config.js (loaded first)
// URLs are now fetched dynamically since getUrl() is async
// VAMP buttons setting
let vampButtonsEnabled = true;
let newPairsVampButtonsEnabled = true;
let vampButtonColor = '#ef4444'; // Default red
let vampButtonStyle = 'translucent'; // 'fill' or 'translucent'
let vampFetchModeEnabled = true; // Fetch mode using CA (default: on)
var insertImageButtonEnabled = true; // Shared with content.js (var allows redeclaration)
let newPairsInsertImageEnabled = true;
let smallVampButtonSize = 1.0; // Scale factor for small VAMP buttons
let smallVampButtonPosition = 'before'; // Position: 'before', 'after', 'end'
// vampUsername is now handled by vamp-config.js

async function loadVampButtonsSetting() {
    try {
        const result = await chrome.storage.local.get(['vampButtonsEnabled']);
        vampButtonsEnabled = result.vampButtonsEnabled !== undefined ? result.vampButtonsEnabled : true;
    } catch (error) {
        vampButtonsEnabled = true;
    }
}

async function loadNewPairsVampButtonsSetting() {
    try {
        const result = await chrome.storage.local.get(['newPairsVampButtonsEnabled']);
        newPairsVampButtonsEnabled = result.newPairsVampButtonsEnabled !== undefined ? result.newPairsVampButtonsEnabled : true;
    } catch (error) {
        newPairsVampButtonsEnabled = true;
    }
}

// Load VAMP button color setting
async function loadVampButtonColor() {
    try {
        const result = await chrome.storage.local.get(['vampButtonColor']);
        vampButtonColor = result.vampButtonColor || '#ef4444';
    } catch (error) {
        vampButtonColor = '#ef4444';
    }
}

// Load VAMP button style setting
async function loadVampButtonStyle() {
    try {
        const result = await chrome.storage.local.get(['vampButtonStyle']);
        vampButtonStyle = result.vampButtonStyle || 'translucent';
    } catch (error) {
        vampButtonStyle = 'translucent';
    }
}

// Load VAMP Fetch Mode setting
async function loadVampFetchModeSetting() {
    try {
        const result = await chrome.storage.local.get(['vampFetchModeEnabled']);
        vampFetchModeEnabled = result.vampFetchModeEnabled !== undefined ? result.vampFetchModeEnabled : true;
    } catch (error) {
        vampFetchModeEnabled = true;
    }
}

// VAMP Username is now loaded by vamp-config.js

async function loadInsertImageButtonSetting() {
    try {
        const result = await chrome.storage.local.get(['insertImageButtonEnabled']);
        insertImageButtonEnabled = result.insertImageButtonEnabled !== undefined ? result.insertImageButtonEnabled : true;
    } catch (error) {
        insertImageButtonEnabled = true;
    }
}

async function loadNewPairsInsertImageSetting() {
    try {
        const result = await chrome.storage.local.get(['newPairsInsertImageEnabled']);
        newPairsInsertImageEnabled = result.newPairsInsertImageEnabled !== undefined ? result.newPairsInsertImageEnabled : true;
    } catch (error) {
        newPairsInsertImageEnabled = true;
    }
}

// Load small VAMP button size setting
async function loadSmallVampButtonSize() {
    try {
        const result = await chrome.storage.local.get(['smallVampButtonSize']);
        smallVampButtonSize = result.smallVampButtonSize || 1.0;
    } catch (error) {
        smallVampButtonSize = 1.0;
    }
}

// Load small VAMP button position setting
async function loadSmallVampButtonPosition() {
    try {
        const result = await chrome.storage.local.get(['smallVampButtonPosition']);
        smallVampButtonPosition = result.smallVampButtonPosition || 'before';
    } catch (error) {
        smallVampButtonPosition = 'before';
    }
}

// Apply size to a small vamp button
function applySmallVampButtonSize(button) {
    // Store the scale on the button for use in hover handlers
    button.dataset.vampScale = smallVampButtonSize;
    button.style.transform = `scale(${smallVampButtonSize})`;
    button.style.transformOrigin = 'center center';
    
    // Override hover handlers to include the scale
    const scale = smallVampButtonSize;
    const hoverScale = scale * 1.05;
    
    button.onmouseenter = () => {
        button.style.transform = `translateY(-1px) scale(${hoverScale})`;
    };
    
    button.onmouseleave = () => {
        button.style.transform = `scale(${scale})`;
    };
}

// Generate translucent background from base color
function generateTranslucentBg(baseColor, opacity = 0.1) {
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Generate gradient from base color
function generateVampGradient(baseColor) {
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const darken = (value, amount) => Math.max(0, Math.floor(value * (1 - amount)));
    
    const color1 = baseColor;
    const color2 = `rgb(${darken(r, 0.1)}, ${darken(g, 0.1)}, ${darken(b, 0.1)})`;
    const color3 = `rgb(${darken(r, 0.25)}, ${darken(g, 0.25)}, ${darken(b, 0.25)})`;
    
    return `linear-gradient(135deg, ${color1}, ${color2}, ${color3})`;
}

// Generate hover gradient (lighter)
function generateVampHoverGradient(baseColor) {
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const lighten = (value, amount) => Math.min(255, Math.floor(value + (255 - value) * amount));
    const darken = (value, amount) => Math.max(0, Math.floor(value * (1 - amount)));
    
    const color1 = `rgb(${lighten(r, 0.15)}, ${lighten(g, 0.15)}, ${lighten(b, 0.15)})`;
    const color2 = baseColor;
    const color3 = `rgb(${darken(r, 0.1)}, ${darken(g, 0.1)}, ${darken(b, 0.1)})`;
    
    return `linear-gradient(135deg, ${color1}, ${color2}, ${color3})`;
}

// Generate box shadow from base color
function generateVampShadow(baseColor, intensity = 0.25) {
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `0 2px 8px rgba(${r}, ${g}, ${b}, ${intensity}), 0 1px 3px rgba(0, 0, 0, 0.1)`;
}

// Apply color to a vamp button
function applyVampButtonColor(button) {
    if (vampButtonStyle === 'fill') {
        // Fill style - solid gradient
        const gradient = generateVampGradient(vampButtonColor);
        const hoverGradient = generateVampHoverGradient(vampButtonColor);
        const shadow = generateVampShadow(vampButtonColor, 0.25);
        const hoverShadow = generateVampShadow(vampButtonColor, 0.4);
        
        button.style.background = gradient;
        button.style.boxShadow = shadow;
        button.style.color = 'white';
        button.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        
        button.onmouseenter = () => {
            button.style.transform = 'translateY(-1px) scale(1.05)';
            button.style.boxShadow = hoverShadow;
            button.style.background = hoverGradient;
            button.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        };
        
        button.onmouseleave = () => {
            button.style.transform = 'translateY(0) scale(1)';
            button.style.boxShadow = shadow;
            button.style.background = gradient;
            button.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        };
    } else {
        // Translucent style - semi-transparent with colored outline
        const bgColor = generateTranslucentBg(vampButtonColor, 0.1);
        const hoverBgColor = generateTranslucentBg(vampButtonColor, 0.15);
        const borderColor = generateTranslucentBg(vampButtonColor, 0.3);
        const shadow = generateVampShadow(vampButtonColor, 0.25);
        const hoverShadow = generateVampShadow(vampButtonColor, 0.4);
        
        button.style.background = bgColor;
        button.style.boxShadow = shadow;
        button.style.color = vampButtonColor;
        button.style.borderColor = borderColor;
        
        button.onmouseenter = () => {
            button.style.transform = 'translateY(-1px) scale(1.05)';
            button.style.boxShadow = hoverShadow;
            button.style.background = hoverBgColor;
            button.style.borderColor = vampButtonColor;
        };
        
        button.onmouseleave = () => {
            button.style.transform = 'translateY(0) scale(1)';
            button.style.boxShadow = shadow;
            button.style.background = bgColor;
            button.style.borderColor = borderColor;
        };
    }
}

function extractTokenDetails(tokenSection) {
    try {
        let symbol = '';
        
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
        
        // Fallback to old structure
        if (!symbol) {
            const tickerDiv = tokenSection.querySelector('.text-textPrimary[class*="text-[16px]"][class*="font-medium"][class*="truncate"]');
            if (tickerDiv && tickerDiv.textContent.trim()) {
                const text = tickerDiv.textContent.trim();
                if (text.length >= 1 && text.length <= 30 && !text.includes(' ')) {
                    symbol = text;
                }
            }
        }
        
        if (!symbol) {
            const allTickerSpans = tokenSection.querySelectorAll('span.text-textPrimary, div.text-textPrimary');
            
            for (let i = 0; i < allTickerSpans.length; i++) {
                const span = allTickerSpans[i];
                const text = span.textContent.trim();
                
                if (!isNaN(text) && text.length <= 3) {
                    continue;
                }
                
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
        
        if (!symbol) {
            const fallbackSelectors = [
                '[class*="symbol"]',
                '[class*="ticker"]',
                'span[class*="text-xs"]',
                'span[class*="uppercase"]'
            ];
            
            for (const selector of fallbackSelectors) {
                const symbolElement = tokenSection.querySelector(selector);
                if (symbolElement && symbolElement.textContent.trim()) {
                    const candidateSymbol = symbolElement.textContent.trim();
                    if (candidateSymbol.length >= 1 && candidateSymbol.length <= 20) {
                        symbol = candidateSymbol;
                        break;
                    }
                }
            }
        }
        
        let fullName = '';
        
        // Try new structure: look for the name in the second span with text-textTertiary containing truncate div
        const nameSpanNew = tokenSection.querySelector('span.text-textTertiary span[class*="font-medium"][class*="truncate"]');
        if (nameSpanNew) {
            const innerDiv = nameSpanNew.querySelector('div.truncate, div[class*="whitespace-nowrap"]');
            if (innerDiv) {
                fullName = innerDiv.textContent.trim();
            } else {
                fullName = nameSpanNew.textContent.trim();
            }
        }
        
        // Try to find name element - could be span or div with text-inherit class
        if (!fullName) {
            let nameElement = tokenSection.querySelector('span.text-inherit[class*="font-medium"][class*="truncate"]');
            if (!nameElement) {
                nameElement = tokenSection.querySelector('div.text-inherit[class*="font-medium"][class*="truncate"]');
            }
            if (nameElement) {
                fullName = nameElement.textContent.trim();
            }
        }
        
        let imageElement = tokenSection.querySelector('img[src*="axiomtrading"]');
        
        if (!imageElement) {
            imageElement = tokenSection.querySelector('img[src*="token"], img[src*="coin"], img[alt*="token"], img[alt*="coin"]');
        }
        
        if (!imageElement) {
            imageElement = tokenSection.querySelector('img');
        }
        
        if (!fullName && imageElement && imageElement.alt) {
            fullName = imageElement.alt.trim();
        }
        
        if (!fullName && symbol) {
            fullName = symbol;
        }
        
        const imageUrl = imageElement ? imageElement.src : '';
        
        const siteUrl = window.location.href;
        
        // Extract CA from X search link (specifically the one with ri-search-line icon)
        let contractAddress = null;
        
        // First try: find the search icon link (most reliable - always has the correct CA)
        const searchIconLink = tokenSection.querySelector('a[href*="x.com/search?q="] i.ri-search-line, a[href*="twitter.com/search?q="] i.ri-search-line');
        if (searchIconLink) {
            const parentLink = searchIconLink.closest('a');
            if (parentLink) {
                try {
                    const url = new URL(parentLink.href);
                    const query = url.searchParams.get('q');
                    if (query && query.length >= 32 && query.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(query)) {
                        contractAddress = query;
                    }
                } catch (e) {}
            }
        }
        
        // Fallback: try pump.fun link
        if (!contractAddress) {
            const pumpLink = tokenSection.querySelector('a[href*="pump.fun/coin/"]');
            if (pumpLink) {
                const match = pumpLink.href.match(/pump\.fun\/coin\/([1-9A-HJ-NP-Za-km-z]{32,44})/);
                if (match) {
                    contractAddress = match[1];
                }
            }
        }
        
        // Extract Twitter and Website links
        let twitterUrl = null;
        let websiteUrl = null;
        
        const socialContainer = tokenSection.querySelector('div.flex.flex-row.gap-\\[8px\\]');
        if (socialContainer) {
            const linkElements = socialContainer.querySelectorAll('a[href]');
            
            linkElements.forEach((link) => {
                const url = link.href;
                const iconElement = link.querySelector('i');
                
                if (url.includes('pump.fun') || 
                    url.includes('bags.fm') ||
                    url.includes('bonk.fun') ||
                    url.includes('dexscreener.com') ||
                    url.includes('birdeye.so') ||
                    url.includes('solscan.io')) {
                    return;
                }
                
                if (iconElement && iconElement.classList.contains('ri-search-line')) {
                    return;
                }
                
                if ((url.includes('twitter.com') || url.includes('x.com')) && !twitterUrl) {
                    twitterUrl = url;
                } else if (!url.includes('t.me') && 
                          !url.includes('telegram') && 
                          !websiteUrl) {
                    websiteUrl = url;
                }
            });
        }
        
        return {
            symbol: symbol || 'Unknown',
            fullName: fullName || symbol || 'Unknown',
            imageUrl: imageUrl,
            siteUrl: siteUrl,
            twitterUrl: twitterUrl,
            websiteUrl: websiteUrl,
            contractAddress: contractAddress
        };
        
    } catch (error) {
        return null;
    }
}

function findSocialUrls(tokenSection) {
    const twitterLinks = tokenSection.querySelectorAll('a[href*="twitter.com"], a[href*="x.com"]');
    
    for (const link of twitterLinks) {
        const url = link.href;
        const iconElement = link.querySelector('i');
        
        if (url.includes('/search?q=') || (iconElement && iconElement.classList.contains('ri-search-line'))) {
            continue;
        }
        
        return url;
    }
    
    const twitterMeta = document.querySelector('meta[name="twitter:site"], meta[property="twitter:site"]');
    if (twitterMeta) {
        const handle = twitterMeta.content.replace('@', '');
        return `https://twitter.com/${handle}`;
    }
    
    return null;
}

function findWebsiteUrl(tokenSection) {
    const websiteLinkWithIcon = tokenSection.querySelector('a i.ri-global-line');
    if (websiteLinkWithIcon) {
        const websiteLink = websiteLinkWithIcon.closest('a');
        if (websiteLink && websiteLink.href) {
            const url = websiteLink.href;
            
            if (url.includes('pump.fun') || 
                url.includes('bags.fm') ||
                url.includes('bonk.fun') ||
                url.includes('dexscreener.com') ||
                url.includes('birdeye.so') ||
                url.includes('solscan.io') ||
                url.includes('/search?q=')) {
                return null;
            }
            
            return url;
        }
    }
    
    const websiteIconSelectors = [
        'a i[class*="global"]',
        'a i[class*="website"]',
        'a i[class*="web"]',
        'a [class*="globe"]'
    ];
    
    for (const selector of websiteIconSelectors) {
        const iconElement = tokenSection.querySelector(selector);
        if (iconElement) {
            const websiteLink = iconElement.closest('a');
            if (websiteLink && websiteLink.href) {
                const url = websiteLink.href;
                
                if (url.includes('pump.fun') || 
                    url.includes('bags.fm') ||
                    url.includes('bonk.fun') ||
                    url.includes('dexscreener.com') ||
                    url.includes('birdeye.so') ||
                    url.includes('solscan.io') ||
                    url.includes('/search?q=') ||
                    url.includes('twitter') || 
                    url.includes('x.com') || 
                    url.includes('telegram') || 
                    url.includes('discord')) {
                    continue;
                }
                
                return url;
            }
        }
    }
    
    return null;
}

async function sendVampRequest(tokenDetails) {
    try {
        // Always read fresh from storage to ensure we have the latest setting
        let fetchModeEnabled = true; // default
        try {
            const result = await chrome.storage.local.get(['vampFetchModeEnabled']);
            fetchModeEnabled = result.vampFetchModeEnabled !== undefined ? result.vampFetchModeEnabled : true;
        } catch (e) {
            fetchModeEnabled = true;
        }
        
        console.log('[VAMP] CA:', tokenDetails.contractAddress);
        console.log('[VAMP] Direct Fetch Mode:', fetchModeEnabled);
        
        // If Axiom CA VAMP Mode is enabled and we have a CA, just send CA to server
        // Server will fetch the token details AND emit via socket - NO HTML scraping
        if (fetchModeEnabled && tokenDetails.contractAddress) {
            console.log('[VAMP] Using server-side CA fetch for:', tokenDetails.contractAddress);
            
            const requestBody = {
                contractAddress: tokenDetails.contractAddress
            };
            
            const username = getVampUsername();
            if (username) {
                requestBody.username = username;
            }
            
            const vampCaUrl = await VAMP_CONFIG.getUrl('VAMP_CA');
            const response = await fetch(vampCaUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            const result = await response.json();
            console.log('[VAMP] Server Response:', result);
            return result.success;
        }
        
        // Fallback to HTML scraping mode (when fetch mode is disabled)
        console.log('[VAMP] --- HTML Scraped Data ---');
        console.log('[VAMP] Name:', tokenDetails.fullName);
        console.log('[VAMP] Symbol:', tokenDetails.symbol);
        console.log('[VAMP] Image:', tokenDetails.imageUrl);
        console.log('[VAMP] Twitter:', tokenDetails.twitterUrl);
        console.log('[VAMP] Website:', tokenDetails.websiteUrl);
        
        // Send token details to normal VAMP endpoint
        const requestData = {
            token_name: tokenDetails.fullName,
            ticker: tokenDetails.symbol,
            image_url: tokenDetails.imageUrl || '',
            twitter: tokenDetails.twitterUrl || '',
            website: tokenDetails.websiteUrl || '',
            site_url: tokenDetails.siteUrl || window.location.href
        };
        
        // Add username if set (for multi-user same-IP scenarios)
        const usernameForRequest = getVampUsername();
        if (usernameForRequest) {
            requestData.username = usernameForRequest;
        }
        
        console.log('[VAMP] --- Sending to Server ---');
        console.log('[VAMP] Request Data:', JSON.stringify(requestData, null, 2));
        
        const vampServerUrl = await VAMP_CONFIG.getUrl('VAMP');
        const response = await fetch(vampServerUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        const result = await response.json();
        console.log('[VAMP] Server Response:', result);
        return result.success;
    } catch (error) {
        console.log('[VAMP] Error:', error.message);
        return false;
    }
}

function addVampButton(tokenSection) {
    // Don't check vampButtonsEnabled here - always create the button
    // but hide it if disabled
    
    const tokenDetails = extractTokenDetails(tokenSection);
    if (!tokenDetails) {
        return false;
    }
    
    if (tokenSection.querySelector('.vamp-button')) {
        return false;
    }
    
    // Check if in modal/search
    const isInModal = tokenSection.closest('[role="dialog"]') || 
                     tokenSection.closest('.fixed.inset-0') ||
                     tokenSection.closest('[class*="modal"]') ||
                     tokenSection.closest('[class*="popup"]') ||
                     tokenSection.closest('[class*="search"]') ||
                     tokenSection.closest('.bg-backgroundTertiary.border-secondaryStroke') ||
                     tokenSection.closest('[class*="shadow-"][class*="overflow-hidden"][class*="pointer-events-auto"]') ||
                     tokenSection.closest('div[class*="sm:w-\\[640px\\]"]') ||
                     tokenSection.closest('div[class*="rounded-\\[8px\\]"][class*="shadow-"]');
    
    const vampButton = document.createElement('button');
    vampButton.className = 'vamp-button axiom-big-vamp-button';
    vampButton.setAttribute('data-j7-vamp-btn', 'true');
    
    // Create crossed swords SVG icon - always show for big buttons
    const swordsIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    swordsIcon.setAttribute('width', '16');
    swordsIcon.setAttribute('height', '16');
    swordsIcon.setAttribute('viewBox', '0 0 24 24');
    swordsIcon.setAttribute('fill', 'none');
    swordsIcon.setAttribute('stroke', 'currentColor');
    swordsIcon.setAttribute('stroke-width', '2');
    swordsIcon.setAttribute('stroke-linecap', 'round');
    swordsIcon.setAttribute('stroke-linejoin', 'round');
    swordsIcon.innerHTML = `
        <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/>
        <line x1="13" x2="19" y1="19" y2="13"/>
        <line x1="16" x2="20" y1="16" y2="20"/>
        <line x1="19" x2="21" y1="21" y2="19"/>
        <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/>
        <line x1="5" x2="9" y1="14" y2="18"/>
        <line x1="7" x2="4" y1="17" y2="20"/>
        <line x1="3" x2="5" y1="19" y2="21"/>
    `;
    vampButton.appendChild(swordsIcon);
    
    // Add VAMP text
    const textSpan = document.createElement('span');
    textSpan.textContent = 'VAMP';
    textSpan.style.cssText = 'font-size: 12px; font-weight: 600; letter-spacing: 0.3px;';
    vampButton.appendChild(textSpan);
    
    // Style with solid dark background like Padre search modal
    vampButton.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        padding: 10px 16px;
        height: 36px;
        font-size: 14px;
        font-weight: 600;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        letter-spacing: 0.3px;
        border-radius: 6px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        cursor: pointer;
        transition: all 0.15s ease;
        white-space: nowrap;
        margin-left: 8px;
        flex-shrink: 0;
        color: white;
        background: #18181b;
    `;
    
    // Apply custom color but keep solid background
    applyVampButtonColor(vampButton);
    // Force solid background to hide anything behind
    vampButton.style.background = '#18181b';
    
    // Set up hover effects with solid backgrounds
    vampButton.onmouseenter = () => {
        vampButton.style.background = '#27272a';
        vampButton.style.transform = 'scale(1.02)';
    };
    vampButton.onmouseleave = () => {
        vampButton.style.background = '#18181b';
        vampButton.style.transform = 'scale(1)';
    };
    
    vampButton.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        vampButton.disabled = true;
        
        await sendVampRequest(tokenDetails);
        
        setTimeout(() => {
            vampButton.disabled = false;
        }, 1000);
    });
    
    // Set initial visibility based on setting
    vampButton.style.display = vampButtonsEnabled ? 'inline-flex' : 'none';
    
    let insertTarget = tokenSection;
    
    const buttonContainer = tokenSection.querySelector('.axiom-deploy-buttons');
    if (buttonContainer) {
        buttonContainer.appendChild(vampButton);
        return true;
    }
    
    const quickBuyContainer = tokenSection.querySelector('.hidden.sm\\:flex');
    if (quickBuyContainer) {
        insertTarget = quickBuyContainer.parentNode;
        insertTarget.insertBefore(vampButton, quickBuyContainer);
        return true;
    }
    
    tokenSection.appendChild(vampButton);
    return true;
}

function addSmallVampButton(tokenCard) {
    const tokenDetails = extractTokenDetails(tokenCard);
    if (!tokenDetails) {
        return false;
    }
    
    // Try new structure first, then fallback to old
    let tokenNameSpan = tokenCard.querySelector('span.text-textPrimary[class*="sm:text-[16px]"][class*="font-medium"]');
    if (!tokenNameSpan) {
        tokenNameSpan = tokenCard.querySelector('.text-textPrimary[class*="text-[16px]"][class*="font-medium"][class*="truncate"]');
    }
    if (!tokenNameSpan) {
        return false;
    }
    
    const vampButton = document.createElement('button');
    vampButton.className = 'vamp-button-small';
    vampButton.setAttribute('data-j7-vamp-btn', 'true');
    
    // Create crossed swords SVG icon
    const swordsIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    swordsIcon.setAttribute('width', '14');
    swordsIcon.setAttribute('height', '14');
    swordsIcon.setAttribute('viewBox', '0 0 24 24');
    swordsIcon.setAttribute('fill', 'none');
    swordsIcon.setAttribute('stroke', 'currentColor');
    swordsIcon.setAttribute('stroke-width', '2');
    swordsIcon.setAttribute('stroke-linecap', 'round');
    swordsIcon.setAttribute('stroke-linejoin', 'round');
    swordsIcon.innerHTML = `
        <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/>
        <line x1="13" x2="19" y1="19" y2="13"/>
        <line x1="16" x2="20" y1="16" y2="20"/>
        <line x1="19" x2="21" y1="21" y2="19"/>
        <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/>
        <line x1="5" x2="9" y1="14" y2="18"/>
        <line x1="7" x2="4" y1="17" y2="20"/>
        <line x1="3" x2="5" y1="19" y2="21"/>
    `;
    
    vampButton.appendChild(swordsIcon);
    vampButton.style.cssText = `
        color: white;
        border: none;
        padding: 5px 9px;
        font-size: 12px;
        font-weight: 600;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Display', Roboto, Helvetica, Arial, sans-serif;
        letter-spacing: 0.5px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        white-space: nowrap;
        margin-right: 8px;
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 28px;
        height: 24px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
    `;
    
    // Apply custom color
    applyVampButtonColor(vampButton);
    
    // Apply size scaling
    applySmallVampButtonSize(vampButton);
    
    vampButton.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        vampButton.disabled = true;
        
        await sendVampRequest(tokenDetails);
        
        setTimeout(() => {
            vampButton.disabled = false;
        }, 1000);
    });
    
    vampButton.style.display = newPairsVampButtonsEnabled ? 'inline-flex' : 'none';
    
    const parentEl = tokenNameSpan.parentNode;
    if (smallVampButtonPosition === 'after') {
        if (tokenNameSpan.nextSibling) {
            parentEl.insertBefore(vampButton, tokenNameSpan.nextSibling);
        } else {
            parentEl.appendChild(vampButton);
        }
        vampButton.style.marginRight = '0';
        vampButton.style.marginLeft = '8px';
    } else {
        parentEl.insertBefore(vampButton, tokenNameSpan);
    }
    // Walk up the specific ancestor chain to unclip, max 6 levels
    let el = parentEl;
    for (let i = 0; i < 6 && el && el !== document.body; i++) {
        const computed = window.getComputedStyle(el);
        if (computed.overflow === 'hidden' || computed.overflowX === 'hidden' || computed.overflowY === 'hidden' ||
            computed.textOverflow === 'ellipsis') {
            el.style.overflow = 'visible';
            el.style.textOverflow = 'unset';
        }
        el = el.parentElement;
    }
    
    return true;
}

// Add image insert button to detailed token cards
function addImageInsertButton(tokenCard, tokenImage) {
    if (!tokenImage || !tokenImage.src) return false;
    
    const imageUrl = tokenImage.src;
    
    // Find the image container to position the button
    const imageContainer = tokenImage.closest('div.group\\/image') || tokenImage.closest('div[class*="h-[68px]"]') || tokenImage.parentElement;
    if (!imageContainer) return false;
    
    imageContainer.style.position = 'relative';
    imageContainer.style.overflow = 'visible';
    
    const insertBtn = document.createElement('button');
    insertBtn.className = 'j7-img-insert-btn';
    
    insertBtn.style.cssText = `
        position: absolute;
        top: -3.5px;
        right: -8px;
        width: 28px;
        height: 28px;
        background-image: url('${imageUrl}');
        background-size: cover;
        background-position: center;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 6px;
        padding: 0;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    `;
    
    // Hover effect
    insertBtn.addEventListener('mouseenter', () => {
        insertBtn.style.transform = 'scale(1.3)';
        insertBtn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
        insertBtn.style.borderColor = 'rgba(255, 255, 255, 0.6)';
    });
    
    insertBtn.addEventListener('mouseleave', () => {
        insertBtn.style.transform = 'scale(1)';
        insertBtn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
        insertBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    });
    
    // Click handler
    insertBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        insertBtn.disabled = true;
        
        try {
            const result = await vampUpdate({ image_url: imageUrl });
            if (result.success) {
                // Success feedback - only border/shadow, keep image
                insertBtn.style.borderColor = 'rgba(16, 185, 129, 0.8)';
                insertBtn.style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.5)';
                setTimeout(() => {
                    insertBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    insertBtn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
                }, 1500);
            } else {
                // Error feedback - only border/shadow, keep image
                insertBtn.style.borderColor = 'rgba(239, 68, 68, 0.8)';
                insertBtn.style.boxShadow = '0 0 12px rgba(239, 68, 68, 0.5)';
                setTimeout(() => {
                    insertBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    insertBtn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
                }, 1500);
            }
        } catch (error) {
            // Error feedback - only border/shadow, keep image
            insertBtn.style.borderColor = 'rgba(239, 68, 68, 0.8)';
            insertBtn.style.boxShadow = '0 0 12px rgba(239, 68, 68, 0.5)';
            setTimeout(() => {
                insertBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                insertBtn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
            }, 1500);
        }
        
        setTimeout(() => {
            insertBtn.disabled = false;
        }, 500);
    });
    
    imageContainer.appendChild(insertBtn);
    return true;
}

const processedSections = new WeakSet();
let isProcessing = false;

function processTokenCards() {
    if (isProcessing) {
        return;
    }
    
    isProcessing = true;
    const tokenInfoSections = document.querySelectorAll('div.flex.flex-row.gap-\\[8px\\].justify-center.items-center');
    const tokenListItems = document.querySelectorAll('a.flex.flex-row.flex-1[class*="h-[88px]"], a.flex.flex-row.flex-1[class*="h-[64px]"]');
    const modalTokenItems = document.querySelectorAll('a[href^="/meme/"][class*="flex-row"][class*="px-[16px]"]');
    // New modal structure: div.group.relative with nested <a> link
    const newModalTokenItems = document.querySelectorAll('div.group.relative.flex.flex-row.flex-1[class*="h-\\[88px\\]"], div.group.relative.flex.flex-row.flex-1[class*="h-\\[64px\\]"], div.group.relative[class*="sm:h-\\[88px\\]"][class*="px-\\[16px\\]"]');
    const detailedTokenCards = document.querySelectorAll('div.flex.flex-row.w-full.gap-\\[12px\\][class*="pl-[12px]"][class*="pr-[12px]"][class*="pt-[12px]"][class*="pb-[2px]"]');
    
    let buttonsAdded = 0;
    
    tokenInfoSections.forEach((tokenSection, index) => {
        if (processedSections.has(tokenSection)) {
            return;
        }
        
        const hasTokenImage = tokenSection.querySelector('img[src*="axiomtrading"]');
        const hasTokenSymbol = tokenSection.querySelector('span.text-textPrimary');
        
        if (hasTokenImage && hasTokenSymbol) {
            const hasVampButton = tokenSection.querySelector('.vamp-button');
            
            if (!hasVampButton) {
                if (addVampButton(tokenSection)) {
                    buttonsAdded++;
                    processedSections.add(tokenSection);
                }
            } else {
                processedSections.add(tokenSection);
            }
        }
    });
    
    tokenListItems.forEach((tokenItem, index) => {
        if (processedSections.has(tokenItem)) {
            return;
        }
        
        const isInModal = tokenItem.closest('[role="dialog"]') || 
                         tokenItem.closest('.fixed.inset-0') ||
                         tokenItem.closest('[class*="modal"]') ||
                         tokenItem.closest('[class*="popup"]') ||
                         tokenItem.closest('[class*="search"]') ||
                         tokenItem.closest('.bg-backgroundTertiary.border-secondaryStroke') ||
                         tokenItem.closest('[class*="shadow-"][class*="overflow-hidden"][class*="pointer-events-auto"]') ||
                         tokenItem.closest('div[class*="sm:w-\\[640px\\]"]') ||
                         tokenItem.closest('div[class*="rounded-\\[8px\\]"][class*="shadow-"]');
        
        if (isInModal) {
            return;
        }
        
        const hasTokenImage = tokenItem.querySelector('img[src*="axiomtrading"]');
        const hasTokenSymbol = tokenItem.querySelector('span.text-textPrimary');
        
        if (hasTokenImage && hasTokenSymbol) {
            const hasVampButton = tokenItem.querySelector('.vamp-button');
            
            if (!hasVampButton) {
                if (addVampButton(tokenItem)) {
                    buttonsAdded++;
                    processedSections.add(tokenItem);
                }
            } else {
                processedSections.add(tokenItem);
            }
        }
    });
    
    modalTokenItems.forEach((modalItem, index) => {
        if (processedSections.has(modalItem)) {
            return;
        }
        
        const hasTokenImage = modalItem.querySelector('img[src*="axiomtrading"]');
        const hasTokenSymbol = modalItem.querySelector('span.text-textPrimary');
        
        if (hasTokenImage && hasTokenSymbol) {
            const hasVampButton = modalItem.querySelector('.vamp-button');
            
            if (!hasVampButton) {
                if (addVampButton(modalItem)) {
                    buttonsAdded++;
                    processedSections.add(modalItem);
                }
            } else {
                processedSections.add(modalItem);
            }
        }
    });
    
    // Process new modal structure (div.group.relative with nested link)
    newModalTokenItems.forEach((modalItem, index) => {
        if (processedSections.has(modalItem)) {
            return;
        }
        
        const hasTokenImage = modalItem.querySelector('img[src*="axiomtrading"]');
        const hasTokenSymbol = modalItem.querySelector('span.text-textPrimary');
        
        if (hasTokenImage && hasTokenSymbol) {
            const hasVampButton = modalItem.querySelector('.vamp-button');
            
            if (!hasVampButton) {
                if (addVampButton(modalItem)) {
                    buttonsAdded++;
                    processedSections.add(modalItem);
                }
            } else {
                processedSections.add(modalItem);
            }
        }
    });
    
    detailedTokenCards.forEach((detailedCard, index) => {
        if (processedSections.has(detailedCard)) {
            return;
        }
        
        const hasTokenImage = detailedCard.querySelector('img[src*="axiomtrading"]');
        // Try new structure first, then old
        let hasTokenName = detailedCard.querySelector('span.text-textPrimary[class*="sm:text-[16px]"][class*="font-medium"]');
        if (!hasTokenName) {
            hasTokenName = detailedCard.querySelector('.text-textPrimary[class*="text-[16px]"][class*="font-medium"][class*="truncate"]');
        }
        
        if (hasTokenImage && hasTokenName) {
            const hasVampButton = detailedCard.querySelector('.vamp-button-small');
            
            if (!hasVampButton) {
                if (addSmallVampButton(detailedCard)) {
                    buttonsAdded++;
                    processedSections.add(detailedCard);
                }
            } else {
                processedSections.add(detailedCard);
            }
            
            if (newPairsInsertImageEnabled && !detailedCard.querySelector('.j7-img-insert-btn')) {
                addImageInsertButton(detailedCard, hasTokenImage);
            }
        }
    });
    
    isProcessing = false;
}

function shouldRunOnThisPage() {
    const hostname = window.location.hostname;
    
    if (!hostname.includes('axiom.trade')) {
        return false;
    }
    
    return true;
}

async function init() {
    if (!shouldRunOnThisPage()) {
        return;
    }
    
    // Load VAMP buttons setting, color, style, fetch mode, card image button, small button size and position (username is loaded by vamp-config.js)
    await loadVampButtonsSetting();
    await loadVampButtonColor();
    await loadVampButtonStyle();
    await loadVampFetchModeSetting();
    await loadNewPairsVampButtonsSetting();
    await loadInsertImageButtonSetting();
    await loadNewPairsInsertImageSetting();
    await loadSmallVampButtonSize();
    await loadSmallVampButtonPosition();
    
    const style = document.createElement('style');
    style.id = 'j7-axiom-vamp-styles';
    style.textContent = `
        .vamp-button-small {
            overflow: visible !important;
        }
        .j7-img-insert-btn {
            overflow: visible !important;
        }
    `;
    document.head.appendChild(style);
    
    // Listen for settings reload
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === 'reloadVampButtons') {
            loadVampButtonsSetting().then(() => {
                document.querySelectorAll('.axiom-big-vamp-button').forEach(btn => {
                    btn.style.display = vampButtonsEnabled ? 'inline-flex' : 'none';
                });
                sendResponse({ success: true });
            });
            return true;
        }
        
        if (request.type === 'reloadNewPairsVampButtons') {
            loadNewPairsVampButtonsSetting().then(() => {
                document.querySelectorAll('.vamp-button-small').forEach(btn => {
                    btn.style.display = newPairsVampButtonsEnabled ? 'inline-flex' : 'none';
                });
                sendResponse({ success: true });
            });
            return true;
        }
        
        if (request.type === 'reloadVampButtonColor') {
            loadVampButtonColor().then(() => {
                // Update all existing VAMP buttons with new color
                document.querySelectorAll('[data-j7-vamp-btn]').forEach(btn => {
                    applyVampButtonColor(btn);
                    // Re-apply solid background for big VAMP buttons
                    if (btn.classList.contains('axiom-big-vamp-button')) {
                        btn.style.background = '#18181b';
                    }
                });
                sendResponse({ success: true });
            });
            return true; // Keep message channel open for async response
        }
        
        if (request.type === 'reloadVampButtonStyle') {
            loadVampButtonStyle().then(() => {
                // Update all existing VAMP buttons with new style
                document.querySelectorAll('[data-j7-vamp-btn]').forEach(btn => {
                    applyVampButtonColor(btn);
                    // Re-apply solid background for big VAMP buttons
                    if (btn.classList.contains('axiom-big-vamp-button')) {
                        btn.style.background = '#18181b';
                    }
                });
                sendResponse({ success: true });
            });
            return true; // Keep message channel open for async response
        }
        
        if (request.type === 'reloadVampFetchMode') {
            loadVampFetchModeSetting().then(() => {
                sendResponse({ success: true });
            });
            return true;
        }
        
        if (request.type === 'reloadVampUsername') {
            // Username is managed by vamp-config.js, reload it there
            loadVampUsername().then(() => {
                sendResponse({ success: true });
            });
            return true;
        }
        
        if (request.type === 'reloadInsertImageButton') {
            loadInsertImageButtonSetting().then(() => {
                sendResponse({ success: true });
            });
            return true;
        }
        
        if (request.type === 'reloadNewPairsInsertImage') {
            loadNewPairsInsertImageSetting().then(() => {
                document.querySelectorAll('.j7-img-insert-btn').forEach(btn => {
                    btn.style.display = newPairsInsertImageEnabled ? 'flex' : 'none';
                });
                sendResponse({ success: true });
            });
            return true;
        }
        
        if (request.type === 'reloadSmallVampButtonSize') {
            loadSmallVampButtonSize().then(() => {
                // Update all existing small VAMP buttons with new size
                document.querySelectorAll('.vamp-button-small').forEach(btn => {
                    applySmallVampButtonSize(btn);
                });
                sendResponse({ success: true });
            });
            return true;
        }
        
        if (request.type === 'reloadSmallVampButtonPosition') {
            loadSmallVampButtonPosition().then(() => {
                // Remove all existing small VAMP buttons so they get re-added in new position
                document.querySelectorAll('.vamp-button-small').forEach(btn => {
                    btn.remove();
                });
                // Clear processed sections so buttons get re-added
                // Note: WeakSet doesn't have clear(), so we just process again
                processTokenCards();
                sendResponse({ success: true });
            });
            return true;
        }
    });
    
    // Run for VAMP buttons
    processTokenCards();
    setTimeout(processTokenCards, 500);
    
    const observer = new MutationObserver(() => {
        setTimeout(processTokenCards, 100);
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    setInterval(processTokenCards, 2000);
    
    let currentUrl = window.location.href;
    const isPulsePage = () => window.location.pathname === '/pulse' || window.location.pathname.startsWith('/pulse');
    
    // Handle URL changes
    const onUrlChange = () => {
        const newUrl = window.location.href;
        if (newUrl !== currentUrl) {
            const nowOnPulse = isPulsePage();
            
            currentUrl = newUrl;
            
            if (nowOnPulse) {
                document.querySelectorAll('.vamp-button-small, .j7-img-insert-btn, .j7-axiom-card-img-btn').forEach(btn => {
                    if (btn.classList.contains('vamp-button-small')) {
                        if (newPairsVampButtonsEnabled) btn.style.display = 'inline-flex';
                    } else if (btn.classList.contains('j7-img-insert-btn') || btn.classList.contains('j7-axiom-card-img-btn')) {
                        if (newPairsInsertImageEnabled) btn.style.display = 'flex';
                    }
                });
                if (shouldRunOnThisPage()) {
                    setTimeout(processTokenCards, 300);
                }
            } else {
                document.querySelectorAll('.vamp-button-small, .j7-img-insert-btn, .j7-axiom-card-img-btn').forEach(btn => {
                    btn.style.display = 'none';
                });
            }
        }
    };
    
    // Hook into history API for SPA navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
        originalPushState.apply(this, args);
        onUrlChange();
    };
    
    history.replaceState = function(...args) {
        originalReplaceState.apply(this, args);
        onUrlChange();
    };
    
    // Also listen for popstate (back/forward buttons)
    window.addEventListener('popstate', onUrlChange);
    
    // Ultra-fast polling for instant detection (comparing strings is cheap)
    setInterval(onUrlChange, 1);
    
    let scrollTimeout = null;
    window.addEventListener('scroll', () => {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (shouldRunOnThisPage()) {
                processTokenCards();
            }
        }, 200);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

window.addEventListener('load', () => {
    if (shouldRunOnThisPage()) {
        setTimeout(processTokenCards, 100);
    }
});
