# GitHub Copilot Usage Tracker

A lightweight Microsoft Edge extension that displays real-time GitHub Copilot daily usage limits.

## Features

- ✅ Real-time usage tracking
- ✅ Circular progress indicator
- ✅ Seamless Copilot integration
- ✅ Secure token storage
- ✅ Dark mode support
- ✅ Configurable refresh intervals

## Installation

1. Clone or download this repository
2. Open `edge://extensions/`
3. Enable **Developer mode**
4. Click **Load unpacked** and select this folder
5. Create a [GitHub token](https://github.com/settings/tokens/new) with `user` scope
6. Click the extension icon and go to Settings
7. Paste your token and verify

## Usage

Visit https://github.com/copilot and open a chat. The usage widget appears automatically!

## Files

- `manifest.json` - Extension configuration
- `background/` - API integration
- `content/` - DOM injection
- `popup/` - Quick access popup
- `options/` - Settings page

## License

MIT
