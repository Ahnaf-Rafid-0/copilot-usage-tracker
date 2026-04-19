// Service Worker - Background Script

const REFRESH_KEY = 'refreshInterval';
const DEFAULT_REFRESH = 5 * 60 * 1000; // 5 minutes
let refreshInterval = DEFAULT_REFRESH;

// Initialize on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.runtime.openOptionsPage();
  }
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getUsage') {
    fetchUsageData().then(data => {
      sendResponse({ success: true, data });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
  
  if (request.action === 'verifyToken') {
    verifyToken(request.token).then(valid => {
      sendResponse({ success: valid });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
  
  if (request.action === 'updateRefreshInterval') {
    refreshInterval = request.interval * 60 * 1000;
    chrome.storage.sync.set({ [REFRESH_KEY]: request.interval });
    sendResponse({ success: true });
  }
});

// Get GitHub token from storage
async function getToken() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['githubToken'], (result) => {
      resolve(result.githubToken || null);
    });
  });
}

// Fetch usage data with retry logic
async function fetchUsageData(attempt = 0) {
  const token = await getToken();
  if (!token) {
    throw new Error('No GitHub token configured');
  }

  try {
    const response = await fetch('https://api.github.com/user/copilot_usage', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github+json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Invalid GitHub token');
      if (response.status === 403) throw new Error('Token expired or insufficient permissions');
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Cache the data
    chrome.storage.local.set({
      copilotUsageCache: {
        data,
        timestamp: Date.now()
      }
    });

    return data;
  } catch (error) {
    // Retry with exponential backoff
    if (attempt < 2) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      return fetchUsageData(attempt + 1);
    }
    throw error;
  }
}

// Verify GitHub token
async function verifyToken(token) {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github+json'
      }
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Periodic refresh
function startPeriodicRefresh() {
  setInterval(async () => {
    try {
      const data = await fetchUsageData();
      // Broadcast to all tabs
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'usageUpdated',
            data: data
          }).catch(() => {});
        });
      });
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  }, refreshInterval);
}

// Load settings and start refresh
chrome.storage.sync.get([REFRESH_KEY], (result) => {
  if (result[REFRESH_KEY]) {
    refreshInterval = result[REFRESH_KEY] * 60 * 1000;
  }
  startPeriodicRefresh();
});
