import { x_aws_proxy_token } from "./Auth.js";
import { comments } from "./CommentList.js";
import { proxies } from './ProxyList.js';
import { HttpsProxyAgent } from 'https-proxy-agent';

function delay(min, max) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomComment() {
  return comments[Math.floor(Math.random() * comments.length)];
}

export async function postComment(mintAddress) {
  try {
    const proxy = proxies[Math.floor(Math.random() * proxies.length)]; // Kies een proxy
    const agent = new HttpsProxyAgent(proxy); // Maak een agent aan

    const comment_url = "https://client-proxy-server.pump.fun/comment";
    const { AuthToken, CommentToken } = await x_aws_proxy_token;

    // Wacht een willekeurige tijd tussen 4 en 6 seconden
    await delay(4000, 6000);

    const randomComment = getRandomComment();

    const response = await fetch(comment_url, {
      method: "POST",
      body: JSON.stringify({
        mint: mintAddress,
        text: randomComment
      }),
      agent: agent, // Gebruik de proxy
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

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
    }

    // Verwerk de response indien nodig
    await response.json();
  } catch (error) {
    throw new Error(`Failed to post comment: ${error.message}`);
  }
}