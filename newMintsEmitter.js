// newMintsEmitter.js

import WebSocket from 'ws';
import { EventEmitter } from 'events';

export const mintEmitter = new EventEmitter();

function subscribeToNewMints() {
  const ws = new WebSocket('wss://pumpportal.fun/api/data');

  ws.on('open', () => {
    const payload = { method: "subscribeNewToken" };
    ws.send(JSON.stringify(payload));
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      if (message && message.mint) {
        const mintedAddress = message.mint;
        // Emit het 'newMint'-event met het nieuwe adres
        mintEmitter.emit('newMint', mintedAddress);
      }
    } catch (error) {
      console.error('Fout bij het parsen van bericht:', error);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket fout:', error);
  });

  ws.on('close', () => {
    console.log('WebSocket-verbinding gesloten');
    // Eventueel opnieuw verbinden:
    // subscribeToNewMints();
  });
}

// Start de verbinding zodat je blijft luisteren
subscribeToNewMints();
