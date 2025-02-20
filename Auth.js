import { Auth_Comment } from './Create_Acc.js';
import { proxies } from './ProxyList.js';
import { HttpsProxyAgent } from 'https-proxy-agent';
import dns from 'dns';

process.env.NODE_OPTIONS = '--dns-result-order=ipv4first';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const url = "https://frontend-api-v3.pump.fun/token/generateTokenForThread";

async function generateToken() {
  try {
    const proxy = proxies[Math.floor(Math.random() * proxies.length)]; 
    console.log("[DEBUG] Gebruikte proxy:", proxy);
    const agent = new HttpsProxyAgent({
      host: proxy.split(':')[0],
      port: proxy.split(':')[1],
      protocol: 'http:',
      rejectUnauthorized: false,
      family: 4,
      lookup: (hostname, options, callback) => {
        dns.lookup(hostname, { family: 4 }, callback);
      }
    });

    const authToken = await Auth_Comment();
    await delay(6130);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `auth_token=${authToken}`,
      },
      agent: agent,
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
