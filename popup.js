// J7 Image Extension - Popup Script
// Default keybinds
const DEFAULT_KEYBINDS = [
    { ctrl: true, shift: false, alt: false, key: 'c', isDefault: true, enabled: true },
    { ctrl: false, shift: false, alt: false, key: 'doubleclick', isDefault: true, enabled: true }
];
// Helper function to format timestamps consistently
function formatTimestamp() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}
async function loadKeybinds() {
    try {
        const result = await chrome.storage.local.get(['keybinds']);
        if (!result.keybinds || result.keybinds.length === 0) {
            // Initialize with defaults
            await chrome.storage.local.set({ keybinds: DEFAULT_KEYBINDS });
            return DEFAULT_KEYBINDS;
        }
        // Filter out removed default keybinds and ensure enabled property
        const keybinds = result.keybinds
            .filter(kb => !(kb.isDefault && kb.key === 'x' && kb.ctrl))
            .map(kb => ({
                ...kb,
                enabled: kb.enabled !== undefined ? kb.enabled : true
            }));
        if (keybinds.length !== result.keybinds.length) {
            await chrome.storage.local.set({ keybinds: keybinds });
        }
        return keybinds;
    } catch (error) {
        return DEFAULT_KEYBINDS;
    }
}
async function saveKeybinds(keybinds) {
    try {
        await chrome.storage.local.set({ keybinds: keybinds });
        // Notify all tabs to reload keybinds
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { type: 'reloadKeybinds' }).catch(() => {});
            });
        });
    } catch (error) {
    }
}
function formatKeybind(keybind) {
    if (keybind.key === 'doubleclick') {
        return 'Double Click';
    }
    let parts = [];
    if (keybind.ctrl) parts.push('Ctrl');
    if (keybind.shift) parts.push('Shift');
    if (keybind.alt) parts.push('Alt');
    parts.push(keybind.key.toUpperCase());
    return parts.join('+');
}
async function displayKeybinds() {
    const keybinds = await loadKeybinds();
    const keybindsList = document.getElementById('keybindsList');
    if (keybinds.length === 0) {
        keybindsList.innerHTML = '<div style="font-size: 11px; color: #999; text-align: center; padding: 10px;">No keybinds configured</div>';
        return;
    }
    keybindsList.innerHTML = keybinds.map((keybind, index) => `
        <div class="keybind-item" style="${!keybind.enabled ? 'opacity: 0.5;' : ''}">
            <div class="keybind-label">
                <span class="keybind-badge">${formatKeybind(keybind)}</span>
                ${keybind.isDefault ? '<span class="keybind-default">DEFAULT</span>' : ''}
                ${!keybind.enabled ? '<span style="font-size: 10px; color: #999; margin-left: 6px;">(Disabled)</span>' : ''}
            </div>
            <div style="display: flex; gap: 6px;">
                ${keybind.isDefault ? 
                    `<button class="button toggle" data-index="${index}">${keybind.enabled ? 'Disable' : 'Enable'}</button>` : 
                    `<button class="button remove" data-index="${index}">Remove</button>`
                }
            </div>
        </div>
    `).join('');
    // Add event listeners to buttons
    document.querySelectorAll('.button.remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.getAttribute('data-index'));
            removeKeybind(index);
        });
    });
    document.querySelectorAll('.button.toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.getAttribute('data-index'));
            toggleKeybind(index);
        });
    });
}
let isRecording = false;
let recordingCleanup = null;
async function addNewKeybind() {
    // Prevent multiple recordings
    if (isRecording) return;
    const recordButton = document.getElementById('recordKeybind');
    const statusDiv = document.getElementById('recordingStatus');
    isRecording = true;
    // Start recording
    recordButton.classList.add('recording');
    recordButton.textContent = 'Press any key combination...';
    recordButton.disabled = true;
    statusDiv.textContent = 'Recording... (Press Escape to cancel)';
    statusDiv.style.color = '#dc2626';
    let keyProcessed = false;
    // Listen for keydown
    const handleKeyDown = async (event) => {
        // Only process one key
        if (keyProcessed) return;
        // Allow Escape to cancel
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            cleanup();
            return;
        }
        // Ignore modifier-only presses
        const key = event.key.toLowerCase();
        if (['control', 'shift', 'alt', 'meta'].includes(key)) {
            return;
        }
        // Mark as processed immediately to prevent double-adds
        keyProcessed = true;
        event.preventDefault();
        event.stopPropagation();
        const ctrlKey = event.ctrlKey || event.metaKey;
        const shiftKey = event.shiftKey;
        const altKey = event.altKey;
        // Only accept single letters/numbers
        if (key.length !== 1 || !/^[a-z0-9]$/i.test(key)) {
            statusDiv.textContent = 'Invalid key! Please use a letter or number.';
            statusDiv.style.color = '#dc2626';
            setTimeout(() => {
                cleanup();
            }, 1500);
            return;
        }
        const keybinds = await loadKeybinds();
        // Check if keybind already exists
        const exists = keybinds.some(kb => 
            kb.ctrl === ctrlKey && 
            kb.shift === shiftKey && 
            kb.alt === altKey && 
            kb.key.toLowerCase() === key
        );
        if (exists) {
            statusDiv.textContent = 'This keybind already exists!';
            statusDiv.style.color = '#dc2626';
            setTimeout(() => {
                cleanup();
            }, 1500);
            return;
        }
        // Add new keybind
        const newKeybind = {
            ctrl: ctrlKey,
            shift: shiftKey,
            alt: altKey,
            key: key,
            isDefault: false,
            enabled: true
        };
        keybinds.push(newKeybind);
        await saveKeybinds(keybinds);
        // Show success
        statusDiv.textContent = `Added: ${formatKeybind(newKeybind)}`;
        statusDiv.style.color = '#2e7d32';
        // Refresh display
        await displayKeybinds();
        // Cleanup after short delay
        setTimeout(() => {
            cleanup();
        }, 1000);
    };
    const cleanup = () => {
        if (!isRecording) return;
        document.removeEventListener('keydown', handleKeyDown, true);
        recordButton.classList.remove('recording');
        recordButton.textContent = 'Record New Keybind';
        recordButton.disabled = false;
        statusDiv.textContent = '';
        isRecording = false;
        recordingCleanup = null;
    };
    recordingCleanup = cleanup;
    // Add listener with a delay to avoid capturing any keyboard events from clicking the button
        setTimeout(() => {
        if (isRecording) {
            document.addEventListener('keydown', handleKeyDown, true);
        }
    }, 200);
}
async function removeKeybind(index) {
    const keybinds = await loadKeybinds();
    if (keybinds[index].isDefault) {
        alert('Cannot remove default keybinds! Use Disable instead.');
        return;
    }
    const removed = keybinds.splice(index, 1)[0];
    await saveKeybinds(keybinds);
    await displayKeybinds();
}
async function toggleKeybind(index) {
    const keybinds = await loadKeybinds();
    if (!keybinds[index]) return;
    keybinds[index].enabled = !keybinds[index].enabled;
    await saveKeybinds(keybinds);
    await displayKeybinds();
}
// Load deploy buttons setting
async function loadDeployButtonsSetting() {
    try {
        const result = await chrome.storage.local.get(['deployButtonsEnabled']);
        // Default to false (disabled) if not set
        return result.deployButtonsEnabled !== undefined ? result.deployButtonsEnabled : false;
    } catch (error) {
        return true;
    }
}
// Save deploy buttons setting
async function saveDeployButtonsSetting(enabled) {
    try {
        await chrome.storage.local.set({ deployButtonsEnabled: enabled });
        // Notify all tabs to reload the setting
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { type: 'reloadDeployButtons' }).catch(() => {});
            });
        });
    } catch (error) {
    }
}
// Load VAMP buttons setting
async function loadVampButtonsSetting() {
    try {
        const result = await chrome.storage.local.get(['vampButtonsEnabled']);
        // Default to true (enabled) if not set
        return result.vampButtonsEnabled !== undefined ? result.vampButtonsEnabled : true;
    } catch (error) {
        return true;
    }
}
// Save VAMP buttons setting
async function saveVampButtonsSetting(enabled) {
    try {
        await chrome.storage.local.set({ vampButtonsEnabled: enabled });
        // Notify all tabs to reload the setting
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { type: 'reloadVampButtons' }).catch(() => {});
            });
        });
    } catch (error) {
    }
}

async function loadNewPairsVampButtonsSetting() {
    try {
        const result = await chrome.storage.local.get(['newPairsVampButtonsEnabled']);
        return result.newPairsVampButtonsEnabled !== undefined ? result.newPairsVampButtonsEnabled : true;
    } catch (error) {
        return true;
    }
}

async function saveNewPairsVampButtonsSetting(enabled) {
    try {
        await chrome.storage.local.set({ newPairsVampButtonsEnabled: enabled });
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { type: 'reloadNewPairsVampButtons' }).catch(() => {});
            });
        });
    } catch (error) {
    }
}

// Load VAMP Fetch Mode setting
async function loadVampFetchModeSetting() {
    try {
        const result = await chrome.storage.local.get(['vampFetchModeEnabled']);
        return result.vampFetchModeEnabled !== undefined ? result.vampFetchModeEnabled : true;
    } catch (error) {
        return true;
    }
}

// Save VAMP Fetch Mode setting
async function saveVampFetchModeSetting(enabled) {
    try {
        await chrome.storage.local.set({ vampFetchModeEnabled: enabled });
        // Notify all tabs to reload the setting
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { type: 'reloadVampFetchMode' }).catch(() => {});
            });
        });
    } catch (error) {
    }
}

// Load VAMP Username setting
async function loadVampUsername() {
    try {
        const result = await chrome.storage.local.get(['vampUsername']);
        return result.vampUsername || '';
    } catch (error) {
        return '';
    }
}

// Save VAMP Username setting
async function saveVampUsername(username) {
    try {
        await chrome.storage.local.set({ vampUsername: username });
        // Notify all tabs to reload the setting
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { type: 'reloadVampUsername' }).catch(() => {});
            });
        });
    } catch (error) {
    }
}
// Load Insert Image button setting
async function loadInsertImageButtonSetting() {
    try {
        const result = await chrome.storage.local.get(['insertImageButtonEnabled']);
        // Default to true (enabled) if not set
        return result.insertImageButtonEnabled !== undefined ? result.insertImageButtonEnabled : true;
    } catch (error) {
        return true;
    }
}
// Save Insert Image button setting (controls ALL insert image buttons on all sites)
async function saveInsertImageButtonSetting(enabled) {
    try {
        await chrome.storage.local.set({ insertImageButtonEnabled: enabled });
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { type: 'reloadInsertImageButton' }).catch(() => {});
            });
        });
    } catch (error) {
    }
}

async function loadNewPairsInsertImageSetting() {
    try {
        const result = await chrome.storage.local.get(['newPairsInsertImageEnabled']);
        return result.newPairsInsertImageEnabled !== undefined ? result.newPairsInsertImageEnabled : true;
    } catch (error) {
        return true;
    }
}

async function saveNewPairsInsertImageSetting(enabled) {
    try {
        await chrome.storage.local.set({ newPairsInsertImageEnabled: enabled });
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { type: 'reloadNewPairsInsertImage' }).catch(() => {});
            });
        });
    } catch (error) {
    }
}

// Load Auto-search setting
async function loadAutoSearchSetting() {
    try {
        const result = await chrome.storage.local.get(['autoSearchEnabled']);
        return result.autoSearchEnabled !== undefined ? result.autoSearchEnabled : true;
    } catch (error) {
        return true;
    }
}

// Save Auto-search setting
async function saveAutoSearchSetting(enabled) {
    try {
        await chrome.storage.local.set({ autoSearchEnabled: enabled });
    } catch (error) {
    }
}

// Load Auto-search Google setting
async function loadAutoSearchGoogleSetting() {
    try {
        const result = await chrome.storage.local.get(['autoSearchGoogle']);
        return result.autoSearchGoogle !== undefined ? result.autoSearchGoogle : false;
    } catch (error) {
        return false;
    }
}

// Save Auto-search Google setting
async function saveAutoSearchGoogleSetting(enabled) {
    try {
        await chrome.storage.local.set({ autoSearchGoogle: enabled });
    } catch (error) {
    }
}

async function loadTokenFilterSearchSetting() {
    try {
        const result = await chrome.storage.local.get(['tokenFilterSearchEnabled']);
        return result.tokenFilterSearchEnabled !== undefined ? result.tokenFilterSearchEnabled : false;
    } catch (error) {
        return false;
    }
}

async function saveTokenFilterSearchSetting(enabled) {
    try {
        await chrome.storage.local.set({ tokenFilterSearchEnabled: enabled });
    } catch (error) {
    }
}

// Load Auto-search platform setting
async function loadAutoSearchPlatform() {
    try {
        const result = await chrome.storage.local.get(['autoSearchPlatform']);
        return result.autoSearchPlatform || 'axiom';
    } catch (error) {
        return 'axiom';
    }
}

// Save Auto-search platform setting
async function saveAutoSearchPlatform(platform) {
    try {
        await chrome.storage.local.set({ autoSearchPlatform: platform });
    } catch (error) {
    }
}

// Load Twitter Deploy button setting
async function loadTwitterDeployButtonsSetting() {
    try {
        const result = await chrome.storage.local.get(['twitterDeployButtonsEnabled']);
        return result.twitterDeployButtonsEnabled !== undefined ? result.twitterDeployButtonsEnabled : true;
    } catch (error) {
        return true;
    }
}

// Save Twitter Deploy button setting
async function saveTwitterDeployButtonsSetting(enabled) {
    try {
        await chrome.storage.local.set({ twitterDeployButtonsEnabled: enabled });
        // Notify Twitter tabs to reload the setting
        chrome.tabs.query({ url: ['*://x.com/*', '*://twitter.com/*'] }, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { type: 'reloadTwitterDeployButtons' }).catch(() => {});
            });
        });
    } catch (error) {
    }
}

// Load selected site setting
async function loadSelectedSite() {
    try {
        const result = await chrome.storage.local.get(['selectedSite']);
        return result.selectedSite || 'j7tracker.io'; // Default to .io
    } catch (error) {
        return 'j7tracker.com';
    }
}

// Save selected site setting
async function saveSelectedSite(site) {
    try {
        await chrome.storage.local.set({ selectedSite: site });
        // Notify all tabs to reload the setting
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { type: 'reloadSelectedSite' }).catch(() => {});
            });
        });
    } catch (error) {
    }
}

// Load VAMP button color setting
async function loadVampButtonColor() {
    try {
        const result = await chrome.storage.local.get(['vampButtonColor']);
        return result.vampButtonColor || '#ef4444'; // Default red
    } catch (error) {
        return '#ef4444';
    }
}

// Save VAMP button color setting
async function saveVampButtonColor(color) {
    try {
        await chrome.storage.local.set({ vampButtonColor: color });
        // Notify all tabs to reload the setting
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { type: 'reloadVampButtonColor' }).catch(() => {});
            });
        });
    } catch (error) {
    }
}

// Generate gradient from base color
function generateVampGradient(baseColor) {
    // Convert hex to RGB
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Create darker variants
    const darken = (value, amount) => Math.max(0, Math.floor(value * (1 - amount)));
    
    const color1 = baseColor;
    const color2 = `rgb(${darken(r, 0.1)}, ${darken(g, 0.1)}, ${darken(b, 0.1)})`;
    const color3 = `rgb(${darken(r, 0.25)}, ${darken(g, 0.25)}, ${darken(b, 0.25)})`;
    
    return `linear-gradient(135deg, ${color1}, ${color2}, ${color3})`;
}

// Load VAMP button style setting
async function loadVampButtonStyle() {
    try {
        const result = await chrome.storage.local.get(['vampButtonStyle']);
        return result.vampButtonStyle || 'translucent'; // Default translucent
    } catch (error) {
        return 'translucent';
    }
}

// Save VAMP button style setting
async function saveVampButtonStyle(style) {
    try {
        await chrome.storage.local.set({ vampButtonStyle: style });
        // Notify all tabs to reload the setting
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { type: 'reloadVampButtonStyle' }).catch(() => {});
            });
        });
    } catch (error) {
    }
}

// Load small VAMP button size setting
async function loadSmallVampButtonSize() {
    try {
        const result = await chrome.storage.local.get(['smallVampButtonSize']);
        return result.smallVampButtonSize || 1.0; // Default 1.0x
    } catch (error) {
        return 1.0;
    }
}

// Save small VAMP button size setting
async function saveSmallVampButtonSize(size) {
    try {
        await chrome.storage.local.set({ smallVampButtonSize: size });
        // Notify all tabs to reload the setting
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { type: 'reloadSmallVampButtonSize' }).catch(() => {});
            });
        });
    } catch (error) {
    }
}

// Load small VAMP button position setting
async function loadSmallVampButtonPosition() {
    try {
        const result = await chrome.storage.local.get(['smallVampButtonPosition']);
        return result.smallVampButtonPosition || 'before'; // Default: before name
    } catch (error) {
        return 'before';
    }
}

// Save small VAMP button position setting
async function saveSmallVampButtonPosition(position) {
    try {
        await chrome.storage.local.set({ smallVampButtonPosition: position });
        // Notify all tabs to reload the setting
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { type: 'reloadSmallVampButtonPosition' }).catch(() => {});
            });
        });
    } catch (error) {
    }
}

// Current style for preview
let currentVampStyle = 'fill';

// Generate translucent background from base color
function generateTranslucentBg(baseColor, opacity = 0.1) {
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Update preview button with color and style
function updateVampPreview(color, style) {
    if (style) currentVampStyle = style;
    
    const previewBtn = document.getElementById('vampPreviewBtn');
    const customPreview = document.getElementById('customColorPreview');
    const customInput = document.getElementById('customColorInput');
    
    if (previewBtn) {
        if (currentVampStyle === 'fill') {
            previewBtn.style.background = generateVampGradient(color);
            previewBtn.style.color = 'white';
            previewBtn.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        } else {
            previewBtn.style.background = generateTranslucentBg(color, 0.1);
            previewBtn.style.color = color;
            previewBtn.style.border = `1px solid ${generateTranslucentBg(color, 0.3)}`;
        }
    }
    if (customPreview) {
        customPreview.style.background = color;
    }
    if (customInput && customInput.value !== color) {
        customInput.value = color;
    }
    
    // Update selected state on color buttons
    document.querySelectorAll('.color-btn').forEach(btn => {
        if (btn.dataset.color === color) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
    
    // Update style toggle buttons
    document.querySelectorAll('.style-btn').forEach(btn => {
        if (btn.dataset.style === currentVampStyle) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}
// Validate API key format
function validateApiKey(apiKey) {
    if (!apiKey || apiKey.trim().length === 0) {
        return { valid: false, error: 'API key cannot be empty' };
    }
    const trimmedKey = apiKey.trim();
    // Check if it looks like a raw Solana private key (base58, typically 87-88 chars)
    if (/^[1-9A-HJ-NP-Za-km-z]{80,90}$/.test(trimmedKey)) {
        return { 
            valid: false, 
            error: 'Raw private keys not accepted. Please import your wallet first to get an encrypted API key.' 
        };
    }
    // Check if it looks like a hex private key (64 hex chars, with or without 0x prefix)
    if (/^(0x)?[a-fA-F0-9]{64}$/.test(trimmedKey)) {
        return { 
            valid: false, 
            error: 'Raw private keys not accepted. Please import your wallet first to get an encrypted API key.' 
        };
    }
    // Encrypted keys should be base64 and much longer (like your examples)
    if (trimmedKey.length < 100 || !/^[A-Za-z0-9+/]+=*$/.test(trimmedKey)) {
        return { 
            valid: false, 
            error: 'Invalid API key format. Must be an encrypted API key obtained from wallet import.' 
        };
    }
    return { valid: true };
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
        return {
            apiKey: result.deployApiKey || '',
            buyAmount: result.deployBuyAmount || 5,
            bnbApiKey: result.bnbApiKey || '',
            bnbBuyAmount: result.bnbBuyAmount || 1.5,
            cashbackMode: result.cashbackMode || false,
            bonkersMode: result.bonkersMode || false
        };
    } catch (error) {
        return { 
            apiKey: '', 
            buyAmount: 5,
            bnbApiKey: '',
            bnbBuyAmount: 1.5,
            cashbackMode: false,
            bonkersMode: false
        };
    }
}
// Save deploy settings (API key and buy amount)
async function saveDeploySettings(apiKey, buyAmount, bnbApiKey, bnbBuyAmount, cashbackMode, bonkersMode) {
    try {
        await chrome.storage.local.set({ 
            deployApiKey: apiKey,
            deployBuyAmount: buyAmount,
            bnbApiKey: bnbApiKey,
            bnbBuyAmount: bnbBuyAmount,
            cashbackMode: cashbackMode,
            bonkersMode: bonkersMode
        });
        // Notify all tabs to reload settings
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, { type: 'reloadDeploySettings' }).catch(() => {});
            });
        });
        return true;
    } catch (error) {
        return false;
    }
}
// Initialize popup
document.addEventListener('DOMContentLoaded', async function() {
    const recordButton = document.getElementById('recordKeybind');
    recordButton.addEventListener('click', addNewKeybind);
    // Display keybinds
    displayKeybinds();
    
    // Load and set selected site
    const selectedSite = await loadSelectedSite();
    const siteComBtn = document.getElementById('siteComBtn');
    const siteIoBtn = document.getElementById('siteIoBtn');
    
    // Update button states based on loaded setting
    if (selectedSite === 'j7tracker.io') {
        siteIoBtn.classList.add('active');
        siteComBtn.classList.remove('active');
    } else {
        siteComBtn.classList.add('active');
        siteIoBtn.classList.remove('active');
    }
    
    // Add event listeners for site selector buttons
    siteComBtn.addEventListener('click', async () => {
        siteComBtn.classList.add('active');
        siteIoBtn.classList.remove('active');
        await saveSelectedSite('j7tracker.com');
    });
    
    siteIoBtn.addEventListener('click', async () => {
        siteIoBtn.classList.add('active');
        siteComBtn.classList.remove('active');
        await saveSelectedSite('j7tracker.io');
    });
    
    // Load and set deploy buttons toggle
    const deployButtonsToggle = document.getElementById('deployButtonsToggle');
    const deployButtonsEnabled = await loadDeployButtonsSetting();
    deployButtonsToggle.checked = deployButtonsEnabled;
    // Add event listener for deploy buttons toggle
    deployButtonsToggle.addEventListener('change', async (e) => {
        await saveDeployButtonsSetting(e.target.checked);
    });
    // Load and set VAMP buttons toggle
    const vampButtonsToggle = document.getElementById('vampButtonsToggle');
    const vampButtonsEnabled = await loadVampButtonsSetting();
    vampButtonsToggle.checked = vampButtonsEnabled;
    // Add event listener for VAMP buttons toggle
    vampButtonsToggle.addEventListener('change', async (e) => {
        await saveVampButtonsSetting(e.target.checked);
    });

    const newPairsVampButtonsToggle = document.getElementById('newPairsVampButtonsToggle');
    const newPairsVampButtonsEnabled = await loadNewPairsVampButtonsSetting();
    newPairsVampButtonsToggle.checked = newPairsVampButtonsEnabled;
    newPairsVampButtonsToggle.addEventListener('change', async (e) => {
        await saveNewPairsVampButtonsSetting(e.target.checked);
    });
    
    // Load and set VAMP Fetch Mode toggle
    const vampFetchModeToggle = document.getElementById('vampFetchModeToggle');
    const vampFetchModeEnabled = await loadVampFetchModeSetting();
    vampFetchModeToggle.checked = vampFetchModeEnabled;
    
    // Add event listener for VAMP Fetch Mode toggle
    vampFetchModeToggle.addEventListener('change', async (e) => {
        await saveVampFetchModeSetting(e.target.checked);
    });
    
    // Load and set VAMP Username
    const vampUsernameInput = document.getElementById('vampUsernameInput');
    const vampUsername = await loadVampUsername();
    vampUsernameInput.value = vampUsername;
    
    // Auto-save VAMP username on input
    let vampUsernameSaveTimeout = null;
    vampUsernameInput.addEventListener('input', () => {
        clearTimeout(vampUsernameSaveTimeout);
        vampUsernameSaveTimeout = setTimeout(async () => {
            await saveVampUsername(vampUsernameInput.value.trim());
        }, 500);
    });
    vampUsernameInput.addEventListener('blur', async () => {
        clearTimeout(vampUsernameSaveTimeout);
        await saveVampUsername(vampUsernameInput.value.trim());
    });
    
    // Load and set VAMP button color and style
    const vampButtonColor = await loadVampButtonColor();
    const vampButtonStyle = await loadVampButtonStyle();
    currentVampStyle = vampButtonStyle;
    updateVampPreview(vampButtonColor, vampButtonStyle);
    
    // Load and set small VAMP button size slider
    const smallVampSizeSlider = document.getElementById('smallVampSizeSlider');
    const smallVampSizeValue = document.getElementById('smallVampSizeValue');
    const smallVampButtonSize = await loadSmallVampButtonSize();
    smallVampSizeSlider.value = smallVampButtonSize;
    smallVampSizeValue.textContent = smallVampButtonSize.toFixed(1) + 'x';
    
    // Add event listener for small VAMP button size slider
    smallVampSizeSlider.addEventListener('input', async () => {
        const size = parseFloat(smallVampSizeSlider.value);
        smallVampSizeValue.textContent = size.toFixed(1) + 'x';
        await saveSmallVampButtonSize(size);
    });
    
    // Load and set small VAMP button position
    const savedPosition = await loadSmallVampButtonPosition();
    let selectedPosition = savedPosition; // Track currently selected (preview) position
    const posBeforeBtn = document.getElementById('posBeforeBtn');
    const posAfterBtn = document.getElementById('posAfterBtn');
    const applyPositionBtn = document.getElementById('applyPositionBtn');
    const previewVampBefore = document.getElementById('previewVampBefore');
    const previewVampAfter = document.getElementById('previewVampAfter');
    
    // Function to update visual preview
    function updatePositionPreview(position) {
        if (position === 'before') {
            previewVampBefore.style.display = 'inline-flex';
            previewVampAfter.style.display = 'none';
        } else {
            previewVampBefore.style.display = 'none';
            previewVampAfter.style.display = 'inline-flex';
        }
    }
    
    // Update button states and preview based on loaded setting
    [posBeforeBtn, posAfterBtn].forEach(btn => {
        if (btn.dataset.position === savedPosition) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    updatePositionPreview(savedPosition);
    
    // Add event listeners for position buttons (preview only)
    [posBeforeBtn, posAfterBtn].forEach(btn => {
        btn.addEventListener('click', () => {
            const position = btn.dataset.position;
            selectedPosition = position;
            [posBeforeBtn, posAfterBtn].forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update visual preview
            updatePositionPreview(position);
            
            // Show Apply button if selection differs from saved
            if (position !== savedPosition) {
                applyPositionBtn.style.display = 'inline-block';
            } else {
                applyPositionBtn.style.display = 'none';
            }
        });
    });
    
    // Apply button - save and reload all relevant tabs
    applyPositionBtn.addEventListener('click', async () => {
        await saveSmallVampButtonPosition(selectedPosition);
        
        // Reload all Axiom, GMGN, and Padre tabs
        chrome.tabs.query({ url: ['*://axiom.trade/*', '*://*.axiom.trade/*', '*://gmgn.ai/*', '*://*.gmgn.ai/*', '*://padre.gg/*', '*://*.padre.gg/*'] }, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.reload(tab.id);
            });
        });
        
        // Hide apply button and update saved position
        applyPositionBtn.style.display = 'none';
    });
    
    // Add event listeners for style toggle buttons
    document.querySelectorAll('.style-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const style = btn.dataset.style;
            currentVampStyle = style;
            const currentColor = document.getElementById('customColorInput').value || '#ef4444';
            updateVampPreview(currentColor, style);
            await saveVampButtonStyle(style);
        });
    });
    
    // Add event listeners for color buttons
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const color = btn.dataset.color;
            updateVampPreview(color);
            await saveVampButtonColor(color);
        });
    });
    
    // Add event listener for custom color input
    const customColorInput = document.getElementById('customColorInput');
    const customColorPreview = document.getElementById('customColorPreview');
    
    customColorInput.addEventListener('input', async () => {
        let color = customColorInput.value.trim();
        // Add # if missing
        if (color && !color.startsWith('#')) {
            color = '#' + color;
        }
        // Validate hex color
        if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
            updateVampPreview(color);
            await saveVampButtonColor(color);
        }
    });
    
    customColorInput.addEventListener('blur', async () => {
        let color = customColorInput.value.trim();
        if (color && !color.startsWith('#')) {
            color = '#' + color;
            customColorInput.value = color;
        }
        if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
            updateVampPreview(color);
            await saveVampButtonColor(color);
        }
    });
    
    // Click on custom preview to open native color picker
    customColorPreview.addEventListener('click', () => {
        const colorPicker = document.createElement('input');
        colorPicker.type = 'color';
        colorPicker.value = customColorInput.value || '#ef4444';
        colorPicker.style.position = 'absolute';
        colorPicker.style.opacity = '0';
        document.body.appendChild(colorPicker);
        
        colorPicker.addEventListener('input', async () => {
            const color = colorPicker.value;
            updateVampPreview(color);
            await saveVampButtonColor(color);
        });
        
        colorPicker.addEventListener('change', () => {
            colorPicker.remove();
        });
        
        colorPicker.click();
    });
    // Load and set Insert Image button toggle
    const insertImageButtonToggle = document.getElementById('insertImageButtonToggle');
    const insertImageButtonEnabled = await loadInsertImageButtonSetting();
    insertImageButtonToggle.checked = insertImageButtonEnabled;
    // Add event listener for Insert Image button toggle
    insertImageButtonToggle.addEventListener('change', async (e) => {
        await saveInsertImageButtonSetting(e.target.checked);
    });

    const newPairsInsertImageToggle = document.getElementById('newPairsInsertImageToggle');
    const newPairsInsertImageEnabled = await loadNewPairsInsertImageSetting();
    newPairsInsertImageToggle.checked = newPairsInsertImageEnabled;
    newPairsInsertImageToggle.addEventListener('change', async (e) => {
        await saveNewPairsInsertImageSetting(e.target.checked);
    });
    
    // Load and set Twitter Deploy button toggle
    const twitterDeployButtonsToggle = document.getElementById('twitterDeployButtonsToggle');
    const twitterDeployButtonsEnabled = await loadTwitterDeployButtonsSetting();
    twitterDeployButtonsToggle.checked = twitterDeployButtonsEnabled;
    // Add event listener for Twitter Deploy button toggle
    twitterDeployButtonsToggle.addEventListener('change', async (e) => {
        await saveTwitterDeployButtonsSetting(e.target.checked);
    });
    
    // Load and set Auto-search toggle
    const autoSearchToggle = document.getElementById('autoSearchToggle');
    const autoSearchEnabled = await loadAutoSearchSetting();
    autoSearchToggle.checked = autoSearchEnabled;
    
    // Load and set Auto-search sub-toggles
    const autoSearchGoogleToggle = document.getElementById('autoSearchGoogleToggle');
    const autoSearchSubToggles = document.getElementById('autoSearchSubToggles');
    autoSearchGoogleToggle.checked = await loadAutoSearchGoogleSetting();
    const tokenFilterSearchToggle = document.getElementById('tokenFilterSearchToggle');
    tokenFilterSearchToggle.checked = await loadTokenFilterSearchSetting();
    autoSearchSubToggles.style.display = autoSearchEnabled ? '' : 'none';
    
    autoSearchToggle.addEventListener('change', async (e) => {
        await saveAutoSearchSetting(e.target.checked);
        autoSearchSubToggles.style.display = e.target.checked ? '' : 'none';
    });
    autoSearchGoogleToggle.addEventListener('change', async (e) => {
        await saveAutoSearchGoogleSetting(e.target.checked);
    });
    tokenFilterSearchToggle.addEventListener('change', async (e) => {
        await saveTokenFilterSearchSetting(e.target.checked);
    });
    
    // Platform selection
    const platformBtns = document.querySelectorAll('#platformToggle .style-btn');
    const currentPlatform = await loadAutoSearchPlatform();
    platformBtns.forEach(btn => {
        if (btn.dataset.platform === currentPlatform) btn.classList.add('active');
        btn.addEventListener('click', async () => {
            platformBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            await saveAutoSearchPlatform(btn.dataset.platform);
        });
    });
    
    // Load and set deploy settings
    const deploySettings = await loadDeploySettings();
    document.getElementById('apiKeyInput').value = deploySettings.apiKey;
    document.getElementById('buyAmountInput').value = deploySettings.buyAmount;
    document.getElementById('bnbApiKeyInput').value = deploySettings.bnbApiKey;
    document.getElementById('bnbBuyAmountInput').value = deploySettings.bnbBuyAmount;
    document.getElementById('cashbackModeToggle').checked = deploySettings.cashbackMode;
    document.getElementById('bonkersModeToggle').checked = deploySettings.bonkersMode;
    const statusDiv = document.getElementById('deploySettingsStatus');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const bnbApiKeyInput = document.getElementById('bnbApiKeyInput');
    const apiKeyError = document.getElementById('apiKeyError');
    const bnbApiKeyError = document.getElementById('bnbApiKeyError');
    const cashbackModeToggle = document.getElementById('cashbackModeToggle');
    const bonkersModeToggle = document.getElementById('bonkersModeToggle');
    let saveTimeout = null;
    // Auto-save function with validation
    const autoSaveDeploySettings = async () => {
        const apiKey = apiKeyInput.value.trim();
        const buyAmount = parseFloat(document.getElementById('buyAmountInput').value) || 5;
        const bnbApiKey = bnbApiKeyInput.value.trim();
        const bnbBuyAmount = parseFloat(document.getElementById('bnbBuyAmountInput').value) || 1.5;
        const cashbackMode = cashbackModeToggle.checked;
        const bonkersMode = bonkersModeToggle.checked;
        // Reset errors
        apiKeyInput.style.borderColor = '#d1d1d1';
        bnbApiKeyInput.style.borderColor = '#d1d1d1';
        apiKeyError.textContent = '';
        bnbApiKeyError.textContent = '';
        let hasError = false;
        // Validate Solana API key if provided
        if (apiKey) {
            const validation = validateApiKey(apiKey);
            if (!validation.valid) {
                apiKeyInput.style.borderColor = '#dc2626';
                apiKeyError.textContent = validation.error;
                hasError = true;
            }
        }
        // Validate BNB API key if provided
        if (bnbApiKey) {
            const validation = validateApiKey(bnbApiKey);
            if (!validation.valid) {
                bnbApiKeyInput.style.borderColor = '#dc2626';
                bnbApiKeyError.textContent = validation.error;
                hasError = true;
            }
        }
        // Don't save if there are errors
        if (hasError) {
            return;
        }
        // Save settings
        const success = await saveDeploySettings(apiKey, buyAmount, bnbApiKey, bnbBuyAmount, cashbackMode, bonkersMode);
        if (success) {
            statusDiv.textContent = '✓ Auto-saved';
            statusDiv.style.color = '#2e7d32';
            setTimeout(() => {
                statusDiv.textContent = '';
            }, 2000);
        } else {
            statusDiv.textContent = '❌ Failed to save';
            statusDiv.style.color = '#dc2626';
        }
    };
    // Add debounced auto-save listeners to all inputs
    const setupAutoSave = (inputId) => {
        const input = document.getElementById(inputId);
        // Save on input (typing)
        input.addEventListener('input', () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(autoSaveDeploySettings, 500);
        });
        // Also save immediately on blur (when clicking out)
        input.addEventListener('blur', () => {
            clearTimeout(saveTimeout);
            autoSaveDeploySettings();
        });
        // Save on Enter key
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                clearTimeout(saveTimeout);
                autoSaveDeploySettings();
            }
        });
    };
    setupAutoSave('apiKeyInput');
    setupAutoSave('buyAmountInput');
    setupAutoSave('bnbApiKeyInput');
    setupAutoSave('bnbBuyAmountInput');
    
    // Add event listeners for mode checkboxes
    cashbackModeToggle.addEventListener('change', () => {
        clearTimeout(saveTimeout);
        autoSaveDeploySettings();
    });
    bonkersModeToggle.addEventListener('change', () => {
        clearTimeout(saveTimeout);
        autoSaveDeploySettings();
    });
}); 
