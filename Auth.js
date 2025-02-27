import { Auth_Comment } from './Create_Acc.js';
import { proxies } from './ProxyList.js';
import { HttpsProxyAgent } from 'https-proxy-agent';
import dns from 'dns';
import { RequestManager } from './utils.js';

// Set DNS resolution order directly
dns.setDefaultResultOrder('ipv4first');

const TOKEN_API_URL = "https://frontend-api-v3.pump.fun/token/generateTokenForThread";
const MAX_RETRIES = 5; // Increased from 3 to 5
const RETRY_DELAY = 5000; 
const requestManager = new RequestManager(proxies);

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateToken() {
  let retryCount = 0;
  let lastError = null;

  while (retryCount < MAX_RETRIES) {
    try {
      const proxy = await requestManager.getAvailableProxy();
      
      if (!proxy) {
        console.log("[WARN] No available proxies. Waiting before retry...");
        await delay(RETRY_DELAY * 2);
        retryCount++;
        continue;
      }
      
      console.log(`[DEBUG] Attempt ${retryCount + 1}/${MAX_RETRIES} - Using proxy: ${proxy}`);

      const proxyConfig = requestManager.parseProxyUrl(proxy);
      if (!proxyConfig) {
        throw new Error('Invalid proxy configuration');
      }

      const agent = new HttpsProxyAgent({
        host: proxyConfig.host,
        port: proxyConfig.port,
        auth: proxyConfig.auth,
        protocol: proxyConfig.protocol,
        rejectUnauthorized: false,
        family: 4,
        timeout: 30000
      });

      console.log("[DEBUG] Sending token generation request...");
      const response = await fetch(TOKEN_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': requestManager.getRandomUserAgent(),
          'Origin': 'https://pump.fun',
          'Referer': 'https://pump.fun/'
        },
        agent,
        body: JSON.stringify({})
      });

      console.log(`[DEBUG] Response status: ${response.status}, statusText: ${response.statusText}`);
      
      // Handle proxy authentication errors
      if (response.status === 402 || response.status === 407) {
        console.error(`[ERROR] Proxy authentication failed (${response.status}). Retrying with different proxy...`);
        retryCount++;
        await delay(RETRY_DELAY);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ERROR] Response body: ${errorText}`);
        throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
      }

      const data = await response.json();
      console.log("[DEBUG] Successfully generated token");
      
      const authToken = await Auth_Comment();
      console.log("[DEBUG] Successfully retrieved auth token");

      return {
        AuthToken: authToken,
        CommentToken: data.token
      };

    } catch (error) {
      lastError = error;
      console.error(`[ERROR] Attempt ${retryCount + 1}/${MAX_RETRIES} failed:`, error.message);
      
      retryCount++;
      if (retryCount === MAX_RETRIES) {
        console.error('[ERROR] Max retries reached. Giving up.');
        throw new Error(`Failed to generate token after ${MAX_RETRIES} attempts: ${lastError.message}`);
      }
      
      // Increase delay with each retry
      await delay(RETRY_DELAY * retryCount);
    }
  }
}

export const x_aws_proxy_token = generateToken();

x_aws_proxy_token.catch(error => {
  console.error('[FATAL] Token generation failed:', error);
  process.exit(1);
});