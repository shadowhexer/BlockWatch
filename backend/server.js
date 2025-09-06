const fs = require("fs");
const https = require("https");
const http = require("http");
const express = require("express");
const session = require("express-session");
const cors = require("cors");
const { Gateway, Wallets } = require("fabric-network");
const path = require("path");
const crypto = require("crypto"); // Import crypto for hashing
const bcrypt = require("bcrypt");
const multer = require("multer");
const upload = multer(); // no disk storage, just memory
const validator = require("validator");
require("dotenv").config(); // This loads the environment variables from your .env file

const app = express();

const { classifyCrime } = require("./crimedetector"); // Import the crime classification function
const { connectToFabric, mysqlConnection } = require("./fabricConnector"); // Your connection function

app.use(
  cors({
    origin: "http://localhost:5173", // Specify your frontend origin here
    credentials: true, // Allow cookies and session credentials
  })
);

// Session setup (with cookie configuration)
app.use(
  session({
    secret: "Nik@16310909!@", // Replace with a strong secret
    resave: false,
    saveUninitialized: false,
  })
);

// Middleware for parsing JSON body data
app.use(express.json());

// ✅ Serve frontend from 'crime-system' folder
app.use(express.static(path.join(__dirname, "UI", "dist")));

// Route to check session for user identity
app.get("/get-identity-session", (req, res) => {
  console.log("Session data:", req.session);
  if (req.session.userIdentity) {
    return res.json({ success: true, userIdentity: req.session.userIdentity });
  }
  return res
    .status(400)
    .json({ success: false, message: "No user identity found in session" });
});

// POST /connect route to set userIdentity in the session
app.post("/connect", async (req, res) => {
  const { userIdentity } = req.body;

  try {
    if (!userIdentity) {
      return res.status(400).json({
        success: false,
        message: "User identity is required",
      });
    }

    // Attempt to connect to the Fabric network (replace with actual logic)
    const fabricConnection = await connectToFabric(userIdentity);

    if (fabricConnection.success) {
      // Store userIdentity in the session
      req.session.userIdentity = userIdentity;

      res.json({
        success: true,
        message: `Successfully connected as ${userIdentity} to Fabric network`,
      });
    } else {
      res.status(500).json({
        success: false,
        message: `Failed to connect to Fabric network: ${fabricConnection.message}`,
      });
    }
  } catch (error) {
    console.error("Error during Fabric connection:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while connecting to the Fabric network.",
    });
  }
});

// ✅ Function to generate the hash of the crime report data
function generateHash(crimeId, description, date, status) {
  const dataString = `${crimeId}${description}${date}${status}`;
  return crypto.createHash("sha256").update(dataString).digest("hex");
}

// ✅ Function to get the original hash from Hyperledger Fabric (Blockchain)
async function getBlockchainHash(crimeId) {
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  const gateway = new Gateway();

  try {
    await gateway.connect(JSON.parse(fs.readFileSync(ccpPath, "utf8")), {
      wallet,
      identity: "appUser", // Ensure 'appUser' exists in the wallet
      discovery: { enabled: true, asLocalhost: true },
    });

    const network = await gateway.getNetwork("mychannel");
    const contract = network.getContract("app");

    // Query blockchain for the crime report hash
    const result = await contract.evaluateTransaction("readCrime", crimeId);
    return result.toString(); // The original hash from the blockchain
  } catch (error) {
    console.error(`❌ Error retrieving hash from blockchain: ${error.message}`);
    return null;
  } finally {
    await gateway.disconnect();
  }
}

app.post("/updateAssignmentStatus", async (req, res) => {
  const { crime_id, status } = req.body;

  try {
    // Use promise-based query for MySQL
    const [result] = await mysqlConnection
      .promise()
      .query("UPDATE assignments SET status = ? WHERE crime_id = ?", [
        status,
        crime_id,
      ]);

    // Check if the update affected any rows
    if (result.affectedRows > 0) {
      console.log("MySQL: Assignment status updated successfully");

      // Attempt to connect to the Fabric network
      try {
        // Connect to Fabric using user identity and orgMSP
        const gatewayResponse = await connectToFabric("Mahay", "Org1MSP");
        if (!gatewayResponse.success) {
          return res.status(500).json({ error: "Failed to connect to Fabric" });
        }

        const gateway = gatewayResponse.gateway;
        // Check if gateway is valid and connected
        if (!gateway || !gateway.getNetwork) {
          return res
            .status(500)
            .json({ error: "Failed to get network from Fabric Gateway" });
        }
        const crimeId = String(crime_id);
        const newStatus = String(status);
        const network = await gateway.getNetwork("mychannel");
        const contract = network.getContract("app");

        await contract.submitTransaction(
          "updateAssignmentStatus",
          crimeId,
          newStatus
        );
        console.log(`Crime report ${crimeId} status updated to: ${newStatus}`);
        // Disconnect from Fabric after the transaction is complete
        gateway.disconnect();

        res.json({
          message: `✅ Crime report ${crimeId} updated to status: ${newStatus}`,
        });
      } catch (fabricError) {
        console.error("❌ Fabric submit error:", fabricError.message);
        return res.status(500).json({
          error: `Failed to update Fabric data: ${fabricError.message}`,
        });
      }
    } else {
      return res
        .status(400)
        .send({ error: "Failed to update assignment in MySQL" });
    }
  } catch (err) {
    console.error("Error updating assignment:", err);
    return res.status(500).send({ error: "Server error" });
  }
});

// ✅ POST /report → submit a new crime
app.post("/report", upload.none(), async (req, res) => {
  const { description, anonyname, userIdentity } = req.body; // Receive data from the request body
  const status = req.body.status || "unread";
  const date = new Date().toISOString().slice(0, 19).replace("T", " "); // 'YYYY-MM-DD HH:MM:SS'

  // Validate required fields
  if (!description || !date || !status || !anonyname || !userIdentity) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Generate hash
    const dataHash = generateHash(description, date, status);

    // Retrieve identity from the database (use promise-based API)
    const [identityResult] = await mysqlConnection
      .promise()
      .query("SELECT id FROM registeredUser WHERE barangay = ?", [
        userIdentity,
      ]);

    // Check if identity exists
    if (identityResult.length === 0) {
      return res.status(404).json({ error: "User identity not found" });
    }

    const identity = identityResult[0].id; // Get the user id from the result

    const crimeCategory = classifyCrime({ description }); // Classify the crime based on the description

    // Insert into MySQL
    const [insertResult] = await mysqlConnection
      .promise()
      .query(
        "INSERT INTO crime_reports (description, date, status, data_hash, anonyname, rb_id, category) VALUES (?, ?, ?, ?, ?, ?,?)",
        [
          description,
          date,
          status,
          dataHash,
          anonyname,
          identity,
          crimeCategory,
        ]
      );

    const insertedId = insertResult.insertId;

    // Retrieve the full record
    const [rows] = await mysqlConnection
      .promise()
      .query("SELECT * FROM crime_reports WHERE crime_id = ?", [insertedId]);

    const record = rows[0]; // Full record

    if (!userIdentity) {
      return res
        .status(400)
        .json({ error: "User identity is not found in the session" });
    }

    try {
      // Connect to Fabric using userIdentity and orgMSP based on user identity
      const orgMSP = userIdentity === "Mahay" ? "Org1MSP" : "Org2MSP"; // Set OrgMSP based on user identity
      const gatewayResponse = await connectToFabric(userIdentity, orgMSP); // Use the session's user identity
      if (!gatewayResponse.success) {
        return res.status(500).json({ error: "Failed to connect to Fabric" });
      }

      const gateway = gatewayResponse.gateway;

      // Check if gateway is valid and connected
      if (!gateway || !gateway.getNetwork) {
        return res
          .status(500)
          .json({ error: "Failed to get network from Fabric Gateway" });
      }
      const network = await gateway.getNetwork("mychannel");
      const contract = network.getContract("app");

      // Send full record to Fabric
      await contract.submitTransaction(
        "reportCrime",
        String(record.crime_id),
        String(record.description),
        String(record.date),
        String(record.status),
        String(record.data_hash),
        String(record.anonyname),
        String(record.rb_id),
        String(record.category)
      );

      console.log("📨 Full report submitted to Fabric:", record);
      res.json({ message: "✅ Crime reported successfully" });
      gateway.disconnect();
    } catch (fabricError) {
      console.error("❌ Fabric submit error:", fabricError.message);
      res.status(500).json({ error: "Failed to submit to Fabric" });
    }
  } catch (error) {
    console.error("❌ Outer error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/reports", async (req, res) => {
  console.log("🔍 /reports endpoint hit");

  // Extract userIdentity from the query params or session
  const userIdentity = req.query.userIdentity || req.session.userIdentity;

  if (!userIdentity) {
    return res.status(400).json({ error: "userIdentity is required" });
  }

  // Modify the query to filter by userIdentity
  const query =
    "SELECT crime_id, anonyname, description, status FROM crime_reports WHERE rb_id IN (SELECT id FROM registeredUser WHERE barangay = ?) ORDER BY crime_id DESC";

  // Execute the query with userIdentity as a parameter
  mysqlConnection.query(query, [userIdentity], (err, results) => {
    if (err) {
      console.error("❌ MySQL fetch error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ message: "No reports found for the given userIdentity." });
    }

    const reports = results.map((r) => ({
      crime_id: r.crime_id,
      name: r.anonyname,
      description: r.description,
      status: r.status,
      type: "text",
    }));

    res.json(reports);
  });
});

app.get("/crime/:id", async (req, res) => {
  const crimeId = req.params.id;
  console.log(`Fetching crime report for ID: ${crimeId}`); // Log the ID being queried

  try {
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const gateway = new Gateway();
    await gateway.connect(JSON.parse(fs.readFileSync(ccpPath, "utf8")), {
      wallet,
      identity: "appUser",
      discovery: { enabled: true, asLocalhost: true },
    });

    const network = await gateway.getNetwork("mychannel");
    const contract = network.getContract("app");

    const result = await contract.evaluateTransaction("readCrime", crimeId);

    if (result) {
      console.log(`Crime data found: ${result.toString()}`); // Log the result for debugging
      res.json({
        crimeId,
        data: result.toString(),
        message:
          "This data is retrieved from the blockchain and must be verified against the source system for accuracy and consistency.",
      });
    } else {
      console.error(`No data found for Crime ID: ${crimeId}`); // Log if no result is found
      res
        .status(404)
        .json({ error: `Crime report not found for ID: ${crimeId}` });
    }

    gateway.disconnect();
  } catch (error) {
    console.error(`Error fetching crime record: ${error.message}`);
    res.status(500).json({
      error:
        "An error occurred while fetching the crime record: " + error.message,
    });
  }
});

// GET route to fetch all crime reports from the blockchain
app.get("/blockchain/reports", async (req, res) => {

  // Fetch user identity or default to 'org1-admin'
  const userIdentity = req.query.userIdentity || "org1-admin";
  console.log(`Checking identity for: ${userIdentity}`);

  // Fetch pagination keys (startKey, endKey)
  const startKey = req.query.startKey || "0"; // Default to '0' if not provided
  const endKey = req.query.endKey || "999"; // Default to '999' if not provided

  try {
    const orgMSP = userIdentity === "Mahay" ? "Org1MSP" : "Org2MSP";
    const gatewayResponse = await connectToFabric(userIdentity, orgMSP);
    if (!gatewayResponse.success) {
      return res.status(500).json({ error: "Failed to connect to Fabric" });
    }

    const gateway = gatewayResponse.gateway;
    const network = await gateway.getNetwork("mychannel");
    const contract = network.getContract("app");

    // Call the Fabric method to fetch crime reports with startKey and endKey for pagination
    const result = await contract.evaluateTransaction(
      "getAllCrimes",
      startKey,
      endKey
    );

    if (!result || result.length === 0) {
      console.log("❌ No crime reports found on the blockchain.");
      return res.status(404).json({ error: "No crime reports found" });
    }

    const parsed = JSON.parse(result.toString()); // Convert result to JSON
    res.json(parsed); // Send the crime reports to the client

    await gateway.disconnect(); // Disconnect from Fabric after processing
  } catch (error) {
    console.error("❌ Error retrieving data from blockchain:", error.message);
    res.status(500).json({
      error: "Failed to fetch from blockchain",
      details: error.message,
    });
  }
});


// ✅ Counting tanods on each assignment
app.get("/assignments/count", (req, res) => {
  const query = `
    SELECT tanod_id, assigned_to, COUNT(*) AS count
    FROM assignments
    GROUP BY tanod_id, assigned_to
  `;

  mysqlConnection.query(query, (err, results) => {
    if (err) {
      console.error("❌ Error fetching assignment counts:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results); // Sends the count along with tanod_id and tanod_name
  });
});

// ✅ Assign Tanod to Crime Report
app.post("/assign", async (req, res) => {
  const { crimeId, tanodId } = req.body;

  if (!crimeId || !tanodId) {
    return res.status(400).json({ error: "crimeId and tanodId are required" });
  }
  console.log(`Assigning Tanod ID ${tanodId} to Crime ID ${crimeId}`);

  mysqlConnection.query(
    "SELECT t.username, c.description, c.status, c.category, c.date FROM tanod_users t JOIN crime_reports c ON c.crime_id = ? WHERE t.id = ?",
    [crimeId, tanodId],
    (err, result) => {
      if (err || result.length === 0) {
        console.error("Tanod fetch error:", err);
        return res
          .status(500)
          .json({ error: "Tanod or Crime Report not found" });
      }

      const tanodUsername = result[0].username;
      const status = result[0].status;
      const crimeDescription = result[0].description;
      const category = result[0].category;
      const reportedDate = result[0].date;

      // Check if the crime has already been assigned to the tanod
      mysqlConnection.query(
        "SELECT * FROM assignments WHERE crime_id = ? AND tanod_id = ?",
        [crimeId, tanodId],
        (checkErr, checkResult) => {
          if (checkErr) {
            console.error("Check assignment error:", checkErr);
            return res.status(500).json({ error: "Error checking assignment" });
          }

          if (checkResult.length > 0) {
            // If already assigned, return an error
            return res.status(400).json({
              error:
                "This crime report has already been assigned to this tanod",
            });
          }

          // Proceed to insert the assignment into the assignments table
          mysqlConnection.query(
            "INSERT INTO assignments (crime_id, tanod_id, assigned_to, assignReport, status, category, date, assigned) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [
              crimeId,
              tanodId,
              tanodUsername,
              crimeDescription,
              status,
              category,
              reportedDate,
              true, // Set assigned to true
            ],
            (insertErr) => {
              if (insertErr) {
                console.error("Insert error:", insertErr);
                return res.status(500).json({ error: "Insert failed" });
              }

              // Return the success response with the tanod's name and message
              res.json({
                message: "Tanod assigned",
                tanodAssignedTo: tanodUsername,
              });
            }
          );
        }
      );
    }
  );
});

// Check if a tanod is already assigned to the report (crime_id)
app.get("/check-assignment", (req, res) => {
  const { crimeId, tanodId } = req.query;

  // Query the assignments table
  const query = "SELECT * FROM assignments WHERE crime_id = ? AND tanod_id = ?";
  mysqlConnection.query(query, [crimeId, tanodId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: "Error checking assignment" });
    }
    if (result.length > 0) {
      return res.status(200).json({ assigned: true });
    } else {
      return res.status(200).json({ assigned: false });
    }
  });
});
// ✅ Get all assignments
app.get("/assignments", (req, res) => {
  const query = `
    SELECT *
    FROM assignments 
  `;

  mysqlConnection.query(query, (err, results) => {
    if (err) {
      console.error("Fetch assignments failed:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results); // Send the list of assignments
  });
});

// ✅ Get all assignments for a specific Tanod
app.get("/assign", (req, res) => {
  const username = req.query.user;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  mysqlConnection.query(
    "SELECT * FROM assignments WHERE assigned_to = ?",
    [username],
    (err, results) => {
      if (err) {
        console.error("Fetch assignments failed:", err);
        return res.status(500).json({ error: "Database error" });
      }

      res.json(results);
    }
  );
});

// ✅ Serve server.html at root
app.get("/barangay", (req, res) => {
  res.sendFile(path.join(__dirname, "UI", "dist", "index.html"));
});

http.createServer(app).listen(3000, () => {
  console.log("HTTP Server running on http://localhost:3000");
});

// HTTPS Server
/* const sslServer = https.createServer(
  {
    key: fs.readFileSync("../ssl/key.pem", "utf8"),
    cert: fs.readFileSync("../ssl/cert.pem", "utf8"),
  },
  app
); */

/*sslServer.listen(3001, () => {
  console.log("HTTPS Server running on https://localhost:3001");
});*/

// ✅ Tanod Login/Register
app.post("/register", (req, res) => {
  let { username, password } = req.body;

  // Basic presence check
  if (!username || !password) {
    return res.json({ error: "Username and password required" });
  }

  // Sanitize inputs
  username = validator.trim(username);
  password = validator.trim(password);

  // Validate format
  if (!validator.isAlphanumeric(username)) {
    return res.json({ error: "Username must be alphanumeric" });
  }

  if (!validator.isLength(password, { min: 6, max: 50 })) {
    return res.json({ error: "Password must be 6 to 50 characters" });
  }

  const checkQuery = "SELECT * FROM tanod_users WHERE username = ?";
  mysqlConnection.query(checkQuery, [username], (err, results) => {
    if (err) return res.json({ error: "Database error" });
    if (results.length > 0) {
      return res.json({ error: "Username already taken" });
    }

    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return res.json({ error: "Hashing error" });

      const insertQuery =
        "INSERT INTO tanod_users (username, password) VALUES (?, ?)";
      mysqlConnection.query(insertQuery, [username, hash], (err) => {
        if (err) return res.json({ error: "Database error" });
        res.json({ message: "User registered successfully" });
      });
    });
  });
});

// Login endpoint
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.json({ error: "Username and password required" });
  }

  const findUserQuery = "SELECT * FROM tanod_users WHERE username = ?";
  mysqlConnection.query(findUserQuery, [username], (err, results) => {
    if (err) return res.json({ error: "Database error" });
    if (results.length === 0) {
      return res.json({ error: "User not found" });
    }

    const user = results[0];
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) return res.json({ error: "Error during authentication" });
      if (result) {
        res.json({ message: "Login successful" });
      } else {
        res.json({ error: "Invalid password" });
      }
    });
  });
});

// Get all registered tanods
app.get("/tanods", (req, res) => {
  const query = "SELECT id, username FROM tanod_users"; // Adjust columns as needed
  mysqlConnection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching tanods:", err.message);
      return res.status(500).json({ error: "Failed to fetch tanods" });
    }
    res.json(results);
  });
});
