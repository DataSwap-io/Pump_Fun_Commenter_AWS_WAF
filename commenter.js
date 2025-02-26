import { x_aws_proxy_token } from "./Auth.js";
import { comments } from "./CommentList.js";
import { proxies } from './ProxyList.js';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch from "node-fetch";
import dns from 'dns';

// Helper function to introduce a random delay
function delay(min, max) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to get a random comment from the list
function getRandomComment() {
  return comments[Math.floor(Math.random() * comments.length)];
}

// Function to parse a proxy URL into its components
function parseProxyUrl(proxyUrl) {
  try {
    const url = new URL(proxyUrl);
    return {
      host: url.hostname,
      port: url.port || 80,
      auth: url.username && url.password 
        ? `${url.username}:${url.password}`
        : undefined,
      protocol: url.protocol.replace(':', '')
    };
  } catch (error) {
    console.error("Invalid proxy URL:", proxyUrl);
    return null;
  }
}

// Main function to post a comment
export async function postComment(mintAddress) {
  let retryCount = 0;
  const maxRetries = 3;

  while (retryCount < maxRetries) {
    try {
      // Select a random proxy from the list
      const proxy = proxies[Math.floor(Math.random() * proxies.length)];
      console.log("[DEBUG] Using proxy:", proxy);

      // Parse the proxy URL
      const proxyConfig = parseProxyUrl(proxy);
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
        family: 4
      });

      // Fetch the AWS proxy tokens
      const { AuthToken, CommentToken } = await x_aws_proxy_token;

      // Introduce a random delay between 4 and 6 seconds
      await delay(4000, 6000);

      // Get a random comment
      const randomComment = getRandomComment();

      // Define the comment URL
      const comment_url = "https://client-proxy-server.pump.fun/comment";

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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
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

      // Handle proxy authentication errors (status code 407)
      if (response.status === 407) {
        console.error("Proxy authentication error. Retrying with a different proxy...");
        retryCount++;
        await delay(5000);
        continue;
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
      }

      // Parse and return the response
      const result = await response.json();
      console.log("[DEBUG] Comment posted successfully:", result);
      return result;

    } catch (error) {
      console.error(`Attempt ${retryCount + 1} failed: ${error.message}`);
      retryCount++;
      if (retryCount === maxRetries) {
        throw new Error(`Max retries reached: ${error.message}`);
      }
      await delay(5000); // Wait before retrying
    }
  }
}
