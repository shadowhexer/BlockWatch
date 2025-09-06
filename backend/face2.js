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
        record.crime_id,
        record.description,
        record.date,
        record.status,
        record.data_hash,
        record.anonyname,
        record.rb_id,
        record.category
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
