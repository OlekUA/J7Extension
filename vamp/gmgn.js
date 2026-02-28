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
let insertImageButtonEnabled = true;
let newPairsInsertImageEnabled = true;

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

function extractGmgnTokenDetails(tokenContainer) {
    try {
        let tokenAddress = '';
        const href = tokenContainer.getAttribute('href');
        if (href) {
            const addressMatch = href.match(/\/token\/(0x[a-fA-F0-9]{40})/);
            if (addressMatch) {
                tokenAddress = addressMatch[1];
            }
        }
        
        if (!tokenAddress) {
            const tokenLink = tokenContainer.querySelector('a[href*="/token/0x"]');
            if (tokenLink) {
                const linkMatch = tokenLink.href.match(/\/token\/(0x[a-fA-F0-9]{40})/);
                if (linkMatch) {
                    tokenAddress = linkMatch[1];
                }
            }
        }
        
        let symbol = '';
        let fullName = '';
        
        const tokenInfoContainer = tokenContainer.querySelector('.flex.flex-col.justify-between.flex-1.overflow-hidden');
        
        if (tokenInfoContainer) {
            const tickerElement = tokenInfoContainer.querySelector('.whitespace-nowrap.font-medium.text-\\[16px\\]');
            if (tickerElement) {
                symbol = tickerElement.textContent.trim();
            }
            
            const nameElement = tokenInfoContainer.querySelector('.text-text-300.font-medium');
            if (nameElement) {
                fullName = nameElement.textContent.trim();
            }
        }
        
        if (!symbol) {
            const tickerElements = tokenContainer.querySelectorAll('.whitespace-nowrap.font-medium.text-\\[16px\\]');
            if (tickerElements.length > 0) {
                for (const el of tickerElements) {
                    const text = el.textContent.trim();
                    if (text && !/^\d+$/.test(text) && !text.includes('/')) {
                        symbol = text;
                        break;
                    }
                }
            }
        }
        
        if (!fullName && symbol) {
            fullName = symbol;
        }
        
        let imageUrl = '';
        const imageElement = tokenContainer.querySelector('img[alt="logo"], img[src*="gmgn.ai"], img[src*="external-res"], img[src*="four.meme"], img[src*="pump.fun"]');
        if (imageElement) {
            imageUrl = imageElement.src;
        }
        
        // Extract Twitter and Website links
        let twitterUrl = null;
        let websiteUrl = null;
        
        const socialContainer = tokenContainer.querySelector('.flex.gap-\\[8px\\].items-center');
        if (socialContainer) {
            const linkElements = socialContainer.querySelectorAll('a[href]');
            
            linkElements.forEach(link => {
                const url = link.href;
                
                if (!url || url === '#' || url === 'javascript:void(0)') return;
                
                if (url.includes('dexscreener.com') ||
                    url.includes('birdeye.so') ||
                    url.includes('solscan.io') ||
                    url.includes('gmgn.ai')) {
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
        
        let siteUrl = window.location.origin + (href || '');
        if (!href && tokenAddress) {
            siteUrl = window.location.origin + '/sol/token/' + tokenAddress;
        }
        
        return {
            symbol: symbol || tokenAddress || 'Unknown',
            fullName: fullName || symbol || 'Unknown',
            imageUrl: imageUrl,
            siteUrl: siteUrl,
            twitterUrl: twitterUrl,
            websiteUrl: websiteUrl,
            tokenAddress: tokenAddress
        };
        
    } catch (error) {
        return null;
    }
}

async function sendGmgnVampRequest(tokenDetails) {
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

function addGmgnVampButton(tokenContainer) {
    // Don't check vampButtonsEnabled here - always create the button
    // but hide it if disabled
    
    const tokenDetails = extractGmgnTokenDetails(tokenContainer);
    if (!tokenDetails) {
        return false;
    }
    
    if (tokenContainer.querySelector('.gmgn-vamp-button')) {
        return false;
    }
    
    const vampButton = document.createElement('button');
    vampButton.className = 'gmgn-vamp-button';
    vampButton.setAttribute('data-j7-vamp-btn', 'true');
    
    // Create crossed swords SVG icon - match Axiom style exactly
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
        
        await sendGmgnVampRequest(tokenDetails);
        
        setTimeout(() => {
            vampButton.disabled = false;
        }, 1000);
    });
    
    vampButton.style.display = newPairsVampButtonsEnabled ? 'inline-flex' : 'none';
    
    const tokenNameContainer = tokenContainer.querySelector('.whitespace-nowrap.font-medium.text-\\[16px\\]');
    
    if (tokenNameContainer && tokenNameContainer.parentNode) {
        // Match Axiom small VAMP button exactly
        vampButton.style.height = '24px';
        vampButton.style.minWidth = '28px';
        vampButton.style.padding = '5px 9px';
        vampButton.style.fontSize = '12px';
        vampButton.style.fontWeight = '600';
        vampButton.style.borderRadius = '6px';
        
        // Insert based on position setting
        if (smallVampButtonPosition === 'after') {
            if (tokenNameContainer.nextSibling) {
                tokenNameContainer.parentNode.insertBefore(vampButton, tokenNameContainer.nextSibling);
            } else {
                tokenNameContainer.parentNode.appendChild(vampButton);
            }
            vampButton.style.marginRight = '0';
            vampButton.style.marginLeft = '8px';
        } else {
            // Default: before ticker
            tokenNameContainer.parentNode.insertBefore(vampButton, tokenNameContainer);
            vampButton.style.marginLeft = '0';
            vampButton.style.marginRight = '8px';
        }
        
        return true;
    }
    
    return false;
}

function addGmgnTokenPageButton() {
    if (document.querySelector('.gmgn-vamp-token-page-button')) {
        return false;
    }
    
    const tokenHeaderSection = document.querySelector('.flex.items-center.pl-16px.h-\\[70px\\].bg-bg-100');
    if (!tokenHeaderSection) {
        return false;
    }
    
    let symbol = '';
    let fullName = '';
    let imageUrl = '';
    let tokenAddress = '';
    let twitterUrl = '';
    let websiteUrl = '';
    
    const tokenNameElement = tokenHeaderSection.querySelector('.text-text-200.text-xl.font-semibold');
    const tokenTickerElement = tokenHeaderSection.querySelector('.text-text-300.font-normal.text-base');
    if (tokenNameElement) fullName = tokenNameElement.textContent.trim();
    if (tokenTickerElement) symbol = tokenTickerElement.textContent.trim();
    
    if (!fullName && !symbol) {
        return false;
    }
    
    const tokenImage = tokenHeaderSection.querySelector('img[src*="gmgn.ai"], img[src*="external-res"]');
    if (tokenImage) imageUrl = tokenImage.src;
    
    const urlMatch = window.location.pathname.match(/\/token\/(0x[a-fA-F0-9]{40})/);
    if (urlMatch) tokenAddress = urlMatch[1];
    
    const allLinks = tokenHeaderSection.querySelectorAll('a[href]');
    
    allLinks.forEach(link => {
        const svg = link.querySelector('svg');
        if (!svg) return;
        
        const path = svg.querySelector('path');
        if (!path) return;
        
        const pathD = path.getAttribute('d');
        if (!pathD) return;
        
        if (pathD.includes('M13.2115 1.9254') || 
            pathD.includes('M5.90137 10.7862') || 
            pathD.includes('M7.18994 9.37073')) {
            if (!twitterUrl) {
                twitterUrl = link.href;
            }
        }
        else if (pathD.includes('M1.72364 7.33125') || pathD.includes('M0.351074 8.00002')) {
            if (!websiteUrl) {
                websiteUrl = link.href;
            }
        }
    });
    
    const tokenDetails = {
        symbol: symbol || tokenAddress || 'Unknown',
        fullName: fullName || symbol || 'Unknown',
        imageUrl: imageUrl,
        siteUrl: window.location.href,
        twitterUrl: twitterUrl,
        websiteUrl: websiteUrl,
        tokenAddress: tokenAddress
    };
    
    const vampButton = document.createElement('button');
    vampButton.className = 'gmgn-vamp-token-page-button';
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
    
    const textSpan = document.createElement('span');
    textSpan.textContent = 'VAMP';
    vampButton.appendChild(textSpan);
    
    vampButton.style.cssText = `
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.1);
        font-size: 14px;
        font-weight: 700;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'SF Pro Display', Roboto, Helvetica, Arial, sans-serif;
        letter-spacing: 0.2px;
        line-height: 1.5;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        white-space: nowrap;
        margin-left: 8px;
        flex-shrink: 0;
        backdrop-filter: blur(10px);
        height: 40px;
        min-width: 80px;
        padding: 8px 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        z-index: 100;
        position: relative;
    `;
    
    // Apply custom color
    applyVampButtonColor(vampButton);
    
    vampButton.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        vampButton.disabled = true;
        
        await sendGmgnVampRequest(tokenDetails);
        
        setTimeout(() => {
            vampButton.disabled = false;
        }, 1000);
    });
    
    // Set initial visibility based on setting
    vampButton.style.display = vampButtonsEnabled ? 'flex' : 'none';
    
    const iconContainer = tokenHeaderSection.querySelector('.flex.items-center.gap-x-10px');
    if (iconContainer) {
        iconContainer.appendChild(vampButton);
        return true;
    }
    
    return false;
}

const processedGmgnContainers = new WeakSet();
const processedGmgnSearchItems = new WeakSet();
let isProcessingGmgn = false;
let tokenPageButtonAdded = false;

function extractGmgnSearchItemDetails(itemElement) {
    try {
        const href = itemElement.getAttribute('href') || '';
        if (!href.includes('/token/')) return null;

        let tokenAddress = '';
        const solMatch = href.match(/\/token\/([A-Za-z0-9]{32,50})/);
        const evmMatch = href.match(/\/token\/(0x[a-fA-F0-9]{40})/);
        if (solMatch) tokenAddress = solMatch[1];
        else if (evmMatch) tokenAddress = evmMatch[1];

        let symbol = '';
        let fullName = '';
        const titleDiv = itemElement.querySelector('div[title]');
        if (titleDiv) {
            symbol = titleDiv.getAttribute('title') || titleDiv.textContent.trim();
        }
        if (!symbol) {
            const tickerEl = itemElement.querySelector('.css-1vlwulx');
            if (tickerEl) symbol = tickerEl.textContent.trim();
        }
        const nameEl = itemElement.querySelector('.text-text-300.whitespace-nowrap');
        if (nameEl) {
            fullName = nameEl.textContent.trim();
        }
        if (!fullName && symbol) fullName = symbol;

        let imageUrl = '';
        const img = itemElement.querySelector('img[alt="logo"]');
        if (img) imageUrl = img.src;

        let twitterUrl = null;
        let websiteUrl = null;
        const allLinks = itemElement.querySelectorAll('a[href]');
        allLinks.forEach(link => {
            const url = link.href;
            if (!url || url === '#') return;
            if ((url.includes('twitter.com') || url.includes('x.com')) && !twitterUrl) {
                twitterUrl = url;
            } else if (!url.includes('t.me') && !url.includes('telegram') &&
                       !url.includes('gmgn.ai') && !url.includes('lens.google.com') &&
                       !url.includes('pump.fun') && !url.includes('discord') && !websiteUrl) {
                const isInternal = url.includes('/token/') || url.includes('/sol/') || url.includes('/base/') || url.includes('/eth/');
                if (!isInternal) websiteUrl = url;
            }
        });

        return {
            symbol: symbol || tokenAddress || 'Unknown',
            fullName: fullName || symbol || 'Unknown',
            imageUrl: imageUrl,
            siteUrl: window.location.origin + href,
            twitterUrl: twitterUrl,
            websiteUrl: websiteUrl,
            tokenAddress: tokenAddress
        };
    } catch (error) {
        return null;
    }
}

function addGmgnSearchVampButton(itemElement) {
    if (itemElement.querySelector('.gmgn-search-vamp-button')) return false;

    const tokenDetails = extractGmgnSearchItemDetails(itemElement);
    if (!tokenDetails) return false;

    const vampButton = document.createElement('button');
    vampButton.className = 'gmgn-search-vamp-button';
    vampButton.setAttribute('data-j7-vamp-btn', 'true');

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
    textSpan.style.cssText = 'font-size: 11px; font-weight: 600; letter-spacing: 0.3px;';

    vampButton.appendChild(swordsIcon);
    vampButton.appendChild(textSpan);

    vampButton.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 4px 8px;
        border-radius: 6px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        cursor: pointer;
        transition: all 0.15s ease;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        height: 28px;
        white-space: nowrap;
        background: rgba(24, 24, 27, 0.9);
        color: white;
        flex-shrink: 0;
    `;

    applyVampButtonColor(vampButton);
    vampButton.style.background = 'rgba(24, 24, 27, 0.9)';
    vampButton.onmouseenter = () => {
        vampButton.style.background = 'rgba(39, 39, 42, 0.95)';
        vampButton.style.transform = 'scale(1.05)';
    };
    vampButton.onmouseleave = () => {
        vampButton.style.background = 'rgba(24, 24, 27, 0.9)';
        vampButton.style.transform = 'scale(1)';
    };

    vampButton.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        vampButton.disabled = true;
        await sendGmgnVampRequest(tokenDetails);
        setTimeout(() => { vampButton.disabled = false; }, 1000);
    });

    vampButton.style.display = vampButtonsEnabled ? 'inline-flex' : 'none';
    return vampButton;
}

function addGmgnSearchInsertImageButton(itemElement) {
    if (itemElement.querySelector('.gmgn-search-insert-img-btn')) return false;

    const img = itemElement.querySelector('img[alt="logo"]');
    if (!img || !img.src) return false;

    const imageUrl = img.src;

    const insertBtn = document.createElement('button');
    insertBtn.className = 'gmgn-search-insert-img-btn';
    insertBtn.title = 'Insert Image to Deploy GUI';

    insertBtn.style.cssText = `
        width: 28px;
        height: 28px;
        padding: 0;
        border-radius: 6px;
        background-image: url('${imageUrl}');
        background-size: cover;
        background-position: center;
        border: 1.5px solid rgba(255, 255, 255, 0.3);
        cursor: pointer;
        transition: all 0.2s ease;
        z-index: 9998;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
        flex-shrink: 0;
    `;

    insertBtn.addEventListener('mouseenter', () => {
        insertBtn.style.transform = 'scale(1.8)';
        insertBtn.style.borderColor = 'rgba(255, 255, 255, 0.8)';
        insertBtn.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.5)';
        insertBtn.style.zIndex = '99999';
        insertBtn.style.borderRadius = '8px';
    });

    insertBtn.addEventListener('mouseleave', () => {
        insertBtn.style.transform = 'scale(1)';
        insertBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        insertBtn.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.3)';
        insertBtn.style.zIndex = '9998';
        insertBtn.style.borderRadius = '6px';
    });

    insertBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        try {
            const result = await vampUpdate({ image_url: imageUrl });
            if (result && result.success) {
                insertBtn.style.borderColor = 'rgb(16, 185, 129)';
                insertBtn.style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.6)';
                setTimeout(() => {
                    insertBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    insertBtn.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.3)';
                }, 1500);
            } else {
                insertBtn.style.borderColor = 'rgb(239, 68, 68)';
                insertBtn.style.boxShadow = '0 0 12px rgba(239, 68, 68, 0.6)';
                setTimeout(() => {
                    insertBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    insertBtn.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.3)';
                }, 1500);
            }
        } catch (error) {
            insertBtn.style.borderColor = 'rgb(239, 68, 68)';
            insertBtn.style.boxShadow = '0 0 12px rgba(239, 68, 68, 0.6)';
            setTimeout(() => {
                insertBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                insertBtn.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.3)';
            }, 1500);
        }
    });

    insertBtn.style.display = insertImageButtonEnabled ? 'flex' : 'none';
    return insertBtn;
}

function processGmgnSearchResults() {
    const searchItems = document.querySelectorAll('a[href*="/token/"].h-\\[72px\\]');

    searchItems.forEach(item => {
        if (processedGmgnSearchItems.has(item)) return;

        const btnContainer = item.querySelector('.search-buy-button-container');
        if (!btnContainer) return;

        let buttonsAdded = false;

        if (!item.querySelector('.gmgn-search-insert-img-btn') && insertImageButtonEnabled) {
            const insertBtn = addGmgnSearchInsertImageButton(item);
            if (insertBtn) {
                btnContainer.appendChild(insertBtn);
                buttonsAdded = true;
            }
        }

        if (!item.querySelector('.gmgn-search-vamp-button')) {
            const vampBtn = addGmgnSearchVampButton(item);
            if (vampBtn) {
                btnContainer.appendChild(vampBtn);
                buttonsAdded = true;
            }
        }

        if (buttonsAdded || item.querySelector('.gmgn-search-vamp-button') || item.querySelector('.gmgn-search-insert-img-btn')) {
            processedGmgnSearchItems.add(item);
        }
    });
}

function addGmgnCardImageInsertButton(tokenContainer) {
    if (tokenContainer.querySelector('.gmgn-card-img-btn')) return false;

    const img = tokenContainer.querySelector('img[alt="logo"], img[src*="gmgn.ai"], img[src*="external-res"], img[src*="four.meme"], img[src*="pump.fun"]');
    if (!img || !img.src) return false;

    const imageUrl = img.src;

    // Find the outer relative wrapper above the overflow-hidden circular clip
    // Structure: div.relative > div.overflow-hidden > img
    const clipDiv = img.closest('div[class*="overflow-hidden"]');
    const imageContainer = clipDiv
        ? (clipDiv.closest('div.relative') || clipDiv.parentElement)
        : (img.closest('div.relative') || img.parentElement);
    if (!imageContainer) return false;

    imageContainer.style.position = 'relative';

    const insertBtn = document.createElement('button');
    insertBtn.className = 'gmgn-card-img-btn';

    insertBtn.style.cssText = `
        position: absolute;
        top: -4px;
        right: -6px;
        width: 24px;
        height: 24px;
        background-image: url('${imageUrl}');
        background-size: cover;
        background-position: center;
        border: 1.5px solid rgba(255, 255, 255, 0.3);
        border-radius: 5px;
        padding: 0;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        transition: all 0.2s ease;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    `;

    insertBtn.addEventListener('mouseenter', () => {
        insertBtn.style.transform = 'scale(1.5)';
        insertBtn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5)';
        insertBtn.style.borderColor = 'rgba(255, 255, 255, 0.7)';
        insertBtn.style.zIndex = '9999';
        insertBtn.style.borderRadius = '6px';
    });

    insertBtn.addEventListener('mouseleave', () => {
        insertBtn.style.transform = 'scale(1)';
        insertBtn.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.3)';
        insertBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        insertBtn.style.zIndex = '100';
        insertBtn.style.borderRadius = '5px';
    });

    insertBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        try {
            const result = await vampUpdate({ image_url: imageUrl });
            if (result && result.success) {
                insertBtn.style.borderColor = 'rgb(16, 185, 129)';
                insertBtn.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.6)';
                setTimeout(() => {
                    insertBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    insertBtn.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.3)';
                }, 1500);
            } else {
                insertBtn.style.borderColor = 'rgb(239, 68, 68)';
                insertBtn.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.6)';
                setTimeout(() => {
                    insertBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    insertBtn.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.3)';
                }, 1500);
            }
        } catch (error) {
            insertBtn.style.borderColor = 'rgb(239, 68, 68)';
            insertBtn.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.6)';
            setTimeout(() => {
                insertBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                insertBtn.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.3)';
            }, 1500);
        }
    });

    insertBtn.style.display = newPairsInsertImageEnabled ? 'flex' : 'none';
    imageContainer.appendChild(insertBtn);
    return true;
}

function processGmgnTokens() {
    if (isProcessingGmgn) {
        return;
    }
    
    isProcessingGmgn = true;
    
    try {
        if (!tokenPageButtonAdded && window.location.pathname.includes('/token/')) {
            if (addGmgnTokenPageButton()) {
                tokenPageButtonAdded = true;
            }
        }
        
        const tokenContainers = document.querySelectorAll('div[href*="/token/"][class*="relative"][class*="w-full"]');
        
        let buttonsAdded = 0;
        
        tokenContainers.forEach(container => {
            if (processedGmgnContainers.has(container)) {
                return;
            }
            
            const hasImage = container.querySelector('img[alt="logo"], img[src*="gmgn.ai"], img[src*="external-res"], img[src*="four.meme"], img[src*="pump.fun"]');
            const hasTokenInfo = container.querySelector('.whitespace-nowrap.font-medium');
            const hasBuyButton = container.querySelector('.absolute.flex.right-14px') || container.querySelector('.absolute.flex.right-0') || container.querySelector('[data-sentry-component="BuyButtons"]');
            
            if (hasImage && hasTokenInfo && hasBuyButton) {
                const hasVampButton = container.querySelector('.gmgn-vamp-button');
                
                if (!hasVampButton) {
                    if (addGmgnVampButton(container)) {
                        buttonsAdded++;
                    }
                }
                
                if (newPairsInsertImageEnabled && !container.querySelector('.gmgn-card-img-btn')) {
                    addGmgnCardImageInsertButton(container);
                }
                
                processedGmgnContainers.add(container);
            }
        });
        
        // New pairs cards - different layout without href on div
        const newPairCards = document.querySelectorAll('div.p-\\[14px\\]');
        
        newPairCards.forEach(container => {
            if (processedGmgnContainers.has(container)) {
                return;
            }
            
            const hasImage = container.querySelector('img[alt="logo"], img[src*="four.meme"], img[src*="pump.fun"], img[src*="gmgn.ai"], img[src*="external-res"]');
            const hasTokenInfo = container.querySelector('.whitespace-nowrap.font-medium');
            const hasTokenLink = container.querySelector('a[href*="/token/"]');
            
            if (hasImage && hasTokenInfo && hasTokenLink) {
                const hasVampButton = container.querySelector('.gmgn-vamp-button');
                
                if (!hasVampButton) {
                    if (addGmgnVampButton(container)) {
                        buttonsAdded++;
                    }
                }
                
                if (newPairsInsertImageEnabled && !container.querySelector('.gmgn-card-img-btn')) {
                    addGmgnCardImageInsertButton(container);
                }
                
                processedGmgnContainers.add(container);
            }
        });
        
    } catch (error) {
    } finally {
        isProcessingGmgn = false;
    }
}

function isGmgnPage() {
    return window.location.hostname.includes('gmgn.ai');
}

async function initGmgn() {
    if (!isGmgnPage()) {
        return;
    }
    
    await loadVampButtonsSetting();
    await loadNewPairsVampButtonsSetting();
    await loadVampButtonColor();
    await loadVampButtonStyle();
    await loadSmallVampButtonSize();
    await loadSmallVampButtonPosition();
    await loadInsertImageButtonSetting();
    await loadNewPairsInsertImageSetting();
    
    // Inject CSS to prevent parent containers from clipping VAMP buttons
    const style = document.createElement('style');
    style.textContent = `
        .gmgn-vamp-button {
            overflow: visible !important;
        }
        div:has(> .gmgn-vamp-button),
        div:has(> div > .gmgn-vamp-button),
        div:has(> div > div > .gmgn-vamp-button),
        [class*="overflow-hidden"]:has(.gmgn-vamp-button) {
            overflow: visible !important;
        }
        .search-buy-button-container {
            display: flex !important;
            align-items: center !important;
            gap: 4px !important;
        }
        .gmgn-card-img-btn {
            overflow: visible !important;
        }
    `;
    document.head.appendChild(style);
    
    // Listen for settings reload
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === 'reloadVampButtons') {
            loadVampButtonsSetting().then(() => {
                document.querySelectorAll('.gmgn-search-vamp-button, .gmgn-vamp-token-page-button').forEach(btn => {
                    btn.style.display = vampButtonsEnabled ? 'inline-flex' : 'none';
                });
                sendResponse({ success: true });
            });
            return true;
        }
        
        if (request.type === 'reloadNewPairsVampButtons') {
            loadNewPairsVampButtonsSetting().then(() => {
                document.querySelectorAll('.gmgn-vamp-button').forEach(btn => {
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
                });
                sendResponse({ success: true });
            });
            return true; // Keep message channel open for async response
        }
        
        if (request.type === 'reloadSmallVampButtonSize') {
            loadSmallVampButtonSize().then(() => {
                // Update all existing small VAMP buttons with new size
                document.querySelectorAll('.gmgn-vamp-button').forEach(btn => {
                    applySmallVampButtonSize(btn);
                });
                sendResponse({ success: true });
            });
            return true;
        }
        
        if (request.type === 'reloadSmallVampButtonPosition') {
            loadSmallVampButtonPosition().then(() => {
                document.querySelectorAll('.gmgn-vamp-button').forEach(btn => {
                    btn.remove();
                });
                processGmgnTokens();
                sendResponse({ success: true });
            });
            return true;
        }
        
        if (request.type === 'reloadInsertImageButton') {
            loadInsertImageButtonSetting().then(() => {
                document.querySelectorAll('.gmgn-search-insert-img-btn').forEach(btn => {
                    btn.style.display = insertImageButtonEnabled ? 'flex' : 'none';
                });
                if (insertImageButtonEnabled) {
                    processGmgnSearchResults();
                }
                sendResponse({ success: true });
            });
            return true;
        }
        
        if (request.type === 'reloadNewPairsInsertImage') {
            loadNewPairsInsertImageSetting().then(() => {
                document.querySelectorAll('.gmgn-card-img-btn').forEach(btn => {
                    btn.style.display = newPairsInsertImageEnabled ? 'flex' : 'none';
                });
                if (newPairsInsertImageEnabled) {
                    // Add buttons to already-processed containers that don't have one yet
                    document.querySelectorAll('div[href*="/token/"][class*="relative"][class*="w-full"], div.p-\\[14px\\]').forEach(container => {
                        if (!container.querySelector('.gmgn-card-img-btn')) {
                            addGmgnCardImageInsertButton(container);
                        }
                    });
                }
                sendResponse({ success: true });
            });
            return true;
        }
    });
    
    setTimeout(() => { processGmgnTokens(); processGmgnSearchResults(); }, 1000);
    
    const observer = new MutationObserver(() => {
        setTimeout(() => { processGmgnTokens(); processGmgnSearchResults(); }, 100);
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    setInterval(() => { processGmgnTokens(); processGmgnSearchResults(); }, 3000);
    
    let currentUrl = window.location.href;
    setInterval(() => {
        if (window.location.href !== currentUrl) {
            currentUrl = window.location.href;
            tokenPageButtonAdded = false;
            if (isGmgnPage()) {
                setTimeout(() => { processGmgnTokens(); processGmgnSearchResults(); }, 500);
            }
        }
    }, 1000);
    
    let scrollTimeout = null;
    window.addEventListener('scroll', () => {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (isGmgnPage()) {
                processGmgnTokens();
                processGmgnSearchResults();
            }
        }, 200);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGmgn);
} else {
    initGmgn();
}

window.addEventListener('load', () => {
    if (isGmgnPage()) {
        setTimeout(() => { processGmgnTokens(); processGmgnSearchResults(); }, 100);
    }
});

})();
