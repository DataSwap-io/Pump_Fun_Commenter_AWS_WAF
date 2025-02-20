import { RequestManager } from './utils.js';
import { mintEmitter } from './newMintsEmitter.js';
import { fork } from 'child_process';
import { proxies } from './ProxyList.js';

process.env.NODE_OPTIONS = '--dns-result-order=ipv4first';


const requestManager = new RequestManager(proxies);
let activeRequests = 0;
const MAX_CONCURRENT = 3; // Limit concurrent requests

mintEmitter.on('newMint', async (mintedAddress) => {
  if (activeRequests >= MAX_CONCURRENT) {
    await requestManager.humanizedDelay(5000, 10000);
    return;
  }

  activeRequests++;
  
  try {
    const proxy = await requestManager.getAvailableProxy();
    if (!proxy) {
      console.log('No proxies available, waiting...');
      await requestManager.humanizedDelay(30000, 60000);
      activeRequests--;
      return;
    }

    console.log(`New mint: ${mintedAddress}, using proxy: ${proxy}`);
    
    const child = fork('./test.js', [mintedAddress, proxy]);

    child.on('error', (err) => {
      console.error('Error in test.js:', err);
      activeRequests--;
    });

    child.on('exit', (code) => {
      console.log(`test.js exited with code ${code}`);
      activeRequests--;
    });
  } catch (error) {
    console.error('Error processing mint:', error);
    activeRequests--;
  }
});
