// Content Script - Injects widget into GitHub Copilot interface

const WIDGET_ID = 'copilot-usage-widget';

// Listen for usage updates
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'usageUpdated') {
    updateWidget(request.data);
  }
});

// Inject widget on page load
function injectWidget() {
  if (document.getElementById(WIDGET_ID)) return;

  // Try to find Copilot prompt
  let container = document.querySelector('[data-testid="copilot-prompt-input"]') ||
                 document.querySelector('.copilot-prompt-input') ||
                 document.querySelector('[class*="prompt"]');

  if (container && container.parentElement) {
    const widget = createWidgetElement();
    container.parentElement.insertBefore(widget, container.nextSibling);
    requestUsageData();
  }
}

function createWidgetElement() {
  const widget = document.createElement('div');
  widget.id = WIDGET_ID;
  widget.className = 'copilot-usage-widget';
  widget.innerHTML = `
    <div class="usage-display">
      <div class="usage-circle">
        <svg viewBox="0 0 100 100" class="progress-ring">
          <circle cx="50" cy="50" r="45" class="progress-bg"/>
          <circle cx="50" cy="50" r="45" class="progress-stroke"/>
        </svg>
        <div class="usage-percentage">--</div>
      </div>
      <div class="usage-stats">
        <div class="stat-item">
          <span class="stat-label">Used:</span>
          <span class="stat-value">-- / --</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Status:</span>
          <span class="stat-badge">Loading...</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Resets in:</span>
          <span class="stat-time">--</span>
        </div>
      </div>
    </div>
  `;
  return widget;
}

function requestUsageData() {
  chrome.runtime.sendMessage({ action: 'getUsage' }, (response) => {
    if (response && response.success) {
      updateWidget(response.data);
    }
  });
}

function updateWidget(data) {
  if (!data || !data.total) return;

  const percentage = Math.round((data.used / data.total) * 100);
  const circumference = 282.74; // 2 * Math.PI * 45
  const offset = circumference - (percentage / 100) * circumference;

  const widget = document.getElementById(WIDGET_ID);
  if (!widget) return;

  widget.querySelector('.usage-percentage').textContent = `${percentage}%`;
  widget.querySelector('.progress-stroke').style.strokeDashoffset = offset;
  widget.querySelector('.stat-value').textContent = `${data.used} / ${data.total}`;

  // Update badge
  const badge = widget.querySelector('.stat-badge');
  if (percentage < 60) {
    badge.textContent = '🟢 Healthy';
  } else if (percentage < 80) {
    badge.textContent = '🟡 Warning';
  } else if (percentage < 95) {
    badge.textContent = '🔴 Critical';
  } else {
    badge.textContent = '⚫ Exhausted';
  }

  // Update reset time
  if (data.reset_at) {
    widget.querySelector('.stat-time').textContent = formatTime(new Date(data.reset_at));
  }
}

function formatTime(resetDate) {
  const diff = resetDate - new Date();
  if (diff <= 0) return 'Soon';
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

// Inject when ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectWidget);
} else {
  injectWidget();
}
