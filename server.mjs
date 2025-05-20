import express from 'express';
import cors from 'cors';
import multer from 'multer';
import axios from 'axios';
import fs from 'fs';
import { createRequire } from 'module';
import { ethers } from 'ethers';

const require = createRequire(import.meta.url);
const contractJSON = require('./build/contracts/ResearchPortal.json');

// ENV SETUP
const PINATA_API_KEY = "43d4fd26e35a9204976d";
const PINATA_SECRET_API_KEY = "999507de392373ab91424be7ce0f9500ea66af3eb6439b099689c48ce52fd2ca";
const contractAddress = "0x059fBA0A84E0F5Fe12fA401D626502C8602Cf46F"; // 👈 your deployed address
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545"); // Ganache
const signer = provider.getSigner(0); // First Ganache account
const contract = new ethers.Contract(contractAddress, contractJSON.abi, signer);

// EXPRESS SETUP
const app = express();
app.use(cors());
app.use(express.json());
const upload = multer({ dest: 'uploads/' });

// === 1. Upload to Pinata (IPFS) ===
app.post('/upload', upload.single('file'), async (req, res) => {
  const fileStream = fs.createReadStream(req.file.path);

  try {
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      fileStream,
      {
        maxBodyLength: "Infinity",
        headers: {
          "Content-Type": "multipart/form-data",
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_API_KEY,
        },
      }
    );

    const ipfsHash = response.data.IpfsHash;
    fs.unlinkSync(req.file.path); // delete temp file
    res.json({ hash: ipfsHash });
  } catch (err) {
    console.error("Pinata Upload Error:", err.message);
    res.status(500).json({ message: "Upload to IPFS via Pinata failed" });
  }
});

// === 2. Store on Blockchain ===
app.post('/blockchain', async (req, res) => {
  const { title, hash } = req.body;
  try {
    const tx = await contract.submitPaper(title, hash);
    await tx.wait();
    res.json({ success: true, txHash: tx.hash });
  } catch (err) {
    console.error("Blockchain Error:", err.message);
    res.status(500).json({ message: "Smart contract interaction failed" });
  }
});

app.listen(4000, () => console.log("✅ Server running at http://localhost:4000"));
