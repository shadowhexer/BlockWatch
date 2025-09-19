// Define __dirname in ES Modules
const __dirname = path.dirname(new URL(import.meta.url).pathname);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = file.mimetype.startsWith("image/")
      ? "./uploads/images"
      : "./uploads/videos";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fileName = Date.now() + path.extname(file.originalname);
    cb(null, fileName);
  },
});

const uploads = multer({ storage: storage });

// Store uploaded files' paths for later deletion
let uploadedFiles = {};

// POST route to report a crime and upload files to IPFS
app.post("/report", uploads.array("file[]"), async (req, res) => {
  const { description, anonyname, userIdentity } = req.body;
  const status = req.body.status || "unread";
  const date = new Date().toISOString().slice(0, 19).replace("T", " "); // 'YYYY-MM-DD HH:MM:SS'

  // Validate required fields
  if (!description || !date || !status || !anonyname || !userIdentity) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Generate hash for the crime data (replace with your actual hashing method)
    const dataHash = generateHash(description, date, status);

    // Retrieve user identity from the database
    const [identityResult] = await mysqlConnection
      .promise()
      .query("SELECT id FROM registeredUser WHERE barangay = ?", [
        userIdentity,
      ]);

    if (identityResult.length === 0) {
      return res.status(404).json({ error: "User identity not found" });
    }

    const identity = identityResult[0].id; // Get user ID from the result

    // Classify the crime based on the description (replace with your actual classification logic)
    const crimeCategory = classifyCrime({ description });

    // Handle multiple file uploads and get their links (assuming uploadFiles returns an array of URLs or CIDs)
    let mediaLinks = await uploadFiles(
      req.files.map((file) => file.path) // Get file paths from req.files
    );
    console.log("Media Links:", mediaLinks); // Debug: Check uploaded file links

    // Store the file path for later deletion
    req.files.forEach((file) => {
      uploadedFiles[file.filename] = path.join(
        __dirname,
        "uploads",
        file.mimetype.startsWith("image/") ? "images" : "videos",
        file.filename
      );
    });

    // Join the array of CIDs into a single comma-separated string
    const mediaLink = mediaLinks.length > 0 ? mediaLinks.join(",") : null;

    // Log the final mediaLink to store (as a single string)
    console.log("Final Media Link to store:", mediaLink);

    // Insert the report data into MySQL
    const [insertResult] = await mysqlConnection
      .promise()
      .query(
        "INSERT INTO crime_reports (description, date, status, data_hash, anonyname, rb_id, category) VALUES (?, ?, ?, ?, ?, ?, ?)",
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

    // Retrieve the full report data from MySQL
    const [rows] = await mysqlConnection
      .promise()
      .query("SELECT * FROM crime_reports WHERE crime_id = ?", [insertedId]);

    const record = rows[0]; // Full report record

    console.log("MySQL: report record:", record);

    if (!userIdentity) {
      return res
        .status(400)
        .json({ error: "User identity is not found in the session" });
    }

    try {
      // Connect to Fabric using the user identity and organization
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

      // Send the full report data to Fabric
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
