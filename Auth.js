import { Auth_Comment } from './Create_Acc.js';
import { proxies } from './ProxyList.js';
import { HttpsProxyAgent } from 'https-proxy-agent';


function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const url = "https://frontend-api-v3.pump.fun/token/generateTokenForThread";

async function generateToken() {
  try {
    const proxy = proxies[Math.floor(Math.random() * proxies.length)]; // Kies een proxy
    const agent = new HttpsProxyAgent(proxy); // Maak een agent aan

    const authToken = await Auth_Comment;
    await delay(6130);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `auth_token=${authToken}`,
      },
      agent: agent, // Gebruik de proxy
      credentials: "include"
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return {
      AuthToken: authToken,
      CommentToken: data.token
    };
  } catch (error) {
    throw error;
  }
}

export const x_aws_proxy_token = generateToken();