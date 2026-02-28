(function() {
    'use strict';
    
    // Uses VAMP_CONFIG from vamp-config.js (loaded first)
    
    // Deploy button setting
    let twitterDeployButtonsEnabled = true;
    
    // Load setting
    async function loadTwitterDeployButtonsSetting() {
        try {
            const result = await chrome.storage.local.get(['twitterDeployButtonsEnabled']);
            twitterDeployButtonsEnabled = result.twitterDeployButtonsEnabled !== undefined ? result.twitterDeployButtonsEnabled : true;
        } catch (error) {
            twitterDeployButtonsEnabled = true;
        }
    }
    
    // Extract tweet info from tweet article element
    function extractTweetInfo(tweetArticle) {
        try {
            // Get tweet URL from the timestamp link
            const timeLink = tweetArticle.querySelector('a[href*="/status/"] time')?.closest('a');
            const tweetUrl = timeLink ? 'https://x.com' + timeLink.getAttribute('href') : null;
            
            // Get author handle
            const handleElement = tweetArticle.querySelector('a[href^="/"][role="link"] span[class*="r-poiln3"]');
            let authorHandle = '';
            if (handleElement) {
                const text = handleElement.textContent;
                if (text.startsWith('@')) {
                    authorHandle = text.substring(1);
                }
            }
            
            // Fallback: get handle from href
            if (!authorHandle) {
                const profileLink = tweetArticle.querySelector('a[href^="/"][role="link"]:not([href*="/status/"])');
                if (profileLink) {
                    const href = profileLink.getAttribute('href');
                    if (href && href.startsWith('/') && !href.includes('/')) {
                        authorHandle = href.substring(1);
                    }
                }
            }
            
            // Get tweet text
            const tweetTextElement = tweetArticle.querySelector('[data-testid="tweetText"]');
            const tweetText = tweetTextElement ? tweetTextElement.textContent : '';
            
            // Get first image if any
            let imageUrl = '';
            
            // Try regular image first
            const imageElement = tweetArticle.querySelector('[data-testid="tweetPhoto"] img');
            if (imageElement) {
                imageUrl = imageElement.src;
                // Get higher quality version
                if (imageUrl.includes('name=')) {
                    imageUrl = imageUrl.replace(/name=\w+/, 'name=large');
                }
            }
            
            // If no image, try video thumbnail (poster attribute)
            if (!imageUrl) {
                const videoElement = tweetArticle.querySelector('[data-testid="videoPlayer"] video');
                if (videoElement && videoElement.poster) {
                    imageUrl = videoElement.poster;
                }
            }
            
            // Get author name
            const nameElement = tweetArticle.querySelector('[data-testid="User-Name"] span span');
            const authorName = nameElement ? nameElement.textContent : authorHandle;
            
            return {
                tweetUrl,
                authorHandle,
                authorName,
                tweetText,
                imageUrl
            };
        } catch (error) {
            console.error('[J7 Twitter] Error extracting tweet info:', error);
            return null;
        }
    }
    
    // Create deploy button
    function createDeployButton(tweetArticle) {
        const button = document.createElement('button');
        button.className = 'j7-twitter-deploy-btn';
        button.setAttribute('data-j7-deploy', 'true');
        button.title = 'Deploy Token (J7Tracker)';
        
        // Rocket icon
        button.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
                <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
            </svg>
        `;
        
        button.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            border: none;
            background: rgba(29, 155, 240, 0.1);
            color: rgb(29, 155, 240);
            cursor: pointer;
            transition: all 0.2s ease;
            margin-left: 4px;
        `;
        
        // Hover effect
        button.addEventListener('mouseenter', () => {
            button.style.background = 'rgba(29, 155, 240, 0.2)';
            button.style.transform = 'scale(1.1)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.background = 'rgba(29, 155, 240, 0.1)';
            button.style.transform = 'scale(1)';
        });
        
        // Click handler
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            button.disabled = true;
            button.style.opacity = '0.5';
            
            const tweetInfo = extractTweetInfo(tweetArticle);
            
            if (!tweetInfo) {
                console.error('[J7 Twitter] Could not extract tweet info');
                button.style.opacity = '1';
                button.disabled = false;
                return;
            }
            
            console.log('[J7 Twitter] Opening deploy GUI with:', tweetInfo);
            
            try {
                // Extract potential token name from tweet text
                let suggestedName = 'New Token';
                if (tweetInfo.tweetText) {
                    const cleanText = tweetInfo.tweetText
                        .replace(/@\w+/g, '')
                        .replace(/https?:\/\/\S+/g, '')
                        .replace(/[^\w\s]/g, '')
                        .trim();
                    if (cleanText.length > 0) {
                        const words = cleanText.split(/\s+/).slice(0, 3).join(' ');
                        if (words.length > 0 && words.length <= 30) {
                            suggestedName = words;
                        }
                    }
                }
                
                // Send VAMP request to open the deploy GUI
                // Use correct field names that server expects
                const result = await vampCopy({
                    token_name: suggestedName,
                    ticker: '',
                    image_url: tweetInfo.imageUrl || '',
                    twitter: tweetInfo.tweetUrl || '',
                    website: '',
                    description: tweetInfo.tweetText || '',
                    site_url: tweetInfo.tweetUrl || window.location.href
                });
                
                if (result.success) {
                    // Success feedback
                    button.style.color = 'rgb(0, 186, 124)';
                    button.style.background = 'rgba(0, 186, 124, 0.1)';
                    setTimeout(() => {
                        button.style.color = 'rgb(29, 155, 240)';
                        button.style.background = 'rgba(29, 155, 240, 0.1)';
                    }, 1500);
                } else {
                    // Error feedback
                    button.style.color = 'rgb(244, 33, 46)';
                    button.style.background = 'rgba(244, 33, 46, 0.1)';
                    setTimeout(() => {
                        button.style.color = 'rgb(29, 155, 240)';
                        button.style.background = 'rgba(29, 155, 240, 0.1)';
                    }, 1500);
                }
            } catch (error) {
                console.error('[J7 Twitter] Error sending VAMP request:', error);
                button.style.color = 'rgb(244, 33, 46)';
                setTimeout(() => {
                    button.style.color = 'rgb(29, 155, 240)';
                }, 1500);
            }
            
            setTimeout(() => {
                button.disabled = false;
                button.style.opacity = '1';
            }, 500);
        });
        
        return button;
    }
    
    // Add deploy buttons to tweets
    function processTweets() {
        if (!twitterDeployButtonsEnabled) return;
        
        const tweets = document.querySelectorAll('article[data-testid="tweet"]');
        
        tweets.forEach(tweet => {
            // Skip if already processed
            if (tweet.querySelector('.j7-twitter-deploy-btn')) return;
            
            // Find the action bar (reply, retweet, like, etc.)
            const actionBar = tweet.querySelector('[role="group"]');
            if (!actionBar) return;
            
            // Find the share button container (last button in the action bar)
            const shareContainer = actionBar.querySelector('div[style*="inline-grid"]');
            if (!shareContainer) return;
            
            // Create and insert deploy button before share
            const deployButton = createDeployButton(tweet);
            
            // Create a container for our button
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'css-175oi2r r-18u37iz r-1h0z5md';
            buttonContainer.appendChild(deployButton);
            
            // Insert before share button
            shareContainer.parentNode.insertBefore(buttonContainer, shareContainer);
        });
    }
    
    // Initialize
    async function init() {
        await loadTwitterDeployButtonsSetting();
        
        // Process existing tweets
        processTweets();
        
        // Watch for new tweets
        const observer = new MutationObserver(() => {
            processTweets();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Listen for setting changes
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.type === 'reloadTwitterDeployButtons') {
                loadTwitterDeployButtonsSetting().then(() => {
                    document.querySelectorAll('.j7-twitter-deploy-btn').forEach(btn => {
                        btn.style.display = twitterDeployButtonsEnabled ? 'flex' : 'none';
                    });
                    sendResponse({ success: true });
                });
                return true;
            }
        });
    }
    
    // Run when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

