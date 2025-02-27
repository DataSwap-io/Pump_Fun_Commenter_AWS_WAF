import fetch from "node-fetch";
import chalk from "chalk";
import { Keypair } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { proxies } from './ProxyList.js';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { RequestManager } from './utils.js';
import { v4 as uuidv4 } from 'uuid'; 
import dns from 'dns';

// Set DNS resolution order directly
dns.setDefaultResultOrder('ipv4first');

const login_url = "https://frontend-api-v3.pump.fun/auth/login";
let AUTH_TOKEN = null;
let authTokenPromise = null;

const requestManager = new RequestManager(proxies);
await requestManager.initializeProxies(proxies); 

function extractAuthToken(cookieString) {
  if (!cookieString) return null;
  const authTokenMatch = cookieString.match(/auth_token=([^;]+)/);
  return authTokenMatch ? authTokenMatch[1] : null;
}

function generateSingleWallet() {
  const keyPair = Keypair.generate();
  return {
    address: keyPair.publicKey.toString(),
    privateKey: bs58.encode(keyPair.secretKey),
    secretKey: keyPair.secretKey
  };
}

async function POST_login(wallet) {
  const sessionId = uuidv4();
  let retryCount = 0;
  const maxRetries = 5;

  while (retryCount < maxRetries) {
    try {
      const proxy = await requestManager.getAvailableProxy();
      if (!proxy) {
        console.log("[WARN] No available proxies. Waiting before retry...");
        await requestManager.humanizedDelay(30000, 60000);
        retryCount++;
        continue;
      }

      console.log(`[DEBUG] Attempt ${retryCount + 1}/${maxRetries} - Using proxy: ${proxy}`);
      
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

      const timestamp = Date.now();

      // In login.js POST_login()
      const headers = {
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Origin": "https://pump.fun",
        "Referer": "https://pump.fun/",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-site"
      };

      console.log("[DEBUG] Preparing wallet signature...");
      const decodedPrivateKey = bs58.decode(wallet.privateKey);
      const privateKey = decodedPrivateKey.slice(0, 32);
      const keypair = nacl.sign.keyPair.fromSeed(privateKey);
      const message = new TextEncoder().encode(`Sign in to pump.fun: ${timestamp}`);
      const signature = nacl.sign.detached(message, keypair.secretKey);
      const encodedSignature = bs58.encode(signature);

      const loginData = {
        address: wallet.address,
        signature: encodedSignature,
        timestamp: timestamp
      };

      console.log("[DEBUG] Sending login request...");
      const response = await fetch(login_url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(loginData),
        agent: agent
      });
      
      console.log(`[DEBUG] Response status: ${response.status}, statusText: ${response.statusText}`);
      console.log("[DEBUG] Response headers:", Object.fromEntries([...response.headers.entries()]));

      if(response.status === 402 || response.status === 407) {
        console.error(`[ERROR] Proxy authentication error (${response.status}). Retrying with different proxy...`);
        retryCount++;
        await requestManager.humanizedDelay(5000, 10000);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ERROR] Response body: ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const cookies = response.headers.get('set-cookie');
      AUTH_TOKEN = extractAuthToken(cookies);
      
      if (!AUTH_TOKEN) {
        console.error("[ERROR] Failed to extract auth token from cookies");
        console.log("[DEBUG] Cookies:", cookies);
        throw new Error("Auth token not found in response");
      }
      
      console.log(chalk.green("[SUCCESS] Login successful"));
      return AUTH_TOKEN;

    } catch (error) {
      console.error(chalk.red("[ERROR] Login error:"), error.message);
      retryCount++;
      if (retryCount === maxRetries) {
        console.error(chalk.red("[ERROR] Max retries reached. Giving up."));
        return null;
      }
      await requestManager.humanizedDelay(15000, 30000);
    }
  }
  
  return null;
}

async function initializeLogin() {
  try {
    console.log(chalk.blue("[INFO] Generating wallet and logging in..."));
    const wallet = generateSingleWallet();
    console.log(chalk.blue("[DEBUG] Wallet address:"), wallet.address);
    
    const authToken = await POST_login(wallet);
    if (authToken) {
      console.log(chalk.green("[SUCCESS] Successfully logged in and obtained auth token"));
      AUTH_TOKEN = authToken;
      return authToken;
    } else {
      console.error(chalk.red("[ERROR] Failed to obtain auth token after multiple retries"));
      return null;
    }
  } catch (error) {
    console.error(chalk.red("[FATAL] Login initialization error:"), error);
    return null;
  }
}

// Initialize the login process
initializeLogin();

export const getAuthToken = () => {
  if (!authTokenPromise) {
    authTokenPromise = new Promise(resolve => {
      const checkToken = () => {
        if (AUTH_TOKEN) {
          resolve(AUTH_TOKEN);
        } else {
          console.log("[DEBUG] Waiting for auth token...");
          setTimeout(checkToken, 500);
        }
      };
      checkToken();
    });
  }
  return authTokenPromise;
};

export const Auth_Comment = getAuthToken;