// utils.js
export class RequestManager {
  constructor(proxies, cooldownTime = 300000) {
    this.proxies = new Map(proxies.map(proxy => [proxy, Date.now()]));
    this.cooldownTime = cooldownTime;
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/121.0.0.0'
    ];
    this.languages = ['en-US,en;q=0.9', 'en-GB,en;q=0.8', 'es-ES,es;q=0.9', 'fr-FR,fr;q=0.9', 'de-DE,de;q=0.9'];
    this.sessionStore = new Map(); // Store session data
  }

  getAvailableProxy() {
    const now = Date.now();
    for (const [proxy, lastUsed] of this.proxies) {
      if (now - lastUsed >= this.cooldownTime) {
        this.proxies.set(proxy, now);
        return proxy;
      }
    }
    return null;
  }

  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  humanizedDelay(min, max) {
    const baseDelay = Math.floor(Math.random() * (max - min + 1)) + min;
    const jitter = Math.floor(Math.random() * 1000);
    return new Promise(resolve => setTimeout(resolve, baseDelay + jitter));
  }

  getHeaders(authToken, sessionId) {
    let session = this.sessionStore.get(sessionId);
    
    if (!session) {
      session = {
        userAgent: this.getRandomUserAgent(),
        language: this.languages[Math.floor(Math.random() * this.languages.length)],
        timestamp: Date.now()
      };
      this.sessionStore.set(sessionId, session);
    }

    return {
      'Accept-Language': session.language,
      'Accept': 'application/json, text/plain, */*',
      'User-Agent': session.userAgent,
      'Cookie': `auth_token=${authToken}`,
      'Origin': 'https://pump.fun',
      'Referer': 'https://pump.fun/',
      'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      'Connection': 'keep-alive'
    };
  }
}
