import fetch from "node-fetch";
import { proxies } from './ProxyList.js';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { getAuthToken } from './login.js';
import { faker } from '@faker-js/faker';

function delay(min, max) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  try {
    const proxy = proxies[Math.floor(Math.random() * proxies.length)]; // Kies een proxy
    const agent = new HttpsProxyAgent(proxy); // Maak een agent aan

    const authToken = await getAuthToken();
    await delay(5000, 10000);

    const username = genUsername();
    const bio = genBio();

    const url = "https://frontend-api-v3.pump.fun/users";

    const payload = {
      "bio": bio,
      "username": username,
    };

    const headers = {
      "Cookie": `auth_token=${authToken}`,
      "Content-Type": "application/json"
    };

    const req = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
      agent: agent // Gebruik de proxy
    });

    const res = await req.json();

    if (!req.ok) {
      console.error("Failed to create profile:", JSON.stringify(res, null, 2));
    }

    //console.log(`Profile created \nUsername: ${res.username}\nBio: ${res.bio}`);
    return authToken;
  } catch (error) {
    console.error("Error:", error);
  }
}

function genUsername() {
  let username = '';
  while (username.length === 0 || username.length > 10 || !/^[a-zA-Z0-9_]+$/.test(username)) {
    username = faker.internet.userName().replace(/[^a-zA-Z0-9_]/g, '_');
  }
  return username;
}

function genBio() {
    let bioList = [
        "Chillin' in the swamp, swapping data like a pro | dat aswap.io",
        "Turning bugs into features, one ribbit at a time | dat aswap.io",
        "Swamp life, crypto dreams, and dat aswaps | data swap.io",
        "Frogs, flies, and endless da taswaps | dat aswap.io",
        "Living for the lily pads and the blockchain | dataswap.io",
        "Swamp-approved data dealer | data swap.io",
        "Croak first, ask questions later | da taswap.io",
        "Swapping data, dodging gators | dataswap.io",
        "Frog by day, d atasw ap ninja by night | dataswap.io",
        "Swamp vibes and decentralized dreams | dataswap.io",
        "Just a frog with a knack for data swaps | dat aswap.io",
        "Swamp philosopher, dat aswap enthusiast | data swap.io",
        "Ribbit-ing my way through the blockchain | dataswap .io",
        "Swamp dweller, data hustler | dat aswap.io",
        "Frogs, swaps, and endless possibilities | da taswap.io",
        "Swamp tech innovator, datasw ap pioneer | dat aswap.io",
        "Turning swamp gas into data gold | dat aswap.io",
        "Swamp life, crypto wife, and data swaps | d ataswap.io",
        "Frog legs and decentralized ledgers | dataswap.io",
        "Swapping data, one croak at a time | dataswap.io",
        "Swamp-approved data wizard | dataswap.io",
        "Frogs, flies, and a passion for dataswaps | dataswap.io",
        "Swamp dreams and blockchain schemes | dataswap.io",
        "Living for the swamp and the swap | dataswap.io",
        "Swamp explorer, d atasw ap adventurer | d ataswap.io",
        "Frogs, swaps, and a whole lot of fun | datas wap.io",
        "Swamp life, crypto strife, and dat aswa ps | dataswap.io",
        "Turning swamp water into data streams | data swa p.io",
        "Swamp-approved data guru | da ta swap.io",
        "Frogs, flies, and a love for dataswaps | dataswap.io",
        "Swamp life, crypto dreams, and endless swaps | dataswap.io",
        "Swapping data, dodging gators, living the dream | dataswap.io",
        "Swamp-approved data ninja | dataswap.io",
        "Frogs, swaps, and a whole lot of chaos | datas wap.io",
        "Swamp life, crypto wife, and endless swaps | dataswap.io",
        "Turning swamp gas into data gold, one swap at a time | dataswap.io",
        "Swamp-approved data hustler | dataswap.io",
        "Frogs, flies, and a passion for the swap | dataswap.io",
        "Swamp dreams and decentralized schemes | dataswap.io",
        "Living for the swamp and the blockchain | dataswap.io",
        "Swamp explorer, dataswap pioneer | dataswap.io",
        "Frogs, swaps, and a whole lot of fun | dataswap.io",
        "Swamp life, crypto strife, and endless swaps | dataswap.io",
        "Turning swamp water into data streams, one swap at a time | dataswap.io",
        "Swamp-approved data wizard | dataswap.io",
        "Frogs, flies, and a love for the swap | dataswap.io",
        "Swamp life, crypto dreams, and endless possibilities | dataswap.io",
        "Swapping data, dodging gators, living the dream | dataswap.io",
        "Swamp-approved data ninja | dataswap.io",
        "Frogs, swaps, and a whole lot of chaos | dataswap.io",
        "Swamp life, crypto wife, and endless swaps | dataswap.io",
        "Turning swamp gas into data gold, one swap at a time | dataswap.io",
        "Swamp-approved data hustler | dataswap.io",
        "Frogs, flies, and a passion for the swap | dataswap.io",
        "Swamp dreams and decentralized schemes | dataswap.io",
        "Living for the swamp and the blockchain | dataswap.io",
        "Swamp explorer, dataswap pioneer | dataswap.io",
        "Frogs, swaps, and a whole lot of fun | dataswap.io",
        "Swamp life, crypto strife, and endless swaps | dataswap.io",
        "Turning swamp water into data streams, one swap at a time | dataswap.io",
        "Swamp-approved data wizard | dataswap.io",
        "Frogs, flies, and a love for the swap | dataswap.io",
        "Swamp life, crypto dreams, and endless possibilities | dataswap.io",
        "Swapping data, dodging gators, living the dream | dataswap.io",
        "Swamp-approved data ninja | dataswap.io",
        "Frogs, swaps, and a whole lot of chaos | dataswap.io",
        "Swamp life, crypto wife, and endless swaps | dataswap.io",
        "Turning swamp gas into data gold, one swap at a time | dataswap.io",
        "Swamp-approved data hustler | dataswap.io",
        "Frogs, flies, and a passion for the swap | dataswap.io",
        "Swamp dreams and decentralized schemes | dataswap.io",
        "Living for the swamp and the blockchain | dataswap.io",
        "Swamp explorer, dataswap pioneer | dataswap.io",
        "Frogs, swaps, and a whole lot of fun | dataswap.io",
        "Swamp life, crypto strife, and endless swaps | dataswap.io",
        "Turning swamp water into data streams, one swap at a time | dataswap.io",
        "Swamp-approved data wizard | dataswap.io",
        "Frogs, flies, and a love for the swap | dataswap.io",
        "Swamp life, crypto dreams, and endless possibilities | dataswap.io",
        "Swapping data, dodging gators, living the dream | dataswap.io",
        "Swamp-approved data ninja | dataswap.io",
        "Frogs, swaps, and a whole lot of chaos | dataswap.io",
        "Swamp life, crypto wife, and endless swaps | dataswap.io",
        "Turning swamp gas into data gold, one swap at a time | dataswap.io",
        "Swamp-approved data hustler | dataswap.io",
        "Frogs, flies, and a passion for the swap | dataswap.io",
        "Swamp dreams and decentralized schemes | dataswap.io",
        "Living for the swamp and the blockchain | dataswap.io",
        "Swamp explorer, dataswap pioneer | dataswap.io",
        "Frogs, swaps, and a whole lot of fun | dataswap.io",
        "Swamp life, crypto strife, and endless swaps | dataswap.io",
        "Turning swamp water into data streams, one swap at a time | dataswap.io",
        "Swamp-approved data wizard | dataswap.io",
        "Frogs, flies, and a love for the swap | dataswap.io",
        "Swamp life, crypto dreams, and endless possibilities | dataswap.io",
        "Swapping data, dodging gators, living the dream | dataswap.io",
        "Swamp-approved data ninja | dataswap.io",
        "Frogs, swaps, and a whole lot of chaos | dataswap.io",
        "Swamp life, crypto wife, and endless swaps | dataswap.io",
        "Turning swamp gas into data gold, one swap at a time | dataswap.io",
        "Swamp-approved data hustler | dataswap.io",
        "Frogs, flies, and a passion for the swap | dataswap.io",
        "Swamp dreams and decentralized schemes | dataswap.io",
        "Living for the swamp and the blockchain | dataswap.io",
        "Swamp explorer, dataswap pioneer | dataswap.io",
        "Frogs, swaps, and a whole lot of fun | dataswap.io",
        "Swamp life, crypto strife, and endless swaps | dataswap.io",
        "Turning swamp water into data streams, one swap at a time | dataswap.io",
        "Swamp-approved data wizard | dataswap.io",
        "Frogs, flies, and a love for the swap | dataswap.io",
        "Swamp life, crypto dreams, and endless possibilities | dataswap.io",
        "Swapping data, dodging gators, living the dream | dataswap.io",
        "Swamp-approved data ninja | dataswap.io",
        "Frogs, swaps, and a whole lot of chaos | dataswap.io",
        "Swamp life, crypto wife, and endless swaps | dataswap.io",
        "Turning swamp gas into data gold, one swap at a time | dataswap.io",
        "Swamp-approved data hustler | dataswap.io",
        "Frogs, flies, and a passion for the swap | dataswap.io",
        "Swamp dreams and decentralized schemes | dataswap.io",
        "Living for the swamp and the blockchain | dataswap.io",
        "Swamp explorer, dataswap pioneer | dataswap.io",
        "Frogs, swaps, and a whole lot of fun | dataswap.io",
        "Swamp life, crypto strife, and endless swaps | dataswap.io",
        "Turning swamp water into data streams, one swap at a time | dataswap.io",
        "Swamp-approved data wizard | dataswap.io",
        "Frogs, flies, and a love for the swap | dataswap.io",
        "Swamp life, crypto dreams, and endless possibilities | dataswap.io",
        "Swapping data, dodging gators, living the dream | dataswap.io",
        "Swamp-approved data ninja | dataswap.io",
        "Frogs, swaps, and a whole lot of chaos | dataswap.io",
        "Swamp life, crypto wife, and endless swaps | dataswap.io",
        "Turning swamp gas into data gold, one swap at a time | dataswap.io",
        "Swamp-approved data hustler | dataswap.io",
        "Frogs, flies, and a passion for the swap | dataswap.io",
        "Swamp dreams and decentralized schemes | dataswap.io",
        "Living for the swamp and the blockchain | dataswap.io",
        "Swamp explorer, dataswap pioneer | dataswap.io",
        "Frogs, swaps, and a whole lot of fun | dataswap.io",
        "Swamp life, crypto strife, and endless swaps | dataswap.io",
        "Turning swamp water into data streams, one swap at a time | dataswap.io",
        "Swamp-approved data wizard | dataswap.io",
        "Frogs, flies, and a love for the swap | dataswap.io",
        "Swamp life, crypto dreams, and endless possibilities | dataswap.io",
        "Swapping data, dodging gators, living the dream | dataswap.io",
        "Swamp-approved data ninja | dataswap.io",
        "Frogs, swaps, and a whole lot of chaos | dataswap.io",
        "Swamp life, crypto wife, and endless swaps | dataswap.io",
        "Turning swamp gas into data gold, one swap at a time | dataswap.io",
        "Swamp-approved data hustler | dataswap.io",
        "Frogs, flies, and a passion for the swap | dataswap.io",
        "Swamp dreams and decentralized schemes | dataswap.io",
        "Living for the swamp and the blockchain | dataswap.io",
        "Swamp explorer, dataswap pioneer | dataswap.io",
        "Frogs, swaps, and a whole lot of fun | dataswap.io",
        "Swamp life, crypto strife, and endless swaps | dataswap.io",
        "Turning swamp water into data streams, one swap at a time | dataswap.io",
        "Swamp-approved data wizard | dataswap.io",
        "Frogs, flies, and a love for the swap | dataswap.io",
        "Swamp life, crypto dreams, and endless possibilities | dataswap.io",
        "Swapping data, dodging gators, living the dream | dataswap.io",
        "Swamp-approved data ninja | dataswap.io",
        "Frogs, swaps, and a whole lot of chaos | dataswap.io",
        "Swamp life, crypto wife, and endless swaps | dataswap.io",
        "Turning swamp gas into data gold, one swap at a time | dataswap.io",
        "Swamp-approved data hustler | dataswap.io",
        "Frogs, flies, and a passion for the swap | dataswap.io",
        "Swamp dreams and decentralized schemes | dataswap.io",
        "Living for the swamp and the blockchain | dataswap.io",
        "Swamp explorer, dataswap pioneer | dataswap.io",
        "Frogs, swaps, and a whole lot of fun | dataswap.io",
        "Swamp life, crypto strife, and endless swaps | dataswap.io",
        "Turning swamp water into data streams, one swap at a time | dataswap.io",
        "Swamp-approved data wizard | dataswap.io",
        "Frogs, flies, and a love for the swap | dataswap.io",
        "Swamp life, crypto dreams, and endless possibilities | dataswap.io",
        "Swapping data, dodging gators, living the dream | dataswap.io",
        "Swamp-approved data ninja | dataswap.io",
        "Frogs, swaps, and a whole lot of chaos | dataswap.io",
        "Swamp life, crypto wife, and endless swaps | dataswap.io",
        "Turning swamp gas into data gold, one swap at a time | dataswap.io",
        "Swamp-approved data hustler | dataswap.io",
        "Frogs, flies, and a passion for the swap | dataswap.io",
        "Swamp dreams and decentralized schemes | dataswap.io",
        "Living for the swamp and the blockchain | dataswap.io",
        "Swamp explorer, dataswap pioneer | dataswap.io",
        "Frogs, swaps, and a whole lot of fun | dataswap.io",
        "Swamp life, crypto strife, and endless swaps | dataswap.io",
        "Turning swamp water into data streams, one swap at a time | dataswap.io",
        "Swamp-approved data wizard | dataswap.io",
        "Frogs, flies, and a love for the swap | dataswap.io",
        "Swamp life, crypto dreams, and endless possibilities | dataswap.io",
        "Swapping data, dodging gators, living the dream | dataswap.io",
        "Swamp-approved data ninja | dataswap.io",
        "Frogs, swaps, and a whole lot of chaos | dataswap.io",
        "Swamp life, crypto wife, and endless swaps | dataswap.io",
        "Turning swamp gas into data gold, one swap at a time | dataswap.io",
        "Swamp-approved data hustler | dataswap.io",
        "Frogs, flies, and a passion for the swap | dataswap.io",
        "Swamp dreams and decentralized schemes | dataswap.io",
        "Living for the swamp and the blockchain | dataswap.io",
        "Swamp explorer, dataswap pioneer | dataswap.io",
        "Frogs, swaps, and a whole lot of fun | dataswap.io",
        "Swamp life, crypto strife, and endless swaps | dataswap.io",
        "Turning swamp water into data streams, one swap at a time | dataswap.io",
        "Swamp-approved data wizard | dataswap.io",
        "Frogs, flies, and a love for the swap | dataswap.io",
        "Swamp life, crypto dreams, and endless possibilities | dataswap.io",
        "Swapping data, dodging gators, living the dream | dataswap.io",
        "Swamp-approved data ninja | dataswap.io",
        "Frogs, swaps, and a whole lot of chaos | dataswap.io",
        "Swamp life, crypto wife, and endless swaps | dataswap.io",
        "Turning swamp gas into data gold, one swap at a time | dataswap.io",
        "Swamp-approved data hustler | dataswap.io",
        "Frogs, flies, and a passion for the swap | dataswap.io",
        "Swamp dreams and decentralized schemes | dataswap.io",
        "Living for the swamp and the blockchain | dataswap.io",
        "Swamp explorer, dataswap pioneer | dataswap.io",
        "Frogs, swaps, and a whole lot of fun | dataswap.io",
        "Swamp life, crypto strife, and endless swaps | dataswap.io",
        "Turning swamp water into data streams, one swap at a time | dataswap.io",
        "Swamp-approved data wizard | dataswap.io",
        "Frogs, flies, and a love for the swap | dataswap.io",
        "Swamp life, crypto dreams, and endless possibilities | dataswap.io",
        "Swapping data, dodging gators, living the dream | dataswap.io",
        "Swamp-approved data ninja | dataswap.io",
        "Frogs, swaps, and a whole lot of chaos | dataswap.io",
        "Swamp life, crypto wife, and endless swaps | dataswap.io",
        "Turning swamp gas into data gold, one swap at a time | dataswap.io",
        "Swamp-approved data hustler | dataswap.io",
        "Frogs, flies, and a passion for the swap | dataswap.io",
        "Swamp dreams and decentralized schemes | dataswap.io",
        "Living for the swamp and the blockchain | dataswap.io",
        "Swamp explorer, dataswap pioneer | dataswap.io",
        "Frogs, swaps, and a whole lot of fun | dataswap.io",
        "Swamp life, crypto strife, and endless swaps | dataswap.io",
        "Turning swamp water into data streams, one swap at a time | dataswap.io",
        "Swamp-approved data wizard | dataswap.io",
        "Frogs, flies, and a love for the swap | dataswap.io",
        "Swamp life, crypto dreams, and endless possibilities | dataswap.io",
        "Swapping data, dodging gators, living the dream | dataswap.io",
        "Swamp-approved data ninja | dataswap.io",
        "Frogs, swaps, and a whole lot of chaos | dataswap.io",
        "Swamp life, crypto wife, and endless swaps | dataswap.io",
        "Turning swamp gas into data gold, one swap at a time | dataswap.io",
        "Swamp-approved data hustler | dataswap.io",
        "Frogs, flies, and a passion for the swap | dataswap.io"
    ];

    let randomChoice = Math.floor(Math.random() * bioList.length);
    return bioList[randomChoice];
}


export const Auth_Comment = main();
