import { x_aws_proxy_token } from "./Auth.js";
import { comments } from "./CommentList.js";
import { proxies } from './ProxyList.js';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch from "node-fetch";
import dns from 'dns';
import { RequestManager } from './utils.js';

// Set DNS resolution order directly
dns.setDefaultResultOrder('ipv4first');

const requestManager = new RequestManager(proxies);

// Helper function to introduce a random delay
function delay(min, max) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  console.log(`[DEBUG] Delaying for ${ms}ms`);
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to get a random comment from the list
function getRandomComment() {
  return comments[Math.floor(Math.random() * comments.length)];
}

// Main function to post a comment
export async function postComment(mintAddress) {
  let retryCount = 0;
  const maxRetries = 5; // Increased from 3 to 5

  console.log(`[INFO] Posting comment for mint: ${mintAddress}`);

  while (retryCount < maxRetries) {
    try {
      // Select a random proxy from the list
      const proxy = await requestManager.getAvailableProxy();
      
      if (!proxy) {
        console.log("[WARN] No available proxies. Waiting before retry...");
        await delay(5000, 10000);
        retryCount++;
        continue;
      }
      
      console.log(`[DEBUG] Attempt ${retryCount + 1}/${maxRetries} - Using proxy: ${proxy}`);

      // Parse the proxy URL
      const proxyConfig = requestManager.parseProxyUrl(proxy);
      if (!proxyConfig) {
        throw new Error('Invalid proxy configuration');
      }

      // Create a proxy agent
      const agent = new HttpsProxyAgent({
        host: proxyConfig.host,
        port: proxyConfig.port,
        auth: proxyConfig.auth,
        protocol: proxyConfig.protocol,
        rejectUnauthorized: false,
        family: 4,
        timeout: 30000
      });

      // Fetch the AWS proxy tokens
      console.log("[DEBUG] Retrieving tokens...");
      const { AuthToken, CommentToken } = await x_aws_proxy_token;
      console.log("[DEBUG] Tokens retrieved successfully");

      // Introduce a random delay between 4 and 6 seconds
      await delay(4000, 6000);

      // Get a random comment
      const randomComment = getRandomComment();
      console.log(`[DEBUG] Selected comment: "${randomComment.substring(0, 30)}..."`);

      // Define the comment URL
      const comment_url = "https://client-proxy-server.pump.fun/comment";

      console.log("[DEBUG] Sending comment request...");
      
      // Make the POST request
      const response = await fetch(comment_url, {
        method: "POST",
        body: JSON.stringify({
          mint: mintAddress,
          text: randomComment
        }),
        agent: agent,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AuthToken}`,
          'X-Aws-Proxy-Token': CommentToken,
          'User-Agent': requestManager.getRandomUserAgent(),
          'Origin': 'https://pump.fun',
          'Referer': 'https://pump.fun/',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-site',
          'Cookie': `auth_token=${AuthToken}`
        }
      });

      console.log(`[DEBUG] Response status: ${response.status}, statusText: ${response.statusText}`);

      // Handle proxy authentication errors
      if (response.status === 407 || response.status === 402) {
        console.error(`[ERROR] Proxy authentication error (${response.status}). Retrying with a different proxy...`);
        retryCount++;
        await delay(5000, 10000);
        continue;
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ERROR] Response body: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
      }

      // Parse and return the response
      const result = await response.json();
      console.log("[SUCCESS] Comment posted successfully:", result);
      return result;

    } catch (error) {
      console.error(`[ERROR] Attempt ${retryCount + 1}/${maxRetries} failed:`, error.message);
      retryCount++;
      if (retryCount === maxRetries) {
        throw new Error(`Max retries reached: ${error.message}`);
      }
      // Increase delay with each retry
      await delay(5000 * retryCount, 10000 * retryCount);
    }
  }
}