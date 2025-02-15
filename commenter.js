import { RequestManager } from './utils.js';
import { x_aws_proxy_token } from "./Auth.js";
import { comments } from "./CommentList.js";
import { proxies } from './ProxyList.js';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { v4 as uuidv4 } from 'uuid';

const requestManager = new RequestManager(proxies);

function getRandomComment() {
  return comments[Math.floor(Math.random() * comments.length)];
}

export async function postComment(mintAddress) {
  const sessionId = uuidv4();
  
  try {
    const proxy = requestManager.getAvailableProxy();
    if (!proxy) {
      await requestManager.humanizedDelay(30000, 60000); // Wait if no proxy available
      return postComment(mintAddress); // Retry
    }

    const agent = new HttpsProxyAgent(proxy);
    const comment_url = "https://client-proxy-server.pump.fun/comment";
    const { AuthToken, CommentToken } = await x_aws_proxy_token;

    // More natural delay between 4-8 seconds with jitter
    await requestManager.humanizedDelay(4000, 8000);

    const randomComment = getRandomComment();
    const headers = requestManager.getHeaders(AuthToken, sessionId);

    const response = await fetch(comment_url, {
      method: "POST",
      body: JSON.stringify({
        mint: mintAddress,
        text: randomComment
      }),
      agent: agent,
      headers: {
        ...headers,
        'Authorization': `Bearer ${AuthToken}`,
        'X-Aws-Proxy-Token': CommentToken
      }
    });

    if (!response.ok) {
      if (response.status === 403) {
        // CAPTCHA detected, increase delay and retry with different proxy
        await requestManager.humanizedDelay(15000, 30000);
        return postComment(mintAddress);
      }
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error posting comment: ${error.message}`);
    await requestManager.humanizedDelay(10000, 20000);
    throw error;
  }
}
