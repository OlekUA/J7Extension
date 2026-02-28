// Centralized VAMP configuration - all VAMP files use this
const VAMP_CONFIG = {
    ENDPOINTS: {
        VAMP: '/api/vamp',
        VAMP_UPDATE: '/api/vamp-update',
        VAMP_CA: '/api/vamp/ca',
        VAMP_FETCH: '/api/vamp-fetch'
    },
    
    // Get base URL from selected site
    async getBaseUrl() {
        try {
            const result = await chrome.storage.local.get(['selectedSite']);
            const site = result.selectedSite || 'j7tracker.io';
            return `https://${site}`;
        } catch (e) {
            return 'https://j7tracker.com';
        }
    },
    
    // Get full URL for an endpoint
    async getUrl(endpoint) {
        const baseUrl = await this.getBaseUrl();
        return baseUrl + this.ENDPOINTS[endpoint];
    }
};

// Shared VAMP username - loaded from storage
let _vampUsername = '';

// Load username from storage
async function loadVampUsername() {
    try {
        const result = await chrome.storage.local.get(['vampUsername']);
        _vampUsername = result.vampUsername || '';
        return _vampUsername;
    } catch (e) {
        _vampUsername = '';
        return '';
    }
}

// Get current username
function getVampUsername() {
    return _vampUsername;
}

// Centralized VAMP request function
async function makeVampRequest(endpoint, data = {}) {
    try {
        // Always get fresh username
        await loadVampUsername();
        
        // Add username to request if available
        const requestData = { ...data };
        if (_vampUsername) {
            requestData.username = _vampUsername;
        }
        
        // Get URL with fresh site selection
        const url = await VAMP_CONFIG.getUrl(endpoint);
        console.log(`[VAMP] Request to ${endpoint} (${url}):`, requestData);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });
        
        const result = await response.json();
        console.log(`[VAMP] Response from ${endpoint}:`, result);
        return result;
    } catch (error) {
        console.error(`[VAMP] Error in ${endpoint}:`, error);
        return { success: false, error: error.message };
    }
}

// Get deploy URL (used by content.js and google.js)
async function getDeployUrl() {
    const baseUrl = await VAMP_CONFIG.getBaseUrl();
    return `${baseUrl}/external/deploy`;
}

// Convenience methods
async function vampCopy(tokenData) {
    return makeVampRequest('VAMP', tokenData);
}

async function vampUpdate(updateData) {
    return makeVampRequest('VAMP_UPDATE', updateData);
}

async function vampCA(contractAddress) {
    return makeVampRequest('VAMP_CA', { contractAddress });
}

async function vampFetch(contractAddress) {
    return makeVampRequest('VAMP_FETCH', { contractAddress });
}

// Initialize - load username on script load
loadVampUsername();

