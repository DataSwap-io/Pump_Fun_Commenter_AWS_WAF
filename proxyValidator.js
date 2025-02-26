import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import dns from 'dns';

class ProxyValidator {
  constructor() {
    this.checkedProxies = new Map();
  }

  parseProxyString(proxyUrl) {
    try {
      const url = new URL(proxyUrl);
      return {
        protocol: url.protocol,
        host: url.hostname,
        port: url.port,
        auth: url.username && url.password ? `${url.username}:${url.password}` : null
      };
    } catch (error) {
      console.error(`Failed to parse proxy URL: ${proxyUrl}`, error);
      return null;
    }
  }

  async validateProxy(proxyUrl) {
    console.log(`Testing proxy: ${proxyUrl}`);
    if (this.checkedProxies.has(proxyUrl)) {
      return this.checkedProxies.get(proxyUrl);
    }
  
    const proxyConfig = this.parseProxyString(proxyUrl);
    if (!proxyConfig) {
      console.error('Invalid proxy configuration');
      return false;
    }
  
    try {
      const agent = new HttpsProxyAgent({
        host: proxyConfig.host,
        port: proxyConfig.port,
        auth: proxyConfig.auth,
        protocol: proxyConfig.protocol,
        rejectUnauthorized: false,
        family: 4
      });
  
      const response = await fetch('https://api.ipify.org?format=json', {
        agent,
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
  
      console.log('Proxy validation response headers:', response.headers);
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const errorText = await response.text();
        throw new Error(`Non-JSON response. Content-Type: ${contentType}, Response: ${errorText}`);
      }

      const data = await response.json();
      const localIP = await this.getLocalIP();
      const isValid = data.ip !== localIP;

      console.log(`Proxy ${proxyUrl} validation result: ${isValid ? 'valid' : 'invalid'} (IP: ${data.ip})`);
      this.checkedProxies.set(proxyUrl, isValid);
      return isValid;
    } catch (error) {
      console.error(`Proxy ${proxyUrl} validation failed: ${error.message}`);
      this.checkedProxies.set(proxyUrl, false);
      return false;
    }
  }

  async getLocalIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Failed to get local IP:', error);
      return null;
    }
  }

  async filterValidProxies(proxyList) {
    console.log(`Starting validation of ${proxyList.length} proxies...`);
    const validProxies = [];
    for (const proxy of proxyList) {
      if (await this.validateProxy(proxy)) {
        validProxies.push(proxy);
      }
    }
    console.log(`Found ${validProxies.length} valid proxies`);
    return validProxies;
  }
}

export const proxyValidator = new ProxyValidator();
