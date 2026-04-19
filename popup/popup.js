const content = document.getElementById('content');

chrome.runtime.sendMessage({ action: 'getUsage' }, (response) => {
  if (response && response.success) {
    const data = response.data;
    const pct = Math.round((data.used / data.total) * 100);
    content.innerHTML = `
      <div>
        <div style="font-size: 32px; font-weight: bold; color: #0969da;">${pct}%</div>
        <div style="margin: 8px 0; color: #57606a;">${data.used} / ${data.total}</div>
        <div style="font-size: 12px; color: #57606a;">Used today</div>
      </div>
    `;
  } else {
    content.innerHTML = '<div style="color: #da3633;">⚠️ Configure token</div>';
  }
});
