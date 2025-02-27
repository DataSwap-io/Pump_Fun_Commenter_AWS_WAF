import { proxyValidator } from './proxyValidator.js';
import dns from 'dns';
import { HttpsProxyAgent } from 'https-proxy-agent';

// Set DNS resolution order directly
dns.setDefaultResultOrder('ipv4first');

export class RequestManager {
  parseProxyUrl(proxyUrl) {
    try {
      const url = new URL(proxyUrl);
      return {
        host: url.hostname,
        port: url.port,
        auth: url.username && url.password ? `${url.username}:${url.password}` : null,
        protocol: url.protocol || 'http:',
        rejectUnauthorized: false
      };
    } catch (error) {
      console.error(`Failed to parse proxy URL: ${proxyUrl}`, error);
      return null;
    }
  }

  getProxyAgent(proxyUrl) {
    const proxyConfig = this.parseProxyUrl(proxyUrl);
    if (!proxyConfig) {
      console.error('Invalid proxy configuration');
      return null;
    }

    try {
      return new HttpsProxyAgent({
        host: proxyConfig.host,
        port: proxyConfig.port,
        auth: proxyConfig.auth,
        protocol: proxyConfig.protocol,
        rejectUnauthorized: false,
        family: 4
      });
    } catch (error) {
      console.error('Failed to create proxy agent:', error);
      return null;
    }
  }

  constructor(proxies, cooldownTime = 60000) {
    // Reduced default cooldown from 300000 (5 min) to 60000 (1 min)
    this.cooldownTime = cooldownTime;
    this.proxies = new Map(); // Initialize proxies map
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

  async initializeProxies(proxies) {
    try {
      const validProxies = await proxyValidator.filterValidProxies(proxies);
      
      // Initialize proxies with staggered timestamps to ensure they don't all start in cooldown
      const now = Date.now();
      
      validProxies.forEach((proxy, index) => {
        // Stagger timestamps so each proxy has a different cooldown expiration
        const offset = Math.floor(this.cooldownTime * (index / validProxies.length));
        this.proxies.set(proxy, now - this.cooldownTime + offset);
      });
      
      console.log(`Initialized ${validProxies.length} proxies with staggered cooldowns`);
    } catch (error) {
      console.error('Failed to initialize proxies:', error);
      throw error;
    }
  }

  async getAvailableProxy() {
    try {
      const now = Date.now();
      const availableProxies = Array.from(this.proxies.entries())
        .filter(([_, lastUsed]) => now - lastUsed >= this.cooldownTime);
      
      if (availableProxies.length === 0) {
        console.log("No proxies available with normal cooldown, looking for least recently used proxy");
        
        // Fallback: If no proxies are available, use the one with the oldest timestamp
        const proxyEntries = Array.from(this.proxies.entries());
        if (proxyEntries.length === 0) return null;
        
        // Sort by timestamp (oldest first)
        proxyEntries.sort(([_, lastUsed1], [__, lastUsed2]) => lastUsed1 - lastUsed2);
        const [leastRecentProxy, leastRecentTime] = proxyEntries[0];
        
        console.log(`Reusing proxy that was used ${(now - leastRecentTime) / 1000}s ago`);
        this.proxies.set(leastRecentProxy, now);
        return leastRecentProxy;
      }
      
      const [proxy] = availableProxies[Math.floor(Math.random() * availableProxies.length)];
      this.proxies.set(proxy, now);
      return proxy;
    } catch (error) {
      console.error('Error getting available proxy:', error);
      return null;
    }
  }

  humanizedDelay(min, max) {
    const baseDelay = Math.floor(Math.random() * (max - min + 1)) + min;
    const jitter = Math.floor(Math.random() * 1000);
    return new Promise(resolve => setTimeout(resolve, baseDelay + jitter));
  }

  getHeaders(authToken, sessionId) {
    try {
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
        'Cookie': authToken ? `auth_token=${authToken}` : '',
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
    } catch (error) {
      console.error('Error generating headers:', error);
      return {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': this.getRandomUserAgent(),
        'Origin': 'https://pump.fun',
        'Referer': 'https://pump.fun/'
      };
    }
  }

  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }
}