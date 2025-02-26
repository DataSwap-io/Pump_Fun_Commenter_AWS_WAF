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

process.env.NODE_OPTIONS = '--dns-result-order=ipv4first';

const login_url = "https://frontend-api-v3.pump.fun/auth/login";
let AUTH_TOKEN = null;
let authTokenPromise = null;

const requestManager = new RequestManager(proxies);


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

  try {
    const proxy = await requestManager.getAvailableProxy();
    if (!proxy) {
      await requestManager.humanizedDelay(30000, 60000);
      return POST_login(wallet);
    }

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
      family: 4
    });


    const timestamp = Date.now();

    const headers = {
      ...requestManager.getHeaders(null, sessionId),
      "Content-Type": "application/json; charset=utf-8",
      "Origin": "https://pump.fun",
      "Referer": "https://pump.fun/",
      "Accept": "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-site"
    };

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

    const response = await fetch(login_url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(loginData),
      agent: agent
    });
    
    console.log("Response headers:", response.headers);

    if(response.status === 402) {
      console.error("Proxy authentication error. Retrying with different proxy...");
      await requestManager.humanizedDelay(5000, 10000);
      return POST_login(wallet);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const cookies = response.headers.get('set-cookie');
    AUTH_TOKEN = extractAuthToken(cookies);
    return AUTH_TOKEN;

  } catch (error) {
    console.error(chalk.red("Login error:"), error.message);
    await requestManager.humanizedDelay(15000, 30000);
    return null;
  }
}

(async () => {
  try {
    const wallet = generateSingleWallet();
    const authToken = await POST_login(wallet);
    // console.log(chalk.blue("Auth Token:"), authToken);
    return authToken;
  } catch (error) {
    console.error(chalk.red("Fatal error:"), error);
    return null;
  }
})();


export const getAuthToken = () => {
  if (!authTokenPromise) {
    authTokenPromise = new Promise(resolve => {
      const checkToken = () => {
        AUTH_TOKEN ? resolve(AUTH_TOKEN) : setTimeout(checkToken, 100);
      };
      checkToken();
    });
  }
  return authTokenPromise;
};
