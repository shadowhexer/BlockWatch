import fs from "fs";
import path from "path";
import { Gateway, Wallets } from "fabric-network"; // Assuming you're using Hyperledger Fabric SDK
import mysql from "mysql2"; // Importing mysql2 for MySQL database connection

import dotenv from "dotenv"; // This loads the environment variables from your .env file

// Initialize dotenv for environment variables
dotenv.config();

const mysqlConnection = mysql.createConnection({
  host: process.env.DB_HOST || "localhost", // Replace with your actual database host
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Nik@1631",
  database: process.env.DATABASE || "crime_report_db", // Replace with your actual database name
});

// Utility function to connect to Fabric Gateway
async function connectToFabric(userIdentity) {
  const walletPath = path.resolve(
    "/home",
    "nikohackto",
    "blockchain",
    "fabric-samples",
    "asset-transfer-basic",
    "application-gateway-javascript",
    "wallet"
  );

  const ccpPathOrg1 = path.resolve(
    "/home",
    "nikohackto",
    "blockchain",
    "fabric-samples",
    "test-network",
    "organizations",
    "peerOrganizations",
    "org1.example.com",
    "connection-org1.json"
  );

  const ccpPathOrg2 = path.resolve(
    "/home",
    "nikohackto",
    "blockchain",
    "fabric-samples",
    "test-network",
    "organizations",
    "peerOrganizations",
    "org2.example.com",
    "connection-org2.json"
  );

  const wallet = await Wallets.newFileSystemWallet(walletPath);
  const gateway = new Gateway();

  try {
    // Determine the connection profile and organization MSP based on user identity
    let ccp;
    let orgMSP;

    if (userIdentity === "Mahay") {
      ccp = JSON.parse(fs.readFileSync(ccpPathOrg1, "utf8"));
      orgMSP = "Org1MSP"; // Set the organization for Mahay
    } else if (userIdentity === "Buenavista") {
      ccp = JSON.parse(fs.readFileSync(ccpPathOrg2, "utf8"));
      orgMSP = "Org2MSP"; // Set the organization for Beunavista
    } else if (userIdentity === "org1-admin") {
      ccp = JSON.parse(fs.readFileSync(ccpPathOrg1, "utf8"));
      orgMSP = "Org1MSP"; // Default to Org1 for 'org1-admin'
    } else if (userIdentity === "org2-admin") {
      ccp = JSON.parse(fs.readFileSync(ccpPathOrg2, "utf8"));
      orgMSP = "Org2MSP"; // Default to Org2 for 'org2-admin'
    } else {
      throw new Error(`Unsupported identity: ${userIdentity}`);
    }

    // Connect to the Fabric Gateway using the provided user identity and MSP
    await gateway.connect(ccp, {
      wallet,
      identity: userIdentity, // Use the user identity passed to the function
      discovery: { enabled: true, asLocalhost: true },
    });

    console.log(
      `✅ Connected to Fabric Gateway as ${userIdentity} in ${orgMSP}`
    );

    // Return both success status and gateway object for further use
    return {
      success: true,
      message: `Connected to Fabric Gateway as ${userIdentity} in ${orgMSP}`,
      gateway, // Return the gateway object to allow further interactions
    };
  } catch (error) {
    console.error("❌ Failed to connect to Fabric:", error.message);
    return { success: false, message: error.message };
  }
}

export { connectToFabric, mysqlConnection };
