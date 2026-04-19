// GitHub API Service
export class ApiService {
  constructor() {
    this.baseUrl = 'https://api.github.com';
  }

  async getToken() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['githubToken'], (result) => {
        resolve(result.githubToken || null);
      });
    });
  }

  async fetchUsage() {
    const token = await this.getToken();
    if (!token) throw new Error('No GitHub token configured');

    const response = await fetch(`${this.baseUrl}/user/copilot_usage`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github+json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch usage data');
    return await response.json();
  }
}
