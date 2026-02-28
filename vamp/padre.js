(function() {
    'use strict';
    
    // Uses VAMP_CONFIG from vamp-config.js (loaded first)
// VAMP buttons setting
let vampButtonsEnabled = true;
let newPairsVampButtonsEnabled = true;
let vampButtonColor = '#ef4444'; // Default red
let vampButtonStyle = 'translucent'; // 'fill' or 'translucent'
let smallVampButtonSize = 1.0; // Scale factor for small VAMP buttons
let smallVampButtonPosition = 'before'; // Position: 'before', 'after', 'end'

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

function extractPadreTokenDetails(tokenContainer) {
    try {
        // Check if it's a valid token by looking for the shortened address span
        // Use attribute selectors that work across all themes
        const addressSpan = tokenContainer.querySelector('span.notranslate[aria-hidden="true"][translate="no"]');
        if (!addressSpan) {
            return null;
        }
        let symbol = '';
        let fullName = '';
        // Get all h1 elements with the notranslate class
        const h1Elements = tokenContainer.querySelectorAll('h1.notranslate[translate="no"]');
        if (h1Elements.length >= 1) {
            symbol = h1Elements[0].textContent.trim();
        }
        if (h1Elements.length >= 2) {
            fullName = h1Elements[1].textContent.trim();
        }
        let imageUrl = '';
        const imageElement = tokenContainer.querySelector('img');
        if (imageElement) {
            imageUrl = imageElement.src;
        }
        // Extract Twitter and Website links - SCAN ENTIRE CONTAINER
        let twitterUrl = null;
        let websiteUrl = null;
        // Get ALL links in the entire token container
        const allLinks = tokenContainer.querySelectorAll('a[href]');
        allLinks.forEach(link => {
            const url = link.href;
            if (!url || url === '#' || url === 'javascript:void(0)') return;
            // Twitter/X link - only exclude search pages
            if ((url.includes('twitter.com') || url.includes('x.com'))) {
                // Skip search pages only
                if (url.includes('/search')) {
                    return;
                }
                // Take the first valid Twitter link
                if (!twitterUrl) {
                    twitterUrl = url;
                }
            } 
            // Website link (NOT a known service)
            else if (!url.includes('dexscreener.com') && 
                      !url.includes('birdeye.so') && 
                      !url.includes('solscan.io') && 
                      !url.includes('pump.fun') && 
                      !url.includes('padre.gg') && 
                      !url.includes('/search?q=') && 
                      !url.includes('/token/') &&
                      !url.includes('twitter.com') && 
                      !url.includes('x.com') && 
                      !url.includes('t.me') && 
                      !url.includes('telegram') && 
                      !url.includes('discord') &&
                      !websiteUrl) {
                websiteUrl = url;
            }
        });
        const siteUrl = window.location.href;
        return {
            symbol: symbol || 'Unknown',
            fullName: fullName || symbol || 'Unknown',
            imageUrl: imageUrl,
            siteUrl: siteUrl,
            twitterUrl: twitterUrl,
            websiteUrl: websiteUrl
        };
    } catch (error) {
        return null;
    }
}
async function sendPadreVampRequest(tokenDetails) {
    try {
        const requestData = {
            token_name: tokenDetails.fullName,
            ticker: tokenDetails.symbol,
            image_url: tokenDetails.imageUrl || '',
            twitter: tokenDetails.twitterUrl || '',
            website: tokenDetails.websiteUrl || '',
            site_url: tokenDetails.siteUrl || window.location.href
        };
        const result = await vampCopy(requestData);
        return result.success;
    } catch (error) {
        return false;
    }
}
function addPadreVampButton(tokenContainer) {
    // Don't check vampButtonsEnabled here - always create the button
    // but hide it if disabled
    
    const tokenDetails = extractPadreTokenDetails(tokenContainer);
    if (!tokenDetails) {
        return false;
    }
    if (tokenContainer.querySelector('.padre-vamp-button')) {
        return false;
    }
    
    // Find the ticker h1 element first - this is where we'll insert next to
    const tickerH1 = tokenContainer.querySelector('h1.MuiTypography-h1.notranslate[translate="no"]');
    if (!tickerH1) {
        return false;
    }
    
    const vampButton = document.createElement('button');
    vampButton.className = 'padre-vamp-button';
    vampButton.setAttribute('data-j7-vamp-btn', 'true');
    
    // Create crossed swords SVG icon - match Axiom style
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
    
    // Style the button - match Axiom small VAMP button exactly
    vampButton.style.cssText = `
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.1);
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
        position: relative;
        z-index: 9999;
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
        // Re-extract token details on click to get the latest data (including Twitter/website links)
        const freshTokenDetails = extractPadreTokenDetails(tokenContainer);
        if (freshTokenDetails) {
            await sendPadreVampRequest(freshTokenDetails);
        }
        setTimeout(() => {
            vampButton.disabled = false;
        }, 1000);
    });
    
    vampButton.style.display = newPairsVampButtonsEnabled ? 'inline-flex' : 'none';
    
    // Insert based on position setting
    if (smallVampButtonPosition === 'after') {
        if (tickerH1.nextSibling) {
            tickerH1.parentNode.insertBefore(vampButton, tickerH1.nextSibling);
        } else {
            tickerH1.parentNode.appendChild(vampButton);
        }
        vampButton.style.marginRight = '0';
        vampButton.style.marginLeft = '8px';
    } else {
        // Default: before ticker
        tickerH1.parentNode.insertBefore(vampButton, tickerH1);
        vampButton.style.marginRight = '8px';
        vampButton.style.marginLeft = '0';
    }
    return true;
}
const processedPadreImages = new WeakSet();
const processedSearchItems = new WeakSet();
let isProcessingPadre = false;
let tokenPageProcessed = false;
let tokenPageProcessing = false; // Flag to prevent concurrent processing

let insertImageButtonEnabled = true;
let newPairsInsertImageEnabled = true;

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

// Add mini image insert button to token cards (like Axiom)
function addPadreCardImageInsertButton(tokenContainer, tokenImage) {
    if (!tokenImage || !tokenImage.src) return false;
    
    const imageUrl = tokenImage.src;
    
    // Find the image container to position the button
    const imageContainer = tokenImage.closest('.MuiAvatar-root') || tokenImage.closest('.MuiBox-root') || tokenImage.parentElement;
    if (!imageContainer) return false;
    
    // Ensure container has relative positioning
    imageContainer.style.position = 'relative';
    
    // Create the insert button with token image as background
    const insertBtn = document.createElement('button');
    insertBtn.className = 'j7-padre-card-img-btn';
    
    insertBtn.style.cssText = `
        position: absolute;
        top: -8px;
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
        z-index: 100;
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
                // Error feedback
                insertBtn.style.borderColor = 'rgba(239, 68, 68, 0.8)';
                insertBtn.style.boxShadow = '0 0 12px rgba(239, 68, 68, 0.5)';
                setTimeout(() => {
                    insertBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    insertBtn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
                }, 1500);
            }
        } catch (error) {
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
    
    insertBtn.style.display = newPairsInsertImageEnabled ? 'flex' : 'none';
    
    imageContainer.appendChild(insertBtn);
    return true;
}

// Extract token details from search modal items
function extractSearchItemDetails(itemElement) {
    try {
        // Get the href to extract pool/token address
        const href = itemElement.href || '';
        if (!href.includes('padre.gg/trade/')) {
            return null;
        }
        
        // Extract symbol from various span elements
        let symbol = '';
        const symbolSpan = itemElement.querySelector('span.MuiTypography-paragraph2, span.MuiTypography-paragraph1');
        if (symbolSpan) {
            // Get text content and remove /SOL suffix if present
            symbol = symbolSpan.textContent.trim().split('/')[0];
        }
        
        // Get image URL
        let imageUrl = '';
        const img = itemElement.querySelector('img.MuiAvatar-img');
        if (img) {
            imageUrl = img.src;
        }
        
        // Extract social links
        let twitterUrl = null;
        let websiteUrl = null;
        
        const allLinks = itemElement.querySelectorAll('a[href]');
        allLinks.forEach(link => {
            const url = link.href;
            if (!url || url === '#' || url === 'javascript:void(0)') return;
            
            if ((url.includes('twitter.com') || url.includes('x.com'))) {
                if (!url.includes('/search') && !twitterUrl) {
                    twitterUrl = url;
                }
            } else if (!url.includes('dexscreener.com') && 
                      !url.includes('birdeye.so') && 
                      !url.includes('solscan.io') && 
                      !url.includes('pump.fun') && 
                      !url.includes('padre.gg') && 
                      !url.includes('t.me') && 
                      !url.includes('telegram') && 
                      !url.includes('discord') &&
                      !websiteUrl) {
                websiteUrl = url;
            }
        });
        
        return {
            symbol: symbol || 'Unknown',
            fullName: symbol || 'Unknown',
            imageUrl: imageUrl,
            siteUrl: href,
            twitterUrl: twitterUrl,
            websiteUrl: websiteUrl
        };
    } catch (error) {
        return null;
    }
}

// Add VAMP button to search modal items
function addSearchItemVampButton(itemElement) {
    if (itemElement.querySelector('.padre-search-vamp-button')) {
        return false;
    }
    
    const tokenDetails = extractSearchItemDetails(itemElement);
    if (!tokenDetails) {
        return false;
    }
    
    const vampButton = document.createElement('button');
    vampButton.className = 'padre-search-vamp-button';
    vampButton.setAttribute('data-j7-vamp-btn', 'true');
    
    // Create crossed swords SVG icon - bigger
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
    
    // Add VAMP text - bigger
    const textSpan = document.createElement('span');
    textSpan.textContent = 'VAMP';
    textSpan.style.cssText = 'font-size: 12px; font-weight: 600; letter-spacing: 0.3px;';
    
    vampButton.appendChild(swordsIcon);
    vampButton.appendChild(textSpan);
    
    // Style the button - absolute positioned ON TOP of L text area
    vampButton.style.cssText = `
        position: absolute;
        right: 120px;
        top: 50%;
        transform: translateY(-50%);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        padding: 10px 16px;
        border-radius: 6px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        cursor: pointer;
        transition: all 0.15s ease;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        height: 36px;
        font-size: 14px;
        white-space: nowrap;
        background: #18181b;
    `;
    
    // Apply custom color but keep solid background for search modal
    applyVampButtonColor(vampButton);
    // Force solid background to hide text behind
    vampButton.style.background = '#18181b';
    const origEnter = vampButton.onmouseenter;
    const origLeave = vampButton.onmouseleave;
    vampButton.onmouseenter = () => {
        vampButton.style.background = '#27272a';
        vampButton.style.transform = 'translateY(-50%) scale(1.02)';
    };
    vampButton.onmouseleave = () => {
        vampButton.style.background = '#18181b';
        vampButton.style.transform = 'translateY(-50%) scale(1)';
    };
    
    vampButton.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        vampButton.disabled = true;
        
        const freshTokenDetails = extractSearchItemDetails(itemElement);
        if (freshTokenDetails) {
            await sendPadreVampRequest(freshTokenDetails);
        }
        
        setTimeout(() => {
            vampButton.disabled = false;
        }, 1000);
    });
    
    // Set initial visibility based on setting
    vampButton.style.display = vampButtonsEnabled ? 'inline-flex' : 'none';
    
    // Make parent position relative so absolute positioning works
    itemElement.style.position = 'relative';
    
    // Append directly to the item (will float with absolute positioning)
    itemElement.appendChild(vampButton);
    return true;
}

// Add insert image button to search modal items (big preview like Axiom)
function addSearchItemInsertImageButton(itemElement) {
    if (!insertImageButtonEnabled) {
        return false;
    }
    
    if (itemElement.querySelector('.padre-search-insert-img-btn')) {
        return false;
    }
    
    const img = itemElement.querySelector('img.MuiAvatar-img');
    if (!img || !img.src) {
        return false;
    }
    
    const imageUrl = img.src;
    
    // Create the button - big preview like Axiom search modal
    const insertBtn = document.createElement('button');
    insertBtn.className = 'padre-search-insert-img-btn';
    insertBtn.title = 'Insert Image to Deploy GUI';
    
    // Style with the token image as background - positioned left of VAMP button
    insertBtn.style.cssText = `
        position: absolute;
        right: 230px;
        top: 50%;
        transform: translateY(-50%);
        width: 63px;
        height: 63px;
        padding: 0;
        border-radius: 6px;
        background-image: url('${imageUrl}');
        background-size: cover;
        background-position: center;
        border: 2px solid rgba(255, 255, 255, 0.3);
        cursor: pointer;
        transition: all 0.2s ease;
        z-index: 9998;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    `;
    
    // Hover effects - expand on hover
    insertBtn.addEventListener('mouseenter', () => {
        insertBtn.style.transform = 'translateY(-50%) scale(1.5)';
        insertBtn.style.borderColor = 'rgba(255, 255, 255, 0.8)';
        insertBtn.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.5)';
        insertBtn.style.zIndex = '99999';
        insertBtn.style.borderRadius = '8px';
    });
    
    insertBtn.addEventListener('mouseleave', () => {
        insertBtn.style.transform = 'translateY(-50%) scale(1)';
        insertBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        insertBtn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
        insertBtn.style.zIndex = '9998';
        insertBtn.style.borderRadius = '6px';
    });
    
    insertBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        try {
            // Send to VAMP to update the image
            const result = await vampUpdate({ image_url: imageUrl });
            if (result && result.success) {
                // Success feedback - green border
                insertBtn.style.borderColor = 'rgb(16, 185, 129)';
                insertBtn.style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.6)';
                setTimeout(() => {
                    insertBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    insertBtn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
                }, 1500);
            }
        } catch (error) {
            console.error('[Padre] Failed to insert image:', error);
            // Error feedback - red border
            insertBtn.style.borderColor = 'rgb(239, 68, 68)';
            insertBtn.style.boxShadow = '0 0 12px rgba(239, 68, 68, 0.6)';
            setTimeout(() => {
                insertBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                insertBtn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
            }, 1500);
        }
    });
    
    // Make parent position relative so absolute positioning works
    itemElement.style.position = 'relative';
    
    // Append directly to the item (will float with absolute positioning)
    itemElement.appendChild(insertBtn);
    return true;
}

// Process search modal items
function processSearchModalItems() {
    // Find all search result links that go to trade pages (anywhere on the page)
    // These are the <a> elements that link to trade.padre.gg/trade/solana/
    const searchItems = document.querySelectorAll('a[href*="padre.gg/trade/solana/"][class*="MuiStack-root"]');
    
    if (searchItems.length > 0) {
        console.log('[Padre Search] Found', searchItems.length, 'search items');
    }
    
    searchItems.forEach(item => {
        if (processedSearchItems.has(item)) {
            return;
        }
        
        // Skip Recents and Live Trades section items
        const href = item.getAttribute('href') || '';
        if (href.includes('tpo=searchRecents') || href.includes('tpo=liveTrades')) {
            return;
        }
        
        // Skip if this is the main token page link (not a search result)
        // Search results have token avatars inside them
        const hasAvatar = item.querySelector('img.MuiAvatar-img');
        if (!hasAvatar) {
            return;
        }
        
        // Check if buttons already exist
        const hasVampButton = item.querySelector('.padre-search-vamp-button');
        const hasInsertBtn = item.querySelector('.padre-search-insert-img-btn');
        
        let buttonsAdded = false;
        
        if (!hasVampButton) {
            if (addSearchItemVampButton(item)) {
                buttonsAdded = true;
            }
        }
        
        if (!hasInsertBtn && insertImageButtonEnabled) {
            if (addSearchItemInsertImageButton(item)) {
                buttonsAdded = true;
            }
        }
        
        if (buttonsAdded || hasVampButton || hasInsertBtn) {
            processedSearchItems.add(item);
        }
    });
}
// Function to handle token PAGE (not cards)
function processTokenPage() {
    // Check if already processed or currently processing
    if (tokenPageProcessed || tokenPageProcessing) {
        return;
    }
    // Set processing flag immediately
    tokenPageProcessing = true;
    const tokenInfoContainer = document.querySelector('div[data-testid="token-info"]');
    if (!tokenInfoContainer) {
        tokenPageProcessing = false;
        return;
    }
    // Check if button already exists in the entire header section
    const existingButton = document.querySelector('div[data-testid="token-info"] .padre-token-page-vamp-button');
    if (existingButton) {
        tokenPageProcessing = false;
        tokenPageProcessed = true;
        return;
    }
    if (tokenPageProcessed) {
        tokenPageProcessing = false;
        return;
    }
    // Set flag immediately to prevent multiple calls
    tokenPageProcessed = true;
    // Extract ticker (before /SOL)
    const tickerH2 = tokenInfoContainer.querySelector('h2.notranslate[translate="no"]');
    if (!tickerH2) {
        tokenPageProcessed = false;
        tokenPageProcessing = false;
        return;
    }
    const fullTicker = tickerH2.textContent.trim();
    const symbol = fullTicker.split('/')[0];
    // Extract name (from the copy button)
    const copyButton = tokenInfoContainer.querySelector('button[id^="button-copy-address-context"]');
    const fullName = copyButton ? copyButton.textContent.trim() : symbol;
    // Extract image
    const img = tokenInfoContainer.querySelector('img.MuiAvatar-img');
    const imageUrl = img ? img.src : '';
    // Create tokenDetails object (will be updated with social links in background)
    const tokenDetails = {
        symbol: symbol || 'Unknown',
        fullName: fullName || symbol || 'Unknown',
        imageUrl: imageUrl,
        siteUrl: window.location.href,
        twitterUrl: '',
        websiteUrl: ''
    };
    // Create button immediately
    const vampButton = document.createElement('button');
    vampButton.className = 'padre-token-page-vamp-button';
    vampButton.setAttribute('data-j7-vamp-btn', 'true');
    // Add SVG icon
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
    const textSpan = document.createElement('span');
    textSpan.textContent = 'VAMP';
    textSpan.style.cssText = 'font-size: 12px; font-weight: 600; letter-spacing: 0.3px;';
    vampButton.appendChild(swordsIcon);
    vampButton.appendChild(textSpan);
    // Apply styling for token page - match other large VAMP buttons
    vampButton.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 10px 20px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        cursor: pointer;
        transition: all 0.15s ease;
        height: 40px;
        min-width: 90px;
        flex-shrink: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1;
        background: #18181b;
        margin-left: 8px;
        margin-top: 8px;
        z-index: 9999;
        vertical-align: middle;
    `;
    // Apply custom color
    applyVampButtonColor(vampButton);
    
    // On click - re-extract social links fresh before sending
    vampButton.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        vampButton.disabled = true;
        // Re-extract social links right before sending - scan entire token info container
        const socialContainer = tokenInfoContainer;
        if (socialContainer) {
            const linkElements = socialContainer.querySelectorAll('a[href]');
            let twitterUrl = '';
            let websiteUrl = '';
            linkElements.forEach((link) => {
                const url = link.href;
                if (url.includes('pump.fun') || url.includes('dexscreener.com') || 
                    url.includes('birdeye.so') || url.includes('solscan.io') || url.includes('dev.fun')) {
                    return;
                }
                if (url.includes('twitter.com') || url.includes('x.com')) {
                    if (!url.includes('/search') && !twitterUrl) {
                        twitterUrl = url;
                    }
                } else if (!url.includes('t.me') && !url.includes('telegram') && !websiteUrl) {
                    websiteUrl = url;
                }
            });
            // Update tokenDetails with fresh links
            tokenDetails.twitterUrl = twitterUrl || tokenDetails.twitterUrl;
            tokenDetails.websiteUrl = websiteUrl || tokenDetails.websiteUrl;
        }
        await sendPadreVampRequest(tokenDetails);
        setTimeout(() => {
            vampButton.disabled = false;
        }, 1000);
    });
    
    // Set initial visibility based on setting
    vampButton.style.display = vampButtonsEnabled ? 'inline-flex' : 'none';
    
    // Insert button at the FAR RIGHT - find the last container with settings buttons
    // Look for the container with gear/minimize icons (css-ct9q29 or similar with MuiIconButton-sizeXsmall)
    const allStacks = tokenInfoContainer.querySelectorAll('.MuiStack-root');
    let settingsContainer = null;
    
    // Find the rightmost stack that contains settings buttons
    for (const stack of allStacks) {
        if (stack.querySelector('button.MuiIconButton-sizeXsmall')) {
            settingsContainer = stack;
        }
    }
    
    if (settingsContainer) {
        // Append to the end of settings container (far right)
        settingsContainer.appendChild(vampButton);
    } else {
        // Fallback: append to the token info container itself
        tokenInfoContainer.appendChild(vampButton);
    }
    // Background: Keep checking for social links for 3 seconds
    let checkCount = 0;
    const maxChecks = 12; // Check 12 times over 3 seconds
    const checkInterval = setInterval(() => {
        checkCount++;
        // Scan entire token info container for links
        const socialContainer = tokenInfoContainer;
        if (socialContainer) {
            const linkElements = socialContainer.querySelectorAll('a[href]');
            let twitterUrl = '';
            let websiteUrl = '';
            linkElements.forEach((link) => {
                const url = link.href;
                if (url.includes('pump.fun') || url.includes('dexscreener.com') || 
                    url.includes('birdeye.so') || url.includes('solscan.io') || url.includes('dev.fun')) {
                    return;
                }
                if (url.includes('twitter.com') || url.includes('x.com')) {
                    if (!url.includes('/search') && !twitterUrl) {
                        twitterUrl = url;
                    }
                } else if (!url.includes('t.me') && !url.includes('telegram') && !websiteUrl) {
                    websiteUrl = url;
                }
            });
            // Update tokenDetails if we found links
            if (twitterUrl || websiteUrl) {
                tokenDetails.twitterUrl = twitterUrl || tokenDetails.twitterUrl;
                tokenDetails.websiteUrl = websiteUrl || tokenDetails.websiteUrl;
            }
            // Stop early if we found both links
            if (tokenDetails.twitterUrl && tokenDetails.websiteUrl) {
                clearInterval(checkInterval);
                tokenPageProcessing = false;
                return;
            }
        }
        // Stop after max checks
        if (checkCount >= maxChecks) {
            clearInterval(checkInterval);
            tokenPageProcessing = false;
        }
    }, 250); // Check every 250ms
}
function processPadreTokens() {
    if (isProcessingPadre) {
        return;
    }
    isProcessingPadre = true;
    // Try to process token page first
    processTokenPage();
    // Process search modal items
    processSearchModalItems();
    try {
        const tokenImages = document.querySelectorAll('img.MuiAvatar-img');
        let buttonsAdded = 0;
        tokenImages.forEach((img, index) => {
            if (processedPadreImages.has(img)) {
                return;
            }
            // Find the card container - it's typically a span.MuiBox-root that contains both
            // the button area (css-mqonfk) and the content area
            // Go up the tree to find the right container
            let tokenContainer = null;
            let parent = img.parentElement;
            
            // Walk up the tree looking for the card container
            for (let i = 0; i < 15 && parent; i++) {
                // Check if this element contains both a button area and an avatar
                const hasButtonArea = parent.querySelector('.bloom-buy-qt-btn, .trenches-quick-buy-hover, [style*="display: flex"][style*="gap"]');
                const hasAvatar = parent.querySelector('img.MuiAvatar-img');
                const hasTokenName = parent.querySelector('h1.notranslate[translate="no"]');
                
                if (hasButtonArea && hasAvatar && hasTokenName) {
                    tokenContainer = parent;
                    break;
                }
                parent = parent.parentElement;
            }
            
            if (!tokenContainer) {
                // Fallback: Use theme-agnostic selector
                tokenContainer = img.closest('span.MuiBox-root[class*="css-"]');
            }
            
            if (!tokenContainer) {
                return;
            }
            const hasVampButton = tokenContainer.querySelector('.padre-vamp-button');
            if (!hasVampButton) {
                const tokenDetails = extractPadreTokenDetails(tokenContainer);
                if (tokenDetails) {
                    if (addPadreVampButton(tokenContainer)) {
                        buttonsAdded++;
                        processedPadreImages.add(img);
                    }
                }
            } else {
                processedPadreImages.add(img);
            }
            
            if (newPairsInsertImageEnabled && !tokenContainer.querySelector('.j7-padre-card-img-btn')) {
                addPadreCardImageInsertButton(tokenContainer, img);
            }
        });
    } catch (error) {
    } finally {
        isProcessingPadre = false;
    }
}
function isPadrePage() {
    return window.location.hostname.includes('padre.gg');
}
async function initPadre() {
    if (!isPadrePage()) {
        return;
    }
    
    // Load VAMP buttons setting, color, style, small button size and position
    await loadVampButtonsSetting();
    await loadNewPairsVampButtonsSetting();
    await loadVampButtonColor();
    await loadVampButtonStyle();
    await loadInsertImageButtonSetting();
    await loadNewPairsInsertImageSetting();
    await loadSmallVampButtonSize();
    await loadSmallVampButtonPosition();
    
    // Inject CSS to prevent parent containers from clipping VAMP buttons
    const style = document.createElement('style');
    style.textContent = `
        .padre-vamp-button {
            overflow: visible !important;
        }
        /* Allow overflow on parent containers up to 5 levels deep */
        div:has(> .padre-vamp-button),
        div:has(> div > .padre-vamp-button),
        div:has(> div > div > .padre-vamp-button),
        [class*="MuiBox"]:has(.padre-vamp-button),
        [class*="MuiStack"]:has(.padre-vamp-button) {
            overflow: visible !important;
        }
        
        /* Mini card image button overflow */
        .j7-padre-card-img-btn {
            overflow: visible !important;
        }
        /* Allow overflow on parent containers for mini image button */
        .MuiAvatar-root:has(.j7-padre-card-img-btn),
        .MuiBox-root:has(.j7-padre-card-img-btn),
        div:has(> .j7-padre-card-img-btn),
        div:has(> div > .j7-padre-card-img-btn),
        span:has(.j7-padre-card-img-btn),
        [class*="MuiAvatar"]:has(.j7-padre-card-img-btn) {
            overflow: visible !important;
        }
    `;
    document.head.appendChild(style);
    
    // Listen for settings reload
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === 'reloadVampButtons') {
            loadVampButtonsSetting().then(() => {
                document.querySelectorAll('.padre-search-vamp-button, .padre-token-page-vamp-button').forEach(btn => {
                    btn.style.display = vampButtonsEnabled ? 'inline-flex' : 'none';
                });
                sendResponse({ success: true });
            });
            return true;
        }
        
        if (request.type === 'reloadNewPairsVampButtons') {
            loadNewPairsVampButtonsSetting().then(() => {
                document.querySelectorAll('.padre-vamp-button').forEach(btn => {
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
                    // Re-apply solid background for search modal buttons
                    if (btn.classList.contains('padre-search-vamp-button')) {
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
                    // Re-apply solid background for search modal buttons
                    if (btn.classList.contains('padre-search-vamp-button')) {
                        btn.style.background = '#18181b';
                    }
                });
                sendResponse({ success: true });
            });
            return true; // Keep message channel open for async response
        }
        
        if (request.type === 'reloadInsertImageButton') {
            loadInsertImageButtonSetting().then(() => {
                document.querySelectorAll('.padre-search-insert-img-btn').forEach(btn => {
                    btn.style.display = insertImageButtonEnabled ? 'flex' : 'none';
                });
                if (insertImageButtonEnabled) {
                    processSearchModalItems();
                }
                sendResponse({ success: true });
            });
            return true;
        }
        
        if (request.type === 'reloadNewPairsInsertImage') {
            loadNewPairsInsertImageSetting().then(() => {
                document.querySelectorAll('.j7-padre-card-img-btn').forEach(btn => {
                    btn.style.display = newPairsInsertImageEnabled ? 'flex' : 'none';
                });
                if (newPairsInsertImageEnabled) {
                    processPadreTokens();
                }
                sendResponse({ success: true });
            });
            return true;
        }
        
        if (request.type === 'reloadSmallVampButtonSize') {
            loadSmallVampButtonSize().then(() => {
                // Update all existing small VAMP buttons with new size
                document.querySelectorAll('.padre-vamp-button').forEach(btn => {
                    applySmallVampButtonSize(btn);
                });
                sendResponse({ success: true });
            });
            return true;
        }
        
        if (request.type === 'reloadSmallVampButtonPosition') {
            loadSmallVampButtonPosition().then(() => {
                // Remove all existing small VAMP buttons so they get re-added in new position
                document.querySelectorAll('.padre-vamp-button').forEach(btn => {
                    btn.remove();
                });
                processPadreTokens();
                sendResponse({ success: true });
            });
            return true;
        }
    });
    
    // IMMEDIATE initial check
    processPadreTokens();
    // Multiple rapid initial checks
    setTimeout(processPadreTokens, 100);
    setTimeout(processPadreTokens, 300);
    setTimeout(processPadreTokens, 500);
    setTimeout(processPadreTokens, 800);
    setTimeout(processPadreTokens, 1200);
    setTimeout(processPadreTokens, 2000);
    setTimeout(processPadreTokens, 3000);
    // SUPER AGGRESSIVE MutationObserver - process EVERY change
    const observer = new MutationObserver((mutations) => {
        // Check if any mutations added nodes
        let shouldProcess = false;
        for (const mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
                shouldProcess = true;
                break;
            }
        }
        if (shouldProcess) {
            processPadreTokens();
        }
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    // VERY frequent interval checks (every 500ms)
    setInterval(processPadreTokens, 500);
    // URL change detection (check every 50ms)
    let currentUrl = window.location.href;
    setInterval(() => {
        if (window.location.href !== currentUrl) {
            currentUrl = window.location.href;
            tokenPageProcessed = false; // Reset token page flag on URL change
            tokenPageProcessing = false; // Reset processing flag on URL change
            if (isPadrePage()) {
                processPadreTokens();
                setTimeout(processPadreTokens, 100);
                setTimeout(processPadreTokens, 300);
                setTimeout(processPadreTokens, 600);
                setTimeout(processPadreTokens, 1000);
            }
        }
    }, 50);
    // Scroll handling
    let scrollTimeout = null;
    window.addEventListener('scroll', () => {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (isPadrePage()) {
                processPadreTokens();
            }
        }, 100);
    });
    // Focus handling - process when user comes back to tab
    window.addEventListener('focus', () => {
        if (isPadrePage()) {
            processPadreTokens();
            setTimeout(processPadreTokens, 100);
            setTimeout(processPadreTokens, 300);
        }
    });
    // Visibility change handling
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && isPadrePage()) {
            processPadreTokens();
            setTimeout(processPadreTokens, 100);
            setTimeout(processPadreTokens, 300);
        }
    });
    // Mouse movement detection - ensures we catch lazy-loaded content
    let mouseMoveTimeout = null;
    let lastMouseMove = 0;
    document.addEventListener('mousemove', () => {
        const now = Date.now();
        if (now - lastMouseMove > 200) {
            if (mouseMoveTimeout) clearTimeout(mouseMoveTimeout);
            mouseMoveTimeout = setTimeout(() => {
                if (isPadrePage()) {
                    processPadreTokens();
                }
            }, 50);
            lastMouseMove = now;
        }
    }, { passive: true });
    // Click detection
    document.addEventListener('click', () => {
        if (isPadrePage()) {
            setTimeout(processPadreTokens, 100);
            setTimeout(processPadreTokens, 300);
        }
    }, { passive: true });
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPadre);
} else {
    initPadre();
}
window.addEventListener('load', () => {
    if (isPadrePage()) {
        setTimeout(processPadreTokens, 100);
        setTimeout(processPadreTokens, 500);
        setTimeout(processPadreTokens, 1000);
    }
});
})();
