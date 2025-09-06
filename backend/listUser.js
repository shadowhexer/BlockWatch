const fs = require("fs");
const path = require("path");
const { Wallets } = require("fabric-network");

async function listUsersInWallet() {
  try {
    const walletPath = path.resolve(
      "/home",
      "nikohackto",
      "blockchain",
      "fabric-samples",
      "asset-transfer-basic",
      "application-gateway-javascript",
      "wallet"
    );

    // Log the wallet path
    console.log("Wallet Path:", walletPath);

    // Load the wallet
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // List all identities in the wallet
    const identities = await wallet.list();

    if (identities.length === 0) {
      console.log("No identities found in the wallet.");
    } else {
      console.log("Identities in the wallet:");
      identities.forEach((identity) => {
        console.log(`- ${identity}`);
      });
    }
  } catch (error) {
    console.error("Error listing identities in the wallet:", error.message);
  }
}

// Call the function to list users
listUsersInWallet();
