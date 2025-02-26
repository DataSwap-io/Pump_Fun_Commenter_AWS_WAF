// test.js

import { postComment } from './commenter.js';

// Haal mintedAddress op uit de argumenten
const mintedAddress = process.argv[2];

if (!mintedAddress) {
  console.error("Geen mint-adres opgegeven aan test.js!");
  process.exit(1);
}

// Plaats de comment en log het resultaat
postComment(mintedAddress)
  .then(() => {
    console.log(`Comment succesvol gepost voor mint: ${mintedAddress}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`Fout bij het posten van comment voor ${mintedAddress}: ${error}`);
    process.exit(1);
  });
