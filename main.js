import { RequestManager } from './utils.js';
import { mintEmitter } from './newMintsEmitter.js';
import { fork } from 'child_process';
import { proxies } from './ProxyList.js';
import dns from 'dns';

// Set DNS resolution order directly
dns.setDefaultResultOrder('ipv4first');

// Create and initialize the RequestManager
const requestManager = new RequestManager(proxies);
let activeRequests = 0;
const MAX_CONCURRENT = 3;

// Initialize proxies before starting
(async () => {
  console.log("Initializing proxies...");
  await requestManager.initializeProxies(proxies);
  console.log("Proxy initialization complete, starting mint listener");
  
  // Start listening for mints only after proxies are initialized
  startMintListener();
})();

function startMintListener() {
  mintEmitter.on('newMint', async (mintedAddress) => {
    if (activeRequests >= MAX_CONCURRENT) {
      console.log(`Already processing ${activeRequests} requests. Will try again later for ${mintedAddress}`);
      await requestManager.humanizedDelay(5000, 10000);
      return;
    }

    activeRequests++;
    console.log(`Processing mint: ${mintedAddress} (Active requests: ${activeRequests}/${MAX_CONCURRENT})`);
    
    try {
      const proxy = await requestManager.getAvailableProxy();
      if (!proxy) {
        console.log('No proxies available, waiting...');
        await requestManager.humanizedDelay(30000, 60000);
        activeRequests--;
        return;
      }

      console.log(`New mint: ${mintedAddress}, using proxy: ${proxy}`);
      
      // Pass the proxy as an argument to test.js
      const child = fork('./test.js', [mintedAddress, proxy]);

      child.on('error', (err) => {
        console.error('Error in test.js:', err);
        activeRequests--;
      });

      child.on('exit', (code) => {
        console.log(`test.js exited with code ${code} for mint: ${mintedAddress}`);
        activeRequests--;
      });
    } catch (error) {
      console.error('Error processing mint:', error);
      activeRequests--;
    }
  });
  
  console.log("Mint listener started successfully");
}