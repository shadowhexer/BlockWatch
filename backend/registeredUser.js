const mysql = require("mysql2"); // MySQL package
const fs = require("fs");
const path = require("path");
const { Wallets } = require("fabric-network"); // Hyperledger Fabric SDK

// ✅ Configure MySQL connection
const mysqlConnection = mysql.createConnection({
  host: "localhost", // MySQL host
  user: "root", // MySQL user
  password: "Nik@1631", // MySQL password
  database: "crime_report_db", // Database name
});

// Function to fetch identities from the Fabric wallet and insert them into MySQL (excluding admin identities)
async function fetchAndInsertIdentities() {
  const walletPath = path.resolve(
    __dirname,
    "..",
    "blockchain",
    "fabric-samples",
    "asset-transfer-basic",
    "application-gateway-javascript",
    "wallet"
  );

  const wallet = await Wallets.newFileSystemWallet(walletPath);

  try {
    // Fetch all identities stored in the wallet
    const identities = await wallet.list();

    if (identities.length === 0) {
      console.log("❌ No identities found in the wallet.");
      return;
    }

    console.log("✅ Registered Users in Wallet:");
    identities.forEach((identity) => {
      console.log(`- ${identity}`);
    });

    // Filter out identities that are not user identities (exclude admin identities)
    const userIdentities = identities.filter(
      (identity) => !identity.includes("admin")
    );

    if (userIdentities.length === 0) {
      console.log("❌ No user identities to insert.");
      return;
    }

    // Insert the filtered user identities into MySQL if they don't already exist
    for (const identity of userIdentities) {
      // First check if the identity already exists in the table
      const checkQuery =
        "SELECT COUNT(*) AS count FROM registeredUser WHERE barangay = ?";

      mysqlConnection.query(checkQuery, [identity], (err, results) => {
        if (err) {
          console.error(
            "❌ Error checking for existing identity:",
            err.message
          );
        } else {
          // If identity doesn't exist (count is 0), insert it
          if (results[0].count === 0) {
            const query = "INSERT INTO registeredUser (barangay) VALUES (?)";
            mysqlConnection.query(query, [identity], (err, results) => {
              if (err) {
                console.error("❌ Error inserting user:", err.message);
              } else {
                console.log(`✅ User ${identity} inserted into MySQL`);
              }
            });
          } else {
            console.log(`❌ User ${identity} already exists in the database`);
          }
        }
      });
    }
  } catch (error) {
    console.error("❌ Failed to fetch identities from wallet:", error.message);
  }
}

// Automatically run the function to fetch and insert user identities into MySQL
fetchAndInsertIdentities()
  .then(() => {
    console.log("✅ Identity fetch and insert completed.");
  })
  .catch((error) => {
    console.error("❌ Error during fetch and insert:", error.message);
  });
