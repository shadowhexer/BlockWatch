import { createHelia } from "helia";
import { dagJson } from "@helia/dag-json";
import fs from "fs";
import { CID } from "multiformats/cid";

// Initialize Helia and DAG-JSON
const helia = await createHelia();
const d = dagJson(helia);

// Function to retrieve metadata using a CID and write it to a file
async function retrieveMetadata(cidStr, outputFilePath) {
  try {
    const cid = CID.parse(cidStr.trim());  // Ensure CID is trimmed of extra spaces

    // Retrieve metadata from Helia (DAG-JSON)
    const metadata = await d.get(cid);
    
    if (metadata) {
      console.log("Retrieved metadata:", metadata);

      // Save the file data to the specified output file
      fs.writeFileSync(outputFilePath, metadata.file);
      console.log(`File saved to: ${outputFilePath}`);
    } else {
      console.log("No metadata found for this CID");
    }
  } catch (err) {
    console.error("Error retrieving metadata:", err);
  }
}

// CID that was previously uploaded
const cidToRetrieve = 'baguqeerazfonhovtkqkqaynmguvjq75dgy732mywhmu4ew2t2av226s4fupa';
await retrieveMetadata(cidToRetrieve, 'retrievedFile.jpg');
