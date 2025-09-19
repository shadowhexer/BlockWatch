import { createHelia } from "helia";
import { dagJson } from "@helia/dag-json";
import fs from "fs";
import { CID } from "multiformats/cid";

// Initialize Helia and DAG-JSON
const helia = await createHelia();
const d = dagJson(helia);

// Function to upload files and return CIDs
async function uploadFiles(filePaths) {
  let fileLinks = [];

  for (let i = 0; i < filePaths.length; i++) {
    try {
      const buffer = fs.readFileSync(filePaths[i]);
      const fileObject = { file: buffer };

      // Upload file to Helia (DAG-JSON)
      const fileCID = await d.add(fileObject);
      console.log(`File uploaded with CID: ${fileCID.toString()}`);
      fileLinks.push(fileCID.toString());
    } catch (err) {
      console.error(`Error uploading file ${filePaths[i]}:`, err);
    }
  }

  return fileLinks;
}

// Function to retrieve metadata using a CID and write it to a file
async function retrieveMetadata(cidStr, outputFilePath) {
  try {
    // Parse the CID
    const cid = CID.parse(cidStr);

    // Retrieve metadata from Helia (DAG-JSON)
    const metadata = await d.get(cid);
    console.log("Retrieved metadata:", metadata);

    // Write the file data to a specified output file
    fs.writeFileSync(outputFilePath, metadata.file);
    console.log(`File saved to: ${outputFilePath}`);
  } catch (err) {
    console.error("Error retrieving metadata:", err);
  }
}
  
// export { uploadFiles, retrieveMetadata };
// Example of how to use these functions

// 1. Upload files and get their CIDs
/*const filePaths = [
  "/home/nikohackto/FinalCapstone/backend/image2.jpg",
  "/home/nikohackto/FinalCapstone/backend/image3.jpg",
];
const fileLinks = await uploadFiles(filePaths);
console.log("All file links (CIDs):", fileLinks);

// 2. Retrieve metadata for a specific file (e.g., the second file)
const cidToRetrieve = fileLinks[1]; // Example: Retrieve the second file's metadata
await retrieveMetadata(cidToRetrieve, "retrievedFile.jpg");*/

export { uploadFiles, retrieveMetadata };
