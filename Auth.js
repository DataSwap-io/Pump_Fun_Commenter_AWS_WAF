import { Auth_Comment } from './Create_Acc.js';
import { proxies } from './ProxyList.js';
import { HttpsProxyAgent } from 'https-proxy-agent';
import dns from 'dns';

process.env.NODE_OPTIONS = '--dns-result-order=ipv4first';

const TOKEN_API_URL = "https://frontend-api-v3.pump.fun/token/generateTokenForThread";
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; 

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseProxyUrl(proxyUrl) {
  try {
    const regex = /^(https?:\/\/)?(?:([^:@]+):([^@]+)@)?([^:]+):(\d+)$/;
    const match = proxyUrl.match(regex);
    
    if (!match) return null;
    
    const [, protocol = 'http:', username, password, host, port] = match;
    
    return {
      protocol: protocol.slice(0, -1),
      host,
      port: parseInt(port, 10),
      auth: username && password ? `${username}:${password}` : undefined
    };
  } catch (error) {
    console.error('[ERROR] Failed to parse proxy URL:', error);
    return null;
  }
}

async function generateToken() {
  let retryCount = 0;
  let lastError = null;

  while (retryCount < MAX_RETRIES) {
    try {
      const proxy = proxies[Math.floor(Math.random() * proxies.length)];
      console.log("[DEBUG] Using proxy:", proxy);

      const proxyConfig = parseProxyUrl(proxy);
      if (!proxyConfig) {
        throw new Error('Invalid proxy configuration');
      }

      const agent = new HttpsProxyAgent({
        ...proxyConfig,
        rejectUnauthorized: false,
        family: 4
      });

      const response = await fetch(TOKEN_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        agent,
        body: JSON.stringify({
        })
      });

      if (response.status === 402) {
        console.error('[ERROR] Proxy authentication failed. Retrying with different proxy...');
        retryCount++;
        await delay(RETRY_DELAY);
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const authToken = await Auth_Comment();

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
      
      await delay(RETRY_DELAY);
    }
  }
}
export const x_aws_proxy_token = generateToken();

x_aws_proxy_token.catch(error => {
  console.error('[FATAL] Token generation failed:', error);
  process.exit(1);
});
