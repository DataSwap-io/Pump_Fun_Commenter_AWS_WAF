import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import dns from 'dns';
import { exec } from 'child_process';
import { promisify } from 'util';

// Promisify exec for async/await usage
const execPromise = promisify(exec);

// Set DNS resolution order directly
dns.setDefaultResultOrder('ipv4first');

class ProxyValidator {
  constructor() {
    this.checkedProxies = new Map();
    this.testEndpoints = [
      'http://httpbin.org/ip',
      'https://api.ipify.org?format=json'
    ];
  }

  parseProxyString(proxyUrl) {
    try {
      // Handle URLs that may not have protocol prefix
      if (!proxyUrl.startsWith('http://') && !proxyUrl.startsWith('https://')) {
        proxyUrl = 'http://' + proxyUrl;
      }
      
      const url = new URL(proxyUrl);
      return {
        host: url.hostname,
        port: parseInt(url.port || (url.protocol === 'https:' ? '443' : '80')),
        auth: url.username && url.password ? `${url.username}:${url.password}` : null,
        protocol: url.protocol.replace(':', '')
      };
    } catch (error) {
      console.error(`Failed to parse proxy URL: ${proxyUrl}`, error);
      return null;
    }
  }

  // Try to validate proxy using curl as an alternative method
  async validateWithCurl(proxyUrl) {
    try {
      const proxyConfig = this.parseProxyString(proxyUrl);
      if (!proxyConfig) return false;

      console.log(`Testing proxy with curl: ${proxyUrl}`);
      
      const authOption = proxyConfig.auth ? `-U ${proxyConfig.auth}` : '';
      const cmd = `curl -s -m 20 -x ${proxyConfig.host}:${proxyConfig.port} ${authOption} http://httpbin.org/ip`;
      
      console.log(`Executing: ${cmd}`);
      
      const { stdout, stderr } = await execPromise(cmd, { timeout: 30000 });
      
      if (stderr) {
        console.error(`Curl stderr: ${stderr}`);
      }
      
      if (!stdout || stdout.trim() === '') {
        console.error('Empty response from curl');
        return false;
      }
      
      try {
        const response = JSON.parse(stdout);
        const isValid = !!response.origin;
        console.log(`Curl validation result: ${isValid ? 'valid' : 'invalid'}, IP: ${response.origin || 'unknown'}`);
        return isValid;
      } catch (parseError) {
        console.error(`Failed to parse curl response: ${stdout.substring(0, 100)}...`);
        return false;
      }
    } catch (error) {
      console.error(`Curl validation failed: ${error.message}`);
      return false;
    }
  }

  async validateWithFetch(proxyUrl, endpoint) {
    try {
      const proxyConfig = this.parseProxyString(proxyUrl);
      if (!proxyConfig) return false;

      // Create a properly formatted proxy URL
      const formattedProxyUrl = `${proxyConfig.protocol}://${proxyConfig.auth ? proxyConfig.auth + '@' : ''}${proxyConfig.host}:${proxyConfig.port}`;
      
      console.log(`Testing with fetch: ${endpoint} via ${formattedProxyUrl}`);
      
      // Create the proxy agent using the formatted URL directly
      const agent = new HttpsProxyAgent(formattedProxyUrl);

      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        // Add explicit proxy authorization header
        'Proxy-Authorization': proxyConfig.auth ? 
          `Basic ${Buffer.from(proxyConfig.auth).toString('base64')}` : 
          undefined
      };

      const response = await fetch(endpoint, {
        method: 'GET',
        agent,
        timeout: 20000,
        headers
      });

      // Handle proxy auth errors explicitly
      if (response.status === 407 || response.status === 402) {
        console.error(`Proxy authentication failed for ${proxyUrl} with status ${response.status}`);
        return false;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! Status: ${response.status}, Response: ${errorText.substring(0, 100)}...`);
        return false;
      }

      const data = await response.json();
      const ip = data.ip || data.origin;
      
      if (!ip) {
        console.error(`Invalid response format from ${endpoint}`);
        return false;
      }
      
      console.log(`Fetch validation successful! Proxy IP: ${ip}`);
      return true;
    } catch (error) {
      console.error(`Fetch validation failed: ${error.message}`);
      return false;
    }
  }

  async getLocalIP() {
    try {
      // Try multiple IP services to be more reliable
      const services = [
        'https://api.ipify.org?format=json',
        'https://httpbin.org/ip',
        'https://ifconfig.me/ip'
      ];
      
      for (const service of services) {
        try {
          const response = await fetch(service);
          if (!response.ok) continue;
          
          if (service.includes('ipify')) {
            const data = await response.json();
            return data.ip;
          } else if (service.includes('httpbin')) {
            const data = await response.json();
            return data.origin;
          } else {
            return await response.text();
          }
        } catch (error) {
          console.warn(`Failed to get IP from ${service}: ${error.message}`);
          continue;
        }
      }
      
      throw new Error('All IP services failed');
    } catch (error) {
      console.error('Failed to get local IP:', error);
      return null;
    }
  }

  async validateProxy(proxyUrl) {
    console.log(`Starting validation for proxy: ${proxyUrl}`);
    if (this.checkedProxies.has(proxyUrl)) {
      return this.checkedProxies.get(proxyUrl);
    }

    // First try with curl (most reliable)
    try {
      const curlResult = await this.validateWithCurl(proxyUrl);
      if (curlResult) {
        console.log(`✅ Proxy ${proxyUrl} validation successful with curl`);
        this.checkedProxies.set(proxyUrl, true);
        return true;
      }
    } catch (error) {
      console.error(`Curl validation failed, trying fetch methods: ${error.message}`);
    }

    // Then try with fetch to different endpoints
    for (const endpoint of this.testEndpoints) {
      try {
        const fetchResult = await this.validateWithFetch(proxyUrl, endpoint);
        if (fetchResult) {
          console.log(`✅ Proxy ${proxyUrl} validation successful with fetch to ${endpoint}`);
          this.checkedProxies.set(proxyUrl, true);
          return true;
        }
      } catch (error) {
        console.error(`Fetch validation to ${endpoint} failed: ${error.message}`);
      }
    }

    console.error(`❌ Proxy ${proxyUrl} validation failed with all methods`);
    this.checkedProxies.set(proxyUrl, false);
    return false;
  }

  async filterValidProxies(proxyList) {
    console.log(`Starting validation of ${proxyList.length} proxies...`);
    const validProxies = [];
    
    // Use Promise.all with a small batch size to validate proxies in parallel
    const batchSize = 3; // Process 3 proxies at a time to avoid overwhelming the network
    
    for (let i = 0; i < proxyList.length; i += batchSize) {
      const batch = proxyList.slice(i, i + batchSize);
      console.log(`Validating batch ${Math.floor(i/batchSize) + 1} (${batch.length} proxies)`);
      
      const results = await Promise.all(
        batch.map(async proxy => {
          const isValid = await this.validateProxy(proxy);
          return { proxy, isValid };
        })
      );
      
      for (const { proxy, isValid } of results) {
        if (isValid) {
          validProxies.push(proxy);
        }
      }
      
      // Small delay between batches
      if (i + batchSize < proxyList.length) {
        console.log("Waiting 5 seconds before next batch...");
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    console.log(`Found ${validProxies.length} valid proxies out of ${proxyList.length} total`);
    return validProxies;
  }
}

export const proxyValidator = new ProxyValidator();