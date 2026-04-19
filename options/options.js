const tokenInput = document.getElementById('token');
const toggleBtn = document.getElementById('toggle');
const verifyBtn = document.getElementById('verify');
const intervalInput = document.getElementById('interval');
const saveBtn = document.getElementById('save');
const resetBtn = document.getElementById('reset');
const status = document.getElementById('status');

// Load settings
chrome.storage.sync.get(['githubToken', 'refreshInterval'], (result) => {
  if (result.githubToken) tokenInput.value = result.githubToken;
  if (result.refreshInterval) intervalInput.value = result.refreshInterval;
});

// Toggle visibility
toggleBtn.addEventListener('click', () => {
  tokenInput.type = tokenInput.type === 'password' ? 'text' : 'password';
  toggleBtn.textContent = tokenInput.type === 'password' ? '👁️' : '🙈';
});

// Verify token
verifyBtn.addEventListener('click', () => {
  const token = tokenInput.value.trim();
  if (!token) {
    setStatus('Enter a token', 'error');
    return;
  }
  
  chrome.runtime.sendMessage({ action: 'verifyToken', token }, (response) => {
    if (response.success) {
      setStatus('✓ Token verified', 'success');
    } else {
      setStatus('✗ Verification failed', 'error');
    }
  });
});

// Save settings
saveBtn.addEventListener('click', () => {
  const token = tokenInput.value.trim();
  if (!token) {
    setStatus('Enter and verify a token', 'error');
    return;
  }
  
  chrome.storage.sync.set({
    githubToken: token,
    refreshInterval: parseInt(intervalInput.value)
  }, () => {
    chrome.runtime.sendMessage({
      action: 'updateRefreshInterval',
      interval: parseInt(intervalInput.value)
    });
    setStatus('✓ Settings saved', 'success');
  });
});

// Reset settings
resetBtn.addEventListener('click', () => {
  if (confirm('Reset all settings?')) {
    chrome.storage.sync.clear(() => {
      tokenInput.value = '';
      intervalInput.value = '5';
      setStatus('✓ Reset complete', 'success');
    });
  }
});

function setStatus(msg, type) {
  status.textContent = msg;
  status.className = type;
  if (type === 'success') {
    setTimeout(() => {
      status.textContent = '';
      status.className = '';
    }, 3000);
  }
}
