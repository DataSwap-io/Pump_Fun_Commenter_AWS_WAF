import fetch from "node-fetch";
import chalk from "chalk";
import { Keypair } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { proxies } from './ProxyList.js'; // Import the proxy list
import { HttpsProxyAgent } from 'https-proxy-agent';
import { RequestManager } from './utils.js';
import { v4 as uuidv4 } from 'uuid'; // For generating session IDs

const login_url = "https://frontend-api-v3.pump.fun/auth/login";
let AUTH_TOKEN = null;
let authTokenPromise = null;

// Initialize RequestManager with our list of proxies
const requestManager = new RequestManager(proxies);

/**
 * Extracts the auth token from a cookie string.
 *
 * @param {string} cookieString - The string of cookies returned from the response headers.
 * @returns {string|null} - The extracted auth token or null if not found.
 */
function extractAuthToken(cookieString) {
  if (!cookieString) return null;
  const authTokenMatch = cookieString.match(/auth_token=([^;]+)/);
  return authTokenMatch ? authTokenMatch[1] : null;
}

/**
 * Generates a new wallet (public/private key pair).
 *
 * @returns {object} - An object containing the wallet's address, encoded private key, and secretKey.
 */
function generateSingleWallet() {
  const keyPair = Keypair.generate();
  return {
    address: keyPair.publicKey.toString(),
    privateKey: bs58.encode(keyPair.secretKey),
    secretKey: keyPair.secretKey
  };
}

/**
 * Performs a POST request to login with the generated wallet credentials.
 * Uses a proxy from RequestManager. In case of unavailable proxies or errors, waits before retrying.
 *
 * @param {object} wallet - The wallet object generated from generateSingleWallet.
 * @returns {Promise<string|null>} - The authentication token or null if login failed.
 */
async function POST_login(wallet) {
  // Generate a unique session ID for this login attempt.
  const sessionId = uuidv4();

  try {
    // Get an available proxy from the RequestManager.
    const proxy = requestManager.getAvailableProxy();
    if (!proxy) {
      // If no proxy is available, wait for a humanized delay and then try again.
      await requestManager.humanizedDelay(30000, 60000);
      return POST_login(wallet);
    }

    const agent = new HttpsProxyAgent(proxy);
    const timestamp = Date.now();

    // Prepare headers using the RequestManager's helper.
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

    // Prepare the wallet signature for authentication.
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

    // Make the login POST request using the proxy agent.
    const response = await fetch(login_url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(loginData),
      agent: agent
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const cookies = response.headers.get('set-cookie');
    AUTH_TOKEN = extractAuthToken(cookies);
    return AUTH_TOKEN;

  } catch (error) {
    console.error(chalk.red("Login error:"), error.message);
    // On error, wait for a humanized delay before returning null.
    await requestManager.humanizedDelay(15000, 30000);
    return null;
  }
}

// Immediately invoke an async function to generate a wallet and attempt login.
(async () => {
  try {
    const wallet = generateSingleWallet();
    const authToken = await POST_login(wallet);
    // Optionally log the auth token:
    // console.log(chalk.blue("Auth Token:"), authToken);
    return authToken;
  } catch (error) {
    console.error(chalk.red("Fatal error:"), error);
    return null;
  }
})();

/**
 * Returns a promise that resolves with the auth token once it is available.
 *
 * @returns {Promise<string|null>} - A promise that resolves to the auth token.
 */
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
